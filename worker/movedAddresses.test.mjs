// Tests of the Worker's moved-address table (worker/movedAddresses.js) and of how onward and redirectFor in
// worker/index.js use it. Run: node --test worker/movedAddresses.test.mjs. Depends on esbuild (index.js reads the site
// through aliases, as wrangler builds it; here a small made-up site).
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { before, describe, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { MOVED_PREFIXES, movedAddress } from './movedAddresses.js';

// The two renames the table gets when the pages are renamed (the table itself is empty until then).
const PREFIXES = [
  ['/blog/kategori/', '/blog/tags/'],
  ['/ny/', '/new/'],
];

describe('movedAddress', () => {
  test('a path under an old prefix gets the new prefix', () => {
    assert.equal(movedAddress('/blog/kategori/news/', PREFIXES), '/blog/tags/news/');
    assert.equal(movedAddress('/ny/about/', PREFIXES), '/new/about/');
  });
  test('the overview itself moves', () => {
    assert.equal(movedAddress('/blog/kategori/', PREFIXES), '/blog/tags/');
    assert.equal(movedAddress('/ny/', PREFIXES), '/new/');
  });
  test('a nested slug and a ? and # part are kept', () => {
    assert.equal(movedAddress('/ny/a/b/', PREFIXES), '/new/a/b/');
    assert.equal(movedAddress('/blog/kategori/x/?page=2#top', PREFIXES), '/blog/tags/x/?page=2#top');
  });
  test('no match leaves it alone', () => {
    for (const path of ['/', '/blog/', '/blog/tags/x/', '/new/x/', '/nyheder/', '/blog/kategorier/x/', '/blog/kategori'])
      assert.equal(movedAddress(path, PREFIXES), undefined, path);
  });
  test('a path that only contains the word in the middle is not moved', () => {
    assert.equal(movedAddress('/om/ny/', PREFIXES), undefined);
    assert.equal(movedAddress('/blog/a/blog/kategori/x/', PREFIXES), undefined);
    assert.equal(movedAddress('/pages/ny/', PREFIXES), undefined);
  });
  test('a new address is never moved again, so there is no loop', () => {
    for (const [, now] of PREFIXES) assert.equal(movedAddress(`${now}x/`, PREFIXES), undefined);
  });
  test('the table is empty until the pages are renamed, so no visitor is sent to a 404', () => {
    assert.deepEqual(MOVED_PREFIXES, []);
    assert.equal(movedAddress('/blog/kategori/x/'), undefined);
  });
});

describe('onward and redirectFor with the table', () => {
  let onward;
  let redirectFor;
  before(async () => {
    const dir = mkdtempSync(join(tmpdir(), 'moved-addresses-'));
    writeFileSync(join(dir, 'config.js'), "export const config = { repo: { owner: 'o', name: 'n', branch: 'main' } };");
    writeFileSync(
      join(dir, 'worker.js'),
      `export const apps = [], appTexts = {}, appWorkers = {}, contact = {};
       export const standard = { front: '/home/', blog: '/journal/' };
       export const moved = { '/old/': '/blog/kategori/x/', '/old-two/': '/old/', '/old-hash/': '/ny/a/#part', '/old-front/': '/home/' };
       export const oldAddresses = { ids: { 7: '/blog/kategori/seven/' }, paths: { '/wp/': '/ny/wp/' } };`,
    );
    const outfile = join(dir, 'index.mjs');
    await build({
      entryPoints: [fileURLToPath(new URL('./index.js', import.meta.url))],
      bundle: true,
      format: 'esm',
      platform: 'node',
      outfile,
      alias: { '@site/config': join(dir, 'config.js'), '@site/worker': join(dir, 'worker.js') },
      plugins: [
        {
          name: 'cloudflare-workers-stub',
          setup(b) {
            b.onResolve({ filter: /^cloudflare:workers$/ }, () => ({ path: 'cloudflare:workers', namespace: 'stub' }));
            b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const env = {};', loader: 'js' }));
          },
        },
      ],
      logLevel: 'silent',
    });
    ({ onward, redirectFor } = await import(pathToFileURL(outfile).href));
  });
  const to = (path) => redirectFor(new URL(`https://site.test${path}`), PREFIXES);

  test('an address under an old prefix goes to the new one, with the query string kept', () => {
    assert.equal(to('/blog/kategori/news/'), '/blog/tags/news/');
    assert.equal(to('/blog/kategori/news/?page=2'), '/blog/tags/news/?page=2');
    assert.equal(to('/ny/a/b/'), '/new/a/b/');
  });
  test('the exact maps win, and a chain ends at the new address in one hop', () => {
    assert.equal(to('/old/'), '/blog/tags/x/');
    assert.equal(to('/old-two/'), '/blog/tags/x/');
    assert.equal(to('/old-hash/'), '/new/a/#part');
    assert.equal(to('/wp/'), '/new/wp/');
    assert.equal(to('/?p=7'), '/blog/tags/seven/');
  });
  test('the front page and the blog page still go to / and /blog/', () => {
    assert.equal(to('/home/'), '/');
    assert.equal(to('/old-front/'), '/');
    assert.equal(to('/journal/'), '/blog/');
  });
  test('an address with no match has no redirect', () => {
    assert.equal(to('/contact/'), undefined);
    assert.equal(to('/blog/tags/x/'), undefined);
    assert.equal(to('/about/ny/'), undefined);
  });
  test('onward moves the end of a chain, keeps # and leaves other addresses', () => {
    assert.equal(onward('/blog/kategori/x/', {}, undefined, PREFIXES), '/blog/tags/x/');
    assert.equal(onward('/blog/kategori/x/#top', {}, undefined, PREFIXES), '/blog/tags/x/#top');
    assert.equal(onward('/a/', { '/a/': '/b/', '/b/': '/ny/c/' }, undefined, PREFIXES), '/new/c/');
    assert.equal(onward('/about/', {}, undefined, PREFIXES), '/about/');
  });
  test('without the table nothing is redirected', () => {
    assert.equal(redirectFor(new URL('https://site.test/blog/kategori/x/')), undefined);
    assert.equal(onward('/blog/kategori/x/', {}), '/blog/kategori/x/');
  });
  test('an address without the trailing slash goes through the same lookup', () => {
    assert.equal(to('/blog/kategori/x/'), '/blog/tags/x/');
  });
});
