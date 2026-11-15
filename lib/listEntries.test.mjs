import test from 'node:test';
import assert from 'node:assert/strict';
import { kindsOfList, slotFields, rowOfData, dataOfRow, isBlank, orderRows, moveRow } from './listEntries.mjs';

test('kindsOfList: an owner list says its kinds, another is read from asRows and image fields', () => {
  assert.deepEqual(kindsOfList({ fieldKinds: { a: 'title' }, fields: [] }), { a: 'title' });
  const testimonials = {
    asRows: { title: 'name', text: 'quote', tags: 'categories' },
    fields: [{ name: 'name' }, { name: 'image', type: 'image' }, { name: 'quote' }, { name: 'categories' }],
  };
  assert.deepEqual(kindsOfList(testimonials), { image: 'image', name: 'title', quote: 'text', categories: 'tags' });
});

test('slotFields: the first field of each kind', () => {
  const fields = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
  assert.deepEqual(slotFields(fields, { a: 'title', b: 'title', c: 'text' }), { title: 'a', text: 'c' });
});

test('row and data: the row has no key for an empty value; other fields are kept; order is set', () => {
  const slots = { title: 'name', text: 'quote' };
  const data = { order: 3, name: 'Ann', quote: 'Good', context: 'CEO' };
  assert.deepEqual(rowOfData({ ...data, quote: '' }, slots), { title: 'Ann' });
  assert.deepEqual(dataOfRow(data, { title: 'Ann B', text: '' }, slots, 5), { order: 5, name: 'Ann B', context: 'CEO' });
  assert.deepEqual(dataOfRow({}, { title: 'New' }, slots, 0), { name: 'New', order: 0 });
  assert.equal(isBlank({ order: 1 }), true);
  assert.equal(isBlank({ order: 1, context: 'x' }), false);
});

test('orderRows keeps rising orders and fills the others between their neighbours', () => {
  assert.deepEqual(orderRows([1, 2, 3]), [1, 2, 3]);
  assert.deepEqual(orderRows([undefined]), [0]);
  assert.deepEqual(orderRows([1, undefined, 2]), [1, 1.5, 2]);
  assert.deepEqual(orderRows([1, 2, undefined]), [1, 2, 3]);
  assert.deepEqual(orderRows([undefined, 5]), [4, 5]);
  const fixed = orderRows([3, 1, 2]);
  assert.ok(fixed[0] < fixed[1] && fixed[1] < fixed[2]);
});

test('moveRow swaps the two rows and their orders; a move off the list changes nothing', () => {
  const rows = [
    { id: 'a', order: 1 },
    { id: 'b', order: 2 },
    { id: 'c', order: 3 },
  ];
  const down = moveRow(rows, 0, 1);
  assert.deepEqual(down, [{ id: 'b', order: 1 }, { id: 'a', order: 2 }, rows[2]]);
  assert.equal(moveRow(rows, 0, -1), rows);
  assert.equal(moveRow(rows, 2, 1), rows);
});
