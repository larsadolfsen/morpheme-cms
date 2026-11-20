// Tests for lib/materialIcon.mjs: a Material Symbols name, and the order an icon is looked for in. Run: node --test packages/editor/lib/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import {
  MATERIAL_NAME_ALIASES,
  filterIconNames,
  iconLabel,
  inIconCategory,
  materialName,
  materialNames,
  resolveIcon,
  searchIconNames,
} from './materialIcon.mjs';

// site/icons.mjs imports this package by its name, which only works from an installed copy (the demo build writes one; a job
// that has not built has none): point the name at this folder, as the other tests of such modules do (site/theme.test.mjs).
const PACKAGE = '@morphemecms/cms/';
const pkg = new URL('../', import.meta.url);
registerHooks({
  resolve: (specifier, context, next) =>
    specifier.startsWith(PACKAGE) ? next(new URL(specifier.slice(PACKAGE.length), pkg).href, context) : next(specifier, context),
});
const { LUCIDE, MATERIAL_SYMBOLS } = await import('../site/icons.mjs');

const listFiles = { check: 'list-check', 'heart-fill': 'list-heart-fill', heart: 'list-heart' };
const list = (name, weight) => listFiles[weight ? `${name}-${weight}` : name];
const materialFiles = {
  check: 'material-check',
  drag_indicator: 'material-drag',
  'drag_indicator-fill': 'material-drag-fill',
  star: 'material-star',
};
const material = (key) => materialFiles[key];
const phosphorFiles = { 'users-three': 'ph-users-three', star: 'ph-star' };
const phosphor = (name) => phosphorFiles[name];

test('a hyphen is read as an underscore, a name that is no file name is nothing', () => {
  assert.equal(materialName('drag-indicator'), 'drag_indicator');
  assert.equal(materialName('drag_indicator'), 'drag_indicator');
  assert.equal(materialName('10k'), '10k');
  assert.equal(materialName('../x'), undefined);
  assert.equal(materialName('Star'), undefined);
  assert.equal(materialName(''), undefined);
});

test('the list wins over Material for a name both have', () => {
  assert.deepEqual(resolveIcon('check', undefined, { list, material }), { file: 'list-check' });
  assert.deepEqual(resolveIcon('check', 'fill', { list, material }), { file: 'list-check' });
});

test('fill: the list filled, then the list regular, then Material filled, then Material regular', () => {
  assert.deepEqual(resolveIcon('heart', 'fill', { list, material }), { file: 'list-heart-fill' });
  assert.deepEqual(resolveIcon('drag-indicator', 'fill', { list, material }), { file: 'material-drag-fill', fallback: 'drag-indicator' });
  assert.deepEqual(resolveIcon('star', 'fill', { list, material }), { file: 'material-star', fallback: 'star' });
});

test('regular: a name only Material has is Material (hyphens as underscores), marked with the name asked for', () => {
  assert.deepEqual(resolveIcon('drag-indicator', undefined, { list, material }), { file: 'material-drag', fallback: 'drag-indicator' });
});

test('a name neither has is missing; before Material is loaded it is pending', () => {
  assert.deepEqual(resolveIcon('nope', undefined, { list, material, phosphor }), {});
  assert.deepEqual(resolveIcon('Nope!', 'fill', { list, material, phosphor }), {});
  assert.deepEqual(resolveIcon('star', undefined, { list, material: undefined }), { pending: true });
  assert.deepEqual(resolveIcon('check', undefined, { list, material: undefined }), { file: 'list-check' });
});

test('a name Material lacks is Phosphors, after Material; pending until Phosphors set is loaded', () => {
  assert.deepEqual(resolveIcon('users-three', undefined, { list, material, phosphor }), {
    file: 'ph-users-three',
    fallback: 'users-three',
  });
  assert.deepEqual(resolveIcon('star', undefined, { list, material, phosphor }), { file: 'material-star', fallback: 'star' });
  assert.deepEqual(resolveIcon('users-three', undefined, { list, material, phosphor: undefined }), { pending: true });
});

test('the names of the set are its plain files, sorted', () => {
  const paths = ['/m/outlined/b_a.svg', '/m/outlined/a-fill.svg', '/m/outlined/a.svg', '/m/outlined/Bad.svg'];
  assert.deepEqual(materialNames(paths), ['a', 'b_a']);
});

test('a search needs every word, starts first, and an empty one finds nothing', () => {
  const names = ['arrow_back', 'arrow_back_ios', 'keyboard_arrow_left', 'home'];
  assert.deepEqual(searchIconNames(names, 'arrow back'), ['arrow_back', 'arrow_back_ios']);
  assert.deepEqual(searchIconNames(names, 'arrow'), ['arrow_back', 'arrow_back_ios', 'keyboard_arrow_left']);
  assert.deepEqual(searchIconNames(names, '  '), []);
  assert.equal(iconLabel('drag_indicator'), 'drag indicator');
});

test('a category has the icons with one of its words, and combines with a search', () => {
  const names = ['arrow_back', 'home_work', 'mail', 'train', 'arrow_train'];
  assert.ok(inIconCategory('arrow_back', 'arrows'));
  assert.ok(inIconCategory('home_work', 'home'));
  assert.ok(!inIconCategory('mail', 'arrows'));
  assert.deepEqual(filterIconNames(names, '', 'travel'), ['train', 'arrow_train']);
  assert.deepEqual(filterIconNames(names, 'arrow', 'travel'), ['arrow_train']);
  assert.deepEqual(filterIconNames(names, 'arrow', ''), ['arrow_back', 'arrow_train']);
});

test("the editor's Material names are drawn by the pack's icon of their Phosphor name, and each pack's map has it", () => {
  const pack = (name) => ({ gear: 'pack-gear', 'selection-plus': 'pack-selection', 'magnifying-glass': 'pack-search' })[name];
  assert.deepEqual(resolveIcon('settings', undefined, { list: pack, material }), { file: 'pack-gear' });
  assert.deepEqual(resolveIcon('dashboard_customize', undefined, { list: pack, material }), { file: 'pack-selection' });
  assert.deepEqual(resolveIcon('search', undefined, { list: pack, material }), { file: 'pack-search' });
  // The site's list (the glob of Svg in src/icon.tsx) has every file the aliases and the editor's menu draw by name, so a Phosphor pack is not a fallback.
  const globbed = readFileSync(new URL('../src/icon.tsx', import.meta.url), 'utf8')
    .match(/regular\/\{([^}]*)\}/)[1]
    .split(',');
  for (const name of ['dots-three-vertical', ...Object.values(MATERIAL_NAME_ALIASES)])
    assert.ok(globbed.includes(name), `${name} is in the list of Svg`);
  // A list that has the Material name itself keeps it; a pack with neither falls back to Material as before.
  assert.deepEqual(resolveIcon('settings', undefined, { list: (n) => (n === 'settings' ? 'own' : pack(n)), material }), { file: 'own' });
  for (const [materialIcon, phosphorName] of Object.entries(MATERIAL_NAME_ALIASES)) {
    assert.equal(MATERIAL_SYMBOLS[phosphorName], materialIcon, `Material Symbols' map: ${phosphorName}`);
    assert.ok(LUCIDE[phosphorName], `Lucide's map has ${phosphorName}`);
  }
});
