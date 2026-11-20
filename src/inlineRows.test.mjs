// Tests for src/inlineRows.mjs: the rows of a List typed in place. Run: node --test src/inlineRows.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  addAt,
  gridFromPaste,
  isEmptyRow,
  itemsFromPaste,
  linesFromPaste,
  moveBy,
  removeAt,
  setField,
  withoutEmpty,
} from './inlineRows.mjs';

test('a row is empty only with no icon, link, heading and text', () => {
  assert.equal(isEmptyRow({ title: '' }), true);
  assert.equal(isEmptyRow({ title: '  ', text: '' }), true);
  assert.equal(isEmptyRow({ title: '', buttons: [] }), true);
  assert.equal(isEmptyRow({ title: '', buttons: [{ label: 'Go' }] }), false);
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

test('a list in a row (its buttons) is kept while it has an entry, and left out when emptied', () => {
  const buttons = [{ label: 'More', href: '/a/' }];
  const rows = setField([{ title: 'A' }], 0, 'buttons', buttons);
  assert.deepEqual(rows, [{ title: 'A', buttons }]);
  assert.deepEqual(setField(rows, 0, 'buttons', []), [{ title: 'A' }]);
  assert.equal(isEmptyRow({ title: '', buttons }), false);
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

test('a list or a switch in a row is content, and empty lines of a list are dropped on leaving', () => {
  assert.equal(isEmptyRow({ name: '', features: ['a'] }), false);
  assert.equal(isEmptyRow({ name: '', features: [''] }), true);
  assert.equal(isEmptyRow({ name: '', buttons: [{ label: 'Go' }] }), false);
  assert.equal(isEmptyRow({ name: '', featured: true }), false);
  assert.deepEqual(withoutEmpty([{ name: 'A', features: ['x', '', ' '] }]), [{ name: 'A', features: ['x'] }]);
  const same = [{ name: 'A', features: ['x'] }];
  assert.equal(withoutEmpty(same), same);
  assert.deepEqual(setField([{ name: 'A' }], 0, 'featured', true, 'name'), [{ name: 'A', featured: true }]);
  assert.deepEqual(setField([{ name: 'A', featured: true }], 0, 'featured', false, 'name'), [{ name: 'A' }]);
});

test('lines pasted become items, but not when the paste has headings among its lines', () => {
  assert.deepEqual(linesFromPaste('Order\r\nPay\n\n  Get it  '), ['Order', 'Pay', 'Get it']);
  assert.deepEqual(linesFromPaste('- Order\n2. Pay'), ['Order', 'Pay']);
  assert.equal(linesFromPaste('One line only'), null);
  assert.equal(linesFromPaste('# Title\nOrder\nPay'), null);
  assert.equal(linesFromPaste('Order\nPay', '<h2>Order</h2><p>Pay</p>'), null);
  assert.deepEqual(linesFromPaste('Order\nPay', '<p>Order</p><p>Pay</p>'), ['Order', 'Pay']);
});

test('pasted lines become items of a block, a tab splitting the first field from the second', () => {
  assert.deepEqual(itemsFromPaste('Order\nPay'), [{ title: 'Order' }, { title: 'Pay' }]);
  assert.deepEqual(itemsFromPaste('Hours?\tMon–Fri\r\n\r\nParking?\t', '', ['question', 'answer']), [
    { question: 'Hours?', answer: 'Mon–Fri' },
    { question: 'Parking?' },
  ]);
  assert.deepEqual(itemsFromPaste('- Tea\tHot\tand sweet\n2) Cake'), [{ title: 'Tea', text: 'Hot and sweet' }, { title: 'Cake' }]);
  assert.equal(itemsFromPaste('One line only'), null);
  assert.equal(itemsFromPaste('# Menu\nTea\nCake'), null);
  assert.equal(itemsFromPaste('Tea\nCake', '<h2>Menu</h2><p>Tea</p><p>Cake</p>'), null);
});

test('a paste into a Table: tab-separated lines, made rectangular', () => {
  assert.deepEqual(gridFromPaste('Day\tHours\r\nMon\t9–17\nSat\n'), [
    ['Day', 'Hours'],
    ['Mon', '9–17'],
    ['Sat', ''],
  ]);
  assert.deepEqual(gridFromPaste(' Tea \t 4 €'), [['Tea', '4 €']]);
  assert.deepEqual(gridFromPaste('Tea\nCake'), [['Tea'], ['Cake']]);
  assert.equal(gridFromPaste('One line'), null);
  assert.equal(gridFromPaste(''), null);
  assert.equal(gridFromPaste('# Menu\tPrice\nTea\t4'), null);
  assert.equal(gridFromPaste('Tea\t4\nCake\t5', '<h2>Menu</h2><table><tr><td>Tea</td><td>4</td></tr></table>'), null);
});

test('a document’s table on the clipboard gives the rows of its html', () => {
  const docs = readFileSync(new URL('../lib/fixtures/paste/google-docs-table.html', import.meta.url), 'utf8');
  assert.deepEqual(gridFromPaste('Day\nHours\nMon – Fri\n9–17\nSat\nClosed', docs), [
    ['Day', 'Hours'],
    ['Mon – Fri', '9–17'],
    ['Sat', 'Closed'],
  ]);
  const word = readFileSync(new URL('../lib/fixtures/paste/word-table.html', import.meta.url), 'utf8');
  assert.deepEqual(gridFromPaste('Product\tPrice\nTea & cake\t4\n€ each', word), [
    ['Product', 'Price'],
    ['Tea & cake', '4 € each'],
  ]);
  assert.deepEqual(
    gridFromPaste('x', '<table><tr><th>A &lt;b&gt;</th><td>&#x42;<br>&#67;</td><td>1</td></tr><tr><td>2</td></tr></table>'),
    [
      ['A <b>', 'B C', '1'],
      ['2', '', ''],
    ],
  );
});
