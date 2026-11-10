// Tests for scripts/retarget-links.mjs and lib/retarget.mjs. Run: node --test scripts/retarget-links.test.mjs
// Depends on node:test and a made-up site in a temporary folder.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { retargetLink, retargetPrefix } from '../lib/retarget.mjs';
import { MOVED_PREFIXES } from '../worker/movedAddresses.js';
import { domainOf, retargetSite } from './retarget-links.mjs';

const OLD = '/blog/kategori/'; // language-ok: an old public address
const TABLE = [
  [OLD, '/blog/tags/'],
  ['/ny/', '/new/'], // language-ok: an old public address
];

describe('retargetPrefix', () => {
  test('Markdown, HTML, JSON and the site domain, with the rest of the address kept', () => {
    const text = `[a](${OLD}x/) <a href="${OLD}y/#top">b</a> {"href":"${OLD}"} &quot;${OLD}z/?p=2&quot; https://site.test${OLD}w/`;
    assert.equal(
      retargetPrefix(text, OLD, '/blog/tags/', 'site.test'),
      '[a](/blog/tags/x/) <a href="/blog/tags/y/#top">b</a> {"href":"/blog/tags/"} &quot;/blog/tags/z/?p=2&quot; https://site.test/blog/tags/w/',
    );
  });
  test('not inside a longer path, and not at all for a prefix that only looks alike', () => {
    const text = `"/blog/a${OLD}x/" "/blog/kategorier/x/" "/blog/kategori" text ${OLD}x/`; // language-ok: old public addresses
    assert.equal(retargetPrefix(text, OLD, '/blog/tags/'), text);
  });
  test('an empty domain never matches everywhere', () => {
    assert.equal(retargetPrefix(`x${OLD}y/`, OLD, '/blog/tags/', ''), `x${OLD}y/`);
    assert.equal(retargetLink(`x/old/ "/old/"`, '/old/', '/new/', ''), 'x/old/ "/new/"');
  });
});

describe('retargetSite', () => {
  const site = mkdtempSync(join(tmpdir(), 'retarget-'));
  const write = (path, text) => {
    mkdirSync(dirname(join(site, path)), { recursive: true });
    writeFileSync(join(site, path), text);
  };
  write('src/site/config.ts', `export default { domain: 'site.test' };`);
  write('src/content/pages/about.md', `See [news](${OLD}news/) and [new](/ny/about/).\n`); // language-ok: an old public address
  write('src/content/posts/p.md', `Nothing here, [home](/).\n`);
  write('src/data/menu.json', JSON.stringify({ items: [{ href: `${OLD}news/` }, { href: `https://site.test${OLD}a/` }] }));
  write('public/page.md', `[x](${OLD}news/)\n`);

  test('reads the domain from the site config', () => assert.equal(domainOf(site), 'site.test'));

  test("the table is the Worker's own list", () => assert.ok(MOVED_PREFIXES.some(([from]) => from === OLD)));

  test('a dry run changes nothing', () => {
    const found = retargetSite(site, { prefixes: TABLE, write: false });
    assert.deepEqual(found.map((f) => f.file).sort(), ['src/content/pages/about.md', 'src/data/menu.json']);
    assert.match(readFileSync(join(site, 'src/data/menu.json'), 'utf8'), /kategori/); // language-ok: old public address
  });

  test('rewrites content and data only, and a second run finds nothing', () => {
    const first = retargetSite(site, { prefixes: TABLE });
    assert.equal(first.length, 2);
    assert.equal(readFileSync(join(site, 'src/content/pages/about.md'), 'utf8'), 'See [news](/blog/tags/news/) and [new](/new/about/).\n');
    assert.match(readFileSync(join(site, 'src/data/menu.json'), 'utf8'), /https:\/\/site\.test\/blog\/tags\/a\//);
    assert.equal(readFileSync(join(site, 'public/page.md'), 'utf8'), `[x](${OLD}news/)\n`);
    assert.deepEqual(retargetSite(site, { prefixes: TABLE }), []);
  });
});
