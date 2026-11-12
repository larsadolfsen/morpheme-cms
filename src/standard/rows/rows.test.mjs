// Tests "Rows from" of the list blocks (rows.mjs). Run: node --test src/standard/rows/rows.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chosenFrom, howManyOf, itemOfEntry, rowOf, rowsFromItems, sourceOf } from './rows.mjs';

test('no source means typed rows', () => {
  assert.equal(sourceOf(undefined), undefined);
  assert.equal(sourceOf(''), undefined);
  assert.equal(sourceOf(' '), undefined);
  assert.equal(sourceOf(5), undefined);
  assert.equal(sourceOf('posts'), 'posts');
});

test('How many is a whole number of at least 1, otherwise all', () => {
  assert.equal(howManyOf(3), 3);
  assert.equal(howManyOf('4'), 4);
  assert.equal(howManyOf(2.9), 2);
  for (const v of [undefined, '', '  ', 0, -1, 'x', NaN]) assert.equal(howManyOf(v), undefined);
});

test('the tag filter keeps items with any picked tag, none picked is all', () => {
  const items = [{ title: 'a', tags: ['x'] }, { title: 'b', tags: ['y'] }, { title: 'c', tags: ['x', 'y'] }, { title: 'd' }];
  assert.deepEqual(chosenFrom(items, [], undefined).length, 4);
  assert.deepEqual(chosenFrom(items, undefined, undefined).length, 4);
  assert.deepEqual(
    chosenFrom(items, ['x'], undefined).map((i) => i.title),
    ['a', 'c'],
  );
  assert.deepEqual(
    chosenFrom(items, ['x', 'y'], 3).map((i) => i.title),
    ['a', 'b', 'c'],
  );
  assert.deepEqual(
    chosenFrom(items, ['y'], '1').map((i) => i.title),
    ['b'],
  );
});

test('a row has a trimmed title; without one the item is left out', () => {
  assert.deepEqual(rowOf({ title: ' Hi ', text: ' t ', href: '/a/', icon: '' }), { title: 'Hi', text: 't', icon: undefined, href: '/a/' });
  assert.equal(rowOf({ title: '  ' }), undefined);
  assert.equal(rowOf({ title: 3 }), undefined);
  assert.equal(rowOf({ title: 'x', text: 4 })?.text, undefined);
});

test('an entry of a list that says its fields becomes an item', () => {
  const item = itemOfEntry({ name: 'N', body: 'B', cats: ['x'], page: '/p/' }, { title: 'name', text: 'body', href: 'page', tags: 'cats' });
  assert.deepEqual(item, { title: 'N', text: 'B', icon: undefined, href: '/p/', tags: ['x'] });
  assert.deepEqual(itemOfEntry({ name: 'N' }, { title: 'name' }).tags, []);
});

test('filter, count and rows together; untitled items do not count against How many after the filter', () => {
  const items = [
    { title: 'a', tags: ['x'] },
    { title: '', tags: ['x'] },
    { title: 'c', tags: ['x'] },
  ];
  assert.deepEqual(
    rowsFromItems(items, { tags: ['x'], howMany: 2 }).map((r) => r.title),
    ['a', 'c'],
  );
  assert.deepEqual(
    rowsFromItems(items, {}).map((r) => r.title),
    ['a', 'c'],
  );
});
