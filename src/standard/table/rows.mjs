// The rows of a "Table": kept rectangular, at least 1 × 1, a cell one line of text (view.ts). Apart from view.ts so it can be tested.

/** @param {unknown} v */
const cell = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v)).replace(/\s*[\r\n]+\s*/g, ' ');

/**
 * The rows as a rectangle of one-line texts, at least 1 × 1 (a missing or broken `rows` is one empty cell).
 * @param {unknown} rows
 * @returns {string[][]}
 */
export function rectangle(rows) {
  const lines = (Array.isArray(rows) ? rows : []).map((r) => (Array.isArray(r) ? r.map(cell) : []));
  const width = Math.max(1, ...lines.map((r) => r.length));
  const filled = lines.map((r) => [...r, ...Array(width - r.length).fill('')]);
  return filled.length ? filled : [Array(width).fill('')];
}
