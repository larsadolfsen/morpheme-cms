import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LOADER, stylesheetLinks, withCriticalCss } from './criticalCss.mjs';

const page = '<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/_astro/a.css"></head><body>x</body></html>';
const read = (href) => (href === '/_astro/a.css' ? 'body{margin:0}' : undefined);

test('finds the site stylesheets only', () => {
  const html =
    '<link rel="stylesheet" href="/_astro/a.css"><link rel="stylesheet" href="https://x.test/b.css"><link rel="icon" href="/f.ico">';
  assert.deepEqual(
    stylesheetLinks(html).map((l) => l.href),
    ['/_astro/a.css'],
  );
});

test('inlines the critical CSS, loads the sheet without blocking, keeps a noscript link', async () => {
  const out = await withCriticalCss(page, read, () => 'body{margin:0}');
  assert.match(
    out,
    /<style data-critical>body\{margin:0\}<\/style><link rel="stylesheet" href="\/_astro\/a\.css" media="print" data-mo-css>/,
  );
  assert.match(out, /<noscript><link rel="stylesheet" href="\/_astro\/a\.css"><\/noscript>/);
  assert.ok(out.includes(`<script>${LOADER}</script></head>`));
});

test('keeps the blocking link when nothing is made', async () => {
  assert.equal(await withCriticalCss(page, read, () => undefined), undefined);
  assert.equal(await withCriticalCss(page, read, () => '  '), undefined);
  assert.equal(
    await withCriticalCss(page, read, () => {
      throw new Error('no');
    }),
    undefined,
  );
  assert.equal(
    await withCriticalCss(
      page,
      () => undefined,
      () => 'a{}',
    ),
    undefined,
  );
  assert.equal(await withCriticalCss(page, read, () => 'a{}</style><script>x</script>'), undefined);
});

test('a page that was done is not done twice', async () => {
  const out = await withCriticalCss(page, read, () => 'a{}');
  assert.equal(await withCriticalCss(out, read, () => 'a{}'), undefined);
});

test('the integration leaves every page as it is when there is no extractor (beasties missing)', async () => {
  const { mkdtempSync, writeFileSync, readFileSync, mkdirSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  const { criticalCss } = await import('./criticalCss.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'critical-'));
  mkdirSync(join(dir, '_astro'));
  writeFileSync(join(dir, '_astro/a.css'), 'body{margin:0}');
  writeFileSync(join(dir, 'index.html'), page);
  const messages = [];
  await criticalCss({ extractor: async () => undefined }).hooks['astro:build:done']({
    dir: pathToFileURL(`${dir}/`),
    logger: { info: (m) => messages.push(m) },
  });
  assert.equal(readFileSync(join(dir, 'index.html'), 'utf8'), page);
  assert.match(messages[0], /no extractor/);
});
