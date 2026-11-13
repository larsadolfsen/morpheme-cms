// Tests for src/stillCursor.mjs: the word around the cursor as positions in the document. Run: node --test packages/editor/lib/*.test.mjs packages/editor/src/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from '@milkdown/kit/prose/model';
import { EditorState, TextSelection } from '@milkdown/kit/prose/state';
import { wordRange } from './stillCursor.mjs';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*' },
    text: { group: 'inline' },
    image: { group: 'inline', inline: true },
  },
});
// "How ", an image, " saving works": the text starts at 1, the image is at 5, "saving" is 7–13.
const doc = schema.node('doc', null, [
  schema.node('paragraph', null, [schema.text('How '), schema.node('image'), schema.text(' saving works')]),
]);
const at = (from, to = from) => EditorState.create({ doc, selection: TextSelection.create(doc, from, to) });

test('the word after an image', () => assert.deepEqual(wordRange(at(9)), { from: 7, to: 13 }));
test('the word before an image', () => assert.deepEqual(wordRange(at(2)), { from: 1, to: 4 }));
test('no word next to the image', () => assert.equal(wordRange(at(5)), null));
test('none for a selection', () => assert.equal(wordRange(at(7, 13)), null));
