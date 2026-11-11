// An intro paragraph in a text ("Body large", the T menu of the editor): in the Markdown a line of HTML,
// <p class="body-large">Welcome to us</p>, which every Markdown reader shows and the editor reads and writes back as it
// was (src/bodyLarge.mjs); the theme draws it in Material 3's body-large role (.body-large, blocks.css). Exposes
// BODY_LARGE_CLASS, bodyLargeHtml and bodyLargeText. No dependencies, no browser.

/** The class of an intro paragraph. */
export const BODY_LARGE_CLASS = 'body-large';

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const LINE = new RegExp(`^<p class="${BODY_LARGE_CLASS}">([^<]*)</p>$`);

/** The line of HTML of an intro paragraph with this text. @param {string} text */
export const bodyLargeHtml = (text) => `<p class="${BODY_LARGE_CLASS}">${escape(String(text))}</p>`;

/** The text of an intro paragraph's line of HTML, or null for any other HTML, and for a line the editor would not write
 * back the same. @param {string} html @returns {string | null} */
export function bodyLargeText(html) {
  const line = String(html).trim();
  const found = line.match(LINE);
  if (!found) return null;
  const text = unescape(found[1]);
  return bodyLargeHtml(text) === line ? text : null;
}
