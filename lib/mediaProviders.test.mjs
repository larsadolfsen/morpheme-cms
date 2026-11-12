import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allowedUrl, creditUrl, hostsOf, mediaItemsFrom, mediaProviderProblems, pathGet, requestOf } from './mediaProviders.mjs';
import { manifestProblems } from './appManifest.mjs';

const provider = {
  id: 'unsplash',
  label: 'Unsplash',
  icon: 'Camera',
  key: true,
  search: {
    url: 'https://api.unsplash.com/search/photos?query={query}&page={page}&per_page={perPage}',
    headers: { Authorization: 'Client-ID {key}' },
  },
  browse: { url: 'https://api.unsplash.com/photos?page={page}&per_page={perPage}', headers: { Authorization: 'Client-ID {key}' } },
  results: 'results',
  totalPages: 'total_pages',
  map: {
    id: 'id',
    thumb: 'urls.small',
    url: 'urls.regular',
    width: 'width',
    height: 'height',
    alt: 'alt_description',
    creditName: 'user.name',
    creditUrl: 'user.links.html',
    downloadTrackingUrl: 'links.download_location',
  },
  creditParams: { utm_source: '{site}', utm_medium: 'referral' },
};
const csp = { 'connect-src': ['api.unsplash.com'], 'img-src': ['images.unsplash.com'] };
const manifest = (extra = {}) => ({ role: 'connector', csp, mediaProviders: [provider], ...extra });
const hosts = hostsOf(csp);

test('a valid provider has no problems', () => assert.deepEqual(mediaProviderProblems(manifest()), []));

test('only a connector may declare providers', () => {
  assert.match(mediaProviderProblems(manifest({ role: 'plugin' })).join(' '), /connector/);
  assert.match(mediaProviderProblems(manifest({ role: undefined })).join(' '), /connector/);
});

test('a request to a host the app does not list in csp is refused', () => {
  const other = { ...provider, search: { url: 'https://evil.example/s?q={query}' } };
  assert.match(mediaProviderProblems(manifest({ mediaProviders: [other] })).join(' '), /evil\.example.*connect-src/);
  assert.match(mediaProviderProblems(manifest({ csp: {} })).join(' '), /api\.unsplash\.com.*connect-src/);
});

test('a host cannot hide behind a placeholder, an IP address, a port or http', () => {
  for (const url of ['https://{query}.example.com/', 'https://1.2.3.4/x', 'https://api.unsplash.com:8443/x', 'http://api.unsplash.com/x']) {
    const bad = { ...provider, search: { url } };
    assert.notDeepEqual(mediaProviderProblems(manifest({ mediaProviders: [bad] })), [], url);
  }
});

test('the map needs the parts the editor shows and keeps no unknown name', () => {
  const { thumb: _t, ...short } = provider.map;
  assert.match(mediaProviderProblems(manifest({ mediaProviders: [{ ...provider, map: short }] })).join(' '), /"thumb"/);
  assert.match(
    mediaProviderProblems(manifest({ mediaProviders: [{ ...provider, map: { ...provider.map, evil: 'x' } }] })).join(' '),
    /unknown name "evil"/,
  );
});

test('{key} in a header needs "key": true; ids are unique; unknown keys fail', () => {
  assert.match(mediaProviderProblems(manifest({ mediaProviders: [{ ...provider, key: false }] })).join(' '), /needs "key": true/);
  assert.match(mediaProviderProblems(manifest({ mediaProviders: [provider, provider] })).join(' '), /repeats the id/);
  assert.match(mediaProviderProblems(manifest({ mediaProviders: [{ ...provider, code: 'x' }] })).join(' '), /unknown key "code"/);
});

test('app.json: mediaProviders belongs to contract 5 only', () => {
  const base = { label: 'U', publisher: 'p', license: 'MIT', icon: 'Camera', hint: 'h', version: '1.0.0' };
  assert.deepEqual(manifestProblems({ ...base, api: 5, ...manifest() }, []), []);
  assert.match(manifestProblems({ ...base, api: 4, mediaProviders: [provider] }, []).join(' '), /"mediaProviders" is not known/);
});

test('requestOf fills in and encodes the query, uses browse without text and puts the key only in headers', () => {
  const r = requestOf(provider, { query: 'red fox&x=1', page: 2, key: 'K' });
  assert.equal(r.url, 'https://api.unsplash.com/search/photos?query=red%20fox%26x%3D1&page=2&per_page=24');
  assert.deepEqual(r.headers, { Authorization: 'Client-ID K' });
  assert.equal(requestOf(provider, { query: '  ', page: 1, key: 'K' }).url, 'https://api.unsplash.com/photos?page=1&per_page=24');
  assert.equal(requestOf(provider, { query: 'a', page: -4, key: 'K' }).url.includes('page=1&'), true);
  assert.ok(!requestOf(provider, { query: 'a', page: 1, key: 'SECRET' }).url.includes('SECRET'));
});

test('pathGet follows own keys only', () => {
  assert.equal(pathGet({ a: { b: 1 } }, 'a.b'), 1);
  assert.equal(pathGet({ a: {} }, 'a.b'), undefined);
  assert.equal(pathGet({}, 'constructor'), undefined);
  assert.deepEqual(pathGet([1], ''), [1]);
});

test('creditUrl adds the provider parameters with the site name', () => {
  assert.equal(
    creditUrl('https://unsplash.com/@ann', provider.creditParams, 'My site'),
    'https://unsplash.com/@ann?utm_source=My+site&utm_medium=referral',
  );
  assert.equal(creditUrl('not a url', provider.creditParams, 'x'), 'not a url');
});

test('allowedUrl accepts only https on a listed host', () => {
  assert.ok(allowedUrl('https://images.unsplash.com/a.jpg', hosts));
  for (const u of [
    'http://images.unsplash.com/a.jpg',
    'https://evil.example/a.jpg',
    'https://images.unsplash.com:444/a',
    'https://u:p@images.unsplash.com/a',
    'javascript:alert(1)',
    42,
  ])
    assert.equal(allowedUrl(u, hosts), null, String(u));
});

test('mediaItemsFrom maps, adds the credit parameters and drops what is wrong', () => {
  const good = {
    id: 'p1',
    width: 4000,
    height: 3000,
    alt_description: 'a fox',
    urls: { small: 'https://images.unsplash.com/s.jpg', regular: 'https://images.unsplash.com/r.jpg' },
    user: { name: 'Ann', links: { html: 'https://unsplash.com/@ann' } },
    links: { download_location: 'https://api.unsplash.com/photos/p1/download' },
  };
  const elsewhere = { ...good, id: 'p2', urls: { small: 'https://evil.example/s.jpg', regular: 'https://images.unsplash.com/r.jpg' } };
  const noName = { ...good, id: 'p3', user: { links: { html: 'https://unsplash.com/@x' } } };
  const trackingElsewhere = { ...good, id: 'p4', links: { download_location: 'https://evil.example/d' } };
  const { items, totalPages } = mediaItemsFrom(
    provider,
    { total_pages: 7, results: [good, elsewhere, noName, trackingElsewhere, 'x'] },
    hosts,
    'Site',
  );
  assert.equal(totalPages, 7);
  assert.deepEqual(
    items.map((i) => i.id),
    ['p1', 'p4'],
  );
  assert.deepEqual(items[0], {
    id: 'p1',
    thumb: 'https://images.unsplash.com/s.jpg',
    url: 'https://images.unsplash.com/r.jpg',
    width: 4000,
    height: 3000,
    alt: 'a fox',
    credit: { name: 'Ann', url: 'https://unsplash.com/@ann?utm_source=Site&utm_medium=referral' },
    downloadTrackingUrl: 'https://api.unsplash.com/photos/p1/download',
  });
  assert.equal(items[1].downloadTrackingUrl, undefined);
  assert.deepEqual(mediaItemsFrom(provider, 'nonsense', hosts, 'S'), { items: [], totalPages: null });
});
