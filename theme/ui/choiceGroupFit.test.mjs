// Tests for theme/ui/choiceGroupFit.mjs: the widest button at an equal share decides, gaps count, more than five is a list,
// and the switch back to buttons needs 8 px more. Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitsAsButtons, HYSTERESIS, MAX_BUTTONS } from './choiceGroupFit.mjs';

test('short choices fit side by side', () => {
  assert.equal(fitsAsButtons([70, 80, 70], 312, 2, true), true);
  assert.equal(fitsAsButtons([70, 80, 70], 312, 2, false), true);
});

test('the widest button at an equal share decides, not the sum', () => {
  // Sum 230 fits in 271, but 3 × 150 + 4 does not.
  assert.equal(fitsAsButtons([40, 40, 150], 271, 2, true), false);
});

test('the gaps count', () => {
  assert.equal(fitsAsButtons([100, 100], 202, 2, true), true);
  assert.equal(fitsAsButtons([100, 100], 201, 2, true), false);
});

test('more than five choices, none, or no width is always a list', () => {
  assert.equal(MAX_BUTTONS, 5);
  assert.equal(fitsAsButtons([10, 10, 10, 10, 10, 10], 1000, 2, true), false);
  assert.equal(fitsAsButtons([10, 10, 10, 10, 10], 1000, 2, true), true);
  assert.equal(fitsAsButtons([], 1000, 2, true), false);
  assert.equal(fitsAsButtons([10, 10], 0, 2, true), false);
});

test('a list needs 8 px more to become buttons again; buttons stay until they no longer fit', () => {
  assert.equal(HYSTERESIS, 8);
  // Needed: 2 × 100 + 2 = 202.
  assert.equal(fitsAsButtons([100, 100], 205, 2, true), true);
  assert.equal(fitsAsButtons([100, 100], 205, 2, false), false);
  assert.equal(fitsAsButtons([100, 100], 210, 2, false), true);
  assert.equal(fitsAsButtons([100, 100], 201, 2, true), false);
});
