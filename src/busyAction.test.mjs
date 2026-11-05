// Tests for src/busyAction.mjs: only the pressed button is busy, and not while a dialog waits. Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { busyFor } from './busyAction.mjs';

test('busyFor is true for the running action on its id only', () => {
  const running = { id: 'a', action: 'install', asking: false };
  assert.equal(busyFor(running, 'a', 'install'), true);
  assert.equal(busyFor(running, 'a', 'update'), false);
  assert.equal(busyFor(running, 'b', 'install'), false);
});

test('busyFor is false when nothing runs or a dialog waits', () => {
  assert.equal(busyFor(null, 'a', 'install'), false);
  assert.equal(busyFor({ id: 'a', action: 'update', asking: true }, 'a', 'update'), false);
});
