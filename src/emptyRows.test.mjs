import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockHtml } from '../lib/blocks.mjs';
import { firstEmptyRow, leaveOut, withoutEmptyRows } from './emptyRows.mjs';

// The blocks as the registry describes them: List and List - Expand have required rows, Gallery does not; Notice has no rows.
const facts = {
  list: { key: 'items', required: true, name: 'List', word: 'row', items: 'rows' },
  expand: { key: 'items', required: true, name: 'List - Expand', word: 'row', items: 'rows' },
  gallery: { key: 'items', required: false, name: 'Gallery', word: 'image', items: 'images' },
};
const describe = (type) => facts[type] ?? null;
const page = (...blocks) => ['# Title', ...blocks.map((b) => blockHtml(b.type, b.props)), 'Text'].join('\n\n');
const rows = (text, i = 0) => text.split('\n').filter((l) => l.startsWith('<div data-block'))[i];

test('a block with content in every row has nothing to leave out', () => {
  assert.equal(leaveOut(describe, 'list', { items: [{ title: 'A' }, { title: 'B' }] }), undefined);
  assert.equal(firstEmptyRow(describe, page({ type: 'list', props: { items: [{ title: 'A' }] } })), null);
});

test('an empty row between or before content is found and left out', () => {
  const props = { items: [{ title: '' }, { title: 'A' }, { title: '' }, { title: 'B' }] };
  assert.deepEqual(leaveOut(describe, 'expand', props), { items: [{ title: 'A' }, { title: 'B' }] });
  const text = page({ type: 'list', props: { items: [{ title: 'A' }] } }, { type: 'expand', props });
  assert.deepEqual(firstEmptyRow(describe, text), {
    at: 1,
    type: 'expand',
    kind: 'row',
    name: 'List - Expand',
    word: 'row',
    items: 'rows',
  });
});

test('the block of a row with an icon or a link is not empty', () => {
  assert.equal(leaveOut(describe, 'list', { items: [{ title: '', icon: 'star' }, { title: 'A' }] }), undefined);
  assert.equal(leaveOut(describe, 'list', { items: [{ title: '', href: '/a/' }] }), undefined);
});

test('a block with no row at all, whose rows are required, counts as one empty row and is left out as a whole', () => {
  assert.equal(leaveOut(describe, 'expand', {}), null);
  assert.equal(leaveOut(describe, 'expand', { items: [] }), null);
  assert.equal(leaveOut(describe, 'expand', { items: [{ title: '' }] }), null);
  assert.equal(firstEmptyRow(describe, page({ type: 'expand', props: {} }))?.kind, 'block');
  assert.equal(firstEmptyRow(describe, page({ type: 'expand', props: { items: [{ title: '' }, { title: 'A' }] } }))?.kind, 'row');
});

test('rows that are not required: no row is nothing, empty rows are left out', () => {
  assert.equal(leaveOut(describe, 'gallery', {}), undefined);
  assert.deepEqual(leaveOut(describe, 'gallery', { items: [{ title: '' }] }), { items: [] });
});

test('a block without rows (Notice) or a hidden block is never asked about', () => {
  assert.equal(leaveOut(describe, 'notice', { text: '' }), undefined);
  assert.equal(firstEmptyRow(describe, page({ type: 'expand', props: { hidden: true } })), null);
});

test('each empty row of the page is left out, the rest of the text is untouched', () => {
  const text = page(
    { type: 'list', props: { items: [{ title: 'A' }, { title: '' }], heading: 'H' } },
    { type: 'expand', props: { items: [{ title: '' }] } },
    { type: 'gallery', props: { items: [{ title: 'Q' }, { title: '' }] } },
    { type: 'expand', props: { hidden: true } },
  );
  const out = withoutEmptyRows(describe, text);
  assert.equal(rows(out, 0), blockHtml('list', { items: [{ title: 'A' }], heading: 'H' }));
  assert.equal(rows(out, 1), blockHtml('gallery', { items: [{ title: 'Q' }] }));
  assert.equal(rows(out, 2), blockHtml('expand', { hidden: true }));
  assert.ok(out.startsWith('# Title') && out.endsWith('Text'));
  assert.equal(withoutEmptyRows(describe, out), out);
});

test('a page without empty rows is the same text', () => {
  const text = page({ type: 'list', props: { items: [{ title: 'A' }] } });
  assert.equal(withoutEmptyRows(describe, text), text);
});
