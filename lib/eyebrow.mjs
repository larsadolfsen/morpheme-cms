// A label above a heading in a text ("Label", the label button over a text): in the Markdown a line of HTML right
// before the heading, <p class="block-eyebrow">How it works</p>, which every Markdown reader shows and the editor reads
// and writes back as it was (src/eyebrow.mjs); it looks like a block's label (.block-eyebrow, blocks.css). Exposes
// EYEBROW_CLASS, eyebrowHtml and eyebrowText. No dependencies, no browser.

/** The class of a label, the same as a block's label (BlockHead.tsx). */
export const EYEBROW_CLASS = 'block-eyebrow';

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const LINE = new RegExp(`^<p class="${EYEBROW_CLASS}">([^<]*)</p>$`);

/** The line of HTML of a label with this text. @param {string} text */
export const eyebrowHtml = (text) => `<p class="${EYEBROW_CLASS}">${escape(String(text))}</p>`;

/** The text of a label's line of HTML, or null for any other HTML, and for a label the editor would not write back the
 * same (other HTML or entities in it). @param {string} html @returns {string | null} */
export function eyebrowText(html) {
  const line = String(html).trim();
  const found = line.match(LINE);
  if (!found) return null;
  const text = unescape(found[1]);
  return eyebrowHtml(text) === line ? text : null;
}
