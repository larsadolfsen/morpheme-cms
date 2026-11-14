import test from 'node:test';
import assert from 'node:assert/strict';
import { styleRows, listRows, inListItem, inHeading } from './styleMenu.mjs';

test('in plain text: the heading levels, a divider, the sizes, a divider and Quote', () => {
  assert.deepEqual(styleRows([], [2, 3]), ['h2', 'h3', '-', 'small', 'medium', 'large', '-', 'quote']);
  assert.deepEqual(styleRows(['medium'], [1]), ['h1', '-', 'small', 'medium', 'large', '-', 'quote']);
  assert.equal(styleRows([], [2, 3]).length - 1 <= 8, true, 'at most 8 rows and a divider');
});

test('Label only where the line can be one', () => {
  assert.ok(styleRows(['labelable'], [2, 3]).includes('label'));
  assert.ok(!styleRows([], [2, 3]).includes('label'));
});

test('in a list item there are no heading rows, no divider, no Quote and no Label; the sizes stay', () => {
  for (const kind of ['bullet', 'check', 'ordered']) {
    assert.deepEqual(styleRows([kind, 'labelable'], [2, 3]), ['small', 'medium', 'large']);
    assert.equal(inListItem([kind]), true);
    assert.deepEqual(listRows([kind]), ['bullet', 'check', 'ordered']);
  }
});

test('in a heading the list rows and Quote are hidden; the levels and the sizes stay', () => {
  for (const level of ['h1', 'h2', 'h3']) {
    assert.equal(inHeading([level]), true);
    assert.deepEqual(listRows([level]), []);
    assert.deepEqual(styleRows([level], [2, 3]), ['h2', 'h3', '-', 'small', 'medium', 'large']);
  }
  assert.ok(styleRows(['h2', 'labelable'], [2, 3]).includes('label'));
});
