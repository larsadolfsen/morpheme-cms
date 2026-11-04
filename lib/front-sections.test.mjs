// Tests the front page's reading of section colours (src/sections.mjs): the marker into the H2's part, and the colour into the sections.
// Run: node --test packages/editor/lib/front-sections.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockHtml } from './blocks.mjs';
import { partsOfMarkdown, sectionsFromParts } from '../src/sections.mjs';

const tint = '<div data-section="tint"></div>';
const accent = '<div data-section="accent"></div>';
const lines = (...l) => l.join('\n\n');

test('a marker before an H2 is the colour of its part, and is not text', () => {
  const parts = partsOfMarkdown(lines('# Title', tint, '## Hours', 'Open daily.'));
  assert.deepEqual(parts, [{ heading: 'Hours', color: 'tint' }, { markdown: 'Open daily.' }]);
});

test('a heading without a marker has no color key', () => {
  assert.deepEqual(partsOfMarkdown('## Hours'), [{ heading: 'Hours' }]);
});

test('a marker not before an H2, or with an unknown colour, is dropped and not shown', () => {
  assert.deepEqual(partsOfMarkdown(lines(tint, 'Just text', '## Later')), [{ markdown: 'Just text' }, { heading: 'Later' }]);
  assert.deepEqual(partsOfMarkdown(lines('<div data-section="pink"></div>', '## X')), [{ heading: 'X' }]);
  assert.deepEqual(
    partsOfMarkdown(lines(tint, blockHtml('steps', {}), '## Y')).filter((p) => 'heading' in p),
    [{ heading: 'Y' }],
  );
});

test('a marker in a code block stays text', () => {
  const code = '```\n' + tint + '\n```';
  assert.deepEqual(partsOfMarkdown(code), [{ markdown: code }]);
});

test('a label line may stand between the marker and the H2', () => {
  const label = '<p class="block-eyebrow">New</p>';
  assert.deepEqual(partsOfMarkdown(lines(tint, label, '## T')), [{ markdown: label }, { heading: 'T', color: 'tint' }]);
});

test('colors: a text section and a block with a lead take the colour of their H2', () => {
  const parts = partsOfMarkdown(
    lines(tint, '## About', 'About text.', '## Plain', 'Plain text.', accent, '## Steps', blockHtml('steps', {})),
  );
  const sections = sectionsFromParts(parts, { steps: { heading: 'heading' } }, { colors: true });
  assert.deepEqual(
    sections.map((s) => [s.type, s.heading, s.sectionColor]),
    [
      ['text', 'About', 'tint'],
      ['text', 'Plain', undefined],
      ['steps', 'Steps', 'accent'],
    ],
  );
});

test('colors: lead-less blocks and text without a heading inherit it up to the next H2', () => {
  const parts = partsOfMarkdown(lines(tint, '## Hours', 'Text.', blockHtml('book', {}), 'More.', '## Plain', 'End.'));
  const sections = sectionsFromParts(parts, {}, { colors: true });
  assert.deepEqual(
    sections.map((s) => [s.type, s.sectionColor]),
    [
      ['text', 'tint'],
      ['book', 'tint'],
      ['text', 'tint'],
      ['text', undefined],
    ],
  );
});

test('colors: the top (hero) has none, and inheritance restarts after it', () => {
  const parts = partsOfMarkdown(lines(tint, '## Welcome', 'Intro.', blockHtml('hero', {}), blockHtml('book', {})));
  const sections = sectionsFromParts(parts, { hero: { body: 'text', upTo: 'buttons' } }, { colors: true });
  assert.deepEqual(
    sections.map((s) => s.type),
    ['hero', 'book'],
  );
  assert.ok(sections.every((s) => s.sectionColor === undefined));
});

test('without the option no section has a colour (fixed pages, the blog page)', () => {
  const parts = partsOfMarkdown(lines(tint, '## About', 'About text.'));
  assert.ok(!JSON.stringify(sectionsFromParts(parts, {})).includes('sectionColor'));
});
