// Tests the blocks that have become another (FORMER in blocks.mjs): a "List" with each row on its own surface is a "Segmented list" with its
// rows always open, any other "List" stays a list. Run: node --test lib/blocks-former.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockHtml, blocksIn, parseBlock, splitBlocks } from './blocks.mjs';

const items = [{ title: 'One', text: 'First', href: '/a' }, { title: 'Two' }];

test('a segmented List is a Segmented list with its rows always open', () => {
  const b = parseBlock(blockHtml('list', { heading: 'H', design: 'segmented', items }));
  assert.deepEqual(b, { type: 'segmented', props: { heading: 'H', show: 'all', items } });
});

test('a standard List stays a List, with or without an empty design', () => {
  assert.deepEqual(parseBlock(blockHtml('list', { items })), { type: 'list', props: { items } });
  assert.deepEqual(parseBlock(blockHtml('list', { design: '', items })), { type: 'list', props: { items } });
});

test('it is read the same everywhere a text is read', () => {
  const html = `<p>x</p>${blockHtml('list', { design: 'segmented', items })}`;
  assert.deepEqual(
    blocksIn(html).map((x) => x.type),
    ['segmented'],
  );
  assert.deepEqual(
    splitBlocks(html, ['segmented'])
      .filter((p) => p.type)
      .map((p) => p.props.show),
    ['all'],
  );
  assert.equal(splitBlocks(html, ['list']).filter((p) => p.type).length, 0);
});

test('a hidden segmented List stays hidden', () => {
  assert.equal(splitBlocks(blockHtml('list', { design: 'segmented', hidden: true, items }), ['segmented']).filter((p) => p.type).length, 0);
});
