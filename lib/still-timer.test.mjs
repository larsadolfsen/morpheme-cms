// Tests for lib/still-timer.mjs: onStill once the cursor has stood still for the delay. Run: node --test packages/editor/lib/*.test.mjs packages/editor/src/*.test.mjs
import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { stillTimer } from './still-timer.mjs';

test('calls onStill once after the delay', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const onStill = mock.fn();
  stillTimer(700, onStill).restart();
  mock.timers.tick(699);
  assert.equal(onStill.mock.callCount(), 0);
  mock.timers.tick(1);
  assert.equal(onStill.mock.callCount(), 1);
  mock.timers.tick(5000);
  assert.equal(onStill.mock.callCount(), 1);
  mock.timers.reset();
});

test('a restart waits the whole delay again', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const onStill = mock.fn();
  const timer = stillTimer(700, onStill);
  timer.restart();
  mock.timers.tick(500);
  timer.restart();
  mock.timers.tick(500);
  assert.equal(onStill.mock.callCount(), 0);
  mock.timers.tick(200);
  assert.equal(onStill.mock.callCount(), 1);
  mock.timers.reset();
});

test('stop cancels it', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const onStill = mock.fn();
  const timer = stillTimer(700, onStill);
  timer.restart();
  timer.stop();
  mock.timers.tick(1000);
  assert.equal(onStill.mock.callCount(), 0);
  mock.timers.reset();
});
