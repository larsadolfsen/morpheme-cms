// The Banner at the top of a page (the front page's: its heading is the page's H1, above the block, and its text is written above the
// block too) as a section. The H1 starts the section: the settings of lib/section-marker.mjs (a background picture, the whole width,
// Surface) go in the marker before the H1, and the text and the Buttons block stay where they are, with the Banner's own text after the
// buttons and a picture beside the text below it all, so the front page, an ordinary page and the editor all read it as a section (the first H1's section,
// as a page's coloured H1 is). Exposes frontBannerPlan (on the text's top-level nodes), migrateFrontBanner (Markdown to Markdown, for
// the site's reading of the front page) and remarkFrontBanner (the same on a tree, for the pipelines and the editor); remark-banner-section.mjs
// calls it. The H1 is the first heading of the text, as pageH1 (src/sections.mjs) reads it.
//
// Migrated only when the Banner is what follows the H1 with nothing but text and pictures between them, has no heading of its own, is
// not hidden, and the H1 has no marker yet. What cannot migrate stays a Banner block (`former`, lib/blocks.mjs): a Banner after
// a heading or another block, with a heading of its own (remark-banner-section.mjs migrates one that stands alone in its section),
// hidden, or under an H1 that already has settings. With a picture behind the text, the picture must stand in a paragraph of its own.
// Depends on lib/blocks.mjs, lib/crop.mjs and lib/section-marker.mjs; remark only, no browser.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { blockHtml, cutAtBlock, parseBlock } from './blocks.mjs';
import { splitPicture } from './crop.mjs';
import { isLabelLine, markerHtml, parseMarker } from './section-marker.mjs';

const parser = unified().use(remarkParse).use(remarkGfm);
const PICTURE = /!\[((?:\\.|[^\]])*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
const HEADING = /^ {0,3}##(?!#)(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*(?:\r?\n|$)/;
const unescape = (s) => s.replace(/\\([!-/:-@[-`{-~])/g, '$1');
const tidy = (s) => s.replace(/\n{3,}/g, '\n\n').trim();

// The HTML of a node that is a line of HTML on its own (also inside a paragraph, as Milkdown's reader has it).
const htmlOf = (node) => {
  const only = node?.type === 'paragraph' && node.children?.length === 1 ? node.children[0] : node;
  return only?.type === 'html' ? String(only.value) : '';
};
const hasPicture = (node) => JSON.stringify(node.children ?? []).includes('"type":"image"');
const pictureOnly = (node) => node.type === 'paragraph' && node.children?.length === 1 && node.children[0].type === 'image';

/** What to change in a text's top-level nodes to make its top Banner a section, or null when there is none to migrate.
 * `marker`: the marker line to put before the H1 (empty when the Banner had no settings), `remove`: the indexes of nodes to take
 * away (the picture behind the text), `replace`: the Banner's node and the Markdown that takes its place (its text, its picture
 * when it is beside the text, its Buttons block and the text after it).
 * @param {import('mdast').Content[]} nodes
 * @returns {{ h1: number, marker: string, remove: number[], replace: { index: number, markdown: string } } | null} */
export function frontBannerPlan(nodes) {
  const h1 = nodes.findIndex((n) => n.type === 'heading' && n.depth === 1);
  if (h1 < 0) return null;
  // The H1 has settings already (a marker, or a label and a marker, before it): they stay the owner's.
  const before = htmlOf(nodes[h1 - 1]);
  if (parseMarker(before) !== null || (isLabelLine(before) && parseMarker(htmlOf(nodes[h1 - 2])) !== null)) return null;
  let at = -1;
  for (let i = h1 + 1; i < nodes.length && at < 0; i++) {
    const node = nodes[i];
    if (node.type === 'heading' && node.depth <= 2) return null;
    const html = htmlOf(node);
    if (!html) continue;
    if (parseBlock(html, ['hero'])) at = i;
    else if (parseBlock(html) || parseMarker(html) !== null || isLabelLine(html)) return null;
  }
  if (at < 0) return null;
  const props = parseBlock(htmlOf(nodes[at]), ['hero']).props;
  if (props.hidden) return null;
  const [text, from] = cutAtBlock(String(props.text ?? ''), 'buttons');
  if (text.match(HEADING)?.[1]?.trim()) return null;
  const [line = '', ...rest] = from ? from.split('\n') : [];
  const buttons = parseBlock(line, ['buttons'])?.props;
  let own = text;
  let after = rest.join('\n');

  // The picture: the first one, in the text above the Banner, else in its own text (before the buttons, else after them).
  const inLead = nodes.findIndex((n, i) => i > h1 && i < at && hasPicture(n));
  let picture;
  let moved = -1;
  const remove = [];
  if (inLead >= 0) {
    const image = findImage(nodes[inLead]);
    picture = {
      src: image.url,
      alt: image.alt ?? '',
      markdown: `![${(image.alt ?? '').replace(/[[\]]/g, '\\$&')}](${image.url}${image.title ? ` "${image.title}"` : ''})`,
    };
    moved = pictureOnly(nodes[inLead]) ? inLead : -1;
    if (moved < 0 && props.placement === 'behind') return null;
    // Beside the text, in a paragraph with other text, it stays there.
    if (moved < 0) delete picture.markdown;
  } else {
    const m = own.match(PICTURE) ?? after.match(PICTURE);
    if (m) {
      picture = { src: m[2], alt: unescape(m[1]), markdown: m[0] };
      if (own.match(PICTURE)) own = own.replace(PICTURE, '');
      else after = after.replace(PICTURE, '');
    }
  }
  const { src, decorative } = picture ? splitPicture(picture.src) : {};
  const behind = props.placement === 'behind' && !!picture;
  // A picture behind the text goes to the marker; a picture beside it is below the text and the buttons, as the Banner showed it on a
  // phone (a picture in a paragraph with text stays where it is).
  if (moved >= 0) remove.push(moved);
  const full = props.width === 'full';
  const marker = behind
    ? markerHtml({ color: '', picture: src, alt: decorative ? '' : picture.alt, width: full ? 'full' : undefined })
    : markerHtml({ color: full ? 'surface' : '', width: full ? 'full' : undefined });
  const markdown = [tidy(own), buttons && blockHtml('buttons', buttons), tidy(after), !behind && picture?.markdown]
    .filter(Boolean)
    .join('\n\n');
  return { h1, marker, remove, replace: { index: at, markdown } };
}

// The first image in a node, as its address and description.
function findImage(node) {
  if (node.type === 'image') return node;
  for (const child of node.children ?? []) {
    const found = findImage(child);
    if (found) return found;
  }
  return null;
}

/** The text with its top Banner made a section, or the text as it is when there is none to migrate.
 * @param {string} markdown */
export function migrateFrontBanner(markdown) {
  const source = String(markdown ?? '');
  if (!source.includes('data-block="hero"')) return source;
  const nodes = parser.parse(source).children;
  const plan = frontBannerPlan(nodes);
  if (!plan) return source;
  const edits = [];
  const start = (i) => nodes[i].position.start.offset;
  const gone = (i) => ({ from: start(i), to: i + 1 < nodes.length ? start(i + 1) : source.length, text: '' });
  if (plan.marker) edits.push({ from: start(plan.h1), to: start(plan.h1), text: `${plan.marker}\n\n` });
  for (const i of plan.remove) edits.push(gone(i));
  const { index, markdown: text } = plan.replace;
  edits.push(text ? { from: start(index), to: nodes[index].position.end.offset, text } : gone(index));
  let result = source;
  for (const e of edits.sort((a, b) => b.from - a.from)) result = result.slice(0, e.from) + e.text + result.slice(e.to);
  return result.trimEnd() + (source.endsWith('\n') ? '\n' : '');
}

/** The same on a tree: the top-level nodes of the text with its top Banner made a section.
 * @param {import('mdast').Root} tree */
export function remarkFrontBanner(tree) {
  const nodes = tree.children;
  if (!nodes.some((n) => htmlOf(n).includes('data-block="hero"'))) return;
  const plan = frontBannerPlan(nodes);
  if (!plan) return;
  const parse = (markdown) => (markdown ? parser.parse(markdown).children : []);
  tree.children = nodes.flatMap((node, i) => {
    if (plan.remove.includes(i)) return [];
    const before = i === plan.h1 ? parse(plan.marker) : [];
    if (i === plan.replace.index) return parse(plan.replace.markdown);
    return [...before, node];
  });
}
