import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { movedList } from './moveItem.mjs';

test('movedList swaps two neighbours without changing the list given', () => {
  const list = ['a', 'b', 'c'];
  assert.deepEqual(movedList(list, 1, 0), ['b', 'a', 'c']);
  assert.deepEqual(movedList(list, 1, 2), ['a', 'c', 'b']);
  assert.deepEqual(list, ['a', 'b', 'c']);
});

test('movedList gives the list back when a place is not in it', () => {
  const list = ['a', 'b'];
  assert.equal(movedList(list, 0, -1), list);
  assert.equal(movedList(list, 1, 2), list);
});
