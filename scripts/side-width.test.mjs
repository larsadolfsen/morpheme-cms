// Tests the width rule of check-side.mjs (side-width.mjs: widthProblem) and how it reads the text's classes from built HTML.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { textClasses, widthProblem } from './side-width.mjs';

const WIDE = ['mo-prose', 'mo-page__text', 'mo-is-single-column'];
const NARROW = ['mo-prose', 'mo-page__text', 'mo-has-side'];

test('a page without a column: text as wide as its container, the text measure for what is not a block', () => {
  assert.equal(widthProblem(WIDE, null), null);
  assert.ok(widthProblem(NARROW, null));
});

test('a page with a column: text stops at the text measure', () => {
  assert.equal(widthProblem(NARROW, 'left'), null);
  assert.ok(widthProblem(WIDE, 'right'));
});

test('textClasses reads the classes of the text wrapper', () => {
  const html = '<article data-template="single"><div data-editor="text" class="mo-prose mo-page__text mo-is-single-column"></div>';
  assert.deepEqual(textClasses(html), WIDE);
});

test('textClasses decodes each entity once', () => {
  assert.deepEqual(textClasses('<div data-editor="text" class="a&amp;gt;b [&amp;&gt;p]:x">'), ['a&gt;b', '[&>p]:x']);
});
