// The demo's editor without sign-in: the service worker that answers what the editor asks the site's Worker (who is signed in,
// the site's files, a save) from the built demo, with saves kept in this browser (IndexedDB) and a reset. Not in the package:
// `scripts/demo-editor.mjs` (run by `scripts/demo-build.mjs`) writes it to the demo's dist/editor/sw.js, in front of the editor's
// own notification worker, so only the demo's build has it. It answers as the Worker does for a signed-in editor
// (worker/editor-github.js); the made-up content never leaves the browser and nothing goes to GitHub.
importScripts('/editor/sw-notifications.js');

const REPO = '/editor/demo-repo/';
const DB = 'morpheme-demo-editor';
const TEXT = /\.(md|mdx|jsonc?|ya?ml|txt|ts|js|mjs|css|astro|svg)$/;
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// --- Saves: { path -> { text | bytes (base64) | null (deleted), version } } and the commit counter, in IndexedDB.
const open = () =>
  new Promise((done, fail) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('saves');
    req.onsuccess = () => done(req.result);
    req.onerror = () => fail(req.error);
  });
const run = async (mode, work) => {
  const db = await open();
  return new Promise((done, fail) => {
    const tx = db.transaction('saves', mode);
    const out = work(tx.objectStore('saves'));
    tx.oncomplete = () => (db.close(), done(out?.result));
    tx.onerror = () => fail(tx.error);
  });
};
const readAll = () =>
  run('readonly', (store) => {
    const all = store.getAll();
    const keys = store.getAllKeys();
    return {
      get result() {
        return Object.fromEntries(keys.result.map((k, i) => [k, all.result[i]]));
      },
    };
  });
const put = (key, value) => run('readwrite', (store) => store.put(value, key));
const reset = () => run('readwrite', (store) => store.clear());

// --- The built demo's files: a manifest of the site's source (text inline, bytes in demo-repo/bin/).
let manifest;
async function base() {
  if (!manifest) manifest = await (await fetch(`${REPO}manifest.json`)).json();
  return manifest;
}

/** The files now: the demo's, with the saves over them. path -> { oid, text | null (a binary) }. */
async function tree() {
  const { build = '0', files: own } = await base();
  const files = new Map(own.map((f) => [f.path, { oid: `blob:${f.path}:${build}.0`, text: f.text ?? null }]));
  const saves = await readAll();
  for (const [path, s] of Object.entries(saves)) {
    if (path === 'commit') continue;
    if (s.deleted) files.delete(path);
    else files.set(path, { oid: `blob:${path}:${build}.${s.version}`, text: s.text ?? null, saved: s });
  }
  return files;
}
const commitNow = async () => (await readAll()).commit ?? 0;
// The commit, the tree and every file's id carry the build's id (scripts/demo-editor.mjs buildId): the editor keeps the files with the commit
// they are from (src/cache.ts) and a file's text by its id (src/github.ts), so a new build of the demo must be a new commit with new ids, or
// a browser that opened an earlier build shows that one's files.
const head = async () => {
  const n = await commitNow();
  const { build = '0' } = await base();
  return { commit: `commit-${build}-${n}`, tree: `root-${build}-${n}` };
};
const listed = (path, f) => ({
  path,
  oid: f.oid,
  binary: !(f.text !== null || (f.saved && f.saved.bytes === undefined)) && !TEXT.test(path),
});

function filesIn(files, dir, depth) {
  const out = [];
  for (const [path, f] of files) {
    if (!path.startsWith(`${dir}/`)) continue;
    if (path.slice(dir.length + 1).split('/').length > depth) continue;
    out.push(listed(path, f));
  }
  return out;
}

async function text(path, f) {
  if (f.text !== null) return f.text;
  if (f.saved?.bytes !== undefined && TEXT.test(path)) return atob(f.saved.bytes);
  return null;
}

async function graphql(body, files) {
  const query = body.query ?? '';
  const repository = { ref: { target: { oid: (await head()).commit } }, viewerPermission: 'ADMIN' };
  for (const [, key, path] of query.matchAll(/(f\d+): object\(expression: "[^:"]+:([^"]+)"\)/g)) {
    const f = files.get(path);
    repository[key] = f ? { oid: f.oid, text: TEXT.test(path) ? await text(path, f) : null } : null;
  }
  return { data: { viewer: { login: 'demo', name: 'Demo editor' }, repository } };
}

async function github(route, request) {
  if (route === 'logout') return new Response(null, { status: 204 });
  const files = await tree();
  const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
  if (route === 'graphql') return json(await graphql(body, files));
  if (route === 'head') return json(await head());
  if (route === 'files')
    return json({
      ...(await head()),
      folders: (body.folders ?? []).map((dir) => filesIn(files, dir, body.depth ?? 3)),
      paths: (body.paths ?? []).map((p) => (files.has(p) ? listed(p, files.get(p)) : null)),
    });
  if (route === 'trees') return json({ trees: (body.at ?? []).map(() => null) });
  if (route === 'texts') {
    const byOid = new Map([...files].map(([p, f]) => [f.oid, [p, f]]));
    const out = {};
    for (const oid of body.oids ?? []) {
      const found = byOid.get(oid);
      const t = found && (await text(found[0], found[1]));
      if (t !== null && t !== undefined) out[oid] = t;
    }
    return json({ texts: out });
  }
  if (route.startsWith('blob/')) {
    const oid = decodeURIComponent(route.slice(5));
    const found = [...files].find(([, f]) => f.oid === oid);
    if (!found) return json({ error: 'not found' }, 404);
    const [path, f] = found;
    const headers = { 'content-type': 'application/octet-stream', 'cache-control': 'private, max-age=31536000, immutable' };
    if (f.saved?.bytes !== undefined)
      return new Response(
        Uint8Array.from(atob(f.saved.bytes), (c) => c.charCodeAt(0)),
        { headers },
      );
    if (f.text !== null) return new Response(f.text, { headers });
    return new Response((await fetch(`${REPO}bin/${path}`)).body, { headers });
  }
  if (route === 'commit') {
    // The demo's saves never conflict: the one browser is the only editor.
    const n = (await commitNow()) + 1;
    const { build = '0' } = await base();
    const blobs = {};
    for (const c of body.changes ?? []) {
      const version = n;
      if (c.content === null) await put(c.path, { deleted: true, version });
      else {
        blobs[c.path] = `blob:${c.path}:${build}.${version}`;
        const bytes = c.content;
        await put(
          c.path,
          TEXT.test(c.path)
            ? { text: new TextDecoder().decode(Uint8Array.from(atob(bytes), (x) => x.charCodeAt(0))), version }
            : { bytes, version },
        );
      }
    }
    await put('commit', n);
    return json({ commit: `commit-${build}-${n}`, blobs });
  }
  return json({ error: 'not found' }, 404);
}

// What the editor's other screens ask of the Worker, made up as scripts/built-site.mjs does for the screens checks.
const fakes = {
  '/api/dashboard': (request) => (request.method === 'PUT' ? new Response(null, { status: 204 }) : json({ dashboard: null })),
  // No autosave in R2: a save is a commit (kept in the browser), as on a site without R2 caching.
  '/api/autosave': (request) => (request.method === 'GET' ? new Response('', { status: 404 }) : json({ error: 'off' }, 409)),
  '/api/autosave/flush': () => json({ error: 'off' }, 409),
  '/api/r2': () => json({ bound: false, bucket: 'ready' }),
  '/api/store/connection': () => json({ connected: false, mayChange: false }),
  '/api/store/catalog': () => json({ connected: false }),
};

// "Reset": the page asks, and every save is gone; the demo's own content is back.
self.addEventListener('message', (event) => {
  if (event.data?.demoEditor === 'reset') event.waitUntil(reset().then(() => event.source?.postMessage({ demoEditor: 'reset-done' })));
});

// Only the copy the demo's page registers (`/editor/sw.js?demo`, demo-editor-page.js) answers anything. The editor registers
// `/editor/sw.js` itself for its notifications, also in the screens checks, which fake the Worker themselves with Playwright's routes
// and must be left alone: that copy has no fetch handler.
if (new URL(self.location.href).searchParams.has('demo')) {
  self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    const mine = url.pathname.startsWith('/api/github/')
      ? (r) => github(url.pathname.slice('/api/github/'.length), r)
      : fakes[url.pathname];
    if (mine) event.respondWith(Promise.resolve(mine(event.request)).catch((e) => json({ error: String(e) }, 500)));
  });
}
