// Tests for src/sectionState.mjs: the H1 or H2 the cursor is in, setting its section colour, and the colour of a section.
// Run: node --test packages/editor/src/sectionState.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from '@milkdown/kit/prose/model';
import { EditorState, TextSelection } from '@milkdown/kit/prose/state';
import { sectionColorOf, sectionHeading, setSectionColor } from './sectionState.mjs';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'text*' },
    heading: { group: 'block', content: 'text*', attrs: { level: { default: 2 }, section: { default: null } } },
    eyebrow: { group: 'block', content: 'text*' },
    text: {},
  },
});
const node = (type, text, attrs) => schema.node(type, attrs, text ? [schema.text(text)] : []);
// An H2 "Hours" (0-7, coloured tint), a paragraph (7-10), an H3 (10-15), an H1 "Top" (15-20, coloured tint).
const doc = schema.node('doc', null, [
  node('heading', 'Hours', { level: 2, section: 'tint' }),
  node('paragraph', 'x'),
  node('heading', 'Sub', { level: 3 }),
  node('heading', 'Top', { level: 1, section: 'tint' }),
]);
const viewAt = (pos) => ({
  state: EditorState.create({ doc, selection: TextSelection.create(doc, pos) }),
  dispatch(tr) {
    this.state = this.state.apply(tr);
  },
});

test('the H2 the cursor is in', () => assert.deepEqual(sectionHeading(viewAt(3).state), { pos: 0, color: 'tint' }));
test('none in a paragraph or an H3', () => {
  assert.equal(sectionHeading(viewAt(8).state), null);
  assert.equal(sectionHeading(viewAt(12).state), null);
});
test('sets another colour', () => {
  const view = viewAt(3);
  assert.equal(setSectionColor(view, 'accent'), true);
  assert.equal(view.state.doc.child(0).attrs.section, 'accent');
  assert.equal(view.state.doc.child(0).attrs.level, 2);
});
test('null takes the colour away', () => {
  const view = viewAt(3);
  setSectionColor(view, null);
  assert.equal(view.state.doc.child(0).attrs.section, null);
});
test('a colour the theme has not is refused, and nothing happens outside an H2', () => {
  const view = viewAt(3);
  assert.equal(setSectionColor(view, 'red'), false);
  assert.equal(view.state.doc.child(0).attrs.section, 'tint');
  assert.equal(setSectionColor(viewAt(8), 'tint'), false);
});
test('the H1 the cursor is in', () => assert.deepEqual(sectionHeading(viewAt(17).state), { pos: 15, color: 'tint' }));
test('sets a colour on an H1', () => {
  const view = viewAt(17);
  assert.equal(setSectionColor(view, 'accent'), true);
  assert.equal(view.state.doc.child(3).attrs.section, 'accent');
  assert.equal(view.state.doc.child(3).attrs.level, 1);
});
test('the colour of a section is its H1’s', () => {
  const kids = [node('heading', 'Top', { level: 1, section: 'accent' }), node('paragraph', 'x')];
  assert.equal(sectionColorOf(kids, { from: 0, to: 1 }), 'accent');
});
test('the colour of a section is its H2’s, also after a label', () => {
  const kids = [node('eyebrow', 'Label'), node('heading', 'Hours', { level: 2, section: 'surface' }), node('paragraph', 'x')];
  assert.equal(sectionColorOf(kids, { from: 0, to: 2 }), 'surface');
  assert.equal(sectionColorOf(kids, { from: 1, to: 2 }), 'surface');
  assert.equal(sectionColorOf([node('heading', 'A', { level: 2 })], { from: 0, to: 0 }), null);
});
