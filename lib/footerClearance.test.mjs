// Tests for lib/footerClearance.mjs: clearance under the footer only for a FAB, and only when the page is taller than the window.
import test from 'node:test';
import assert from 'node:assert/strict';
import { needsClearance } from './footerClearance.mjs';

test('a page that fits the window needs no clearance', () => {
  assert.equal(needsClearance(600, 800, true), false);
});

test('a page exactly as tall as the window needs none', () => {
  assert.equal(needsClearance(800, 800, true), false);
});

test('a tall page with a FAB needs clearance', () => {
  assert.equal(needsClearance(801, 800, true), true);
});

test('a tall page without a FAB needs none', () => {
  assert.equal(needsClearance(2000, 800, false), false);
});

test('a short page without a FAB needs none', () => {
  assert.equal(needsClearance(600, 800, false), false);
});
