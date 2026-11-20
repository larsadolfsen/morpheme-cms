// A label above a heading in a text ("Label", the label button over a text): in the Markdown a line of HTML right
// before the heading, <p class="mo-type-label-medium">How it works</p>, which every Markdown reader shows and the editor reads
// and writes back as it was (src/eyebrow.mjs); it looks like a block's label (.mo-type-label-medium, prose.css). Exposes
// EYEBROW_CLASS, eyebrowHtml and eyebrowText. No dependencies, no browser.

/** The class of a label, Material 3's label-medium role, the same as a block's label (BlockHead.tsx). */
export const EYEBROW_CLASS = 'mo-type-label-medium';

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const LINE = new RegExp(`^<p class="${EYEBROW_CLASS}">([^<]*)</p>$`);

/** The line of HTML of a label with this text. @param {string} text */
export const eyebrowHtml = (text) => `<p class="${EYEBROW_CLASS}">${escape(String(text))}</p>`;

/** The text of a label's line of HTML (in its class), or null for any other HTML, and for a label the
 * editor would not write back the same (other HTML or entities in it). @param {string} html @returns {string | null} */
export function eyebrowText(html) {
  const line = String(html).trim();
  const found = line.match(LINE);
  if (!found) return null;
  const text = unescape(found[1]);
  return eyebrowHtml(text) === line ? text : null;
}

/** A text whose last paragraph is a label, split into the text before it and the label's text: the label belongs to what
 * comes next (the front page puts it in that section, so a section's space does not come between them). Without a label
 * at the end: `{ body: markdown, label: null }`. @param {string} markdown @returns {{ body: string, label: string | null }} */
export function splitTrailingEyebrow(markdown) {
  const text = String(markdown).trimEnd();
  const cut = text.lastIndexOf('\n\n');
  const last = cut < 0 ? text : text.slice(cut + 2);
  const label = eyebrowText(last);
  if (label === null) return { body: String(markdown), label: null };
  return { body: cut < 0 ? '' : text.slice(0, cut).trimEnd(), label };
}
