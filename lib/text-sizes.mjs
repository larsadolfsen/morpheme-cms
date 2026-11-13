// A word or more of a text, or the text of a list item, in a smaller or larger body size (the T menu of the editor in a list: a list item
// cannot be a Body small or Body large block, so its text has the size). In the Markdown it is HTML around the text,
//   - <span class="body-small">Opening hours may change</span>
// which every Markdown reader shows and the editor reads and writes back as it was (src/markdown.mjs). How it looks is the theme's
// `.prose .body-small` and `.prose .body-large` (blocks.css), the same classes as the lines of lib/body-size.mjs and lib/body-large.mjs.
// Body medium is the plain text. No React or browser here: the site and the checks use it too.

/** The sizes written as HTML around the text; Body medium is the plain text. */
export const TEXT_SIZES = ['small', 'large'];

/** The class of a size (`body-small`). */
export const sizeClass = (name) => `body-${name}`;

/** The HTML that starts a size, and the one that ends it. */
export const sizeOpen = (name) => `<span class="${sizeClass(name)}">`;
export const SIZE_CLOSE = '</span>';

const OPEN = new RegExp(`^<span class="body-(${TEXT_SIZES.join('|')})">$`);

/** The size a piece of HTML starts (`<span class="body-small">`: 'small'), or null. */
export const sizeOpened = (html) => String(html).match(OPEN)?.[1] ?? null;
