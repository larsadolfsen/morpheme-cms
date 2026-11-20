import test from 'node:test';
import assert from 'node:assert/strict';
import { barSlideKind } from './barMotion.mjs';

test('from nothing into a context the tools slide in; out of it they slide out', () => {
  assert.equal(barSlideKind('', 'text'), 'enter');
  assert.equal(barSlideKind('', 'block:Table'), 'enter');
  assert.equal(barSlideKind('text', ''), 'leave');
  assert.equal(barSlideKind('block:Cards', ''), 'leave');
});

test('from one context to another the tools fade in place, no second slide', () => {
  assert.equal(barSlideKind('text', 'block:Table'), 'change');
  assert.equal(barSlideKind('block:Table', 'block:Cards'), 'change');
  assert.equal(barSlideKind('block:Table', 'text'), 'change');
});

test('the same context moves nothing', () => {
  for (const key of ['', 'text', 'block:Table']) assert.equal(barSlideKind(key, key), 'none');
});
