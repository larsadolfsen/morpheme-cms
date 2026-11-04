// Checks the site's Worker's questions to the store (packages/editor/worker/store.js): /api/store/catalog and /api/store/files/<oid>,
// who may ask, what happens without a key, and the store's refusals and failures. GitHub and the store are played by a fake
// fetch that records each request; nothing goes to either.
// Run: npm run check:worker
import { APP_API, THEME_API } from '../lib/contracts.mjs';
import { workerModules } from './worker-modules.mjs';

const [{ handleStore, STORE_URL }] = await workerModules('store.js', 'session.js');

const problems = [];
const expect = (ok, what) => ok || problems.push(what);

const KEY = 'site-key-for-test';
const OID = 'a'.repeat(40);
const BYTES = new Uint8Array([1, 2, 3, 250]);

/** A fake fetch: GitHub says what `repoAccess` says for a token; the store answers with `store(url, init)`. `storeCalls` records the store's requests. */
function world({ repoAccess = { pull: true, push: false }, store = () => new Response('{}', { status: 200 }) } = {}) {
  const storeCalls = [];
  const ask = async (url, init = {}) => {
    if (String(url).startsWith('https://api.github.com/')) return Response.json({ permissions: repoAccess });
    storeCalls.push({ url: String(url), headers: init.headers ?? {} });
    return store(String(url), init);
  };
  return { ask, storeCalls };
}

let n = 0;
/** A request from the editor's page; a fresh token each time (the Worker remembers what GitHub said about a token). */
const request = (path, { signedIn = true, method = 'GET' } = {}) =>
  new Request(`https://editor.example/api/store/${path}`, {
    method,
    headers: { ...(signedIn ? { cookie: `editor_session=token-${++n}` } : {}), 'sec-fetch-site': 'same-origin' },
  });
const call = async (w, path, env = { MORPHEME_STORE_KEY: KEY }, options) => {
  const res = await handleStore(request(path, options), env, {}, w.ask);
  const bytes = new Uint8Array(await res.clone().arrayBuffer());
  return { res, bytes, text: new TextDecoder().decode(bytes) };
};

// Signed out: 401, and the store is not asked.
{
  const w = world();
  const { res } = await call(w, 'catalog', undefined, { signedIn: false });
  expect(res.status === 401, `uden login var svaret ${res.status}, ikke 401`);
  expect(w.storeCalls.length === 0, 'uden login blev butikken spurgt');
}

// Signed in without the right to read the repository: 403.
{
  const w = world({ repoAccess: { pull: false, push: false } });
  const { res } = await call(w, 'catalog');
  expect(res.status === 403, `uden læseret var svaret ${res.status}, ikke 403`);
  expect(w.storeCalls.length === 0, 'uden læseret blev butikken spurgt');
}

// Without a key: the catalog says "not connected" and files are not found; the store is not asked.
{
  const w = world();
  const catalog = await call(w, 'catalog', {});
  expect(catalog.res.status === 200 && JSON.parse(catalog.text).connected === false, `uden nøgle var kataloget ${catalog.text}`);
  const file = await call(w, `files/${OID}`, {});
  expect(file.res.status === 404, `uden nøgle var en fil ${file.res.status}, ikke 404`);
  expect(w.storeCalls.length === 0, 'uden nøgle blev butikken spurgt');
}

// With a key: one request to the catalog with the contract versions and the bearer, and the store's JSON back.
{
  const w = world({ store: () => Response.json({ apps: [{ id: 'x' }] }) });
  const { res, text } = await call(w, 'catalog');
  expect(res.status === 200 && JSON.parse(text).apps?.[0]?.id === 'x', `kataloget var ${res.status} ${text}`);
  expect(w.storeCalls.length === 1, `butikken blev spurgt ${w.storeCalls.length} gange, ikke 1`);
  expect(w.storeCalls[0]?.url === `${STORE_URL}/store/catalog?app=${APP_API}&theme=${THEME_API}`, `adressen var ${w.storeCalls[0]?.url}`);
  expect(w.storeCalls[0]?.headers.authorization === `Bearer ${KEY}`, 'kataloget blev spurgt uden nøglen som bearer');
  expect(!text.includes(KEY), 'kataloget indeholdt nøglen');
}

// MORPHEME_STORE_URL is used when set.
{
  const w = world();
  await call(w, 'catalog', { MORPHEME_STORE_KEY: KEY, MORPHEME_STORE_URL: 'https://store.example' });
  expect(
    w.storeCalls[0]?.url === `https://store.example/store/catalog?app=${APP_API}&theme=${THEME_API}`,
    `MORPHEME_STORE_URL blev ikke brugt: ${w.storeCalls[0]?.url}`,
  );
}

// A file: only a 40-character oid; the bytes, content-type and cache-control go through.
{
  const w = world();
  const bad = await call(w, 'files/xyz');
  expect(bad.res.status === 404, `oid xyz gav ${bad.res.status}, ikke 404`);
  expect(w.storeCalls.length === 0, 'oid xyz blev spurgt om i butikken');
}
{
  const w = world({
    store: () =>
      new Response(BYTES, {
        status: 200,
        headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' },
      }),
  });
  const { res, bytes } = await call(w, `files/${OID}`);
  expect(res.status === 200 && bytes.join() === BYTES.join(), `filens bytes var ${bytes.join()}`);
  expect(
    res.headers.get('cache-control') === 'public, max-age=31536000, immutable',
    `cache-control var ${res.headers.get('cache-control')}`,
  );
  expect(res.headers.get('content-type') === 'image/png', `content-type var ${res.headers.get('content-type')}`);
  expect(w.storeCalls[0]?.url === `${STORE_URL}/store/files/${OID}`, `filens adresse var ${w.storeCalls[0]?.url}`);
  expect(w.storeCalls[0]?.headers.authorization === `Bearer ${KEY}`, 'filen blev spurgt uden nøglen som bearer');
}
{
  const w = world({ store: () => new Response('no', { status: 404 }) });
  const { res } = await call(w, `files/${OID}`);
  expect(res.status === 404, `en fil butikken ikke har gav ${res.status}, ikke 404`);
}

// The store refuses or fails: 502, and never the key.
for (const [status, error] of [
  [401, 'store refused'],
  [403, 'store refused'],
  [500, 'store failed'],
  [400, 'store failed'],
  [404, 'store failed'],
]) {
  for (const path of ['catalog', ...(status === 404 || status === 400 ? [] : [`files/${OID}`])]) {
    const w = world({ store: () => new Response(`secret ${KEY}`, { status }) });
    const { res, text } = await call(w, path);
    expect(res.status === 502 && JSON.parse(text).error === error, `butikkens ${status} på ${path} gav ${res.status} ${text}`);
    expect(
      !text.includes(KEY) && ![...res.headers.values()].some((v) => v.includes(KEY)),
      `svaret på butikkens ${status} indeholdt nøglen`,
    );
  }
}
{
  const w = world({
    store: () => {
      throw new Error(`no network, ${KEY}`);
    },
  });
  const { res, text } = await call(w, 'catalog');
  expect(res.status === 502 && JSON.parse(text).error === 'store failed', `en netværksfejl gav ${res.status} ${text}`);
  expect(!text.includes(KEY), 'svaret på en netværksfejl indeholdt nøglen');
}

// Other methods and addresses.
{
  const w = world();
  expect((await call(w, 'catalog', undefined, { method: 'POST' })).res.status === 405, 'POST gav ikke 405');
  expect((await call(w, 'other')).res.status === 404, 'en ukendt adresse gav ikke 404');
  expect(w.storeCalls.length === 0, 'en forkert metode eller adresse blev spurgt om i butikken');
}

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log('Workerens spørgsmål til butikken er i orden.');
