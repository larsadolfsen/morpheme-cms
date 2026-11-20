// The cells of a block typed in place as a grid (the Table's InlineTable.tsx): rows of one-line texts, as plain functions that return new rows
// (the old ones are not changed). A cell past the last row or column is the next, empty one: typing in it makes the row or the column. The
// grid is at least one row and one column. No dependencies, no browser.

/** @typedef {string[][]} Grid */

const width = (/** @type {Grid} */ rows) => Math.max(1, ...rows.map((r) => r.length));
const rectangle = (/** @type {Grid} */ rows) => {
  const w = width(rows);
  return rows.map((r) => [...r, ...Array(w - r.length).fill('')]);
};

/** The grid with a cell set; a cell in the next row or the next column grows the grid by it. @param {Grid} rows @param {number} r @param {number} c @param {string} value */
export function setCell(rows, r, c, value) {
  const w = Math.max(width(rows), c + 1);
  const next = rectangle(rows.length ? rows : [['']]).map((row) => [...row, ...Array(w - row.length).fill('')]);
  while (next.length <= r) next.push(Array(w).fill(''));
  next[r][c] = value;
  return next;
}

/** An empty row put in at `at` (0 to rows.length). @param {Grid} rows @param {number} at */
export const addRowAt = (rows, at) => {
  const full = rectangle(rows);
  return [...full.slice(0, at), Array(width(full)).fill(''), ...full.slice(at)];
};

/** An empty column put in at `at` (0 to the number of columns). @param {Grid} rows @param {number} at */
export const addColumnAt = (rows, at) => rectangle(rows).map((r) => [...r.slice(0, at), '', ...r.slice(at)]);

/** The row at `r` dropped; the last one is only emptied (a table has a row). @param {Grid} rows @param {number} r */
export const removeRowAt = (rows, r) => {
  const full = rectangle(rows);
  return full.length <= 1 ? [Array(width(full)).fill('')] : full.filter((_, i) => i !== r);
};

/** The column at `c` dropped; the last one is only emptied (a table has a column). @param {Grid} rows @param {number} c */
export const removeColumnAt = (rows, c) => {
  const full = rectangle(rows);
  return width(full) <= 1 ? full.map(() => ['']) : full.map((r) => r.filter((_, i) => i !== c));
};

const blank = (/** @type {string} */ v) => v.trim() === '';

/** The grid without the empty rows and columns at its end (what was started in the next row or column and left), at least 1 × 1. @param {Grid} rows */
export function trimmed(rows) {
  let full = rectangle(rows);
  while (full.length > 1 && full[full.length - 1].every(blank)) full = full.slice(0, -1);
  let w = width(full);
  while (w > 1 && full.every((r) => blank(r[w - 1]))) {
    w -= 1;
    full = full.map((r) => r.slice(0, w));
  }
  return full;
}
