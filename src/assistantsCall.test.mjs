// Tests for src/assistantsCall.ts: the requests for "Assistants" (/api/mcp/connections) and the text of a failure.
// Run: node --test src/assistantsCall.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { callAssistants, lastUsedOf } from './assistantsCall.ts';

const make = (answer) => {
  const fetched = [];
  const deps = {
    fetch: async (url, init) => {
      fetched.push([url, init.method]);
      if (answer instanceof Error) throw answer;
      return answer;
    },
    failed: 'FAILED',
    forbidden: 'FORBIDDEN',
  };
  return { deps, fetched };
};
const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const state = { ready: true, address: 'https://e.example/mcp', mayChange: true, connections: [] };

test('a read asks for the connections and gives the answer', async () => {
  const { deps, fetched } = make(ok(state));
  assert.deepEqual(await callAssistants('GET', undefined, deps), state);
  assert.deepEqual(fetched, [['/api/mcp/connections', 'GET']]);
});

test('Disconnect asks for one connection by its id and gives the list that is left', async () => {
  const { deps, fetched } = make(ok(state));
  await callAssistants('DELETE', 'abc_-1', deps);
  assert.deepEqual(fetched, [['/api/mcp/connections/abc_-1', 'DELETE']]);
});

test('an id is never put in the address as anything but itself', async () => {
  const { deps } = make(ok(state));
  await assert.rejects(() => callAssistants('DELETE', '../x', deps), /FAILED/);
  await assert.rejects(() => callAssistants('DELETE', undefined, deps), /FAILED/);
});

test('403 says the person may not, any other failure and a network error say it failed', async () => {
  await assert.rejects(() => callAssistants('GET', undefined, make({ ok: false, status: 403, json: async () => ({}) }).deps), /FORBIDDEN/);
  await assert.rejects(() => callAssistants('GET', undefined, make({ ok: false, status: 500, json: async () => ({}) }).deps), /FAILED/);
  await assert.rejects(() => callAssistants('GET', undefined, make(new Error('offline')).deps), /FAILED/);
  await assert.rejects(
    () => callAssistants('GET', undefined, make({ ok: true, status: 200, json: async () => Promise.reject(new Error('x')) }).deps),
    /FAILED/,
  );
  await assert.rejects(() => callAssistants('GET', undefined, make(ok({ nope: 1 })).deps), /FAILED/);
});

test('last used: never, or the time', () => {
  assert.equal(lastUsedOf({ lastUsed: null }), null);
  assert.equal(lastUsedOf({ lastUsed: 'not a date' }), null);
  assert.equal(lastUsedOf({ lastUsed: '2026-11-11T10:00:00.000Z' })?.toISOString(), '2026-11-11T10:00:00.000Z');
});
