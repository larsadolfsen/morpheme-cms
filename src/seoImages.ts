// The images of a page's or a post's text for the SEO rating (seo.ts): their alternative texts, and the one rule for an image
// in use (altUseOk). Pure (no i18n), so node --test can run it. Exposes images, altUseOk, outsideCode, paragraphs, plain, LABEL and DEST.
import { decorativeOf } from '../lib/crop.mjs';
import { blocksIn } from '../lib/blocks.mjs';
import { MARKER_TAG, parseMarker } from '../lib/section-marker.mjs';

export const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/** The lines of a text outside fenced code, with their numbers. */
export function outsideCode(body: string): { line: string; at: number }[] {
  const lines = body.split(/\r?\n/);
  const out: { line: string; at: number }[] = [];
  let fence: string | null = null;
  lines.forEach((line, at) => {
    const opens = FENCE.exec(line)?.[1];
    if (fence) {
      if (opens && opens[0] === fence[0] && opens.length >= fence.length) fence = null;
    } else if (opens) fence = opens;
    else out.push({ line, at });
  });
  return out;
}

/** Markdown as plain text: without links' addresses, images and the marks for bold, italic and code. */
export function plain(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]+/g, '')
    .replace(/\\(.)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The text of a body outside fenced code, code spans and HTML comments, in paragraphs, so a link or an image
 * is never read across two of them. */
export function paragraphs(body: string): string[] {
  const kept = new Set(outsideCode(body).map(({ at }) => at));
  return body
    .split(/\r?\n/)
    .map((line, at) => (kept.has(at) ? line : ''))
    .join('\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\n[ \t]*\n/)
    .map((p) => p.replace(/(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g, ''));
}

// A link's or an image's text in brackets (with escapes and one level of brackets in it, as an image in a link),
// and its address in parentheses (maybe in <>, with a title after it), as Milkdown writes them: the text the first
// group, the address the second.
export const LABEL = String.raw`((?:\\.|[^\\\[\]]|\[(?:\\.|[^\\\[\]])*\])*)`;
export const DEST = String.raw`\(\s*(<[^>\n]*>|(?:\\.|[^\\()\s]|\((?:\\.|[^\\()\s])*\))*)(?:\s+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^()\\])*\)))?\s*\)`;
const IMAGE = new RegExp(String.raw`(?<!\\)!\[${LABEL}\]${DEST}`, 'g');
const IMG = /(?<!\\)<img\b[^>]*>/gi;
const ALT = /\salt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;

/** The one rule for an image in use: it is fine when it is decorative (marked so), or has an alternative text of its own
 * where it is used (`alt`), or else the base alternative text of its record in the Library (`base`, when the caller knows
 * one); otherwise it is missing. Nothing is ever made up. */
export const altUseOk = ({ alt, decorative, base }: { alt?: string; decorative?: boolean; base?: string }): boolean =>
  !!decorative || !!alt?.trim() || !!base?.trim();

type ImageUse = { alt: string; decorative: boolean };

// A block's line, and a section's marker line (its image is the section's).
const BLOCK_LINE = /<div data-block="[^"]*"[^>]*><\/div>/g;
const MARKER_LINE = new RegExp(MARKER_TAG, 'g');

/** The images in a Markdown text (`![…](…)`, and `<img>` in its HTML), blocks and section markers left out. */
function textImages(body: string): ImageUse[] {
  return paragraphs(body.replace(BLOCK_LINE, '').replace(MARKER_LINE, '')).flatMap((p) => [
    ...[...p.matchAll(IMAGE)].map((m) => ({
      alt: plain(m[1]),
      decorative: decorativeOf(m[2].replace(/^<(.*)>$/, '$1')).decorative,
    })),
    ...[...p.matchAll(IMG)].map((m) => {
      const attribute = ALT.exec(m[0]);
      const alt = (attribute?.[1] ?? attribute?.[2] ?? attribute?.[3] ?? '').trim();
      return { alt, decorative: !!attribute && !alt };
    }),
  ]);
}

/** Every text (string) in a block's props, however deep. */
const stringsIn = (value: unknown): string[] =>
  typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(stringsIn) : [];

/** The images in a text, each by its alternative text, as plain text (empty when it has none), and whether it is decorative:
 * marked so in its address ("Decorative image", crop.mjs), or in HTML with alt="". Counted: the images of the Markdown, the
 * image behind a section (its description in the section's settings, never decorative), and the images in the texts of the
 * blocks (the Markdown in their props, also in a block inside a block). A Cards block's images have no description field (the
 * site draws them with an empty one), so they are not counted. */
export function images(body: string): ImageUse[] {
  const found = textImages(body);
  for (const p of paragraphs(body)) {
    for (const line of p.split('\n')) {
      const marker = parseMarker(line);
      if (marker?.image) found.push({ alt: marker.alt ?? '', decorative: false });
    }
    for (const block of blocksIn(p, true)) found.push(...stringsIn(block.props).flatMap(textImages));
  }
  return found;
}
