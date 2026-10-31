// The Milkdown setup shared by the editor (/editor/) and packages/editor/scripts/editor-roundtrip.mjs, so the check
// runs the same Markdown parser and writer as the browser.
import { Editor, editorViewCtx, rootCtx, defaultValueCtx, remarkStringifyOptionsCtx, serializerCtx } from '@milkdown/kit/core';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { $markSchema, $nodeSchema, $prose, $remark } from '@milkdown/kit/utils';
import { Plugin } from '@milkdown/kit/prose/state';
import { blockHtml, parseBlock } from '../lib/blocks.mjs';
import { COLOR_CLOSE, TEXT_COLORS, colorClass, colorOpen, colorOpened } from '../lib/text-colors.mjs';

// Write Markdown the way imported files are written: "-   " bullets and
// "* * *" rules, so a save changes as few lines as possible.
const stringify = { bullet: '-', listItemIndent: 'tab', rule: '*', ruleSpaces: true };

// The site's blocks in the text (packages/editor/lib/blocks.mjs), read from and written back as their line of HTML.
// Milkdown puts HTML at the top of the text in a paragraph; a paragraph that is only a block becomes
// a siteBlock node (with its type and props) before the text is read. Any type is read: the sections
// of the fixed pages are blocks too (sections.mjs); the site shows only its own (RichText.astro).
// Other HTML on a line of its own (YouTube, Vimeo, Calendly, an imported table) is a block too, of the
// type HTML, with the HTML as it is as its `code`, and written back as it was.
export const HTML = 'html';
const remarkSiteBlocks = $remark('remarkSiteBlocks', () => () => (tree) => {
  tree.children = tree.children.map((child) => {
    const only = child.type === 'paragraph' && child.children?.length === 1 ? child.children[0] : child;
    if (only.type !== 'html') return child;
    const block = parseBlock(String(only.value), null);
    return block
      ? { type: 'siteBlock', blockType: block.type, props: block.props }
      : { type: 'siteBlock', blockType: HTML, props: { code: String(only.value) } };
  });
});

// One node per block, with its type and its props. How it looks in the editor: MarkdownEditor.tsx.
/** @type {import('@milkdown/kit/utils').$NodeSchema<'siteBlock'>} */
export const siteBlockSchema = $nodeSchema('siteBlock', () => ({
  group: 'block',
  atom: true,
  selectable: true,
  attrs: { type: { default: '' }, props: { default: {} } },
  parseDOM: [{ tag: 'div[data-site-block]', getAttrs: (dom) => parseBlock(dom.dataset.siteBlock ?? '', null) ?? false }],
  toDOM: (node) => ['div', { 'data-site-block': blockHtml(node.attrs.type, node.attrs.props) }],
  parseMarkdown: {
    match: (node) => node.type === 'siteBlock',
    runner: (state, node, type) => {
      state.addNode(type, { type: node.blockType, props: node.props });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'siteBlock',
    runner: (state, node) => {
      const { type, props } = node.attrs;
      state.addNode('html', undefined, type === HTML ? String(props.code ?? '') : blockHtml(type, props));
    },
  },
}));

// A word or more in one of the site's colours (packages/editor/lib/text-colors.mjs): in the Markdown the HTML around
// it, <span class="color-accent">…</span>, which Milkdown would read as two pieces of HTML with the text between them;
// read as the text with the colour (a mark), and written back as the same HTML. A piece of HTML without its end, or
// another span, stays HTML.
function colorRuns(children) {
  const out = [];
  for (let i = 0; i < children.length; i++) {
    const color = children[i].type === 'html' ? colorOpened(children[i].value) : null;
    let end = -1;
    for (let j = i + 1, depth = 0; color && j < children.length && end < 0; j++) {
      const node = children[j];
      if (node.type !== 'html') continue;
      if (/^<span\b/.test(node.value)) depth++;
      else if (node.value === COLOR_CLOSE && depth-- === 0) end = j;
    }
    if (end < 0) out.push(children[i]);
    else {
      out.push({ type: 'textColor', color, children: children.slice(i + 1, end) });
      i = end;
    }
  }
  return out;
}

function textColorMarkdown(node, _, state, info) {
  const tracker = state.createTracker(info);
  let value = tracker.move(colorOpen(node.color));
  value += tracker.move(state.containerPhrasing(node, { ...tracker.current(), before: '>', after: '<' }));
  return value + tracker.move(COLOR_CLOSE);
}
textColorMarkdown.peek = () => '<';

const remarkTextColors = $remark(
  'remarkTextColors',
  () =>
    function () {
      const data = this.data();
      (data.toMarkdownExtensions ??= []).push({ handlers: { textColor: textColorMarkdown } });
      const walk = (node) => {
        if (!node.children) return;
        node.children = colorRuns(node.children);
        node.children.forEach(walk);
      };
      return walk;
    },
);

/** @type {import('@milkdown/kit/utils').$MarkSchema<'textColor'>} */
export const textColorSchema = $markSchema('textColor', () => ({
  attrs: { color: { default: TEXT_COLORS[0] } },
  parseDOM: TEXT_COLORS.map((color) => ({ tag: `span.${colorClass(color)}`, attrs: { color } })),
  toDOM: (mark) => ['span', { class: colorClass(mark.attrs.color) }],
  parseMarkdown: {
    match: (node) => node.type === 'textColor',
    runner: (state, node, markType) => {
      state.openMark(markType, { color: node.color });
      state.next(node.children);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === 'textColor',
    runner: (state, mark) => {
      state.withMark(mark, 'textColor', undefined, { color: mark.attrs.color });
    },
  },
}));

/** A Milkdown editor of the text, in root (not created yet). @param {HTMLElement | null} root @param {string} markdown
 * @returns {import('@milkdown/kit/core').Editor} */
export function makeEditor(root, markdown) {
  return Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root);
      ctx.set(defaultValueCtx, markdown);
      ctx.update(remarkStringifyOptionsCtx, (options) => ({ ...options, ...stringify }));
    })
    .use(commonmark)
    .use(gfm)
    .use(remarkSiteBlocks)
    .use(siteBlockSchema)
    .use(remarkTextColors)
    .use(textColorSchema);
}

// The text in parts, for a fixed page's sections (sections.mjs): each block, each heading at the top
// level ("Overskrift", H2), and the Markdown of the text between them. Empty paragraphs (the lines
// kept free between two blocks to write in), empty headings (left when one is deleted) and the page's H1
// (no section's) are left out.
export function partsOf(ctx) {
  const doc = ctx.get(editorViewCtx).state.doc;
  const serialize = ctx.get(serializerCtx);
  const parts = [];
  let run = [];
  const flush = () => {
    const markdown = run.length ? serialize(doc.type.create(null, run)).trim() : '';
    if (markdown) parts.push({ markdown });
    run = [];
  };
  doc.forEach((node) => {
    // HTML in a section's text stays in its text.
    if (node.type.name === 'siteBlock' && node.attrs.type !== HTML) {
      flush();
      parts.push({ block: { type: node.attrs.type, props: node.attrs.props } });
    } else if (node.type.name === 'heading' && node.attrs.level === 2) {
      flush();
      parts.push({ heading: node.textContent.trim() });
    } else if (node.type.name === 'heading' && node.attrs.level === 1) {
      flush();
    } else if (!((node.type.name === 'paragraph' || node.type.name === 'heading') && !node.textContent.trim() && !node.childCount))
      run.push(node);
  });
  flush();
  return parts;
}

// Keeps a free line (an empty paragraph) between two blocks and before and after them, so there is
// always a place to write a text between them. Not part of undo. Used by the editor (MarkdownEditor.tsx)
// and the check, which writes the text back with the free lines in it.
/** @type {import('@milkdown/kit/utils').$Prose} */
export const spacing = $prose(
  () =>
    new Plugin({
      appendTransaction: (_, __, state) => {
        const gaps = [];
        let before = null;
        state.doc.forEach((node, at) => {
          if (node.type.name === 'siteBlock' && (!before || before.type.name === 'siteBlock')) gaps.push(at);
          before = node;
        });
        if (state.doc.lastChild?.type.name === 'siteBlock') gaps.push(state.doc.content.size);
        if (!gaps.length) return null;
        const tr = state.tr;
        for (const at of gaps.reverse()) tr.insert(at, state.schema.nodes.paragraph.create());
        return tr.setMeta('addToHistory', false);
      },
    }),
);

// The Markdown of the text, without its empty paragraphs (the free lines between the blocks).
export function markdownOf(ctx) {
  const doc = ctx.get(editorViewCtx).state.doc;
  const kept = [];
  doc.forEach((node) => {
    if (!(node.type.name === 'paragraph' && node.content.size === 0)) kept.push(node);
  });
  return ctx.get(serializerCtx)(doc.type.create(null, kept));
}
