// Tests lib/drawer-swipe.mjs: when a drag across the modal drawer closes it.
// Run with `node --test packages/editor/lib/*.test.mjs` (part of npm run check).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { swipeCloses, SWIPE_DISTANCE } from './drawer-swipe.mjs';

test('a swipe toward the left edge closes it', () => {
  assert.equal(swipeCloses(-SWIPE_DISTANCE, 0), true);
  assert.equal(swipeCloses(-120, 10), true);
});

test('a swipe toward the right edge does not, left to right', () => {
  assert.equal(swipeCloses(120, 0), false);
});

test('right to left it is the other way round', () => {
  assert.equal(swipeCloses(120, 0, true), true);
  assert.equal(swipeCloses(-120, 0, true), false);
});

test('a short drag does not close it', () => {
  assert.equal(swipeCloses(-(SWIPE_DISTANCE - 1), 0), false);
});

test('a mostly vertical drag (scrolling the list) does not close it', () => {
  assert.equal(swipeCloses(-60, 80), false);
  assert.equal(swipeCloses(-60, 30), true);
  assert.equal(swipeCloses(-60, 31), false);
});

test('a tap does not close it', () => {
  assert.equal(swipeCloses(0, 0), false);
});
