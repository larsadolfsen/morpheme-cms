import assert from 'node:assert/strict';
import test from 'node:test';
import { CORE_LISTS, coreListOf } from './coreLists.mjs';
import { itemsOf } from './lists.mjs';
import { itemOfEntry } from '../src/standard/rows/rows.mjs';

test('the core declares posts and testimonials as lists', () => {
  assert.deepEqual(
    CORE_LISTS.map((l) => l.id),
    ['posts', 'testimonials'],
  );
  assert.equal(coreListOf('other'), undefined);
});

test('posts: the title, description, link and tags fill a row', () => {
  assert.deepEqual(coreListOf('posts')?.asRows, { title: 'title', text: 'description', href: 'href', tags: 'categories' });
  assert.equal(coreListOf('posts')?.readOnly, true);
});

test('testimonials: the name, the quote, the anchor and the tags fill a row', () => {
  assert.deepEqual(coreListOf('testimonials')?.asRows, { title: 'name', text: 'quote', href: 'href', tags: 'categories' });
  assert.equal(coreListOf('testimonials')?.readOnly, undefined);
});

test('a core list is read like any list: the tag filter and How many', () => {
  const list = coreListOf('testimonials');
  const entries = [
    { name: 'A', quote: 'One', href: '/t/#a', categories: ['x'] },
    { name: 'B', quote: 'Two', href: '/t/#b', categories: ['y'] },
    { name: 'C', quote: 'Three', href: '/t/#c', categories: ['x'] },
  ];
  const items = itemsOf(
    entries.map((e) => itemOfEntry(e, list.asRows)),
    { tags: ['x'], howMany: 1 },
    [{ id: 'title', kinds: ['title'], required: true }, { id: 'text' }, { id: 'href' }],
  );
  assert.deepEqual(
    items.map((i) => i.slots),
    [{ title: 'A', text: 'One', href: '/t/#a' }],
  );
});
