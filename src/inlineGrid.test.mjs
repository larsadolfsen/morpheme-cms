// The grid of a block typed in place (inlineGrid.mjs): cells set, rows and columns added and dropped, the unused end trimmed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addColumnAt, addRowAt, removeColumnAt, removeRowAt, setCell, trimmed } from './inlineGrid.mjs';

test('a cell in the next row or column grows the grid', () => {
  assert.deepEqual(setCell([['a']], 1, 0, 'b'), [['a'], ['b']]);
  assert.deepEqual(setCell([['a'], ['b']], 0, 1, 'c'), [
    ['a', 'c'],
    ['b', ''],
  ]);
  assert.deepEqual(setCell([], 0, 0, 'x'), [['x']]);
});

test('a row and a column are put in empty, anywhere', () => {
  assert.deepEqual(addRowAt([['a', 'b']], 0), [
    ['', ''],
    ['a', 'b'],
  ]);
  assert.deepEqual(addRowAt([['a', 'b']], 1), [
    ['a', 'b'],
    ['', ''],
  ]);
  assert.deepEqual(addColumnAt([['a', 'b']], 1), [['a', '', 'b']]);
  assert.deepEqual(addColumnAt([['a'], ['b']], 1), [
    ['a', ''],
    ['b', ''],
  ]);
});

test('a row and a column are dropped, but the last of each is only emptied', () => {
  assert.deepEqual(removeRowAt([['a'], ['b']], 0), [['b']]);
  assert.deepEqual(removeRowAt([['a', 'b']], 0), [['', '']]);
  assert.deepEqual(removeColumnAt([['a', 'b']], 0), [['b']]);
  assert.deepEqual(removeColumnAt([['a'], ['b']], 0), [[''], ['']]);
});

test('the empty end is trimmed, never to less than 1 × 1, never inside', () => {
  assert.deepEqual(
    trimmed([
      ['a', ''],
      ['', ''],
      ['', ''],
    ]),
    [['a']],
  );
  assert.deepEqual(
    trimmed([
      ['', ''],
      ['', 'x'],
    ]),
    [
      ['', ''],
      ['', 'x'],
    ],
  );
  assert.deepEqual(trimmed([['', '']]), [['']]);
});
