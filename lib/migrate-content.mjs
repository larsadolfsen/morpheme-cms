// The content migration of an update: a text written with blocks that have become something else (0.17: Points with icon, Links
// and Expandable list became List and Segmented list, Checklist a check list, a Banner a section) is rewritten to the form the
// editor writes when the page is saved. Everything else in the text stays as it is, byte for byte, so the change in git is only the
// blocks. The site and the editor already read the old form (FORMER in lib/blocks.mjs, lib/remark-checklist.mjs,
// lib/remark-banner-section.mjs, lib/front-banner.mjs); this writes it, so a site's check:editor passes. Idempotent: a migrated
// text is returned unchanged. Pure text to text; `morpheme migrate` (scripts/migrate.mjs) runs it on a site's files.
// Depends on lib/blocks.mjs, lib/remark-checklist.mjs, lib/remark-banner-section.mjs and lib/front-banner.mjs.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { EYEBROW_CLASS, EYEBROW_FORMER_CLASS, eyebrowText } from './eyebrow.mjs';
import { blockHtml, migratedBlock, parseBlock } from './blocks.mjs';
import { migrateFrontBanner } from './front-banner.mjs';
import { alone, bannerMarkdown } from './remark-banner-section.mjs';
import { checklistMarkdown } from './remark-checklist.mjs';

const parser = unified().use(remarkParse).use(remarkGfm);

// The HTML of a node that is a line of HTML on its own (also inside a paragraph, as Milkdown's reader has it).
const htmlOf = (node) => {
  const only = node?.type === 'paragraph' && node.children?.length === 1 ? node.children[0] : node;
  return only?.type === 'html' ? String(only.value) : '';
};

/** A label's line in its former class (block-eyebrow) written with the class the editor writes now (label-medium); lines
 * in code fences and any other HTML stay as they are. @param {string} markdown */
function migrateEyebrows(markdown) {
  if (!markdown.includes(EYEBROW_FORMER_CLASS)) return markdown;
  let fence = null;
  return markdown
    .split('\n')
    .map((line) => {
      const f = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (f) fence = fence ? (f[1][0] === fence[0] && f[1].length >= fence.length ? null : fence) : f[1];
      if (fence || f || eyebrowText(line) === null || !line.includes(`"${EYEBROW_FORMER_CLASS}"`)) return line;
      return line.replace(`"${EYEBROW_FORMER_CLASS}"`, `"${EYEBROW_CLASS}"`);
    })
    .join('\n');
}

/** The text with every block in an old form written in the new one, as the editor saves it; as it is when there is none.
 * @param {string} markdown */
export function migrateMarkdown(markdown) {
  return migrateBlocks(migrateEyebrows(String(markdown ?? '')));
}

function migrateBlocks(source) {
  if (!source.includes('data-block=')) return source;
  // The top Banner first, as the site's pipeline does (remarkBannerSections).
  const text = migrateFrontBanner(source);
  const nodes = parser.parse(text).children;
  const edits = [];
  nodes.forEach((node, i) => {
    const html = htmlOf(node);
    if (!html.includes('data-block=')) return;
    let replacement = null;
    const checklist = parseBlock(html, ['checklist']);
    const hero = parseBlock(html, ['hero']);
    if (checklist) replacement = checklistMarkdown(checklist.props);
    else if (hero) replacement = alone(nodes, i) ? bannerMarkdown(hero.props) : null;
    else {
      const block = migratedBlock(html);
      if (block) replacement = blockHtml(block.type, block.props);
    }
    if (replacement !== null) edits.push({ from: node.position.start.offset, to: node.position.end.offset, text: replacement });
  });
  let result = text;
  for (const e of edits.sort((a, b) => b.from - a.from)) result = result.slice(0, e.from) + e.text + result.slice(e.to);
  return result;
}

/** A page file (front matter and text) migrated; the front matter stays untouched.
 * @param {string} file */
export function migrateFile(file) {
  const m = String(file).match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n?)([\s\S]*)$/);
  return m ? m[1] + migrateMarkdown(m[2]) : migrateMarkdown(file);
}
