// Checks how the site's Worker gets and keeps a store key from "Connect to Morpheme" (packages/editor/worker/store-connection.js):
// /api/store/connection for GET, POST and DELETE, who may do what, the table with the key (D1 played by Node's SQLite), and
// storeKey(). GitHub and the store are played by a fake fetch that records each request; nothing goes to either.
// Run: npm run check:worker
import { DatabaseSync } from 'node:sqlite';
import { workerModules } from './worker-modules.mjs';

const [{ handleConnection, storeKey, forgetKey }] = await workerModules('store-connection.js', 'session.js', 'store.js');

const problems = [];
const expect = (ok, what) => ok || problems.push(what);

/** D1, as much of it as the Worker uses, on an SQLite database in memory. */
function d1() {
  const db = new DatabaseSync(':memory:');
  const statement = (sql, args = []) => ({
    bind: (...values) => statement(sql, values),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }),
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    first: async (column) => db.prepare(sql).get(...args)?.[column] ?? null,
  });
  return { db, prepare: (sql) => statement(sql), batch: async (list) => Promise.all(list.map((s) => s.run())) };
}
const rowsOf = (store) => store.db.prepare('SELECT site, key FROM store_connection').all();

const SITE = `site_${'a1'.repeat(12)}`;
const KEY = 'isk_x';
const HAND = 'hand-key-for-test';

/** A fake fetch: GitHub says what `repoAccess` says; the store answers with `store(url, init)`. `storeCalls` records its requests. */
function world({ repoAccess = { pull: true, push: true }, store = () => Response.json({ site: SITE, key: KEY }, { status: 201 }) } = {}) {
  const storeCalls = [];
  const ask = async (url, init = {}) => {
    if (String(url).startsWith('https://api.github.com/')) return Response.json({ permissions: repoAccess });
    storeCalls.push({ url: String(url), method: init.method ?? 'GET', headers: init.headers ?? {}, body: init.body });
    return store(String(url), init);
  };
  return { ask, storeCalls };
}

let n = 0;
/** A request from the editor's page; a fresh token each time (the Worker remembers what GitHub said about a token). */
const call = async (w, method, env, { signedIn = true } = {}) => {
  const request = new Request('https://site.example/api/store/connection', {
    method,
    headers: { ...(signedIn ? { cookie: `editor_session=token-${++n}` } : {}), 'sec-fetch-site': 'same-origin' },
  });
  const res = await handleConnection(request, env, {}, w.ask);
  const text = await res.text();
  return { res, text, body: text.startsWith('{') ? JSON.parse(text) : null };
};
/** An env with a fresh database, with a row for each [site, key] given. */
const envWith = async (rows = [], extra = {}) => {
  const CONSENT = d1();
  if (rows.length) {
    await call(world(), 'GET', { CONSENT }); // makes the table on first use
    for (const [site, key] of rows) {
      CONSENT.db.prepare('INSERT INTO store_connection (site, key, connected) VALUES (?, ?, ?)').run(site, key, '2026-11-04T10:00:00.000Z');
    }
  }
  return { CONSENT, ...extra };
};

// Signed out: 401 for each method, and the store is not asked.
for (const method of ['GET', 'POST', 'DELETE']) {
  const w = world();
  const { res } = await call(w, method, await envWith(), { signedIn: false });
  expect(res.status === 401, `uden login var ${method} ${res.status}, ikke 401`);
  expect(w.storeCalls.length === 0, `uden login blev butikken spurgt (${method})`);
}

// Not even allowed to read: 403.
{
  const w = world({ repoAccess: { pull: false, push: false } });
  const { res } = await call(w, 'GET', await envWith());
  expect(res.status === 403, `uden læseret var svaret ${res.status}, ikke 403`);
}

// Read-only: GET works, POST and DELETE are 403, and the store is not asked.
{
  const w = world({ repoAccess: { pull: true, push: false } });
  const env = await envWith();
  const get = await call(w, 'GET', env);
  expect(get.res.status === 200 && get.body.connected === false && get.body.mayChange === false, `GET med kun læseret gav ${get.text}`);
  for (const method of ['POST', 'DELETE']) {
    const { res } = await call(w, method, env);
    expect(res.status === 403, `${method} med kun læseret gav ${res.status}, ikke 403`);
  }
  expect(w.storeCalls.length === 0, 'med kun læseret blev butikken spurgt');
  expect(rowsOf(env.CONSENT).length === 0, 'med kun læseret blev der gemt en række');
}

// Connect: the store gets the origin and owner/name; the row has the key; no answer has the key; a second connect is 409.
{
  const w = world();
  const env = await envWith();
  const { res, text, body } = await call(w, 'POST', env);
  expect(
    res.status === 200 &&
      body.connected === true &&
      body.by === 'button' &&
      body.site === SITE &&
      body.mayChange === true &&
      typeof body.since === 'string',
    `POST gav ${res.status} ${text}`,
  );
  expect(!text.includes(KEY), 'svaret på POST indeholdt nøglen');
  expect(w.storeCalls.length === 1 && w.storeCalls[0].method === 'POST', `butikken blev spurgt ${w.storeCalls.length} gange`);
  expect(w.storeCalls[0]?.url.endsWith('/store/connect'), `adressen var ${w.storeCalls[0]?.url}`);
  const sent = JSON.parse(w.storeCalls[0]?.body ?? '{}');
  expect(sent.address === 'https://site.example' && /^[^/]+\/[^/]+$/.test(sent.repo), `butikken fik ${w.storeCalls[0]?.body}`);
  const rows = rowsOf(env.CONSENT);
  expect(rows.length === 1 && rows[0].site === SITE && rows[0].key === KEY, 'rækken har ikke nøglen');
  const get = await call(w, 'GET', env);
  expect(get.body.by === 'button' && get.body.site === SITE && !get.text.includes(KEY), `GET efter POST gav ${get.text}`);
  const second = await call(w, 'POST', env);
  expect(second.res.status === 409, `en anden POST gav ${second.res.status}, ikke 409`);
  expect(w.storeCalls.length === 1, 'en anden POST spurgte butikken');
  // MORPHEME_STORE_URL is used when set.
  const w2 = world();
  await call(w2, 'POST', await envWith([], { MORPHEME_STORE_URL: 'https://store.example' }));
  expect(w2.storeCalls[0]?.url === 'https://store.example/store/connect', `MORPHEME_STORE_URL blev ikke brugt: ${w2.storeCalls[0]?.url}`);
}

// The store's 429: 429 and no row. Its 500, an answer without a key, or a thrown fetch: 502 and no row.
{
  const env = await envWith();
  const { res, body } = await call(world({ store: () => new Response('{}', { status: 429 }) }), 'POST', env);
  expect(res.status === 429 && body.error === 'busy', `butikkens 429 gav ${res.status}`);
  expect(rowsOf(env.CONSENT).length === 0, 'butikkens 429 gav en række');
}
for (const [what, store] of [
  ['500', () => new Response(`secret ${KEY}`, { status: 500 })],
  ['et svar uden nøgle', () => Response.json({ site: SITE }, { status: 201 })],
  [
    'en netværksfejl',
    () => {
      throw new Error(`no network, ${KEY}`);
    },
  ],
]) {
  const env = await envWith();
  const { res, text, body } = await call(world({ store }), 'POST', env);
  expect(res.status === 502 && body.error === 'store failed', `butikkens ${what} gav ${res.status} ${text}`);
  expect(!text.includes(KEY), `svaret på butikkens ${what} indeholdt nøglen`);
  expect(rowsOf(env.CONSENT).length === 0, `butikkens ${what} gav en række`);
}

// No database (a branch preview): GET says not connected, POST is 503.
{
  const w = world();
  const get = await call(w, 'GET', {});
  expect(get.res.status === 200 && get.body.connected === false, `GET uden CONSENT gav ${get.text}`);
  const post = await call(w, 'POST', {});
  expect(post.res.status === 503 && post.body.error === 'no database', `POST uden CONSENT gav ${post.res.status}`);
  expect(w.storeCalls.length === 0, 'POST uden CONSENT spurgte butikken');
}

// A key set by hand: GET says so, POST and DELETE are 409, and the store is not asked.
{
  const w = world();
  const env = await envWith([], { MORPHEME_STORE_KEY: HAND });
  const get = await call(w, 'GET', env);
  expect(get.body.connected === true && get.body.by === 'hand' && !get.text.includes(HAND), `GET med nøgle i hånden gav ${get.text}`);
  expect((await call(w, 'DELETE', env)).res.status === 409, 'DELETE med nøgle i hånden gav ikke 409');
  expect((await call(w, 'POST', env)).res.status === 409, 'POST med nøgle i hånden gav ikke 409');
  expect(w.storeCalls.length === 0, 'med nøgle i hånden blev butikken spurgt');
}

// Disconnect: on the store's 200 or 401 the row goes (the bearer is the row's key); on 500 or a thrown fetch it stays.
for (const status of [200, 401]) {
  const w = world({ store: () => new Response('{}', { status }) });
  const env = await envWith([[SITE, KEY]]);
  const { res, body, text } = await call(w, 'DELETE', env);
  expect(
    res.status === 200 && body.connected === false && body.mayChange === true,
    `DELETE med butikkens ${status} gav ${res.status} ${text}`,
  );
  expect(rowsOf(env.CONSENT).length === 0, `DELETE med butikkens ${status} lod rækken stå`);
  expect(w.storeCalls[0]?.method === 'DELETE' && w.storeCalls[0].url.endsWith('/store/connect'), 'DELETE spurgte ikke butikken rigtigt');
  expect(w.storeCalls[0]?.headers.authorization === `Bearer ${KEY}`, 'DELETE brugte ikke rækkens nøgle som bearer');
}
for (const store of [
  () => new Response('{}', { status: 500 }),
  () => {
    throw new Error('no network');
  },
]) {
  const env = await envWith([[SITE, KEY]]);
  const { res, body } = await call(world({ store }), 'DELETE', env);
  expect(res.status === 502 && body.error === 'store failed', `DELETE med en fejl i butikken gav ${res.status}`);
  expect(rowsOf(env.CONSENT).length === 1, 'DELETE med en fejl i butikken slettede rækken');
}
// No key at all: DELETE is a quiet 200 and the store is not asked.
{
  const w = world();
  const { res, body } = await call(w, 'DELETE', await envWith());
  expect(res.status === 200 && body.connected === false, `DELETE uden nøgle gav ${res.status}`);
  expect(w.storeCalls.length === 0, 'DELETE uden nøgle spurgte butikken');
}

// Other methods: 405.
expect((await call(world(), 'PUT', await envWith())).res.status === 405, 'PUT gav ikke 405');

// storeKey: the hand key first, then the row, else null; forgetKey deletes the rows.
{
  const env = await envWith([[SITE, KEY]], { MORPHEME_STORE_KEY: HAND });
  const hand = await storeKey(env);
  expect(hand?.key === HAND && hand.by === 'hand', `storeKey med begge gav ${JSON.stringify(hand)}`);
  const row = await storeKey({ CONSENT: env.CONSENT });
  expect(
    row?.key === KEY && row.by === 'button' && row.site === SITE && typeof row.since === 'string',
    `storeKey med en række gav ${JSON.stringify(row)}`,
  );
  expect((await storeKey({ MORPHEME_STORE_KEY: HAND }))?.by === 'hand', 'storeKey uden CONSENT gav ikke nøglen i hånden');
  expect((await storeKey({})) === null, 'storeKey uden noget gav ikke null');
  await forgetKey(env);
  expect(rowsOf(env.CONSENT).length === 0, 'forgetKey slettede ikke rækken');
  expect((await storeKey({ CONSENT: env.CONSENT })) === null, 'storeKey efter forgetKey gav ikke null');
}

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log('Workerens nøgle fra Forbind til Morpheme er i orden.');
