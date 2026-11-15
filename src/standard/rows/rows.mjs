// "Rows from" of the list blocks (List, Segmented list, FAQ list): a block takes its rows from an existing list instead of typed rows.
// Plain JavaScript so the tests can read it. One row is `{ icon?, title, text?, href? }`, the ListRow the three views already draw.
// The reading itself is lib/lists.mjs (the framework's reader); this file is the List family's four slots over it, and re-exports it for one release.
import {
  chosenFrom,
  fieldOfPart as fieldOfSlot,
  fieldsForSlot,
  howManyOf,
  itemsOf,
  mapOf as mapOfSlots,
  sourceOf,
  withPart as withSlot,
} from '../../../lib/lists.mjs';

export { chosenFrom, howManyOf, sourceOf };

/** The slots of the List family: the top line (required), the bottom line, the icon and the link. The tags filter is added by the core. */
export const SLOTS = /** @type {{ id: string, kinds: string[], required?: boolean }[]} */ ([
  { id: 'title', kinds: ['title', 'text'], required: true },
  { id: 'text', kinds: ['text', 'title'] },
  { id: 'icon', kinds: ['icon'] },
  { id: 'href', kinds: ['href'] },
]);

/** A row from what an item gives: the title trimmed, none when it has no title; the text and link only when they are text.
 * @param {{ title?: unknown, text?: unknown, icon?: unknown, href?: unknown }} item
 * @returns {{ title: string, text?: string, icon?: string, href?: string } | undefined} */
export const rowOf = (item) => {
  const clean = (/** @type {unknown} */ v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined);
  const title = clean(item.title);
  if (!title) return undefined;
  return { title, text: clean(item.text), icon: clean(item.icon), href: clean(item.href) };
};

/** An item of a list that says which of its fields fill a row (`asRows` of the list: field names), by the entry's values.
 * @param {Record<string, unknown>} entry @param {{ title: string, text?: string, icon?: string, href?: string, tags?: string }} map */
export const itemOfEntry = (entry, map) => ({
  entry,
  title: entry[map.title],
  text: map.text ? entry[map.text] : undefined,
  icon: map.icon ? entry[map.icon] : undefined,
  href: map.href ? entry[map.href] : undefined,
  tags: map.tags && Array.isArray(entry[map.tags]) ? /** @type {string[]} */ (entry[map.tags]) : [],
});

/** @typedef {'title' | 'text' | 'icon' | 'href' | 'tags'} Part */

/** The parts of a row a block's `map` can set, in the order the owner meets them, then the tags the block filters on. */
export const PARTS = /** @type {const} */ (['title', 'text', 'icon', 'href', 'tags']);

/** The block's own choice of which field of its list fills each part of a row (`map`), or undefined for the list's own (`asRows`).
 * @param {unknown} map @returns {Partial<Record<Part, string>> | undefined} */
export const mapOf = (map) => mapOfSlots(map, [...SLOTS]);

/** The fields of a list that can fill a part of a row (see `fieldsForSlot`).
 * @param {{ name: string, label: string, type: string, icons?: boolean, multiple?: boolean }[]} fields @param {Part} part @param {Record<string, string>} [kinds] */
export const fieldsForPart = (fields, part, kinds) =>
  fieldsForSlot(fields, [...SLOTS, { id: 'tags', kinds: ['tags'] }].find((s) => s.id === part) ?? { id: part }, kinds);

/** The field that fills a part: the block's own choice (`map`), else the list's (`asRows`); undefined for none.
 * @param {{ title: string, text?: string, icon?: string, href?: string, tags?: string }} asRows @param {unknown} map @param {Part} part */
export const fieldOfPart = (asRows, map, part) => fieldOfSlot(asRows, map, [...SLOTS], part);

/** The `map` after a part was set to a field (`''`: none).
 * @param {{ title: string, text?: string, icon?: string, href?: string, tags?: string }} asRows @param {unknown} map @param {Part} part @param {string} field
 * @returns {Partial<Record<Part, string>> | undefined} */
export const withPart = (asRows, map, part, field) => withSlot(asRows, map, [...SLOTS], part, field);

/** The rows a source's items give for a block's fields: the block's `map`, tag filter, `How many`, then rows (an item without a title is left out).
 * @param {{ title?: unknown, text?: unknown, icon?: unknown, href?: unknown, tags?: string[], entry?: Record<string, unknown> }[]} items
 * @param {{ tags?: unknown, howMany?: unknown, map?: unknown }} props */
export const rowsFromItems = (items, props) =>
  itemsOf(items, props, [...SLOTS]).flatMap((i) => {
    const { title, text, icon, href } = i.slots;
    return title ? [{ title, text, icon, href }] : [];
  });

/** The block's fields with the rows of its list as its `items` (and, when it has no page of its own for its text button, the list's page),
 * or the fields as they are for a block with typed rows.
 * @param {Record<string, any>} props @param {{ rows: unknown[], page?: string } | undefined} found */
export const withRows = (props, found) =>
  found ? { ...props, items: found.rows, buttonHref: props.buttonHref || found.page || undefined } : props;

/** The rows as the questions of a FAQ list: the heading is the question, the text the answer.
 * @param {{ title: string, text?: string }[]} rows */
export const asQuestions = (rows) => rows.map((r) => ({ question: r.title, answer: r.text ?? '' }));

/** What the List block's inline editor draws for a block that reads a list: the rows as the site shows them (tag filter and `How many`
 * applied), and whether none match. Undefined for a block with typed rows, which is typed in place.
 * @param {Record<string, any>} props @param {Parameters<typeof rowsFromItems>[0]} items */
export const inlineRowsOf = (props, items) => {
  const source = sourceOf(props.from);
  if (!source) return undefined;
  const rows = rowsFromItems(items, props);
  return { source, rows, empty: rows.length === 0 };
};
