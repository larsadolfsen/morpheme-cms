// The cells of the DataTable part (dataTable.mjs): the drawn kind, a number's value as `isNumber` accepts it, sort keys and search text.
import assert from 'node:assert/strict';
import test from 'node:test';
import { KINDS, cellOf, kindOf, numberOf, searchText, sortKey } from './dataTable.mjs';
import { isNumber } from '../../src/standard/table/rows.mjs';

test('every kind is listed', () => {
  assert.deepEqual([...KINDS], ['text', 'number', 'link', 'date', 'tag', 'yesno', 'icon', 'image']);
});

test('only text and number are drawn as themselves; anything else is text', () => {
  assert.equal(kindOf({ kind: 'number' }), 'number');
  assert.equal(kindOf({ kind: 'text' }), 'text');
  for (const e of [undefined, null, 'number', {}, { kind: 'date' }, { kind: 'image' }, { kind: 'odd' }, { kind: 7 }, { align: 'right' }]) {
    assert.equal(kindOf(e), 'text', JSON.stringify(e));
  }
});

test('numbers are read as isNumber accepts them', () => {
  const cases = [
    ['7', 7],
    ['-3', -3],
    ['+4', 4],
    ['−3', -3],
    ['1,299', 1299],
    ['1.299', 1299],
    ['1,200.50', 1200.5],
    ['1.200,50', 1200.5],
    ['1 200 000', 1200000],
    ["1'200", 1200],
    ['1 200,5', 1200.5],
    ['1.234.567', 1234567],
    ['3,5 %', 3.5],
    ['3.25', 3.25],
    ['12 %', 12],
    ['149 kr', 149],
    ['$7', 7],
    ['€ 9,99', 9.99],
    [' 42 ', 42],
  ];
  for (const [text, value] of cases) {
    assert.equal(isNumber(text), true, text);
    assert.equal(numberOf(text), value, text);
  }
  for (const text of ['', 'Text', 'a7', 'Q1 2026']) assert.equal(numberOf(text), null, text);
});

test('a cell is parsed by its kind', () => {
  assert.deepEqual(cellOf('number', '1,299'), { kind: 'number', text: '1,299', value: 1299 });
  assert.deepEqual(cellOf('number', 'n/a'), { kind: 'number', text: 'n/a', value: null });
  assert.deepEqual(cellOf('text', '1,299'), { kind: 'text', text: '1,299' });
  assert.deepEqual(cellOf('date', 'x'), { kind: 'text', text: 'x' });
});

test('sort keys: a number by its value (empty and not a number are null), text trimmed', () => {
  assert.equal(sortKey('number', '1,200.50'), 1200.5);
  assert.equal(sortKey('number', ''), null);
  assert.equal(sortKey('number', 'n/a'), null);
  assert.equal(sortKey('text', '  Apple '), 'Apple');
  const sorted = ['10', '9', '1,000'].sort((a, b) => Number(sortKey('number', a)) - Number(sortKey('number', b)));
  assert.deepEqual(sorted, ['9', '10', '1,000']);
});

test('a search looks in the cell as drawn', () => {
  assert.equal(searchText('text', 'Apple pie'), 'Apple pie');
  assert.equal(searchText('number', '149 kr'), '149 kr');
});
