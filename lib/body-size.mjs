// The smaller body styles of a text ("Body medium" and "Body small", the T menu of the editor): in the Markdown a line of
// HTML, <p class="body-small">Opening hours may change</p>, which every Markdown reader shows and the editor reads and
// writes back as it was (src/bodySize.mjs); the theme draws it in Material 3's body-medium or body-small role (.body-medium,
// .body-small, blocks.css). Body large is the plain paragraph (and lib/body-large.mjs for an older intro paragraph).
// Exposes BODY_SIZES, bodySizeClass, bodySizeHtml and bodySizeText. No dependencies, no browser.

/** The sizes written as a line of HTML; Body large is the plain paragraph. */
export const BODY_SIZES = ['medium', 'small'];

/** The class of a paragraph in this size. @param {string} size */
export const bodySizeClass = (size) => `body-${size}`;

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const LINE = new RegExp(`^<p class="(${BODY_SIZES.map(bodySizeClass).join('|')})">([^<]*)</p>$`);

/** The line of HTML of a paragraph in this size with this text. @param {string} size @param {string} text */
export const bodySizeHtml = (size, text) => `<p class="${bodySizeClass(size)}">${escape(String(text))}</p>`;

/** The size and text of a line of HTML, or null for any other HTML, and for a line the editor would not write back the same.
 * @param {string} html @returns {{ size: string; text: string } | null} */
export function bodySizeText(html) {
  const line = String(html).trim();
  const found = line.match(LINE);
  if (!found) return null;
  const size = found[1].slice('body-'.length);
  const text = unescape(found[2]);
  return bodySizeHtml(size, text) === line ? { size, text } : null;
}
