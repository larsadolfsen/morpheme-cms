/**
 * Tests for the rules of selecting several rows.
 * Exposes test cases for selectionRules.mjs.
 * Depends on `node:test`, `node:assert/strict`, and `./selectionRules.mjs`.
 */
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { keyAction, neighbourKey, pruneKeys, rangeKeys, selectAllKeys, toggleKey } from './selectionRules.mjs';

const order = ['a', 'b', 'c', 'd', 'e'];

test('toggleKey adds and removes', () => {
  assert.deepEqual(toggleKey([], 'x'), ['x']);
  assert.deepEqual(toggleKey(['x', 'y'], 'x'), ['y']);
});

test('rangeKeys adds the rows between the anchor and the target, either way', () => {
  assert.deepEqual(rangeKeys(['b'], order, 'b', 'd'), ['b', 'c', 'd']);
  assert.deepEqual(rangeKeys(['d'], order, 'd', 'b'), ['d', 'b', 'c']);
  assert.deepEqual(rangeKeys(['a', 'c'], order, 'a', 'c'), ['a', 'c', 'b']);
});

test('rangeKeys adds only the target without a known anchor, and nothing for an unknown target', () => {
  assert.deepEqual(rangeKeys([], order, undefined, 'c'), ['c']);
  assert.deepEqual(rangeKeys([], order, 'gone', 'c'), ['c']);
  assert.deepEqual(rangeKeys(['a'], order, 'a', 'gone'), ['a']);
});

test('selectAllKeys is every row, as a copy', () => {
  const all = selectAllKeys(order);
  assert.deepEqual(all, order);
  assert.notEqual(all, order);
});

test('pruneKeys drops the rows that are gone and keeps the array when none is', () => {
  const keys = ['a', 'z'];
  assert.deepEqual(pruneKeys(keys, order), ['a']);
  const same = ['a', 'b'];
  assert.equal(pruneKeys(same, order), same);
});

test('neighbourKey steps and clamps', () => {
  assert.equal(neighbourKey(order, 'b', 1), 'c');
  assert.equal(neighbourKey(order, 'a', -1), 'a');
  assert.equal(neighbourKey(order, 'e', 1), 'e');
  assert.equal(neighbourKey(order, 'x', 1), undefined);
});

test('keyAction maps the keys', () => {
  const k = (key, extra = {}) => ({ key, shiftKey: false, ctrlKey: false, metaKey: false, ...extra });
  assert.equal(keyAction(k(' '), { selecting: true, onRow: true }), 'toggle');
  assert.equal(keyAction(k(' '), { selecting: false, onRow: true }), null);
  assert.equal(keyAction(k(' '), { selecting: true, onRow: false }), null);
  assert.equal(keyAction(k('ArrowDown', { shiftKey: true }), { selecting: true, onRow: true }), 'range-next');
  assert.equal(keyAction(k('ArrowUp', { shiftKey: true }), { selecting: true, onRow: true }), 'range-prev');
  assert.equal(keyAction(k('ArrowDown'), { selecting: true, onRow: true }), null);
  assert.equal(keyAction(k('a', { ctrlKey: true }), { selecting: true, onRow: false }), 'all');
  assert.equal(keyAction(k('A', { metaKey: true }), { selecting: true, onRow: true }), 'all');
  assert.equal(keyAction(k('a', { ctrlKey: true }), { selecting: false, onRow: true }), null);
  assert.equal(keyAction(k('Escape'), { selecting: true, onRow: false }), 'clear');
  assert.equal(keyAction(k('Escape'), { selecting: false, onRow: true }), null);
});
