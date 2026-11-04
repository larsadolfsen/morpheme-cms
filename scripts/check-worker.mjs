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
const [{ handleGitHub }, { readFiles, commitFiles }, { handleR2 }, { handlePlan, paidFrom }] = await workerModules(
  'editor-github.js',
  'github.js',
  'r2-status.js',
  'plan-status.js',
);

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
// The Worker's own lines (packages/editor/worker/files.js: "Filer (…): …") are left out.
console.log = (...args) => String(args[0]).startsWith('Filer (') || log(...args);

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
    expect(same(sorted(loaded.folders[key]), filesAt(at.commit, folder)), `${what}: ${folder} er ikke som i git`);
  expect(loaded.commit === head(), `${what}: commit'et er ikke branchens`);
  const partly = (r) =>
    [...r.matchAll(/b\d+: object\(oid: \\"([0-9a-f]+)/g)].every(([, oid]) => truncated.has(oid)) && /b0: object/.test(r);
  return { loaded, github: requests.slice(before).filter((r) => !partly(r)).length };
}

async function run(label, bucket) {
  env = bucket ? { FILES: bucket, GITHUB_PUBLISH_TOKEN: 'publish' } : { GITHUB_PUBLISH_TOKEN: 'publish' };
  const cached = bucket && bucket !== failing;
  const first = await opened(await browser(), `${label}, første åbning`);
  await settle();
  const second = await opened(await browser(), `${label}, anden åbning`);
  if (cached) expect(second.github === 1, `${label}: anden åbning spurgte GitHub ${second.github} gange (kun head)`);
  await settle();

  // A save: a changed post (a page, when the site has no posts yet), a new file in a new folder, another page deleted and
  // a new picture.
  const b = await browser();
  const files = first.loaded.folders;
  const post = [...files.blog, ...files.pages].find((f) => f.path.endsWith('.md'));
  const page = files.pages.find((f) => f.path.endsWith('.md') && f !== post);
  const picture = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 1, 2, 3, ...new TextEncoder().encode(label)]);
  const changes = [
    { path: post.path, content: `${post.text}\nRettet (${label}).\n`, oid: post.oid },
    { path: `${config.folders.data}/ny-${label}/fil.json`, content: `{ "label": ${JSON.stringify(label)} }\n`, oid: null },
    { path: page.path, content: null, oid: page.oid },
    { path: `${config.folders.media}/ny-${label}.webp`, content: picture, oid: null },
  ];
  const saved = await b.commit(`Editor: ret (${label})`, changes);
  expect(saved.commit === head(), `${label}: gem gav ikke det nye commit`);
  for (const c of changes)
    if (c.content !== null)
      expect(saved.blobs[c.path] === out('rev-parse', `HEAD:${c.path}`), `${label}: blob-id'et for ${c.path} er forkert`);
  await settle();
  const after = await opened(await browser(), `${label}, åbning efter gem`);
  if (cached) expect(after.github === 1, `${label}: åbning efter gem spurgte GitHub ${after.github} gange (kun head)`);

  // A file changed or created elsewhere is not overwritten.
  for (const [change, message] of [
    [{ path: post.path, content: 'x', oid: post.oid }, 'ændret et andet sted'],
    [{ path: changes[1].path, content: 'x', oid: null }, 'findes allerede'],
  ])
    try {
      await b.commit('Editor: konflikt', [change]);
      problems.push(`${label}: gem overskrev en fil, der er ${message}`);
    } catch (e) {
      expect(e instanceof b.ConflictError, `${label}: ${message} gav ${e.message}`);
    }

  // Versions: the saved one and the one before it.
  const { versions } = await b.versionsOf(post.path);
  expect(versions[0]?.commit === saved.commit, `${label}: den nyeste version er ikke gemmet`);
  expect((await b.versionText(versions[0], post.path)) === changes[0].content, `${label}: den nyeste versions tekst er forkert`);
  expect((await b.versionText(versions[1], post.path)) === post.text, `${label}: den forrige versions tekst er forkert`);
  expect((await b.versionText(versions[0], page.path)) === null, `${label}: en slettet fil har en tekst`);

  // Deleted files: the page, with its text; restored, it is not.
  const deleted = await b.deletedFiles(config.folders.pages);
  const gone = deleted.find((d) => d.path === page.path);
  expect(gone?.oid === page.oid && gone?.text === page.text && gone?.by === 'Anna', `${label}: den slettede side står ikke under Slettede`);
  await b.commit(`Editor: gendan (${label})`, [{ path: page.path, content: page.text, oid: null }]);
  await settle();
  expect(
    !(await b.deletedFiles(config.folders.pages)).some((d) => d.path === page.path),
    `${label}: en gendannet side står under Slettede`,
  );
  const pictures = await b.deletedFiles(config.folders.media, { text: false });
  expect(!pictures.length, `${label}: der er slettede billeder, som ikke er slettet`);

  // A picture's bytes, and a second time from R2.
  const oid = saved.blobs[changes[3].path];
  expect(same([...(await b.loadBytes(oid))], [...picture]), `${label}: billedets bytes er forkerte`);
  const old = files.media.find((f) => f.path.endsWith('.webp'));
  if (old) {
    expect(same([...(await b.loadBytes(old.oid))], [...bytesOf(old.oid)]), `${label}: et billedes bytes er forkerte`);
    await settle();
    const before = asked;
    await (await browser()).loadBytes(old.oid);
    if (cached) expect(asked === before, `${label}: billedet blev hentet fra GitHub igen`);
  }
  // Single files, and only questions through /graphql.
  const [single] = await b.loadFiles([post.path, 'findes/ikke.md']);
  expect(single?.text === changes[0].content && single.oid === saved.blobs[post.path], `${label}: loadFiles gav ikke filen`);
  try {
    await b.graphql('mutation { deleteRef(input: { refId: "x" }) { clientMutationId } }');
    problems.push(`${label}: /api/github/graphql lod en ændring gå igennem`);
  } catch {}

  // The Worker's own saves (Udgiv planlagt, Cookiescanner).
  const read = await readFiles(env, [post.path, 'findes/ikke.md'], ctx);
  expect(read.head === head() && read.texts[0] === changes[0].content && read.texts[1] === undefined, `${label}: Workeren læste forkert`);
  await commitFiles(
    env,
    read.head,
    `Udgiv planlagt (${label})`,
    [{ path: `${config.folders.data}/worker-${label}.json`, text: '{}\n' }],
    ctx,
  );
  await settle();
  const own = await opened(await browser(), `${label}, åbning efter Workerens gem`);
  if (cached) expect(own.github === 1, `${label}: åbning efter Workerens gem spurgte GitHub ${own.github} gange (kun head)`);
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
  expect(res.status === 401, `en anden sides forespørgsel fik ${res.status}, ikke 401`);
}

const bucket = memoryBucket();
let counts;
try {
  counts = await run('r2', bucket);
  await run('uden-r2', null);
  await run('r2-fejler', failing);
  await settle();

  // R2 caching under "Indstillinger" › "Avanceret" (r2Caching.ts): the Worker's settings have the line and its bucket, and
  // with it on or off they are settings wrangler reads, with the bucket bound as FILES or no bucket; on and off again,
  // they are as they were. And /api/r2 (packages/editor/worker/r2-status.js) says what Cloudflare says of the bucket, only to someone who
  // can save, so the switch is turned on only when Cloudflare has it.
  {
    const { experimental_readRawConfig } = await import('wrangler');
    const text = readFileSync(join(ROOT, config.wrangler), 'utf8');
    const was = r2CachingOn(text);
    expect(was !== null, `${config.wrangler} har ingen linje til R2-caching`);
    if (was !== null) {
      // Where the bucket is kept ("Placering"): placed by Cloudflare or within the EU, each with R2 caching on and off.
      for (const place of [null, 'eu']) {
        const placed = withJurisdiction(text, place);
        expect(jurisdictionOf(placed) === place, `R2-cachingens bucket kan ikke holdes ${place ? `i ${place}` : 'uden jurisdiktion'}`);
        expect(bucketOf(placed) === bucketOf(text), `R2-cachingens placering ændrede bucket'ens navn`);
        expect(
          withJurisdiction(placed, jurisdictionOf(text)) === text,
          `R2-cachingens placering ${place ?? 'automatisk'} og tilbage giver ikke filen igen`,
        );
        for (const on of [true, false]) {
          const changed = withR2Caching(placed, on);
          const file = join(WORK, 'wrangler.jsonc');
          writeFileSync(file, changed);
          const buckets = experimental_readRawConfig({ config: file }).rawConfig.r2_buckets ?? [];
          expect(r2CachingOn(changed) === on, `R2-caching kan ikke slås ${on ? 'til' : 'fra'}`);
          expect(
            on
              ? buckets.length === 1 &&
                  buckets[0].binding === 'FILES' &&
                  buckets[0].bucket_name === bucketOf(changed) &&
                  (buckets[0].jurisdiction ?? null) === place
              : !buckets.length,
            `wrangler læser R2-caching forkert, når den er slået ${on ? 'til' : 'fra'} (${place ?? 'automatisk'})`,
          );
          expect(
            withR2Caching(withR2Caching(placed, on), was) === placed,
            `R2-caching slået ${on ? 'til' : 'fra'} og tilbage giver ikke filen igen`,
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
      expect(got.status === 200 && got.bucket === state && got.bound === true, `/api/r2 sagde ${got.bucket}, ikke ${state}`);
    }
    // A bucket kept within a jurisdiction is found only there, and a jurisdiction R2 does not have is not asked for.
    cloudflare = answers.ready;
    cloudflareJurisdiction = jurisdictionOf(text) ? null : 'eu';
    const elsewhere = await ask();
    expect(elsewhere.bucket === 'no-bucket', `/api/r2 fandt bucket'en uden for dens jurisdiktion (${elsewhere.bucket})`);
    const unknown = await ask(undefined, query('mars'));
    expect(unknown.status === 400, `/api/r2 spurgte om jurisdiktionen mars (${unknown.status}), ikke 400`);
    cloudflareJurisdiction = null;
    r2Env = {};
    const none = await ask();
    expect(none.bucket === 'no-key' && none.bound === false, `/api/r2 uden Workerens nøgle sagde ${none.bucket}`);
    const other = await ask({ cookie: 'editor_session=token', 'sec-fetch-site': 'same-site' });
    expect(other.status === 403, `/api/r2 svarede en anden side med ${other.status}, ikke 403`);
  }

  // /api/plan (packages/editor/worker/plan-status.js): whether the account has Workers Paid, for "Betalt bygning".
  {
    const plan = (id, state) => ({ rate_plan: { id }, ...(state === undefined ? {} : { state }) });
    expect(paidFrom([plan('WORKERS_PAID', 'Paid')]) === true, 'paidFrom: WORKERS_PAID med store bogstaver er ikke betalt');
    expect(paidFrom([plan('workers_paid')]) === true, 'paidFrom: workers_paid uden tilstand er ikke betalt');
    expect(paidFrom([plan('workers_paid', 'trial')]) === true, 'paidFrom: en prøveperiode er ikke betalt');
    expect(paidFrom([plan('workers_paid', 'Cancelled')]) === false, 'paidFrom: en opsagt plan er betalt');
    expect(paidFrom([plan('cf_free', 'Paid'), plan('zone_pro', 'Paid')]) === false, 'paidFrom: en zoneplan er Workers Paid');
    expect(
      paidFrom(undefined) === false && paidFrom({}) === false && paidFrom(null) === false,
      'paidFrom: noget, der ikke er en liste, er betalt',
    );
    const signedIn = { cookie: 'editor_session=token', 'sec-fetch-site': 'same-origin' };
    const askPlan = (headers = signedIn, method = 'GET') =>
      handlePlan(new Request('https://editor.example/api/plan', { headers, method }), r2Env).then(async (r) => ({
        status: r.status,
        ...(await r.json()),
      }));
    const keyed = { CLOUDFLARE_ACCOUNT_ID: 'account', CLOUDFLARE_R2_TOKEN: 'key' };
    r2Env = {};
    expect((await askPlan()).paid === 'no-key', '/api/plan uden Workerens nøgle sagde ikke no-key');
    r2Env = keyed;
    subscriptions = [403, { success: false, errors: [{ code: 10000, message: 'Authentication error' }] }];
    expect((await askPlan()).paid === 'refused', '/api/plan sagde ikke refused, da Cloudflare svarede 403');
    subscriptions = [500, { success: false, errors: [] }];
    expect((await askPlan()).paid === 'failed', '/api/plan sagde ikke failed, da Cloudflare svarede 500');
    subscriptions = [200, { success: true, errors: [], result: [plan('WORKERS_PAID', 'Paid')] }];
    expect((await askPlan()).paid === 'yes', '/api/plan sagde ikke yes med Workers Paid');
    subscriptions = [200, { success: true, errors: [], result: [plan('cf_free', 'Paid')] }];
    expect((await askPlan()).paid === 'no', '/api/plan sagde ikke no uden Workers Paid');
    expect(
      (await askPlan({ cookie: 'editor_session=token', 'sec-fetch-site': 'same-site' })).status === 403,
      '/api/plan svarede en anden side ikke med 403',
    );
    expect((await askPlan(signedIn, 'POST')).status === 405, '/api/plan svarede en POST ikke med 405');
    r2Env = {};
  }

  // Everything in R2 is the repository's, gives its git id, and was written once.
  for (const [key, value] of bucket.objects) {
    const [o, r, kind, oid] = key.split('/');
    expect(o === owner && r === name, `R2: ${key} er ikke sitets repo`);
    if (kind === 'blob') expect((await blobId(value)) === oid, `R2: ${key} giver ikke sit blob-id`);
    else if (kind === 'tree')
      expect((await treeId(JSON.parse(new TextDecoder().decode(value)).entries)) === oid, `R2: ${key} giver ikke sit tree-id`);
    else problems.push(`R2: ${key} er hverken blob eller tree`);
  }
  for (const [key, n] of bucket.puts) expect(n === 1, `R2: ${key} blev skrevet ${n} gange`);
  for (const oid of truncated)
    expect(!bucket.objects.has(`${owner}/${name}/blob/${oid}`), `R2: en fil, GitHub kun gav en del af, blev gemt`);

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
      const label = `et ventende gem på ${minutes} minutter, paidBuilds ${paid}`;
      expect(PUSH.store.has('wait:x') === waiting, `${label}: ${waiting ? 'blev opgivet for tidligt' : 'blev ikke opgivet'}`);
    }
  }
} finally {
  console.log = log;
  rmSync(WORK, { recursive: true, force: true });
}

if (problems.length) {
  console.error(`${problems.length} fejl i Workerens GitHub og cachen i R2:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(
  `Workerens GitHub og cachen i R2 virker: første åbning ${counts.first} forespørgsler til GitHub, anden ${counts.second}, efter et gem ${counts.after}; ` +
    `${bucket.objects.size} objekter i R2. Også uden R2 og med et R2, der fejler.`,
);
