// Tests for lib/drawerKeys.mjs: where the arrow keys, Home and End move the focus in a navigation drawer's items. Run: node --test packages/editor/lib/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawerKeyTarget } from './drawerKeys.mjs';

test('ArrowDown moves to the next item', () => assert.equal(drawerKeyTarget('ArrowDown', 1, 4), 2));
test('ArrowUp moves to the previous item', () => assert.equal(drawerKeyTarget('ArrowUp', 2, 4), 1));
test('ArrowDown stays on the last item', () => assert.equal(drawerKeyTarget('ArrowDown', 3, 4), 3));
test('ArrowUp stays on the first item', () => assert.equal(drawerKeyTarget('ArrowUp', 0, 4), 0));
test('Home goes to the first item', () => assert.equal(drawerKeyTarget('Home', 3, 4), 0));
test('End goes to the last item', () => assert.equal(drawerKeyTarget('End', 0, 4), 3));
test('other keys are not ours', () => {
  assert.equal(drawerKeyTarget('Enter', 1, 4), null);
  assert.equal(drawerKeyTarget('ArrowLeft', 1, 4), null);
  assert.equal(drawerKeyTarget('Tab', 1, 4), null);
});
test('no items, or focus not on an item, gives nothing', () => {
  assert.equal(drawerKeyTarget('ArrowDown', 0, 0), null);
  assert.equal(drawerKeyTarget('ArrowDown', -1, 4), null);
  assert.equal(drawerKeyTarget('End', 4, 4), null);
});
