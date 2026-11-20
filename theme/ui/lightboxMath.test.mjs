import test from 'node:test';
import assert from 'node:assert/strict';
import { countText, indexAt, moved } from './lightboxMath.mjs';

test('the track shows the image its scroll position is nearest, kept among the images', () => {
  assert.equal(indexAt(0, 400, 5), 0);
  assert.equal(indexAt(190, 400, 5), 0);
  assert.equal(indexAt(210, 400, 5), 1);
  assert.equal(indexAt(1600, 400, 5), 4);
  assert.equal(indexAt(9999, 400, 5), 4);
  assert.equal(indexAt(-800, 400, 5), 2, 'a right-to-left track scrolls into negative positions');
});

test('no width or no images is the first index', () => {
  assert.equal(indexAt(100, 0, 5), 0);
  assert.equal(indexAt(100, 400, 0), 0);
});

test('moving stops at the first and the last image', () => {
  assert.equal(moved(0, -1, 5), 0);
  assert.equal(moved(2, 1, 5), 3);
  assert.equal(moved(4, 1, 5), 4);
  assert.equal(moved(2, -9, 5), 0);
  assert.equal(moved(0, 1, 0), 0);
});

test('the count is the site’s text with the numbers from 1', () => {
  assert.equal(countText('{index} of {total}', 2, 12), '3 of 12');
  assert.equal(countText('{total} images, now {index}', 0, 4), '4 images, now 1');
});
