// Tests for lib/remark-block-label.mjs: the label a block's head had is the text's own label line before the block. Run: node --test lib/remark-block-label.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { blockHtml } from './blocks.mjs';
import { blockLabelMarkdown, blockLabelsInMarkdown, remarkBlockLabels } from './remark-block-label.mjs';
import { migrateMarkdown } from './migrate-content.mjs';

const through = (markdown) =>
  String(unified().use(remarkParse).use(remarkGfm).use(remarkBlockLabels).use(remarkStringify, { bullet: '-' }).processSync(markdown));
const items = [{ title: 'One' }];

test('the label is a line before the block, and the block keeps the rest', () => {
  assert.equal(
    blockLabelMarkdown('steps', { eyebrow: 'How it works', heading: 'Three steps', items }),
    `<p class="label-medium">How it works</p>\n\n${blockHtml('steps', { heading: 'Three steps', items })}`,
  );
});

test('an empty label is dropped and the block is written without it', () => {
  assert.equal(blockLabelMarkdown('steps', { eyebrow: '  ', items }), blockHtml('steps', { items }));
});

test('a block without a label, and a hidden one, stay as they are', () => {
  assert.equal(blockLabelMarkdown('steps', { items }), null);
  assert.equal(blockLabelMarkdown('steps', { hidden: true, eyebrow: 'A', items }), null);
});

test('the label keeps its characters', () => {
  assert.match(blockLabelMarkdown('faq', { eyebrow: 'Fast & <safe>', items }), /^<p class="label-medium">Fast &amp; &lt;safe&gt;<\/p>/);
});

test('the plugin moves the label of each block, and leaves the rest of the text alone', () => {
  const text = `Intro.\n\n${blockHtml('cards', { eyebrow: 'A', heading: 'B', items })}\n\nAfter.\n`;
  assert.equal(through(text), `Intro.\n\n<p class="label-medium">A</p>\n\n${blockHtml('cards', { heading: 'B', items })}\n\nAfter.\n`);
});

test('it is the same once it is done', () => {
  const once = through(blockHtml('cards', { eyebrow: 'A', heading: 'B', items }));
  assert.equal(through(once), once);
});

test('as lines, a fenced block is left alone', () => {
  const block = blockHtml('steps', { eyebrow: 'A', items });
  assert.equal(blockLabelsInMarkdown('```\n' + block + '\n```'), '```\n' + block + '\n```');
  assert.match(blockLabelsInMarkdown(block), /^<p class="label-medium">A<\/p>\n\n<div data-block="steps"/);
});

test('the migration writes it, and a second run changes nothing', () => {
  const text = `## Top\n\n${blockHtml('steps', { eyebrow: 'A', heading: 'B', items })}\n`;
  const done = migrateMarkdown(text);
  assert.equal(done, `## Top\n\n<p class="label-medium">A</p>\n\n${blockHtml('steps', { heading: 'B', items })}\n`);
  assert.equal(migrateMarkdown(done), done);
});
