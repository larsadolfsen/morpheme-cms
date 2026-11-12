// Tests for lib/freeTitle.mjs: the number added to a title another file has.
import test from 'node:test';
import assert from 'node:assert/strict';
import { freeTitle } from './freeTitle.mjs';

const without =
  (...used) =>
  (title) =>
    used.includes(title);

test('a title without a number gets 2', () => {
  assert.equal(freeTitle('Test', without('Test')), 'Test 2');
});

test('the lowest free number is used', () => {
  assert.equal(freeTitle('Test', without('Test', 'Test 2')), 'Test 3');
  assert.equal(freeTitle('Test', without('Test', 'Test 2', 'Test 3')), 'Test 4');
});

test('a number at the end is increased, never added after', () => {
  assert.equal(freeTitle('Test 1', without('Test 1')), 'Test 2');
  assert.equal(freeTitle('Test 1', without('Test 1', 'Test 2')), 'Test 3');
  assert.notEqual(freeTitle('Test 1', without('Test 1')), 'Test 1 1');
});

test('a number inside the title stays', () => {
  assert.equal(freeTitle('2024 plan', without('2024 plan')), '2024 plan 2');
  assert.equal(freeTitle('2024 plan 2', without('2024 plan 2')), '2024 plan 3');
});

test('a title that is only a number gets 2 after it', () => {
  assert.equal(freeTitle('2024', without('2024')), '2024 2');
});

test('spaces around the title are ignored', () => {
  assert.equal(freeTitle('  Test  ', without('Test')), 'Test 2');
});
