// Tests for src/firstHeadingHint.mjs: the message shows the first 7 times, then not, and never without storage. Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HINT_KEY, HINT_TIMES, takeHint } from './firstHeadingHint.mjs';

const memory = (start) => {
  const items = new Map(start === undefined ? [] : [[HINT_KEY, start]]);
  return { getItem: (k) => items.get(k) ?? null, setItem: (k, v) => void items.set(k, v) };
};

test('shows the first 7 times, then not', () => {
  const storage = memory();
  const shown = Array.from({ length: HINT_TIMES + 3 }, () => takeHint(() => storage));
  assert.deepEqual(shown, [...Array(HINT_TIMES).fill(true), false, false, false]);
  assert.equal(storage.getItem(HINT_KEY), String(HINT_TIMES));
});

test('a count that is not a number starts over', () => {
  assert.equal(
    takeHint(() => memory('x')),
    true,
  );
});

test('not shown without storage, or when it throws', () => {
  assert.equal(
    takeHint(() => undefined),
    false,
  );
  const throwing = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {},
  };
  assert.equal(
    takeHint(() => throwing),
    false,
  );
  assert.equal(
    takeHint(() => {
      throw new Error('SecurityError');
    }),
    false,
  );
});
