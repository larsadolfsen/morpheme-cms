// Tests for src/flowCore.ts (what useFlowEditor in src/FlowEditor.tsx is made of): the flow editor starts from a JSON document and reports
// ProseMirror changes, with no Markdown. The schema is a Heading (level 3), Body medium, Label and one `fieldBlock` atom.
// Milkdown needs a DOM; jsdom stands in. Run: node --test src/flowCore.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
for (const key of [
  'document',
  'Node',
  'Element',
  'HTMLElement',
  'MutationObserver',
  'getComputedStyle',
  'requestAnimationFrame',
  'DOMParser',
  'Event',
  'CustomEvent',
  'KeyboardEvent',
])
  globalThis[key] = dom.window[key];
for (const key of ['addEventListener', 'removeEventListener', 'dispatchEvent']) globalThis[key] = dom.window[key].bind(dom.window);

const { editorViewCtx } = await import('@milkdown/kit/core');
const { $nodeSchema } = await import('@milkdown/kit/utils');
const { TextSelection } = await import('@milkdown/kit/prose/state');
const { startFlow, flowSchema } = await import('./flowCore.ts');
const { cardDeletes, gapHere } = await import('./cardKeys.ts');

const text = (name, tag, level) =>
  $nodeSchema(name, () => ({
    group: 'block',
    content: 'text*',
    marks: '',
    defining: true,
    ...(level ? { attrs: { level: { default: level } } } : {}),
    parseDOM: [{ tag }],
    toDOM: () => [tag === 'h3' ? 'h3' : 'p', { class: name }, 0],
    parseMarkdown: { match: () => false, runner: () => {} },
    toMarkdown: { match: () => false, runner: () => {} },
  }));
const nodes = [
  text('heading', 'h3', 3),
  text('bodyMedium', 'p.body-medium'),
  text('eyebrow', 'p.label-medium'),
  $nodeSchema('fieldBlock', () => ({
    group: 'block',
    atom: true,
    selectable: true,
    attrs: { id: { default: '' } },
    parseDOM: [{ tag: 'div[data-field]' }],
    toDOM: (node) => ['div', { 'data-field': node.attrs.id }],
    parseMarkdown: { match: () => false, runner: () => {} },
    toMarkdown: { match: () => false, runner: () => {} },
  })),
];

const doc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Keep it short' }] },
    { type: 'bodyMedium', content: [{ type: 'text', text: 'Add the price last.' }] },
    { type: 'fieldBlock', attrs: { id: 'title' } },
    { type: 'eyebrow', content: [{ type: 'text', text: 'Publishing' }] },
    { type: 'fieldBlock', attrs: { id: 'tags' } },
  ],
};

// Starts the flow on `doc` and gives the editor once it is loaded, with the changes it was told.
async function started(plugins = () => []) {
  const changes = [];
  const editor = await new Promise((resolve) => {
    startFlow({
      root: document.createElement('div'),
      schema: flowSchema(nodes),
      doc,
      plugins,
      onChange: (view, prev) => changes.push({ now: view.state.doc.toJSON(), prev: prev.toJSON() }),
      onReady: resolve,
    });
  });
  return { editor, changes };
}

test('the flow editor starts from a JSON document and gives the same document back', async () => {
  const { editor, changes } = await started();
  const view = editor.action((ctx) => ctx.get(editorViewCtx));
  assert.deepEqual(JSON.parse(JSON.stringify(view.state.doc.toJSON())), doc);
  assert.deepEqual(changes, [], 'loading the document is not a change');
  await editor.destroy();
});

test('typing in a line is told as a ProseMirror change, with the document it was', async () => {
  const { editor, changes } = await started();
  const view = editor.action((ctx) => ctx.get(editorViewCtx));
  const end = 1 + 'Keep it short'.length;
  view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, end)).insertText('er'));
  assert.equal(changes.length, 1);
  assert.equal(changes[0].now.content[0].content[0].text, 'Keep it shorter');
  assert.equal(changes[0].prev.content[0].content[0].text, 'Keep it short');
  // A selection alone is not a change of the document.
  view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1)));
  assert.equal(changes.length, 1);
  await editor.destroy();
});

test('a node outside the schema is refused, and the schema has no Markdown in it', async () => {
  const { editor } = await started();
  const view = editor.action((ctx) => ctx.get(editorViewCtx));
  const { schema } = view.state;
  assert.deepEqual(Object.keys(schema.nodes).sort(), ['bodyMedium', 'doc', 'eyebrow', 'fieldBlock', 'heading', 'paragraph', 'text']);
  assert.equal(schema.nodes.fieldBlock.isAtom, true);
  assert.equal(Object.keys(schema.marks).length, 0, 'no bold, italic or link');
  assert.throws(() => schema.nodeFromJSON({ type: 'blockquote' }));
  await editor.destroy();
});

test('the card plugins take the name of the field block', async () => {
  const { editor } = await started(() => [cardDeletes(['fieldBlock']), gapHere()]);
  const view = editor.action((ctx) => ctx.get(editorViewCtx));
  // Deleting backward in the Label that follows the first field block reaches that card, by its name: the key is ProseMirror's, so the
  // card is selected and not deleted behind its back.
  let pos = 0;
  view.state.doc.forEach((node, offset, i) => void (i === 3 && (pos = offset + 1)));
  view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, pos)));
  const event = new dom.window.InputEvent('beforeinput', { inputType: 'deleteContentBackward', cancelable: true });
  view.dom.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  await editor.destroy();
});

test('stopping before the editor is created destroys it when it is', async () => {
  let ready = false;
  const stop = startFlow({
    root: document.createElement('div'),
    schema: flowSchema(nodes),
    doc,
    plugins: () => [],
    onReady: () => (ready = true),
  });
  stop();
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(ready, false);
});
