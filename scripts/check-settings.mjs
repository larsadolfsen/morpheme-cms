// Checks the settings route (worker/settings.js): the Worker's own code with KV played by a Map and GitHub's answers played
// here. Only someone who can save the site reads or writes settings, each person's are kept under their GitHub user id (the browser
// never sends one), a body that is too big or not settings is refused, and what is kept is the cleaned record. Nothing goes to
// GitHub or Cloudflare. Run: npm run check:worker
import { workerModules } from './worker-modules.mjs';

const [{ handleSettings }] = await workerModules('settings.js');

const problems = [];
const expect = (ok, what) => ok || problems.push(what);

const kv = new Map();
const KV = {
  get: async (key, type) => (kv.has(key) ? (type === 'json' ? JSON.parse(kv.get(key)) : kv.get(key)) : null),
  put: async (key, value) => void kv.set(key, value),
};

// GitHub: "one" and "two" may save the site (user ids 101 and 202), "guest" may only read it, "down" is a sign-in whose user
// GitHub cannot tell.
const calls = [];
const ask = async (url, init) => {
  const token = init?.headers?.authorization?.replace('Bearer ', '');
  calls.push(url);
  const users = { one: 101, two: 202, guest: 303, down: 404 };
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
  handleSettings(
    new Request(`${SITE}/api/settings`, {
      ...init,
      headers: { ...(token && { cookie: `editor_session=${token}` }), 'sec-fetch-site': 'same-origin', ...headers },
    }),
    { NOT_FOUND: KV },
    ask,
  );
const put = (token, body, headers) => call(token, { method: 'PUT', body: typeof body === 'string' ? body : JSON.stringify(body) }, headers);
const read = async (token) => JSON.stringify((await (await call(token)).json()).settings);

expect((await call(null)).status === 401, 'a request without a sign-in was not refused with 401');
expect((await call('guest')).status === 403, 'someone who cannot save the site was not refused with 403');
expect((await put('guest', { density: 'small' })).status === 403, 'someone who cannot save the site could save settings');
expect(
  (await call('one', {}, { 'sec-fetch-site': 'cross-site' })).status === 401,
  'a request from another address was not refused with 401',
);

expect((await read('one')) === 'null', 'a person with no settings did not get { settings: null }');
expect((await put('one', { density: 'small' })).status === 204, 'valid settings did not answer 204');
expect((await read('one')) === '{"density":"small"}', 'the settings read were not the ones saved');
expect(kv.has('settings:101'), 'the key was not settings:<GitHub user id>');

for (const bad of [{ density: 'tiny' }, { density: 2 }, 'not json {', '[]', 'null'])
  expect((await put('one', bad)).status === 400, `${JSON.stringify(bad)} was not refused with 400`);
expect((await put('one', { density: 'x'.repeat(2000) })).status === 413, 'a body of 2 KB was not refused with 413');
expect(
  (await put('one', { density: 'large' }, { 'content-length': '99999' })).status === 413,
  'a content-length over 1 KB was not refused with 413',
);
expect((await read('one')) === '{"density":"small"}', 'a refused body changed the saved settings');

await put('one', { density: 'large', other: 1 });
expect(kv.get('settings:101') === '{"density":"large"}', 'what was kept was not the cleaned record');
await put('one', {});
expect(kv.get('settings:101') === '{"density":"large"}', 'an empty record erased the density');

await put('two', { density: 'medium' });
expect(
  (await read('one')) === '{"density":"large"}' && (await read('two')) === '{"density":"medium"}',
  "one person saw the other one's settings",
);

kv.set('settings:202', '{"density":"huge"}');
expect((await read('two')) === 'null', 'a stored value that is not settings was given as it is');

expect((await call('one', { method: 'DELETE' })).status === 405, 'DELETE was not refused with 405');
expect((await call('down')).status === 502, 'GitHub failing on the user was not answered with 502');
const noStorage = await handleSettings(
  new Request(`${SITE}/api/settings`, { headers: { cookie: 'editor_session=one', 'sec-fetch-site': 'same-origin' } }),
  {},
  ask,
);
expect(noStorage.status === 503, 'a Worker without the NOT_FOUND store was not answered with 503');
expect(
  calls.every((c) => new URL(c).host === 'api.github.com'),
  'something other than GitHub was asked',
);

if (problems.length) {
  console.error(`${problems.length} problems in the settings route:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(
  'The settings route works: only someone who can save the site has settings, kept by GitHub user id, and what is kept is the cleaned record.',
);
