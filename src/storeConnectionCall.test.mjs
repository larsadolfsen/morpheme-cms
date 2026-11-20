// Tests for src/storeConnectionCall.ts: the request for "Connect to Morpheme" and the text of a failure.
// Run: node --test packages/editor/src/storeConnectionCall.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { callConnection } from './storeConnectionCall.ts';

const make = (answer) => {
  const calls = { fetched: [], forgot: 0 };
  const deps = {
    fetch: async (url, init) => {
      calls.fetched.push([url, init.method]);
      if (answer instanceof Error) throw answer;
      return answer;
    },
    forgetCatalog: () => calls.forgot++,
    busy: 'BUSY',
    failed: 'FAILED',
  };
  return { deps, calls };
};
const ok = (body) => ({ ok: true, status: 200, json: async () => body });

test('a read gives the answer and keeps the catalog', async () => {
  const { deps, calls } = make(ok({ connected: false, mayChange: true }));
  assert.deepEqual(await callConnection('GET', deps), { connected: false, mayChange: true });
  assert.deepEqual(calls.fetched, [['/api/store/connection', 'GET']]);
  assert.equal(calls.forgot, 0);
});

test('connect and disconnect make the catalog be read again', async () => {
  for (const method of ['POST', 'DELETE']) {
    const { deps, calls } = make(ok({ connected: false, mayChange: true }));
    await callConnection(method, deps);
    assert.equal(calls.fetched[0][1], method);
    assert.equal(calls.forgot, 1);
  }
});

test('429 says the store is busy', async () => {
  const { deps, calls } = make({ ok: false, status: 429, json: async () => ({}) });
  await assert.rejects(callConnection('POST', deps), { message: 'BUSY' });
  assert.equal(calls.forgot, 0);
});

const failures = [
  { ok: false, status: 502, json: async () => ({}) },
  new Error('offline'),
  { ok: true, status: 200, json: async () => Promise.reject(new Error('not json')) },
];

test('any other failure says the store failed', async () => {
  for (const answer of failures) {
    const { deps, calls } = make(answer);
    await assert.rejects(callConnection('DELETE', deps), { message: 'FAILED' });
    assert.equal(calls.forgot, 0);
  }
});
