// A block's head (its label, heading and intro) has moved out of the block into the text around it (batch 5, owner decision 3:
// a block keeps only what is its own, the rest is the text's styles). First the List's; in 0.19.8 (B8) every other standard block that
// had a head too (HEAD_BLOCKS). This is the migration, so a text from before keeps working on the
// site, in the editor and in the preview, which write the new text when the page is saved (the same way as lib/remark-checklist.mjs).
// Exposes remarkListHeads (a remark plugin: the site's pipeline in astro.mjs, lib/markdown.ts and the editor's in src/markdown.mjs) and
// listHeadMarkdown (pure).
//
// The head becomes the text's own lines right above the list: the label (a "Label" line), the heading (H2, or H3 when an H2 is above it
// already, so the section the list is in keeps its colour and image), and the intro ("Body large"). The list stays, without them.
// A hidden List is left as it is: it is not on the site, and it keeps what it has until it is shown again.
// Depends on lib/blocks.mjs, lib/body-large.mjs and lib/eyebrow.mjs.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { blockHtml, parseBlock } from './blocks.mjs';
import { bodyLargeHtml } from './body-large.mjs';
import { eyebrowHtml } from './eyebrow.mjs';
import { oneLine } from './one-line.mjs';

const HEAD = ['eyebrow', 'heading', 'intro'];
/** The standard blocks that had a head: their stored heading, subheading (`intro`) and label are the text's lines now. */
export const HEAD_BLOCKS = ['list', 'cards', 'checklist', 'expand', 'imagegrid', 'posts', 'pricecards', 'steps', 'testimonials'];
const mentionsHeadBlock = (s) => HEAD_BLOCKS.some((type) => s.includes(`data-block="${type}"`));

// One line of text as Markdown: the characters that mean something in it.
const escape = (s) =>
  oneLine(String(s))
    .replace(/\\/g, '\\\\')
    .replace(/([*_`[\]<>#~|])/g, '\\$1')
    .trim();

/** The Markdown a block's props become: its head's lines, then the block without them; null when the block has no head to move (or is hidden).
 * @param {Record<string, any>} props `eyebrow`, `heading`, `intro` and the rest of the block
 * @param {{ after?: boolean, type?: string }} [where] after: an H2 is above the block, so its heading is an H3; type: the block's type (a List)
 * @returns {string | null} */
export function listHeadMarkdown(props, { after = false, type = 'list' } = {}) {
  if (props.hidden || !HEAD.some((k) => k in props)) return null;
  const text = (k) => (typeof props[k] === 'string' ? props[k].trim() : '');
  const { eyebrow, heading, intro } = { eyebrow: text('eyebrow'), heading: text('heading'), intro: text('intro') };
  const rest = Object.fromEntries(Object.entries(props).filter(([k]) => !HEAD.includes(k)));
  return [
    eyebrow && eyebrowHtml(oneLine(eyebrow)),
    heading && `${after ? '###' : '##'} ${escape(heading)}`,
    intro && bodyLargeHtml(oneLine(intro)),
    blockHtml(type, rest),
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** The same for a text as lines of Markdown (src/sections.mjs reads the front page's text that way, without remark): each List with a head is
 * replaced by the head's lines and the List. @param {string} markdown */
export function listHeadsInMarkdown(markdown) {
  const text = String(markdown);
  if (!mentionsHeadBlock(text)) return text;
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
      const block = parseBlock(line, HEAD_BLOCKS);
      const markdown = block ? listHeadMarkdown(block.props, { after: h2, type: block.type }) : null;
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

/** The remark plugin: each block with a head is replaced by the head's lines and the block without it. */
export function remarkListHeads() {
  return (tree) => {
    const nodes = tree.children;
    if (!nodes.some((n) => mentionsHeadBlock(htmlOf(n)))) return;
    let h2 = false;
    tree.children = nodes.flatMap((node) => {
      if (node.type === 'heading' && node.depth === 2) h2 = true;
      const block = parseBlock(htmlOf(node), HEAD_BLOCKS);
      const markdown = block ? listHeadMarkdown(block.props, { after: h2, type: block.type }) : null;
      if (markdown === null) return [node];
      const written = parse.parse(markdown).children;
      // An H2 the head brings is one above the next Lists too.
      if (written.some((n) => n.type === 'heading' && n.depth === 2)) h2 = true;
      return written;
    });
  };
}
