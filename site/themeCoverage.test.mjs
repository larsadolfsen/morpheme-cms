// Tests for themeCoverage.mjs.
// Verifies styledClasses, partOf, partPieces, and themeCoverage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { styledClasses, partOf, partPieces, themeCoverage } from './themeCoverage.mjs';

test('subject only', () => {
  const result = styledClasses('.mo-card .mo-button { color: red }');
  assert.deepEqual([...result].sort(), ['button']);
});

test('selector list', () => {
  const result = styledClasses('.a, .b > .c { margin: 0 }');
  assert.deepEqual([...result].sort(), ['a', 'c']);
});

test('custom properties only', () => {
  const result = styledClasses('.mo-button { --x: 1 }');
  assert.deepEqual([...result].sort(), []);
});

test('mixed declarations', () => {
  const result = styledClasses('.mo-button { --x: 1; padding: 0 }');
  assert.deepEqual([...result].sort(), ['button']);
});

test('inside @media', () => {
  const result = styledClasses('@media (width > 1px) { .mo-switch { padding: 0 } }');
  assert.deepEqual([...result].sort(), ['switch']);
});

test('nested at-rules', () => {
  const result = styledClasses('@media x { @supports (a: b) { .mo-slider { padding: 0 } } }');
  assert.deepEqual([...result].sort(), ['slider']);
});

test('inside @layer', () => {
  const result = styledClasses('@layer fallback { .mo-switch { padding: 0 } }');
  assert.deepEqual([...result].sort(), []);
});

test(':is and :not', () => {
  const result = styledClasses('.x:is(.mo-slider__track):not(.mo-slider__stop) { padding: 0 }');
  assert.deepEqual([...result].sort(), ['slider-track', 'x']);
});

test(':has', () => {
  const result = styledClasses('.mo-card:has(.mo-button) { padding: 0 }');
  assert.deepEqual([...result].sort(), ['card']);
});

test('pseudo-element', () => {
  const result = styledClasses(".mo-chip::before { content: '' }");
  assert.deepEqual([...result].sort(), ['chip']);
});

test('longest prefix', () => {
  const P = [
    { id: 'Button', group: 'ui', prefixes: ['button'] },
    { id: 'ButtonGroup', group: 'ui', prefixes: ['button-group'] },
  ];
  assert.equal(partOf('button-group-x', P), 'ButtonGroup');
});

test('exact prefix', () => {
  const P = [{ id: 'Tabs', group: 'ui', prefixes: ['tabs', 'tab'] }];
  assert.equal(partOf('tab', P), 'Tabs');
});

test('no false prefix', () => {
  const P = [
    { id: 'Button', group: 'ui', prefixes: ['button'] },
    { id: 'ButtonGroup', group: 'ui', prefixes: ['button-group'] },
  ];
  assert.equal(partOf('buttonx', P), null);
});

test('pieces', () => {
  const P2 = [
    { id: 'Button', group: 'ui', prefixes: ['button'] },
    { id: 'Chip', group: 'ui', prefixes: ['chip'] },
  ];
  const materialCss = '@layer fallback { .mo-button{a:b} .mo-button__text{a:b} } .mo-chip{a:b}';
  const result = partPieces(materialCss, P2);
  assert.deepEqual(result, { Button: ['button', 'button-text'], Chip: ['chip'] });
});

test('own', () => {
  const P2 = [
    { id: 'Button', group: 'ui', prefixes: ['button'] },
    { id: 'Chip', group: 'ui', prefixes: ['chip'] },
  ];
  const materialCss = '@layer fallback { .mo-button{a:b} .mo-button__text{a:b} } .mo-chip{a:b}';
  const themeCss = '.mo-button{a:b} .mo-button__text{a:b}';
  const result = themeCoverage({ materialCss, themeCss, parts: P2 });
  assert.deepEqual(result.Button, { group: 'ui', status: 'own', pieces: 2, missing: [] });
});

test('partly', () => {
  const P2 = [
    { id: 'Button', group: 'ui', prefixes: ['button'] },
    { id: 'Chip', group: 'ui', prefixes: ['chip'] },
  ];
  const materialCss = '@layer fallback { .mo-button{a:b} .mo-button__text{a:b} } .mo-chip{a:b}';
  const themeCss = '.mo-button{a:b}';
  const result = themeCoverage({ materialCss, themeCss, parts: P2 });
  assert.deepEqual(result.Button, { group: 'ui', status: 'partly', pieces: 2, missing: ['button-text'] });
});

test('material', () => {
  const P2 = [
    { id: 'Button', group: 'ui', prefixes: ['button'] },
    { id: 'Chip', group: 'ui', prefixes: ['chip'] },
  ];
  const materialCss = '@layer fallback { .mo-button{a:b} .mo-button__text{a:b} } .mo-chip{a:b}';
  const themeCss = '';
  const result = themeCoverage({ materialCss, themeCss, parts: P2 });
  assert.deepEqual(result.Button, { group: 'ui', status: 'material', pieces: 2, missing: ['button', 'button-text'] });
});

test('empty part left out', () => {
  const P2 = [
    { id: 'Button', group: 'ui', prefixes: ['button'] },
    { id: 'Chip', group: 'ui', prefixes: ['chip'] },
    { id: 'Gone', group: 'ui', prefixes: ['gone'] },
  ];
  const materialCss = '@layer fallback { .mo-button{a:b} .mo-button__text{a:b} } .mo-chip{a:b}';
  const themeCss = '';
  const result = themeCoverage({ materialCss, themeCss, parts: P2 });
  assert.equal('Gone' in result, false);
});

test('group copied', () => {
  const P2 = [
    { id: 'Button', group: 'ui', prefixes: ['button'] },
    { id: 'Chip', group: 'frame', prefixes: ['chip'] },
  ];
  const materialCss = '@layer fallback { .mo-button{a:b} .mo-button__text{a:b} } .mo-chip{a:b}';
  const themeCss = '';
  const result = themeCoverage({ materialCss, themeCss, parts: P2 });
  assert.equal(result.Chip.group, 'frame');
});
