// The UI components page (`componentsPath`, pages/components.astro) is only for the demo and morpheme-staging: a site has none unless it sets the path.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { defineSite } from './defineSite.mjs';

const own = { name: 'Site', domain: 'example.com' };
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('a site has no UI components page unless it sets the path', () => {
  const site = defineSite(own);
  assert.equal(site.componentsPath, '');
  assert.ok(!site.reserved.includes(''), 'an empty path reserves nothing');
});

test('the path is reserved, so no page can have its address', () => {
  const site = defineSite({ ...own, componentsPath: '/ui/' });
  assert.equal(site.componentsPath, '/ui/');
  assert.ok(site.reserved.includes('/ui/'));
});

test('the demo sets it, the starter (every new site) does not', () => {
  assert.match(read('demo/src/site/config.ts'), /componentsPath: '\/ui\/'/);
  assert.doesNotMatch(read('starter/src/site/config.ts'), /componentsPath/);
});

test('the page and its route follow the setting: injected only with a path, in NOINDEX, one gallery for the editor and the page', () => {
  assert.match(read('astro.mjs'), /componentsPath \? \{ \[componentsPath\]: 'components\.astro' \} : \{\}/);
  assert.match(read('site/noindex.mjs'), /config\.componentsPath \? \[config\.componentsPath\] : \[\]/);
  assert.match(read('pages/components.astro'), /<ComponentGallery client:only="react" \/>/);
  assert.match(read('src/BlockParts.tsx'), /<ComponentGallery editor \/>/);
});
