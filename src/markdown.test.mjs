// Tests for src/markdown.mjs: the section colour marker is read into the H1's or H2's `section` attribute and written back as it was
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

// The text loaded and written back, and the nodes it was read as ("heading:surface", "siteBlock", …).
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
  const text = `# Title\n\nIntro\n\n${marked('surface', '## Opening hours\n\nText\n\n')}${marked('primary', '## Prices\n\nMore\n')}`;
  const { saved, nodes } = await through(text);
  assert.equal(saved, text);
  assert.deepEqual(nodes, ['heading', 'paragraph', 'heading:surface', 'paragraph', 'heading:primary', 'paragraph']);
});

test('a coloured H1 comes back byte for byte', async () => {
  const text = marked('surface', '# About\n\nText\n');
  const { saved, nodes } = await through(text);
  assert.equal(saved, text);
  assert.deepEqual(nodes, ['heading:surface', 'paragraph']);
});

test('an H1 with a picture behind it and the whole width comes back byte for byte', async () => {
  const text = '<div data-section="" data-picture="/images/a.jpg" data-alt="A field" data-width="full"></div>\n\n# About\n\nText\n';
  const { saved } = await through(text);
  assert.equal(saved, text);
});

test('the marker comes before a label above the H1', async () => {
  const text = marked('primary', '<p class="block-eyebrow">Welcome</p>\n\n# About\n\nText\n');
  const { saved, nodes } = await through(text);
  assert.equal(saved, text);
  assert.ok(nodes.includes('heading:primary'));
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

test('a marker not followed by an H1 or H2 is dropped', async () => {
  assert.deepEqual(await through(marked('surface', 'Plain text\n\n## B\n')), {
    saved: 'Plain text\n\n## B\n',
    nodes: ['paragraph', 'heading'],
  });
  assert.equal((await through(marked('surface', '### Sub\n'))).saved, '### Sub\n');
});

test('an unknown colour stays the HTML it is', async () => {
  const text = marked('red', '## B\n');
  const { saved, nodes } = await through(text);
  assert.equal(saved, text);
  assert.deepEqual(nodes, ['siteBlock', 'heading']);
});

test('an intro paragraph (Body large) comes back as it was', async () => {
  const text = '# Title\n\n<p class="body-large">Welcome to us</p>\n\nText\n';
  const { saved, nodes } = await through(text);
  assert.equal(saved, text);
  assert.deepEqual(nodes, ['heading', 'bodyLarge', 'paragraph']);
});

test('Body medium and Body small come back as they were', async () => {
  const text = '# Title\n\n<p class="body-medium">Medium</p>\n\n<p class="body-small">Small</p>\n\nText\n';
  const { saved, nodes } = await through(text);
  assert.equal(saved, text);
  assert.deepEqual(nodes, ['heading', 'bodyMedium', 'bodySmall', 'paragraph']);
});

test('a check list comes back as it was', async () => {
  const { saved } = await through('- [ ] Bring a coat\n- [x] Book a table\n');
  assert.match(saved, /\[ \] Bring a coat\n.*\[x\] Book a table/);
  assert.equal((await through(saved)).saved, saved);
});

test('a check list item checked in the editor is saved as checked', async () => {
  const editor = await makeEditor(document.createElement('div'), '- [ ] Bring a coat\n- [ ] Book a table\n').create();
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const item = view.state.doc.firstChild.child(0);
    view.dispatch(view.state.tr.setNodeMarkup(2 - 1, undefined, { ...item.attrs, checked: true }));
  });
  const saved = editor.action(markdownOf);
  await editor.destroy();
  assert.match(saved, /\[x\] Bring a coat\n.*\[ \] Book a table/);
  assert.equal((await through(saved)).saved, saved);
});

test('an empty H1 is not written', async () => {
  assert.equal((await through('# \n\nText\n')).saved, 'Text\n');
});
