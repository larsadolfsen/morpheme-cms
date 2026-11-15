// Tests for lib/enterKey.mjs: an Enter that confirms an IME composition is not an action.
import test from 'node:test';
import assert from 'node:assert/strict';
import { isActionEnter } from './enterKey.mjs';

test('a plain Enter is an action', () => {
  assert.equal(isActionEnter({ key: 'Enter', isComposing: false, keyCode: 13 }), true);
});

test('another key is not', () => {
  assert.equal(isActionEnter({ key: 'a', isComposing: false, keyCode: 65 }), false);
});

test('Enter while composing is not an action', () => {
  assert.equal(isActionEnter({ key: 'Enter', isComposing: true, keyCode: 13 }), false);
});

test('the confirming Enter with keyCode 229 (Safari) is not an action', () => {
  assert.equal(isActionEnter({ key: 'Enter', isComposing: false, keyCode: 229 }), false);
});

test('a React event is read through its nativeEvent', () => {
  assert.equal(isActionEnter({ key: 'Enter', nativeEvent: { isComposing: true, keyCode: 229 } }), false);
  assert.equal(isActionEnter({ key: 'Enter', nativeEvent: { isComposing: false, keyCode: 13 } }), true);
});
