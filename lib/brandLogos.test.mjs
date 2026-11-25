import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BRANDS, brandOf } from './brandLogos.mjs';
import { iconMapEntries } from './materialIconMap.mjs';

test('every brand of the icon map has its file, a single-colour 24 x 24 SVG', () => {
  const mapped = iconMapEntries()
    .filter((e) => e.brand)
    .map((e) => e.brand)
    .sort();
  assert.deepEqual(mapped, [...BRANDS].sort());
  for (const b of BRANDS) {
    const svg = readFileSync(new URL(`../site/brand/${b}.svg`, import.meta.url), 'utf8');
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /fill="currentColor"/);
    assert.doesNotMatch(svg, /<script|href=|#[0-9a-f]{3,6}"/i);
  }
});

test('a stored name and its fill form give the brand, a bare name never (x is the close icon)', () => {
  for (const b of BRANDS) {
    assert.equal(brandOf(`${b}-logo`), b);
    assert.equal(brandOf(`${b}-logo-fill`), b);
    assert.equal(brandOf(b), undefined);
  }
  assert.equal(brandOf('settings'), undefined);
  assert.equal(brandOf('map-pin'), undefined);
});
