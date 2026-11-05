// A page's or post's rendered text cut into runs for the site: a section with a colour (the marker before its H2,
// lib/section-marker.mjs) is one run from the marker to the next H2, H1 or the end. Exposes sectionsOf and sectionClass,
// used by theme/components/RichText.astro and src/pagePreview.tsx. Depends on section-marker.mjs.
import { SECTION_COLORS } from './section-marker.mjs';

// The marker as the site's HTML pipeline writes it (rehype-raw keeps it as written; a space before `>` is tolerated).
const MARKER = String.raw`<div data-section="([^"]*)"\s*><\/div>\s*`;
// A label line (text-menu's <p class="block-eyebrow">) directly before a heading starts the heading's section.
const LABEL = String.raw`(?:<p class="block-eyebrow">(?:(?!<\/p>)[\s\S])*<\/p>\s*)?`;
// A marker followed by an H2 (with its label between): where a coloured section starts. Ends just after `<h2`.
const START = new RegExp(`${MARKER}${LABEL}<h2\\b`, 'g');
// Where the next section (or an H1) starts: its marker and label if it has them, else its heading.
const NEXT = new RegExp(`(?:${MARKER})?${LABEL}<h[12]\\b`);
const MARKERS = new RegExp(MARKER, 'g');

const withoutMarkers = (html) => html.replace(MARKERS, '');

/** The text's HTML as runs: { color, html } with the marker removed; color is null for text outside a coloured section.
 * A marker with an unknown colour, or not followed by an H2, is dropped. Without any coloured section, the HTML is
 * returned as it came, in one run.
 * @param {string} html
 * @returns {{ color: string | null, html: string }[]} */
export function sectionsOf(html) {
  const runs = [];
  let from = 0;
  const plain = (to) => {
    const text = withoutMarkers(html.slice(from, to));
    if (text.trim()) runs.push({ color: null, html: text });
  };
  for (const m of html.matchAll(START)) {
    if (m.index < from || !SECTION_COLORS.includes(m[1])) continue;
    const heading = m.index + m[0].length;
    const next = html.slice(heading).search(NEXT);
    const to = next < 0 ? html.length : heading + next;
    plain(m.index);
    runs.push({ color: m[1], html: withoutMarkers(html.slice(m.index, to)) });
    from = to;
  }
  if (!runs.length) return [{ color: null, html: withoutMarkers(html) }];
  plain(html.length);
  return runs;
}

/** The classes of a coloured section on the site (blocks.css). */
export const sectionClass = (color) => `text-section text-section-${color}`;
