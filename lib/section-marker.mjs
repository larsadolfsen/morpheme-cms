// The settings of a section of a page or blog post (the *Section settings* button on an H2): in the Markdown a line of HTML right
// before the H2 (or before the label above it), e.g. <div data-section="primary" data-picture="/images/a.jpg" data-alt="A field"
// data-width="full"></div>. The colour is one of the theme's own, by name; the picture and the width are optional. Exposes
// isSafePicture, rebuiltAddress, SECTION_COLORS, SECTION_WIDTHS, parseMarker, markerHtml, sectionMarker, markerColor, MARKER_TAG and isLabelLine. Reads the
// names of before (`tint` is `surface`, `accent` is `primary`), so no page changes look. Depends on lib/eyebrow.mjs; no React or browser.
import { eyebrowText } from './eyebrow.mjs';

/** The colours, by the theme colour they are: --block-surface and the three accents (--block-primary, --block-secondary,
 * --block-tertiary, which a theme maps to its primary, secondary and tertiary colours). */
export const SECTION_COLORS = ['surface', 'primary', 'secondary', 'tertiary'];

/** The colours of earlier versions, and the colour each is read as. `tint` was a light grey box, now `surface`. */
export const FORMER_COLORS = { tint: 'surface', accent: 'primary' };

/** The width of a section's background: across the whole window, or as wide as the text (the default, no value). */
export const SECTION_WIDTHS = ['full'];

// The tag as written, or as the site's HTML pipeline writes it again (a space before `>` is tolerated). Its source has no
// capture groups of its own: text-sections.mjs and without-h1.mjs put it in their own patterns.
const ATTRIBUTE = String.raw`\s+data-(?:picture|alt|width)="[^"]*"`;
export const MARKER_TAG = String.raw`<div data-section="[^"]*"(?:${ATTRIBUTE})*\s*><\/div>`;

const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unescape = (s) =>
  s
    .replace(/&quot;|&#34;|&#x22;/gi, '"')
    .replace(/&lt;|&#60;|&#x3c;/gi, '<')
    .replace(/&gt;|&#62;|&#x3e;/gi, '>')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&amp;|&#38;|&#x26;/gi, '&');

/** Whether a section's picture is an address the site and the editor may draw: a path on the site (`/images/a.jpg`, not `//host`),
 * or an https address. Never a script or data address, and nothing that could leave an attribute (quotes, angle brackets, a
 * backslash, a control character) or climb out of the site's folders (`..`). @param {unknown} src @returns {boolean} */
export function isSafePicture(src) {
  if (typeof src !== 'string' || src.length === 0 || src.length > 2048) return false;
  if (/["'<>`\\\u0000-\u001f\u007f]/.test(src) || /(^|\/)\.\.(\/|$|[?#])/.test(src)) return false;
  if (src.startsWith('/')) return !src.startsWith('//');
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && url.hostname !== '' && !url.username && !url.password;
  } catch {
    return false;
  }
}

// The characters of an address the editor draws: letters, digits and the marks of a URL, never a quote, an angle bracket, a
// backtick, a backslash or a space.
const ADDRESS_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~:/?#[]@!$&()*+,;=%';

/** The same address written again one character at a time from the allowed ones (each character is taken from the list above,
 * not from the address), or null when it has a character outside the list. @param {string} address @returns {string | null} */
export function rebuiltAddress(address) {
  let out = '';
  for (const char of address) {
    const at = ADDRESS_CHARS.indexOf(char);
    if (at < 0) return null;
    out += ADDRESS_CHARS[at];
  }
  return out;
}

/** The colour a name is: the theme's, a former one as what it became, or null. @param {string | null | undefined} name @returns {string | null} */
export const colorOf = (name) => {
  const color = FORMER_COLORS[name] ?? name;
  return SECTION_COLORS.includes(color) ? color : null;
};

/** What a piece of HTML is the marker of: { color, picture?, alt?, width? } (color '' for a section with only a picture), or null
 * when it is no marker, or its colour is unknown and it has no picture to keep it.
 * @param {string} html
 * @returns {{ color: string, picture?: string, alt?: string, width?: 'full' } | null} */
export function parseMarker(html) {
  const tag = String(html).trim();
  if (!new RegExp(`^${MARKER_TAG}$`).test(tag)) return null;
  const color = colorOf(tag.match(/^<div data-section="([^"]*)"/)?.[1]);
  const attribute = (name) => {
    const m = tag.match(new RegExp(`\\sdata-${name}="([^"]*)"`));
    return m ? unescape(m[1]) : undefined;
  };
  // A picture that is not a safe address is dropped: the section stays, with its colour and no picture.
  const given = attribute('picture');
  const picture = given && isSafePicture(given) ? given : undefined;
  const width = attribute('width') === 'full' ? 'full' : undefined;
  if (color === null && !picture) return null;
  const alt = attribute('alt');
  return { color: color ?? '', ...(picture ? { picture, ...(alt ? { alt } : {}) } : {}), ...(width ? { width } : {}) };
}

/** The marker line of a section's settings (nothing when there are none). color: '' for none.
 * @param {{ color?: string | null, picture?: string | null, alt?: string | null, width?: string | null }} settings */
export function markerHtml({ color, picture, alt, width }) {
  const name = colorOf(color) ?? '';
  if (!name && !picture) return '';
  return (
    `<div data-section="${name}"` +
    (picture ? ` data-picture="${escape(picture)}"` : '') +
    (picture && alt ? ` data-alt="${escape(alt)}"` : '') +
    (width === 'full' ? ' data-width="full"' : '') +
    '></div>'
  );
}

/** The marker line of a colour. @param {string} color */
export const sectionMarker = (color) => markerHtml({ color });

/** The colour a piece of HTML is the marker of, or null (also for a colour the theme has not, and a marker with only a picture).
 * @param {string} html @returns {string | null} */
export const markerColor = (html) => parseMarker(html)?.color || null;

/** Whether a piece of HTML is the line of a label above a heading (lib/eyebrow.mjs). @param {string} html */
export const isLabelLine = (html) => eyebrowText(html) !== null;
