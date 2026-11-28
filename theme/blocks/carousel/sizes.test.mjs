import assert from 'node:assert/strict';
import test from 'node:test';
import { LAYOUTS, ITEM_HEIGHT_PX, loadingOf, sizesOf } from './sizes.mjs';

test('every layout has sizes of its own, and none is the one value every layout used before', () => {
  const seen = new Map();
  for (const layout of LAYOUTS.filter((l) => l !== 'multi-aspect-ratio')) {
    const sizes = sizesOf(layout);
    assert.ok(sizes && !sizes.includes('352px'), `${layout}: ${sizes}`);
    assert.ok(!seen.has(sizes), `${layout} has the same sizes as ${seen.get(sizes)}`);
    seen.set(sizes, layout);
  }
});

test('a centred hero draws one large item between two small ones; a hero of two items one large item', () => {
  assert.match(sizesOf('hero-center'), /min\(100vw, 72rem\) - 11rem\), calc\(100vw - 10rem\)$/);
  assert.match(sizesOf('hero', { count: 2 }), /^\(min-width: 600px\) calc\(min\(100vw, 72rem\) - 7rem\), calc\(100vw - 6rem\)$/);
  assert.notEqual(sizesOf('hero', { count: 2 }), sizesOf('hero', { count: 5 }));
});

test('an unknown layout falls back to the uncontained one', () => assert.equal(sizesOf('nothing'), sizesOf('uncontained')));

test('what each layout draws at 1280 and 390', () => {
  // Multi-browse: a large item, 12.5rem. Full screen: the row (1104 px at 1280, the phone's width at 390).
  assert.equal(sizesOf('multi-browse'), '12.5rem');
  assert.match(sizesOf('full-screen'), /, \(min-width: 600px\) calc\(min\(100vw, 72rem\) - 3rem\), 100vw$/);
  // Hero: the row less a small item and a gap (4rem), but a large item is at most twice the height (640 px): 294 px at 390, 516 px at 1280 (two large items).
  assert.match(sizesOf('hero'), /^\(min-width: 600px\) calc\(min\(min\(100vw, 72rem\) - 7rem, 640px\)\), calc\(100vw - 6rem\)$/);
  // Full screen is drawn as a hero from 840 px and in landscape.
  assert.match(sizesOf('full-screen'), /^\(\(min-width: 52\.5rem\) or \(orientation: landscape\)\) .*640px.*, \(min-width: 600px\) /);
  // Uncontained: a third from 840 px, half from 616 px, 86% of the row below.
  assert.match(sizesOf('uncontained'), /^\(min-width: 840px\) .* \/ 3\), \(min-width: 616px\) .* \/ 2\), calc\(.* 0\.86\)$/);
});

test('a multi-aspect ratio item is as wide as its aspect makes it', () => {
  assert.equal(sizesOf('multi-aspect-ratio', { aspect: 1 }), `${ITEM_HEIGHT_PX}px`);
  assert.equal(sizesOf('multi-aspect-ratio', { aspect: 16 / 9 }), '569px');
  assert.equal(sizesOf('multi-aspect-ratio', { aspect: 9 / 16 }), '180px');
});

test('an image cut to part of its picture is drawn that much wider than its box', () => {
  assert.equal(sizesOf('multi-aspect-ratio', { aspect: 1, crop: 50 }), 'calc(320px * 2)');
  assert.match(sizesOf('uncontained', { crop: 50 }), /\* 2\)$/);
  assert.equal(sizesOf('multi-browse', { crop: 100 }), '12.5rem');
});

test('only the first image of a carousel at the top is eager, with high priority; every other is lazy', () => {
  assert.deepEqual(loadingOf(true), { loading: 'eager', fetchPriority: 'high' });
  assert.deepEqual(loadingOf(false), { loading: 'lazy', fetchPriority: undefined });
});
