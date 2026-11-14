import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide } from './staging-rebuild.mjs';

test('same version as last time: nothing to do', () => {
  assert.equal(decide({ next: '0.17.0-next-1', last: '0.17.0-next-1\n', hook: 'https://h' }), 'none');
});
test('new next version rebuilds', () => {
  assert.equal(decide({ next: '0.17.0-next-2', last: '0.17.0-next-1', hook: 'https://h' }), 'rebuild');
  assert.equal(decide({ next: '0.17.0-next-2', hook: 'https://h' }), 'rebuild');
});
test('a new version without a hook is reported, not skipped', () => {
  assert.equal(decide({ next: '0.17.0-next-2', last: '0.17.0-next-1', hook: '  ' }), 'no-hook');
  assert.equal(decide({ next: '0.17.0-next-2' }), 'no-hook');
});
test('an unchanged version needs no hook', () => {
  assert.equal(decide({ next: 'x', last: 'x' }), 'none');
});
test('no next version is an error', () => {
  assert.equal(decide({ next: '', last: 'x', hook: 'h' }), 'no-next');
});
