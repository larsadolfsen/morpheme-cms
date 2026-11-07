// Tests for feedOf in lib/serviceFeed.mjs: a feed that fails or is slow gives null, a good one gives its JSON.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { feedOf } from './serviceFeed.mjs';

test('a fetcher that throws gives null', async () => {
  const fetcher = async () => {
    throw new Error('down');
  };
  assert.equal(await feedOf('https://x.example/f', fetcher), null);
});

test('a 500 gives null', async () => {
  assert.equal(await feedOf('https://x.example/f', async () => new Response('{}', { status: 500 })), null);
});

test('a body that is not JSON gives null', async () => {
  assert.equal(await feedOf('https://x.example/f', async () => new Response('<html>')), null);
});

test('a good JSON body gives the parsed object, asked with the accept header and cache hint', async () => {
  let seen;
  const body = await feedOf('https://x.example/f', async (url, init) => {
    seen = init;
    return Response.json({ components: [] });
  });
  assert.deepEqual(body, { components: [] });
  assert.equal(seen.headers.accept, 'application/json');
  assert.equal(seen.cf.cacheTtl, 60);
});

// A fetcher that never answers until its request is aborted, as a hung server does.
const hung = (url, init) =>
  new Promise((_, reject) => {
    init.signal.addEventListener('abort', () => reject(init.signal.reason));
  });

test('a feed slower than the timeout gives null', async () => {
  assert.equal(await feedOf('https://x.example/f', hung, 20), null);
});

test('the request carries a signal that aborts after the timeout', async () => {
  let seen;
  await feedOf(
    'https://x.example/f',
    (url, init) => {
      seen = init.signal;
      return hung(url, init);
    },
    20,
  );
  assert.equal(seen.aborted, true);
});
