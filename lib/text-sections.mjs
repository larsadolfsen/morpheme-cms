// A page's or post's rendered text cut into runs for the site: a section with a colour (the marker before its H1 or H2,
// lib/section-marker.mjs) is one run from the marker to the next H1, H2 or the end. Exposes sectionsOf, introOf,
// sectionClass and the marker and label patterns (MARKER, LABEL), used by theme/components/RichText.astro, lib/without-h1.mjs
// and src/pagePreview.tsx. Depends on section-marker.mjs.
import { MARKER_TAG, parseMarker } from './section-marker.mjs';

// The marker as the site's HTML pipeline writes it (rehype-raw keeps it as written; a space before `>` is tolerated).
// Its one capture group is the tag, which parseMarker reads (colour, picture, width).
export const MARKER = String.raw`(${MARKER_TAG})\s*`;
// A label line (text-menu's <p class="block-eyebrow">) directly before a heading starts the heading's section.
export const LABEL = String.raw`(?:<p class="block-eyebrow">(?:(?!<\/p>)[\s\S])*<\/p>\s*)?`;
// A marker followed by an H1 or H2 (with its label between): where a coloured section starts. Ends just after `<h1` or `<h2`.
const START = new RegExp(`${MARKER}${LABEL}<h[12]\\b`, 'g');
// Where the next section (or an H1) starts: its marker and label if it has them, else its heading.
const NEXT = new RegExp(`(?:${MARKER})?${LABEL}<h[12]\\b`);
const MARKERS = new RegExp(MARKER, 'g');

const withoutMarkers = (html) => html.replace(MARKERS, '');

/** The text's HTML as runs: { color, html } with the marker removed; color is null for text outside a coloured section. A section
 * with a picture or a width has them too (`picture`, `alt`, `width`), and `color` '' when it has no colour. A marker with an
 * unknown colour and no picture, or not followed by an H1 or H2, is dropped. Without any coloured section, the HTML is
 * returned as it came, in one run.
 * @param {string} html
 * @returns {{ color: string | null, picture?: string, alt?: string, width?: 'full', html: string }[]} */
export function sectionsOf(html) {
  /** @type {{ color: string | null, picture?: string, alt?: string, width?: 'full', html: string }[]} */
  const runs = [];
  let from = 0;
  const plain = (to) => {
    const text = withoutMarkers(html.slice(from, to));
    if (text.trim()) runs.push({ color: null, html: text });
  };
  for (const m of html.matchAll(START)) {
    const settings = parseMarker(m[1]);
    if (m.index < from || !settings) continue;
    const heading = m.index + m[0].length;
    const next = html.slice(heading).search(NEXT);
    const to = next < 0 ? html.length : heading + next;
    plain(m.index);
    const { color, picture, alt, width } = settings;
    runs.push({
      color,
      ...(picture ? { picture, ...(alt ? { alt } : {}) } : {}),
      ...(width ? { width } : {}),
      html: withoutMarkers(html.slice(m.index, to)),
    });
    from = to;
  }
  if (!runs.length) return [{ color: null, html: withoutMarkers(html) }];
  plain(html.length);
  return runs;
}

/** The text before its first section starts (a marker, a label or an H1 or H2), and the rest from there. Without a heading
 * the whole text is the intro. For a page whose coloured H1 panel holds the header and this intro (PageLayout.astro).
 * @param {string} html
 * @returns {{ intro: string, rest: string }} */
export function introOf(html) {
  const at = html.search(NEXT);
  return at < 0 ? { intro: html, rest: '' } : { intro: html.slice(0, at), rest: html.slice(at) };
}

/** The classes of a section on the site (blocks.css): its colour, a picture behind it and the whole width of the window.
 * @param {string | null} color @param {{ picture?: string, width?: string }} [settings] */
export const sectionClass = (color, settings = {}) =>
  [
    'text-section',
    color && `text-section-${color}`,
    settings.picture && 'text-section-picture',
    settings.width === 'full' && 'text-section-full',
  ]
    .filter(Boolean)
    .join(' ');
