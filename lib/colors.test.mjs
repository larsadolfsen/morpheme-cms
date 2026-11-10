// Tests for lib/colors.ts: withMaterialNames() renames a file of colours written with the old names to Material 3's
// colour roles, and leaves one in the new names as it is. Run: node --test lib/colors.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { pageColor, withMaterialNames } from './colors.ts';

const OLD = {
  bg: '#f9f9ff',
  surface: '#ffffff',
  'surface-default': '#f1f1f8',
  tint: '#e8e7ee',
  ink: '#1a1b20',
  muted: '#44474f',
  line: '#c4c6d0',
  accent: '#435e91',
  'accent-hover': '#375284',
  'on-accent': '#ffffff',
  'accent-container': '#d8e2ff',
  'on-accent-container': '#001a41',
  secondary: '#565f71',
  'surface-container-lowest': '#fefefe',
};

test('a file with the old names gets Material 3 roles, each with the value it had', () => {
  const { light, dark } = withMaterialNames({ light: OLD, dark: { ...OLD, accent: '#adc6ff' } });
  assert.equal(light.surface, '#f9f9ff', 'the page (bg) is Surface');
  assert.equal(light['on-surface'], '#1a1b20');
  assert.equal(light['on-surface-variant'], '#44474f');
  assert.equal(light['outline-variant'], '#c4c6d0');
  assert.equal(light.primary, '#435e91');
  assert.equal(light['on-primary'], '#ffffff');
  assert.equal(light['primary-container'], '#d8e2ff');
  assert.equal(light['on-primary-container'], '#001a41');
  assert.equal(light.secondary, '#565f71');
  assert.equal(dark.primary, '#adc6ff');
});

test('the colours Material 3 has no role for are dropped', () => {
  const { light } = withMaterialNames({ light: OLD, dark: OLD });
  for (const name of ['bg', 'ink', 'muted', 'line', 'accent', 'tint', 'surface-default', 'accent-hover', 'on-accent']) {
    assert.equal(Object.hasOwn(light, name), false, name);
  }
});

test("the cards' old surface becomes Surface container lowest, unless the file has one of its own", () => {
  const without = { ...OLD };
  delete without['surface-container-lowest'];
  assert.equal(withMaterialNames({ light: without, dark: without }).light['surface-container-lowest'], '#ffffff');
  assert.equal(withMaterialNames({ light: OLD, dark: OLD }).light['surface-container-lowest'], '#fefefe');
});

test('a file in the new names is returned as it is', () => {
  const colors = { light: { surface: '#f9f9ff', primary: '#435e91' }, dark: { surface: '#111318', primary: '#adc6ff' } };
  assert.equal(withMaterialNames(colors), colors);
});

test('the page colour of the editor is Surface', () => {
  assert.equal(pageColor({ surface: '#f9f9ff', 'surface-container': '#ededf4' }), '#f9f9ff');
});
