import test from 'node:test';
import assert from 'node:assert/strict';
import { chosenFrom, DEFAULT_MAX, disabledTags, fragmentOf, gridImages, matching, maxOf, ordered, tagsOf, toggled } from './filter.mjs';

const images = [
  { src: '/images/uploads/2026/09/a.webp', tags: ['sea', 'food'] },
  { src: '/images/uploads/2026/10/b.webp', tags: ['sea'] },
  { src: '/images/uploads/2026/10/c.webp', tags: ['people'] },
  { src: '/images/uploads/2025/01/d.webp', tags: [] },
];

test('the tags of the images, each once, in the order they come', () => {
  assert.deepEqual(tagsOf(images), ['sea', 'food', 'people']);
});

test('no tag chosen shows all; one tag shows its images; several tags show only images with all of them (AND)', () => {
  assert.equal(matching(images, []).length, 4);
  assert.deepEqual(
    matching(images, ['sea']).map((i) => i.src.at(-6)),
    ['a', 'b'],
  );
  assert.deepEqual(
    matching(images, ['sea', 'food']).map((i) => i.src.at(-6)),
    ['a'],
  );
  assert.deepEqual(matching(images, ['sea', 'people']), []);
});

test('a tag that would leave nothing is disabled, a chosen one never is', () => {
  assert.deepEqual(disabledTags(images, []), []);
  assert.deepEqual(disabledTags(images, ['sea']), ['people']);
  assert.deepEqual(disabledTags(images, ['sea', 'food']), ['people']);
  assert.deepEqual(disabledTags(images, ['people']), ['sea', 'food']);
});

test('a tag is added to the chosen ones, or taken off when chosen', () => {
  assert.deepEqual(toggled([], 'sea'), ['sea']);
  assert.deepEqual(toggled(['sea'], 'food'), ['sea', 'food']);
  assert.deepEqual(toggled(['sea', 'food'], 'sea'), ['food']);
});

test('the address fragment: known tags only, each once, in order; none gives no fragment', () => {
  const known = ['sea', 'food', 'people'];
  assert.deepEqual(chosenFrom('#tags=sea,food', known), ['sea', 'food']);
  assert.deepEqual(chosenFrom('#tags=food,nothing,food,sea', known), ['food', 'sea']);
  assert.deepEqual(chosenFrom('', known), []);
  assert.deepEqual(chosenFrom('#other=1&tags=people', known), ['people']);
  assert.equal(fragmentOf(['sea', 'food']), 'tags=sea,food');
  assert.equal(fragmentOf([]), '');
});

test('the order: newest and oldest by upload month, library as it comes, random with a given random', () => {
  assert.deepEqual(
    ordered(images, 'newest').map((i) => i.src.at(-6)),
    ['b', 'c', 'a', 'd'],
  );
  assert.deepEqual(
    ordered(images, 'oldest').map((i) => i.src.at(-6)),
    ['d', 'a', 'b', 'c'],
  );
  assert.deepEqual(ordered(images, 'library'), images);
  assert.deepEqual(ordered(images, 'newest').length, 4);
  const never = () => 0;
  assert.deepEqual(
    ordered(images, 'random', never).map((i) => i.src.at(-6)),
    ['b', 'c', 'd', 'a'],
  );
  assert.deepEqual(
    images.map((i) => i.src.at(-6)),
    ['a', 'b', 'c', 'd'],
    'the images given are not changed',
  );
});

test('the limit: a whole number from 1 to 500, empty or wrong means 100', () => {
  assert.equal(maxOf(''), DEFAULT_MAX);
  assert.equal(maxOf(undefined), DEFAULT_MAX);
  assert.equal(maxOf('abc'), DEFAULT_MAX);
  assert.equal(maxOf(0), DEFAULT_MAX);
  assert.equal(maxOf('12'), 12);
  assert.equal(maxOf(2.9), 2);
  assert.equal(maxOf(9999), 500);
});

test('gridImages: the block’s tags (any of them), order and limit together', () => {
  assert.deepEqual(
    gridImages(images, { anyOf: ['sea'], order: 'newest', max: 1 }).map((i) => i.src.at(-6)),
    ['b'],
  );
  assert.equal(gridImages(images).length, 4);
  assert.deepEqual(
    gridImages(images, { anyOf: ['sea', 'people'] }).map((i) => i.src.at(-6)),
    ['b', 'c', 'a'],
  );
  assert.deepEqual(gridImages(images, { anyOf: ['nothing'] }), []);
});
