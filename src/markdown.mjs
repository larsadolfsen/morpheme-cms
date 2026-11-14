// The Milkdown setup shared by the editor (/editor/) and packages/editor/scripts/editor-roundtrip.mjs, so the check
// runs the same Markdown parser and writer as the browser.
import { Editor, editorViewCtx, rootCtx, defaultValueCtx, remarkStringifyOptionsCtx, serializerCtx } from '@milkdown/kit/core';
import { commonmark, headingSchema, paragraphSchema, strongAttr } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { $markSchema, $nodeSchema, $prose, $remark, $useKeymap } from '@milkdown/kit/utils';
import { NodeSelection, Plugin, TextSelection } from '@milkdown/kit/prose/state';
import { canSplit } from '@milkdown/kit/prose/transform';
import { liftListItem } from '@milkdown/kit/prose/schema-list';
import { blockHtml, parseBlock } from '../lib/blocks.mjs';
import { COLOR_CLOSE, TEXT_COLORS, colorClass, colorOpen, colorOpened } from '../lib/text-colors.mjs';
import { SIZE_CLOSE, TEXT_SIZES, sizeClass, sizeOpen, sizeOpened } from '../lib/text-sizes.mjs';
import { isLabelLine, markerHtml, parseMarker } from '../lib/section-marker.mjs';
import { EMPHASIZE } from '../lib/rehype-emphasize.mjs';
import { eyebrowText } from '../lib/eyebrow.mjs';
import { bodyLargeText } from '../lib/body-large.mjs';
import { bodySizeText } from '../lib/body-size.mjs';
import { alignClass, alignHtml, alignOf } from '../lib/text-align.mjs';
import { remarkBannerSections } from '../lib/remark-banner-section.mjs';
import { remarkChecklists } from '../lib/remark-checklist.mjs';
import { remarkListHeads } from '../lib/remark-list-head.mjs';
import { remarkBlockLabels } from '../lib/remark-block-label.mjs';
import { topOf } from './sections.mjs';
import { bodyLargeSchema } from './bodyLarge.mjs';
import { bodyMediumSchema, bodySmallSchema } from './bodySize.mjs';
import { eyebrowKeeper, eyebrowKeymap, eyebrowSchema } from './eyebrow.mjs';

// Write Markdown the way imported files are written: "-   " bullets and
// "* * *" rules, so a save changes as few lines as possible.
const stringify = { bullet: '-', listItemIndent: 'tab', rule: '*', ruleSpaces: true };

// The site's blocks in the text (packages/editor/lib/blocks.mjs), read from and written back as their line of HTML.
// Milkdown puts HTML at the top of the text in a paragraph; a paragraph that is only a block becomes
// a siteBlock node (with its type and props) before the text is read. Any type is read: the sections
// of the fixed pages are blocks too (sections.mjs); the site shows only its own (RichText.astro).
// Other HTML on a line of its own (YouTube, Vimeo, Calendly, an imported table) is a block too, of the
// type HTML, with the HTML as it is as its `code`, and written back as it was.
// A label above a heading is read here too (eyebrow.mjs).
export const HTML = 'html';
const remarkSiteBlocks = $remark('remarkSiteBlocks', () => () => (tree) => {
  tree.children = tree.children.map((child, i) => {
    const only = child.type === 'paragraph' && child.children?.length === 1 ? child.children[0] : child;
    if (only.type !== 'html') return child;
    // A label right before a heading or a block (lib/eyebrow.mjs) is the node eyebrow (eyebrow.mjs), not a block.
    const next = tree.children[i + 1];
    const nextHtml = next?.type === 'paragraph' && next.children?.length === 1 ? next.children[0] : next;
    const before = next?.type === 'heading' || (nextHtml?.type === 'html' && parseBlock(String(nextHtml.value), null) !== null);
    const label = before ? eyebrowText(String(only.value)) : null;
    if (label !== null) return { type: 'eyebrow', value: label };
    // An intro paragraph (lib/body-large.mjs) is the node bodyLarge.
    const large = bodyLargeText(String(only.value));
    if (large !== null) return { type: 'bodyLarge', value: large, align: child.align ?? null };
    // A paragraph in Body medium or Body small (lib/body-size.mjs) is the node bodyMedium or bodySmall.
    const sized = bodySizeText(String(only.value));
    if (sized !== null) return { type: sized.size === 'small' ? 'bodySmall' : 'bodyMedium', value: sized.text, align: child.align ?? null };
    const block = parseBlock(String(only.value), null);
    return block
      ? { type: 'siteBlock', blockType: block.type, props: block.props }
      : { type: 'siteBlock', blockType: HTML, props: { code: String(only.value) } };
  });
});

// A block written inside a list item (indented, as an older save of a block put in a list item wrote it) is a block of the page, not a
// part of the list: the list ends before it and what is left of the list follows it, so the block is drawn and written at the top level.
const remarkBlocksOutOfLists = $remark('remarkBlocksOutOfLists', () => () => (tree) => {
  const isBlock = (n) => {
    const only = n.type === 'paragraph' && n.children?.length === 1 ? n.children[0] : n;
    return only.type === 'html' && parseBlock(String(only.value), null) !== null;
  };
  const split = (list) => {
    const out = [];
    let rest = null;
    const keep = (item) => (rest ??= { ...list, children: [] }).children.push(item);
    const flush = () => rest && out.push(rest) && (rest = null);
    for (const item of list.children) {
      const at = item.children?.findIndex(isBlock) ?? -1;
      if (at < 0) {
        keep(item);
        continue;
      }
      const before = item.children.slice(0, at);
      if (before.length) keep({ ...item, children: before });
      flush();
      out.push(...item.children.slice(at).filter(isBlock));
      const after = item.children.slice(at).filter((n) => !isBlock(n));
      if (after.length) keep({ ...item, checked: null, children: after });
    }
    flush();
    return out;
  };
  tree.children = tree.children.flatMap((child) =>
    child.type === 'list' && child.children.some((item) => item.children?.some(isBlock)) ? split(child) : [child],
  );
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

// The same for a size (lib/text-sizes.mjs): `<span class="body-small">…</span>` is the text with the mark textSize.
function sizeRuns(children) {
  const out = [];
  for (let i = 0; i < children.length; i++) {
    const size = children[i].type === 'html' ? sizeOpened(children[i].value) : null;
    let end = -1;
    for (let j = i + 1, depth = 0; size && j < children.length && end < 0; j++) {
      const node = children[j];
      if (node.type !== 'html') continue;
      if (/^<span\b/.test(node.value)) depth++;
      else if (node.value === SIZE_CLOSE && depth-- === 0) end = j;
    }
    if (end < 0) out.push(children[i]);
    else {
      out.push({ type: 'textSize', size, children: children.slice(i + 1, end) });
      i = end;
    }
  }
  return out;
}

function textSizeMarkdown(node, _, state, info) {
  const tracker = state.createTracker(info);
  let value = tracker.move(sizeOpen(node.size));
  value += tracker.move(state.containerPhrasing(node, { ...tracker.current(), before: '>', after: '<' }));
  return value + tracker.move(SIZE_CLOSE);
}
textSizeMarkdown.peek = () => '<';

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
      (data.toMarkdownExtensions ??= []).push({ handlers: { textColor: textColorMarkdown, textSize: textSizeMarkdown } });
      const walk = (node) => {
        if (!node.children) return;
        node.children = sizeRuns(colorRuns(node.children));
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

/** @type {import('@milkdown/kit/utils').$MarkSchema<'textSize'>} */
export const textSizeSchema = $markSchema('textSize', () => ({
  attrs: { size: { default: TEXT_SIZES[0] } },
  parseDOM: TEXT_SIZES.map((size) => ({ tag: `span.${sizeClass(size)}`, attrs: { size } })),
  toDOM: (mark) => ['span', { class: sizeClass(mark.attrs.size) }],
  parseMarkdown: {
    match: (node) => node.type === 'textSize',
    runner: (state, node, markType) => {
      state.openMark(markType, { size: node.size });
      state.next(node.children);
      state.closeMark(markType);
    },
  },
  toMarkdown: {
    match: (mark) => mark.type.name === 'textSize',
    runner: (state, mark) => {
      state.withMark(mark, 'textSize', undefined, { size: mark.attrs.size });
    },
  },
}));

// The settings of a section (lib/section-marker.mjs): the marker line before an H1 or H2, or before the label above it
// (eyebrow), is read into the heading's attributes `section` (the colour), `sectionImage`, `sectionAlt` and `sectionWidth`, and
// written back before it. It must be read before remarkSiteBlocks
// sees it, so it is the first plugin of that kind in makeEditor. A marker with nothing to colour is dropped.
const htmlOf = (node) => {
  const only = node?.type === 'paragraph' && node.children?.length === 1 ? node.children[0] : node;
  return only?.type === 'html' ? String(only.value) : '';
};
const remarkSectionMarkers = $remark('remarkSectionMarkers', () => () => (tree) => {
  const parts = tree.children;
  tree.children = parts.filter((child, i) => {
    const marker = parseMarker(htmlOf(child));
    if (marker === null) return true;
    const next = isLabelLine(htmlOf(parts[i + 1])) ? parts[i + 2] : parts[i + 1];
    if (next?.type === 'heading' && next.depth <= 2) {
      next.section = marker.color || null;
      Object.assign(next, { sectionImage: marker.image, sectionAlt: marker.alt, sectionWidth: marker.width });
    }
    return false;
  });
});

// The alignment of a block (lib/text-align.mjs): the line before a paragraph, a body style or an H3 or smaller heading is read into
// that block's attribute `align` ('center' or 'right') and written back before it. A line before anything else stays as it is (an HTML
// block). It is read before remarkSectionMarkers and remarkSiteBlocks see the text.
const remarkAlignMarkers = $remark('remarkAlignMarkers', () => () => (tree) => {
  const parts = tree.children;
  tree.children = parts.filter((child, i) => {
    const align = alignOf(htmlOf(child));
    const next = parts[i + 1];
    if (!align || !next) return true;
    const html = htmlOf(next);
    const target =
      (next.type === 'heading' && next.depth >= 3) ||
      (next.type === 'paragraph' && !html) ||
      (html !== '' && (bodyLargeText(html) !== null || bodySizeText(html) !== null));
    if (!target) return true;
    next.align = align;
    return false;
  });
});

// A node's DOM with the class of its alignment (the site's: text-align-center), as the editor draws it.
export function withAlignClass(dom, node) {
  const name = alignClass(node.attrs.align);
  if (!name) return dom;
  const [tag, attrs, ...rest] = dom;
  return [tag, { ...attrs, class: [attrs?.class, name].filter(Boolean).join(' ') }, ...rest];
}

// The commonmark paragraph with its alignment as an attribute, written back as the line before it (in the text's top level only: a
// paragraph in a list or a quote has none).
export const paragraphWithAlign = paragraphSchema.extendSchema((prev) => (ctx) => {
  const base = prev(ctx);
  return {
    ...base,
    attrs: { ...base.attrs, align: { default: null, validate: 'string|null' } },
    toDOM: (node) => withAlignClass(base.toDOM(node), node),
    parseMarkdown: {
      match: base.parseMarkdown.match,
      runner: (state, node, type) => {
        state.openNode(type, { align: node.align ?? null });
        if (node.children) state.next(node.children);
        else state.addText(node.value || '');
        state.closeNode();
      },
    },
    toMarkdown: {
      match: base.toMarkdown.match,
      runner: (state, node) => {
        if (node.attrs.align) state.addNode('html', undefined, alignHtml(node.attrs.align));
        base.toMarkdown.runner(state, node);
      },
    },
  };
});

// The commonmark heading with the section settings as attributes (only an H1 or H2 has them). Written back before the heading, or
// before its label, which is already the last thing written (a line of HTML).
/** @type {import('@milkdown/kit/utils').$NodeSchema<'heading'>} */
export const headingWithSection = headingSchema.extendSchema((prev) => (ctx) => {
  const base = prev(ctx);
  return {
    ...base,
    attrs: {
      ...base.attrs,
      section: { default: null, validate: 'string|null' },
      sectionImage: { default: null, validate: 'string|null' },
      sectionAlt: { default: null, validate: 'string|null' },
      sectionWidth: { default: null, validate: 'string|null' },
      align: { default: null, validate: 'string|null' },
    },
    toDOM: (node) => withAlignClass(base.toDOM(node), node),
    parseMarkdown: {
      match: base.parseMarkdown.match,
      runner: (state, node, type) => {
        const top = node.depth <= 2;
        state.openNode(type, {
          level: node.depth,
          section: top ? (node.section ?? null) : null,
          sectionImage: top ? (node.sectionImage ?? null) : null,
          sectionAlt: top ? (node.sectionAlt ?? null) : null,
          sectionWidth: top ? (node.sectionWidth ?? null) : null,
          align: node.depth >= 3 ? (node.align ?? null) : null,
        });
        state.next(node.children);
        state.closeNode();
      },
    },
    toMarkdown: {
      match: base.toMarkdown.match,
      runner: (state, node) => {
        const { level, section, sectionImage, sectionAlt, sectionWidth } = node.attrs;
        const top = state.top();
        // The document has no children before its first node is written: a heading at the very top starts them.
        if (top && !top.children) top.children = [];
        const written = top?.children;
        const marker = level <= 2 ? markerHtml({ color: section, image: sectionImage, alt: sectionAlt, width: sectionWidth }) : '';
        if (marker && Array.isArray(written)) {
          const last = written.at(-1);
          const at = last?.type === 'html' && isLabelLine(last.value) ? written.length - 1 : written.length;
          written.splice(at, 0, { type: 'html', value: marker });
        }
        if (level >= 3 && node.attrs.align) state.addNode('html', undefined, alignHtml(node.attrs.align));
        base.toMarkdown.runner(state, node);
      },
    },
  };
});

/** A Milkdown editor of the text, in root (not created yet). @param {HTMLElement | null} root @param {string} markdown
 * @returns {import('@milkdown/kit/core').Editor} */
export function makeEditor(root, markdown) {
  return (
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, markdown);
        ctx.update(remarkStringifyOptionsCtx, (options) => ({ ...options, ...stringify }));
        // Bold as on the site (lib/rehype-emphasize.mjs).
        ctx.set(strongAttr.key, () => ({ class: EMPHASIZE }));
      })
      .use(commonmark)
      .use(gfm)
      .use(headingWithSection)
      .use(paragraphWithAlign)
      // A Banner alone in its section is read as the section it has become, so the next save writes the section.
      .use($remark('remarkBannerSections', () => remarkBannerSections))
      // A Checklist is read as the check list it has become, so the next save writes the list.
      .use($remark('remarkChecklists', () => remarkChecklists))
      // A List's label, heading and intro are read as the text's own lines above it, so the next save writes them there.
      .use($remark('remarkListHeads', () => remarkListHeads))
      // A block's label is read as the text's own label line before it, so the next save writes it there.
      .use($remark('remarkBlockLabels', () => remarkBlockLabels))
      .use(remarkAlignMarkers)
      .use(remarkSectionMarkers)
      .use(remarkBlocksOutOfLists)
      .use(remarkSiteBlocks)
      .use(siteBlockSchema)
      .use(remarkTextColors)
      .use(textColorSchema)
      .use(textSizeSchema)
      .use(bodyLargeSchema)
      .use(bodyMediumSchema)
      .use(bodySmallSchema)
      .use(eyebrowSchema)
      .use(eyebrowKeeper)
      .use(eyebrowKeymap)
      .use(listKeymap)
  );
}

// The text in parts, for a fixed page's sections (sections.mjs): each block, each heading at the top
// level ("Heading", H2), and the Markdown of the text between them. Empty paragraphs (the lines
// kept free between two blocks to write in), empty headings (left when one is deleted) and the page's H1
// (no section's) are left out.
// An H2's colour (its `section`) is the part's `color`.
export function partsOf(ctx) {
  const doc = ctx.get(editorViewCtx).state.doc;
  const serialize = ctx.get(serializerCtx);
  const parts = [];
  let run = [];
  let h1Seen = false;
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
      parts.push({ heading: node.textContent.trim(), ...(node.attrs.section ? { color: node.attrs.section } : {}) });
    } else if (node.type.name === 'heading' && node.attrs.level === 1) {
      flush();
      // The settings of the page's H1 section (a marker before it): a part `top`, as partsOfMarkdown has them.
      const { section, sectionImage, sectionAlt, sectionWidth } = node.attrs;
      const top = topOf({ color: section, image: sectionImage, alt: sectionAlt, width: sectionWidth });
      if (top && !h1Seen) parts.push({ top });
      h1Seen = true;
    } else if (!((node.type.name === 'paragraph' || node.type.name === 'heading') && !node.textContent.trim() && !node.childCount))
      run.push(node);
  });
  flush();
  return parts;
}

// Keeps a free line (an empty paragraph) between two blocks, before and after them and between a block and the next section's heading, so there is
// always a place to write a text between them, and after a text that is only its H1, so a tap under the heading and Enter in it land on a real line
// (a phone's keyboard does not open for a tap on a hint drawn in the heading). Not part of undo. Used by the editor (MarkdownEditor.tsx)
// and the check, which writes the text back with the free lines in it.
/** @type {import('@milkdown/kit/utils').$Prose} */
export const spacing = $prose(
  () =>
    new Plugin({
      props: {
        // Enter at the end of an H1 that has only the free line after it goes into that line, not into a second one.
        handleKeyDown: (view, event) => {
          if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return false;
          const { doc, selection } = view.state;
          const { $from } = selection;
          const [heading, line] = [doc.maybeChild(0), doc.maybeChild(1)];
          if (!selection.empty || doc.childCount !== 2 || $from.depth !== 1 || $from.index(0) !== 0) return false;
          if (heading?.type.name !== 'heading' || line?.type.name !== 'paragraph' || line.content.size) return false;
          if ($from.parentOffset !== heading.content.size) return false;
          view.dispatch(view.state.tr.setSelection(TextSelection.create(doc, $from.after() + 1)).scrollIntoView());
          return true;
        },
      },
      appendTransaction: (_, __, state) => {
        const gaps = [];
        let before = null;
        state.doc.forEach((node, at) => {
          if (node.type.name === 'siteBlock' && (!before || before.type.name === 'siteBlock')) gaps.push(at);
          // A block that ends a section has a free line after it, before the heading of the next.
          else if (before?.type.name === 'siteBlock' && node.type.name === 'heading' && node.attrs.level <= 2) gaps.push(at);
          before = node;
        });
        if (state.doc.lastChild?.type.name === 'siteBlock') gaps.push(state.doc.content.size);
        // A text with only its H1: the line to write in under it.
        if (state.doc.childCount === 1 && state.doc.firstChild?.type.name === 'heading' && state.doc.firstChild.attrs.level === 1)
          gaps.push(state.doc.content.size);
        if (!gaps.length) return null;
        const tr = state.tr;
        for (const at of gaps.reverse()) tr.insert(at, state.schema.nodes.paragraph.create());
        return tr.setMeta('addToHistory', false);
      },
    }),
);

/** A transaction that puts a block (a siteBlock node) at the top level of the text, never inside a list item or a quote: in a paragraph
 * it splits the paragraph around it; in a list item or a quote it ends the list (or quote) after the item the cursor is in, the rest of
 * it follows the block as a list of its own. `end` is where the block ends. */
export function insertBlock(state, node) {
  let tr = state.tr;
  if (state.selection instanceof NodeSelection && state.selection.$from.depth === 0) {
    tr = tr.insert(state.selection.to, node);
    return { tr, end: state.selection.to + node.nodeSize };
  }
  const nested = (s) => s.$from.depth > 1 || (s.$from.depth === 1 && !s.$from.parent.isTextblock);
  if (!nested(state.selection)) {
    tr = tr.replaceSelectionWith(node);
    return { tr, end: tr.selection instanceof NodeSelection ? tr.selection.to : -1 };
  }
  if (!state.selection.empty) tr = tr.deleteSelection();
  const { $from } = tr.selection;
  let item = -1;
  for (let d = $from.depth; d > 0 && item < 0; d--) if ($from.node(d).type.name === 'list_item') item = d;
  const pos = item > 0 ? $from.after(item) : $from.after($from.depth);
  const depth = tr.doc.resolve(pos).depth;
  let at;
  if (depth > 0 && canSplit(tr.doc, pos, depth)) {
    tr = tr.split(pos, depth);
    at = pos + depth;
  } else at = $from.after(1);
  tr = tr.insert(at, node);
  return { tr, end: at + node.nodeSize };
}

/** Backspace at the very start of a list item leaves the list one step (an outdent; out of a top-level list it is a paragraph), as in every
 * editor, instead of joining the item to the text before it. Not in an item that is not the first block of it. */
export const leaveListAtStart = (state, dispatch) => {
  const { $from, empty } = state.selection;
  if (!empty || $from.parentOffset !== 0 || $from.depth < 2) return false;
  const item = $from.node($from.depth - 1);
  if (item.type.name !== 'list_item' || $from.index($from.depth - 1) !== 0) return false;
  return liftListItem(item.type)(state, dispatch);
};
export const listKeymap = $useKeymap('list', {
  LeaveListAtStart: { shortcuts: 'Backspace', priority: 100, command: () => leaveListAtStart },
});

// The Markdown of the text, without its empty paragraphs (the free lines between the blocks).
export function markdownOf(ctx) {
  const doc = ctx.get(editorViewCtx).state.doc;
  const kept = [];
  doc.forEach((node) => {
    // Nor an empty label (added, then left without a text).
    // Nor an empty H1.
    const empty =
      node.content.size === 0 &&
      (['paragraph', 'eyebrow', 'bodyLarge', 'bodyMedium', 'bodySmall'].includes(node.type.name) ||
        (node.type.name === 'heading' && node.attrs.level === 1));
    if (!empty) kept.push(node);
  });
  return ctx.get(serializerCtx)(doc.type.create(null, kept));
}
