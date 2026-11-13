// The parts of a "Banner"'s text (its `text`, Markdown), as view.ts and load.ts show them, and a theme's own front
// page (its home/Hero.astro): a heading at the very top ("## …") is its heading (an H2), the first image in it,
// wherever it is, its image, its "Buttons" block its buttons, the text before that block the subtitle and the
// introduction, and the text after it the text under the buttons. Without a "Buttons" block (or with a hidden one) it has
// no buttons, and all of its text is before them. No React here, so the site and the build can use it.
import { cutAtBlock, parseBlock } from '../../../lib/blocks.mjs';
import { splitPicture } from '../../../lib/crop.mjs';
import { plainHeading } from '../../sections.mjs';

export type HeroParts = {
  heading?: string;
  /** The text before the buttons, without its heading and its image (Markdown). */
  text: string;
  /** The image: its own address (without a format, crop or decorative mark) and its description ('' when it is
   * decorative, crop.mjs). */
  image?: { src: string; alt: string };
  /** The props of its "Buttons" block (`items`: its own buttons, else the shared ones); none without one. */
  buttons?: Record<string, unknown>;
  /** The text after the buttons (Markdown). */
  after: string;
};

// An image in Markdown, as Milkdown writes it (with a title, if it has one): its description and its address.
const IMAGE = /!\[((?:\\.|[^\]])*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
const HEADING = /^ {0,3}##(?!#)(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*(?:\r?\n|$)/;
const unescape = (s: string) => s.replace(/\\([!-/:-@[-`{-~])/g, '$1');
const tidy = (s: string) => s.replace(/\n{3,}/g, '\n\n').trim();

/** The parts of a "Banner"'s text. */
export function heroParts(markdown: unknown): HeroParts {
  const [before, from] = cutAtBlock(String(markdown ?? ''), 'buttons');
  const [line = '', ...rest] = from ? from.split('\n') : [];
  const block = parseBlock(line, ['buttons'])?.props as Record<string, unknown> | undefined;
  let text = before;
  let after = rest.join('\n');
  const top = text.match(HEADING);
  const heading = top ? plainHeading(top[1] ?? '') || undefined : undefined;
  if (top) text = text.slice(top[0].length);
  let image: HeroParts['image'];
  const m = text.match(IMAGE) ?? after.match(IMAGE);
  if (m) {
    const { src, decorative } = splitPicture(m[2]);
    image = { src, alt: decorative ? '' : unescape(m[1]) };
    if (text.match(IMAGE)) text = text.replace(IMAGE, '');
    else after = after.replace(IMAGE, '');
  }
  return { heading, text: tidy(text), image, buttons: block && !block.hidden ? block : undefined, after: tidy(after) };
}
