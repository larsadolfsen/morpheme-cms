import test from 'node:test';
import assert from 'node:assert/strict';
import { pushSearch, readSearches, removeSearch, searchesShown, SEARCHES_KEPT, SEARCHES_SHOWN } from './recentSearches.mjs';

test('a search goes first, once, whatever its case, with its words spaced once', () => {
  assert.deepEqual(pushSearch(['bold', 'files'], '  Files  '), ['Files', 'bold']);
  assert.deepEqual(pushSearch([], 'new   page'), ['new page']);
});

test('an empty query is not kept', () => {
  const list = ['a'];
  assert.equal(pushSearch(list, '   '), list);
});

test('the last 8 are kept and 5 shown', () => {
  let list = [];
  for (let i = 0; i < 12; i++) list = pushSearch(list, `q${i}`);
  assert.equal(list.length, SEARCHES_KEPT);
  assert.equal(list[0], 'q11');
  assert.equal(searchesShown(list).length, SEARCHES_SHOWN);
});

test('one search is removed, whatever its case', () => {
  assert.deepEqual(removeSearch(['Files', 'bold'], 'files'), ['bold']);
});

test('a broken stored value is an empty list, and bad entries are dropped', () => {
  assert.deepEqual(readSearches(null), []);
  assert.deepEqual(readSearches({}), []);
  assert.deepEqual(readSearches(['a', 3, '', 'A', ' b ']), ['a', 'b']);
});
