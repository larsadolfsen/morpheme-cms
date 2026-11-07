// Tests for feedOf in lib/serviceFeed.mjs: a feed that fails in any way gives null, a good one gives its JSON.
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
