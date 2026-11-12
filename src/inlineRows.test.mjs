// Tests for src/inlineRows.mjs: the rows of a List typed in place. Run: node --test src/inlineRows.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addAt, isEmptyRow, linesFromPaste, moveBy, removeAt, setField, withoutEmpty } from './inlineRows.mjs';

test('a row is empty only with no icon, link, heading and text', () => {
  assert.equal(isEmptyRow({ title: '' }), true);
  assert.equal(isEmptyRow({ title: '  ', text: '' }), true);
  assert.equal(isEmptyRow(undefined), true);
  assert.equal(isEmptyRow({ title: '', icon: 'clock' }), false);
  assert.equal(isEmptyRow({ title: '', href: '/a/' }), false);
  assert.equal(isEmptyRow({ title: '', text: 'x' }), false);
});

test('only completely empty rows are dropped', () => {
  const rows = [{ title: 'A' }, { title: '' }, { title: '', icon: 'info' }];
  assert.deepEqual(withoutEmpty(rows), [{ title: 'A' }, { title: '', icon: 'info' }]);
  assert.equal(withoutEmpty([{ title: 'A' }]).length, 1);
});

test('a field is set, and left out when emptied (the title stays)', () => {
  const rows = [{ title: 'A', text: 'x' }];
  assert.deepEqual(setField(rows, 0, 'text', ''), [{ title: 'A' }]);
  assert.deepEqual(setField(rows, 0, 'title', ''), [{ title: '', text: 'x' }]);
  assert.deepEqual(rows, [{ title: 'A', text: 'x' }]);
});

test('typing in the next empty row (past the last) makes it a row', () => {
  assert.deepEqual(setField([{ title: 'A' }], 1, 'title', 'B'), [{ title: 'A' }, { title: 'B' }]);
  assert.deepEqual(setField([], 0, 'text', 'x'), [{ title: '', text: 'x' }]);
});

test('rows are added, removed and moved', () => {
  const rows = [{ title: 'A' }, { title: 'B' }];
  assert.deepEqual(
    addAt(rows, 1).map((r) => r.title),
    ['A', '', 'B'],
  );
  assert.deepEqual(removeAt(rows, 0), [{ title: 'B' }]);
  assert.deepEqual(
    moveBy(rows, 0, 1).map((r) => r.title),
    ['B', 'A'],
  );
  assert.equal(moveBy(rows, 0, -1), rows);
  assert.equal(moveBy(rows, 1, 1), rows);
});

test('another block names its first typed field, and any field with text makes an item not empty', () => {
  assert.deepEqual(addAt([], 0, 'name'), [{ name: '' }]);
  assert.deepEqual(setField([{ name: 'A', note: 'x' }], 0, 'note', '', 'name'), [{ name: 'A' }]);
  assert.deepEqual(setField([], 0, 'note', 'x', 'name'), [{ name: '', note: 'x' }]);
  assert.equal(isEmptyRow({ name: '', price: '5 kr' }), false);
});

test('lines pasted become items, but not when the paste has headings among its lines', () => {
  assert.deepEqual(linesFromPaste('Order\r\nPay\n\n  Get it  '), ['Order', 'Pay', 'Get it']);
  assert.deepEqual(linesFromPaste('- Order\n2. Pay'), ['Order', 'Pay']);
  assert.equal(linesFromPaste('One line only'), null);
  assert.equal(linesFromPaste('# Title\nOrder\nPay'), null);
  assert.equal(linesFromPaste('Order\nPay', '<h2>Order</h2><p>Pay</p>'), null);
  assert.deepEqual(linesFromPaste('Order\nPay', '<p>Order</p><p>Pay</p>'), ['Order', 'Pay']);
});
