// What the editor asks of GitHub, through the Worker (packages/editor/src/github.ts): the browser never has the token
// (packages/editor/worker/session.js), so every request to GitHub goes from here with it. The site's files come through the cache in
// R2 (packages/editor/worker/files.js), and only to a sign-in GitHub says may read the repository (`access`, ten minutes).
//   GET  /api/github/head          the branch's commit and root tree (always from GitHub)
//   POST /api/github/files         { tree?, folders?, depth?, paths? }: the files in folders (`depth` levels down) and at
//                                  paths, at a root tree, or at the branch's head
//   POST /api/github/trees         { at: [{ root, path }] }: the folders at paths under root trees, with their entries
//   POST /api/github/texts         { oids }: files' texts by their blob ids (at most 100)
//   GET  /api/github/blob/<oid>    a file's bytes; ?repo=<owner>/<name> from another repository (the store), not cached
//   POST /api/github/commit        { message, changes: [{ path, content (base64) | null, oid | null }] }: one commit,
//                                  refused (409) when a file was changed or created elsewhere since the editor loaded it
//   POST /api/github/graphql       any other question to GitHub's GraphQL API (who is signed in, the history, the
//                                  store): only questions, never a change
//   POST /api/github/logout        "Log ud": the cookie goes, and GitHub forgets the token
import { config } from '@site/config';
import { access, forget, noSession, sessionToken } from './session.js';
import { filesOf, GitHubError } from './files.js';
import { json } from './not-found.js';

const OID = /^[0-9a-f]{40}([0-9a-f]{24})?$/;
const isOid = (s) => typeof s === 'string' && OID.test(s);
const isPath = (s) => typeof s === 'string' && s.length > 0 && s.length <= 1000 && !s.startsWith('/') && !s.split('/').includes('..');

export async function handleGitHub(request, env, ctx) {
  const route = new URL(request.url).pathname.slice('/api/github/'.length);
  const method = request.method;
  if (route === 'logout' && method === 'POST') return logout(request, env, ctx);
  const token = sessionToken(request);
  if (!token) return json({ error: 'signed out' }, 401);
  const files = filesOf(env, token, ctx);
  try {
    // The site's own files and GraphQL: only to someone GitHub says may save to the repository.
    const may = await access(request, files.ask);
    if (!may) return json({ error: 'signed out' }, 401);
    if (!may.push) return json({ error: 'forbidden' }, 403);
    if (route === 'graphql' && method === 'POST') return await question(request, files);
    if (route === 'head' && method === 'GET') return json(await files.head());
    if (route.startsWith('blob/') && method === 'GET') return await blob(request, route.slice('blob/'.length), files);
    if (method !== 'POST') return json({ error: 'method' }, 405);
    const body = await request.json().catch(() => ({}));
    if (route === 'files') return await listed(body, files);
    if (route === 'trees') return await folders(body, files);
    if (route === 'texts') return await texts(body, files);
    if (route === 'commit') return await commit(body, files);
    return json({ error: 'not found' }, 404);
  } catch (e) {
    if (e instanceof GitHubError) return json({ error: e.message || undefined, status: e.status }, e.status === 401 ? 401 : 502);
    throw e;
  } finally {
    await files.finish(route.replace(/\/.*/, ''));
  }
}

// A question to GitHub's GraphQL API as it is, and GitHub's answer. A change (a mutation) only goes through `commit`.
async function question(request, files) {
  const body = await request.text();
  let query;
  try {
    ({ query } = JSON.parse(body));
  } catch {}
  if (typeof query !== 'string' || /\b(mutation|subscription)\b/.test(withoutStrings(query))) return json({ error: 'only questions' }, 400);
  const res = await files.ask('https://api.github.com/graphql', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  return new Response(res.body, { status: res.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}

// GraphQL without its strings and comments, where a file's name could say anything.
const withoutStrings = (query) => query.replace(/"""[\s\S]*?"""|"(?:\\.|[^"\\])*"|#[^\n]*/g, '""');

async function listed({ tree, folders = [], depth = 3, paths = [] }, files) {
  if (
    (tree !== undefined && !isOid(tree)) ||
    !Array.isArray(folders) ||
    !folders.every(isPath) ||
    !Array.isArray(paths) ||
    !paths.every(isPath) ||
    !Number.isInteger(depth) ||
    depth < 1 ||
    depth > 20
  )
    return json({ error: 'request' }, 400);
  const at = tree ? { tree } : await files.head();
  const [lists, entries] = await Promise.all([files.filesIn(at.tree, folders, depth), files.entriesAt(at.tree, paths)]);
  return json({
    ...at,
    folders: lists,
    // At a path: a file, or anything else git has there (a folder), whose text is never asked.
    paths: entries.map((e, i) => e && { path: paths[i], oid: e.oid, binary: e.type !== 'blob' || e.binary === true }),
  });
}

async function folders({ at }, files) {
  if (!Array.isArray(at) || at.length > 200 || !at.every((a) => isOid(a?.root) && (a.path === '' || isPath(a.path))))
    return json({ error: 'request' }, 400);
  const oids = await files.foldersAt(at);
  const trees = await files.treesOf(oids.filter(Boolean));
  return json({
    trees: oids.map((oid) => {
      const entries = oid && trees.get(oid);
      return entries ? { oid, entries: entries.map((e) => ({ name: e.name, oid: e.oid, type: e.type, binary: e.binary === true })) } : null;
    }),
  });
}

async function texts({ oids }, files) {
  if (!Array.isArray(oids) || oids.length > 100 || !oids.every(isOid)) return json({ error: 'request' }, 400);
  const found = await files.texts(oids);
  return json({ texts: Object.fromEntries([...found].filter(([, text]) => text !== undefined)) });
}

async function blob(request, oid, files) {
  const repo = new URL(request.url).searchParams.get('repo')?.split('/');
  if (!isOid(oid) || (repo && (repo.length !== 2 || !repo.every((p) => /^[\w.-]+$/.test(p))))) return json({ error: 'request' }, 400);
  const bytes = await files.bytes(oid, repo ? { owner: repo[0], name: repo[1] } : config.repo);
  if (!bytes) return json({ error: 'not found' }, 404);
  // A blob id's bytes never change.
  return new Response(bytes, {
    headers: { 'content-type': 'application/octet-stream', 'cache-control': 'private, max-age=31536000, immutable' },
  });
}

async function commit({ message, changes }, files) {
  if (
    typeof message !== 'string' ||
    !message ||
    !Array.isArray(changes) ||
    !changes.length ||
    !changes.every((c) => isPath(c?.path) && (c.content === null || typeof c.content === 'string') && (c.oid === null || isOid(c.oid)))
  )
    return json({ error: 'request' }, 400);
  // The branch's commit, then the files in that same commit, so a push in between cannot slip past the check (the
  // commit is refused unless the branch is still at this commit).
  const at = await files.head();
  const now = await files.entriesAt(
    at.tree,
    changes.map((c) => c.path),
  );
  const conflict = changes.findIndex((c, i) => (now[i]?.oid ?? null) !== c.oid);
  if (conflict >= 0) return json({ conflict: changes[conflict].oid ? 'changed' : 'exists' }, 409);
  return json(
    await files.save(
      at,
      message,
      changes.map((c) => ({ path: c.path, contents: c.content })),
    ),
  );
}

async function logout(request, env, ctx) {
  const token = sessionToken(request);
  if (token) {
    await forget(token);
    // GitHub forgets the token too, so it is no good to anyone after "Log ud".
    if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
      ctx.waitUntil(
        fetch(`https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/token`, {
          method: 'DELETE',
          headers: {
            authorization: `Basic ${btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`)}`,
            accept: 'application/vnd.github+json',
            'user-agent': `${config.repo.name}-worker`,
          },
          body: JSON.stringify({ access_token: token }),
        }).catch(() => {}),
      );
  }
  return new Response(null, { status: 204, headers: { 'set-cookie': noSession(), 'cache-control': 'no-store' } });
}
