// Tests for lib/remark-checklist.mjs: a Checklist block becomes a check list in the text. Run: node --test lib/remark-checklist.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { blockHtml } from './blocks.mjs';
import { checklistMarkdown, remarkChecklists } from './remark-checklist.mjs';

const through = (markdown) =>
  String(unified().use(remarkParse).use(remarkGfm).use(remarkChecklists).use(remarkStringify, { bullet: '-' }).processSync(markdown));

test('the points are checked items and the head is plain text above them', () => {
  assert.equal(
    checklistMarkdown({ eyebrow: 'Built in', heading: 'On every site', intro: 'All included.', items: ['One', 'Two'] }),
    'Built in\n\n**On every site**\n\nAll included.\n\n- [x] One\n- [x] Two',
  );
});

test('a checklist without a head is only the list', () => {
  assert.equal(checklistMarkdown({ items: ['One'] }), '- [x] One');
});

test('characters that mean something in Markdown are escaped, and empty points are left out', () => {
  assert.equal(checklistMarkdown({ items: ['*Free* <b>', '', 'a\nb'] }), '- [x] \\*Free\\* \\<b\\>\n- [x] a b');
});

test('a hidden checklist and one without points stay blocks', () => {
  assert.equal(checklistMarkdown({ hidden: true, items: ['One'] }), null);
  assert.equal(checklistMarkdown({ items: [] }), null);
  assert.equal(checklistMarkdown({}), null);
});

test('the plugin replaces the block in a text and leaves the rest as it is', () => {
  const block = blockHtml('checklist', { heading: 'Why', items: ['One', 'Two'] });
  assert.equal(through(`Intro.\n\n${block}\n\nAfter.`), 'Intro.\n\n**Why**\n\n- [x] One\n- [x] Two\n\nAfter.\n');
  const hidden = blockHtml('checklist', { hidden: true, items: ['One'] });
  assert.equal(through(hidden).trim(), hidden);
});

test('what it writes reads and writes back the same', () => {
  const once = through(blockHtml('checklist', { eyebrow: 'A', heading: 'B', items: ['One', 'Two'] }));
  assert.equal(through(once), once);
});
