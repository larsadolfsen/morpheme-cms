// Tests for src/notificationKeys.mjs: the key is the time and the text, and withoutKeys drops exactly those. Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notificationKey, withoutKeys } from './notificationKeys.mjs';

const a = { at: 1, text: 'One', type: 'saved' };
const b = { at: 2, text: 'Two', type: 'saved' };
const c = { at: 2, text: 'Three', type: 'failed' };

test('the key is the time and the text', () => {
  assert.equal(notificationKey(a), '1-One');
});

test('the same time with another text is another key', () => {
  assert.notEqual(notificationKey(b), notificationKey(c));
});

test('withoutKeys removes only the notifications with those keys', () => {
  assert.deepEqual(withoutKeys([a, b, c], [notificationKey(b)]), [a, c]);
});

test('withoutKeys with no keys, or keys that are not there, keeps all', () => {
  assert.deepEqual(withoutKeys([a, b], []), [a, b]);
  assert.deepEqual(withoutKeys([a, b], ['9-Nope']), [a, b]);
});

test('withoutKeys does not change the list it is given', () => {
  const items = [a, b];
  withoutKeys(items, [notificationKey(a)]);
  assert.equal(items.length, 2);
});
