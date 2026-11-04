// Tests for lib/materialIcon.mjs: a Material Symbols name, and the order an icon is looked for in. Run: node --test packages/editor/lib/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { materialName, resolveIcon } from './materialIcon.mjs';

const listFiles = { check: 'list-check', 'heart-fill': 'list-heart-fill', heart: 'list-heart' };
const list = (name, weight) => listFiles[weight ? `${name}-${weight}` : name];
const materialFiles = {
  check: 'material-check',
  drag_indicator: 'material-drag',
  'drag_indicator-fill': 'material-drag-fill',
  star: 'material-star',
};
const material = (key) => materialFiles[key];

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
  assert.deepEqual(resolveIcon('nope', undefined, { list, material }), {});
  assert.deepEqual(resolveIcon('Nope!', 'fill', { list, material }), {});
  assert.deepEqual(resolveIcon('star', undefined, { list, material: undefined }), { pending: true });
  assert.deepEqual(resolveIcon('check', undefined, { list, material: undefined }), { file: 'list-check' });
});
