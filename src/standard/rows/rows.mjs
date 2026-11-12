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
  title: entry[map.title],
  text: map.text ? entry[map.text] : undefined,
  icon: map.icon ? entry[map.icon] : undefined,
  href: map.href ? entry[map.href] : undefined,
  tags: map.tags && Array.isArray(entry[map.tags]) ? /** @type {string[]} */ (entry[map.tags]) : [],
});

/** The rows a source's items give for a block's fields: tag filter, `How many`, then rows (an item without a title is left out).
 * @param {{ title?: unknown, text?: unknown, icon?: unknown, href?: unknown, tags?: string[] }[]} items
 * @param {{ tags?: unknown, howMany?: unknown }} props */
export const rowsFromItems = (items, props) =>
  chosenFrom(
    items.filter((i) => rowOf(i)),
    props.tags,
    props.howMany,
  ).flatMap((i) => rowOf(i) ?? []);

/** The block's fields with the rows of its list as its `items` (and, when it has no page of its own for its text button, the list's page),
 * or the fields as they are for a block with typed rows.
 * @param {Record<string, any>} props @param {{ rows: unknown[], page?: string } | undefined} found */
export const withRows = (props, found) =>
  found ? { ...props, items: found.rows, buttonHref: props.buttonHref || found.page || undefined } : props;

/** The rows as the questions of a FAQ list: the heading is the question, the text the answer.
 * @param {{ title: string, text?: string }[]} rows */
export const asQuestions = (rows) => rows.map((r) => ({ question: r.title, answer: r.text ?? '' }));
