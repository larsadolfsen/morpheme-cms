// The List block's head (its label, heading and intro) has moved out of the block into the text around it (batch 5, owner decision 3:
// a block keeps only what is its own, the rest is the text's styles). This is the migration, so a text from before keeps working on the
// site, in the editor and in the preview, which write the new text when the page is saved (the same way as lib/remark-checklist.mjs).
// Exposes remarkListHeads (a remark plugin: the site's pipeline in astro.mjs, lib/markdown.ts and the editor's in src/markdown.mjs) and
// listHeadMarkdown (pure).
//
// The head becomes the text's own lines right above the list: the label (a "Label" line), the heading (H2, or H3 when an H2 is above it
// already, so the section the list is in keeps its colour and picture), and the intro ("Body large"). The list stays, without them.
// A hidden List is left as it is: it is not on the site, and it keeps what it has until it is shown again.
// Depends on lib/blocks.mjs, lib/body-large.mjs and lib/eyebrow.mjs.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { blockHtml, parseBlock } from './blocks.mjs';
import { bodyLargeHtml } from './body-large.mjs';
import { eyebrowHtml } from './eyebrow.mjs';

const HEAD = ['eyebrow', 'heading', 'intro'];

// One line of text as Markdown: the characters that mean something in it.
const escape = (s) =>
  String(s)
    .replace(/\\/g, '\\\\')
    .replace(/([*_`[\]<>#~|])/g, '\\$1')
    .replace(/\s*\n\s*/g, ' ')
    .trim();

/** The Markdown a List's props become: its head's lines, then the List without them; null when the List has no head to move (or is hidden).
 * @param {Record<string, any>} props `eyebrow`, `heading`, `intro` and the rows of the block
 * @param {{ after?: boolean }} [where] after: an H2 is above the List, so its heading is an H3
 * @returns {string | null} */
export function listHeadMarkdown(props, { after = false } = {}) {
  if (props.hidden || !HEAD.some((k) => k in props)) return null;
  const text = (k) => (typeof props[k] === 'string' ? props[k].trim() : '');
  const { eyebrow, heading, intro } = { eyebrow: text('eyebrow'), heading: text('heading'), intro: text('intro') };
  const rest = Object.fromEntries(Object.entries(props).filter(([k]) => !HEAD.includes(k)));
  return [
    eyebrow && eyebrowHtml(eyebrow.replace(/\s*\n\s*/g, ' ')),
    heading && `${after ? '###' : '##'} ${escape(heading)}`,
    intro && bodyLargeHtml(intro.replace(/\s*\n\s*/g, ' ')),
    blockHtml('list', rest),
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** The same for a text as lines of Markdown (src/sections.mjs reads the front page's text that way, without remark): each List with a head is
 * replaced by the head's lines and the List. @param {string} markdown */
export function listHeadsInMarkdown(markdown) {
  const text = String(markdown);
  if (!text.includes('data-block="list"')) return text;
  let h2 = false;
  let fence = null;
  return text
    .split('\n')
    .map((line) => {
      const mark = line.match(/^ {0,3}(`{3,}|~{3,})/)?.[1];
      if (fence) {
        if (mark && mark[0] === fence[0] && mark.length >= fence.length) fence = null;
        return line;
      }
      if (mark) {
        fence = mark;
        return line;
      }
      if (/^ {0,3}##(?!#)/.test(line)) h2 = true;
      const block = parseBlock(line, ['list']);
      const markdown = block ? listHeadMarkdown(block.props, { after: h2 }) : null;
      if (markdown === null) return line;
      if (/^## /m.test(markdown)) h2 = true;
      return markdown;
    })
    .join('\n');
}

const parse = unified().use(remarkParse).use(remarkGfm);

// The HTML of a node that is a line of HTML on its own (also inside a paragraph, as Milkdown's reader has it).
const htmlOf = (node) => {
  const only = node?.type === 'paragraph' && node.children?.length === 1 ? node.children[0] : node;
  return only?.type === 'html' ? String(only.value) : '';
};

/** The remark plugin: each List with a head is replaced by the head's lines and the List without it. */
export function remarkListHeads() {
  return (tree) => {
    const nodes = tree.children;
    if (!nodes.some((n) => htmlOf(n).includes('data-block="list"'))) return;
    let h2 = false;
    tree.children = nodes.flatMap((node) => {
      if (node.type === 'heading' && node.depth === 2) h2 = true;
      const block = parseBlock(htmlOf(node), ['list']);
      const markdown = block ? listHeadMarkdown(block.props, { after: h2 }) : null;
      if (markdown === null) return [node];
      const written = parse.parse(markdown).children;
      // An H2 the head brings is one above the next Lists too.
      if (written.some((n) => n.type === 'heading' && n.depth === 2)) h2 = true;
      return written;
    });
  };
}
