import test from 'node:test';
import assert from 'node:assert/strict';
import { cutOf, ratioProp, DEFAULT_RATIO } from './cut.mjs';

test('Cards without a ratio are 3:2 and a card without words in its image is drawn as before (the middle part, no crop)', () => {
  assert.equal(ratioProp({}), DEFAULT_RATIO);
  assert.equal(ratioProp({ ratio: 'wide' }), DEFAULT_RATIO);
  assert.deepEqual(cutOf('/images/a.webp', ratioProp({})), { src: '/images/a.webp' });
});

test('A card’s crop is used only when it was made for the block’s ratio, and its address is without the words', () => {
  const image = '/images/a.webp#format=1:1&crop=10,0,80,100';
  assert.deepEqual(cutOf(image, '1:1'), { src: '/images/a.webp', crop: [10, 0, 80, 100] });
  assert.deepEqual(cutOf(image, '16:9'), { src: '/images/a.webp' });
});
