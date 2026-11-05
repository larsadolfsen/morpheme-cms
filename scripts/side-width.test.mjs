// Tests the width rule of check-side.mjs (side-width.mjs: widthProblem) and how it reads the text's classes from built HTML.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { textClasses, widthProblem } from './side-width.mjs';

const WIDE = ['prose', 'max-w-none', '[&>:not(.not-prose)]:max-w-[66ch]'];
const NARROW = ['prose', 'max-w-[66ch]'];

test('a page without a column: text as wide as its container, 66ch for what is not a block', () => {
  assert.equal(widthProblem(WIDE, null), null);
  assert.ok(widthProblem(NARROW, null));
});

test('a page with a column: text stops at 66ch', () => {
  assert.equal(widthProblem(NARROW, 'left'), null);
  assert.ok(widthProblem(WIDE, 'right'));
});

test('textClasses reads the classes of the text wrapper', () => {
  const html =
    '<article data-template="single"><div data-editor="text" class="prose max-w-none [&amp;>:not(.not-prose)]:max-w-[66ch]"></div>';
  assert.deepEqual(textClasses(html), WIDE);
});
