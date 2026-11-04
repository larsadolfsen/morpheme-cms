// Tests for sideBlockOf function.
// Validates side block selection logic.
// Depends on lib/side-block.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sideBlockOf } from './side-block.mjs';

const yes = () => true;
const no = () => false;

test('returns null when setting is null', () => {
  assert.equal(sideBlockOf({}, null, yes), null);
});

test('returns null when setting.block is null', () => {
  assert.equal(sideBlockOf({}, { block: null }, yes), null);
});

test('returns block type when valid', () => {
  assert.equal(sideBlockOf({}, { block: 'side-card' }, yes), 'side-card');
});

test('returns null when page.wide is true', () => {
  assert.equal(sideBlockOf({ wide: true }, { block: 'side-card' }, yes), null);
});

test('returns null when page.side is false', () => {
  assert.equal(sideBlockOf({ side: false }, { block: 'side-card' }, yes), null);
});

test('returns block type when page.side is true', () => {
  assert.equal(sideBlockOf({ side: true }, { block: 'side-card' }, yes), 'side-card');
});

test('returns null when beside returns false', () => {
  assert.equal(sideBlockOf({}, { block: 'side-card' }, no), null);
});

test('beside is called with the chosen type', () => {
  const seen = [];
  sideBlockOf({}, { block: 'side-card' }, (t) => {
    seen.push(t);
    return true;
  });
  assert.deepEqual(seen, ['side-card']);
});

test('treats undefined page as empty object', () => {
  assert.equal(sideBlockOf(undefined, { block: 'side-card' }, yes), 'side-card');
});
