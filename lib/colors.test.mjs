// Tests for lib/colors.ts. Run: node --test lib/colors.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { oldColorNames, pageColor } from './colors.ts';

test('the page colour of the editor is Surface', () => {
  assert.equal(pageColor({ surface: '#f9f9ff', 'surface-container': '#ededf4' }), '#f9f9ff');
});

const OLD = {
  bg: '#f6f4f1',
  surface: '#ffffff',
  tint: '#eee',
  ink: '#111',
  muted: '#555',
  line: '#ddd',
  accent: '#a3345a',
  'accent-hover': '#8a2a4a',
  'on-accent': '#fff',
  'accent-container': '#fdd',
  'on-accent-container': '#400',
};
const renames = (list) => list.map((r) => `${r.mode} ${r.from}>${r.to}`);

test('an old file lists its old names with the new ones, in the order of the mapping, for both modes', () => {
  const found = oldColorNames({ light: OLD, dark: OLD });
  assert.deepEqual(
    found.filter((r) => r.mode === 'light').map((r) => [r.from, r.to]),
    [
      ['surface', 'surface-container-lowest'],
      ['bg', 'surface'],
      ['tint', 'surface-container-high'],
      ['ink', 'on-surface'],
      ['muted', 'on-surface-variant'],
      ['line', 'outline-variant'],
      ['accent', 'primary'],
      ['accent-hover', null],
      ['on-accent', 'on-primary'],
      ['accent-container', 'primary-container'],
      ['on-accent-container', 'on-primary-container'],
    ],
  );
  assert.equal(found.length, 22);
  assert.equal(found[11].mode, 'dark');
});

test('a file in the new names has no old names', () => {
  const set = { surface: '#fff', 'on-surface': '#000', primary: '#a3345a', 'surface-container-lowest': '#fff' };
  assert.deepEqual(oldColorNames({ light: set, dark: set }), []);
});

test('a half-renamed file lists only the old names left; a name whose new one exists is to be deleted', () => {
  const found = oldColorNames({
    light: { surface: '#fff', 'on-surface': '#000', accent: '#a3345a', primary: '#a3345a', tint: '#eee', 'surface-container-high': '#eee' },
    dark: {},
  });
  assert.deepEqual(renames(found), ['light tint>null', 'light accent>null']);
});

test('an empty file, or anything that is not colors, has no old names', () => {
  assert.deepEqual(oldColorNames({}), []);
  assert.deepEqual(oldColorNames({ light: {}, dark: {} }), []);
  assert.deepEqual(oldColorNames(null), []);
  assert.deepEqual(oldColorNames('x'), []);
  assert.deepEqual(oldColorNames({ light: null, dark: [] }), []);
});

test('an old file with only light lists only light', () => {
  const found = oldColorNames({ light: { ink: '#111', accent: '#a3345a' } });
  assert.deepEqual(renames(found), ['light ink>on-surface', 'light accent>primary']);
});

test('a surface without bg is the new Surface, not the cards', () => {
  assert.deepEqual(
    oldColorNames({ light: { surface: '#fff', ink: '#111' } }).map((r) => r.from),
    ['ink'],
  );
});
