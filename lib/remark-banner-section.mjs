// The Banner block (type "hero") has become a section: a heading (H2) with its text and buttons, and the section settings of
// lib/section-marker.mjs, a background image and the width of the background. This is the migration, so a text from before keeps
// working on the site, in the editor and in the preview, which write the section when the page is saved (the same way as FORMER in
// lib/blocks.mjs). Exposes remarkBannerSections (a remark plugin: the site's pipeline in astro.mjs, lib/markdown.ts and the editor's
// in src/markdown.mjs) and bannerMarkdown (pure). It reads the Banner's text as src/standard/hero/fields.ts does.
//
// A Banner is migrated only when it stands alone in its section: what follows it is a heading (H1 or H2), a section's marker or the end
// of the text. A section holds everything up to the next heading, so a block or a paragraph after the Banner would move into its
// colour and image and the page would change. Such a Banner, one without a heading of its own that is not at the top of a page, and a
// hidden one stay as they are: the Banner block still works there. A Banner at the top, under the page's H1 (the front page's), is the
// H1's section: lib/front-banner.mjs.
// Depends on lib/blocks.mjs, lib/crop.mjs, lib/eyebrow.mjs and lib/section-marker.mjs.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { blockHtml, cutAtBlock, parseBlock } from './blocks.mjs';
import { splitPicture } from './crop.mjs';
import { remarkFrontBanner } from './front-banner.mjs';
import { isLabelLine, markerHtml, parseMarker } from './section-marker.mjs';

const IMAGE = /!\[((?:\\[\s\S]|[^\]\\])*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
const HEADING = /^ {0,3}##(?!#)(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*(?:\r?\n|$)/;
const unescape = (s) => s.replace(/\\([!-/:-@[-`{-~])/g, '$1');
const tidy = (s) => s.replace(/\n{3,}/g, '\n\n').trim();

/** The Markdown a Banner's props become: the section's marker, its heading, text, image and Buttons block, and the text after
 * them; null when the Banner is not migrated (hidden, or no heading of its own).
 * @param {Record<string, any>} props `text`, `placement` and `width` of the block
 * @returns {string | null} */
export function bannerMarkdown(props) {
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

// Markdown as nodes, as the pipelines read it.
const parse = unified().use(remarkParse).use(remarkGfm);

// The HTML of a node that is a line of HTML on its own (also inside a paragraph, as Milkdown's reader has it).
const htmlOf = (node) => {
  const only = node?.type === 'paragraph' && node.children?.length === 1 ? node.children[0] : node;
  return only?.type === 'html' ? String(only.value) : '';
};

// Whether a Banner at `index` is alone in its section.
export const alone = (nodes, index) => {
  const next = nodes[index + 1];
  if (!next) return true;
  if (next.type === 'heading' && next.depth <= 2) return true;
  const html = htmlOf(next);
  return parseMarker(html) !== null || isLabelLine(html);
};

/** The remark plugin: each Banner that is alone in its section is replaced by the section's nodes, and the Banner at the top of a page,
 * under its H1, by the H1's section (lib/front-banner.mjs). */
export function remarkBannerSections() {
  return (tree) => {
    remarkFrontBanner(tree);
    const nodes = tree.children;
    if (!nodes.some((n) => htmlOf(n).includes('data-block="hero"'))) return;
    tree.children = nodes.flatMap((node, i) => {
      const block = parseBlock(htmlOf(node), ['hero']);
      const markdown = block && alone(nodes, i) ? bannerMarkdown(block.props) : null;
      return markdown === null ? [node] : parse.parse(markdown).children;
    });
  };
}
