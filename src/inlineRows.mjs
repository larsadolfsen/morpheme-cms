// The items of a block typed in place (InlineItems.tsx; the List's rows, a card's title and text ...), as plain functions on the block's
// list: which item is empty, an item's field set, an item added (above, below, or the next empty one after the last), moved or dropped.
// Each returns new items (the old ones are not changed). An item is an object of strings (the List's { icon?, title, text?, href? });
// a field that is empty is not kept, except the first typed one (`first`, "title" unless a block says otherwise), which stays while it is
// typed. A paste that makes items (itemsFromPaste) or a Table's rows (gridFromPaste). No browser.

import { oneLine } from '../lib/one-line.mjs';
import { rectangle } from './standard/table/rows.mjs';

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

/** A row with nothing in it (no icon, link, heading or text: an icon or a link counts as content; any field with text does, and a list with something in it, a card's buttons). @param {Row | undefined} row */
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

/** A heading among the lines of a paste: `#` to `######` and a space at the start of a line, or h1 to h6 in the html. @param {string[]} lines @param {string} html */
const hasHeading = (lines, html) => /<h[1-6][\s>]/i.test(html) || lines.some((l) => /^#{1,6}\s/.test(l));

/** The lines of a pasted text, each to be one item (a list copied from a document), or null when the paste is left as it is: fewer than
 * two lines, or a heading among them (`#` in the text, or h1 to h6 in the html a document gives). A list marker at the start of a line
 * (`-`, `*`, `•`, `1.`) is not part of the line. @param {string} text @param {string} [html] @returns {string[] | null} */
export function linesFromPaste(text, html = '') {
  const lines = String(text ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;
  if (hasHeading(lines, html)) return null;
  return lines.map((l) => l.replace(/^(?:[-*•]|\d+[.)])\s+/, ''));
}

/** The items of a pasted text, one per line (linesFromPaste), or null when the paste is left as it is. A tab in a line splits it: before
 * it the first field (the title, a question), after it the second (the text, an answer); the second is left out when empty.
 * @param {string} text @param {string} [html] @param {string[]} [fields] the block's first and second typed fields
 * @returns {Row[] | null} */
export function itemsFromPaste(text, html = '', fields = ['title', 'text']) {
  const lines = linesFromPaste(text, html);
  if (!lines) return null;
  const [first, second] = fields;
  return lines.map((line) => {
    const tab = line.indexOf('\t');
    if (tab < 0) return { [first]: line };
    const head = line.slice(0, tab).trim();
    const rest = line
      .slice(tab + 1)
      .replace(/\t+/g, ' ')
      .trim();
    return rest && second ? { [first]: head, [second]: rest } : { [first]: head };
  });
}

/** The named entities a document's html uses in its text (others are written as numbers). @type {Record<string, string>} */
const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  euro: '€',
  copy: '©',
  reg: '®',
  trade: '™',
  deg: '°',
};

/** The text of an html cell: its tags dropped (a line break or a paragraph is a space), entities decoded, on one line. @param {string} html */
const cellText = (html) =>
  oneLine(
    html
      .replace(/<br\s*\/?>|<\/(?:p|div|li)>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, name) => {
        if (name[0] !== '#') return ENTITIES[name.toLowerCase()] ?? all;
        const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : all;
      })
      .replace(/\u00a0/g, ' '),
  ).trim();

/** The rows of the first `<table>` in a paste's html (a table copied from Google Docs or Word): its `tr`, and their `td` and `th` as text.
 * @param {string} html @returns {string[][] | null} */
function tableOf(html) {
  const table = /<table[\s>][\s\S]*?<\/table>/i.exec(html);
  if (!table) return null;
  const rows = [];
  for (const [, tr] of table[0].matchAll(/<tr[\s>]([\s\S]*?)<\/tr>/gi)) {
    const cells = [...tr.matchAll(/<t[dh](?:\s[^>]*)?>([\s\S]*?)<\/t[dh]>/gi)].map(([, c]) => cellText(c));
    if (cells.length) rows.push(cells);
  }
  return rows;
}

/** The rows of a paste into a Table, rectangular, or null when the paste is left as it is (a heading among it, or fewer than two lines and
 * fewer than two cells). From the html's `<table>` when it has one, else the plain lines with tabs between their cells (a spreadsheet's copy).
 * @param {string} text @param {string} [html] @returns {string[][] | null} */
export function gridFromPaste(text, html = '') {
  const lines = String(text ?? '')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '');
  if (
    hasHeading(
      lines.map((l) => l.trim()),
      html,
    )
  )
    return null;
  const rows = tableOf(html) ?? lines.map((l) => l.split('\t').map((c) => oneLine(c).trim()));
  if (!rows.length || (rows.length < 2 && rows[0].length < 2)) return null;
  return rectangle(rows);
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
