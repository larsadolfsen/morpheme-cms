import assert from 'node:assert/strict';
import { test } from 'node:test';
import { demoBlocksPage, demoBlocksProblems, editorBlocks, legacyBlocks, typesOnPage } from './demo-blocks.mjs';

const editor = { offered: ['list', 'steps'], former: ['points'] };
const legacy = { points: 'old' };
const page = (...types) => types.map((t) => `<div data-block="${t}"></div>`).join('\n');

test('agreeing page and editor have no problems', () => {
  assert.deepEqual(demoBlocksProblems(page('list', 'steps'), editor, legacy), []);
});

test('a block type that is not an editor block fails', () => {
  assert.match(demoBlocksProblems(page('list', 'steps', 'gone'), editor, legacy)[0], /"gone".*not an editor block/);
});

test('a legacy block on the page fails', () => {
  assert.match(demoBlocksProblems(page('list', 'steps', 'points'), editor, legacy)[0], /legacy/);
});

test('an editor block without a section fails', () => {
  assert.match(demoBlocksProblems(page('list'), editor, legacy)[0], /"steps".*no section/);
});

test('a former block missing from the legacy list fails, and so does a stale legacy entry', () => {
  assert.match(demoBlocksProblems(page('list', 'steps'), editor, {})[0], /"points".*legacyBlocks/);
  assert.match(demoBlocksProblems(page('list', 'steps'), { offered: editor.offered, former: [] }, legacy)[0], /"points".*not a former/);
});

test('typesOnPage lists each type once', () => {
  assert.deepEqual(typesOnPage(page('b', 'a', 'b')), ['a', 'b']);
});

test('the real Blocks page matches the real editor', () => {
  assert.deepEqual(demoBlocksProblems(demoBlocksPage(), editorBlocks(), legacyBlocks), []);
});
