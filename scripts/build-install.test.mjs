import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blobId } from '../lib/git.mjs';
import { bindingMessages, installForBuild, installMessages, writeInstalls, INSTALLS_PATH } from './build-install.mjs';

const NEXT = { theme: 8, apps: [8] }; // a fake contract of these tests: the store's answers do not follow this package's own numbers
const FOLDERS = { themes: 'src/themes', apps: 'src/apps' };
const T = 'theme_fa395ad84690acbd';
const A = 'app_0123456789abcdef';
const enc = (s) => new TextEncoder().encode(s);
const KEY = { MORPHEME_STORE_KEY: 'k', MORPHEME_STORE_URL: 'https://store.test' };

/** A site with an installed theme (and app) as the store left it: files plus their store.json. */
async function site(items) {
  const dir = mkdtempSync(join(tmpdir(), 'build-install-'));
  for (const { root, id, version, files, record = true } of items) {
    const base = join(dir, root, id);
    mkdirSync(base, { recursive: true });
    const known = [];
    for (const [path, text] of Object.entries(files)) {
      writeFileSync(join(base, path), text);
      known.push({ path, oid: await blobId(enc(text)) });
    }
    if (record) writeFileSync(join(base, 'store.json'), JSON.stringify({ version, ref: version, files: known }));
  }
  return dir;
}

/** A fake store: the release answers, the catalog and the files by blob id. */
async function store({ releases = {}, themes = [], apps = [], files = {} }) {
  const blobs = new Map();
  for (const text of Object.values(files)) blobs.set(await blobId(enc(text)), text);
  const asked = [];
  const fetch = async (url, init) => {
    const path = url.replace('https://store.test', '');
    asked.push(path);
    assert.equal(init.headers.authorization, 'Bearer k');
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status });
    if (path.startsWith('/store/releases/')) {
      const r = releases[path.slice('/store/releases/'.length)];
      return r ? json(r) : json({}, 404);
    }
    if (path.startsWith('/store/catalog')) return json({ connected: true, themes, apps });
    if (path.startsWith('/store/files/')) {
      const text = blobs.get(path.slice('/store/files/'.length));
      return text === undefined ? json({}, 404) : new Response(text);
    }
    return json({}, 404);
  };
  return { fetch, asked, blobs };
}

const themeEntry = async (version, text, api = 8) => ({
  id: T,
  handle: 'p/venus',
  version,
  api,
  name: 'Venus',
  author: 'A',
  icon: 'palette',
  files: [{ path: 'theme.css', oid: await blobId(enc(text)) }],
});

test('a theme the target does not accept is replaced in the build by the store version it does', async () => {
  const dir = await site([{ root: FOLDERS.themes, id: T, version: '1.0.0', files: { 'theme.css': 'old' } }]);
  try {
    const s = await store({
      releases: { [`${T}/1.0.0`]: { api: 7 } },
      themes: [await themeEntry('2.0.0', 'new')],
      files: { f: 'new' },
    });
    const r = await installForBuild({ cwd: dir, folders: FOLDERS, next: NEXT, env: KEY, fetch: s.fetch });
    assert.equal(r.status, 'ok');
    assert.deepEqual(r.problems, []);
    assert.deepEqual(
      r.installs.map((i) => [i.id, i.from, i.version]),
      [[T, '1.0.0', '2.0.0']],
    );
    assert.equal(readFileSync(join(dir, FOLDERS.themes, T, 'theme.css'), 'utf8'), 'new');
    assert.equal(JSON.parse(readFileSync(join(dir, FOLDERS.themes, T, 'store.json'), 'utf8')).version, '2.0.0');
    assert.ok(s.asked.some((p) => p === '/store/catalog?app=8&theme=8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an item the target accepts is left as it is', async () => {
  const dir = await site([{ root: FOLDERS.themes, id: T, version: '1.0.0', files: { 'theme.css': 'old' } }]);
  try {
    const s = await store({ releases: { [`${T}/1.0.0`]: { api: 8 } }, themes: [await themeEntry('2.0.0', 'new')] });
    const r = await installForBuild({ cwd: dir, folders: FOLDERS, next: NEXT, env: KEY, fetch: s.fetch });
    assert.deepEqual(r.installs, []);
    assert.equal(readFileSync(join(dir, FOLDERS.themes, T, 'theme.css'), 'utf8'), 'old');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an item with no accepted version is named and nothing is written', async () => {
  const dir = await site([
    { root: FOLDERS.themes, id: T, version: '1.0.0', files: { 'theme.css': 'old' } },
    { root: FOLDERS.apps, id: A, version: '1.0.0', files: { 'index.ts': 'x' } },
  ]);
  try {
    const s = await store({
      releases: { [`${T}/1.0.0`]: { api: 7 }, [`${A}/1.0.0`]: { api: 7 } },
      themes: [await themeEntry('2.0.0', 'new')],
      apps: [], // the app has no version for the target
      files: { f: 'new' },
    });
    const r = await installForBuild({ cwd: dir, folders: FOLDERS, next: NEXT, env: KEY, fetch: s.fetch });
    assert.deepEqual(r.installs, []);
    assert.deepEqual(
      r.problems.map((p) => [p.kind, p.id, p.why]),
      [['app', A, 'no-accepted-version']],
    );
    assert.match(installMessages(r.problems, FOLDERS)[0], new RegExp(`${A}.*accepts`));
    assert.equal(readFileSync(join(dir, FOLDERS.themes, T, 'theme.css'), 'utf8'), 'old');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a site copy without store.json is named, with or without the key', async () => {
  const dir = await site([{ root: FOLDERS.apps, id: A, version: '1.0.0', files: { 'index.ts': 'x' }, record: false }]);
  try {
    const s = await store({});
    for (const env of [KEY, {}]) {
      const r = await installForBuild({ cwd: dir, folders: FOLDERS, next: NEXT, env, fetch: s.fetch });
      assert.deepEqual(
        r.problems.map((p) => [p.id, p.why]),
        [[A, 'site-copy']],
      );
      assert.match(installMessages(r.problems, FOLDERS)[0], new RegExp(`${A}.*own copy`));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an item changed in the site is named, not overwritten', async () => {
  const dir = await site([{ root: FOLDERS.themes, id: T, version: '1.0.0', files: { 'theme.css': 'old' } }]);
  try {
    writeFileSync(join(dir, FOLDERS.themes, T, 'theme.css'), 'edited');
    const s = await store({ releases: { [`${T}/1.0.0`]: { api: 7 } }, themes: [await themeEntry('2.0.0', 'new')], files: { f: 'new' } });
    const r = await installForBuild({ cwd: dir, folders: FOLDERS, next: NEXT, env: KEY, fetch: s.fetch });
    assert.deepEqual(
      r.problems.map((p) => [p.id, p.why]),
      [[T, 'changed']],
    );
    assert.equal(readFileSync(join(dir, FOLDERS.themes, T, 'theme.css'), 'utf8'), 'edited');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('without a key, or with an unreachable store, nothing is installed and the build goes on', async () => {
  const dir = await site([{ root: FOLDERS.themes, id: T, version: '1.0.0', files: { 'theme.css': 'old' } }]);
  try {
    const none = await installForBuild({ cwd: dir, folders: FOLDERS, next: NEXT, env: {}, fetch: async () => assert.fail('no call') });
    assert.deepEqual([none.status, none.installs, none.problems], ['no-key', [], []]);
    const down = await installForBuild({
      cwd: dir,
      folders: FOLDERS,
      next: NEXT,
      env: KEY,
      fetch: async () => {
        throw new Error('offline');
      },
    });
    assert.deepEqual([down.status, down.installs, down.problems], ['unreachable', [], []]);
    assert.equal(readFileSync(join(dir, FOLDERS.themes, T, 'theme.css'), 'utf8'), 'old');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a file that does not match its blob id stops the install before anything is written', async () => {
  const dir = await site([{ root: FOLDERS.themes, id: T, version: '1.0.0', files: { 'theme.css': 'old' } }]);
  try {
    const entry = await themeEntry('2.0.0', 'new');
    const s = await store({ releases: { [`${T}/1.0.0`]: { api: 7 } }, themes: [entry] });
    s.blobs.set(entry.files[0].oid, 'tampered');
    const r = await installForBuild({ cwd: dir, folders: FOLDERS, next: NEXT, env: KEY, fetch: s.fetch });
    assert.equal(r.status, 'unreachable');
    assert.equal(readFileSync(join(dir, FOLDERS.themes, T, 'theme.css'), 'utf8'), 'old');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('writeInstalls leaves the file for the editor, and removes a stale one when there is nothing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'build-install-'));
  try {
    writeInstalls(dir, [{ kind: 'theme', id: T, label: 'Venus', from: '1.0.0', version: '2.0.0', files: [] }], '0.19.6');
    assert.equal(JSON.parse(readFileSync(join(dir, INSTALLS_PATH), 'utf8')).installs[0].version, '2.0.0');
    writeInstalls(dir, [], '0.19.6');
    assert.equal(existsSync(join(dir, INSTALLS_PATH)), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an installed app with a Worker part is written into worker/apps.js, and the names it reads that wrangler.jsonc lacks are named', async () => {
  const dir = await site([{ root: FOLDERS.apps, id: A, version: '1.0.0', files: { 'index.ts': 'x' } }]);
  try {
    mkdirSync(join(dir, 'worker'), { recursive: true });
    writeFileSync(join(dir, 'worker/apps.js'), '// old\n');
    writeFileSync(join(dir, 'wrangler.jsonc'), '{ "d1_databases": [{ "binding": "CONSENT" }] }');
    const code = 'export default { fetch(req, env) { return env.CONSENT && env.SCAN_QUEUE; } };';
    const entry = {
      id: A,
      handle: 'p/scan',
      version: '2.0.0',
      api: 8,
      label: 'Scan',
      publisher: 'P',
      icon: 'mail',
      hint: 'h',
      adds: { blocks: [], lists: [], kinds: [] },
      files: [
        { path: 'index.ts', oid: await blobId(enc('y')) },
        { path: 'worker.js', oid: await blobId(enc(code)) },
      ],
    };
    const s = await store({ releases: { [`${A}/1.0.0`]: { api: 7 } }, apps: [entry], files: { a: 'y', b: code } });
    const r = await installForBuild({ cwd: dir, folders: FOLDERS, next: NEXT, env: KEY, fetch: s.fetch });
    assert.equal(r.status, 'ok');
    assert.match(r.workers, new RegExp(`import ${A.replace(/-(\w)/g, '$1')} from '../src/apps/${A}/worker.js'`));
    assert.equal(readFileSync(join(dir, 'worker/apps.js'), 'utf8'), r.workers);
    assert.deepEqual(r.bindings, [{ id: A, names: ['SCAN_QUEUE'] }]);
    assert.match(bindingMessages(r.bindings)[0], /SCAN_QUEUE.*wrangler\.jsonc/);
    assert.equal(readFileSync(join(dir, 'wrangler.jsonc'), 'utf8').includes('SCAN_QUEUE'), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an app whose newest accepted release is at an older contract the target still reads is installed, not named', async () => {
  const dir = await site([{ root: FOLDERS.apps, id: A, version: '1.0.0', files: { 'index.ts': 'x' } }]);
  try {
    const entry = {
      id: A,
      handle: 'p/mail',
      version: '2.0.0',
      api: 7,
      label: 'Mail',
      publisher: 'P',
      icon: 'mail',
      hint: 'h',
      adds: { blocks: [], lists: [], kinds: [] },
      files: [{ path: 'index.ts', oid: await blobId(enc('y')) }],
    };
    const s = await store({ releases: { [`${A}/1.0.0`]: { api: 6 } }, files: { a: 'y' } });
    // The store answers `?app=n` with the versions at exactly n (the strictest reading): only n = 7 has this app.
    const fetch = async (url, init) => {
      if (url.includes('/store/catalog')) {
        const n = new URL(url).searchParams.get('app');
        return new Response(JSON.stringify({ connected: true, themes: [], apps: n === '7' ? [entry] : [] }));
      }
      return s.fetch(url, init);
    };
    const next = { theme: 8, apps: [7, 8] };
    const r = await installForBuild({ cwd: dir, folders: FOLDERS, next, env: KEY, fetch });
    assert.equal(r.status, 'ok');
    assert.deepEqual(r.problems, []);
    assert.deepEqual(
      r.installs.map((i) => [i.id, i.version]),
      [[A, '2.0.0']],
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
