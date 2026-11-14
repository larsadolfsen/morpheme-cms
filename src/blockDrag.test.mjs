/**
 * Tests for dragging a block by its handle.
 * Exposes test cases for blockDrag.mjs.
 * Depends on `node:test`, `node:assert/strict`, and `./blockDrag.mjs`.
 */
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { dragSteps, limitSteps } from './blockDrag.mjs';

const centres = [100, 300, 500, 700];

test('a finger over its own place moves nothing', () => {
  assert.equal(dragSteps(centres, 1, 300), 0);
  assert.equal(dragSteps(centres, 0, 150), 0);
});

test('below the centre of a part passes it, above the centre of a part before it passes that', () => {
  assert.equal(dragSteps(centres, 0, 550), 2);
  assert.equal(dragSteps(centres, 0, 900), 3);
  assert.equal(dragSteps(centres, 3, 250), -2);
  assert.equal(dragSteps(centres, 3, 0), -3);
});

test('a locked part is not passed, and the places before it are', () => {
  assert.equal(limitSteps([false, false, true, false], 0, 3), 1);
  assert.equal(limitSteps([false, true, false, false], 3, -3), -1);
  assert.equal(limitSteps([false, false, false], 0, 2), 2);
  assert.equal(limitSteps([false, true, false], 0, 1), 0);
  assert.equal(limitSteps([false, false], 0, 0), 0);
});
