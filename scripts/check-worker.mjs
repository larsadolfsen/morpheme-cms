// Checks what the editor asks of GitHub through the site's Worker, and the Worker's cache of the site's files in R2
// (packages/editor/worker/files.js, packages/editor/worker/editor-github.js, packages/editor/src/github.ts): the editor's own github.ts asks the Worker's
// own code, which asks a GitHub played by git in a repository made for the check from this one's files (each answer
// as GitHub's GraphQL and REST APIs give it), with R2 in memory. With the cache, without it (no binding FILES) and
// with an R2 that fails, the editor must get exactly the files git has, save, see the versions and the deleted files
// and restore them; with the cache, an opening after a save may ask GitHub for nothing but the branch's head, and
// everything in R2 must give its git id. /api/r2 and /api/plan must say what Cloudflare says. Nothing goes to GitHub or Cloudflare. Run: npm run check:worker
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { workerModules } from './worker-modules.mjs';
import { config } from '../site/siteConfig.mjs';
import { blobId, treeId } from '../lib/git.mjs';
import { ownRepoEnv } from './git-env.mjs';

const ROOT = `${process.cwd()}/`;
// The editor's own code (this package's src/).
const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const WORK = mkdtempSync(join(tmpdir(), 'check-worker-'));
// The editor's r2Caching.ts, built as the browser gets it (Node does not run TypeScript in node_modules).
await build({
  entryPoints: [join(SRC, 'r2Caching.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  outfile: join(WORK, 'r2Caching.mjs'),
  logLevel: 'silent',
});
const { bucketOf, jurisdictionOf, r2CachingOn, withJurisdiction, withR2Caching } = await import(
  pathToFileURL(join(WORK, 'r2Caching.mjs')).href
);
const REPO = join(WORK, 'repo');
const { owner, name, branch } = config.repo;
const problems = [];
const expect = (ok, what) => ok || problems.push(what);

// ---------------------------------------------------------------------------------------------------
// The repository: this one's files at HEAD, in one commit (git's own variables left out, so it is this one's, also in
// the pre-push hook).
const git = (args, input, env = {}) =>
  execFileSync('git', args, {
    cwd: REPO,
    input,
    maxBuffer: 1 << 30,
    env: {
      ...ownRepoEnv(),
      ...env,
      GIT_AUTHOR_NAME: 'Anna',
      GIT_AUTHOR_EMAIL: 'anna@example.com',
      GIT_COMMITTER_NAME: 'Anna',
      GIT_COMMITTER_EMAIL: 'anna@example.com',
    },
  });
const out = (...args) => git(args).toString().trim();
execFileSync('git', ['init', '-q', '-b', branch, REPO], { env: ownRepoEnv() });
const tarball = join(REPO, '.git', 'head.tar');
execFileSync('git', ['-C', ROOT, 'archive', '-o', tarball, 'HEAD']);
// From inside the folder, by a relative path: GNU tar (Git's on Windows) reads C:\… as a remote host's file.
execFileSync('tar', ['-x', '-f', join('.git', 'head.tar')], { cwd: REPO });
rmSync(tarball);
git(['add', '-A']);
git(['commit', '-q', '-m', 'Start']);

// ---------------------------------------------------------------------------------------------------
// GitHub, played by git. Objects never change, so what git said about one is kept.
let asked = 0;
// All of git's objects (type and bytes) by their ids, read in one go; one made since, when it is asked for.
let objects = null;
function all() {
  if (objects) return objects;
  objects = new Map();
  const dump = git(['cat-file', '--batch-all-objects', '--batch']);
  for (let at = 0; at < dump.length;) {
    const end = dump.indexOf(10, at);
    const [oid, type, size] = dump.subarray(at, end).toString().split(' ');
    objects.set(oid, { type, bytes: new Uint8Array(dump.subarray(end + 1, end + 1 + Number(size))) });
    at = end + 1 + Number(size) + 1;
  }
  return objects;
}
function objectOf(oid) {
  if (!all().has(oid)) {
    try {
      const type = out('cat-file', '-t', oid);
      objects.set(oid, { type, bytes: new Uint8Array(git(['cat-file', type, oid])) });
    } catch {
      return null;
    }
  }
  return objects.get(oid);
}
const kindOf = (oid) => objectOf(oid)?.type ?? null;
const bytesOf = (oid) => objectOf(oid).bytes;
// Git's rule (and GitHub's, for these files): binary when the first 8000 bytes have a zero byte.
const isBinary = (oid) => bytesOf(oid).subarray(0, 8000).includes(0);
// GitHub gives only part of a big file's text; this one plays that part.
const TRUNCATED = 'src/data/menu.json';
const truncated = new Set([out('rev-parse', `HEAD:${TRUNCATED}`)]);
const blobOf = (oid) =>
  isBinary(oid)
    ? { text: null, isBinary: true, isTruncated: false }
    : truncated.has(oid)
      ? { text: new TextDecoder().decode(bytesOf(oid)).slice(0, 20), isBinary: false, isTruncated: true }
      : { text: new TextDecoder().decode(bytesOf(oid)), isBinary: false, isTruncated: false };
// A tree's entries: "<mode> <name>\0" and the 20 bytes of the id, each.
function entriesOf(oid) {
  const bytes = bytesOf(oid);
  const entries = [];
  for (let at = 0; at < bytes.length;) {
    const space = bytes.indexOf(32, at);
    const zero = bytes.indexOf(0, space);
    const mode = parseInt(new TextDecoder().decode(bytes.subarray(at, space)), 8);
    const entryOid = Buffer.from(bytes.subarray(zero + 1, zero + 21)).toString('hex');
    const type = mode === 0o40000 ? 'tree' : mode === 0o160000 ? 'commit' : 'blob';
    const entryName = new TextDecoder().decode(bytes.subarray(space + 1, zero));
    entries.push({ name: entryName, oid: entryOid, mode, type, object: type === 'blob' ? { isBinary: isBinary(entryOid) } : {} });
    at = zero + 21;
  }
  // Not in git's order, as GitHub may give them: the Worker sorts them itself.
  return entries.reverse();
}
// A commit's root tree: the first line of the commit, "tree <oid>".
const treeOfCommit = (commit) => new TextDecoder().decode(bytesOf(commit).subarray(5, 45));
const head = () => readFileSync(join(REPO, '.git/refs/heads', branch), 'utf8').trim();
function historyOf(path, first, after = 0) {
  const lines = out('log', '--format=%H%x00%T%x00%P%x00%cI%x00%an', `-n${first + 1}`, `--skip=${after}`, head(), '--', path)
    .split('\n')
    .filter(Boolean);
  const nodes = lines.slice(0, first).map((line) => {
    const [oid, tree, parents, date, author] = line.split('\0');
    const parent = parents.split(' ')[0];
    return {
      oid,
      tree: { oid: tree },
      committedDate: date,
      author: { name: author, user: { name: author, login: 'anna' } },
      parents: { nodes: parent ? [{ oid: parent, tree: { oid: treeOfCommit(parent) } }] : [] },
    };
  });
  return { nodes, pageInfo: { hasNextPage: lines.length > first, endCursor: String(after + nodes.length) } };
}
const pathAt = (expression) => {
  const [ref, ...rest] = expression.split(':');
  try {
    return out('rev-parse', `${ref === branch ? head() : ref}:${rest.join(':')}`);
  } catch {
    return null;
  }
};
const unquote = (s) => JSON.parse(s);

function graphql({ query, variables = {} }) {
  if (query.includes('createCommitOnBranch')) return commitOnBranch(query, variables.input);
  const repository = {};
  const data = { repository };
  if (/\bviewer\s*\{/.test(query)) {
    data.viewer = { login: 'anna', name: 'Anna' };
    repository.viewerPermission = 'ADMIN';
  }
  if (query.includes('ref(qualifiedName')) {
    const commit = head();
    const target = { oid: commit, tree: { oid: treeOfCommit(commit) } };
    for (const [, alias, first, path, after] of query.matchAll(
      /(?:(f\d+): )?history\(first: (\d+), path: ("(?:[^"\\]|\\.)*"|\$path)(, after: \$after)?\)/g,
    )) {
      const found = historyOf(path === '$path' ? variables.path : unquote(path), Number(first), after ? Number(variables.after ?? 0) : 0);
      target[alias ?? 'history'] = found;
    }
    repository.ref = { target };
  }
  if (query.includes('object(oid: $oid)'))
    repository.object = kindOf(variables.oid) === 'commit' ? { tree: { oid: treeOfCommit(variables.oid) } } : null;
  for (const [, alias, oid] of query.matchAll(/(\w+): object\(oid: ("[0-9a-f]+")\)/g)) {
    const kind = kindOf(unquote(oid));
    repository[alias] = kind === 'tree' ? { entries: entriesOf(unquote(oid)) } : kind === 'blob' ? blobOf(unquote(oid)) : kind ? {} : null;
  }
  for (const [, alias, expression] of query.matchAll(/(\w+): object\(expression: ("(?:[^"\\]|\\.)*")\)/g)) {
    const oid = pathAt(unquote(expression));
    repository[alias] = oid && { oid, ...(kindOf(oid) === 'blob' ? blobOf(oid) : {}) };
  }
  return { data };
}

function commitOnBranch(query, input) {
  if (input.expectedHeadOid !== head()) return { errors: [{ message: 'Expected branch to point to another commit' }] };
  const index = join(WORK, 'index');
  rmSync(index, { force: true });
  const env = { GIT_INDEX_FILE: index };
  git(['read-tree', head()], undefined, env);
  for (const { path, contents: base64 } of input.fileChanges.additions ?? []) {
    const oid = git(['hash-object', '-w', '--stdin'], Buffer.from(base64, 'base64')).toString().trim();
    const was = git(['ls-tree', head(), '--', path]).toString().split(' ')[0];
    git(['update-index', '--add', '--cacheinfo', `${was || '100644'},${oid},${path}`], undefined, env);
  }
  for (const { path } of input.fileChanges.deletions ?? []) git(['update-index', '--force-remove', path], undefined, env);
  const tree = git(['write-tree'], undefined, env).toString().trim();
  const commit = git(['commit-tree', tree, '-p', head(), '-m', input.message.headline]).toString().trim();
  git(['update-ref', `refs/heads/${branch}`, commit, input.expectedHeadOid]);
  const done = { oid: commit, tree: { oid: tree } };
  for (const [, alias, path] of query.matchAll(/(f\d+): file\(path: ("(?:[^"\\]|\\.)*")\)/g)) {
    const oid = out('rev-parse', `${commit}:${unquote(path)}`);
    done[alias] = { oid, object: { isBinary: isBinary(oid) } };
  }
  return { data: { createCommitOnBranch: { commit: done } } };
}

// The requests GitHub got, and what they were for.
const requests = [];
// Cloudflare's API, for /api/r2: its answer about the bucket ([status, body]), the jurisdiction it is kept within (asked
// outside it, Cloudflare has no such bucket), and the Worker's settings asked with.
let cloudflare = [500, {}];
let cloudflareJurisdiction = null;
let r2Env = {};
// Cloudflare's answer about the account's subscriptions, for /api/plan ([status, body]).
let subscriptions = [500, {}];
async function github(url, init) {
  asked++;
  requests.push(`${url} ${init.body ?? ''}`);
  const path = new URL(url).pathname;
  if (path === '/graphql') return Response.json(graphql(JSON.parse(init.body)));
  if (path === `/repos/${owner}/${name}`) return Response.json({ permissions: { pull: true, push: true } });
  const blob = path.match(new RegExp(`^/repos/${owner}/${name}/git/blobs/([0-9a-f]+)$`))?.[1];
  if (blob) return kindOf(blob) === 'blob' ? new Response(bytesOf(blob)) : Response.json({ message: 'Not Found' }, { status: 404 });
  if (path.startsWith('/applications/')) return new Response(null, { status: 204 });
  throw new Error(`GitHub: ${path}`);
}

// ---------------------------------------------------------------------------------------------------
// The Worker, with R2 in memory (or none, or one that fails), and the editor's github.ts in a "browser" whose
// requests to /api/github/ go to it, signed in.
const [
  { handleGitHub },
  { readFiles, commitFiles },
  { handleR2 },
  { handlePlan, paidFrom },
  { publishScheduled },
  { handleAutosave, sweepAutosaves },
] = await workerModules('editor-github.js', 'github.js', 'r2-status.js', 'plan-status.js', 'publish.js', 'autosave.js');

function memoryBucket() {
  const objects = new Map();
  const puts = new Map();
  return {
    objects,
    puts,
    async get(key) {
      const value = objects.get(key);
      return value ? { arrayBuffer: async () => value.slice().buffer } : null;
    },
    async head(key) {
      return objects.has(key) ? {} : null;
    },
    async delete(key) {
      objects.delete(key);
    },
    async list({ prefix = '' } = {}) {
      const keys = [...objects.keys()].filter((k) => k.startsWith(prefix));
      return { objects: keys.map((key) => ({ key, size: objects.get(key).length, uploaded: new Date() })), truncated: false };
    },
    async put(key, value) {
      puts.set(key, (puts.get(key) ?? 0) + 1);
      objects.set(key, typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value));
    },
  };
}
const failing = {
  get: async () => {
    throw new Error('R2');
  },
  head: async () => {
    throw new Error('R2');
  },
  put: async () => {
    throw new Error('R2');
  },
};

let env = {};
let pending = [];
const ctx = { waitUntil: (p) => pending.push(p) };
async function settle() {
  while (pending.length) await Promise.all(pending.splice(0));
}

const log = console.log;
// The Worker's own lines (packages/editor/worker/files.js: "Files (…): …") are left out.
console.log = (...args) => String(args[0]).startsWith('Files (') || log(...args);

globalThis.localStorage = { removeItem() {}, getItem: () => null, setItem() {} };
globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url.startsWith('https://api.github.com')) return github(url, init);
  if (url.startsWith('https://api.cloudflare.com/client/v4/accounts/account/r2/buckets/'))
    return new Headers(init.headers).get('cf-r2-jurisdiction') === cloudflareJurisdiction
      ? Response.json(cloudflare[1], { status: cloudflare[0] })
      : Response.json({ success: false, errors: [{ code: 10006, message: 'The specified bucket does not exist.' }] }, { status: 404 });
  if (url === 'https://api.cloudflare.com/client/v4/accounts/account/subscriptions')
    return Response.json(subscriptions[1], { status: subscriptions[0] });
  if (!url.startsWith('/api/github/')) return new Response(null, { status: 404 });
  const request = new Request(`https://editor.example${url}`, {
    ...init,
    headers: { ...init.headers, cookie: 'editor_session=token', 'sec-fetch-site': 'same-origin' },
  });
  return handleGitHub(request, env, ctx);
};

// The editor's github.ts, with its texts from the Danish dictionary; each import a new browser (nothing known).
const bundle = join(WORK, 'github.mjs');
await build({
  entryPoints: [join(SRC, 'github.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  outfile: bundle,
  logLevel: 'silent',
  plugins: [
    {
      name: 'site',
      setup(b) {
        b.onResolve({ filter: /^@site\/config$/ }, () => ({ path: join(ROOT, 'src/site/config.ts') }));
        b.onResolve({ filter: /^\.\/i18n$/ }, () => ({ path: 'i18n', namespace: 'i18n' }));
        b.onLoad({ filter: /.*/, namespace: 'i18n' }, () => ({
          contents: `import { app } from ${JSON.stringify(join(SRC, 'i18n/da-DK/app.ts'))}; export const t = { app };`,
          resolveDir: ROOT,
          loader: 'ts',
        }));
      },
    },
  ],
});
let browsers = 0;
const browser = () => import(`${pathToFileURL(bundle).href}?${browsers++}`);

// ---------------------------------------------------------------------------------------------------
// What git has, as the editor had it before: each file in a folder `depth` levels down, with its text ('' for binary).
function filesAt(commit, folder, depth = 3) {
  const lines = git(['ls-tree', '-r', '-z', commit, '--', folder]).toString().split('\0').filter(Boolean);
  return lines
    .map((line) => {
      const [meta, path] = line.split('\t');
      const oid = meta.split(' ')[2];
      return { path, oid, text: blobOf(oid).text ?? '' };
    })
    .filter((f) => f.path.slice(folder.length + 1).split('/').length <= depth)
    .sort((a, b) => a.path.localeCompare(b.path));
}
const sorted = (files) => [...files].sort((a, b) => a.path.localeCompare(b.path));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Opens the editor as a new browser; `github`: the requests to GitHub, but those for a text GitHub gives only part of,
// which can never be kept.
async function opened(b, what) {
  const before = requests.length;
  const at = await b.head();
  const loaded = await b.loadFolders(config.folders, 3, at);
  for (const [key, folder] of Object.entries(config.folders))
    expect(same(sorted(loaded.folders[key]), filesAt(at.commit, folder)), `${what}: ${folder} is not as in git`);
  expect(loaded.commit === head(), `${what}: the commit is not the branch's`);
  const partly = (r) =>
    [...r.matchAll(/b\d+: object\(oid: \\"([0-9a-f]+)/g)].every(([, oid]) => truncated.has(oid)) && /b0: object/.test(r);
  return { loaded, github: requests.slice(before).filter((r) => !partly(r)).length };
}

async function run(label, bucket) {
  env = bucket ? { FILES: bucket, GITHUB_PUBLISH_TOKEN: 'publish' } : { GITHUB_PUBLISH_TOKEN: 'publish' };
  const cached = bucket && bucket !== failing;
  const first = await opened(await browser(), `${label}, first opening`);
  await settle();
  const second = await opened(await browser(), `${label}, second opening`);
  if (cached) expect(second.github === 1, `${label}: the second opening asked GitHub ${second.github} times (only the head)`);
  await settle();

  // A save: a changed post (a page, when the site has no posts yet), a new file in a new folder, another page deleted and
  // a new image.
  const b = await browser();
  const files = first.loaded.folders;
  const post = [...files.blog, ...files.pages].find((f) => f.path.endsWith('.md'));
  const page = files.pages.find((f) => f.path.endsWith('.md') && f !== post);
  const image = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 1, 2, 3, ...new TextEncoder().encode(label)]);
  const changes = [
    { path: post.path, content: `${post.text}\nRettet (${label}).\n`, oid: post.oid },
    { path: `${config.folders.data}/ny-${label}/fil.json`, content: `{ "label": ${JSON.stringify(label)} }\n`, oid: null },
    { path: page.path, content: null, oid: page.oid },
    { path: `${config.folders.media}/ny-${label}.webp`, content: image, oid: null },
  ];
  const saved = await b.commit(`Editor: ret (${label})`, changes);
  expect(saved.commit === head(), `${label}: the save did not give the new commit`);
  for (const c of changes)
    if (c.content !== null)
      expect(saved.blobs[c.path] === out('rev-parse', `HEAD:${c.path}`), `${label}: the blob id of ${c.path} is wrong`);
  await settle();
  const after = await opened(await browser(), `${label}, opening after a save`);
  if (cached) expect(after.github === 1, `${label}: the opening after a save asked GitHub ${after.github} times (only the head)`);

  // A file changed or created elsewhere is not overwritten.
  for (const [change, message] of [
    [{ path: post.path, content: 'x', oid: post.oid }, 'changed elsewhere'],
    [{ path: changes[1].path, content: 'x', oid: null }, 'already exists'],
  ])
    try {
      await b.commit('Editor: konflikt', [change]);
      problems.push(`${label}: a save overwrote a file that is ${message}`);
    } catch (e) {
      expect(e instanceof b.ConflictError, `${label}: ${message} gav ${e.message}`);
    }

  // Versions: the saved one and the one before it.
  const { versions } = await b.versionsOf(post.path);
  expect(versions[0]?.commit === saved.commit, `${label}: the newest version is not the save`);
  expect((await b.versionText(versions[0], post.path)) === changes[0].content, `${label}: the text of the newest version is wrong`);
  expect((await b.versionText(versions[1], post.path)) === post.text, `${label}: the text of the previous version is wrong`);
  expect((await b.versionText(versions[0], page.path)) === null, `${label}: a deleted file has a text`);

  // Deleted files: the page, with its text; restored, it is not.
  const deleted = await b.deletedFiles(config.folders.pages);
  const gone = deleted.find((d) => d.path === page.path);
  expect(
    gone?.oid === page.oid && gone?.text === page.text && gone?.by === 'Anna',
    `${label}: the deleted page is not among the deleted files`,
  );
  await b.commit(`Editor: restore (${label})`, [{ path: page.path, content: page.text, oid: null }]);
  await settle();
  expect(
    !(await b.deletedFiles(config.folders.pages)).some((d) => d.path === page.path),
    `${label}: a restored page is among the deleted files`,
  );
  const images = await b.deletedFiles(config.folders.media, { text: false });
  expect(!images.length, `${label}: there are deleted images that were not deleted`);

  // An image's bytes, and a second time from R2.
  const oid = saved.blobs[changes[3].path];
  expect(same([...(await b.loadBytes(oid))], [...image]), `${label}: the image's bytes are wrong`);
  const old = files.media.find((f) => f.path.endsWith('.webp'));
  if (old) {
    expect(same([...(await b.loadBytes(old.oid))], [...bytesOf(old.oid)]), `${label}: an image's bytes are wrong`);
    await settle();
    const before = asked;
    await (await browser()).loadBytes(old.oid);
    if (cached) expect(asked === before, `${label}: the image was fetched from GitHub again`);
  }
  // Single files, and only questions through /graphql.
  const [single] = await b.loadFiles([post.path, 'missing/none.md']);
  expect(single?.text === changes[0].content && single.oid === saved.blobs[post.path], `${label}: loadFiles did not give the file`);
  try {
    await b.graphql('mutation { deleteRef(input: { refId: "x" }) { clientMutationId } }');
    problems.push(`${label}: /api/github/graphql let a change through`);
  } catch {}

  // The Worker's own saves (Publish scheduled, Cookiescanner).
  const read = await readFiles(env, [post.path, 'missing/none.md'], ctx);
  expect(read.head === head() && read.texts[0] === changes[0].content && read.texts[1] === undefined, `${label}: the Worker read wrongly`);
  await commitFiles(
    env,
    read.head,
    `Publish scheduled: ${label}`,
    [{ path: `${config.folders.data}/worker-${label}.json`, text: '{}\n' }],
    ctx,
  );
  // A waiting version whose time has come replaces its page and its file goes (publish.js, lib/versions.mjs); one that is not due stays.
  if (post.path.startsWith('src/content/')) {
    const waiting = `src/drafts/${post.path.slice('src/content/'.length)}`;
    const text = `---\ntitle: "Waiting (${label})"\npublishAt: "2020-01-01T08:00"\n---\n\nWaiting.\n`;
    await commitFiles(env, (await readFiles(env, [], ctx)).head, `Editor: draft (${label})`, [{ path: waiting, text }], ctx);
    await settle();
    const names = await publishScheduled(env, Date.now(), ctx);
    await settle();
    const after = await readFiles(env, [post.path, waiting], ctx);
    expect(names.length === 1, `${label}: the Worker published ${names.length} pages from a due waiting version, not 1`);
    expect(
      after.texts[0] === `---\ntitle: "Waiting (${label})"\n---\n\nWaiting.\n`,
      `${label}: the waiting version did not replace its page`,
    );
    expect(after.texts[1] === undefined, `${label}: the file of a published waiting version is still there`);
    const later = `---\ntitle: "Later (${label})"\npublishAt: "2999-01-01T08:00"\n---\n`;
    await commitFiles(env, after.head, `Editor: draft later (${label})`, [{ path: waiting, text: later }], ctx);
    await settle();
    expect((await publishScheduled(env, Date.now(), ctx)).length === 0, `${label}: the Worker published a version that is not due`);
    await commitFiles(env, (await readFiles(env, [], ctx)).head, `Editor: discard (${label})`, [{ path: waiting, text: null }], ctx);
    // A page on the stored status Scheduled, with a time still to come, becomes a draft with a waiting version that has the time.
    const old = `---\ntitle: "Old (${label})"\nstatus: "scheduled"\npublishAt: "2999-01-01T08:00"\n---\n\nOld.\n`;
    await commitFiles(env, (await readFiles(env, [], ctx)).head, `Editor: old scheduled (${label})`, [{ path: post.path, text: old }], ctx);
    await settle();
    const legacy = {
      ...env,
      ASSETS: { fetch: async () => new Response(JSON.stringify([{ path: post.path, publishAt: '2999-01-01T08:00' }])) },
    };
    expect(
      (await publishScheduled(legacy, Date.now(), ctx)).length === 0,
      `${label}: the Worker published a Scheduled page that is not due`,
    );
    await settle();
    const moved = await readFiles(env, [post.path, waiting], ctx);
    expect(
      /status: "draft"/.test(moved.texts[0] ?? '') && !/publishAt/.test(moved.texts[0] ?? ''),
      `${label}: a Scheduled page did not become a draft`,
    );
    expect(
      /publishAt: "2999-01-01T08:00"/.test(moved.texts[1] ?? '') && !/status/.test(moved.texts[1] ?? ''),
      `${label}: its time did not move to a waiting version`,
    );
    await commitFiles(env, moved.head, `Editor: discard (${label})`, [{ path: waiting, text: null }], ctx);
  }

  // An autosaved draft (autosave.js, lib/autosave.mjs): kept in R2 and read back, listed, deleted, moved to git as the waiting version in the
  // signed-in person's name (an older autosave also by the hourly sweep), refused above the size limit and without R2 (`R2 caching` off).
  if (post.path.startsWith('src/content/')) {
    const call = async (method, path, body, headers = { cookie: 'editor_session=token', 'sec-fetch-site': 'same-origin' }) => {
      const res = await handleAutosave(
        new Request(`https://editor.example${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }),
        env,
        ctx,
      );
      return { status: res.status, ...(await res.json().catch(() => ({}))) };
    };
    // The page is published here (the check before left it a draft): its autosave is a waiting version.
    {
      await settle();
      const now = await readFiles(env, [post.path], ctx);
      await commitFiles(
        env,
        now.head,
        `Editor: publish (${label})`,
        [{ path: post.path, text: `${(now.texts[0] ?? '').replace(/^status: .*\r?\n/m, '')}\nPublished (${label}).\n` }],
        ctx,
      );
      await settle();
    }
    const waiting = `src/drafts/${post.path.slice('src/content/'.length)}`;
    const query = `path=${encodeURIComponent(post.path)}`;
    const text = `---\ntitle: "Autosaved (${label})"\n---\n\nAutosaved.\n`;
    expect(
      (await call('GET', `/api/autosave?${query}`, undefined, {})).status === 401,
      `${label}: autosave answered a request without a sign-in`,
    );
    if (!bucket) {
      expect(
        (await call('PUT', '/api/autosave', { path: post.path, text })).error === 'off',
        `${label}: autosave without R2 did not say off`,
      );
    } else if (!cached) {
      expect(
        (await call('PUT', '/api/autosave', { path: post.path, text })).status === 502,
        `${label}: autosave with a failing R2 did not say failed`,
      );
    } else {
      expect((await call('GET', `/api/autosave?${query}`)).status === 404, `${label}: there is an autosave before one was made`);
      expect((await call('PUT', '/api/autosave', { path: '../x.md', text })).status === 400, `${label}: autosave accepted a bad path`);
      expect(
        (await call('PUT', '/api/autosave', { path: post.path, id: 'Bad Id', text })).status === 400,
        `${label}: autosave accepted a bad id`,
      );
      expect(
        (await call('PUT', '/api/autosave', { path: post.path, text: 'x'.repeat(1024 * 1024 + 1) })).status === 413,
        `${label}: autosave accepted too much text`,
      );
      expect((await call('PUT', '/api/autosave', { path: post.path, text })).status === 200, `${label}: autosave did not keep a text`);
      const got = await call('GET', `/api/autosave?${query}`);
      expect(got.text === text && typeof got.savedAt === 'number', `${label}: the autosave is not as it was put`);
      const listed = await call('GET', '/api/autosave');
      expect(
        same(
          listed.drafts?.map((d) => [d.path, d.id]),
          [[post.path, 'waiting']],
        ),
        `${label}: the autosave list is wrong`,
      );
      // Moved to git: the waiting version has the text, and the autosave is gone; the same text again changes nothing.
      const flushed = await call('POST', '/api/autosave/flush', { path: post.path });
      await settle();
      expect(flushed.committed === true, `${label}: the flush did not commit`);
      expect((await readFiles(env, [waiting], ctx)).texts[0] === text, `${label}: the waiting version is not the autosaved text`);
      expect((await call('GET', `/api/autosave?${query}`)).status === 404, `${label}: the autosave is still there after the flush`);
      expect(
        (await call('POST', '/api/autosave/flush', { path: post.path })).status === 404,
        `${label}: a flush without an autosave did not say not found`,
      );
      expect(
        (await call('POST', '/api/autosave/flush', { path: post.path, text })).committed === false,
        `${label}: the same text was committed again`,
      );
      // The page being left: the text goes with the flush, with no autosave before.
      const last = `${text}More.\n`;
      expect(
        (await call('POST', '/api/autosave/flush', { path: post.path, text: last })).committed === true,
        `${label}: a flush with a text did not commit`,
      );
      await settle();
      expect((await readFiles(env, [waiting], ctx)).texts[0] === last, `${label}: the flushed text is not the waiting version`);
      // A page that is gone: nothing to keep it for.
      await call('PUT', '/api/autosave', { path: 'src/content/gone.md', text });
      expect(
        (await call('POST', '/api/autosave/flush', { path: 'src/content/gone.md' })).status === 404,
        `${label}: a flush of a gone page did not say page`,
      );
      // The hourly sweep: a fresh autosave stays, an idle one goes to git, an old one that cannot is deleted.
      await call('PUT', '/api/autosave', { path: post.path, text });
      expect((await sweepAutosaves(env, Date.now(), ctx)).flushed === 0, `${label}: the sweep moved a fresh autosave`);
      const day = 25 * 60 * 60 * 1000;
      const swept = await sweepAutosaves(env, Date.now() + day, ctx);
      await settle();
      expect(
        swept.flushed === 1 && (await readFiles(env, [waiting], ctx)).texts[0] === text,
        `${label}: the sweep did not move an idle autosave`,
      );
      await call('PUT', '/api/autosave', { path: 'src/content/gone.md', text });
      const old = await sweepAutosaves({ ...env, GITHUB_PUBLISH_TOKEN: undefined }, Date.now() + 31 * day, ctx);
      expect(
        old.deleted === 1 && !(await call('GET', '/api/autosave')).drafts.length,
        `${label}: the sweep did not delete an old autosave`,
      );
      await commitFiles(
        env,
        (await readFiles(env, [], ctx)).head,
        `Editor: discard autosave (${label})`,
        // (The page text changes too: the tree after the discard is not the one from before the autosaves, which R2 keeps once.)
        [
          { path: waiting, text: null },
          { path: post.path, text: `${text}Discarded (${label}).\n` },
        ],
        ctx,
      );
      // A new page or post, with no file yet (`create`, `to`), and a draft page: its flush writes the page file itself and keeps it a draft.
      {
        // Each call is let finish its R2 writes before the next, so a tree is not read from GitHub twice at the same time.
        const callS = async (...args) => {
          const answer = await call(...args);
          await settle();
          return answer;
        };
        const dir = post.path.slice(0, post.path.lastIndexOf('/') + 1);
        const placeholder = `${dir}new-entry-check1.md`;
        const wanted = `${dir}autosave-new-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
        const stem = wanted.slice(0, -3);
        const made = `---\ntitle: "New page"\nstatus: "draft"\n---\n\n# Hello\n`;
        const create = { path: placeholder, create: true, to: wanted };
        // A new entry without a name to be made as, or one that is flushed as a plain page, is not made.
        await callS('PUT', '/api/autosave', { path: placeholder, text: made, create: true });
        expect(
          (await callS('POST', '/api/autosave/flush', { path: placeholder })).status === 404,
          `${label}: a new page without a file name was made`,
        );
        await callS('PUT', '/api/autosave', { path: placeholder, text: made });
        expect(
          (await callS('POST', '/api/autosave/flush', { path: placeholder })).status === 404,
          `${label}: a flush without create made a page`,
        );
        // Made: the draft page file, as a draft even when the text says published, and the autosave is gone.
        await callS('PUT', '/api/autosave', { ...create, text: made.replace('status: "draft"\n', '') });
        expect(
          (await callS('GET', '/api/autosave')).drafts.some((d) => d.path === placeholder),
          `${label}: the new page's autosave is not listed`,
        );
        const first = await callS('POST', '/api/autosave/flush', { path: placeholder });
        await settle();
        expect(first.committed === true && first.path === wanted, `${label}: the new page was not made at its name (${first.path})`);
        const madeText = (await readFiles(env, [wanted, placeholder], ctx)).texts;
        expect(/status: "draft"/.test(madeText[0] ?? '') && madeText[1] === undefined, `${label}: the new page is not a draft page file`);
        expect(
          (await callS('GET', `/api/autosave?path=${encodeURIComponent(placeholder)}`)).status === 404,
          `${label}: the new page's autosave is still there`,
        );
        // The same name taken: the number is added; the same text sent again is the one made, not another.
        await callS('PUT', '/api/autosave', { ...create, text: `${made}\nTwo.\n` });
        const second = await callS('POST', '/api/autosave/flush', { path: placeholder });
        await settle();
        expect(second.path === `${stem}-2.md`, `${label}: a taken name was not numbered (${second.path})`);
        const again = await callS('POST', '/api/autosave/flush', { path: placeholder, text: `${made}\nTwo.\n`, create: true, to: wanted });
        expect(again.committed === false && again.path === `${stem}-2.md`, `${label}: the same new page was made twice`);
        // A draft page: an autosave writes the page file (not a waiting version) and keeps it a draft.
        const written = `---\ntitle: "Hello"\nstatus: "published"\n---\n\n# Hello\n\nMore.\n`;
        await callS('PUT', '/api/autosave', { path: wanted, text: written });
        const draft = await callS('POST', '/api/autosave/flush', { path: wanted });
        await settle();
        const after = (await readFiles(env, [wanted, `src/drafts/${wanted.slice('src/content/'.length)}`], ctx)).texts;
        expect(draft.committed === true && draft.path === wanted, `${label}: the draft page was not saved`);
        expect(
          /status: "draft"/.test(after[0] ?? '') && /More\./.test(after[0] ?? ''),
          `${label}: the draft page was published or not written`,
        );
        expect(after[1] === undefined, `${label}: a draft page got a waiting version`);
        // After the H1: the draft moves to its new name, and the old file goes. A taken name is numbered, and a published page never moves.
        const renamed = `${dir}autosave-renamed-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
        await callS('PUT', '/api/autosave', { path: wanted, text: written, to: renamed });
        const moved = await callS('POST', '/api/autosave/flush', { path: wanted });
        await settle();
        const gone = (await readFiles(env, [wanted, renamed], ctx)).texts;
        expect(
          moved.path === renamed && gone[0] === undefined && /More\./.test(gone[1] ?? ''),
          `${label}: the draft did not move to its name`,
        );
        await callS('PUT', '/api/autosave', { path: post.path, text: `${text}Stays.\n`, to: renamed });
        const stays = await callS('POST', '/api/autosave/flush', { path: post.path });
        await settle();
        expect(stays.path === post.path, `${label}: a published page moved (${stays.path})`);
        // The hourly sweep makes a new page nobody flushed.
        const swept2 = `${dir}new-entry-check2.md`;
        await callS('PUT', '/api/autosave', { path: swept2, text: made, create: true, to: `${stem}-swept.md` });
        const swept = await sweepAutosaves(env, Date.now() + 25 * 60 * 60 * 1000, ctx);
        await settle();
        expect(
          swept.flushed >= 1 && /status: "draft"/.test((await readFiles(env, [`${stem}-swept.md`], ctx)).texts[0] ?? ''),
          `${label}: the sweep did not make a new page`,
        );
        const left = [wanted, `${stem}-2.md`, renamed, `${stem}-swept.md`, waiting];
        const there = await readFiles(env, left, ctx);
        await commitFiles(
          env,
          there.head,
          `Editor: discard autosave pages (${label})`,
          [
            ...left.flatMap((path, i) => (there.texts[i] === undefined ? [] : [{ path, text: null }])),
            { path: post.path, text: `${text}Done (${label}).\n` },
          ],
          ctx,
        );
      }
    }
  }
  await settle();
  const own = await opened(await browser(), `${label}, opening after the Worker's save`);
  if (cached) expect(own.github === 1, `${label}: the opening after the Worker's save asked GitHub ${own.github} times (only the head)`);
  await settle();
  return { first: first.github, second: second.github, after: after.github };
}

// A request from another page (another address of the same domain) gets nothing, even with the cookie.
{
  const res = await handleGitHub(
    new Request('https://editor.example/api/github/head', { headers: { cookie: 'editor_session=token', 'sec-fetch-site': 'same-site' } }),
    {},
    ctx,
  );
  expect(res.status === 401, `a request from another page got ${res.status}, not 401`);
}

const bucket = memoryBucket();
let counts;
try {
  counts = await run('r2', bucket);
  await run('no-r2', null);
  await run('r2-fails', failing);
  await settle();

  // R2 caching under Settings › Developer › Caching and builds (r2Caching.ts): the Worker's settings have the line and its bucket, and
  // with it on or off they are settings wrangler reads, with the bucket bound as FILES or no bucket; on and off again,
  // they are as they were. And /api/r2 (packages/editor/worker/r2-status.js) says what Cloudflare says of the bucket, only to someone who
  // can save, so the switch is turned on only when Cloudflare has it.
  {
    const { experimental_readRawConfig } = await import('wrangler');
    const text = readFileSync(join(ROOT, config.wrangler), 'utf8');
    const was = r2CachingOn(text);
    expect(was !== null, `${config.wrangler} has no line for R2 caching`);
    if (was !== null) {
      // Where the bucket is kept ("Location"): placed by Cloudflare or within the EU, each with R2 caching on and off.
      for (const place of [null, 'eu']) {
        const placed = withJurisdiction(text, place);
        expect(jurisdictionOf(placed) === place, `R2 caching's bucket cannot be kept ${place ? `in ${place}` : 'without a jurisdiction'}`);
        expect(bucketOf(placed) === bucketOf(text), `R2 caching's location changed the bucket's name`);
        expect(
          withJurisdiction(placed, jurisdictionOf(text)) === text,
          `R2 caching's location ${place ?? 'automatic'} and back does not give the file again`,
        );
        for (const on of [true, false]) {
          const changed = withR2Caching(placed, on);
          const file = join(WORK, 'wrangler.jsonc');
          writeFileSync(file, changed);
          const buckets = experimental_readRawConfig({ config: file }).rawConfig.r2_buckets ?? [];
          expect(r2CachingOn(changed) === on, `R2 caching cannot be turned ${on ? 'on' : 'off'}`);
          expect(
            on
              ? buckets.length === 1 &&
                  buckets[0].binding === 'FILES' &&
                  buckets[0].bucket_name === bucketOf(changed) &&
                  (buckets[0].jurisdiction ?? null) === place
              : !buckets.length,
            `wrangler reads R2 caching wrongly when it is turned ${on ? 'on' : 'off'} (${place ?? 'automatic'})`,
          );
          expect(
            withR2Caching(withR2Caching(placed, on), was) === placed,
            `R2 caching turned ${on ? 'on' : 'off'} and back does not give the file again`,
          );
        }
      }
    }

    // Asked as the editor asks (r2Status in r2Caching.ts): the bucket, and the jurisdiction the settings name.
    const query = (jurisdiction = jurisdictionOf(text)) =>
      new URLSearchParams({ bucket: bucketOf(text) ?? '', ...(jurisdiction ? { jurisdiction } : {}) });
    const ask = (headers = { cookie: 'editor_session=token', 'sec-fetch-site': 'same-origin' }, q = query()) =>
      handleR2(new Request(`https://editor.example/api/r2?${q}`, { headers }), r2Env).then(async (r) => ({
        status: r.status,
        ...(await r.json()),
      }));
    // What Cloudflare answers about the bucket, as its API does.
    const answers = {
      ready: [200, { success: true, errors: [], result: { name: bucketOf(text) } }],
      'no-bucket': [404, { success: false, errors: [{ code: 10006, message: 'The specified bucket does not exist.' }] }],
      'no-r2': [403, { success: false, errors: [{ code: 10042, message: 'Please enable R2 through the Cloudflare Dashboard.' }] }],
      refused: [403, { success: false, errors: [{ code: 10000, message: 'Authentication error' }] }],
      failed: [500, { success: false, errors: [{ code: 10001, message: 'Internal error' }] }],
    };
    cloudflareJurisdiction = jurisdictionOf(text);
    for (const [state, answer] of Object.entries(answers)) {
      cloudflare = answer;
      r2Env = { FILES: {}, CLOUDFLARE_ACCOUNT_ID: 'account', CLOUDFLARE_R2_TOKEN: 'key' };
      const got = await ask();
      expect(got.status === 200 && got.bucket === state && got.bound === true, `/api/r2 said ${got.bucket}, not ${state}`);
    }
    // A bucket kept within a jurisdiction is found only there, and a jurisdiction R2 does not have is not asked for.
    cloudflare = answers.ready;
    cloudflareJurisdiction = jurisdictionOf(text) ? null : 'eu';
    const elsewhere = await ask();
    expect(elsewhere.bucket === 'no-bucket', `/api/r2 found the bucket outside its jurisdiction (${elsewhere.bucket})`);
    const unknown = await ask(undefined, query('mars'));
    expect(unknown.status === 400, `/api/r2 asked about the jurisdiction mars (${unknown.status}), not 400`);
    cloudflareJurisdiction = null;
    r2Env = {};
    const none = await ask();
    expect(none.bucket === 'no-key' && none.bound === false, `/api/r2 without the Worker's key said ${none.bucket}`);
    const other = await ask({ cookie: 'editor_session=token', 'sec-fetch-site': 'same-site' });
    expect(other.status === 403, `/api/r2 answered another page with ${other.status}, not 403`);
  }

  // /api/plan (packages/editor/worker/plan-status.js): whether the account has Workers Paid, for "Betalt bygning".
  {
    const plan = (id, state) => ({ rate_plan: { id }, ...(state === undefined ? {} : { state }) });
    expect(paidFrom([plan('WORKERS_PAID', 'Paid')]) === true, 'paidFrom: WORKERS_PAID in capitals is not paid');
    expect(paidFrom([plan('workers_paid')]) === true, 'paidFrom: workers_paid without a state is not paid');
    expect(paidFrom([plan('workers_paid', 'trial')]) === true, 'paidFrom: a trial is not paid');
    expect(paidFrom([plan('workers_paid', 'Cancelled')]) === false, 'paidFrom: a cancelled plan is paid');
    expect(paidFrom([plan('cf_free', 'Paid'), plan('zone_pro', 'Paid')]) === false, 'paidFrom: a zone plan is Workers Paid');
    expect(
      paidFrom(undefined) === false && paidFrom({}) === false && paidFrom(null) === false,
      'paidFrom: something that is not a list is paid',
    );
    const signedIn = { cookie: 'editor_session=token', 'sec-fetch-site': 'same-origin' };
    const askPlan = (headers = signedIn, method = 'GET') =>
      handlePlan(new Request('https://editor.example/api/plan', { headers, method }), r2Env).then(async (r) => ({
        status: r.status,
        ...(await r.json()),
      }));
    const keyed = { CLOUDFLARE_ACCOUNT_ID: 'account', CLOUDFLARE_R2_TOKEN: 'key' };
    r2Env = {};
    expect((await askPlan()).paid === 'no-key', "/api/plan without the Worker's key did not say no-key");
    r2Env = keyed;
    subscriptions = [403, { success: false, errors: [{ code: 10000, message: 'Authentication error' }] }];
    expect((await askPlan()).paid === 'refused', '/api/plan did not say refused when Cloudflare answered 403');
    subscriptions = [500, { success: false, errors: [] }];
    expect((await askPlan()).paid === 'failed', '/api/plan did not say failed when Cloudflare answered 500');
    subscriptions = [200, { success: true, errors: [], result: [plan('WORKERS_PAID', 'Paid')] }];
    expect((await askPlan()).paid === 'yes', '/api/plan did not say yes with Workers Paid');
    subscriptions = [200, { success: true, errors: [], result: [plan('cf_free', 'Paid')] }];
    expect((await askPlan()).paid === 'no', '/api/plan did not say no without Workers Paid');
    expect(
      (await askPlan({ cookie: 'editor_session=token', 'sec-fetch-site': 'same-site' })).status === 403,
      '/api/plan did not answer another page with 403',
    );
    expect((await askPlan(signedIn, 'POST')).status === 405, '/api/plan did not answer a POST with 405');
    r2Env = {};
  }

  // Everything in R2 is the repository's, gives its git id, and was written once; but an autosave (worker/autosave.js), which is written
  // again at each change and is gone when moved to git: none is left.
  for (const [key, value] of bucket.objects) {
    const [o, r, kind, oid] = key.split('/');
    expect(o === owner && r === name, `R2: ${key} is not the site's repository`);
    if (kind === 'autosave') {
      problems.push(`R2: the autosave ${key} was left`);
      continue;
    }
    if (kind === 'blob') expect((await blobId(value)) === oid, `R2: ${key} does not give its blob id`);
    else if (kind === 'tree')
      expect((await treeId(JSON.parse(new TextDecoder().decode(value)).entries)) === oid, `R2: ${key} does not give its tree id`);
    else problems.push(`R2: ${key} is neither a blob nor a tree`);
  }
  for (const [key, n] of bucket.puts) expect(n === 1 || key.split('/')[2] === 'autosave', `R2: ${key} was written ${n} times`);
  for (const oid of truncated)
    expect(!bucket.objects.has(`${owner}/${name}/blob/${oid}`), `R2: a file that GitHub gave only a part of was kept`);

  // How long a wait for a build lasts (packages/editor/worker/push.js waitForBuilds, build-settings.mjs giveUpAfter): a wait of
  // 15 minutes is still waiting when version.json has no paidBuilds (free plan: 20 minutes), is given up with
  // paidBuilds: true (10 minutes), and every wait is given up after 20.
  {
    const [{ waitForBuilds }] = await workerModules('push.js');
    const minute = 60_000;
    const now = Date.now();
    const commit = 'a'.repeat(40);
    const kv = (waits) => {
      const store = new Map(waits.map(([key, at]) => [key, { metadata: { commit, device: key, at: new Date(at).toISOString() } }]));
      store.set('waiting', { value: String(now + 30 * minute) });
      return {
        store,
        get: async (key) => store.get(key)?.value ?? null,
        put: async () => {},
        delete: async (key) => void store.delete(key),
        list: async ({ prefix }) => ({
          keys: [...store].filter(([key]) => key.startsWith(prefix)).map(([name, { metadata }]) => ({ name, metadata })),
        }),
      };
    };
    // A build from before the saves, so none of them is on the site.
    const assets = (paid) => ({
      fetch: async () =>
        Response.json({
          commit: 'b'.repeat(40),
          builtAt: new Date(now - 60 * minute).toISOString(),
          ...(paid === undefined ? {} : { paidBuilds: paid }),
        }),
    });
    for (const [paid, minutes, waiting] of [
      [undefined, 15, true],
      [false, 15, true],
      [true, 15, false],
      [undefined, 25, false],
      [true, 25, false],
    ]) {
      const PUSH = kv([['wait:x', now - minutes * minute]]);
      await waitForBuilds({ PUSH, ASSETS: assets(paid) }, now);
      const label = `a waiting save of ${minutes} minutes, paidBuilds ${paid}`;
      expect(PUSH.store.has('wait:x') === waiting, `${label}: ${waiting ? 'was given up too early' : 'was not given up'}`);
    }
  }
} finally {
  console.log = log;
  rmSync(WORK, { recursive: true, force: true });
}

if (problems.length) {
  console.error(`${problems.length} problems in the Worker's GitHub and the cache in R2:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(
  `The Worker's GitHub and the cache in R2 work: the first opening ${counts.first} requests to GitHub, the second ${counts.second}, after a save ${counts.after}; ` +
    `${bucket.objects.size} objects in R2. Also without R2 and with an R2 that fails.`,
);
