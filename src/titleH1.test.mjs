// Tests for src/titleH1.mjs: when a page's title and H1 are linked, and the H1 read and written in the editor's document.
// Run: node --test src/titleH1.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from '@milkdown/kit/prose/model';
import { EditorState } from '@milkdown/kit/prose/state';
import { h1FromTitle, h1Of, h1TextOf, h1Written, linked, titleFromH1 } from './titleH1.mjs';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*' },
    heading: { group: 'block', content: 'inline*', attrs: { level: { default: 1 }, id: { default: '' } } },
    text: { group: 'inline' },
    hardbreak: { group: 'inline', inline: true },
  },
  marks: { strong: {}, color: { attrs: { name: {} } } },
});
const text = (s, ...marks) => schema.text(s, marks);
const heading = (level, ...content) => schema.node('heading', { level }, content);
const paragraph = (...content) => schema.node('paragraph', null, content);
const doc = (...blocks) => schema.node('doc', null, blocks);
const write = (d, s) => {
  const state = EditorState.create({ doc: d });
  const tr = h1Written(state, s);
  return tr && tr.doc;
};

test('linked while the same, or while one of them is empty', () => {
  assert.equal(linked('About us', 'About us'), true);
  assert.equal(linked(' About us ', 'About us'), true);
  assert.equal(linked('', 'About us'), true);
  assert.equal(linked('About us', null), true);
  assert.equal(linked('About', 'Who we are'), false);
});

test('the title writes the H1 only while they are linked', () => {
  assert.equal(h1FromTitle('About', 'About', 'About us'), 'About us');
  assert.equal(h1FromTitle('', null, 'A'), 'A');
  assert.equal(h1FromTitle('About', 'Who we are', 'About us'), null);
  // An emptied title leaves the heading, and one that already says so is left.
  assert.equal(h1FromTitle('A', 'A', ''), null);
  assert.equal(h1FromTitle('A', 'AB', 'AB'), null);
});

test('the H1 writes the title only while they are linked', () => {
  assert.equal(titleFromH1('About', 'About', 'About us'), 'About us');
  assert.equal(titleFromH1('', null, 'About'), 'About');
  assert.equal(titleFromH1('About', '', 'B'), 'B');
  assert.equal(titleFromH1('Our story', 'About', 'About us'), null);
  // An emptied or removed H1 leaves the title; the title already the same: nothing (no loop back).
  assert.equal(titleFromH1('About', 'About', ''), null);
  assert.equal(titleFromH1('About', 'About', null), null);
  assert.equal(titleFromH1('About us', 'About', 'About us'), null);
});

test('the H1 is the first top-level heading of level 1', () => {
  assert.equal(h1TextOf(doc(paragraph(text('x')))), null);
  assert.equal(h1TextOf(doc(heading(2, text('Sub')))), null);
  const d = doc(paragraph(text('x')), heading(1, text('Hello '), text('world', schema.marks.strong.create())), heading(1, text('Later')));
  assert.equal(h1TextOf(d), 'Hello world');
  assert.equal(h1Of(d)?.pos, 3);
});

test('a text without an H1 gets one at the top', () => {
  const next = write(doc(paragraph()), 'About us');
  assert.equal(next.firstChild.type.name, 'heading');
  assert.equal(next.firstChild.attrs.level, 1);
  assert.equal(h1TextOf(next), 'About us');
  assert.equal(next.childCount, 2);
});

test('an H1 that says so already is left', () => assert.equal(write(doc(heading(1, text('Same'))), 'Same'), null));

test('only the changed part is replaced, so marks and colours stay', () => {
  const blue = schema.marks.color.create({ name: 'blue' });
  const next = write(doc(heading(1, text('Hello '), text('world', blue))), 'Hello big world');
  assert.equal(h1TextOf(next), 'Hello big world');
  const parts = [];
  next.firstChild.forEach((n) => parts.push([n.text, n.marks.map((m) => m.attrs.name ?? m.type.name).join()]));
  assert.deepEqual(parts, [
    ['Hello big ', ''],
    ['world', 'blue'],
  ]);
  // Typed inside the coloured word, the letters take its colour; removed, the rest keeps it.
  const inside = write(doc(heading(1, text('Hello '), text('world', blue))), 'Hello worlds');
  assert.equal(inside.firstChild.lastChild.text, 'worlds');
  assert.equal(write(doc(heading(1, text('Hello '), text('world', blue))), 'Hello wor').firstChild.lastChild.text, 'wor');
});

test('a heading with more than text gets the text alone', () => {
  const next = write(doc(heading(1, text('A'), schema.node('hardbreak'), text('B'))), 'AB C');
  assert.equal(next.firstChild.childCount, 1);
  assert.equal(h1TextOf(next), 'AB C');
});

test('a character of two halves is not split', () => {
  const next = write(doc(heading(1, text('Hi 😀'))), 'Hi 😁');
  assert.equal(h1TextOf(next), 'Hi 😁');
  next.firstChild.forEach((n) => assert.doesNotMatch(n.text, /^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/));
});
