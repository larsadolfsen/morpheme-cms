import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CORE_PAGE_FILE, EXTRA_BLOCKS, coreBlockTypes, coreBlocksPage } from './core-blocks-page.mjs';
import { NOT_COPIED } from './test-site.mjs';

test('The system test page has every core block, so a new block must be added to it', () => {
  const page = coreBlocksPage();
  // By the markup, not blocksIn: that reads a block from before as the block it became.
  const used = new Set([...page.matchAll(/data-block="([a-z]+)"/g)].map((m) => m[1]));
  const types = coreBlockTypes();
  assert.ok(types.length >= 19, 'the core blocks are found');
  for (const type of types)
    assert.ok(used.has(type), `the test page has no "${type}" block: add it to EXTRA_BLOCKS in scripts/core-blocks-page.mjs`);
});

test('The test page is marked for robots by the CMS settings and is a page of the temporary copy only', () => {
  const page = coreBlocksPage();
  const front = page.match(/^---\n([\s\S]*?)\n---\n/)[1];
  assert.match(front, /^noindex: true$/m);
  assert.match(front, /^nofollow: true$/m);
  assert.match(CORE_PAGE_FILE, /^src\/content\/pages\/[a-z-]+\.md$/);
});

test('The extra blocks are core blocks, and the copy leaves out what is built or is history', () => {
  for (const type of Object.keys(EXTRA_BLOCKS))
    assert.ok(coreBlockTypes().includes(type) || type === 'rows', `${type} is not a core block`);
  for (const name of ['node_modules', 'dist', '.astro', '.git']) assert.ok(NOT_COPIED.has(name));
});
