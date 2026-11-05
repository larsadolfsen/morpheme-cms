// Tests for src/markdown.mjs: the section colour marker is read into the H2's `section` attribute and written back as it was
// (before the label, if any). Milkdown needs a DOM; jsdom stands in. Run: node --test packages/editor/src/markdown.test.mjs
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
])
  globalThis[key] = dom.window[key];
for (const key of ['addEventListener', 'removeEventListener', 'dispatchEvent']) globalThis[key] = dom.window[key].bind(dom.window);

const { editorViewCtx } = await import('@milkdown/kit/core');
const { makeEditor, markdownOf } = await import('./markdown.mjs');

// The text loaded and written back, and the nodes it was read as ("heading:tint", "siteBlock", …).
async function through(markdown) {
  const editor = await makeEditor(document.createElement('div'), markdown).create();
  const nodes = [];
  editor.action((ctx) =>
    ctx
      .get(editorViewCtx)
      .state.doc.forEach((n) => nodes.push(n.type.name === 'heading' && n.attrs.section ? `heading:${n.attrs.section}` : n.type.name)),
  );
  const saved = editor.action(markdownOf);
  await editor.destroy();
  return { saved, nodes };
}
const marked = (color, rest) => `<div data-section="${color}"></div>\n\n${rest}`;

test('a coloured section comes back byte for byte', async () => {
  const text = `# Title\n\nIntro\n\n${marked('tint', '## Opening hours\n\nText\n\n')}${marked('accent', '## Prices\n\nMore\n')}`;
  const { saved, nodes } = await through(text);
  assert.equal(saved, text);
  assert.deepEqual(nodes, ['heading', 'paragraph', 'heading:tint', 'paragraph', 'heading:accent', 'paragraph']);
});

test('a text without markers is written as before', async () => {
  const text = '# Title\n\n## One\n\nText\n';
  assert.equal((await through(text)).saved, text);
});

test('the marker comes before a label above the H2', async () => {
  const text = marked('surface', '<p class="block-eyebrow">Step by step</p>\n\n## Hours\n\nText\n');
  const { saved, nodes } = await through(text);
  assert.equal(saved, text);
  assert.ok(nodes.includes('heading:surface'));
});

test('a marker not followed by an H2 is dropped', async () => {
  assert.deepEqual(await through(marked('tint', 'Plain text\n\n## B\n')), {
    saved: 'Plain text\n\n## B\n',
    nodes: ['paragraph', 'heading'],
  });
  assert.equal((await through(marked('tint', '### Sub\n'))).saved, '### Sub\n');
});

test('an unknown colour stays the HTML it is', async () => {
  const text = marked('red', '## B\n');
  const { saved, nodes } = await through(text);
  assert.equal(saved, text);
  assert.deepEqual(nodes, ['siteBlock', 'heading']);
});
