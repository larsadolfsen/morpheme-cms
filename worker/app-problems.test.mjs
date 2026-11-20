// Tests for worker/app-problems.js: GET /api/apps/problems with a fake ASSETS binding and sign-in check.
// No Cloudflare needed.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleAppProblems, PROBLEMS_PATH } from './app-problems.js';

const get = () => new Request('https://site.test/api/apps/problems');
const allow = async () => true;
const assets = (res, seen = []) => ({
  fetch: async (req) => {
    seen.push(new URL(req.url).pathname);
    return res;
  },
});

test('gives the problems file as an array', async () => {
  const list = [{ app: 'a', place: 'hook', error: 'x', message: 'm' }];
  const seen = [];
  const res = await handleAppProblems(get(), { ASSETS: assets(new Response(JSON.stringify(list)), seen) }, allow);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.match(res.headers.get('content-type'), /json/);
  assert.deepEqual(await res.json(), list);
  assert.deepEqual(seen, ['/_apps/_problems.json']);
});

test('no file gives an empty list', async () => {
  const res = await handleAppProblems(get(), { ASSETS: assets(new Response('nope', { status: 404 })) }, allow);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test('no ASSETS gives an empty list', async () => {
  const res = await handleAppProblems(get(), {}, allow);
  assert.deepEqual(await res.json(), []);
});

test('bad JSON or not an array gives an empty list', async () => {
  for (const body of ['{oops', '{"a":1}']) {
    const res = await handleAppProblems(get(), { ASSETS: assets(new Response(body)) }, allow);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), []);
  }
});

test('no sign-in gives 401 and never reads the assets', async () => {
  const seen = [];
  const res = await handleAppProblems(get(), { ASSETS: assets(new Response('[]'), seen) }, async () => false);
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: 'unauthorized' });
  assert.deepEqual(seen, []);
});

test('other methods give 405', async () => {
  const res = await handleAppProblems(new Request('https://site.test/api/apps/problems', { method: 'POST' }), {}, allow);
  assert.equal(res.status, 405);
});

test('the path is where the build writes the problems', async () => {
  const { APP_FILES } = await import('../lib/apps.mjs');
  const { PROBLEMS_FILE } = await import('../lib/appProblems.mjs');
  assert.equal(PROBLEMS_PATH, `/${APP_FILES}/${PROBLEMS_FILE}`);
});
