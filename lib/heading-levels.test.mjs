// Tests lib/heading-levels.mjs: on a page the first heading is the H1 and no later one is.
// Run with `node --test packages/editor/lib/*.test.mjs` (part of npm run check).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headingLevels, showsH1Choice, headingChoices } from './heading-levels.mjs';

test('no headings, no levels', () => {
  assert.deepEqual(headingLevels([]), []);
});

test('the first heading becomes 1, whatever it was', () => {
  assert.deepEqual(headingLevels([2]), [1]);
  assert.deepEqual(headingLevels([3, 2]), [1, 2]);
  assert.deepEqual(headingLevels([1]), [1]);
});

test('every later 1 becomes 2', () => {
  assert.deepEqual(headingLevels([1, 1, 2, 1]), [1, 2, 2, 2]);
  assert.deepEqual(headingLevels([2, 1]), [1, 2]);
});

test('later 2s and 3s stay as they are', () => {
  assert.deepEqual(headingLevels([1, 2, 3, 2, 3]), [1, 2, 3, 2, 3]);
});

test('the list given is not changed', () => {
  const given = [2, 1, 3];
  headingLevels(given);
  assert.deepEqual(given, [2, 1, 3]);
});

test('the H1 choice is shown only while no heading is an H1', () => {
  assert.equal(showsH1Choice([]), true);
  assert.equal(showsH1Choice([2, 3]), true);
  assert.equal(showsH1Choice([1]), false);
  assert.equal(showsH1Choice([2, 1, 3]), false);
});

test('only H1 is offered until the page has one', () => {
  assert.deepEqual(headingChoices([]), [1]);
  assert.deepEqual(headingChoices([2, 3]), [1]);
  assert.deepEqual(headingChoices([1]), [2, 3]);
  assert.deepEqual(headingChoices([1, 2, 3]), [2, 3]);
  assert.deepEqual(headingChoices([2, 1]), [2, 3]);
});

test('the list given to headingChoices is not changed', () => {
  const given = [2, 1];
  headingChoices(given);
  assert.deepEqual(given, [2, 1]);
});
