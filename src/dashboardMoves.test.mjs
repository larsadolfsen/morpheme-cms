// Tests for src/dashboardMoves.mjs: moving a card one step or onto another card in edit mode, and the card under the pointer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveBy, moveOnto, cardAt } from './dashboardMoves.mjs';

const dash = (...ids) => ({ version: 1, widgets: ids.map((id) => ({ id, widget: 'cms:continue', settings: {} })) });
const order = (d) => d.widgets.map((p) => p.id);

test('moveBy moves a card one step and says its new position', () => {
  const down = moveBy(dash('a', 'b', 'c'), ['a', 'b', 'c'], 'a', 1);
  assert.deepEqual(order(down.dashboard), ['b', 'a', 'c']);
  assert.deepEqual([down.position, down.total], [2, 3]);
  const up = moveBy(dash('a', 'b', 'c'), ['a', 'b', 'c'], 'c', -1);
  assert.deepEqual(order(up.dashboard), ['a', 'c', 'b']);
  assert.equal(up.position, 2);
});

test('moveBy does nothing at the ends and for an unknown card', () => {
  assert.equal(moveBy(dash('a', 'b'), ['a', 'b'], 'a', -1), null);
  assert.equal(moveBy(dash('a', 'b'), ['a', 'b'], 'b', 1), null);
  assert.equal(moveBy(dash('a', 'b'), ['a', 'b'], 'x', 1), null);
});

test('moveBy counts only the cards shown and steps over a placement with no widget', () => {
  const d = dash('a', 'gone', 'b', 'c');
  const moved = moveBy(d, ['a', 'b', 'c'], 'a', 1);
  assert.deepEqual(order(moved.dashboard), ['gone', 'b', 'a', 'c']);
  assert.deepEqual([moved.position, moved.total], [2, 3]);
});

test('moveOnto puts the card where the other card was', () => {
  const down = moveOnto(dash('a', 'b', 'c'), ['a', 'b', 'c'], 'a', 'c');
  assert.deepEqual(order(down.dashboard), ['b', 'c', 'a']);
  assert.equal(down.position, 3);
  const up = moveOnto(dash('a', 'b', 'c'), ['a', 'b', 'c'], 'c', 'a');
  assert.deepEqual(order(up.dashboard), ['c', 'a', 'b']);
  assert.equal(up.position, 1);
});

test('moveOnto does nothing when dropped on itself or on an unknown card', () => {
  assert.equal(moveOnto(dash('a', 'b'), ['a', 'b'], 'a', 'a'), null);
  assert.equal(moveOnto(dash('a', 'b'), ['a', 'b'], 'a', 'x'), null);
});

test('cardAt finds the card under the pointer', () => {
  const rects = [
    { left: 0, top: 0, right: 100, bottom: 50 },
    { left: 110, top: 0, right: 210, bottom: 50 },
  ];
  assert.equal(cardAt(rects, 150, 20), 1);
  assert.equal(cardAt(rects, 5, 5), 0);
  assert.equal(cardAt(rects, 105, 20), -1);
  assert.equal(cardAt([], 0, 0), -1);
});
