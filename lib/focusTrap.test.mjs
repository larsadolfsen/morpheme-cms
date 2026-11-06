// Tests lib/focusTrap.mjs: which stops count in the drawer and where Tab wraps.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trapTarget, visibleElements } from './focusTrap.mjs';

const el = (name, drawn) => ({ name, getClientRects: () => (drawn ? [{}] : []) });

test('visibleElements drops the elements that are not drawn', () => {
  const list = [el('a', true), el('hidden', false), el('b', true)];
  assert.deepEqual(
    visibleElements(list).map((e) => e.name),
    ['a', 'b'],
  );
});

test('the last stop is the last drawn one, not a hidden element after it', () => {
  const list = visibleElements([el('first', true), el('last', true), el('hidden link', false)]);
  assert.equal(trapTarget(false, 1, list.length), 0);
});

test('Tab on the last stop wraps to the first', () => {
  assert.equal(trapTarget(false, 2, 3), 0);
});

test('Shift+Tab on the first stop wraps to the last', () => {
  assert.equal(trapTarget(true, 0, 3), 2);
});

test('Tab inside the list is left to the browser', () => {
  assert.equal(trapTarget(false, 0, 3), null);
  assert.equal(trapTarget(true, 2, 3), null);
});

test('focus outside the list goes to its first or last stop', () => {
  assert.equal(trapTarget(false, -1, 3), 0);
  assert.equal(trapTarget(true, -1, 3), 2);
});

test('an empty list has no target', () => {
  assert.equal(trapTarget(false, -1, 0), null);
});
