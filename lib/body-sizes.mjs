// The two smaller body styles of a text ("Body medium" and "Body small", the T menu of the editor; the plain paragraph is "Body large",
// Material 3's largest body role, the site's default text): in the Markdown a line of HTML, <p class="body-medium">Text</p>, which every
// Markdown reader shows and the editor reads and writes back as it was (src/bodySize.mjs); the theme draws it in Material 3's role of
// that name (.body-medium, .body-small, blocks.css). Exposes BODY_SIZES, bodySizeHtml and bodySizeText. No dependencies, no browser.

/** The styles: the editor's node and the class on the site. */
export const BODY_SIZES = [
  { node: 'bodyMedium', className: 'body-medium' },
  { node: 'bodySmall', className: 'body-small' },
];

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** The line of HTML of a paragraph of this class with this text. @param {string} className @param {string} text */
export const bodySizeHtml = (className, text) => `<p class="${className}">${escape(String(text))}</p>`;

/** The style and text of a body style's line of HTML, or null for any other HTML, and for a line the editor would not write back
 * the same. @param {string} html @returns {{ node: string, text: string } | null} */
export function bodySizeText(html) {
  const line = String(html).trim();
  for (const { node, className } of BODY_SIZES) {
    const found = line.match(new RegExp(`^<p class="${className}">([^<]*)</p>$`));
    if (!found) continue;
    const text = unescape(found[1]);
    return bodySizeHtml(className, text) === line ? { node, text } : null;
  }
  return null;
}
