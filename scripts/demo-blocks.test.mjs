import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  blockPages,
  blockReaches,
  demoBlockPages,
  demoBlocksPage,
  demoBlocksTestBody,
  demoBlocksProblems,
  editorBlocks,
  exampleProblems,
  legacyBlocks,
  offeredValues,
  pageProblems,
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
  assert.match(demoBlocksProblems(page('list'), editor, legacy)[0], /"steps".*no example/);
});

test('a former block missing from the legacy list fails, and so does a stale legacy entry', () => {
  assert.match(demoBlocksProblems(page('list', 'steps'), editor, {})[0], /"points".*legacyBlocks/);
  assert.match(demoBlocksProblems(page('list', 'steps'), { offered: editor.offered, former: [] }, legacy)[0], /"points".*not a former/);
});

test('typesOnPage lists each type once', () => {
  assert.deepEqual(typesOnPage(page('b', 'a', 'b')), ['a', 'b']);
});

test('the real Blocks pages match the real editor', () => {
  assert.deepEqual(demoBlocksProblems(demoBlocksPage(), editorBlocks(), legacyBlocks), []);
});

test('offeredValues reads the values of a field from the code', () => {
  assert.deepEqual(
    offeredValues("{ name: 'x',\n      options: [\n        { label: 'A', value: '' },\n        { label: 'B', value: 'b' },\n      ],", 'x'),
    ['', 'b'],
  );
  assert.deepEqual(offeredValues('', 'x'), []);
});

test('the real Blocks pages show every style the editor offers', () => {
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

test('the real Blocks pages name every example and have no two alike', () => {
  assert.deepEqual(exampleProblems(demoBlocksPage()), []);
});

test('an example without a subheading, or a copy of another, is reported', () => {
  const a = '<div data-block="faq" data-props="{&quot;x&quot;:1}"></div>';
  assert.match(exampleProblems(`${a}\n\n${a}`)[0], /no "##" subheading/);
  assert.ok(exampleProblems(`## One\n\n${a}\n\n## Two\n\n${a}`).some((p) => /are the same/.test(p)));
  // One example alone needs its subheading too, and a sentence may stand between the subheading and the example.
  assert.match(exampleProblems(`${a}`)[0], /no "##" subheading/);
  assert.deepEqual(exampleProblems(`# Page\n\n## One\n\nAbout it.\n\n${a}`), []);
  // A subheading is for the example right below it, not for the next page's.
  assert.match(exampleProblems(`## One\n\n${a}\n\n# Next\n\n${a.replace('1', '2')}`)[0], /no "##" subheading/);
});

test('the real Blocks pages are in order', () => {
  assert.deepEqual(pageProblems(demoBlockPages()), []);
});

test('the pages hold every block type of the editor once', () => {
  const onPages = Object.values(blockPages).flatMap((page) => page.types);
  assert.equal(new Set(onPages).size, onPages.length);
  assert.deepEqual(typesOnPage(demoBlocksPage()), [...onPages].sort());
});

test('a basic page draws its blocks with its component, read from the code', () => {
  assert.ok(blockReaches('expand', '@theme/ui/List'));
  assert.ok(blockReaches('notice', '@theme/ui/Card'));
  assert.ok(!blockReaches('steps', '@theme/ui/Card'));
});

test('the test body has every example under one heading', () => {
  const body = demoBlocksTestBody();
  assert.equal(body.match(/^# /gm).length, 1);
  assert.equal(typesOnPage(body).length, Object.values(blockPages).flatMap((page) => page.types).length);
});

test('an example on the wrong page, twice, or a page missing from the index is reported', () => {
  const real = demoBlockPages();
  const noCode = { code: false };
  // An example of the Lists page moved to the Cards page.
  const moved = real.pages.lists.match(/^<div data-block="list"[^\n]*/m)[0];
  const wrong = { ...real, pages: { ...real.pages, cards: `${real.pages.cards}\n${moved}\n` } };
  assert.ok(
    pageProblems(wrong, blockPages, noCode).some((p) => /"list" is on the "Cards" page|example of "list" is on the "Cards" page/.test(p)),
  );
  // The same example on two pages.
  const same = {
    ...real,
    pages: { ...real.pages, buttons: `${real.pages.buttons}\n${real.pages.buttons.match(/^<div data-block="buttons"[^\n]*/m)[0]}\n` },
  };
  assert.ok(pageProblems(same, blockPages, noCode).some((p) => /two Blocks pages/.test(p)));
  // A page missing from the index, and one without a file.
  const noIndex = { ...real, index: real.index.replaceAll('/blocks/video/', '/blocks/') };
  assert.ok(pageProblems(noIndex, blockPages, noCode).some((p) => /index does not list the "Video" page/.test(p)));
  const { video: _gone, ...rest } = real.pages;
  assert.ok(pageProblems({ ...real, pages: rest }, blockPages, noCode).some((p) => /"Video" has no file/.test(p)));
  // A page without its link back to the index.
  const noBack = { ...real, pages: { ...real.pages, steps: real.pages.steps.replace('[All blocks](/blocks/)', '') } };
  assert.ok(pageProblems(noBack, blockPages, noCode).some((p) => /no link back to the index/.test(p)));
  // An example on the index.
  const onIndex = { ...real, index: `${real.index}\n${moved}\n` };
  assert.ok(pageProblems(onIndex, blockPages, noCode).some((p) => /index shows an example/.test(p)));
});
