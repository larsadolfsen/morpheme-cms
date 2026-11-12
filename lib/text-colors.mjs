// The colours a word or more of a text can have (the colour button over a selection, MarkdownEditor.tsx): only the
// site's own colours, by name, so the text follows the theme and dark mode. In the Markdown it is HTML around the text,
//   # The early applicant gets <span class="color-accent">the interview</span>
// which every Markdown reader shows (Astro's, GitHub's), and the editor reads and writes back as it was (markdown.mjs).
// How a colour looks is the standard theme's blocks.css (.color-accent, .color-muted), which every theme imports. No
// React or browser here: the site and the checks use it too.

/** The colours, by the name of the site's colour they are ("Theme" › "Colors"): the accent and the quiet text's. */
export const TEXT_COLORS = ['accent', 'muted'];

/** The class of a colour (`color-accent`). */
export const colorClass = (name) => `color-${name}`;

/** The HTML that starts a colour, and the one that ends it. */
export const colorOpen = (name) => `<span class="${colorClass(name)}">`;
export const COLOR_CLOSE = '</span>';

const OPEN = new RegExp(`^<span class="color-(${TEXT_COLORS.join('|')})">$`);
const COLORED = new RegExp(`<span class="color-(${TEXT_COLORS.join('|')})">([\\s\\S]*?)</span>`, 'g');

/** The colour a piece of HTML starts (`<span class="color-accent">`: 'accent'), or null. */
export const colorOpened = (html) => String(html).match(OPEN)?.[1] ?? null;

/** A text without its colours, their text kept. */
export const withoutColors = (s) => String(s).replace(COLORED, '$2');

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A text with colours as HTML: its colours as they are, the rest made plain text by `plain` (a heading's, without
 * Markdown) and escaped. 'Get <span class="color-accent">*the interview*</span>' with a `plain` without the stars is
 * 'Get <span class="color-accent">the interview</span>'. Undefined for a text without colours. */
export function coloredHtml(s, plain) {
  let some = false;
  // Each colour as a mark that no text has, while the text is made plain.
  const marked = String(s).replace(COLORED, (_, color, text) => {
    some = true;
    return `\uE000${TEXT_COLORS.indexOf(color)}${text}\uE001`;
  });
  if (!some) return undefined;
  return escape(plain(marked))
    .replace(/\uE000(\d)/g, (_, i) => colorOpen(TEXT_COLORS[Number(i)]))
    .replace(/\uE001/g, COLOR_CLOSE);
}
