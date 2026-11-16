import test from 'node:test';
import assert from 'node:assert/strict';
import { definitionOfFlow, flowOf, textsOf } from './fieldFlow.mjs';

const fields = ['title', 'title-2', 'tags'].map((id) => ({ id, kind: id.replace(/-\d+$/, '') }));
const n = (style, text, after) => ({ style, text, after });
const def = {
  version: 2,
  label: 'Services',
  fields,
  dropped: [],
  notes: [n('heading', 'H', null), n('body', 'B', null), n('label', 'L', 'title'), n('body', 'T', 'tags'), n('body', 'T2', 'tags')],
};
const text = (style, t) => ({ type: 'text', style, text: t });
const field = (id) => ({ type: 'field', id });

test('flowOf: text before the first field, then each field with its text, in order', () => {
  assert.deepEqual(flowOf(def), [
    text('heading', 'H'),
    text('body', 'B'),
    field('title'),
    text('label', 'L'),
    field('title-2'),
    field('tags'),
    text('body', 'T'),
    text('body', 'T2'),
  ]);
  assert.deepEqual(
    flowOf({ ...def, notes: undefined }),
    fields.map((x) => field(x.id)),
  );
});

test('flowOf reads a line after a missing field as before the first field, and skips empty lines', () => {
  const flow = flowOf({ ...def, notes: [n('body', 'x', 'gone'), n('body', ' ', null)] });
  assert.deepEqual(flow.slice(0, 2), [text('body', 'x'), field('title')]);
  assert.equal(flow.length, 4);
});

test('definitionOfFlow is the inverse of flowOf', () => {
  assert.deepEqual(definitionOfFlow(def, flowOf(def)), def);
  assert.deepEqual(definitionOfFlow({ ...def, notes: [] }, flowOf({ ...def, notes: [] })), { ...def, notes: [] });
});

test('moving a card past a card changes `fields`; past text only the text `after`', () => {
  const flow = flowOf(def);
  // `title` moves down past its text only: the order of the fields stays
  const pastText = [...flow.slice(0, 2), flow[3], flow[2], ...flow.slice(4)];
  const a = definitionOfFlow(def, pastText);
  assert.deepEqual(
    a.fields.map((x) => x.id),
    ['title', 'title-2', 'tags'],
  );
  assert.equal(a.notes.find((x) => x.text === 'L').after, null);
  // past the next card too
  const pastCard = [...flow.slice(0, 2), flow[3], flow[4], flow[2], ...flow.slice(5)];
  const b = definitionOfFlow(def, pastCard);
  assert.deepEqual(
    b.fields.map((x) => x.id),
    ['title-2', 'title', 'tags'],
  );
  assert.equal(b.notes.find((x) => x.text === 'L').after, null);
  assert.equal(b.notes.find((x) => x.text === 'T').after, 'tags');
});

test('removing a field re-anchors its text on the nearest field before it', () => {
  const flow = flowOf(def).filter((x) => !(x.type === 'field' && x.id === 'title-2'));
  const next = definitionOfFlow({ ...def, dropped: ['title-2', 'tags'] }, flow);
  assert.deepEqual(
    next.fields.map((x) => x.id),
    ['title', 'tags'],
  );
  assert.deepEqual(next.dropped, ['tags']);
  const noFirst = definitionOfFlow(
    def,
    flowOf(def).filter((x) => !(x.type === 'field' && x.id === 'title')),
  );
  assert.equal(noFirst.notes.find((x) => x.text === 'L').after, null);
});

test('definitionOfFlow keeps the fields as they are, trims text and drops empty lines and unknown ids', () => {
  const named = { ...def, fields: [{ id: 'title', kind: 'title', label: 'Name' }], notes: [] };
  const next = definitionOfFlow(named, [text('body', '  hi  '), text('body', ' '), field('nope'), field('title'), field('title')]);
  assert.deepEqual(next.fields, named.fields);
  assert.deepEqual(next.notes, [n('body', 'hi', null)]);
});

test('textsOf: every line in the order written, wherever it follows', () => {
  assert.deepEqual(
    textsOf(def).map((x) => x.text),
    ['H', 'B', 'L', 'T', 'T2'],
  );
  assert.deepEqual(textsOf({}), []);
  assert.deepEqual(textsOf({ notes: [n('body', ' x ', null), n('body', '', null)] }), [{ style: 'body', text: 'x' }]);
});
