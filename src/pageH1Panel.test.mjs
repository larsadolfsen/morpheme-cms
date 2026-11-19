// Tests src/pageH1Panel.mjs: the preview puts a page's header and intro in a coloured panel, or takes the panel away.
// Run: node --test src/pageH1Panel.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { setH1Panel } from './pageH1Panel.mjs';

const PAGE = (header) =>
  new JSDOM(`<body><article><header>${header}</header><div><div data-editor="text" class="mo-prose">x</div></div></article></body>`).window
    .document;
const PLAIN = '<h1 data-editor="heading">Title</h1>';

test('the header and the intro go in a panel of the colour', () => {
  const doc = PAGE(PLAIN);
  setH1Panel(doc, { color: 'surface' }, '<p>Intro</p>');
  const panel = doc.querySelector('header > section.mo-text-section.mo-is-surface[data-editor="h1-section"]');
  assert.ok(panel);
  assert.equal(panel.querySelector('h1').textContent, 'Title');
  const intro = panel.querySelector('[data-editor="intro"]');
  assert.equal(intro.innerHTML, '<p>Intro</p>');
  assert.equal(intro.className, 'mo-prose');
});

test('a panel with a colour takes away the header space, none gives it back', () => {
  const doc = PAGE(PLAIN);
  doc.querySelector('header').className = 'mo-container mo-page-header';
  setH1Panel(doc, { color: 'surface' }, '');
  assert.equal(doc.querySelector('header').className, 'mo-container mo-flush-top');
  setH1Panel(doc, null, '');
  assert.equal(doc.querySelector('header').className, 'mo-container mo-page-header');
});

test('without an intro the panel holds the header only', () => {
  const doc = PAGE(PLAIN);
  setH1Panel(doc, { color: 'primary' }, '  ');
  assert.ok(doc.querySelector('[data-editor="h1-section"] h1'));
  assert.equal(doc.querySelector('[data-editor="intro"]'), null);
});

test('no colour takes a panel away and keeps the header', () => {
  const doc = PAGE(
    `<section data-editor="h1-section" class="mo-text-section mo-is-surface">${PLAIN}<div data-editor="intro">a</div></section>`,
  );
  setH1Panel(doc, null, '');
  assert.equal(doc.querySelector('[data-editor="h1-section"]'), null);
  assert.equal(doc.querySelector('[data-editor="intro"]'), null);
  assert.equal(doc.querySelector('header > h1').textContent, 'Title');
});

test('another colour replaces the panel of the site', () => {
  const doc = PAGE(
    `<section data-editor="h1-section" class="mo-text-section mo-is-surface">${PLAIN}<div data-editor="intro">a</div></section>`,
  );
  setH1Panel(doc, { color: 'primary' }, '<p>b</p>');
  assert.equal(doc.querySelectorAll('[data-editor="h1-section"]').length, 1);
  assert.ok(doc.querySelector('.mo-text-section.mo-is-primary'));
  assert.equal(doc.querySelector('.mo-text-section.mo-is-surface'), null);
  assert.equal(doc.querySelector('[data-editor="intro"]').innerHTML, '<p>b</p>');
});

test('a page without a header is left as it is', () => {
  const doc = new JSDOM('<body><div data-editor="text">x</div></body>').window.document;
  setH1Panel(doc, { color: 'surface' }, '<p>a</p>');
  assert.equal(doc.querySelector('section'), null);
});

test('the whole width is in the panel and goes again with it; a page’s H1 has no image', () => {
  const doc = PAGE(PLAIN);
  setH1Panel(doc, { color: 'surface', width: 'full' }, '<p>Intro</p>');
  const panel = doc.querySelector('[data-editor="h1-section"]');
  assert.match(panel.className, /mo-is-full/);
  assert.doesNotMatch(panel.className, /mo-has-image/);
  assert.equal(panel.querySelector('img'), null);
  setH1Panel(doc, null, '');
  assert.equal(doc.querySelector('[data-editor="h1-section"]'), null);
});
