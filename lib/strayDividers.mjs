// Which dividers in a wrapping row of items stand at the start or the end of a line (and so separate nothing).
// Exposes strayDividers. No imports.

/**
 * @param {number[]} rows The vertical position of each item in the row, in order, items and dividers alternating, starting
 * and ending with an item (the same value for items on the same line).
 * @returns {number[]} The indexes of the dividers (the odd ones) that are first or last on their line.
 */
export function strayDividers(rows) {
  const stray = [];
  for (let i = 1; i < rows.length - 1; i += 2) {
    if (rows[i] !== rows[i - 1] || rows[i] !== rows[i + 1]) stray.push(i);
  }
  return stray;
}
