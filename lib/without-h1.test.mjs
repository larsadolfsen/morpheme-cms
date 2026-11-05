// Tests lib/without-h1.mjs: the first <h1> of a page's rendered text is taken out, wherever it is.
// Run with `node --test packages/editor/lib/*.test.mjs` (part of npm run check).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withoutH1 } from './without-h1.mjs';

test('an H1 at the top is taken out, with the space after it', () => {
  assert.equal(withoutH1('<h1 id="title">Title</h1>\n<p>Text</p>'), '<p>Text</p>');
});

test('an H1 after other parts is taken out where it is', () => {
  assert.equal(withoutH1('<p>Intro</p>\n<h1 id="t">Title</h1>\n<h2>Section</h2>'), '<p>Intro</p>\n<h2>Section</h2>');
});

test('an H1 with a coloured word is taken out whole', () => {
  assert.equal(withoutH1('<h1>One <span class="color-accent">two</span></h1><p>x</p>'), '<p>x</p>');
});

test('only the first H1 goes', () => {
  assert.equal(withoutH1('<h1>A</h1><p>x</p><h1>B</h1>'), '<p>x</p><h1>B</h1>');
});

test('without an H1 the html is as it was', () => {
  assert.equal(withoutH1('<p>Text</p><h2>Section</h2>'), '<p>Text</p><h2>Section</h2>');
  assert.equal(withoutH1('<header>x</header>'), '<header>x</header>');
});
