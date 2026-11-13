// The rows of a "Table": kept rectangular, at least 1 × 1, a cell one line of text (view.ts). Apart from view.ts so it can be tested.
import { oneLine } from '../../../lib/one-line.mjs';

/** @param {unknown} v */
const cell = (v) => oneLine(typeof v === 'string' ? v : v == null ? '' : String(v));

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

/** @typedef {'left' | 'center' | 'right'} Align */

const numeric = /^[-+−]?\s*[$€£¥kr.]*\s*\d[\d\s.,']*\s*(%|[a-zA-Z.]{0,3})?$/;

/** A cell is a number: digits with a sign, separators, a percent or a short currency or unit (7, -3, 1,200.50, 3,5 %, 12 kr). @param {string} text */
export const isNumber = (text) => numeric.test(text.trim());

/**
 * The alignment the owner chose per column, as saved: `left`, `center` or `right`, and `null` (or missing) for automatic. Anything else is automatic.
 * @param {unknown} align
 * @param {number} width
 * @returns {(Align | null)[]}
 */
export const chosenAlign = (align, width) =>
  Array.from({ length: width }, (_, c) => {
    const v = Array.isArray(align) ? align[c] : null;
    return v === 'left' || v === 'center' || v === 'right' ? v : null;
  });

/**
 * The alignment of each column as it is drawn: the owner's choice, else automatic: right when every cell of the column under the header is
 * a number (at least one), else left (Material 3: numbers right, text left).
 * @param {string[][]} rows rectangular
 * @param {boolean} header the first row is the header
 * @param {unknown} align the saved choice
 * @returns {Align[]}
 */
export function alignOf(rows, header, align) {
  const body = header ? rows.slice(1) : rows;
  return chosenAlign(align, rows[0].length).map((chosen, c) => {
    if (chosen) return chosen;
    const cells = body.map((r) => r[c]).filter((v) => v.trim() !== '');
    return cells.length && cells.every(isNumber) ? 'right' : 'left';
  });
}

/** The saved choice as it is kept: nothing when every column is automatic (a table never touched is saved as before). @param {(Align | null)[]} align @returns {(Align | null)[] | undefined} */
export const keptAlign = (align) => (align.some(Boolean) ? align : undefined);

/** The choice with column `c` set (`null`: automatic). @param {unknown} align @param {number} width @param {number} c @param {Align | null} value */
export const withAlign = (align, width, c, value) => keptAlign(chosenAlign(align, width).map((v, i) => (i === c ? value : v)));

/** The choice after a column was put in at `at` (automatic). @param {unknown} align @param {number} width the width before @param {number} at */
export const alignAddedAt = (align, width, at) => {
  const now = chosenAlign(align, width);
  return keptAlign([...now.slice(0, at), null, ...now.slice(at)]);
};

/** The choice after column `c` was dropped. @param {unknown} align @param {number} width the width before @param {number} c */
export const alignRemovedAt = (align, width, c) => keptAlign(chosenAlign(align, width).filter((_, i) => i !== c));

/** The choice cut to `width` columns (the grid lost its empty columns at the end). @param {unknown} align @param {number} width */
export const alignCut = (align, width) => keptAlign(chosenAlign(align, width));
