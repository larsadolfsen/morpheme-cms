// Tests "Rows from" of the list blocks (rows.mjs). Run: node --test src/standard/rows/rows.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PARTS,
  fieldOfPart,
  fieldsForPart,
  withPart,
  inlineRowsOf,
  chosenFrom,
  howManyOf,
  itemOfEntry,
  mapOf,
  rowOf,
  rowsFromItems,
  sourceOf,
} from './rows.mjs';

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
  const entry = { name: 'N', body: 'B', cats: ['x'], page: '/p/' };
  const item = itemOfEntry(entry, { title: 'name', text: 'body', href: 'page', tags: 'cats' });
  assert.deepEqual(item, { entry, title: 'N', text: 'B', icon: undefined, href: '/p/', tags: ['x'] });
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

test('the inline editor reads the list for a dynamic block and types for a block with rows', () => {
  const items = [
    { title: 'a', tags: ['x'] },
    { title: 'b', tags: ['y'] },
    { title: 'c', tags: ['x'] },
  ];
  assert.equal(inlineRowsOf({ items: [{ title: 'typed' }] }, items), undefined);
  assert.equal(inlineRowsOf({ from: '' }, items), undefined);
  assert.deepEqual(
    inlineRowsOf({ from: 'posts', tags: ['x'], howMany: 1 }, items)?.rows.map((r) => r.title),
    ['a'],
  );
  assert.equal(inlineRowsOf({ from: 'posts', tags: ['z'] }, items)?.empty, true);
  assert.equal(inlineRowsOf({ from: 'posts' }, items)?.rows.length, 3);
});
test("a block's `map` picks the field of the list for each part; no or broken map reads as the list's own", () => {
  const asRows = { title: 'name', text: 'about', icon: 'icon', href: 'page', tags: 'tags' };
  const entry = { name: 'Haircut', about: 'Wash and cut', alt: 'Cut', price: '300 kr', icon: 'scissors', page: '/cut/', tags: ['home'] };
  const items = [itemOfEntry(entry, asRows)];
  const first = (/** @type {unknown} */ map) => rowsFromItems(items, { map })[0];
  assert.deepEqual(first(undefined), { title: 'Haircut', text: 'Wash and cut', icon: 'scissors', href: '/cut/' });
  assert.deepEqual(first('x'), first(undefined));
  assert.deepEqual(first({}), first(undefined));
  assert.deepEqual(first({ text: 'price', title: 5 }), { title: 'Haircut', text: '300 kr', icon: 'scissors', href: '/cut/' });
  assert.equal(first({ icon: '', href: '' })?.icon, undefined);
  assert.equal(first({ title: '' })?.title, 'Haircut');
  assert.equal(first({ title: 'missing' }), undefined);
  assert.deepEqual(mapOf({ title: ' alt ', other: 'x' }), { title: 'alt' });
  // Items without an entry (posts, testimonials) stay as they are; tags still filter by the list's own.
  assert.equal(rowsFromItems([{ title: 'Post', tags: ['x'] }], { map: { title: 'alt' } })[0].title, 'Post');
  assert.equal(rowsFromItems(items, { map: { title: 'alt' }, tags: ['home'] })[0].title, 'Cut');
  assert.equal(rowsFromItems(items, { map: { title: 'alt' }, tags: ['nope'] }).length, 0);
});

test('the fields that can fill each part, the field now shown, and the map after a pick', () => {
  const fields = [
    { name: 'name', label: 'Name', type: 'string' },
    { name: 'about', label: 'About', type: 'text' },
    { name: 'kind', label: 'Kind', type: 'select' },
    { name: 'icon', label: 'Icon', type: 'select', icons: true },
    { name: 'page', label: 'Page', type: 'relation' },
    { name: 'tags', label: 'Tags', type: 'relation' },
    { name: 'flag', label: 'Flag', type: 'boolean' },
  ];
  const names = (/** @type {any} */ part) => fieldsForPart(fields, part).map((f) => f.name);
  assert.deepEqual(PARTS, ['title', 'text', 'icon', 'href']);
  assert.deepEqual(names('title'), ['name', 'about', 'kind']);
  assert.deepEqual(names('icon'), ['icon']);
  assert.deepEqual(names('href'), ['name', 'page', 'tags']);
  const asRows = { title: 'name', text: 'about', icon: 'icon' };
  assert.equal(fieldOfPart(asRows, undefined, 'text'), 'about');
  assert.equal(fieldOfPart(asRows, { text: 'kind' }, 'text'), 'kind');
  assert.equal(fieldOfPart(asRows, { text: '' }, 'text'), undefined);
  assert.equal(fieldOfPart(asRows, undefined, 'href'), undefined);
  assert.deepEqual(withPart(asRows, undefined, 'text', 'kind'), { text: 'kind' });
  assert.equal(withPart(asRows, { text: 'kind' }, 'text', 'about'), undefined);
  assert.deepEqual(withPart(asRows, { text: 'kind' }, 'icon', ''), { text: 'kind', icon: '' });
  assert.equal(withPart(asRows, { icon: '' }, 'icon', 'icon'), undefined);
  assert.equal(withPart(asRows, undefined, 'href', ''), undefined);
});
