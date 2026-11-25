import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { test } from 'node:test';
import { iconMapEntries, materialNameOf } from './materialIconMap.mjs';

const material = new Set(
  readdirSync(new URL('../node_modules/@material-symbols/svg-400/outlined/', import.meta.url))
    .filter((f) => f.endsWith('.svg') && !f.endsWith('-fill.svg'))
    .map((f) => f.slice(0, -4)),
);
test('every target is a Material Symbols icon', () => {
  const missing = iconMapEntries().filter((e) => e.material && !material.has(e.material));
  assert.deepEqual(missing, []);
});

test('a name the two sets share is not in the map', () => {
  const shared = iconMapEntries().filter((e) => e.material && e.phosphor.replaceAll('-', '_') === e.material);
  // `newspaper` and `storefront` are listed only because their `-fill` forms are the ones the site list holds.
  assert.deepEqual(shared.map((e) => e.phosphor).sort(), ['newspaper', 'storefront']);
});

test('a fill name maps to the filled variant of the same icon', () => {
  assert.deepEqual(materialNameOf('heart-fill'), { name: 'favorite', fill: true, closest: false });
  assert.deepEqual(materialNameOf('map-pin'), { name: 'location_on', fill: false, closest: false });
  assert.equal(materialNameOf('add'), undefined);
});

test('the brand logos are brand-pack names, never a Material icon', () => {
  for (const b of ['facebook', 'x', 'linkedin', 'pinterest', 'github', 'google'])
    assert.deepEqual(materialNameOf(`${b}-logo`), { brand: b });
  assert.deepEqual(materialNameOf('github-logo-fill'), { brand: 'github' });
  assert.ok(iconMapEntries().filter((e) => e.brand).length === 6);
});

test('the reviewed picks (CTO, 24 Nov 2026)', () => {
  assert.equal(materialNameOf('columns-plus-left')?.name, 'add_column_left');
  assert.equal(materialNameOf('columns-plus-right')?.name, 'add_column_right');
  assert.equal(materialNameOf('wave-sine')?.name, 'airwave');
  assert.equal(materialNameOf('flower-lotus')?.name, 'spa');
});
