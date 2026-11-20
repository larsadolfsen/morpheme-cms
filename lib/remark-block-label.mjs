// A block's head had a label above its heading ("Label", the prop `eyebrow`). It is the text's own label now (the "Label" kind of text,
// lib/eyebrow.mjs): a line right before the block. This is the migration, so a text from before keeps its label on the site, in the editor
// and in the preview, which write the new text when the page is saved (the same way as lib/remark-list-head.mjs). Exposes remarkBlockLabels
// (a remark plugin: the site's pipeline in astro.mjs and lib/markdown.ts, and the editor's in src/markdown.mjs), blockLabelMarkdown (pure)
// and blockLabelsInMarkdown (a text as lines). A hidden block keeps its label where it is: it is not on the site. The List's label is
// moved by lib/remark-list-head.mjs, which runs before this.
// Depends on lib/blocks.mjs and lib/eyebrow.mjs.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { blockHtml, parseBlock } from './blocks.mjs';
import { eyebrowHtml } from './eyebrow.mjs';

/** The Markdown a block's label becomes: the label's line, then the block without it; null when the block has no label to move (or is hidden).
 * @param {string} type @param {Record<string, any>} props */
export function blockLabelMarkdown(type, props) {
  if (props.hidden || typeof props.eyebrow !== 'string') return null;
  const { eyebrow, ...rest } = props;
  const label = eyebrow.replace(/\s+/g, ' ').trim();
  return [label && eyebrowHtml(label), blockHtml(type, rest)].filter(Boolean).join('\n\n');
}

/** The same for a text as lines of Markdown (src/sections.mjs reads the front page's text that way, without remark).
 * @param {string} markdown */
export function blockLabelsInMarkdown(markdown) {
  const text = String(markdown);
  if (!text.includes('eyebrow')) return text;
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
      const block = parseBlock(line, null);
      return (block && blockLabelMarkdown(block.type, block.props)) ?? line;
    })
    .join('\n');
}

const parse = unified().use(remarkParse).use(remarkGfm);

// The HTML of a node that is a line of HTML on its own (also inside a paragraph, as Milkdown's reader has it).
const htmlOf = (node) => {
  const only = node?.type === 'paragraph' && node.children?.length === 1 ? node.children[0] : node;
  return only?.type === 'html' ? String(only.value) : '';
};

/** The remark plugin: each block with a label is replaced by the label's line and the block without it. */
export function remarkBlockLabels() {
  return (tree) => {
    if (!tree.children.some((n) => htmlOf(n).includes('eyebrow'))) return;
    tree.children = tree.children.flatMap((node) => {
      const html = htmlOf(node);
      const block = html.includes('eyebrow') ? parseBlock(html, null) : null;
      const markdown = block ? blockLabelMarkdown(block.type, block.props) : null;
      return markdown === null ? [node] : parse.parse(markdown).children;
    });
  };
}
