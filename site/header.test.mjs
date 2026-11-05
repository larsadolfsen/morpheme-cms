import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { headerOf } from './header.mjs';

test('no file', () => {
  assert.deepEqual(headerOf(undefined), { button: null, menuSide: 'start' });
});

test('button off', () => {
  assert.equal(headerOf({ button: { enabled: false, to: 'booking' } }).button, null);
});

test('button on', () => {
  assert.deepEqual(headerOf({ button: { enabled: true, to: 'booking', label: 'Book en tid' } }).button, {
    to: 'booking',
    label: 'Book en tid',
  });
});

test('menu at the end', () => {
  assert.equal(headerOf({ menuSide: 'end' }).menuSide, 'end');
});

test('wrong menu side', () => {
  assert.equal(headerOf({ menuSide: 'middle' }).menuSide, 'start');
});

test('wrong shapes', () => {
  assert.deepEqual(headerOf('x'), { button: null, menuSide: 'start' });
  assert.equal(headerOf({ button: 'x' }).button, null);
});
