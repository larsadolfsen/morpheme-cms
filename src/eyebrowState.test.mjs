// Tests for src/eyebrowState.mjs: where the labels are in the document, and the keys in a label. Run: node --test packages/editor/lib/*.test.mjs packages/editor/src/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from '@milkdown/kit/prose/model';
import { EditorState, TextSelection } from '@milkdown/kit/prose/state';
import { canLabel, enterInLabel, hasLabel, labelledHeading, toggleLabel } from './eyebrowState.mjs';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'text*' },
    blockquote: { group: 'block', content: 'block+' },
    bodyLarge: { group: 'block', content: 'text*' },
    heading: { group: 'block', content: 'text*', attrs: { level: { default: 2 } } },
    eyebrow: { group: 'block', content: 'text*' },
    siteBlock: { group: 'block', atom: true },
    text: {},
  },
});
const node = (type, text, attrs) => schema.node(type, attrs, text ? [schema.text(text)] : []);
// A label (0–7), its heading (7–14) and a paragraph (14–17).
const labelled = () => schema.node('doc', null, [node('eyebrow', 'Label'), node('heading', 'Title'), node('paragraph', 'x')]);
const stateAt = (doc, pos) => EditorState.create({ doc, selection: TextSelection.create(doc, pos) });

test('Enter in a label goes to the start of its heading', () => {
  let next;
  assert.equal(
    enterInLabel(stateAt(labelled(), 3), (tr) => (next = tr)),
    true,
  );
  assert.equal(next.selection.from, 8);
  assert.equal(next.doc.childCount, 3);
});
test('Enter in a label with no heading after it adds a line below', () => {
  const doc = schema.node('doc', null, [node('paragraph', 'x'), node('eyebrow', 'End')]);
  let next;
  assert.equal(
    enterInLabel(stateAt(doc, 5), (tr) => (next = tr)),
    true,
  );
  assert.equal(next.doc.childCount, 3);
  assert.equal(next.doc.child(2).type.name, 'paragraph');
  assert.equal(next.selection.from, 9);
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
test('takes the label away from the heading', () => {
  const view = viewOf(stateAt(labelled(), 9));
  toggleLabel(view);
  assert.equal(view.state.doc.child(0).type.name, 'heading');
  assert.equal(view.state.doc.childCount, 2);
});
test('a label picked again is a plain line again, with its text', () => {
  const view = viewOf(stateAt(labelled(), 3));
  toggleLabel(view);
  assert.equal(view.state.doc.child(0).type.name, 'paragraph');
  assert.equal(view.state.doc.child(0).textContent, 'Label');
  assert.equal(view.state.doc.childCount, 3);
  assert.equal(view.state.selection.from, 3);
});
test('a plain line becomes a label with its text, on any line', () => {
  for (const type of ['paragraph', 'bodyLarge']) {
    const doc = schema.node('doc', null, [node('heading', 'Title'), node(type, 'Hello')]);
    const view = viewOf(stateAt(doc, 10));
    toggleLabel(view);
    assert.equal(view.state.doc.child(1).type.name, 'eyebrow');
    assert.equal(view.state.doc.child(1).textContent, 'Hello');
    assert.equal(view.state.selection.from, 10);
  }
});
test('an empty last line becomes an empty label', () => {
  const doc = schema.node('doc', null, [node('paragraph', 'x'), node('paragraph', '')]);
  const view = viewOf(stateAt(doc, 4));
  toggleLabel(view);
  assert.equal(view.state.doc.child(1).type.name, 'eyebrow');
  assert.equal(view.state.selection.from, 4);
});
test('Label applies at the top of the text only', () => {
  assert.equal(canLabel(stateAt(labelled(), 15)), true);
  const nested = schema.node('doc', null, [schema.node('blockquote', null, [node('paragraph', 'q')])]);
  assert.equal(canLabel(stateAt(nested, 3)), false);
});
