// Tests lib/without-h1.mjs: the first <h1> of a page's rendered text is taken out, wherever it is.
// Run with `node --test packages/editor/lib/*.test.mjs` (part of npm run check).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { h1SectionColor, withoutH1 } from './without-h1.mjs';

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

const M = (color) => `<div data-section="${color}"></div>`;

test('the marker before the H1 is taken out with it', () => {
  assert.equal(withoutH1(`${M('tint')}\n<h1 id="t">Title</h1>\n<p>Text</p>`), '<p>Text</p>');
  assert.equal(withoutH1(`<p>Intro</p>\n${M('tint')}\n<h1>Title</h1>\n<h2>A</h2>`), '<p>Intro</p>\n<h2>A</h2>');
});

test('a label between the marker and the H1 stays in the text', () => {
  const label = '<p class="block-eyebrow">Hello</p>';
  assert.equal(withoutH1(`${M('accent')}\n${label}\n<h1>Title</h1>\n<p>Text</p>`), `${label}\n<p>Text</p>`);
});

test('the marker of an H2 is not taken out', () => {
  const html = `<h1>Title</h1>\n${M('tint')}\n<h2>A</h2>`;
  assert.equal(withoutH1(html), `${M('tint')}\n<h2>A</h2>`);
});

test('the colour of the H1 section is the marker before the H1', () => {
  assert.equal(h1SectionColor(`${M('tint')}\n<h1>Title</h1>\n<p>x</p>`), 'tint');
  assert.equal(h1SectionColor(`<p>a</p>${M('accent')}<p class="block-eyebrow">L</p><h1>T</h1>`), 'accent');
});

test('without a marker before the H1 there is no colour', () => {
  assert.equal(h1SectionColor('<h1>Title</h1><p>x</p>'), null);
  assert.equal(h1SectionColor(`<h1>Title</h1>${M('tint')}<h2>A</h2>`), null);
  assert.equal(h1SectionColor(`${M('red')}<h1>Title</h1>`), null);
  assert.equal(h1SectionColor('<p>x</p>'), null);
});

test('without an H1 the html is as it was', () => {
  assert.equal(withoutH1('<p>Text</p><h2>Section</h2>'), '<p>Text</p><h2>Section</h2>');
  assert.equal(withoutH1('<header>x</header>'), '<header>x</header>');
});
