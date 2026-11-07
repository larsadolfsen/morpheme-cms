// Tests for lib/strayDividers.mjs: a divider is hidden when it is first or last on its line.
import test from 'node:test';
import assert from 'node:assert/strict';
import { strayDividers } from './strayDividers.mjs';

test('on one line no divider is stray', () => {
  assert.deepEqual(strayDividers([0, 0, 0, 0, 0]), []);
});

test('a divider that ends a line is stray', () => {
  assert.deepEqual(strayDividers([0, 0, 0, 0, 24]), [3]);
});

test('a divider that starts a line is stray', () => {
  assert.deepEqual(strayDividers([0, 0, 0, 24, 24]), [3]);
});

test('a divider that ends one line and one that starts the next are both stray', () => {
  assert.deepEqual(strayDividers([0, 0, 0, 0, 24, 24, 24]), [3]);
  assert.deepEqual(strayDividers([0, 0, 0, 24, 24, 24, 48]), [3, 5]);
});

test('a row of one item has none', () => {
  assert.deepEqual(strayDividers([0]), []);
});
