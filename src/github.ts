// GitHub for the editor, through the site's Worker (packages/editor/worker/editor-github.js): the sign-in (packages/editor/worker/oauth.js) is a
// cookie only the Worker can read (packages/editor/worker/session.js), so the browser never has the token, and every question to GitHub
// goes through the Worker with it. The site's files come from the Worker's cache in R2 (packages/editor/worker/files.js) by their git
// ids, and from this browser when it has them: a file's text is asked for once. Only people with write access to the
// repository can save; GitHub checks that on every commit.

import { config } from '@site/config';
import { blobId } from '../lib/git.mjs';
import { t } from './i18n';

export const REPO = config.repo;

// Where the token was kept before the sign-in moved into the Worker's cookie: removed, so it is not left readable.
const OLD_TOKEN_KEY = 'editor-github-token';
try {
  localStorage.removeItem(OLD_TOKEN_KEY);
} catch {}

// "Log out": the Worker removes the cookie, and GitHub forgets the token.
export async function logout() {
  await fetch('/api/github/logout', { method: 'POST' }).catch(() => {});
}

// Sign in: the Worker sends the browser to GitHub and back, keeps the token in its cookie and opens
// /editor/ again (packages/editor/worker/oauth.js). A redirect, not a popup, so it works in the installed app too.
export function login() {
  location.assign('/oauth/auth?provider=github&scope=repo');
}

export class AuthError extends Error {}

export class ConflictError extends Error {
  /** A file with that name is already there (not: it was changed elsewhere). */
  exists = false;
}

// A question to the Worker's /api/github/<path>, and its answer in JSON.
async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/github/${path}`, {
    cache: 'no-store',
    ...(body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  });
  if (res.status === 401) throw new AuthError(t.app.loggedOut);
  const json = await res.json().catch(() => ({}));
  if (res.status === 409) {
    const conflict = new ConflictError(json.conflict === 'exists' ? t.app.fileExists : t.app.changedElsewhere);
    conflict.exists = json.conflict === 'exists';
    throw conflict;
  }
  if (!res.ok) throw new Error(json.error ?? t.app.githubAnswered(json.status ?? res.status));
  return json;
}

export async function graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch('/api/github/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401) throw new AuthError(t.app.loggedOut);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors?.length) throw new Error(json.errors?.[0]?.message ?? t.app.githubAnswered(res.status));
  return json.data;
}

export type Viewer = { login: string; name: string | null; canSave: boolean };

export async function viewer(): Promise<Viewer> {
  const data = await graphql<{ viewer: { login: string; name: string | null }; repository: { viewerPermission: string } | null }>(
    `
      query ($owner: String!, $name: String!) {
        viewer {
          login
          name
        }
        repository(owner: $owner, name: $name) {
          viewerPermission
        }
      }
    `,
    { owner: REPO.owner, name: REPO.name },
  );
  const permission = data.repository?.viewerPermission ?? '';
  return { ...data.viewer, canSave: ['ADMIN', 'MAINTAIN', 'WRITE'].includes(permission) };
}

// One file in the repository as the editor loaded it: its path, text and git blob id. The blob id
// tells whether the file has been changed elsewhere (another browser, a push) since.
export type RepoFile = { path: string; oid: string; text: string };

/** The commit the branch is at, and its root tree (the files in it). */
export type Head = { commit: string; tree: string };

// A file as the Worker lists it: its blob id, and whether GitHub calls it binary (an image: no text).
type Listed = { path: string; oid: string; binary: boolean };

// The texts of the files this browser has, by their blob ids (a blob id's text never changes): those it loaded and
// saved, and those it kept (cache.ts), so a file's text is asked for once.
const known = new Map<string, string>();

/** Keeps the files' texts by their blob ids (the files from this browser's copy, cache.ts). */
export function rememberTexts(files: RepoFile[]) {
  for (const f of files) known.set(f.oid, f.text);
}

// The files with their text: '' for an image, the rest from this browser or the Worker, 100 at a time.
async function withTexts(listed: Listed[]): Promise<RepoFile[]> {
  const wanted = [...new Set(listed.filter((f) => !f.binary && !known.has(f.oid)).map((f) => f.oid))];
  const parts = [];
  for (let i = 0; i < wanted.length; i += 100) parts.push(wanted.slice(i, i + 100));
  await Promise.all(
    parts.map(async (oids) => {
      const { texts } = await api<{ texts: Record<string, string | null> }>('texts', { oids });
      for (const [oid, text] of Object.entries(texts)) known.set(oid, text ?? '');
    }),
  );
  return listed.map((f) => ({ path: f.path, oid: f.oid, text: f.binary ? '' : (known.get(f.oid) ?? '') }));
}

type Files = Head & { folders: Listed[][]; paths: (Listed | null)[] };

// The files in folders and at paths, at a root tree (`tree`), or at the branch's head.
const listFiles = (ask: { tree?: string; folders?: string[]; depth?: number; paths?: string[] }) => api<Files>('files', ask);

/** The commit the branch is at: a small request, to see whether the files have changed (cache.ts). */
export const head = () => api<Head>('head');

// All files in some folders, with their text, and the commit the branch is at. `depth`: how many
// levels of folders (an app's folder, store.ts, has more). `at`: the branch's head, when it was just asked.
export async function loadFolders<K extends string>(
  folders: Record<K, string>,
  depth = 3,
  at?: Head,
): Promise<{ folders: Record<K, RepoFile[]>; commit: string }> {
  const keys = Object.keys(folders) as K[];
  const listed = await listFiles({ tree: at?.tree, folders: keys.map((k) => folders[k]), depth });
  const files = await withTexts(listed.folders.flat());
  const byPath = new Map(files.map((f) => [f.path, f]));
  return {
    folders: Object.fromEntries(keys.map((k, i) => [k, listed.folders[i].map((f) => byPath.get(f.path)!)])) as Record<K, RepoFile[]>,
    commit: at?.commit ?? listed.commit,
  };
}

// Some single files at the branch's head (`tree`: at another root tree), with their text ('' for an image). A file that
// is not there is left out.
export async function loadFiles(paths: string[], tree?: string): Promise<RepoFile[]> {
  const listed = await listFiles({ tree, paths });
  return withTexts(listed.paths.filter((f): f is Listed => !!f));
}

/** A repository on GitHub: the site's (REPO), or the app store's (store.ts). */
export type Repo = { owner: string; name: string };

// Some files of a repository at a branch or a commit (an app in the store, store.ts), in one request: their blob
// id and their text, or null when they are not text or GitHub gives only part of it (a big file). A file that is not
// there is left out.
export async function loadFrom(repo: Repo, ref: string, paths: string[]): Promise<{ path: string; oid: string; text: string | null }[]> {
  if (!paths.length) return [];
  const data = await graphql<{
    repository: Record<
      string,
      { oid: string; text?: string | null; isBinary?: boolean | null; isTruncated?: boolean | null } | null
    > | null;
  }>(
    `query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) {
      ${paths.map((p, i) => `f${i}: object(expression: ${JSON.stringify(`${ref}:${p}`)}) { oid ... on Blob { text isBinary isTruncated } }`).join('\n')}
    } }`,
    { owner: repo.owner, name: repo.name },
  );
  return paths.flatMap((path, i) => {
    const f = data.repository?.[`f${i}`];
    return f ? [{ path, oid: f.oid, text: f.isBinary || f.isTruncated || f.text == null ? null : f.text }] : [];
  });
}

// A file's bytes by its blob id: an image, which GraphQL gives no content for (renaming one in
// Files). Checked against the id, so an image is never saved broken. `repo`: another repository than the site's
// (an image of an app in the store).
export async function loadBytes(oid: string, address?: string, repo: Repo = REPO): Promise<Uint8Array> {
  // First from the site itself (the same file, no request to the Worker), when it has it unchanged.
  if (address) {
    const res = await fetch(address).catch(() => null);
    const bytes = res?.ok ? new Uint8Array(await res.arrayBuffer()) : null;
    if (bytes && (await blobId(bytes)) === oid) return bytes;
  }
  const other = repo.owner !== REPO.owner || repo.name !== REPO.name;
  const res = await fetch(`/api/github/blob/${oid}${other ? `?repo=${repo.owner}/${repo.name}` : ''}`).catch(() => {
    throw new Error(t.app.imageNotLoaded);
  });
  if (res.status === 401) throw new AuthError(t.app.loggedOut);
  if (!res.ok) throw new Error(t.app.githubAnswered(res.status));
  const bytes = new Uint8Array(await res.arrayBuffer());
  if ((await blobId(bytes)) !== oid) throw new Error(t.app.imageNotWhole);
  return bytes;
}

// When some files were last saved: the time of the last commit that changed each, in one request. A
// new file (no commit yet) is left out.
export async function savedAt(paths: string[]): Promise<Record<string, Date>> {
  if (!paths.length) return {};
  type History = { nodes: { committedDate: string }[] };
  const data = await graphql<{ repository: { ref: { target: Record<string, History> } } }>(
    `query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) {
      ref(qualifiedName: ${JSON.stringify(`refs/heads/${REPO.branch}`)}) { target { ... on Commit {
        ${paths.map((p, i) => `f${i}: history(first: 1, path: ${JSON.stringify(p)}) { nodes { committedDate } }`).join('\n')}
      } } }
    } }`,
    { owner: REPO.owner, name: REPO.name },
  );
  const target = data.repository.ref.target;
  return Object.fromEntries(
    paths.flatMap((path, i) => {
      const last = target[`f${i}`]?.nodes[0];
      return last ? [[path, new Date(last.committedDate)]] : [];
    }),
  );
}

// A file to save: text or bytes (null deletes it), and the blob id it had when loaded (null for a
// new file).
export type Change = { path: string; content: string | Uint8Array | null; oid: string | null };

// Saves files as one commit on the branch, through the Worker. Refuses (ConflictError) when one of them was changed or
// created elsewhere since it was loaded, so nobody's edit is overwritten. Returns the id of the new
// commit and the new blob ids.
export type Saved = { commit: string; blobs: Record<string, string> };

export async function commit(message: string, changes: Change[]): Promise<Saved> {
  const saved = await api<Saved>('commit', {
    message,
    changes: changes.map((c) => ({
      path: c.path,
      oid: c.oid,
      content: c.content === null ? null : base64(typeof c.content === 'string' ? new TextEncoder().encode(c.content) : c.content),
    })),
  });
  // The texts saved are known by their new blob ids.
  for (const c of changes) if (typeof c.content === 'string' && saved.blobs[c.path]) known.set(saved.blobs[c.path], c.content);
  return saved;
}

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

// ---------------------------------------------------------------------------------------------------
// The history: earlier versions of a file, and files that were deleted (Versions.tsx, Deleted.tsx). Which commits
// changed a file is asked of GitHub; the folders and files in them come through the Worker's cache, like the files now.

/** A commit that changed a file: its id, its root tree (the files in it), when, and who saved it (their name on GitHub). */
export type Version = { commit: string; tree: string; at: Date; by: string };

type HistoryNode = {
  oid: string;
  tree: { oid: string };
  committedDate: string;
  author: { name: string | null; user: { name: string | null; login: string } | null };
};

const NODE = 'oid tree { oid } committedDate author { name user { name login } }';

const versionOf = (n: HistoryNode): Version => ({
  commit: n.oid,
  tree: n.tree.oid,
  at: new Date(n.committedDate),
  by: n.author.user?.name || n.author.name || n.author.user?.login || '',
});

/** The commits that changed a file, newest first, a page at a time (`after`: where the last ended). */
export async function versionsOf(path: string, after?: string): Promise<{ versions: Version[]; more: string | null }> {
  const data = await graphql<{
    repository: {
      ref: { target: { history: { nodes: HistoryNode[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } };
    };
  }>(
    `query($owner: String!, $name: String!, $path: String!, $after: String) { repository(owner: $owner, name: $name) {
      ref(qualifiedName: ${JSON.stringify(`refs/heads/${REPO.branch}`)}) { target { ... on Commit {
        history(first: 20, path: $path, after: $after) {
          nodes { ${NODE} }
          pageInfo { hasNextPage endCursor }
        }
      } } }
    } }`,
    { owner: REPO.owner, name: REPO.name, path, after: after ?? null },
  );
  const { nodes, pageInfo } = data.repository.ref.target.history;
  return { versions: nodes.map(versionOf), more: pageInfo.hasNextPage ? pageInfo.endCursor : null };
}

/** A file's text as it was in a version; null when it was not there (deleted in that commit). */
export async function versionText(version: Version, path: string): Promise<string | null> {
  const [file] = await loadFiles([path], version.tree);
  return file ? file.text : null;
}

/** A file that was deleted: its path, its last content (blob id, and text unless it is an image),
 * and when and by whom it was deleted. */
export type DeletedFile = { path: string; oid: string; text: string; at: Date; by: string };

type Entry = { name: string; oid: string; type: string; binary: boolean };

// The folders at paths under root trees (`path` '' the root itself), 200 to a request: their ids and what is in them
// (names, ids and kinds), or null where there is none.
async function foldersAt(at: { root: string; path: string }[]): Promise<({ oid: string; entries: Entry[] } | null)[]> {
  const parts = [];
  for (let i = 0; i < at.length; i += 200) parts.push(at.slice(i, i + 200));
  const answers = await Promise.all(
    parts.map((part) => api<{ trees: ({ oid: string; entries: Entry[] } | null)[] }>('trees', { at: part })),
  );
  return answers.flatMap((a) => a.trees);
}

/** The files deleted from a folder (and the folders in it) in its last `last` commits, newest first,
 * each once, and not one that is there again. A file that went in a commit that also added one to the
 * folder moved (a new address, an image's new name) and is not counted. `text`: whether to get the
 * files' text (not for images). */
export async function deletedFiles(folder: string, { last = 40, text = true } = {}): Promise<DeletedFile[]> {
  const history = await graphql<{
    repository: { ref: { target: { history: { nodes: (HistoryNode & { parents: { nodes: { tree: { oid: string } }[] } })[] } } } };
  }>(
    `query($owner: String!, $name: String!, $path: String!) { repository(owner: $owner, name: $name) {
      ref(qualifiedName: ${JSON.stringify(`refs/heads/${REPO.branch}`)}) { target { ... on Commit {
        history(first: ${last}, path: $path) {
          nodes { ${NODE} parents(first: 1) { nodes { tree { oid } } } }
        }
      } } }
    } }`,
    { owner: REPO.owner, name: REPO.name, path: folder },
  );
  const commits = history.repository.ref.target.history.nodes;
  if (!commits.length) return [];
  // The folder in each commit and in the commit before it.
  const sides = commits.flatMap((c) => [c.tree.oid, c.parents.nodes[0]?.tree.oid]);
  const roots = await foldersAt(sides.flatMap((root) => (root ? [{ root, path: folder }] : [])));
  const found = new Map<string, Entry[]>(roots.flatMap((r) => (r ? [[r.oid, r.entries] as const] : [])));
  let next = 0;
  const rootOid = sides.map((root) => (root ? (roots[next++]?.oid ?? null) : null));

  // What each commit changed in the folder, a level of folders at a time: the trees that differ are
  // compared again, the same ones left alone.
  type Pair = { commit: number; path: string; now: string | null; was: string | null };
  const removed: { commit: number; path: string; oid: string; binary: boolean }[] = [];
  const added = new Set<number>();
  let pairs: Pair[] = commits.map((_, i) => ({ commit: i, path: folder, now: rootOid[2 * i], was: rootOid[2 * i + 1] }));
  pairs = pairs.filter((p) => p.now !== p.was);
  while (pairs.length) {
    const wanted = [...new Set(pairs.flatMap((p) => [p.now, p.was].filter((o): o is string => !!o && !found.has(o))))];
    for (const t of await foldersAt(wanted.map((root) => ({ root, path: '' })))) if (t) found.set(t.oid, t.entries);
    const next: Pair[] = [];
    for (const p of pairs) {
      const now = new Map((p.now ? (found.get(p.now) ?? []) : []).map((e) => [e.name, e]));
      const was = new Map((p.was ? (found.get(p.was) ?? []) : []).map((e) => [e.name, e]));
      for (const [name, e] of was) {
        const there = now.get(name);
        if (there?.oid === e.oid) continue;
        const path = `${p.path}/${name}`;
        if (e.type === 'tree') next.push({ commit: p.commit, path, now: there?.type === 'tree' ? there.oid : null, was: e.oid });
        else if (!there) removed.push({ commit: p.commit, path, oid: e.oid, binary: e.binary });
      }
      for (const [name, e] of now) if (!was.has(name) && (e.type === 'blob' || e.type === 'tree')) added.add(p.commit);
    }
    pairs = next;
  }

  // The newest deletion of each file (the commits are newest first), not one that moved.
  const seen = new Set<string>();
  const gone = removed.sort((a, b) => a.commit - b.commit).filter((r) => !added.has(r.commit) && !seen.has(r.path) && seen.add(r.path));
  if (!gone.length) return [];
  // Still there (put back since, or another file under the same name): not deleted.
  const now = (await listFiles({ paths: gone.map((r) => r.path) })).paths;
  const deleted = gone.filter((_, i) => !now[i]);
  if (!deleted.length) return [];
  const files = text
    ? await withTexts(deleted.map((r) => ({ path: r.path, oid: r.oid, binary: r.binary })))
    : deleted.map((r) => ({ text: '' }));
  return deleted.map((r, i) => {
    const { at, by } = versionOf(commits[r.commit]);
    return { path: r.path, oid: r.oid, text: files[i].text, at, by };
  });
}
