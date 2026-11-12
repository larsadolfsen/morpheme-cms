// Tests `Max rows` of "Segmented list" (maxRows.mjs). Run: node --test src/standard/segmented/maxRows.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cutAt, maxRowsOf } from './maxRows.mjs';

test('a whole number of at least 1 is the limit, a number as text too', () => {
  assert.equal(maxRowsOf(5), 5);
  assert.equal(maxRowsOf('5'), 5);
  assert.equal(maxRowsOf(' 3 '), 3);
  assert.equal(maxRowsOf(2.9), 2);
});

test('empty, 0, negative, NaN and text are no limit', () => {
  for (const v of [undefined, null, '', '  ', 0, '0', -2, NaN, Infinity, 'abc', 0.5, {}, [], true])
    assert.equal(maxRowsOf(v), undefined, String(v));
});

test('the cut is the limit when there are more rows, else all rows show', () => {
  assert.equal(cutAt(5, 8), 5);
  assert.equal(cutAt(1, 2), 1);
  assert.equal(cutAt(8, 8), undefined);
  assert.equal(cutAt(20, 8), undefined);
  assert.equal(cutAt(undefined, 8), undefined);
  assert.equal(cutAt(maxRowsOf(0), 8), undefined);
  assert.equal(cutAt(maxRowsOf(NaN), 8), undefined);
});
