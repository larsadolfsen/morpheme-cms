// Tests for src/storeFetch.ts: the time limit for store requests and the signal that stops them.
// Run: node --test packages/editor/src/storeFetch.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { timedFetch, STORE_TIMEOUT_MS } from './storeFetch.ts';

test('passes the request on', async () => {
  let recordedUrl;
  let recordedInit;
  const f = async (url, init) => {
    recordedUrl = url;
    recordedInit = init;
    return { ok: true };
  };
  const res = await timedFetch(f, '/api/store/catalog', { method: 'GET' }, 50);
  assert.deepEqual(res, { ok: true });
  assert.equal(recordedUrl, '/api/store/catalog');
  assert.equal(recordedInit.method, 'GET');
  assert.ok(recordedInit.signal instanceof AbortSignal);
});

test('stops a request that hangs', { timeout: 1000 }, async () => {
  // AbortSignal.timeout's timer does not keep Node running, so the hung request holds a timer of its own until the
  // abort: else Node sees nothing left to wait for and ends the run, cancelling this test and the ones after it.
  const f = (url, init) =>
    new Promise((_, reject) => {
      const alive = setTimeout(() => {}, 10_000);
      init.signal.addEventListener('abort', () => {
        clearTimeout(alive);
        reject(new Error('aborted'));
      });
    });
  await assert.rejects(
    (async () => {
      await timedFetch(f, '/x', {}, 50);
    })(),
    { message: 'aborted' },
    1000,
  );
});

test('default limit', async () => {
  let recordedInit;
  const f = async (url, init) => {
    recordedInit = init;
    return { ok: true };
  };
  await timedFetch(f, '/x');
  assert.equal(STORE_TIMEOUT_MS, 15000);
  assert.ok(recordedInit.signal instanceof AbortSignal);
});
