import test from 'node:test';
import assert from 'node:assert/strict';
import { caretScrollStep } from './caretScroll.mjs';

// The band between the text bar (bottom at 46) and the Save bar (top at 348) on a phone with the keyboard open.
const band = { top: 46, bottom: 348 };

test('a cursor in the band does not scroll', () => {
  assert.equal(caretScrollStep({ rectTop: 200, rectBottom: 216, ...band }), 0);
});

test('a cursor under the text bar scrolls up until it clears the bar', () => {
  assert.equal(caretScrollStep({ rectTop: 5, rectBottom: 21, ...band }), -49);
});

test('a cursor under the Save bar scrolls down until it clears the bar', () => {
  assert.equal(caretScrollStep({ rectTop: 340, rectBottom: 356, ...band }), 16);
});

test('a cursor below the keyboard scrolls down', () => {
  assert.equal(caretScrollStep({ rectTop: 600, rectBottom: 616, ...band }), 276);
});

test('a rect taller than the band that is in it stays where it is', () => {
  assert.equal(caretScrollStep({ rectTop: 76, rectBottom: 700, ...band }), 0);
});

test('a rect taller than the band below it gets its top at the top edge', () => {
  assert.equal(caretScrollStep({ rectTop: 376, rectBottom: 800, ...band }), 322);
});
