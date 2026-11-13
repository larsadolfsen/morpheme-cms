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
const { makeEditor, markdownOf, insertBlock, leaveListAtStart } = await import('./markdown.mjs');
const { TextSelection } = await import('@milkdown/kit/prose/state');

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

test('an H1 with an image behind it and the whole width comes back byte for byte', async () => {
  const text = '<div data-section="" data-picture="/images/a.jpg" data-alt="A field" data-width="full"></div>\n\n# About\n\nText\n';
  const { saved } = await through(text);
  assert.equal(saved, text);
});

test('the marker comes before a label above the H1', async () => {
  const text = marked('primary', '<p class="label-medium">Welcome</p>\n\n# About\n\nText\n');
  const { saved, nodes } = await through(text);
  assert.equal(saved, text);
  assert.ok(nodes.includes('heading:primary'));
});

test('a label before a block stays a label and comes back byte for byte', async () => {
  const text =
    '<p class="label-medium">How it works</p>\n\n<div data-block="steps" data-props="{&quot;heading&quot;:&quot;Three steps&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;One&quot;}]}"></div>\n';
  const { saved, nodes } = await through(text);
  assert.equal(saved, text);
  assert.ok(nodes.includes('eyebrow'));
});

test('a block with a label of its own is read as a label line before the block, and written so', async () => {
  const old =
    '<div data-block="steps" data-props="{&quot;eyebrow&quot;:&quot;How it works&quot;,&quot;heading&quot;:&quot;Three steps&quot;}"></div>\n';
  const { saved, nodes } = await through(old);
  assert.equal(
    saved,
    '<p class="label-medium">How it works</p>\n\n<div data-block="steps" data-props="{&quot;heading&quot;:&quot;Three steps&quot;}"></div>\n',
  );
  assert.ok(nodes.includes('eyebrow'));
});

test('a text without markers is written as before', async () => {
  const text = '# Title\n\n## One\n\nText\n';
  assert.equal((await through(text)).saved, text);
});

test('the marker comes before a label above the H2', async () => {
  const text = marked('surface', '<p class="label-medium">Step by step</p>\n\n## Hours\n\nText\n');
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

test('Body medium and Body small paragraphs come back as they were', async () => {
  const text = '# Title\n\n<p class="body-medium">Quiet text</p>\n\n<p class="body-small">Opening hours may change</p>\n\nText\n';
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

test('an aligned paragraph, body style and small heading come back as they were, with their alignment', async () => {
  const text =
    '# Title\n\n<div data-align="center"></div>\n\nCentred **bold** text\n\n<div data-align="right"></div>\n\n<p class="body-small">Right small</p>\n\n' +
    '<div data-align="center"></div>\n\n### Centred heading\n\nPlain\n';
  const { saved } = await through(text);
  assert.equal(saved, text);
});

test('the alignment is an attribute of the block and left takes it away', async () => {
  const editor = await makeEditor(document.createElement('div'), '<div data-align="center"></div>\n\nHello\n\nOther\n').create();
  const aligns = editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const first = view.state.doc.child(0);
    const before = first.attrs.align;
    view.dispatch(view.state.tr.setNodeMarkup(0, undefined, { ...first.attrs, align: null }));
    return [before, view.state.doc.child(0).attrs.align];
  });
  const saved = editor.action(markdownOf);
  await editor.destroy();
  assert.deepEqual(aligns, ['center', null]);
  assert.equal(saved, 'Hello\n\nOther\n');
});

test('an alignment line before an H1, a list or nothing is kept as HTML, not lost', async () => {
  const text = '<div data-align="center"></div>\n\n# Title\n\n<div data-align="right"></div>\n\n- one\n- two\n';
  const { saved } = await through(text);
  assert.equal((saved.match(/data-align/g) ?? []).length, 2);
});

// --- Blocks next to lists, and leaving a list (a block is always at the top level of the page) ---
const BLOCK = '<div data-block="notice" data-props="{&quot;text&quot;:&quot;x&quot;}"></div>';

// The text, the cursor at the end of the paragraph with `at`, then `act(view, ctx)`; the nodes at the top and the saved text.
async function edit(markdown, at, act) {
  const editor = await makeEditor(document.createElement('div'), markdown).create();
  const out = editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    let pos = -1;
    view.state.doc.descendants((n, p) => {
      if (pos < 0 && n.isTextblock && n.textContent === at) pos = p + 1 + (act.start ? 0 : n.content.size);
    });
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, pos)));
    act.run(view, ctx);
    const nodes = [];
    view.state.doc.forEach((n) => nodes.push(n.type.name));
    return { nodes, saved: markdownOf(ctx) };
  });
  await editor.destroy();
  return out;
}
const put = (view, ctx) => {
  const node = view.state.schema.nodes.siteBlock.create({ type: 'notice', props: { text: 'x' } });
  view.dispatch(insertBlock(view.state, node).tr);
};

test('a list followed by a block, a block between lists and a block after nested items stay at the top level', async () => {
  for (const text of [
    `- a\n- b\n\n${BLOCK}\n\nafter\n`,
    `1. a\n2. b\n\n${BLOCK}\n\n- c\n`,
    `- a\n  - b\n\n${BLOCK}\n`,
    `${BLOCK}\n\n- a\n- b\n\n${BLOCK}\n`,
  ]) {
    const { saved } = await through(text);
    assert.equal(
      saved.replace(/^( *)(-|\d\.) +/gm, (m, i, b) => `${' '.repeat(i.length ? 2 : 0)}${b} `),
      text,
    );
    assert.ok(!/^[ \t]+<div data-block/m.test(saved), saved);
  }
});

test('a block written inside a list item (an older save) is read as a block of the page', async () => {
  const { saved, nodes } = await through(`- a\n- b\n\n  ${BLOCK}\n\n- c\n`);
  assert.deepEqual(nodes, ['bullet_list', 'siteBlock', 'bullet_list']);
  assert.ok(!/^[ \t]+<div data-block/m.test(saved), saved);
  const lone = await through(`- a\n\n  ${BLOCK}\n`);
  assert.deepEqual(lone.nodes, ['bullet_list', 'siteBlock']);
});

test('a block inserted in a list item ends the list there; the rest of the list follows the block', async () => {
  const mid = await edit('- a\n- b\n- c\n', 'b', { run: put });
  assert.deepEqual(mid.nodes, ['bullet_list', 'siteBlock', 'bullet_list']);
  assert.ok(!/^[ \t]+<div data-block/m.test(mid.saved), mid.saved);
  assert.match(mid.saved, /^-\s+a\n-\s+b\n\n<div data-block="notice"[^\n]*><\/div>\n\n-\s+c\n$/);
  const last = await edit('1. a\n2. b\n', 'b', { run: put });
  assert.deepEqual(last.nodes, ['ordered_list', 'siteBlock']);
  const nested = await edit('- a\n  - b\n  - c\n- d\n', 'b', { run: put });
  assert.ok(nested.nodes.includes('siteBlock'));
  assert.ok(!/^[ \t]+<div data-block/m.test(nested.saved), nested.saved);
  const quote = await edit('> a\n\nrest\n', 'a', { run: put });
  assert.deepEqual(quote.nodes.slice(0, 2), ['blockquote', 'siteBlock']);
  const plain = await edit('one two\n', 'one two', { run: put });
  assert.ok(plain.nodes.includes('siteBlock'));
});

test('Backspace at the start of a list item leaves the list one step', async () => {
  const run = (view) => leaveListAtStart(view.state, view.dispatch);
  const first = await edit('# T\n\n- a\n- b\n', 'a', { start: true, run });
  assert.deepEqual(first.nodes, ['heading', 'paragraph', 'bullet_list']);
  const nested = await edit('- a\n  - b\n', 'b', { start: true, run });
  assert.deepEqual(nested.nodes, ['bullet_list']);
  assert.match(nested.saved, /^-\s+a\n-\s+b\n$/);
  const text = await edit('- a\n', 'a', { run });
  assert.deepEqual(text.nodes, ['bullet_list']);
});

// --- A size for the text of list items (lib/text-sizes.mjs): the list stays a list ---
test('a list item with a size comes back as it was, and the list and the item stay', async () => {
  for (const text of [
    '-   <span class="body-small">small</span>\n-   plain\n',
    '1.  <span class="body-large">large <strong>bold</strong></span>\n2.  plain\n',
    '-   [ ] <span class="body-small">box</span>\n-   [x] done\n',
    '-   <span class="color-accent"><span class="body-small">both</span></span>\n',
  ]) {
    const { saved, nodes } = await through(text);
    assert.equal(saved, text);
    assert.ok(nodes[0].endsWith('_list'), nodes.join());
  }
});

test('a size around a colour is written with the colour around the size', async () => {
  const { saved } = await through('-   <span class="body-small"><span class="color-accent">both</span></span>\n');
  assert.equal(saved, '-   <span class="color-accent"><span class="body-small">both</span></span>\n');
});

test('a size chosen in a list sizes the touched items and keeps the list; medium takes it away', async () => {
  const { sizeListText } = await import('./listSize.mjs');
  const editor = await makeEditor(document.createElement('div'), '- a\n- b\n  - c\n- d\n').create();
  const out = editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const at = (text) => {
      let pos = -1;
      view.state.doc.descendants((n, p) => {
        if (pos < 0 && n.isTextblock && n.textContent === text) pos = p + 1;
      });
      return pos;
    };
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, at('a') + 1)));
    sizeListText(view, 'small');
    const one = markdownOf(ctx);
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, at('a') + 1, at('d') + 1)));
    sizeListText(view, 'large');
    const many = markdownOf(ctx);
    sizeListText(view, 'medium');
    return { one, many, none: markdownOf(ctx), kinds: view.state.doc.child(0).type.name };
  });
  await editor.destroy();
  assert.match(out.one, /^-\s+<span class="body-small">a<\/span>\n-\s+b\n/);
  assert.match(out.many, /<span class="body-large">a<\/span>/);
  assert.match(out.many, /<span class="body-large">b<\/span>/);
  assert.match(out.many, /<span class="body-large">c<\/span>/);
  assert.match(out.many, /<span class="body-large">d<\/span>/);
  assert.ok(!out.none.includes('<span'), out.none);
  assert.equal(out.kinds, 'bullet_list');
});
