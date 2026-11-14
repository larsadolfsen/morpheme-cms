/**
 * Tests for selecting several blocks of a page.
 * Exposes test cases for blockSelectionRules.mjs.
 * Depends on `node:test`, `node:assert/strict`, and `./blockSelectionRules.mjs`.
 */
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { allOf, hideChoice, range, removeChoice, toggle } from './blockSelectionRules.mjs';

test('toggle adds a place in the order of the text and takes it out again', () => {
  assert.deepEqual(toggle([2], 0), [0, 2]);
  assert.deepEqual(toggle([0, 2], 2), [0]);
});

test('range adds every block between two places, either way round, without a start only one', () => {
  const blocks = [1, 3, 4, 7];
  assert.deepEqual(range([1], blocks, 1, 4), [1, 3, 4]);
  assert.deepEqual(range([7], blocks, 7, 3), [3, 4, 7]);
  assert.deepEqual(range([], blocks, undefined, 4), [4]);
  assert.deepEqual(range([1], blocks, 1, 2), [1]);
  assert.deepEqual(allOf(blocks), blocks);
});

test('Hide hides all that are shown, a mix reads Hide, and only hidden blocks read Show', () => {
  const some = hideChoice([
    { place: 0, hidden: false, stays: false },
    { place: 2, hidden: true, stays: false },
  ]);
  assert.deepEqual(some, { action: 'hide', targets: [0], skipped: [] });
  const all = hideChoice([
    { place: 0, hidden: true, stays: false },
    { place: 2, hidden: true, stays: true },
  ]);
  assert.deepEqual(all, { action: 'show', targets: [0, 2], skipped: [] });
});

test('a block that stays shown is skipped by Hide and by Remove', () => {
  assert.deepEqual(
    hideChoice([
      { place: 0, hidden: false, stays: true },
      { place: 1, hidden: false, stays: false },
    ]),
    { action: 'hide', targets: [1], skipped: [0] },
  );
  assert.deepEqual(
    removeChoice([
      { place: 0, stays: true },
      { place: 1, stays: false },
    ]),
    { targets: [1], skipped: [0] },
  );
});
