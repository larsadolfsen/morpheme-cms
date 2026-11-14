import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../staging-watcher/index.js';

function setup({ next = '0.17.0-next-2', last, hook = 'https://hook', hookStatus = 200 } = {}) {
  const kv = new Map(last ? [['last', last]] : []);
  const calls = [];
  const env = {
    STAGING_DEPLOY_HOOK: hook,
    STATE: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => void kv.set(k, v) },
  };
  const fetchFn = async (url, init) => {
    calls.push(url);
    if (String(url).includes('registry.npmjs.org')) return Response.json({ latest: '0.16.0', next });
    return new Response('', { status: hookStatus });
  };
  return { env, fetchFn, kv, calls };
}

test('a moved next tag calls the hook once and stores the version', async () => {
  const s = setup({ last: '0.17.0-next-1' });
  assert.equal(await check(s.env, s.fetchFn), 'rebuild');
  assert.deepEqual(s.calls.filter((u) => u === 'https://hook'), ['https://hook']);
  assert.equal(s.kv.get('last'), '0.17.0-next-2');
  assert.equal(await check(s.env, s.fetchFn), 'none');
});
test('a failed hook stores nothing, so the next run tries again', async () => {
  const s = setup({ last: '0.17.0-next-1', hookStatus: 500 });
  await assert.rejects(check(s.env, s.fetchFn));
  assert.equal(s.kv.get('last'), '0.17.0-next-1');
});
test('a missing hook secret fails loudly', async () => {
  const s = setup({ last: '0.17.0-next-1', hook: '' });
  await assert.rejects(check(s.env, s.fetchFn), /STAGING_DEPLOY_HOOK/);
});
