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

import { alignOf, columnAddedAt, columnRemovedAt, columnsCut, columnsOf, isNumber, withAlign, withKind } from './rows.mjs';

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

test('old columns, with no kind, read exactly as before', () => {
  const rows = [
    ['Text', 'Number', 'Mixed'],
    ['a', '7', '1'],
    ['b', '7', 'x'],
  ];
  assert.deepEqual(columnsOf([{ align: 'right' }, null, 'x'], 3), [{ align: 'right' }, {}, {}]);
  assert.deepEqual(alignOf(rows, true, []), ['left', 'right', 'left']);
  assert.deepEqual(alignOf(rows, true, [{ align: 'center' }]), ['center', 'right', 'left']);
});

test('a kind is kept when it is a non-empty string, and every unknown key is kept', () => {
  assert.deepEqual(columnsOf([{ kind: 'date' }, { kind: 7 }, { kind: '' }, { kind: null, field: 'price', label: 'Price' }], 4), [
    { kind: 'date' },
    {},
    {},
    { field: 'price', label: 'Price' },
  ]);
});

test('kind, field and label survive adding, removing and cutting columns and a new alignment', () => {
  const cols = [{ kind: 'number', field: 'price', label: 'Price' }, { kind: 'text' }, { kind: 'date', align: 'right' }];
  assert.deepEqual(columnAddedAt(cols, 3, 1), [cols[0], {}, cols[1], cols[2]]);
  assert.deepEqual(columnRemovedAt(cols, 3, 1), [cols[0], cols[2]]);
  assert.deepEqual(columnsCut(cols, 2), [cols[0], cols[1]]);
  assert.deepEqual(withAlign(cols, 3, 0, 'center'), [{ ...cols[0], align: 'center' }, cols[1], cols[2]]);
});

test('withKind sets and removes a kind, and a table never touched stays without columns', () => {
  assert.equal(withKind(undefined, 2, 0, null), undefined);
  assert.deepEqual(withKind(undefined, 2, 1, 'number'), [{}, { kind: 'number' }]);
  assert.deepEqual(withKind([{ kind: 'number', align: 'left' }], 1, 0, null), [{ align: 'left' }]);
  assert.equal(withKind([{}, { kind: 'number' }], 2, 1, null), undefined);
  assert.deepEqual(withKind([{ field: 'x' }], 1, 0, 'date'), [{ field: 'x', kind: 'date' }]);
});

test('a stored kind gives the alignment, and a chosen alignment beats it', () => {
  const kinds = ['number', 'icon', 'yesno', 'text', 'link', 'date', 'tag', 'image', 'odd'];
  // The body cells say the opposite of the kind (text under number, numbers under the rest): the kind wins.
  const rows = [kinds.map((k) => k.toUpperCase()), kinds.map((k) => (k === 'number' ? 'a' : '1'))];
  const want = ['right', 'center', 'center', 'left', 'left', 'left', 'left', 'left', 'left'];
  assert.deepEqual(
    alignOf(
      rows,
      true,
      kinds.map((kind) => ({ kind })),
    ),
    want,
  );
  assert.deepEqual(alignOf([['H'], ['1']], true, [{ kind: 'number', align: 'left' }]), ['left']);
  assert.deepEqual(alignOf([['H'], ['1']], true, [{ kind: 'text', align: 'center' }]), ['center']);
  // A non-string kind is dropped, so the automatic rule applies.
  assert.deepEqual(alignOf([['H'], ['1']], true, [{ kind: 5 }]), ['right']);
});
