// The site's files in its repository on GitHub, for the editor (packages/editor/worker/editor-github.js) and the Worker's own saves
// (packages/editor/worker/github.js), through a cache in R2 (the binding FILES in wrangler.jsonc). See docs/editor.md, how the editor saves.
//
// Git's objects never change, so the cache never has to be told that something changed: a file's content is kept under
// its blob id and a folder under its tree id (its entries' names, ids and modes, and whether GitHub calls each file
// binary), both written once, and only when they give git's own id (packages/editor/lib/git.mjs). A commit's files are
// its root tree. GitHub is asked for the branch's head every time (one small request) and otherwise only for what R2
// does not have; what the Worker saves itself goes into R2 at once. Without the binding (a preview of a branch), or
// when R2 fails, everything comes from GitHub as before, and a save never waits for R2. The keys start with the
// repository (src/site/config.ts), so the sites' files can never mix:
//   <owner>/<repo>/blob/<oid>   a file's bytes
//   <owner>/<repo>/tree/<oid>   a folder: { "entries": [{ name, oid, mode, type, binary? }] }, in git's order
// Each request logs how many requests went to GitHub and how many objects were read and written in R2.
import { config } from '@site/config';
import { blobId, sortTree, TREE_MODE, treeId } from '../lib/git.mjs';

const { owner, name, branch } = config.repo;
const KEY = `${owner}/${name}`;
const API = 'https://api.github.com';
const encoder = new TextEncoder();
// GitHub's text of a file is its bytes as UTF-8; bytes that are not (another encoding) are asked of GitHub.
const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
// The most objects asked of GitHub in one request.
const BATCH = 100;
const FILE_MODE = 0o100644;

/** An answer from GitHub that was not a success: its status (401: the sign-in is no longer valid). */
export class GitHubError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Each commit's root tree, as GitHub gave it (a commit never changes).
const roots = new Map();

/**
 * The site's files for one request, asked with `token` (the editor's sign-in, or the Worker's GITHUB_PUBLISH_TOKEN).
 * `ctx`: the request's, so R2 is written after the answer has gone; without it, `finish` waits for the writing.
 */
export function filesOf(env, token, ctx) {
  const bucket = env.FILES;
  const count = { github: 0, read: 0, written: 0 };
  const pending = [];
  // The trees already read in this request.
  const trees = new Map();

  /** fetch for GitHub, counted. */
  function ask(url, init = {}) {
    count.github++;
    return fetch(url, {
      ...init,
      headers: { authorization: `Bearer ${token}`, 'user-agent': `${name}-worker`, ...init.headers },
    });
  }

  async function graphql(query, variables = {}) {
    const res = await ask(`${API}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.errors?.length) throw new GitHubError(body.errors?.[0]?.message ?? body.message ?? '', res.status);
    return body.data;
  }

  async function stored(kind, oid) {
    if (!bucket) return null;
    try {
      count.read++;
      const object = await bucket.get(`${KEY}/${kind}/${oid}`);
      return object ? new Uint8Array(await object.arrayBuffer()) : null;
    } catch {
      return null;
    }
  }

  // Writes once: `check` first (an R2 read is cheaper than a write), when the object may be there already.
  function keep(kind, oid, value, check = false) {
    if (!bucket) return;
    later(
      (async () => {
        const key = `${KEY}/${kind}/${oid}`;
        if (check) {
          count.read++;
          if (await bucket.head(key)) return;
        }
        count.written++;
        await bucket.put(key, value);
      })().catch(() => {}),
    );
  }

  function later(promise) {
    pending.push(promise);
    ctx?.waitUntil(promise);
  }

  /** The commit the branch is at and its root tree, always from GitHub. */
  async function head() {
    const data = await graphql(
      `
        query ($owner: String!, $name: String!, $ref: String!) {
          repository(owner: $owner, name: $name) {
            ref(qualifiedName: $ref) {
              target {
                oid
                ... on Commit {
                  tree {
                    oid
                  }
                }
              }
            }
          }
        }
      `,
      { owner, name, ref: `refs/heads/${branch}` },
    );
    const { oid, tree } = data.repository.ref.target;
    roots.set(oid, tree.oid);
    return { commit: oid, tree: tree.oid };
  }

  /** A commit's root tree. */
  async function rootOf(commit) {
    if (!roots.has(commit)) {
      const data = await graphql(
        `
          query ($owner: String!, $name: String!, $oid: GitObjectID!) {
            repository(owner: $owner, name: $name) {
              object(oid: $oid) {
                ... on Commit {
                  tree {
                    oid
                  }
                }
              }
            }
          }
        `,
        { owner, name, oid: commit },
      );
      roots.set(commit, data.repository.object.tree.oid);
    }
    return roots.get(commit);
  }

  /** Trees by their ids: their entries, or null for what is not a tree. From R2, the rest from GitHub in one request. */
  async function treesOf(oids) {
    const wanted = [...new Set(oids)].filter((oid) => !trees.has(oid));
    const found = await Promise.all(wanted.map((oid) => stored('tree', oid)));
    const missing = [];
    wanted.forEach((oid, i) => {
      try {
        if (found[i]) return trees.set(oid, JSON.parse(new TextDecoder().decode(found[i])).entries);
      } catch {}
      missing.push(oid);
    });
    for (let at = 0; at < missing.length; at += BATCH) {
      const some = missing.slice(at, at + BATCH);
      const data = await graphql(
        `query ($owner: String!, $name: String!) { repository(owner: $owner, name: $name) {
          ${some.map((oid, i) => `t${i}: object(oid: ${JSON.stringify(oid)}) { ... on Tree { entries { name oid mode type object { ... on Blob { isBinary } } } } }`).join('\n')}
        } }`,
        { owner, name },
      );
      await Promise.all(
        some.map(async (oid, i) => {
          const got = data.repository[`t${i}`]?.entries;
          const entries = got
            ? sortTree(
                got.map((e) => ({
                  name: e.name,
                  oid: e.oid,
                  mode: e.mode,
                  type: e.type,
                  ...(e.type === 'blob' ? { binary: e.object?.isBinary === true } : {}),
                })),
              )
            : null;
          trees.set(oid, entries);
          if (entries && (await treeId(entries)) === oid) keep('tree', oid, JSON.stringify({ entries }));
        }),
      );
    }
    return new Map(oids.map((oid) => [oid, trees.get(oid) ?? null]));
  }

  /** The trees at some paths (`{ root, path }`, '' the root itself): their ids, or null where there is no folder. */
  async function foldersAt(places) {
    let at = places.map(({ root, path }) => ({ oid: root, rest: path ? path.split('/') : [] }));
    for (;;) {
      const on = at.filter((a) => a.oid && a.rest.length);
      if (!on.length) return at.map((a) => a.oid);
      const got = await treesOf(on.map((a) => a.oid));
      at = at.map((a) => {
        if (!a.oid || !a.rest.length) return a;
        const entry = got.get(a.oid)?.find((e) => e.name === a.rest[0]);
        return { oid: entry?.type === 'tree' ? entry.oid : null, rest: a.rest.slice(1) };
      });
    }
  }

  /** What is at some paths under a root tree: each one's entry (a file, a folder), or null. */
  async function entriesAt(root, paths) {
    const dirs = await foldersAt(paths.map((p) => ({ root, path: parentOf(p) })));
    const got = await treesOf(dirs.filter(Boolean));
    return paths.map((p, i) => (dirs[i] && got.get(dirs[i])?.find((e) => e.name === baseOf(p))) || null);
  }

  /** The files in some folders under a root tree, `depth` levels of folders down: `{ path, oid, binary }`, a list for
   * each folder (empty when it is not there). */
  async function filesIn(root, folders, depth) {
    const starts = await foldersAt(folders.map((path) => ({ root, path })));
    const lists = folders.map(() => []);
    let level = starts.flatMap((oid, i) => (oid ? [{ oid, path: folders[i], list: lists[i] }] : []));
    for (let d = 1; d <= depth && level.length; d++) {
      const got = await treesOf(level.map((l) => l.oid));
      const next = [];
      for (const l of level)
        for (const e of got.get(l.oid) ?? []) {
          const path = l.path ? `${l.path}/${e.name}` : e.name;
          if (e.type === 'tree') next.push({ oid: e.oid, path, list: l.list });
          else if (e.type === 'blob') l.list.push({ path, oid: e.oid, binary: e.binary === true });
        }
      level = next;
    }
    return lists;
  }

  /** Files' texts by their blob ids, as GitHub gives them: null for one GitHub calls binary, undefined for one that is
   * not there. From R2, the rest from GitHub in one request. */
  async function texts(oids) {
    const wanted = [...new Set(oids)];
    const found = await Promise.all(wanted.map((oid) => stored('blob', oid)));
    const out = new Map();
    const missing = [];
    wanted.forEach((oid, i) => {
      const text = found[i] && textOf(found[i]);
      if (text === null || text === undefined) missing.push(oid);
      else out.set(oid, text);
    });
    for (let at = 0; at < missing.length; at += BATCH) {
      const some = missing.slice(at, at + BATCH);
      const data = await graphql(
        `query ($owner: String!, $name: String!) { repository(owner: $owner, name: $name) {
          ${some.map((oid, i) => `b${i}: object(oid: ${JSON.stringify(oid)}) { ... on Blob { text isBinary isTruncated } }`).join('\n')}
        } }`,
        { owner, name },
      );
      await Promise.all(
        some.map(async (oid, i) => {
          const blob = data.repository[`b${i}`];
          if (!blob) return;
          if (blob.isBinary || blob.text == null) return out.set(oid, null);
          out.set(oid, blob.text);
          // Kept only whole and unchanged: the text's bytes are the file's.
          const bytes = encoder.encode(blob.text);
          if (!blob.isTruncated && (await blobId(bytes)) === oid) keep('blob', oid, bytes);
        }),
      );
    }
    return new Map(oids.map((oid) => [oid, out.get(oid)]));
  }

  /** A file's bytes by its blob id: from R2, else from GitHub (kept when they give the id). `repo`: another repository
   * (an app in the store), only from GitHub. Null when GitHub has no such file. */
  async function bytes(oid, repo = config.repo) {
    const own = repo.owner === owner && repo.name === name;
    const found = own ? await stored('blob', oid) : null;
    if (found) return found;
    const res = await ask(`${API}/repos/${repo.owner}/${repo.name}/git/blobs/${oid}`, {
      headers: { accept: 'application/vnd.github.raw+json' },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new GitHubError('', res.status);
    const got = new Uint8Array(await res.arrayBuffer());
    if (own && (await blobId(got)) === oid) keep('blob', oid, got);
    return got;
  }

  /**
   * Saves files in one commit on the branch, if it is still at `at` (`{ commit, tree }`). `changes`: `{ path, contents }`,
   * the contents as base64 (as GitHub takes them), null to delete the file. Gives the new commit and each saved file's
   * blob id. The new blobs and folders go into R2 afterwards: worked out from the folders before the commit, and kept
   * only when they give the root tree GitHub made (so they are the commit's).
   */
  async function save(at, message, changes) {
    const kept = changes.filter((c) => c.contents !== null);
    const data = await graphql(
      `mutation ($input: CreateCommitOnBranchInput!) {
        createCommitOnBranch(input: $input) { commit { oid tree { oid }
          ${kept.map((c, i) => `f${i}: file(path: ${JSON.stringify(c.path)}) { oid object { ... on Blob { isBinary } } }`).join('\n')}
        } }
      }`,
      {
        input: {
          branch: { repositoryNameWithOwner: KEY, branchName: branch },
          expectedHeadOid: at.commit,
          message: { headline: message },
          fileChanges: {
            additions: kept.map((c) => ({ path: c.path, contents: c.contents })),
            deletions: changes.filter((c) => c.contents === null).map((c) => ({ path: c.path })),
          },
        },
      },
    );
    const done = data.createCommitOnBranch.commit;
    roots.set(done.oid, done.tree.oid);
    const saved = new Map(kept.map((c, i) => [c.path, { oid: done[`f${i}`].oid, binary: done[`f${i}`].object?.isBinary === true }]));
    if (bucket) later(keepSaved(at.tree, done.tree.oid, changes, saved).catch(() => {}));
    return { commit: done.oid, blobs: Object.fromEntries([...saved].map(([path, f]) => [path, f.oid])) };
  }

  async function keepSaved(before, after, changes, saved) {
    // The folders the changes are in, with all above them, and their entries before the commit (none: a new folder).
    const dirs = [...new Set(changes.flatMap((c) => ancestorsOf(c.path)))];
    const oids = await foldersAt(dirs.map((path) => ({ root: before, path })));
    const got = await treesOf(oids.filter(Boolean));
    if (oids.some((oid) => oid && !got.get(oid))) return;
    const folders = new Map(dirs.map((d, i) => [d, new Map((oids[i] ? got.get(oids[i]) : []).map((e) => [e.name, e]))]));
    for (const c of changes) {
      const entries = folders.get(parentOf(c.path));
      const was = entries.get(baseOf(c.path));
      if (c.contents === null) entries.delete(baseOf(c.path));
      else {
        const { oid, binary } = saved.get(c.path);
        entries.set(baseOf(c.path), { name: baseOf(c.path), oid, mode: was?.type === 'blob' ? was.mode : FILE_MODE, type: 'blob', binary });
      }
    }
    // From the deepest folder up: each one's new id in the folder above it (an empty folder is gone).
    const made = [];
    for (const dir of dirs.sort((a, b) => depthOf(b) - depthOf(a))) {
      const entries = sortTree([...folders.get(dir).values()]);
      const oid = entries.length ? await treeId(entries) : null;
      if (oid) made.push({ oid, entries });
      if (!dir) {
        if (oid !== after) return;
        continue;
      }
      const above = folders.get(parentOf(dir));
      if (oid) above.set(baseOf(dir), { name: baseOf(dir), oid, mode: TREE_MODE, type: 'tree' });
      else above.delete(baseOf(dir));
    }
    for (const { oid, entries } of made) keep('tree', oid, JSON.stringify({ entries }), true);
    for (const c of changes) {
      if (c.contents === null) continue;
      const contents = fromBase64(c.contents);
      if ((await blobId(contents)) === saved.get(c.path).oid) keep('blob', saved.get(c.path).oid, contents, true);
    }
  }

  /** Logs what the request asked of GitHub and R2 (`what`: which), once R2 is written. */
  function finish(what) {
    const all = Promise.allSettled(pending).then(() => {
      if (count.github || count.read || count.written)
        console.log(
          `Files (${what}): ${count.github} to GitHub, ${count.read} read and ${count.written} written to R2${bucket ? '' : ' (no R2)'}`,
        );
    });
    ctx?.waitUntil(all);
    return ctx ? Promise.resolve() : all;
  }

  return { ask, graphql, head, rootOf, treesOf, foldersAt, entriesAt, filesIn, texts, bytes, save, finish };
}

// A file's text, as GitHub gives it: undefined when its bytes are not UTF-8, or start with a byte order mark, which
// GitHub may give otherwise (both asked of GitHub).
function textOf(bytes) {
  try {
    const text = decoder.decode(bytes);
    return text.startsWith('﻿') ? undefined : text;
  } catch {
    return undefined;
  }
}

const parentOf = (path) => path.split('/').slice(0, -1).join('/');
const baseOf = (path) => path.split('/').at(-1);
const depthOf = (path) => (path ? path.split('/').length : 0);
// The folders a path is in, from the root ('') down.
const ancestorsOf = (path) => path.split('/').map((_, i, parts) => parts.slice(0, i).join('/'));

/** Bytes as base64, as GitHub takes a file's contents. */
export function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function fromBase64(text) {
  if (Uint8Array.fromBase64) return Uint8Array.fromBase64(text);
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
