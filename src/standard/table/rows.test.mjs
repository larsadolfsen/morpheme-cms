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

import { alignAddedAt, alignCut, alignOf, alignRemovedAt, isNumber, withAlign } from './rows.mjs';

test('numbers are recognised', () => {
  for (const v of ['7', '-3', '1,200.50', '3,5 %', '12 kr', '$9', ' 42 ']) assert.equal(isNumber(v), true, v);
  for (const v of ['', 'Text', 'a7', '7 apples and pears', 'Q1 2026']) assert.equal(isNumber(v), false, v);
});

test('a column is right when its cells are numbers, else left, and the choice wins', () => {
  const rows = [
    ['Text', 'Number', 'Mixed'],
    ['a', '7', '1'],
    ['b', '7', 'x'],
  ];
  assert.deepEqual(alignOf(rows, true, undefined), ['left', 'right', 'left']);
  assert.deepEqual(alignOf(rows, true, [null, 'center', 'right']), ['left', 'center', 'right']);
  // Without a header row the first row counts too.
  assert.deepEqual(alignOf([['1'], ['2']], false, undefined), ['right']);
  assert.deepEqual(alignOf([['Number'], ['']], true, undefined), ['left']);
});

test('the choice stays in step with the columns and is not kept when automatic', () => {
  assert.equal(withAlign(undefined, 3, 1, null), undefined);
  assert.deepEqual(withAlign(undefined, 3, 1, 'right'), [null, 'right', null]);
  assert.deepEqual(alignAddedAt([null, 'right'], 2, 1), [null, null, 'right']);
  assert.deepEqual(alignRemovedAt([null, 'right', 'left'], 3, 1), [null, 'left']);
  assert.equal(alignRemovedAt([null, 'right'], 2, 1), undefined);
  assert.equal(alignCut([null, 'right'], 1), undefined);
});
