// The content migration of an update: a text written with blocks that have become something else (0.17: Points with icon, Links
// and Accordion became List and Segmented list, Checklist a check list, a block's label a line of text before it; 0.19.0: the class names of the text styles and colours, lib/content-class-names.mjs) is rewritten to the form the
// editor writes when the page is saved. Everything else in the text stays as it is, byte for byte, so the change in git is only the
// blocks. The site and the editor already read the old form (FORMER in lib/blocks.mjs, lib/remark-checklist.mjs); this writes it, so a site's check:editor passes. Idempotent: a migrated
// text is returned unchanged. Pure text to text; `morpheme migrate` (scripts/migrate.mjs) runs it on a site's files.
// Depends on lib/blocks.mjs, lib/content-class-names.mjs, lib/migrate-hero.mjs, lib/remark-block-label.mjs, lib/remark-checklist.mjs and lib/section-marker.mjs.
// Migrations are cumulative: a site can skip versions, so this takes the content of any older supported version to the form of this one
// (the Banner of 0.15 and 0.16 included: lib/migrate-hero.mjs).
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { eyebrowText } from './eyebrow.mjs';
import { migrateClassNames } from './content-class-names.mjs';
import { blockHtml, migratedBlock, parseBlock } from './blocks.mjs';
import { MARKER_TAG, colorOf, markerHtml } from './section-marker.mjs';
import { migrateHeroBlocks } from './migrate-hero.mjs';
import { checklistMarkdown } from './remark-checklist.mjs';
import { blockLabelMarkdown } from './remark-block-label.mjs';

const parser = unified().use(remarkParse).use(remarkGfm);

// The HTML of a node that is a line of HTML on its own (also inside a paragraph, as Milkdown's reader has it).
const htmlOf = (node) => {
  const only = node?.type === 'paragraph' && node.children?.length === 1 ? node.children[0] : node;
  return only?.type === 'html' ? String(only.value) : '';
};

/** The text with every block in an old form written in the new one, as the editor saves it; as it is when there is none.
 * @param {string} markdown */
export function migrateMarkdown(markdown) {
  return migrateH1Marker(migrateBlocks(migrateHeroBlocks(migrateClassNames(String(markdown ?? '')))));
}

/** The marker before the page's first H1 (or before the label above it) written as the editor writes it now. A page's H1 has no
 * background image (0.18): the image and its description are dropped, the colour and the width stay, and a marker with nothing
 * left goes with its line. A marker on an H2, or an H1 marker without an image, is left as it is. @param {string} source */
function migrateH1Marker(source) {
  if (!source.includes('data-picture=')) return source;
  const nodes = parser.parse(source).children;
  const at = nodes.findIndex((n) => n.type === 'heading' && n.depth === 1);
  if (at < 1) return source;
  let marker = nodes[at - 1];
  if (eyebrowText(htmlOf(marker)) !== null && at >= 2) marker = nodes[at - 2];
  const html = htmlOf(marker).trim();
  if (!html.includes('data-picture=') || !new RegExp(`^${MARKER_TAG}$`).test(html)) return source;
  const attribute = (name) => html.match(new RegExp(`\\sdata-${name}="([^"]*)"`))?.[1];
  const text = markerHtml({
    color: colorOf(html.match(/^<div data-section="([^"]*)"/)?.[1]),
    width: attribute('width') === 'full' ? 'full' : undefined,
  });
  const from = marker.position.start.offset;
  const to = marker.position.end.offset;
  if (text) return source.slice(0, from) + text + source.slice(to);
  // Nothing is left: the line goes, with the blank line after it.
  return source.slice(0, from) + source.slice(to).replace(/^\r?\n(?:[ \t]*\r?\n)*/, '');
}

function migrateBlocks(source) {
  if (!source.includes('data-block=')) return source;
  const nodes = parser.parse(source).children;
  const edits = [];
  nodes.forEach((node) => {
    const html = htmlOf(node);
    if (!html.includes('data-block=')) return;
    let replacement = null;
    const checklist = parseBlock(html, ['checklist']);
    if (checklist) replacement = checklistMarkdown(checklist.props);
    else {
      const block = migratedBlock(html);
      if (block) replacement = blockHtml(block.type, block.props);
      // A block's label above its heading is the text's own label line before the block (lib/remark-block-label.mjs).
      const now = parseBlock(html);
      const labelled = now && blockLabelMarkdown(now.type, now.props);
      if (labelled) replacement = labelled;
    }
    if (replacement !== null) edits.push({ from: node.position.start.offset, to: node.position.end.offset, text: replacement });
  });
  let result = source;
  for (const e of edits.sort((a, b) => b.from - a.from)) result = result.slice(0, e.from) + e.text + result.slice(e.to);
  return result;
}

/** A page file (front matter and text) migrated; the front matter stays untouched except the class names of markdown in it.
 * @param {string} file */
export function migrateFile(file) {
  const m = String(file).match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n?)([\s\S]*)$/);
  return m ? migrateClassNames(m[1]) + migrateMarkdown(m[2]) : migrateMarkdown(file);
}
