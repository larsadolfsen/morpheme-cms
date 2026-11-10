// Tests of readsFor (lib/reads.mjs) on the fixture site in lib/fixtures/reads-site/.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { readsFor } from './reads.mjs';

const root = fileURLToPath(new URL('./fixtures/reads-site', import.meta.url));

const ADDRESSES = ['/company/about/', '/first-post/', '/home/'];

test('no scopes give nothing', async () => {
  assert.deepEqual(await readsFor([], root), {});
});

test('pages: published entries, with address, title and blocks, and no text', async () => {
  const { pages, ...rest } = await readsFor(['pages'], root);
  assert.deepEqual(rest, {});
  assert.deepEqual(
    pages.map((p) => p.address),
    ADDRESSES,
  );
  const home = pages.find((p) => p.address === '/home/');
  assert.deepEqual(home, { address: '/home/', title: 'Welcome', blocks: ['hero', 'gallery'] });
  assert.equal(pages.find((p) => p.address === '/company/about/').title, 'About us');
  assert.deepEqual(pages.find((p) => p.address === '/first-post/').blocks, ['gallery']);
  assert.ok(pages.every((p) => !('text' in p)));
});

test('pages with text: each entry has its Markdown body without front matter', async () => {
  const { pages } = await readsFor(['pages', 'pages.text'], root);
  assert.equal(pages.length, 3);
  assert.ok(pages.every((p) => typeof p.text === 'string'));
  const about = pages.find((p) => p.address === '/company/about/');
  assert.equal(about.text, 'We are a small team.');
  assert.ok(pages.every((p) => !p.text.includes('title:')));
});

test('text alone is the same as pages and text', async () => {
  const both = await readsFor(['pages', 'pages.text'], root);
  assert.deepEqual(await readsFor(['pages.text'], root), both);
});

test('drafts, hidden pages and new versions under /ny/ are not in pages', async () => {
  const { pages } = await readsFor(['pages'], root);
  const titles = pages.map((p) => p.title);
  assert.ok(!titles.includes('Draft page'));
  assert.ok(!titles.includes('Later post'));
  assert.ok(!titles.includes('Hidden page'));
  assert.ok(!pages.some((p) => p.address.startsWith('/ny/')));
});

test('cookies: the banner flag and the list, with the file each row comes from', async () => {
  const { cookies, ...rest } = await readsFor(['cookies'], root);
  assert.deepEqual(rest, {});
  assert.deepEqual(cookies, {
    banner: true,
    list: [
      { name: '_ga', provider: 'Google', category: 'statistics', file: 'analytics.json' },
      { name: 'session', provider: 'This site', category: 'necessary', file: 'session.json' },
    ],
  });
});

test('apps: only active apps; a turned-off app is missing', async () => {
  const { apps } = await readsFor(['apps'], root);
  assert.deepEqual(
    apps.map((a) => a.id),
    ['legacy', 'widget'],
  );
});

test('apps: a contract 4 app has its version, merged settings, cookies for them and its csp', async () => {
  const { apps } = await readsFor(['apps'], root);
  const widget = apps.find((a) => a.id === 'widget');
  assert.equal(widget.version, '1.2.3');
  assert.deepEqual(widget.settings, { mode: 'dark', size: 3, trackingId: 'G-123' });
  assert.deepEqual(
    widget.cookies.map((c) => c.name),
    ['widget_mode', '_wid'],
  );
  assert.deepEqual(widget.csp, { script: ['https://widget.example.com'] });
});

test('apps: a contract 3 app has cookies.json, csp.json, saved settings and the version in its index.ts', async () => {
  const { apps } = await readsFor(['apps'], root);
  const legacy = apps.find((a) => a.id === 'legacy');
  assert.equal(legacy.version, '0.4.1');
  assert.deepEqual(legacy.settings, { color: 'red' });
  assert.equal(legacy.cookies.length, 1);
  assert.equal(legacy.cookies[0].name, 'legacy_id');
  assert.equal(legacy.cookies[0].duration, '30 days');
  assert.deepEqual(legacy.csp, { img: ['https://legacy.example.com'] });
});

test('csp.allowed: the hosts in src/data/csp.json', async () => {
  const { 'csp.allowed': allowed, ...rest } = await readsFor(['csp.allowed'], root);
  assert.deepEqual(rest, {});
  assert.deepEqual(allowed, ['https://cdn.example.com', 'https://*.example.org', 'https://api.example.net']);
});

test('only the keys asked for are given', async () => {
  const reads = await readsFor(['cookies', 'csp.allowed'], root);
  assert.deepEqual(Object.keys(reads).sort(), ['cookies', 'csp.allowed']);
});

test('a site without the files gives empty answers', async () => {
  const reads = await readsFor(['pages', 'cookies', 'apps', 'csp.allowed'], root + '/src/nowhere');
  assert.deepEqual(reads, { pages: [], cookies: { banner: false, list: [] }, apps: [], 'csp.allowed': [] });
});
