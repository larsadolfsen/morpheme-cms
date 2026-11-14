// The cells of the DataTable part (the Table block's grid, later a dynamic table's), as pure functions so node --test can run them and the
// script and the server read a cell the same way: a column's drawn kind, the parsed cell, its sort key and the text a search looks in.
// Only the kinds `text` and `number` are built; every other kind is drawn as `text` until its phase (table plan, section 4).
import { isNumber } from '../../src/standard/table/rows.mjs';

/** Every kind a column can store (`columns[c].kind`). */
export const KINDS = /** @type {const} */ (['text', 'number', 'link', 'date', 'tag', 'yesno', 'icon', 'image']);

/** The kinds that are drawn as themselves; any other is drawn as `text`. */
const BUILT = new Set(['text', 'number']);

/** @typedef {'text' | 'number'} DrawnKind */
/** @typedef {{ kind: 'number', text: string, value: number | null } | { kind: 'text', text: string }} Cell */

/**
 * The kind a column is drawn as: its stored kind when that kind is built, else `text` (a missing entry, a missing, unknown or unbuilt kind).
 * @param {unknown} entry a `columns` entry
 * @returns {DrawnKind}
 */
export function kindOf(entry) {
  const kind = entry && typeof entry === 'object' ? /** @type {{ kind?: unknown }} */ (entry).kind : undefined;
  return typeof kind === 'string' && BUILT.has(kind) ? /** @type {DrawnKind} */ (kind) : 'text';
}

/**
 * The value of a number as `isNumber` accepts it, else `null`. A sign (`-`, `+`, `−`), a currency, a unit and `%` are read around the
 * digits; spaces, `'` and thin spaces group digits. With both `,` and `.` the last one is the decimal mark; with one of them, it groups
 * digits when it is there more than once or once before exactly three digits (`1,299`, `1.299`), else it is the decimal mark (`3,5`).
 * @param {string} text
 * @returns {number | null}
 */
export function numberOf(text) {
  if (!isNumber(text)) return null;
  const t = text.trim();
  const digits = (t.match(/\d[\d\s.,']*/) ?? [''])[0].replace(/[\s']/g, '').replace(/[.,]+$/, '');
  const comma = digits.lastIndexOf(',');
  const dot = digits.lastIndexOf('.');
  let plain;
  if (comma >= 0 && dot >= 0) {
    const mark = comma > dot ? ',' : '.';
    const group = mark === ',' ? '.' : ',';
    plain = digits.split(group).join('').replace(mark, '.');
  } else if (comma >= 0 || dot >= 0) {
    const parts = digits.split(comma >= 0 ? ',' : '.');
    plain = parts.length > 2 || parts[1].length === 3 ? parts.join('') : parts.join('.');
  } else {
    plain = digits;
  }
  const value = Number(plain);
  if (!Number.isFinite(value)) return null;
  return /^[-−]/.test(t) ? -value : value;
}

/**
 * A cell as its kind reads it: a number with its value (`null` when the text is not a number), else text.
 * @param {string} kind the drawn kind (`kindOf`)
 * @param {string} text the cell's one-line text
 * @returns {Cell}
 */
export const cellOf = (kind, text) => (kind === 'number' ? { kind: 'number', text, value: numberOf(text) } : { kind: 'text', text });

/**
 * The key a cell sorts by: a number's value (`null` for an empty cell or a text that is not a number, sorted last), else the trimmed
 * text (the script collates it in the site's language).
 * @param {string} kind the drawn kind (`kindOf`)
 * @param {string} text
 * @returns {number | string | null}
 */
export const sortKey = (kind, text) => (kind === 'number' ? numberOf(text) : text.trim());

/**
 * The text a search looks in: the cell as it is drawn.
 * @param {string} _kind the drawn kind (`kindOf`)
 * @param {string} text
 * @returns {string}
 */
export const searchText = (_kind, text) => text;
