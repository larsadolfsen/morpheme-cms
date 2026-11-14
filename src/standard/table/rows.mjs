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

/** @typedef {{ align?: Align, kind?: string, [k: string]: unknown }} Column */

/**
 * The block's `columns`, one entry per column (`{ align?: 'left' | 'center' | 'right', kind?: string }`), as wide as the rows: a missing
 * `columns`, a missing or a broken entry is an empty entry, which is automatic. A bad `align` and a `kind` that is not a non-empty string
 * are dropped; every other key (a dynamic table's `field`, `label`) is kept as it is.
 * @param {unknown} columns
 * @param {number} width
 * @returns {Column[]}
 */
export const columnsOf = (columns, width) =>
  Array.from({ length: width }, (_, c) => {
    const e = Array.isArray(columns) ? columns[c] : null;
    const entry = e && typeof e === 'object' ? { ...e } : {};
    if (entry.align !== 'left' && entry.align !== 'center' && entry.align !== 'right') delete entry.align;
    if (typeof entry.kind !== 'string' || entry.kind === '') delete entry.kind;
    return entry;
  });

/** The alignment the owner chose for each column (`null`: automatic). @param {unknown} columns @param {number} width @returns {(Align | null)[]} */
export const chosenAlign = (columns, width) => columnsOf(columns, width).map((e) => e.align ?? null);

/** The alignment a stored kind gives: number right, icon and yes/no centre, any other kind left. @param {string} kind @returns {Align} */
const alignOfKind = (kind) => (kind === 'number' ? 'right' : kind === 'icon' || kind === 'yesno' ? 'center' : 'left');

/**
 * The alignment of each column as it is drawn: the owner's choice, else the column's stored kind (number right, icon and yes/no centre,
 * any other kind left), else automatic: right when every cell of the column under the header is a number (at least one), else left
 * (Material 3: numbers right, text left). A column with no stored kind keeps the automatic rule, so an old table reads as before.
 * @param {string[][]} rows rectangular
 * @param {boolean} header the first row is the header
 * @param {unknown} columns the saved `columns`
 * @returns {Align[]}
 */
export function alignOf(rows, header, columns) {
  const body = header ? rows.slice(1) : rows;
  return columnsOf(columns, rows[0].length).map((entry, c) => {
    if (entry.align) return entry.align;
    if (entry.kind) return alignOfKind(entry.kind);
    const cells = body.map((r) => r[c]).filter((v) => v.trim() !== '');
    return cells.length && cells.every(isNumber) ? 'right' : 'left';
  });
}

/** `columns` as it is kept: nothing when no column has a choice (a table never touched is saved as before). @param {Column[]} entries */
export const keptColumns = (entries) => (entries.some((e) => Object.keys(e).length) ? entries : undefined);

/** `columns` with the alignment of column `c` set (`null`: automatic). @param {unknown} columns @param {number} width @param {number} c @param {Align | null} value */
export const withAlign = (columns, width, c, value) =>
  keptColumns(
    columnsOf(columns, width).map((e, i) => {
      if (i !== c) return e;
      const { align: _was, ...rest } = e;
      return value ? { ...rest, align: value } : rest;
    }),
  );

/** `columns` with the kind of column `c` set (`null`: automatic). @param {unknown} columns @param {number} width @param {number} c @param {string | null} kind */
export const withKind = (columns, width, c, kind) =>
  keptColumns(
    columnsOf(columns, width).map((e, i) => {
      if (i !== c) return e;
      const { kind: _was, ...rest } = e;
      return kind ? { ...rest, kind } : rest;
    }),
  );

/** `columns` after a column was put in at `at`. @param {unknown} columns @param {number} width the width before @param {number} at */
export const columnAddedAt = (columns, width, at) => {
  const now = columnsOf(columns, width);
  return keptColumns([...now.slice(0, at), {}, ...now.slice(at)]);
};

/** `columns` after column `c` was dropped. @param {unknown} columns @param {number} width the width before @param {number} c */
export const columnRemovedAt = (columns, width, c) => keptColumns(columnsOf(columns, width).filter((_, i) => i !== c));

/** `columns` cut to `width` columns (the grid lost its empty columns at the end). @param {unknown} columns @param {number} width */
export const columnsCut = (columns, width) => keptColumns(columnsOf(columns, width));
