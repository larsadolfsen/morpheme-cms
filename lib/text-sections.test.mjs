// Tests lib/text-sections.mjs: a text's HTML cut into coloured and uncoloured runs, and the marker as the site's real
// Markdown pipeline (rehype-raw, as in astro.mjs) writes it. Run with `node --test packages/editor/lib/text-sections.test.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeRaw from 'rehype-raw';
import { introOf, sectionClass, sectionsOf } from './text-sections.mjs';

const M = (color) => `<div data-section="${color}"></div>`;

test('html without markers passes through unchanged, in one run', () => {
  const html = '<h1>T</h1>\n<p>a</p>\n<h2 id="x">X</h2>\n<p>b</p>';
  assert.deepEqual(sectionsOf(html), [{ color: null, html }]);
  assert.deepEqual(sectionsOf(''), [{ color: null, html: '' }]);
});

test('a coloured run goes from its marker to the next h2, markers removed', () => {
  const html = `<p>Intro</p>\n${M('surface')}\n<h2 id="a">A</h2>\n<p>One</p>\n<h2 id="b">B</h2>\n<p>Two</p>`;
  assert.deepEqual(sectionsOf(html), [
    { color: null, html: '<p>Intro</p>\n' },
    { color: 'surface', html: '<h2 id="a">A</h2>\n<p>One</p>\n' },
    { color: null, html: '<h2 id="b">B</h2>\n<p>Two</p>' },
  ]);
});

test('a run goes on to the end of the text, and over an h3 and blocks', () => {
  const html = `${M('surface')}\n<h2>A</h2>\n<h3>s</h3>\n<div data-block="faq"></div>\n<p>x</p>`;
  assert.deepEqual(sectionsOf(html), [{ color: 'surface', html: '<h2>A</h2>\n<h3>s</h3>\n<div data-block="faq"></div>\n<p>x</p>' }]);
});

test('a run ends at an h1', () => {
  const html = `${M('surface')}\n<h2>A</h2>\n<p>x</p>\n<h1>Big</h1>\n<p>y</p>`;
  assert.deepEqual(sectionsOf(html), [
    { color: 'surface', html: '<h2>A</h2>\n<p>x</p>\n' },
    { color: null, html: '<h1>Big</h1>\n<p>y</p>' },
  ]);
});

test('a marker before an h1 starts a coloured run that ends at the next h2', () => {
  const html = `${M('surface')}<h1>A</h1><p>x</p><h2>B</h2>`;
  assert.deepEqual(sectionsOf(html), [
    { color: 'surface', html: '<h1>A</h1><p>x</p>' },
    { color: null, html: '<h2>B</h2>' },
  ]);
});

test('a marker and a label before an h1 start a coloured run', () => {
  const html = `<p>Intro</p>${M('primary')}<p class="label-medium">Hi</p><h1>A</h1><p>x</p><h1>B</h1>`;
  assert.deepEqual(sectionsOf(html), [
    { color: null, html: '<p>Intro</p>' },
    { color: 'primary', html: '<p class="label-medium">Hi</p><h1>A</h1><p>x</p>' },
    { color: null, html: '<h1>B</h1>' },
  ]);
});

test('two coloured sections after each other are two runs', () => {
  const html = `${M('surface')}\n<h2>A</h2>\n<p>x</p>\n${M('primary')}\n<h2>B</h2>\n<p>y</p>`;
  assert.deepEqual(sectionsOf(html), [
    { color: 'surface', html: '<h2>A</h2>\n<p>x</p>\n' },
    { color: 'primary', html: '<h2>B</h2>\n<p>y</p>' },
  ]);
});

test('a label line between the marker and the h2 belongs to the section, and the next label starts the next', () => {
  const html = `${M('surface')}\n<p class="label-medium">Hours</p>\n<h2>A</h2>\n<p>x</p>\n<p class="label-medium">Next</p>\n<h2>B</h2>`;
  assert.deepEqual(sectionsOf(html), [
    { color: 'surface', html: '<p class="label-medium">Hours</p>\n<h2>A</h2>\n<p>x</p>\n' },
    { color: null, html: '<p class="label-medium">Next</p>\n<h2>B</h2>' },
  ]);
});

test('an unknown colour is dropped, the text stays', () => {
  assert.deepEqual(sectionsOf(`${M('pink')}\n<h2>A</h2>\n<p>x</p>`), [{ color: null, html: '<h2>A</h2>\n<p>x</p>' }]);
});

test('a marker not followed by an h2 is dropped', () => {
  assert.deepEqual(sectionsOf(`<p>a</p>\n${M('surface')}\n<p>b</p>\n<h2>c</h2>`), [
    { color: null, html: '<p>a</p>\n<p>b</p>\n<h2>c</h2>' },
  ]);
  assert.deepEqual(sectionsOf(`<p>a</p>\n${M('surface')}\n<h3>c</h3>`), [{ color: null, html: '<p>a</p>\n<h3>c</h3>' }]);
});

test('the intro is the text before the first section starts', () => {
  assert.deepEqual(introOf(`<p>a</p>\n<p>b</p>\n${M('surface')}\n<h2>c</h2>\n<p>d</p>`), {
    intro: '<p>a</p>\n<p>b</p>\n',
    rest: `${M('surface')}\n<h2>c</h2>\n<p>d</p>`,
  });
  assert.deepEqual(introOf('<p>a</p><p class="label-medium">L</p><h1>c</h1>'), {
    intro: '<p>a</p>',
    rest: '<p class="label-medium">L</p><h1>c</h1>',
  });
});

test('without a heading the text is all intro, and a text that starts with one has none', () => {
  assert.deepEqual(introOf('<p>a</p>'), { intro: '<p>a</p>', rest: '' });
  assert.deepEqual(introOf('<h2>a</h2><p>b</p>'), { intro: '', rest: '<h2>a</h2><p>b</p>' });
});

test('the class of a coloured section', () => {
  assert.equal(sectionClass('surface'), 'text-section text-section-surface');
});

test("in Astro's pipeline the marker comes out as the matcher reads it", async () => {
  const processor = await createMarkdownProcessor({ rehypePlugins: [rehypeRaw] });
  const { code } = await processor.render(`Intro\n\n${M('surface')}\n\n## Opening hours\n\nMon–Fri\n\n## Contact\n\nCall`);
  assert.ok(code.includes(M('surface')), code);
  const runs = sectionsOf(code);
  assert.deepEqual(
    runs.map((r) => r.color),
    [null, 'surface', null],
  );
  assert.ok(runs[1].html.startsWith('<h2') && runs[1].html.includes('Mon–Fri') && !runs[1].html.includes('Contact'), runs[1].html);
});

test('a section from before is read as its new colour: Tint is Surface, Accent is Primary', () => {
  const html = `<div data-section="tint"></div>\n<h2>A</h2>\n<p>x</p>\n<div data-section="accent"></div>\n<h2>B</h2>`;
  assert.deepEqual(
    sectionsOf(html).map((r) => r.color),
    ['surface', 'primary'],
  );
});

test('a section keeps its image, its description and its width', () => {
  const marker = '<div data-section="" data-picture="/a.jpg" data-alt="A field" data-width="full"></div>';
  const [run] = sectionsOf(`${marker}\n<h2>A</h2>\n<p>x</p>`);
  assert.deepEqual(run, { color: '', image: '/a.jpg', alt: 'A field', width: 'full', html: '<h2>A</h2>\n<p>x</p>' });
  assert.equal(sectionClass(run.color, run), 'text-section text-section-picture text-section-full');
  assert.equal(sectionClass('primary', {}), 'text-section text-section-primary');
});
