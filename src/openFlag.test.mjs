// Tests for src/openFlag.mjs: set tells the listeners only on a change, and a listener can leave. Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFlag } from './openFlag.mjs';

test('a flag starts as given and changes with set', () => {
  const flag = createFlag();
  assert.equal(flag.get(), false);
  flag.set(true);
  assert.equal(flag.get(), true);
});

test('set tells the listeners once per change', () => {
  const flag = createFlag();
  let calls = 0;
  flag.subscribe(() => calls++);
  flag.set(true);
  assert.equal(calls, 1);
});

test('set does nothing when the value is unchanged', () => {
  const flag = createFlag(true);
  let calls = 0;
  flag.subscribe(() => calls++);
  flag.set(true);
  assert.equal(calls, 0);
});

test('a listener that unsubscribed is not told', () => {
  const flag = createFlag();
  let calls = 0;
  const leave = flag.subscribe(() => calls++);
  leave();
  flag.set(true);
  assert.equal(calls, 0);
});
