// MIGRATE-ONLY code for the Banner block (type "hero"), which no longer exists (removed in 0.18, #678). It stays because sites
// skip versions: the editor's update goes straight to npm `latest`, so a site on 0.15 or 0.16 never runs 0.17's migrate, and a
// hero left in its text would fail `check:content` ("The block "hero" no longer exists") and undo the update. A migration is
// cumulative: the migrate of each version takes any older supported content to its own form in one run (CLAUDE.md, skill
// `developer`). Never rewrite this to a block, a view or a theme part; no Banner comes back.
//
// What it writes is the form 0.17's migrate wrote (ported unchanged from v0.17.0, lib/front-banner.mjs and
// lib/remark-banner-section.mjs): a Banner alone in its section, or at the top under the page's H1, becomes the section's marker,
// heading, text and Buttons block. 0.18's migrateH1Marker (lib/migrate-content.mjs) then drops an image the H1's marker got
// (docs/superpowers/specs/2026-11-14-no-page-top-image-design.md). A Banner that cannot migrate stays as it is.
// Depends on lib/blocks.mjs, lib/crop.mjs and lib/section-marker.mjs.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { blockHtml, parseBlock } from './blocks.mjs';
import { splitPicture } from './crop.mjs';
import { isLabelLine, markerHtml, parseMarker } from './section-marker.mjs';

const parser = unified().use(remarkParse).use(remarkGfm);
const IMAGE = /!\[((?:\\[\s\S]|[^\]\\])*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
const FRONT_IMAGE = /!\[((?:\\.|[^\]\\])*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
const HEADING = /^ {0,3}##(?!#)(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*(?:\r?\n|$)/;
const unescape = (s) => s.replace(/\\([!-/:-@[-`{-~])/g, '$1');
const tidy = (s) => s.replace(/\n{3,}/g, '\n\n').trim();

// The HTML of a node that is a line of HTML on its own (also inside a paragraph, as Milkdown's reader has it).
const htmlOf = (node) => {
  const only = node?.type === 'paragraph' && node.children?.length === 1 ? node.children[0] : node;
  return only?.type === 'html' ? String(only.value) : '';
};
const hasImage = (node) => JSON.stringify(node.children ?? []).includes('"type":"image"');
const imageOnly = (node) => node.type === 'paragraph' && node.children?.length === 1 && node.children[0].type === 'image';

/** The text before the first block of a type and the rest from it, both trimmed (as 0.17's lib/blocks.mjs cut it).
 * @param {string} markdown @param {string} type @returns {[string, string]} */
function cutAtBlock(markdown, type) {
  const lines = String(markdown ?? '').split('\n');
  const at = lines.findIndex((line) => parseBlock(line, [type]));
  return at < 0 ? [lines.join('\n').trim(), ''] : [lines.slice(0, at).join('\n').trim(), lines.slice(at).join('\n').trim()];
}

/** What to change in a text's top-level nodes to make its top Banner a section, or null when there is none to migrate.
 * `marker`: the marker line to put before the H1 (empty when the Banner had no settings), `remove`: the indexes of nodes to take
 * away (the image behind the text), `replace`: the Banner's node and the Markdown that takes its place (its text, its image
 * when it is beside the text, its Buttons block and the text after it).
 * @param {import('mdast').Content[]} nodes
 * @returns {{ h1: number, marker: string, remove: number[], replace: { index: number, markdown: string } } | null} */
function frontBannerPlan(nodes) {
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

  // The image: the first one, in the text above the Banner, else in its own text (before the buttons, else after them).
  const inLead = nodes.findIndex((n, i) => i > h1 && i < at && hasImage(n));
  let image;
  let moved = -1;
  const remove = [];
  if (inLead >= 0) {
    const node = findImage(nodes[inLead]);
    image = {
      src: node.url,
      alt: node.alt ?? '',
      markdown: `![${(node.alt ?? '').replace(/[\\[\]]/g, '\\$&')}](${node.url}${node.title ? ` "${node.title}"` : ''})`,
    };
    moved = imageOnly(nodes[inLead]) ? inLead : -1;
    if (moved < 0 && props.placement === 'behind') return null;
    // Beside the text, in a paragraph with other text, it stays there.
    if (moved < 0) delete image.markdown;
  } else {
    const m = own.match(FRONT_IMAGE) ?? after.match(FRONT_IMAGE);
    if (m) {
      image = { src: m[2], alt: unescape(m[1]), markdown: m[0] };
      if (own.match(FRONT_IMAGE)) own = own.replace(FRONT_IMAGE, '');
      else after = after.replace(FRONT_IMAGE, '');
    }
  }
  const { src, decorative } = image ? splitPicture(image.src) : {};
  const behind = props.placement === 'behind' && !!image;
  // An image behind the text goes to the marker; an image beside it is below the text and the buttons, as the Banner showed it on a
  // phone (an image in a paragraph with text stays where it is).
  if (moved >= 0) remove.push(moved);
  const full = props.width === 'full';
  const marker = behind
    ? markerHtml({ color: '', image: src, alt: decorative ? '' : image.alt, width: full ? 'full' : undefined })
    : markerHtml({ color: full ? 'surface' : '', width: full ? 'full' : undefined });
  const markdown = [tidy(own), buttons && blockHtml('buttons', buttons), tidy(after), !behind && image?.markdown]
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
function migrateFrontBanner(markdown) {
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

/** The Markdown a Banner's props become: the section's marker, its heading, text, image and Buttons block, and the text after
 * them; null when the Banner is not migrated (hidden, or no heading of its own).
 * @param {Record<string, any>} props `text`, `placement` and `width` of the block
 * @returns {string | null} */
function bannerMarkdown(props) {
  if (props.hidden) return null;
  const [before, from] = cutAtBlock(String(props.text ?? ''), 'buttons');
  const [line = '', ...rest] = from ? from.split('\n') : [];
  const buttons = parseBlock(line, ['buttons'])?.props;
  let text = before;
  let after = rest.join('\n');
  const top = text.match(HEADING);
  const heading = top?.[1]?.trim();
  if (!heading) return null;
  text = text.slice(top[0].length);
  let image;
  const m = text.match(IMAGE) ?? after.match(IMAGE);
  if (m) {
    const { src, decorative } = splitPicture(m[2]);
    image = { src, alt: decorative ? '' : unescape(m[1]), markdown: m[0] };
    if (text.match(IMAGE)) text = text.replace(IMAGE, '');
    else after = after.replace(IMAGE, '');
  }
  const full = props.width === 'full';
  // The image behind the text is the section's background; beside the text it stays an image in the text. Across the whole width
  // without an image behind it the Banner was a band in the tint, which is Surface now.
  const behind = props.placement === 'behind' && image;
  const marker = behind
    ? markerHtml({ color: '', image: image.src, alt: image.alt, width: full ? 'full' : undefined })
    : markerHtml({ color: full ? 'surface' : '', width: full ? 'full' : undefined });
  return [
    marker,
    `## ${heading}`,
    tidy(text),
    !behind && image?.markdown,
    buttons && !buttons.hidden && blockHtml('buttons', buttons),
    tidy(after),
  ]
    .filter(Boolean)
    .join('\n\n');
}

// Whether a Banner at `index` is alone in its section.
const alone = (nodes, index) => {
  const next = nodes[index + 1];
  if (!next) return true;
  if (next.type === 'heading' && next.depth <= 2) return true;
  const html = htmlOf(next);
  return parseMarker(html) !== null || isLabelLine(html);
};

/** The text with each Banner that can migrate written as a section; as it is when there is none.
 * @param {string} source */
export function migrateHeroBlocks(source) {
  if (!source.includes('data-block="hero"')) return source;
  // The top Banner first, as 0.17's migrate did.
  const text = migrateFrontBanner(source);
  const nodes = parser.parse(text).children;
  const edits = [];
  nodes.forEach((node, i) => {
    const hero = parseBlock(htmlOf(node), ['hero']);
    const markdown = hero && alone(nodes, i) ? bannerMarkdown(hero.props) : null;
    if (markdown !== null) edits.push({ from: node.position.start.offset, to: node.position.end.offset, text: markdown });
  });
  let result = text;
  for (const e of edits.sort((a, b) => b.from - a.from)) result = result.slice(0, e.from) + e.text + result.slice(e.to);
  return result;
}
