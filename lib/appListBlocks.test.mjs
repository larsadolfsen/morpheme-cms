import assert from 'node:assert/strict';
import { test } from 'node:test';
import { manifestProblems } from './appManifest.mjs';
import { listBlockProblems, listBlockProps, listBlockSettingNames, listBlockType, siteListId } from './appListBlocks.mjs';
import { blocksIn, parseBlock } from './blocks.mjs';

const list = {
  id: 'faq',
  label: 'Questions',
  singular: 'Question',
  icon: 'Quiz',
  version: 2,
  fields: [
    { id: 'question', kind: 'title' },
    { id: 'answer', kind: 'text' },
    { id: 'topic', kind: 'tags' },
  ],
};
const block = {
  type: 'faq',
  label: 'FAQ from Questions',
  icon: 'Quiz',
  hint: 'Questions from your Questions list.',
  draws: 'faq',
  list: 'faq',
  map: { title: 'question', text: 'answer', tags: 'topic' },
  settings: ['tags', 'howMany', 'button', 'only'],
};
const base = {
  api: 6,
  label: 'Help',
  publisher: 'Example',
  license: 'MIT',
  icon: 'Quiz',
  hint: 'Questions.',
  version: '1.0.0',
  lists: [list],
};
const problems = (listBlock) => listBlockProblems([{ ...block, ...listBlock }], { lists: [list] }).join('\n');

test('a valid list block has no problem', () => {
  assert.deepEqual(listBlockProblems([block], { lists: [list] }), []);
  assert.deepEqual(manifestProblems({ ...base, listBlocks: [block] }, ['app.json']), []);
});

test('listBlocks is a contract 6 key only', () => {
  assert.match(manifestProblems({ ...base, api: 5, listBlocks: [block] }, ['app.json']).join('\n'), /"listBlocks" is not known/);
  assert.match(manifestProblems({ ...base, api: 4, listBlocks: [block] }, ['app.json']).join('\n'), /"listBlocks" is not known/);
});

test('an unknown draws, a list the app lacks, a map to a missing field and a setting the block lacks are named', () => {
  assert.match(problems({ draws: 'carousel' }), /"draws" that is one of list, segmented, faq/);
  assert.match(problems({ list: 'nothing' }), /reads the list "nothing", which the app does not have/);
  assert.match(problems({ map: { title: 'nope' } }), /sends "title" to the field "nope", which the list "faq" does not have/);
  assert.match(problems({ map: { color: 'question' } }), /the slot "color", which "faq" does not have/);
  assert.match(problems({ settings: ['ratio'] }), /"settings" has "ratio", which "faq" does not have/);
});

test('type, texts and keys are checked', () => {
  assert.match(problems({ type: 'Bad Type' }), /needs a "type"/);
  assert.match(problems({ label: '' }), /non-empty string "label"/);
  assert.match(problems({ extra: 1 }), /unknown key "extra"/);
  assert.match(listBlockProblems([block, block], { lists: [list] }).join('\n'), /type "faq" more than once/);
});

test('a list block reads only its own app’s lists: not posts, testimonials or another app’s list', () => {
  for (const list of ['posts', 'testimonials', 'app_other.faq'])
    assert.match(
      listBlockProblems([{ ...block, list, map: undefined }], { lists: [] }).join('\n'),
      /reads the list "[^"]+", which the app does not have in "lists"/,
    );
});

test('the type, the site id of the list and the starting props', () => {
  assert.equal(listBlockType('app_7f3c', 'faq'), 'app_7f3c.faq');
  assert.equal(siteListId('app_7f3c', 'faq', ['faq']), 'app_7f3c.faq');
  assert.deepEqual(listBlockProps('app_7f3c', block, ['faq']), { from: 'app_7f3c.faq', map: block.map });
  assert.deepEqual(listBlockSettingNames({ draws: 'faq', settings: ['tags', 'ratio', 'only'] }), ['tags', 'only']);
});

test('a page can hold a block of an app: <app id>.<type>', () => {
  const html = '<div data-block="app_7f3c.faq" data-props="{&quot;from&quot;:&quot;app_7f3c.faq&quot;}"></div>';
  assert.deepEqual(parseBlock(html), { type: 'app_7f3c.faq', props: { from: 'app_7f3c.faq' } });
  assert.deepEqual(
    blocksIn(`${html}\n<div data-block="faq"></div>`).map((b) => b.type),
    ['app_7f3c.faq', 'faq'],
  );
});
