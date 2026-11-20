// Tests for lib/rehype-checklist-names.mjs: the checkbox of a check list item is named by the item's text.
// Run: node --test lib/rehype-checklist-names.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { rehypeChecklistNames } from './rehype-checklist-names.mjs';

const html = async (markdown) => (await (await createMarkdownProcessor({ rehypePlugins: [rehypeChecklistNames] })).render(markdown)).code;

test('a tight item names its checkbox by its text', async () => {
  const out = await html('- [x] Write the *first* page\n- [ ] Publish it');
  assert.match(out, /aria-label="Write the first page"/);
  assert.match(out, /aria-label="Publish it"/);
});

test('a loose item (its text in a paragraph) names its checkbox too', async () => {
  const out = await html('- [x] One\n\n- [ ] Two');
  assert.match(out, /aria-label="One"/);
  assert.match(out, /aria-label="Two"/);
});

test('a nested list is named by its own items, not the parent', async () => {
  const out = await html('- [x] Parent\n  - [ ] Child');
  assert.match(out, /aria-label="Parent"/);
  assert.match(out, /aria-label="Child"/);
});

test('a plain list is left alone', async () => {
  assert.doesNotMatch(await html('- one\n- two'), /aria-label/);
});
