// Tests for liveSheet.mjs: one undo step per field focus, a pick as its own step, and the block followed through changes and Undo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from '@milkdown/kit/prose/model';
import { EditorState } from '@milkdown/kit/prose/state';
import { history, undo, undoDepth, redo } from '@milkdown/kit/prose/history';
import { mapRange, sheetSteps, stepOf } from './liveSheet.mjs';

// A text of paragraphs and blocks (leaf nodes with props, like the editor's site blocks).
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'text*' },
    card: { group: 'block', atom: true, attrs: { props: { default: {} } } },
    text: {},
  },
});
const start = () =>
  EditorState.create({
    schema,
    doc: schema.node('doc', null, [schema.node('paragraph', null, [schema.text('Hi')]), schema.node('card', { props: { a: '' } })]),
    plugins: [history()],
  });
// The card is after the paragraph "Hi" (size 4).
const CARD = 4;
// A change written as the live sheet writes it, `ms` after the last.
const write = (state, props, step, ms = 0) => {
  const tr = stepOf(state.tr.setNodeMarkup(CARD, undefined, { props }), step);
  tr.setTime(Date.now() + ms);
  return state.apply(tr);
};
const props = (state) => state.doc.nodeAt(CARD).attrs.props;
const undone = (state) => {
  let next = state;
  undo(state, (tr) => (next = state.apply(tr)));
  return next;
};

test('changes typed in one field while it has the focus are one step, however slowly they are typed', () => {
  const steps = sheetSteps();
  const field = {};
  let state = start();
  for (const [i, text] of ['H', 'He', 'Hel', 'Hell', 'Hello'].entries()) state = write(state, { a: text }, steps.change(field), i * 2000);
  assert.equal(undoDepth(state), 1);
  state = undone(state);
  assert.deepEqual(props(state), { a: '' });
});

test('another field is another step', () => {
  const steps = sheetSteps();
  const [first, second] = [{}, {}];
  let state = start();
  state = write(state, { a: 'x' }, steps.change(first));
  state = write(state, { a: 'x', b: 'y' }, steps.change(second));
  state = write(state, { a: 'x', b: 'yy' }, steps.change(second));
  assert.equal(undoDepth(state), 2);
  state = undone(state);
  assert.deepEqual(props(state), { a: 'x' });
});

test('a pick is a step of its own, and so is each pick after it', () => {
  const steps = sheetSteps();
  const field = {};
  let state = start();
  state = write(state, { a: 'x' }, steps.change(field));
  state = write(state, { a: 'x', on: true }, steps.change(null));
  state = write(state, { a: 'x', on: false }, steps.change(null));
  state = write(state, { a: 'xy', on: false }, steps.change(field));
  assert.equal(undoDepth(state), 4);
});

test('leaving the sheet ends the step, and a field typed in again starts a new one', () => {
  const steps = sheetSteps();
  const field = {};
  let state = start();
  state = write(state, { a: 'x' }, steps.change(field));
  steps.end();
  state = write(state, { a: 'xy' }, steps.change(field));
  assert.equal(undoDepth(state), 2);
});

test('the first change after Undo is a new step', () => {
  const steps = sheetSteps();
  const field = {};
  let state = start();
  state = write(state, { a: 'x' }, steps.change(field));
  state = undone(state);
  state = write(state, { a: 'z' }, steps.change(field));
  assert.equal(undoDepth(state), 1);
  state = undone(state);
  assert.deepEqual(props(state), { a: '' });
});

test('the sheet steps never share a group with another sheet', () => {
  const [one, two] = [sheetSteps(), sheetSteps()];
  assert.notEqual(one.change({}).group, two.change({}).group);
});

test('the block keeps its range when it is changed, and follows text typed before it', () => {
  let state = start();
  const range = { from: CARD, to: CARD + 1 };
  const changed = state.tr.setNodeMarkup(CARD, undefined, { props: { a: 'b' } });
  assert.deepEqual(mapRange(range, changed.mapping), range);
  const typed = state.tr.insertText('!', 1);
  assert.deepEqual(mapRange(range, typed.mapping), { from: CARD + 1, to: CARD + 2 });
  const after = state.tr.insert(CARD + 1, schema.node('paragraph'));
  assert.deepEqual(mapRange(range, after.mapping), range);
  state = state.apply(changed);
  assert.deepEqual(props(state), { a: 'b' });
});

test('the block is gone when it is removed, or its insert undone', () => {
  let state = start();
  assert.equal(mapRange({ from: CARD, to: CARD + 1 }, state.tr.delete(CARD, CARD + 1).mapping), null);
  // A new card put in at the end, then the insert undone.
  const end = state.doc.content.size;
  state = state.apply(state.tr.insert(end, schema.node('card', { props: { n: 1 } })));
  let range = { from: end, to: end + 1 };
  let gone = state;
  undo(state, (tr) => {
    range = mapRange(range, tr.mapping);
    gone = state.apply(tr);
  });
  assert.equal(range, null);
  let back = gone;
  redo(gone, (tr) => (back = gone.apply(tr)));
  assert.equal(back.doc.lastChild.attrs.props.n, 1);
});
