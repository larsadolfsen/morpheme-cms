// Tests for src/cardKeys.ts: the card keys take the names of the card nodes, so a window whose cards are not `siteBlock` and `image` uses them
// too. Run: node --test src/cardKeys.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from '@milkdown/kit/prose/model';
import { EditorState, NodeSelection, TextSelection } from '@milkdown/kit/prose/state';
import { isCardOf, isGap, nextToCard } from './cardKeys.ts';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    text: { group: 'inline' },
    paragraph: { group: 'block', content: 'text*' },
    fieldBlock: { group: 'block', atom: true, selectable: true },
    siteBlock: { group: 'block', atom: true, selectable: true },
  },
});
const p = (text) => schema.nodes.paragraph.create(null, text ? schema.text(text) : undefined);
const card = (name) => schema.nodes[name].create();
const stateOf = (...nodes) => EditorState.create({ doc: schema.nodes.doc.create(null, nodes), schema });
const at = (state, pos) => state.apply(state.tr.setSelection(TextSelection.create(state.doc, pos)));

test('a card is a node with one of the names it is given', () => {
  const is = isCardOf(['fieldBlock']);
  assert.equal(is(card('fieldBlock')), true);
  assert.equal(is(card('siteBlock')), false);
  assert.equal(is(p('a')), false);
  assert.equal(is(null), false);
  assert.equal(isCardOf(['siteBlock', 'image'])(card('siteBlock')), true);
});

test('a free line is an empty paragraph', () => {
  assert.equal(isGap(p('')), true);
  assert.equal(isGap(p('a')), false);
  assert.equal(isGap(card('fieldBlock')), false);
});

test('deleting back from the start of a line after a card reaches the card, by the names given', () => {
  // [text "ab"][fieldBlock][text "cd"]: the start of "cd" is at 1 + 2 + 1 + 1 = ... computed from the document.
  const state = stateOf(p('ab'), card('fieldBlock'), p('cd'));
  const start = state.doc.child(0).nodeSize + state.doc.child(1).nodeSize + 1;
  const there = at(state, start);
  assert.equal(nextToCard(there, true, ['fieldBlock']), true);
  assert.equal(nextToCard(there, true, ['image']), false, 'another name is not a card');
  assert.equal(nextToCard(there, false, ['fieldBlock']), false, 'forward from the start of the last line reaches nothing');
});

test('deleting forward from the end of a line before a card reaches the card', () => {
  const state = stateOf(p('ab'), card('fieldBlock'), p('cd'));
  const end = 1 + 2;
  assert.equal(nextToCard(at(state, end), false, ['fieldBlock']), true);
  assert.equal(nextToCard(at(state, end), false, ['siteBlock']), false);
  assert.equal(nextToCard(at(state, 2), false, ['fieldBlock']), false, 'in the middle of the text it reaches nothing');
});

test('a selected card is next to itself, by name only', () => {
  const state = stateOf(p('ab'), card('fieldBlock'));
  const pos = state.doc.child(0).nodeSize;
  const selected = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
  assert.equal(nextToCard(selected, true, ['fieldBlock']), true);
  assert.equal(nextToCard(selected, true, ['siteBlock']), false);
});
