import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { test } from 'node:test';
import { iconMapEntries, materialNameOf } from './materialIconMap.mjs';

const material = new Set(
  readdirSync(new URL('../node_modules/@material-symbols/svg-400/outlined/', import.meta.url))
    .filter((f) => f.endsWith('.svg') && !f.endsWith('-fill.svg'))
    .map((f) => f.slice(0, -4)),
);
const phosphor = new Set(
  readdirSync(new URL('../icons/phosphor/', import.meta.url))
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.slice(0, -4)),
);

test('every target is a Material Symbols icon', () => {
  const missing = iconMapEntries().filter((e) => !material.has(e.material));
  assert.deepEqual(missing, []);
});

test('a name the two sets share is not in the map', () => {
  const shared = iconMapEntries().filter((e) => e.phosphor.replaceAll('-', '_') === e.material);
  // `newspaper` and `storefront` are listed only because their `-fill` forms are the ones the site list holds.
  assert.deepEqual(shared.map((e) => e.phosphor).sort(), ['newspaper', 'storefront']);
});

test('every name of the site list that Material does not have under the same name is mapped', () => {
  const unmapped = [...phosphor]
    .map((n) => (n.endsWith('-fill') ? n.slice(0, -5) : n))
    .filter((n) => !material.has(n.replaceAll('-', '_')) && !materialNameOf(n));
  assert.deepEqual([...new Set(unmapped)], []);
});

test('a fill name maps to the filled variant of the same icon', () => {
  assert.deepEqual(materialNameOf('heart-fill'), { name: 'favorite', fill: true, closest: false });
  assert.deepEqual(materialNameOf('map-pin'), { name: 'location_on', fill: false, closest: false });
  assert.equal(materialNameOf('add'), undefined);
});

test('the brand logos are marked as the closest icon', () => {
  assert.equal(materialNameOf('github-logo')?.closest, true);
});
