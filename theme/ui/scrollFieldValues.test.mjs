import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  indexAfterKey,
  indexAtScroll,
  isNumeric,
  itemOfTyped,
  loopCopies,
  placeIn,
  restingIndex,
  scrollFieldItems,
  sizeOfItems,
} from './scrollFieldValues.ts';

test('items take a value and a label from a number, a text or both', () => {
  assert.deepEqual(scrollFieldItems([7, 'b', { value: 3, label: 'three' }]), [
    { value: '7', label: '7' },
    { value: 'b', label: 'b' },
    { value: '3', label: 'three' },
  ]);
});

test('the size follows the longest label', () => {
  assert.equal(sizeOfItems(scrollFieldItems([1, 59])), 'small');
  assert.equal(sizeOfItems(scrollFieldItems([100, 150])), 'medium');
  assert.equal(sizeOfItems(scrollFieldItems([2026])), 'large');
});

test('a finite list keeps a place on its ends, a looping one comes round', () => {
  assert.equal(placeIn(-1, 12), 0);
  assert.equal(placeIn(12, 12), 11);
  assert.equal(placeIn(-1, 12, true), 11);
  assert.equal(placeIn(12, 12, true), 0);
  assert.equal(placeIn(25, 12, true), 1);
});

test('a looping field rests in the middle copy', () => {
  assert.equal(restingIndex(0, 12), 12);
  assert.equal(restingIndex(11, 12), 23);
  assert.equal(loopCopies, 3);
  assert.equal(indexAtScroll(24 * 80, 80, 36), 24);
  assert.equal(indexAtScroll(1e6, 80, 36), 35);
});

test('keys move a field: up and down by one, pages, the ends; a loop has no ends but Home and End stay', () => {
  assert.equal(indexAfterKey('ArrowDown', 5, 12), 6);
  assert.equal(indexAfterKey('ArrowUp', 0, 12), 0);
  assert.equal(indexAfterKey('ArrowUp', 0, 12, true), 11);
  assert.equal(indexAfterKey('ArrowDown', 11, 12, true), 0);
  assert.equal(indexAfterKey('PageDown', 10, 12), 11);
  assert.equal(indexAfterKey('PageDown', 10, 12, true, 5), 3);
  assert.equal(indexAfterKey('Home', 5, 12, true), 0);
  assert.equal(indexAfterKey('End', 5, 12, true), 11);
  assert.equal(indexAfterKey('a', 5, 12), undefined);
});

test('typed text names an item: a number as the number it is, a word by its first letters', () => {
  const numbers = scrollFieldItems([0, 7, 12]);
  assert.equal(itemOfTyped(numbers, '07')?.value, '7');
  assert.equal(itemOfTyped(numbers, '8'), undefined);
  const months = scrollFieldItems(['January', 'June', 'July']);
  assert.equal(itemOfTyped(months, 'june')?.value, 'June');
  assert.equal(itemOfTyped(months, 'ju'), undefined);
  assert.equal(itemOfTyped(months, 'ju', true)?.value, 'June');
  assert.equal(itemOfTyped(months, ' '), undefined);
});

test('a list of whole numbers is numeric', () => {
  assert.equal(isNumeric(scrollFieldItems([0, 5, -2])), true);
  assert.equal(isNumeric(scrollFieldItems(['a', 1])), false);
  assert.equal(isNumeric([]), false);
});
