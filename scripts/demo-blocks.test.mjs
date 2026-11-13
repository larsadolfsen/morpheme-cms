import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  demoBlocksPage,
  demoBlocksProblems,
  editorBlocks,
  exampleProblems,
  legacyBlocks,
  offeredValues,
  styleProblems,
  typesOnPage,
} from './demo-blocks.mjs';

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

test('offeredValues reads the values of a field from the code', () => {
  assert.deepEqual(
    offeredValues("{ name: 'x',\n      options: [\n        { label: 'A', value: '' },\n        { label: 'B', value: 'b' },\n      ],", 'x'),
    ['', 'b'],
  );
  assert.deepEqual(offeredValues('', 'x'), []);
});

test('the real Blocks page shows every style the editor offers', () => {
  assert.deepEqual(styleProblems(demoBlocksPage()), []);
});

test('a missing button kind or card design is reported', () => {
  const text = demoBlocksPage()
    .replaceAll('&quot;kind&quot;:&quot;text&quot;', '&quot;kind&quot;:&quot;filled&quot;')
    .replaceAll('&quot;design&quot;:&quot;elevated&quot;', '&quot;design&quot;:&quot;filled&quot;');
  const problems = styleProblems(text);
  assert.ok(problems.some((p) => /"text" button/.test(p)));
  assert.ok(problems.some((p) => /"cards" with design "elevated"/.test(p)));
});

test('the real Blocks page names every example and has no two alike', () => {
  assert.deepEqual(exampleProblems(demoBlocksPage()), []);
});

test('an example without a subheading, or a copy of another, is reported', () => {
  const a = '<div data-block="faq" data-props="{&quot;x&quot;:1}"></div>';
  assert.match(exampleProblems(`${a}\n\n${a}`)[0], /no "###" subheading/);
  assert.ok(exampleProblems(`### One\n\n${a}\n\n### Two\n\n${a}`).some((p) => /are the same/.test(p)));
  assert.deepEqual(exampleProblems(`${a}`), []);
});
