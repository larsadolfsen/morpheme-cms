// Checks the dashboard route (worker/dashboard.js): the Worker's own code with KV played by a Map and GitHub's answers played
// here. Only someone who can save the site reads or writes a dashboard, each person's is kept under their GitHub user id
// (the browser never sends one), a body that is too big or not a dashboard is refused, and what is kept is the cleaned
// record. Nothing goes to GitHub or Cloudflare. Run: npm run check:worker
import { workerModules } from './worker-modules.mjs';

const [{ handleDashboard }] = await workerModules('dashboard.js');

const problems = [];
const expect = (ok, what) => ok || problems.push(what);

/** KV, as much of it as the Worker uses, in a Map: the NOT_FOUND namespace, which also keeps the 404 counts. */
const kv = new Map();
const KV = {
  get: async (key, type) => (kv.has(key) ? (type === 'json' ? JSON.parse(kv.get(key)) : kv.get(key)) : null),
  put: async (key, value) => void kv.set(key, value),
};

// GitHub: the tokens "one" and "two" may save the site (user ids 101 and 202), "guest" may only read it, "down" is a
// sign-in whose user GitHub cannot tell, "odd" one whose id is not a number.
const calls = [];
const ask = async (url, init) => {
  const token = init?.headers?.authorization?.replace('Bearer ', '');
  calls.push(url);
  const users = { one: 101, two: 202, guest: 303, down: 404, odd: 'x' };
  if (url === 'https://api.github.com/user') {
    if (token === 'down') return new Response(null, { status: 500 });
    return token in users ? Response.json({ id: users[token] }) : new Response(null, { status: 401 });
  }
  if (token === 'guest') return Response.json({ permissions: { pull: true, push: false } });
  if (token in users) return Response.json({ permissions: { pull: true, push: true } });
  return new Response(null, { status: 401 });
};

const SITE = 'https://site.example';
const call = (token, init = {}, headers = {}) =>
  handleDashboard(
    new Request(`${SITE}/api/dashboard`, {
      ...init,
      headers: { ...(token && { cookie: `editor_session=${token}` }), 'sec-fetch-site': 'same-origin', ...headers },
    }),
    { NOT_FOUND: KV },
    ask,
  );
const put = (token, body, headers) => call(token, { method: 'PUT', body: typeof body === 'string' ? body : JSON.stringify(body) }, headers);

const mine = { version: 1, widgets: [{ id: 'a', widget: 'cms:status', settings: { days: 7 } }] };

// Who may.
expect((await call(null)).status === 401, 'a request without a sign-in was not refused with 401');
expect((await call('nobody')).status === 401, 'a sign-in GitHub does not know was not refused with 401');
expect((await call('guest')).status === 403, 'someone who cannot save the site was not refused with 403');
expect((await put('guest', mine)).status === 403, 'someone who cannot save the site could save a dashboard');
expect(
  (await call('one', {}, { 'sec-fetch-site': 'cross-site' })).status === 401,
  'a request from another address was not refused with 401',
);

// Reading and saving.
const empty = await call('one');
expect(empty.status === 200 && (await empty.json()).dashboard === null, 'a person with no dashboard did not get { dashboard: null }');
const saved = await put('one', mine);
expect(saved.status === 204, `a valid dashboard answered ${saved.status}, not 204`);
const back = await call('one');
expect(JSON.stringify((await back.json()).dashboard) === JSON.stringify(mine), 'the dashboard read was not the one saved');

// What is refused.
expect((await put('one', { version: 2, widgets: [] })).status === 400, 'version 2 was not refused with 400');
expect((await put('one', 'not json {')).status === 400, 'a body that is not JSON was not refused with 400');
expect(
  (await put('one', { version: 1, widgets: [{ widget: 'cms:status', settings: {} }] })).status === 400,
  'a placement without an id was not refused with 400',
);
const big = (text) => ({ version: 1, widgets: [{ id: 'a', widget: 'cms:status', settings: { text } }] });
expect((await put('one', big('x'.repeat(17 * 1024)))).status === 413, 'a body of about 17 KB was not refused with 413');
expect(
  (await put('one', big('\u00e5'.repeat(9 * 1024)))).status === 413,
  'a body of 18 KB in bytes, 9K characters, was not refused with 413',
);
expect(
  (await put('one', big('x'.repeat(100)), { 'content-length': '99999' })).status === 413,
  'a content-length over 16 KB was not refused with 413',
);
expect(JSON.stringify((await (await call('one')).json()).dashboard) === JSON.stringify(mine), 'a refused body changed the saved dashboard');

// The stored value is the cleaned record.
await put('one', { version: 1, widgets: [{ id: 'b', widget: 'cms:status', extra: true }], more: 1 });
expect(
  kv.get('dashboard:101') === '{"version":1,"widgets":[{"id":"b","widget":"cms:status","settings":{}}]}',
  'what was kept was not the cleaned record',
);
await put('one', mine);

// Each person has their own, by GitHub user id.
const theirs = { version: 1, widgets: [{ id: 'c', widget: 'cms:continue', settings: {} }] };
await put('two', theirs);
expect([...kv.keys()].sort().join() === 'dashboard:101,dashboard:202', `the keys were ${[...kv.keys()].sort().join()}`);
expect(JSON.stringify((await (await call('one')).json()).dashboard) === JSON.stringify(mine), "one person saw the other one's dashboard");
expect(
  JSON.stringify((await (await call('two')).json()).dashboard) === JSON.stringify(theirs),
  'the other person did not get their own dashboard',
);

// A stored value that is no dashboard reads as none.
kv.set('dashboard:202', '{"version":9}');
expect((await (await call('two')).json()).dashboard === null, 'a stored value that is not a dashboard was given as it is');

// Methods, GitHub failing, storage missing.
expect((await call('one', { method: 'DELETE' })).status === 405, 'DELETE was not refused with 405');
expect((await call('down')).status === 502, 'GitHub failing on the user was not answered with 502');
expect((await call('odd')).status === 502, 'a user id that is not a number was not answered with 502');
const noStorage = await handleDashboard(
  new Request(`${SITE}/api/dashboard`, { headers: { cookie: 'editor_session=one', 'sec-fetch-site': 'same-origin' } }),
  {},
  ask,
);
expect(noStorage.status === 503, 'a Worker without the NOT_FOUND store was not answered with 503');
expect(
  calls.every((c) => new URL(c).host === 'api.github.com'),
  'something other than GitHub was asked',
);

if (problems.length) {
  console.error(`${problems.length} problems in the dashboard route:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(
  'The dashboard route works: only someone who can save the site has one, kept by GitHub user id, and what is kept is the cleaned record.',
);
