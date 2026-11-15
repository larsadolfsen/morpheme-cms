// Tests the dynamic lists reader (lib/lists.mjs). Run: node --test lib/lists.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { itemsOf, listItems, listSlots, mapOf, readList, withPart, fieldOfPart, fieldsForSlot } from './lists.mjs';

const SLOTS = [
  { id: 'title', kinds: ['title', 'text'], required: true },
  { id: 'text', kinds: ['text', 'title'] },
  { id: 'icon', kinds: ['icon'] },
  { id: 'href', kinds: ['href'] },
];
const entry = (o) => ({ entry: o, title: o.q, text: o.a, tags: o.t ?? [] });
const source = [
  entry({ q: 'One', a: 'First', t: ['x'], note: 'n1' }),
  entry({ q: '  ', a: 'No title', t: ['x'] }),
  entry({ q: 'Two', a: 'Second', t: ['y'], note: 'n2' }),
  entry({ q: 'Three', a: 'Third', t: ['x', 'y'] }),
];

test('listSlots adds the tags slot once', () => {
  assert.deepEqual(
    listSlots(SLOTS).map((s) => s.id),
    ['title', 'text', 'icon', 'href', 'tags'],
  );
  assert.equal(listSlots(listSlots(SLOTS)).length, 5);
  assert.deepEqual(
    listSlots(undefined).map((s) => s.id),
    ['tags'],
  );
});

test('items keep order, drop an item without its required slot, filter by any tag, then cut', () => {
  assert.deepEqual(
    itemsOf(source, {}, SLOTS).map((i) => i.slots.title),
    ['One', 'Two', 'Three'],
  );
  assert.deepEqual(
    itemsOf(source, { tags: ['y'] }, SLOTS).map((i) => i.slots.title),
    ['Two', 'Three'],
  );
  assert.deepEqual(
    itemsOf(source, { tags: ['x'], howMany: 1 }, SLOTS).map((i) => i.slots.title),
    ['One'],
  );
  for (const howMany of ['', 0, -2, 'x']) assert.equal(itemsOf(source, { howMany }, SLOTS).length, 3);
});

test('a slot value is trimmed text; the entry and tags come with the item', () => {
  const [one] = itemsOf(source, {}, SLOTS);
  assert.equal(one.slots.text, 'First');
  assert.equal(one.slots.icon, undefined);
  assert.deepEqual(one.tags, ['x']);
  assert.equal(one.entry.note, 'n1');
});

test('the block map picks another field, an empty text clears an optional slot, a required one keeps the list default', () => {
  const [one] = itemsOf(source, { map: { text: 'note' } }, SLOTS);
  assert.equal(one.slots.text, 'n1');
  assert.equal(itemsOf(source, { map: { text: '' } }, SLOTS)[0].slots.text, undefined);
  assert.equal(itemsOf(source, { map: { title: '' } }, SLOTS).length, 3);
  assert.deepEqual(mapOf({ title: '', text: ' note ', x: 'y', icon: 3 }, SLOTS), { text: 'note' });
  assert.equal(mapOf('nope', SLOTS), undefined);
});

test('a removed field shows nothing in its slot', () => {
  const [one] = itemsOf(source, { map: { text: 'gone' } }, SLOTS);
  assert.equal(one.slots.text, undefined);
});

test('the tags slot of the map is the filter field', () => {
  const src = [
    { entry: { q: 'A', k: ['red'] }, title: 'A', tags: [] },
    { entry: { q: 'B', k: ['blue'] }, title: 'B', tags: [] },
  ];
  assert.deepEqual(
    itemsOf(src, { map: { tags: 'k' }, tags: ['red'] }, SLOTS).map((i) => i.slots.title),
    ['A'],
  );
});

test('a source without entries (posts, testimonials) gives its own parts and ignores the map', () => {
  const posts = [{ title: 'Post', text: 'D', href: '/p/', tags: ['news'] }];
  const [p] = itemsOf(posts, { map: { text: 'whatever' } }, SLOTS);
  assert.deepEqual(p.slots, { title: 'Post', text: 'D', icon: undefined, href: '/p/' });
});

test('a block with an extra slot gets it from the source item', () => {
  const slots = [...SLOTS, { id: 'image', kinds: ['image'] }];
  const [i] = itemsOf([{ title: 'T', image: '/a.jpg', entry: { t: 'T', pic: '/b.jpg' } }], { map: { image: 'pic' } }, slots);
  assert.equal(i.slots.image, '/b.jpg');
});

test('withPart and fieldOfPart: a choice the list already has is not kept', () => {
  const asRows = { title: 'q', text: 'a' };
  assert.equal(withPart(asRows, undefined, SLOTS, 'title', 'q'), undefined);
  assert.deepEqual(withPart(asRows, undefined, SLOTS, 'text', 'note'), { text: 'note' });
  assert.equal(fieldOfPart(asRows, { text: 'note' }, SLOTS, 'text'), 'note');
  assert.equal(fieldOfPart(asRows, undefined, SLOTS, 'icon'), undefined);
});

test('a slot offers the fields of its kinds', () => {
  const fields = [
    { name: 'a', label: 'A', type: 'x' },
    { name: 'b', label: 'B', type: 'x' },
  ];
  const kinds = { a: 'title', b: 'icon' };
  assert.deepEqual(fieldsForSlot(fields, SLOTS[0], kinds), [{ name: 'a', label: 'A' }]);
  assert.deepEqual(fieldsForSlot(fields, SLOTS[2], kinds), [{ name: 'b', label: 'B' }]);
});

test('listItems (editor) and readList (site) give the same items', async () => {
  const props = { tags: ['x'], howMany: 2, map: { text: 'note' } };
  const editor = listItems({}, 'faq', props, SLOTS, () => source);
  const site = await readList('faq', props, SLOTS, async () => ({ items: source, page: '/faq/' }));
  assert.deepEqual(site.items, editor);
  assert.equal(site.page, '/faq/');
  assert.equal(site.missing, false);
});

test('a list that does not exist is missing', async () => {
  const found = await readList('gone', {}, SLOTS, async () => ({ items: [], missing: true }));
  assert.deepEqual(found, { items: [], page: undefined, missing: true });
});
