// Tests for theme/ui/longPressRules.mjs: mouse ignored, a move of more than 10 px cancels, the click after a fired press is swallowed, a tap selects while selecting. Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canPress, secondFinger, movedAway, clickAfter, edgeScroll } from './longPressRules.mjs';

test('a mouse never presses, a touch or a pen does', () => {
  assert.equal(canPress('mouse', true), false);
  assert.equal(canPress('touch', true), true);
  assert.equal(canPress('pen', true), true);
});

test('a second finger does not press', () => {
  assert.equal(canPress('touch', false), false);
});

test('a move of 10 px or less keeps the press, more cancels it', () => {
  const start = { x: 100, y: 100 };
  assert.equal(movedAway(start, 100, 100), false);
  assert.equal(movedAway(start, 110, 100), false);
  assert.equal(movedAway(start, 106, 108), false);
  assert.equal(movedAway(start, 111, 100), true);
  assert.equal(movedAway(start, 100, 89), true);
});

test('without a start there is nothing to cancel', () => {
  assert.equal(movedAway(null, 500, 500), false);
});

test('the click after a fired press is swallowed, also while selecting', () => {
  assert.equal(clickAfter(true, false), 'swallow');
  assert.equal(clickAfter(true, true), 'swallow');
});

test('a tap while selecting selects instead of its own action', () => {
  assert.equal(clickAfter(false, true), 'select');
});

test('a tap outside selection is the item own', () => {
  assert.equal(clickAfter(false, false), 'pass');
});

test('edgeScroll: nothing in the middle, faster the closer to an edge, up is negative', () => {
  assert.equal(edgeScroll(400, 0, 800), 0);
  assert.equal(edgeScroll(72, 0, 800), 0);
  assert.ok(edgeScroll(36, 0, 800) < 0 && edgeScroll(10, 0, 800) < edgeScroll(36, 0, 800));
  assert.equal(edgeScroll(-20, 0, 800), -16);
  assert.ok(edgeScroll(764, 0, 800) > 0);
  assert.equal(edgeScroll(900, 0, 800), 16);
});

test('a second finger selects only while the first one rests on the item, never a mouse', () => {
  assert.equal(secondFinger('touch', false, true), true);
  assert.equal(secondFinger('pen', false, true), true);
  assert.equal(secondFinger('touch', false, false), false);
  assert.equal(secondFinger('touch', true, true), false);
  assert.equal(secondFinger('mouse', false, true), false);
});
