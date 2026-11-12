// The items of a block typed in place (InlineItems.tsx; the List's rows, a card's title and text ...), as plain functions on the block's
// list: which item is empty, an item's field set, an item added (above, below, or the next empty one after the last), moved or dropped.
// Each returns new items (the old ones are not changed). An item is an object of strings (the List's { icon?, title, text?, href? });
// a field that is empty is not kept, except the first typed one (`first`, "title" unless a block says otherwise), which stays while it is
// typed. No dependencies, no browser.

/** @typedef {Record<string, unknown>} Row */

const has = (v) => (typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) && v.length > 0);

/** A row with nothing in it (no icon, link, heading or text: an icon or a link counts as content; any field with text does). @param {Row | undefined} row */
export const isEmptyRow = (row) => !row || !Object.values(row).some(has);

/** The rows without the completely empty ones. @param {Row[]} rows */
export const withoutEmpty = (rows) => (rows.some(isEmptyRow) ? rows.filter((r) => !isEmptyRow(r)) : rows);

/** The rows with one field of a row set (a row at the end, past the last, is the next empty one: it becomes a row). A field that is
 * emptied is left out of the row, but the title stays as typed.
 * @param {Row[]} rows @param {number} i @param {string} field @param {unknown} value @param {string} [first] the field that stays as typed */
export function setField(rows, i, field, value, first = 'title') {
  // `value` is a text, or a list (a row's buttons) that is kept while it has an entry.
  const next = rows.slice();
  const row = { ...(next[i] ?? { [first]: '' }), [field]: value };
  if (field !== first && !has(value)) delete row[field];
  if (typeof row[first] !== 'string') row[first] = '';
  next[Math.min(i, next.length)] = row;
  return next;
}

/** An empty row put in at `at` (0 to rows.length). @param {Row[]} rows @param {number} at @param {string} [first] */
export const addAt = (rows, at, first = 'title') => [...rows.slice(0, at), { [first]: '' }, ...rows.slice(at)];

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
