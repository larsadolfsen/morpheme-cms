// "Change to": one repeating block made into another (List, Segmented list, Steps, FAQ list, Cards, Table), as plain functions on the
// block's props (docs/superpowers/specs/2026-11-14-paste-and-change-to-design.md, section 3). Each item's title and text move over; what
// the new block cannot show stays in the props, under its own key, so changing back brings it back. A Table's rows are arrays: the
// change to a Table keeps the other block's `items`, the change from it keeps `rows`, and the way back matches them by title.
// Exposes CHANGE_TYPES, changeTo, targets and plainOf. No dependencies but one-line.mjs, no browser. Tested in changeTo.test.mjs.

import { oneLine } from './one-line.mjs';

/** @typedef {Record<string, unknown>} Item */
/** @typedef {Record<string, unknown>} Props */
/** @typedef {(item: Item) => string | undefined} TitleOf the title of the page an item links to (`href`), when it has one */

/** The blocks that change into each other, in the order the menu offers them. */
export const CHANGE_TYPES = ['list', 'segmented', 'steps', 'faq', 'cards', 'table'];

/** The blocks that can read their rows from a list (`from`). */
const READERS = ['list', 'segmented', 'faq'];

/** The blocks whose row with a page and no heading shows the page's title. */
const PAGE_TITLES = ['list', 'segmented'];

/** The keys of an item's title and text, by block (the Table's are its first two cells). */
const KEYS = {
  list: ['title', 'text'],
  segmented: ['title', 'text'],
  steps: ['title', 'text'],
  faq: ['question', 'answer'],
  cards: ['title', 'text'],
};

const str = (v) => (typeof v === 'string' ? v : '');
const isItem = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * A FAQ list's answer (Markdown) as plain text: bold, italic, code and links dropped to their text, a list's items and the paragraphs
 * one per line.
 * @param {string} markdown
 */
export function plainOf(markdown) {
  return String(markdown ?? '')
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/(\*\*|__)(.+?)\1/g, '$2')
        .replace(/(^|[^\w*])\*(?!\s)(.+?)\*(?!\w)/g, '$1$2')
        .replace(/(^|[^\w])_(?!\s)(.+?)_(?!\w)/g, '$1$2')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1')
        .trim(),
    )
    .filter(Boolean)
    .join('\n');
}

/** The block an item kept from before a Table was in (its keys tell): a FAQ list's, or one with a title and a text. @param {Item} item */
const keptType = (item) => (('question' in item || 'answer' in item) && !('title' in item) ? 'faq' : 'list');

/** The title an item shows in its block: its own, or, in a List or a Segmented list, its page's. @param {string} type @param {Item} item @param {TitleOf} [titleOf] */
function shownTitle(type, item, titleOf) {
  const own = str(item[KEYS[type][0]]);
  if (own.trim() || !PAGE_TITLES.includes(type) || !item.href) return own;
  return str(titleOf?.(item)) || own;
}

/** An item's text as plain text (a FAQ list's answer without its Markdown). @param {string} type @param {Item} item */
const plainText = (type, item) => (type === 'faq' ? plainOf(str(item.answer)) : str(item[KEYS[type][1]]));

/**
 * One item of block `from` as an item of block `to` (neither the Table): the title and the text under `to`'s keys, everything else kept.
 * @param {string} from @param {string} to @param {Item} item @param {TitleOf} [titleOf]
 * @returns {Item}
 */
function moveItem(from, to, item, titleOf) {
  if (from === to) return { ...item };
  const [fromTitle, fromText] = KEYS[from];
  const [toTitle, toText] = KEYS[to];
  const next = { ...item };
  const hadTitle = fromTitle in item;
  // A row titled by its page: in a block that shows the page's title too, the row stays as it is; elsewhere the shown title moves.
  const title = PAGE_TITLES.includes(to) ? str(item[fromTitle]) : shownTitle(from, item, titleOf);
  const text = plainText(from, item);
  delete next[fromTitle];
  delete next[fromText];
  if (hadTitle || title) next[toTitle] = title;
  if (from === 'faq') {
    // The Markdown is kept, unseen, when the plain text is not the same (a link, bold, a list).
    if (str(item.answer) && str(item.answer) !== text) next.answer = item.answer;
    if (text) next[toText] = text;
  } else if (to === 'faq') {
    const kept = str(item.answer);
    if (text) next.answer = kept && plainOf(kept) === text ? kept : text;
    else delete next.answer;
  } else if (text) {
    next[toText] = text;
  }
  return next;
}

/** Takes the first entry of `pool` whose key is `key` out of it, in order; undefined when none is. @template T @param {{ key: string, value: T }[]} pool @param {string} key */
function take(pool, key) {
  const i = pool.findIndex((e) => e.key === key);
  return i < 0 ? undefined : pool.splice(i, 1)[0].value;
}

/** The Table's rows as arrays of texts (a missing or a broken `rows` is none). @param {unknown} rows @returns {string[][]} */
const rowsOf = (rows) => (Array.isArray(rows) ? rows.map((r) => (Array.isArray(r) ? r.map((c) => str(c)) : [])) : []);

/** The rows made as wide as the widest (a short row gets empty cells), at least `width`. @param {string[][]} rows @param {number} width */
function padded(rows, width) {
  const w = Math.max(width, ...rows.map((r) => r.length));
  return rows.map((r) => [...r, ...Array(w - r.length).fill('')]);
}

/** Block `from` (not the Table) as a Table. @param {string} from @param {Props} props @param {TitleOf} [titleOf] @returns {Props} */
function toTable(from, props, titleOf) {
  const items = (Array.isArray(props.items) ? props.items : []).filter(isItem);
  const kept = rowsOf(props.rows);
  const keptHeader = kept.length > 0 && props.header !== false;
  const pool = (keptHeader ? kept.slice(1) : kept).map((r) => ({ key: r[0] ?? '', value: r }));
  const body = items.map((item) => {
    const title = oneLine(shownTitle(from, item, titleOf)).trim();
    const text = oneLine(plainText(from, item)).trim();
    const was = take(pool, title);
    return [title, text, ...(was ? was.slice(2) : [])];
  });
  const width = Math.max(body.some((r) => r[1]) || body.some((r) => r.length > 2) ? 2 : 1, keptHeader ? kept[0].length : 1);
  const rows = padded([...(keptHeader ? [kept[0]] : []), ...body.map((r) => (width === 1 ? r.slice(0, 1) : r))], width);
  const next = { ...props, rows: rows.length ? rows : [['']] };
  // A Table made by Change to has no header row, unless it kept one from before (its own setting again).
  if (!keptHeader) next.header = false;
  return next;
}

/** A Table as block `to`. @param {string} to @param {Props} props @param {TitleOf} [titleOf] @returns {Props} */
function fromTable(to, props, titleOf) {
  const rows = rowsOf(props.rows);
  const body = props.header === false ? rows : rows.slice(1);
  const [toTitle, toText] = KEYS[to];
  const pool = (Array.isArray(props.items) ? props.items : []).filter(isItem).map((item) => {
    const type = keptType(item);
    return { key: oneLine(shownTitle(type, item, titleOf)).trim(), value: { type, item } };
  });
  const items = body.map(([title = '', text = '']) => {
    const was = take(pool, title);
    if (!was) return text ? { [toTitle]: title, [toText]: text } : { [toTitle]: title };
    const item = moveItem(was.type, to, was.item, titleOf);
    if (oneLine(shownTitle(to, item, titleOf)).trim() !== title) item[toTitle] = title;
    if (oneLine(plainText(to, item)).trim() !== text) {
      delete item[toText];
      if (to === 'faq' || was.type === 'faq') delete item.answer;
      if (text) item[toText] = text;
    }
    return item;
  });
  return { ...props, items };
}

/**
 * The props of block `from` changed to block `to`: its items moved (title and text, everything else kept on the item), every prop kept.
 * A block saved before is never changed by this unless an owner chooses Change to.
 * @param {string} from the block's type now
 * @param {string} to the type it becomes
 * @param {Props} props the block's props now
 * @param {TitleOf} [titleOf] the title of an item's page, for a row titled by its page
 * @returns {Props}
 */
export function changeTo(from, to, props, titleOf) {
  const p = isItem(props) ? props : {};
  if (from === to || !CHANGE_TYPES.includes(from) || !CHANGE_TYPES.includes(to)) return { ...p };
  if (to === 'table') return toTable(from, p, titleOf);
  if (from === 'table') return fromTable(to, p, titleOf);
  if (!Array.isArray(p.items)) return { ...p };
  return { ...p, items: p.items.map((item) => (isItem(item) ? moveItem(from, to, item, titleOf) : item)) };
}

/**
 * The blocks a block of `type` can change to, in the menu's order: the other five; only List, Segmented list and FAQ list while it reads
 * its rows from a list (`from`); none while the template locks it or it must stay (the last shown of a block the page must have); and only
 * those the template allows, below their maximum.
 * @param {string} type
 * @param {Props} props
 * @param {{ blocks?: string[], max?: Record<string, number>, locked?: string[], have?: Record<string, number>, stays?: boolean }} [rules]
 *   the page's template and how many of each block the page has (`have`)
 * @returns {string[]}
 */
export function targets(type, props, rules = {}) {
  if (!CHANGE_TYPES.includes(type) || rules.locked?.includes(type) || rules.stays) return [];
  const reads = isItem(props) && !!props.from;
  return CHANGE_TYPES.filter(
    (t) =>
      t !== type &&
      (!reads || READERS.includes(t)) &&
      (!rules.blocks || rules.blocks.includes(t)) &&
      (rules.max?.[t] === undefined || (rules.have?.[t] ?? 0) < rules.max[t]),
  );
}
