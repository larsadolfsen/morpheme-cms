// The editor's old address, /editor/, goes on to /edit/ (worker/editor-address.js). No Cloudflare: ASSETS is a fake.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { oldEditorAddress, withOldIcon } from './editor-address.js';

const assets = (files) => ({
  fetch: async (request) => {
    const body = files[new URL(request.url).pathname];
    return body === undefined ? new Response('missing', { status: 404 }) : new Response(body);
  },
});
const ask = (path, files = {}, init = {}) => {
  const request = new Request(`https://site.test${path}`, init);
  return oldEditorAddress(new URL(request.url), request, assets(files));
};

test('/editor/ and everything under it goes on to the same address under /edit/, with the query', async () => {
  for (const [from, to] of [
    ['/editor', '/edit/'],
    ['/editor/', '/edit/'],
    ['/editor/?x=1', '/edit/?x=1'],
    ['/editor/thumbnails.json', '/edit/thumbnails.json'],
    ['/editor/manifest.webmanifest?a=b&c=d', '/edit/manifest.webmanifest?a=b&c=d'],
  ]) {
    const res = await ask(from);
    assert.equal(res.status, 308, from);
    assert.equal(res.headers.get('location'), `https://site.test${to}`, from);
  }
});

test('a POST stays a POST (308) and no other address is touched', async () => {
  assert.equal((await ask('/editor/x', {}, { method: 'POST', body: '{}' })).status, 308);
  for (const path of ['/', '/edit/', '/editors/', '/editor-notes/', '/blog/editor/']) assert.equal(await ask(path), undefined, path);
});

test('the old service worker is answered itself and removes itself; a redirect is not allowed for a worker script', async () => {
  const res = await ask('/editor/sw.js');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /javascript/);
  assert.match(await res.text(), /unregister\(\)/);
});

test('the version is answered at the old address too, from /edit/', async () => {
  const res = await ask('/editor/version.json', { '/edit/version.json': '{"commit":"a"}' });
  assert.equal(res.status, 200);
  assert.equal(await res.text(), '{"commit":"a"}');
});

test('an icon saved at the old place is served there; a missing one goes on to /edit/', async () => {
  assert.equal(await (await ask('/editor/icon-192.png', { '/editor/icon-192.png': 'png' })).text(), 'png');
  const res = await ask('/editor/icon-192.png');
  assert.equal(res.status, 308);
  assert.equal(res.headers.get('location'), 'https://site.test/edit/icon-192.png');
});

test('an icon at /edit/ that the site has only at the old place is served from there', async () => {
  const url = new URL('https://site.test/edit/icon-512.png');
  const miss = new Response('missing', { status: 404 });
  const old = await withOldIcon(url, new Request(url), assets({ '/editor/icon-512.png': 'old' }), miss);
  assert.equal(await old.text(), 'old');
  assert.equal(await withOldIcon(url, new Request(url), assets({}), miss), miss);
  const ok = new Response('new');
  assert.equal(await withOldIcon(url, new Request(url), assets({ '/editor/icon-512.png': 'old' }), ok), ok);
});
