// "Rows from" of the list blocks (List, Segmented list, FAQ list): a block takes its rows from an existing list instead of typed rows.
// Plain JavaScript so the tests can read it. One row is `{ icon?, title, text?, href? }`, the ListRow the three views already draw.

/** The source a block's `from` field names, or undefined for typed rows (empty, missing or not a text). @param {unknown} from @returns {string | undefined} */
export const sourceOf = (from) => (typeof from === 'string' && from.trim() !== '' ? from.trim() : undefined);

/** `How many` as a whole number of at least 1; anything else (empty, 0, a negative, text) is all of them.
 * @param {unknown} value @returns {number | undefined} */
export const howManyOf = (value) => {
  const n = typeof value === 'string' ? (value.trim() === '' ? NaN : Number(value)) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) && Math.floor(n) >= 1 ? Math.floor(n) : undefined;
};

/** The items with any of the tags (all of them when no tag is picked), the first `howMany` of them.
 * @template {{ tags?: string[] }} T
 * @param {T[]} items @param {unknown} tags @param {unknown} howMany @returns {T[]} */
export const chosenFrom = (items, tags, howMany) => {
  const wanted = Array.isArray(tags) ? tags.filter((t) => typeof t === 'string') : [];
  const matching = wanted.length ? items.filter((i) => (i.tags ?? []).some((t) => wanted.includes(t))) : items;
  const n = howManyOf(howMany);
  return n === undefined ? matching : matching.slice(0, n);
};

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

/** The block's own choice of which field of its list fills each part of a row (`map` on the block: `{ icon?, title?, text?, href?, tags? }`, field
 * names), or undefined for the list's own (`asRows`). A part missing from the map keeps the list's field; an empty text means none (not
 * for the title). Only a text per part counts, so a saved block that has no or a broken `map` reads as before.
 * @param {unknown} map @returns {Partial<Record<Part, string>> | undefined} */
export const mapOf = (map) => {
  if (!map || typeof map !== 'object') return undefined;
  /** @type {Partial<Record<Part, string>>} */
  const out = {};
  for (const part of PARTS) {
    const v = /** @type {Record<string, unknown>} */ (map)[part];
    if (typeof v === 'string' && (v.trim() !== '' || part !== 'title')) out[part] = v.trim();
  }
  return Object.keys(out).length ? out : undefined;
};

/** The parts of a row a block's `map` can set, in the order the owner meets them: the top line, the bottom line, the icon and the link, then the tags the
 * block filters on. The one place that lists the slots: a block that draws one more (an image) adds it here. */
export const PARTS = /** @type {const} */ (['title', 'text', 'icon', 'href', 'tags']);

/** The kinds of field a part takes, for a list whose fields have kinds (an own list's): the lines take the title and body text, the icon an icon, the link a link. */
const KINDS_OF_PART = { title: ['title', 'text'], text: ['title', 'text'], icon: ['icon'], href: ['href'], tags: ['tags'] };

/** The fields of a list that can fill a part of a row. With `kinds` (`{ <field name>: kind }`, an own list's) a part offers the fields of its kinds only,
 * so a list with several fields of one kind offers each of them where it fits and no other. Without (an app's or a standard list's): text for the lines,
 * an icon choice (or a typed icon name) for the icon, a page or an address for the link, a relation with several for the tags.
 * @param {{ name: string, label: string, type: string, icons?: boolean, multiple?: boolean }[]} fields @param {Part} part @param {Record<string, string>} [kinds]
 * @returns {{ name: string, label: string }[]} */
export const fieldsForPart = (fields, part, kinds) =>
  fields
    .filter((f) =>
      kinds
        ? KINDS_OF_PART[part].includes(kinds[f.name])
        : part === 'icon'
          ? (f.type === 'select' && !!f.icons) || f.type === 'string'
          : part === 'href'
            ? f.type === 'relation' || f.type === 'string'
            : part === 'tags'
              ? f.type === 'relation' && !!f.multiple
              : ['string', 'text', 'number'].includes(f.type) || (f.type === 'select' && !f.icons),
    )
    .map((f) => ({ name: f.name, label: f.label }));

/** The field that fills a part: the block's own choice (`map`), else the list's (`asRows`); undefined for none.
 * @param {{ title: string, text?: string, icon?: string, href?: string, tags?: string }} asRows @param {unknown} map @param {Part} part */
export const fieldOfPart = (asRows, map, part) => {
  const own = mapOf(map)?.[part];
  return (own === undefined ? asRows[part] : own) || undefined;
};

/** The `map` after a part was set to a field (`''`: none): a choice the list has already is not kept, and no choice at all is no `map`.
 * @param {{ title: string, text?: string, icon?: string, href?: string, tags?: string }} asRows @param {unknown} map @param {Part} part @param {string} field
 * @returns {Partial<Record<Part, string>> | undefined} */
export const withPart = (asRows, map, part, field) => {
  const next = { ...mapOf(map) };
  if (field === (asRows[part] ?? '')) delete next[part];
  else next[part] = field;
  return Object.keys(next).length ? next : undefined;
};

/** An item with the block's `map` applied: the parts it names are read from the item's entry (items of posts and testimonials have none, and
 * stay as they are). The tags are the field the block filters on. A part whose field the entry has no value for shows nothing there.
 * @template {{ entry?: Record<string, unknown> }} T @param {T} item @param {ReturnType<typeof mapOf>} map */
export const mapped = (item, map) => {
  if (!map || !item.entry) return item;
  const entry = item.entry;
  const pick = (/** @type {'icon' | 'title' | 'text' | 'href'} */ part) =>
    map[part] === undefined ? {} : { [part]: map[part] ? entry[/** @type {string} */ (map[part])] : undefined };
  const tags = map.tags === undefined ? {} : { tags: Array.isArray(entry[map.tags]) ? /** @type {string[]} */ (entry[map.tags]) : [] };
  return { ...item, ...pick('title'), ...pick('text'), ...pick('icon'), ...pick('href'), ...tags };
};

/** The rows a source's items give for a block's fields: the block's `map`, tag filter, `How many`, then rows (an item without a title is
 * left out).
 * @param {{ title?: unknown, text?: unknown, icon?: unknown, href?: unknown, tags?: string[], entry?: Record<string, unknown> }[]} items
 * @param {{ tags?: unknown, howMany?: unknown, map?: unknown }} props */
export const rowsFromItems = (items, props) => {
  const map = mapOf(props.map);
  return chosenFrom(
    items.map((i) => mapped(i, map)).filter((i) => rowOf(i)),
    props.tags,
    props.howMany,
  ).flatMap((i) => rowOf(i) ?? []);
};

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
