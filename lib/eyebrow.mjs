// A label above a heading in a text ("Label", the label button over a text): in the Markdown a line of HTML right
// before the heading, <p class="label-medium">How it works</p>, which every Markdown reader shows and the editor reads
// and writes back as it was (src/eyebrow.mjs); it looks like a block's label (.label-medium, blocks.css). Exposes
// EYEBROW_CLASS, eyebrowHtml and eyebrowText. No dependencies, no browser.

/** The class of a label, Material 3's label-medium role, the same as a block's label (BlockHead.tsx). */
export const EYEBROW_CLASS = 'label-medium';
/** The class a label had before (FORMER): read as a label and written back with EYEBROW_CLASS. */
export const EYEBROW_FORMER_CLASS = 'block-eyebrow';

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const LINE = new RegExp(`^<p class="(?:${EYEBROW_CLASS}|${EYEBROW_FORMER_CLASS})">([^<]*)</p>$`);

/** The line of HTML of a label with this text. @param {string} text */
export const eyebrowHtml = (text) => `<p class="${EYEBROW_CLASS}">${escape(String(text))}</p>`;

/** The text of a label's line of HTML (in its class or its former one), or null for any other HTML, and for a label the
 * editor would not write back the same (other HTML or entities in it). @param {string} html @returns {string | null} */
export function eyebrowText(html) {
  const line = String(html).trim();
  const found = line.match(LINE);
  if (!found) return null;
  const text = unescape(found[1]);
  const written = eyebrowHtml(text);
  return written === line || written.replace(EYEBROW_CLASS, EYEBROW_FORMER_CLASS) === line ? text : null;
}
