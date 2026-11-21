// Tests lib/menuTypeAhead.mjs: which key is a letter to type ahead with, and which item it moves to.
import test from 'node:test';
import assert from 'node:assert/strict';
import { isTypeAheadKey, nextByLetter, nextInMenu } from './menuTypeAhead.mjs';

const key = (k, over = {}) => ({ key: k, ctrlKey: false, metaKey: false, altKey: false, ...over });
const labels = ['Bold', 'Italic', 'Link', 'Insert block', 'Undo'];

test('a letter types ahead; a space, a named key and a shortcut do not', () => {
  assert.equal(isTypeAheadKey(key('b')), true);
  assert.equal(isTypeAheadKey(key('B')), true);
  assert.equal(isTypeAheadKey(key(' ')), false);
  assert.equal(isTypeAheadKey(key('ArrowDown')), false);
  assert.equal(isTypeAheadKey(key('b', { ctrlKey: true })), false);
  assert.equal(isTypeAheadKey(key('b', { metaKey: true })), false);
  assert.equal(isTypeAheadKey(key('b', { altKey: true })), false);
});

test('the next item that starts with the letter, after the one the focus is on', () => {
  assert.equal(nextByLetter(labels, -1, 'i'), 1);
  assert.equal(nextByLetter(labels, 1, 'i'), 3);
  assert.equal(nextByLetter(labels, 3, 'l'), 2, 'round the end');
});

test('upper and lower case are the same, and the item the focus is on counts last', () => {
  assert.equal(nextByLetter(labels, 0, 'B'), 0);
  assert.equal(nextByLetter(labels, 4, 'u'), 4);
});

test('no item starts with it', () => {
  assert.equal(nextByLetter(labels, 0, 'x'), undefined);
  assert.equal(nextByLetter([], -1, 'a'), undefined);
});

test('a label with spaces in front is read without them', () => {
  assert.equal(nextByLetter(['  Redo'], -1, 'r'), 0);
});

test('nextInMenu: the arrow keys, Home and End, and a letter', () => {
  assert.equal(nextInMenu(key('ArrowDown'), labels, 1), 2);
  assert.equal(nextInMenu(key('ArrowUp'), labels, 0), -1);
  assert.equal(nextInMenu(key('ArrowUp'), labels, -1), labels.length - 1);
  assert.equal(nextInMenu(key('Home'), labels, 3), 0);
  assert.equal(nextInMenu(key('End'), labels, 0), labels.length - 1);
  assert.equal(nextInMenu(key('Enter'), labels, 0), undefined);
});
