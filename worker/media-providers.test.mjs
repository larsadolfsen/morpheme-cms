import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleMediaProviders } from './media-providers.js';

const provider = {
  id: 'photos',
  label: 'Photos',
  icon: 'Camera',
  key: true,
  search: { url: 'https://api.example.com/search?q={query}&page={page}', headers: { Authorization: 'Key {key}' } },
  results: 'results',
  map: { id: 'id', thumb: 't', url: 'u', width: 'w', height: 'h', alt: 'a', creditName: 'n', creditUrl: 'l' },
};
const media = { gallery: { providers: [provider], hosts: ['api.example.com', 'img.example.com'] } };
const may = { read: true, push: true };

// A D1 stand-in: one table of keys, sealed values kept as given.
function database() {
  const rows = new Map();
  return {
    prepare(sql) {
      return {
        args: [],
        bind(...args) {
          this.args = args;
          return this;
        },
        async run() {
          if (/^INSERT/.test(sql)) rows.set(this.args.slice(0, 2).join('/'), this.args[2]);
          if (/^DELETE/.test(sql)) rows.delete(this.args.join('/'));
        },
        async all() {
          const secret = rows.get(this.args.join('/'));
          return { results: secret ? [{ secret }] : [] };
        },
      };
    },
  };
}

const env = () => ({ CONSENT: database(), MCP_VAULT_KEY: 'k'.repeat(43) });
const call = (e, path, init, deps = {}) =>
  handleMediaProviders(new Request(`https://site.test${path}`, init), e, { media, access: async () => may, site: 'Site', ...deps });

test('signed out and read-only people are refused', async () => {
  assert.equal((await call(env(), '/api/media-providers', {}, { access: async () => null })).status, 401);
  assert.equal((await call(env(), '/api/media-providers', {}, { access: async () => ({ read: false }) })).status, 403);
  const put = { method: 'PUT', body: JSON.stringify({ key: 'x' }) };
  assert.equal(
    (await call(env(), '/api/media-providers/gallery/photos/key', put, { access: async () => ({ read: true, push: false }) })).status,
    403,
  );
});

test('the list says whether a key is still needed, and never gives the key', async () => {
  const e = env();
  let list = await (await call(e, '/api/media-providers')).json();
  assert.deepEqual(list, [{ app: 'gallery', id: 'photos', label: 'Photos', icon: 'Camera', needsKey: true, connected: false }]);
  await call(e, '/api/media-providers/gallery/photos/key', { method: 'PUT', body: JSON.stringify({ key: 'SECRET-KEY' }) });
  list = await (await call(e, '/api/media-providers')).json();
  assert.equal(list[0].connected, true);
  assert.ok(!JSON.stringify(list).includes('SECRET-KEY'));
});

test('a search without a key answers 409; with one it calls the host with the key in the header only', async () => {
  const e = env();
  assert.equal((await call(e, '/api/media-providers/gallery/photos/search?query=fox')).status, 409);
  await call(e, '/api/media-providers/gallery/photos/key', { method: 'PUT', body: JSON.stringify({ key: 'SECRET-KEY' }) });
  const seen = [];
  const ask = async (url, init) => {
    seen.push({ url, init });
    return Response.json({
      results: [
        {
          id: '1',
          t: 'https://img.example.com/t.jpg',
          u: 'https://img.example.com/u.jpg',
          w: 10,
          h: 5,
          a: 'x',
          n: 'Ann',
          l: 'https://example.com/ann',
        },
      ],
    });
  };
  const res = await call(e, '/api/media-providers/gallery/photos/search?query=fox&page=2', {}, { ask });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).items[0].credit.name, 'Ann');
  assert.equal(seen[0].url, 'https://api.example.com/search?q=fox&page=2');
  assert.equal(seen[0].init.headers.Authorization, 'Key SECRET-KEY');
  assert.equal(seen[0].init.redirect, 'manual');
});

test('an image or a tracking call to a host the app did not list is refused and nothing is fetched', async () => {
  const e = env();
  await call(e, '/api/media-providers/gallery/photos/key', { method: 'PUT', body: JSON.stringify({ key: 'K' }) });
  const ask = async () => assert.fail('must not fetch');
  const image = await call(
    e,
    `/api/media-providers/gallery/photos/image?url=${encodeURIComponent('https://evil.example/a.jpg')}`,
    {},
    { ask },
  );
  assert.equal(image.status, 400);
  const track = await call(
    e,
    '/api/media-providers/gallery/photos/track',
    { method: 'POST', body: JSON.stringify({ url: 'http://169.254.169.254/' }) },
    { ask },
  );
  assert.equal(track.status, 400);
});

test('the key goes to the API host on a tracking call and never to an image host', async () => {
  const e = env();
  await call(e, '/api/media-providers/gallery/photos/key', { method: 'PUT', body: JSON.stringify({ key: 'K' }) });
  const seen = [];
  const ask = async (url, init) => (seen.push({ url, headers: init.headers }), new Response('', { status: 200 }));
  await call(
    e,
    '/api/media-providers/gallery/photos/track',
    { method: 'POST', body: JSON.stringify({ url: 'https://api.example.com/d/1' }) },
    { ask },
  );
  await call(
    e,
    '/api/media-providers/gallery/photos/track',
    { method: 'POST', body: JSON.stringify({ url: 'https://img.example.com/d/1' }) },
    { ask },
  );
  assert.equal(seen[0].headers.Authorization, 'Key K');
  assert.deepEqual(seen[1].headers, {});
});

test('an image must be an image and is returned as it is', async () => {
  const e = env();
  await call(e, '/api/media-providers/gallery/photos/key', { method: 'PUT', body: JSON.stringify({ key: 'K' }) });
  const url = encodeURIComponent('https://img.example.com/a.jpg');
  const png = async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png' } });
  assert.equal(
    (await call(e, `/api/media-providers/gallery/photos/image?url=${url}`, {}, { ask: png })).headers.get('content-type'),
    'image/png',
  );
  const html = async () => new Response('<script>', { headers: { 'content-type': 'text/html' } });
  assert.equal((await call(e, `/api/media-providers/gallery/photos/image?url=${url}`, {}, { ask: html })).status, 502);
});

test('an unknown app or provider is not found', async () => {
  assert.equal((await call(env(), '/api/media-providers/nope/photos/search')).status, 404);
  assert.equal((await call(env(), '/api/media-providers/gallery/nope/search')).status, 404);
});
