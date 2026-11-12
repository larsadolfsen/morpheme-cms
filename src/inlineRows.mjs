// The rows of a List typed in place (InlineList.tsx), as plain functions on the block's `items`: which row is empty, a row's field
// set, a row added (above, below, or the next empty one after the last), moved or dropped. Each returns new rows (the old ones are
// not changed). A row is { icon?, title, text?, href? }; a field that is empty is not kept, except the title, which stays while it is typed.
// No dependencies, no browser.

/** @typedef {{ icon?: string; title?: string; text?: string; href?: string }} Row */

const has = (v) => typeof v === 'string' && v.trim() !== '';

/** A row with nothing in it (no icon, link, heading or text: an icon or a link counts as content). @param {Row | undefined} row */
export const isEmptyRow = (row) => !row || !(has(row.icon) || has(row.href) || has(row.title) || has(row.text));

/** The rows without the completely empty ones. @param {Row[]} rows */
export const withoutEmpty = (rows) => (rows.some(isEmptyRow) ? rows.filter((r) => !isEmptyRow(r)) : rows);

/** The rows with one field of a row set (a row at the end, past the last, is the next empty one: it becomes a row). A field that is
 * emptied is left out of the row, but the title stays as typed.
 * @param {Row[]} rows @param {number} i @param {'icon' | 'title' | 'text' | 'href'} field @param {string} value */
export function setField(rows, i, field, value) {
  const next = rows.slice();
  const row = { ...(next[i] ?? { title: '' }), [field]: value };
  if (field !== 'title' && !has(value)) delete row[field];
  if (typeof row.title !== 'string') row.title = '';
  next[Math.min(i, next.length)] = row;
  return next;
}

/** An empty row put in at `at` (0 to rows.length). @param {Row[]} rows @param {number} at */
export const addAt = (rows, at) => [...rows.slice(0, at), { title: '' }, ...rows.slice(at)];

/** The row at `i` dropped. @param {Row[]} rows @param {number} i */
export const removeAt = (rows, i) => rows.filter((_, j) => j !== i);

/** The row at `i` moved one place (-1 up, 1 down); the same rows when it cannot. @param {Row[]} rows @param {number} i @param {-1 | 1} by */
export function moveBy(rows, i, by) {
  const j = i + by;
  if (i < 0 || i >= rows.length || j < 0 || j >= rows.length) return rows;
  const next = rows.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
