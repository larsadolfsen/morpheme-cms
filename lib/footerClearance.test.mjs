// Tests for lib/footerClearance.mjs: clearance under the footer only when the page is taller than the window.
import test from 'node:test';
import assert from 'node:assert/strict';
import { needsClearance } from './footerClearance.mjs';

test('a page that fits the window needs no clearance', () => {
  assert.equal(needsClearance(600, 800), false);
});

test('a page exactly as tall as the window needs none', () => {
  assert.equal(needsClearance(800, 800), false);
});

test('a page taller than the window needs clearance', () => {
  assert.equal(needsClearance(801, 800), true);
});
