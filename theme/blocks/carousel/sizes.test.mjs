import assert from 'node:assert/strict';
import test from 'node:test';
import { BASE_SIZES, EAGER_IMAGES, LAYOUTS, loadingOf, sizesOf } from './sizes.mjs';

test('multi-browse and uncontained have sizes of their own; every other layout keeps the base value', () => {
  assert.deepEqual(LAYOUTS, ['multi-browse', 'uncontained']);
  for (const layout of ['hero', 'full-screen', 'multi-aspect-ratio', 'nothing']) assert.equal(sizesOf(layout), BASE_SIZES);
});

test('what multi-browse and uncontained draw', () => {
  assert.equal(sizesOf('multi-browse'), '12.5rem');
  // A third from 840 px, half from 616 px, 86% of the row below.
  assert.match(sizesOf('uncontained'), /^\(min-width: 840px\) .* \/ 3\), \(min-width: 616px\) .* \/ 2\), calc\(.* 0\.86\)$/);
});

test('an image cut to part of its picture is drawn that much wider than its box', () => {
  assert.match(sizesOf('uncontained', { crop: 50 }), /\* 2\)$/);
  assert.equal(sizesOf('multi-browse', { crop: 100 }), '12.5rem');
});

test('the first image of a carousel at the top is eager with high priority, the next ones of the first screen eager, every other lazy', () => {
  assert.deepEqual(loadingOf(0), { loading: 'eager', fetchPriority: 'high' });
  assert.deepEqual(loadingOf(1), { loading: 'eager', fetchPriority: undefined });
  assert.deepEqual(loadingOf(EAGER_IMAGES), { loading: 'lazy', fetchPriority: undefined });
  assert.deepEqual(loadingOf(-1), { loading: 'lazy', fetchPriority: undefined });
});
