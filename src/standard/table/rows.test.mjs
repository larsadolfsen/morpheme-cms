// The Table's rows are kept rectangular, at least 1 × 1, one line a cell.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rectangle } from './rows.mjs';

test('a short row is filled up to the longest', () => {
  assert.deepEqual(rectangle([['a', 'b', 'c'], ['d']]), [
    ['a', 'b', 'c'],
    ['d', '', ''],
  ]);
});

test('no rows, or broken ones, are one empty cell', () => {
  assert.deepEqual(rectangle(undefined), [['']]);
  assert.deepEqual(rectangle([]), [['']]);
  assert.deepEqual(rectangle(['x', null]), [[''], ['']]);
});

test('a cell is one line and always text', () => {
  assert.deepEqual(rectangle([['a\nb', 3, null]]), [['a b', '3', '']]);
});
