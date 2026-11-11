// Tests for lib/remark-list-head.mjs: the head of a List block becomes the text's own lines above it. Run: node --test lib/remark-list-head.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { blockHtml } from './blocks.mjs';
import { listHeadMarkdown, remarkListHeads } from './remark-list-head.mjs';

const through = (markdown) =>
  String(unified().use(remarkParse).use(remarkGfm).use(remarkListHeads).use(remarkStringify, { bullet: '-' }).processSync(markdown));
const items = [{ title: 'One' }];

test('the head is a label, a heading and an intro above the list, and the list keeps its rows', () => {
  assert.equal(
    listHeadMarkdown({ eyebrow: 'Open', heading: 'Hours', intro: 'Come by.', items }),
    `<p class="block-eyebrow">Open</p>\n\n## Hours\n\n<p class="body-large">Come by.</p>\n\n${blockHtml('list', { items })}`,
  );
});

test('under an H2 the heading is an H3, so the section does not split', () => {
  assert.match(listHeadMarkdown({ heading: 'Hours', items }, { after: true }), /^### Hours\n\n/);
});

test('a list without a head, and a hidden one, are not changed', () => {
  assert.equal(listHeadMarkdown({ items }), null);
  assert.equal(listHeadMarkdown({ hidden: true, heading: 'Hours', items }), null);
});

test('empty head fields leave only the list', () => {
  assert.equal(listHeadMarkdown({ eyebrow: '', heading: ' ', intro: '', items }), blockHtml('list', { items }));
});

test('the plugin replaces the block in a text, with H3 once an H2 is above', () => {
  const block = blockHtml('list', { heading: 'Hours', items });
  assert.match(through(`Intro.\n\n${block}`), /^Intro\.\n\n## Hours\n\n<div data-block="list"/);
  assert.match(through(`## Top\n\n${block}`), /## Top\n\n### Hours\n\n<div data-block="list"/);
});

test('what it writes is read and written back the same', () => {
  const once = through(`## Top\n\n${blockHtml('list', { eyebrow: 'A', heading: 'B', intro: 'C', items })}\n\nAfter.`);
  assert.equal(through(once), once);
});

test('as lines (the front page reads it so): the same lines, an H3 under an H2', async () => {
  const { listHeadsInMarkdown } = await import('./remark-list-head.mjs');
  const block = blockHtml('list', { heading: 'Hours', items });
  assert.match(listHeadsInMarkdown(`Intro.\n\n${block}`), /^Intro\.\n\n## Hours\n\n<div data-block="list"/);
  assert.match(listHeadsInMarkdown(`## Top\n\n${block}`), /## Top\n\n### Hours\n\n<div data-block="list"/);
  assert.equal(listHeadsInMarkdown('plain'), 'plain');
});
