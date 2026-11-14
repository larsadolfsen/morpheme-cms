// The rows of the Text style menu and of the lists in the text's bar (MarkdownEditor.tsx), from what applies at the cursor
// (activeOf's names). Rows that do not apply are hidden, not disabled (owner decision, 13 Nov, spec section 3): in a list item the heading rows
// and Quote are hidden (a heading or a quote would lift the item out of its list), in a heading the list rows and Quote are hidden (each would
// turn the heading into text). A size stays in both. Exposes styleRows(active, levels), listRows(active), inListItem(active), inHeading(active).
// No browser.

const LISTS = ['bullet', 'check', 'ordered'];
const HEADINGS = ['h1', 'h2', 'h3'];

/** Whether the cursor is in a list item. @param {Iterable<string>} active */
export const inListItem = (active) => LISTS.some((name) => new Set(active).has(name));

/** Whether the cursor is in a heading. @param {Iterable<string>} active */
export const inHeading = (active) => HEADINGS.some((name) => new Set(active).has(name));

/**
 * The rows of the Text style menu, in order: the heading levels the text may have (`levels`: 1, 2, 3), a divider ('-'), then the body sizes (the largest first, as the headings: Body large, medium, small),
 * Label (where the line can be one) and Quote. Ids: 'h1' ... 'h3', '-', 'large', 'medium', 'small', 'label', 'quote'.
 * @param {Iterable<string>} active
 * @param {number[]} levels
 * @returns {string[]}
 */
export function styleRows(active, levels) {
  const on = new Set(active);
  const list = inListItem(on);
  const heading = inHeading(on);
  const rows = list ? [] : levels.map((level) => `h${level}`);
  if (rows.length) rows.push('-');
  rows.push('large', 'medium', 'small');
  if (!list && on.has('labelable')) rows.push('label');
  // The quote stands apart from the body styles, behind its own divider.
  if (!list && !heading) rows.push('-', 'quote');
  return rows;
}

/** The list rows (Bulleted, Check, Numbered): none in a heading. @param {Iterable<string>} active @returns {string[]} */
export const listRows = (active) => (inHeading(active) ? [] : LISTS);
