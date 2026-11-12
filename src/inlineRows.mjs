// The items of a block typed in place (InlineItems.tsx; the List's rows, a card's title and text ...), as plain functions on the block's
// list: which item is empty, an item's field set, an item added (above, below, or the next empty one after the last), moved or dropped.
// Each returns new items (the old ones are not changed). An item is an object of strings (the List's { icon?, title, text?, href? });
// a field that is empty is not kept, except the first typed one (`first`, "title" unless a block says otherwise), which stays while it is
// typed. No dependencies, no browser.

/** @typedef {Record<string, unknown>} Row */

/** Has content: a text, a list or an object with some, or a switch that is on (a card's `featured`, its `buttons`, its `features`). */
const has = (v) =>
  typeof v === 'string'
    ? v.trim() !== ''
    : Array.isArray(v)
      ? v.some(has)
      : v && typeof v === 'object'
        ? Object.values(v).some(has)
        : v === true;

/** A row with nothing in it (no icon, link, heading or text: an icon or a link counts as content; any field with text does). @param {Row | undefined} row */
export const isEmptyRow = (row) => !row || !Object.values(row).some(has);

/** The rows without the completely empty ones. @param {Row[]} rows */
export function withoutEmpty(rows) {
  const kept = rows.filter((r) => !isEmptyRow(r)).map(tidy);
  return kept.length === rows.length && kept.every((r, i) => r === rows[i]) ? rows : kept;
}

/** A row without the empty lines of a list of texts in it (a price card's points); the same row when it has none. @param {Row} row */
const tidy = (row) => {
  const lists = Object.entries(row).filter(([, v]) => Array.isArray(v) && v.some((x) => typeof x === 'string' && !has(x)));
  if (!lists.length) return row;
  return { ...row, ...Object.fromEntries(lists.map(([k, v]) => [k, v.filter((x) => typeof x !== 'string' || has(x))])) };
};

/** The rows with one field of a row set (a row at the end, past the last, is the next empty one: it becomes a row). A field that is
 * emptied is left out of the row, but the title stays as typed.
 * @param {Row[]} rows @param {number} i @param {string} field @param {unknown} value @param {string} [first] the field that stays as typed */
export function setField(rows, i, field, value, first = 'title') {
  // (a value is a text, or what a settings sheet keeps as it is: a switch or a list.)
  const next = rows.slice();
  const row = { ...(next[i] ?? { [first]: '' }), [field]: value };
  if (field !== first && !has(value)) delete row[field];
  if (typeof row[first] !== 'string') row[first] = '';
  next[Math.min(i, next.length)] = row;
  return next;
}

/** An empty row put in at `at` (0 to rows.length). @param {Row[]} rows @param {number} at @param {string} [first] */
export const addAt = (rows, at, first = 'title') => [...rows.slice(0, at), { [first]: '' }, ...rows.slice(at)];

/** The lines of a pasted text, each to be one item (a list copied from a document), or null when the paste is left as it is: fewer than
 * two lines, or a heading among them (`#` in the text, or h1 to h6 in the html a document gives). A list marker at the start of a line
 * (`-`, `*`, `•`, `1.`) is not part of the line. @param {string} text @param {string} [html] @returns {string[] | null} */
export function linesFromPaste(text, html = '') {
  const lines = String(text ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;
  if (/<h[1-6][\s>]/i.test(html) || lines.some((l) => /^#{1,6}\s/.test(l))) return null;
  return lines.map((l) => l.replace(/^(?:[-*•]|\d+[.)])\s+/, ''));
}

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
