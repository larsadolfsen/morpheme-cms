// Tests lib/fold-open.mjs: opening a section beside the others or in their place, and only the first left open.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onlyFirst, withOpen } from './fold-open.mjs';

test('a section opens beside the others', () => {
  assert.deepEqual([...withOpen(new Set(['a']), 'b', false)], ['a', 'b']);
});

test('an open section stays as it is', () => {
  const open = new Set(['a']);
  assert.equal(withOpen(open, 'a', false), open);
});

test('one at a time: a section opens in the place of the others', () => {
  assert.deepEqual([...withOpen(new Set(['a', 'c']), 'b', true)], ['b']);
});

test('only the first open section in the order stays open', () => {
  assert.deepEqual([...onlyFirst(new Set(['c', 'b']), ['a', 'b', 'c'])], ['b']);
  const one = new Set(['c']);
  assert.equal(onlyFirst(one, ['a', 'b', 'c']), one);
  assert.equal(onlyFirst(new Set(), ['a']).size, 0);
});
