// Tests lib/text-sections.mjs: a text's HTML cut into coloured and uncoloured runs, and the marker as the site's real
// Markdown pipeline (rehype-raw, as in astro.mjs) writes it. Run with `node --test packages/editor/lib/text-sections.test.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeRaw from 'rehype-raw';
import { sectionClass, sectionsOf } from './text-sections.mjs';

const M = (color) => `<div data-section="${color}"></div>`;

test('html without markers passes through unchanged, in one run', () => {
  const html = '<h1>T</h1>\n<p>a</p>\n<h2 id="x">X</h2>\n<p>b</p>';
  assert.deepEqual(sectionsOf(html), [{ color: null, html }]);
  assert.deepEqual(sectionsOf(''), [{ color: null, html: '' }]);
});

test('a coloured run goes from its marker to the next h2, markers removed', () => {
  const html = `<p>Intro</p>\n${M('tint')}\n<h2 id="a">A</h2>\n<p>One</p>\n<h2 id="b">B</h2>\n<p>Two</p>`;
  assert.deepEqual(sectionsOf(html), [
    { color: null, html: '<p>Intro</p>\n' },
    { color: 'tint', html: '<h2 id="a">A</h2>\n<p>One</p>\n' },
    { color: null, html: '<h2 id="b">B</h2>\n<p>Two</p>' },
  ]);
});

test('a run goes on to the end of the text, and over an h3 and blocks', () => {
  const html = `${M('surface')}\n<h2>A</h2>\n<h3>s</h3>\n<div data-block="faq"></div>\n<p>x</p>`;
  assert.deepEqual(sectionsOf(html), [{ color: 'surface', html: '<h2>A</h2>\n<h3>s</h3>\n<div data-block="faq"></div>\n<p>x</p>' }]);
});

test('a run ends at an h1', () => {
  const html = `${M('tint')}\n<h2>A</h2>\n<p>x</p>\n<h1>Big</h1>\n<p>y</p>`;
  assert.deepEqual(sectionsOf(html), [
    { color: 'tint', html: '<h2>A</h2>\n<p>x</p>\n' },
    { color: null, html: '<h1>Big</h1>\n<p>y</p>' },
  ]);
});

test('a marker before an h1 starts a coloured run that ends at the next h2', () => {
  const html = `${M('tint')}<h1>A</h1><p>x</p><h2>B</h2>`;
  assert.deepEqual(sectionsOf(html), [
    { color: 'tint', html: '<h1>A</h1><p>x</p>' },
    { color: null, html: '<h2>B</h2>' },
  ]);
});

test('a marker and a label before an h1 start a coloured run', () => {
  const html = `<p>Intro</p>${M('accent')}<p class="block-eyebrow">Hi</p><h1>A</h1><p>x</p><h1>B</h1>`;
  assert.deepEqual(sectionsOf(html), [
    { color: null, html: '<p>Intro</p>' },
    { color: 'accent', html: '<p class="block-eyebrow">Hi</p><h1>A</h1><p>x</p>' },
    { color: null, html: '<h1>B</h1>' },
  ]);
});

test('two coloured sections after each other are two runs', () => {
  const html = `${M('tint')}\n<h2>A</h2>\n<p>x</p>\n${M('accent')}\n<h2>B</h2>\n<p>y</p>`;
  assert.deepEqual(sectionsOf(html), [
    { color: 'tint', html: '<h2>A</h2>\n<p>x</p>\n' },
    { color: 'accent', html: '<h2>B</h2>\n<p>y</p>' },
  ]);
});

test('a label line between the marker and the h2 belongs to the section, and the next label starts the next', () => {
  const html = `${M('tint')}\n<p class="block-eyebrow">Hours</p>\n<h2>A</h2>\n<p>x</p>\n<p class="block-eyebrow">Next</p>\n<h2>B</h2>`;
  assert.deepEqual(sectionsOf(html), [
    { color: 'tint', html: '<p class="block-eyebrow">Hours</p>\n<h2>A</h2>\n<p>x</p>\n' },
    { color: null, html: '<p class="block-eyebrow">Next</p>\n<h2>B</h2>' },
  ]);
});

test('an unknown colour is dropped, the text stays', () => {
  assert.deepEqual(sectionsOf(`${M('pink')}\n<h2>A</h2>\n<p>x</p>`), [{ color: null, html: '<h2>A</h2>\n<p>x</p>' }]);
});

test('a marker not followed by an h2 is dropped', () => {
  assert.deepEqual(sectionsOf(`<p>a</p>\n${M('tint')}\n<p>b</p>\n<h2>c</h2>`), [{ color: null, html: '<p>a</p>\n<p>b</p>\n<h2>c</h2>' }]);
  assert.deepEqual(sectionsOf(`<p>a</p>\n${M('tint')}\n<h3>c</h3>`), [{ color: null, html: '<p>a</p>\n<h3>c</h3>' }]);
});

test('the class of a coloured section', () => {
  assert.equal(sectionClass('tint'), 'text-section text-section-tint');
});

test("in Astro's pipeline the marker comes out as the matcher reads it", async () => {
  const processor = await createMarkdownProcessor({ rehypePlugins: [rehypeRaw] });
  const { code } = await processor.render(`Intro\n\n${M('tint')}\n\n## Opening hours\n\nMon–Fri\n\n## Contact\n\nCall`);
  assert.ok(code.includes(M('tint')), code);
  const runs = sectionsOf(code);
  assert.deepEqual(
    runs.map((r) => r.color),
    [null, 'tint', null],
  );
  assert.ok(runs[1].html.startsWith('<h2') && runs[1].html.includes('Mon–Fri') && !runs[1].html.includes('Contact'), runs[1].html);
});
