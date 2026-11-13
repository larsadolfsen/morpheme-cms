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

import { alignOf, columnAddedAt, columnRemovedAt, columnsCut, columnsOf, isNumber, withAlign } from './rows.mjs';

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
  assert.deepEqual(alignOf(rows, true, [{}, { align: 'center' }, { align: 'right' }]), ['left', 'center', 'right']);
  assert.deepEqual(alignOf(rows, true, [null, { align: 'bad' }]), ['left', 'right', 'left']);
  // Without a header row the first row counts too.
  assert.deepEqual(alignOf([['1'], ['2']], false, undefined), ['right']);
  assert.deepEqual(alignOf([['Number'], ['']], true, undefined), ['left']);
});

test('columns is as wide as the rows and keeps the other keys of an entry', () => {
  assert.deepEqual(columnsOf(undefined, 2), [{}, {}]);
  assert.deepEqual(columnsOf([{ align: 'left', kind: 'number' }], 2), [{ align: 'left', kind: 'number' }, {}]);
  assert.deepEqual(withAlign([{ kind: 'number', align: 'left' }], 1, 0, null), [{ kind: 'number' }]);
});

test('columns stays in step with the columns and is not kept when nothing is chosen', () => {
  assert.equal(withAlign(undefined, 3, 1, null), undefined);
  assert.deepEqual(withAlign(undefined, 3, 1, 'right'), [{}, { align: 'right' }, {}]);
  assert.deepEqual(columnAddedAt([{}, { align: 'right' }], 2, 1), [{}, {}, { align: 'right' }]);
  assert.deepEqual(columnRemovedAt([{}, { align: 'right' }, { align: 'left' }], 3, 1), [{}, { align: 'left' }]);
  assert.equal(columnRemovedAt([{}, { align: 'right' }], 2, 1), undefined);
  assert.equal(columnsCut([{}, { align: 'right' }], 1), undefined);
});
