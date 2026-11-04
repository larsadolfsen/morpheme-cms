// Tests for src/eyebrowState.mjs: where the labels are in the document, and the keys in a label. Run: node --test packages/editor/lib/*.test.mjs packages/editor/src/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from '@milkdown/kit/prose/model';
import { EditorState, TextSelection } from '@milkdown/kit/prose/state';
import { enterInLabel, hasLabel, labelledHeading, looseLabels, toggleLabel } from './eyebrowState.mjs';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'text*' },
    heading: { group: 'block', content: 'text*', attrs: { level: { default: 2 } } },
    eyebrow: { group: 'block', content: 'text*' },
    text: {},
  },
});
const node = (type, text, attrs) => schema.node(type, attrs, text ? [schema.text(text)] : []);
// A label (0–7), its heading (7–14) and a paragraph (14–17).
const labelled = () => schema.node('doc', null, [node('eyebrow', 'Label'), node('heading', 'Title'), node('paragraph', 'x')]);
const stateAt = (doc, pos) => EditorState.create({ doc, selection: TextSelection.create(doc, pos) });

test('a label before its heading is not loose', () => assert.deepEqual(looseLabels(labelled()), []));
test('a label without a heading after it is loose', () => {
  const doc = schema.node('doc', null, [node('eyebrow', 'Label'), node('paragraph', 'x'), node('eyebrow', 'End')]);
  assert.deepEqual(looseLabels(doc), [0, 10]);
});
test('Enter in a label goes to the start of its heading', () => {
  let next;
  assert.equal(
    enterInLabel(stateAt(labelled(), 3), (tr) => (next = tr)),
    true,
  );
  assert.equal(next.selection.from, 8);
  assert.equal(next.doc.childCount, 3);
});
test('Enter elsewhere is not the label’s', () =>
  assert.equal(
    enterInLabel(stateAt(labelled(), 9), () => {}),
    false,
  ));

// A view as the menu uses it: its state, and dispatch.
const viewOf = (state) => ({
  state,
  dispatch(tr) {
    this.state = this.state.apply(tr);
  },
});
const plain = () => schema.node('doc', null, [node('heading', 'Title', { level: 3 }), node('paragraph', 'x')]);

test('the heading the cursor is in', () => assert.deepEqual(labelledHeading(stateAt(labelled(), 9)), { pos: 7, level: 2 }));
test('the heading after the label the cursor is in', () => assert.deepEqual(labelledHeading(stateAt(labelled(), 3)), { pos: 7, level: 2 }));
test('no heading in a paragraph', () => assert.equal(labelledHeading(stateAt(labelled(), 15)), null));
test('whether it has a label', () => {
  assert.equal(hasLabel(stateAt(labelled(), 9)), true);
  assert.equal(hasLabel(stateAt(plain(), 2)), false);
});
test('adds an empty label with the cursor in it', () => {
  const view = viewOf(stateAt(plain(), 2));
  toggleLabel(view);
  assert.equal(view.state.doc.child(0).type.name, 'eyebrow');
  assert.equal(view.state.doc.child(0).content.size, 0);
  assert.equal(view.state.doc.child(1).textContent, 'Title');
  assert.equal(view.state.selection.from, 1);
});
test('takes the label away, from the heading or from the label', () => {
  for (const pos of [9, 3]) {
    const view = viewOf(stateAt(labelled(), pos));
    toggleLabel(view);
    assert.equal(view.state.doc.child(0).type.name, 'heading');
    assert.equal(view.state.doc.childCount, 2);
  }
});
test('does nothing in a paragraph', () => {
  const view = viewOf(stateAt(labelled(), 15));
  toggleLabel(view);
  assert.equal(view.state.doc.childCount, 3);
});
