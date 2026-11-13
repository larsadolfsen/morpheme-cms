import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockHtml } from '../lib/blocks.mjs';
import { firstEmptyRow, leaveOut, withoutEmptyRows } from './emptyRows.mjs';

// The blocks as the registry describes them: List and Segmented have required rows, Faq does not; Notice has no rows.
const facts = {
  list: { key: 'items', required: true, name: 'List', word: 'row' },
  segmented: { key: 'items', required: true, name: 'Segmented list', word: 'row' },
  faq: { key: 'items', required: false, name: 'FAQ list', word: 'question' },
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
  assert.deepEqual(leaveOut(describe, 'segmented', props), { items: [{ title: 'A' }, { title: 'B' }] });
  const text = page({ type: 'list', props: { items: [{ title: 'A' }] } }, { type: 'segmented', props });
  assert.deepEqual(firstEmptyRow(describe, text), { at: 1, type: 'segmented', name: 'Segmented list', word: 'row' });
});

test('the block of a row with an icon or a link is not empty', () => {
  assert.equal(leaveOut(describe, 'list', { items: [{ title: '', icon: 'star' }, { title: 'A' }] }), undefined);
  assert.equal(leaveOut(describe, 'list', { items: [{ title: '', href: '/a/' }] }), undefined);
});

test('a block with no row at all, whose rows are required, counts as one empty row and is left out as a whole', () => {
  assert.equal(leaveOut(describe, 'segmented', {}), null);
  assert.equal(leaveOut(describe, 'segmented', { items: [] }), null);
  assert.equal(leaveOut(describe, 'segmented', { items: [{ title: '' }] }), null);
  assert.equal(firstEmptyRow(describe, page({ type: 'segmented', props: {} }))?.type, 'segmented');
});

test('rows that are not required: no row is nothing, empty rows are left out', () => {
  assert.equal(leaveOut(describe, 'faq', {}), undefined);
  assert.deepEqual(leaveOut(describe, 'faq', { items: [{ title: '' }] }), { items: [] });
});

test('a block without rows (Notice) or a hidden block is never asked about', () => {
  assert.equal(leaveOut(describe, 'notice', { text: '' }), undefined);
  assert.equal(firstEmptyRow(describe, page({ type: 'segmented', props: { hidden: true } })), null);
});

test('each empty row of the page is left out, the rest of the text is untouched', () => {
  const text = page(
    { type: 'list', props: { items: [{ title: 'A' }, { title: '' }], heading: 'H' } },
    { type: 'segmented', props: { items: [{ title: '' }] } },
    { type: 'faq', props: { items: [{ title: 'Q' }, { title: '' }] } },
    { type: 'segmented', props: { hidden: true } },
  );
  const out = withoutEmptyRows(describe, text);
  assert.equal(rows(out, 0), blockHtml('list', { items: [{ title: 'A' }], heading: 'H' }));
  assert.equal(rows(out, 1), blockHtml('faq', { items: [{ title: 'Q' }] }));
  assert.equal(rows(out, 2), blockHtml('segmented', { hidden: true }));
  assert.ok(out.startsWith('# Title') && out.endsWith('Text'));
  assert.equal(withoutEmptyRows(describe, out), out);
});

test('a page without empty rows is the same text', () => {
  const text = page({ type: 'list', props: { items: [{ title: 'A' }] } });
  assert.equal(withoutEmptyRows(describe, text), text);
});
