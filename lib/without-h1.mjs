// A page's text as HTML without its H1, which the layout draws in its own place (above the picture, PageLayout.astro), and the
// colour of the H1's section (the marker before it, lib/section-marker.mjs). Exposes withoutH1 and h1SectionColor (pure); the H1
// is the first one wherever it stands, as pageH1 (src/sections.mjs) reads it. Depends on text-sections.mjs and section-marker.mjs.
import { LABEL, MARKER } from './text-sections.mjs';
import { markerColor } from './section-marker.mjs';

// The first <h1>…</h1> and the white space after it, with the marker before it and the label between them, if any.
const H1 = new RegExp(`(?:${MARKER})?(${LABEL})<h1\\b[^>]*>[\\s\\S]*?<\\/h1>\\s*`);

/** The html without its first <h1>…</h1> and the white space after it, and without the marker before it (a label above it
 * stays in the text).
 * @param {string} html
 * @returns {string} */
export const withoutH1 = (html) => html.replace(H1, (_, __, label) => label);

/** The colour of the section the first H1 starts (the marker before it, or before the label above it), or null.
 * @param {string} html
 * @returns {string | null} */
export const h1SectionColor = (html) => {
  const tag = html.match(H1)?.[1];
  return tag ? markerColor(tag) : null;
};
