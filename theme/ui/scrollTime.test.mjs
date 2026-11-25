// Tests of the scroll time picker's value maths (scrollTime.ts).
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fieldAfterArrow,
  hourOfShown,
  indexAtScroll,
  indexOfValue,
  scrollOfIndex,
  scrollValues,
  shownHour,
  valueAfterKey,
  valueAtIndex,
} from './scrollTime.ts';

test('the fields list the hours 0–23 (1–12 on a 12-hour clock) and the minutes 0–59', () => {
  assert.deepEqual([scrollValues('hour')[0], scrollValues('hour').length], [0, 24]);
  assert.deepEqual([scrollValues('hour', true)[0], scrollValues('hour', true).length], [1, 12]);
  assert.deepEqual([scrollValues('minute')[0], scrollValues('minute').length], [0, 60]);
});

test('a value and its place in the list go both ways, and a value past an end is its end', () => {
  assert.equal(indexOfValue('hour', 14), 14);
  assert.equal(indexOfValue('hour', 2, true), 1);
  assert.equal(valueAtIndex('hour', 1, true), 2);
  assert.equal(indexOfValue('minute', 75), 59);
  assert.equal(valueAtIndex('minute', -3), 0);
});

test('a scrolled field is at the item in its middle (snapping to the nearest)', () => {
  assert.equal(indexAtScroll(0, 80, 24), 0);
  assert.equal(indexAtScroll(79, 80, 24), 1);
  assert.equal(indexAtScroll(119, 80, 24), 1);
  assert.equal(indexAtScroll(121, 80, 24), 2);
  assert.equal(indexAtScroll(99999, 80, 24), 23);
  assert.equal(indexAtScroll(-20, 80, 24), 0);
  assert.equal(indexAtScroll(10, 0, 24), 0);
  assert.equal(scrollOfIndex(3, 80), 240);
});

test('the hour as the clock shows it, and back to the hour of the day', () => {
  assert.equal(shownHour(14), 14);
  assert.equal(shownHour(14, true), 2);
  assert.equal(shownHour(0, true), 12);
  assert.equal(shownHour(12, true), 12);
  assert.equal(hourOfShown(2, true, true), 14);
  assert.equal(hourOfShown(12, true, false), 0);
  assert.equal(hourOfShown(12, true, true), 12);
  assert.equal(hourOfShown(7, false, true), 7);
});

test('keys: up and down the previous and the next value, pages, the ends, and no wrap-around', () => {
  assert.equal(valueAfterKey('minute', 'ArrowDown', 30), 31);
  assert.equal(valueAfterKey('minute', 'ArrowUp', 30), 29);
  assert.equal(valueAfterKey('minute', 'PageDown', 30), 35);
  assert.equal(valueAfterKey('hour', 'PageUp', 14), 8);
  assert.equal(valueAfterKey('minute', 'Home', 30), 0);
  assert.equal(valueAfterKey('minute', 'End', 30), 59);
  assert.equal(valueAfterKey('hour', 'End', 3, true), 12);
  assert.equal(valueAfterKey('hour', 'Home', 3, true), 1);
  assert.equal(valueAfterKey('minute', 'ArrowDown', 59), 59);
  assert.equal(valueAfterKey('hour', 'ArrowUp', 0), 0);
  assert.equal(valueAfterKey('hour', 'a', 3), undefined);
});

test('left and right move between the hours and the minutes', () => {
  assert.equal(fieldAfterArrow('hour', 'ArrowRight'), 'minute');
  assert.equal(fieldAfterArrow('minute', 'ArrowLeft'), 'hour');
  assert.equal(fieldAfterArrow('hour', 'ArrowLeft'), undefined);
  assert.equal(fieldAfterArrow('minute', 'ArrowRight'), undefined);
});
