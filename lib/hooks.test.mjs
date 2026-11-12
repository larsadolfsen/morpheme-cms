// Tests for pageColorsOutputProblems in lib/hooks.ts. Run: node --test lib/hooks.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { pageColorsOutputProblems } from './hooks.ts';

const names = ['bg', 'accent'];
const set = { bg: '#ffffff', accent: '#a3345a' };

test('a valid Colors object has no problems', () => {
  assert.deepEqual(pageColorsOutputProblems({ light: set, dark: { bg: '#000000', accent: '#ff88aa' } }, names), []);
});

test('undefined has no problems: the page keeps its colors', () => {
  assert.deepEqual(pageColorsOutputProblems(undefined, names), []);
});

test('an unknown color name is a problem', () => {
  const problems = pageColorsOutputProblems({ light: { ...set, glow: '#ffffff' }, dark: set }, names);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /light\.glow/);
});

test('a value that is not an object is a problem', () => {
  for (const value of ['red', 7, null, [], true]) assert.ok(pageColorsOutputProblems(value, names).length > 0, String(value));
});

test('a missing mode, a missing color and a value that is no color are problems', () => {
  assert.ok(pageColorsOutputProblems({ light: set }, names).some((p) => /dark/.test(p)));
  assert.ok(pageColorsOutputProblems({ light: set, dark: { bg: '#000000' } }, names).some((p) => /dark\.accent/.test(p)));
  assert.ok(pageColorsOutputProblems({ light: { ...set, bg: 'red' }, dark: set }, names).some((p) => /light\.bg/.test(p)));
});
