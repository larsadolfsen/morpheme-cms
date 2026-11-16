// The reader of dynamic lists (docs/superpowers/specs/2026-11-14-dynamic-lists-framework-design.md, sections 3.4 and 3.5): the items of a list
// for a block's slots, the same on the site (`readList`, at build time) and in the editor (`listItems`, from BlockData). Plain JavaScript, so
// apps, the build and the tests import it as `@morphemecms/cms/lib/lists`. The editor's and the site's items are one pure function
// (`itemsOf`) over the entries; only the way the entries are fetched differs.
//
// One item is `{ slots: { <slot id>: value }, tags, entry? }`. A slot nobody mapped keeps what the list gives for it: the field the list's
// own `asRows` names (an own list's first visible field of the slot's kind, a source's fixed parts), so a block saved before `slots` existed reads
// the same items.

import { coreListOf } from './coreLists.mjs';

/** @typedef {{ id: string, kinds?: string[], required?: boolean }} Slot A part a block draws; `kinds` the field kinds it takes, in order. */
/** @typedef {{ slots: Record<string, string | undefined>, tags: string[], entry?: Record<string, unknown> }} ListItem */
/** @typedef {{ title?: unknown, text?: unknown, icon?: unknown, href?: unknown, tags?: string[], entry?: Record<string, unknown> }} SourceItemLike */

/** The slot that filters, added to every block with slots. */
export const TAGS_SLOT = /** @type {Slot} */ ({ id: 'tags', kinds: ['tags'] });

/** The slots of a block plus the filter slot `tags` the core adds (never twice). @param {Slot[] | undefined} slots @returns {Slot[]} */
export const listSlots = (slots) => {
  const own = (slots ?? []).filter((s) => s && typeof s.id === 'string');
  return own.some((s) => s.id === 'tags') ? own : [...own, TAGS_SLOT];
};

/** The source a block's `from` field names, or undefined for typed items (empty, missing or not a text). @param {unknown} from @returns {string | undefined} */
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

/** The block's own choice of which field fills each slot (`map` on the block: `{ <slot id>: <field id> }`), or undefined for the list's own.
 * A slot missing from the map keeps the list's field; an empty text means none (not for a required slot). Only a text per slot counts, so a saved
 * block with no or a broken `map` reads as before.
 * @param {unknown} map @param {Slot[]} slots @returns {Record<string, string> | undefined} */
export const mapOf = (map, slots) => {
  if (!map || typeof map !== 'object') return undefined;
  /** @type {Record<string, string>} */
  const out = {};
  for (const slot of listSlots(slots)) {
    const v = /** @type {Record<string, unknown>} */ (map)[slot.id];
    if (typeof v === 'string' && (v.trim() !== '' || !slot.required)) out[slot.id] = v.trim();
  }
  return Object.keys(out).length ? out : undefined;
};

/** The field that fills a slot: the block's own choice (`map`), else the list's (`asRows`); undefined for none.
 * @param {Record<string, string | undefined>} asRows @param {unknown} map @param {Slot[]} slots @param {string} slot */
export const fieldOfPart = (asRows, map, slots, slot) => {
  const own = mapOf(map, slots)?.[slot];
  return (own === undefined ? asRows[slot] : own) || undefined;
};

/** The `map` after a slot was set to a field (`''`: none): a choice the list has already is not kept, and no choice at all is no `map`.
 * @param {Record<string, string | undefined>} asRows @param {unknown} map @param {Slot[]} slots @param {string} slot @param {string} field
 * @returns {Record<string, string> | undefined} */
export const withPart = (asRows, map, slots, slot, field) => {
  const next = { ...mapOf(map, slots) };
  if (field === (asRows[slot] ?? '')) delete next[slot];
  else next[slot] = field;
  return Object.keys(next).length ? next : undefined;
};

/** The fields of a list that can fill a slot. With `kinds` (`{ <field id>: kind }`, a list's) a slot offers the fields of its kinds only; without
 * (an old list in code) the choice is by the field's type, as the List family always had it.
 * @param {{ name: string, label: string, type: string, icons?: boolean, multiple?: boolean }[]} fields @param {Slot} slot @param {Record<string, string>} [kinds]
 * @returns {{ name: string, label: string }[]} */
export const fieldsForSlot = (fields, slot, kinds) =>
  fields
    .filter((f) => {
      if (kinds) return (slot.kinds ?? []).includes(kinds[f.name]);
      const k = slot.kinds?.[0];
      return k === 'icon'
        ? (f.type === 'select' && !!f.icons) || f.type === 'string'
        : k === 'href'
          ? f.type === 'relation' || f.type === 'string'
          : k === 'tags'
            ? f.type === 'relation' && !!f.multiple
            : ['string', 'text', 'number'].includes(f.type) || (f.type === 'select' && !f.icons);
    })
    .map((f) => ({ name: f.name, label: f.label }));

const clean = (/** @type {unknown} */ v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined);

/** One item from a source's item: each slot's value is the field the block's `map` names (read from the entry), else what the source gives
 * for the slot (`item[slot.id]`). Trimmed; none when it is not a text. The tags are the field the block filters on, else the item's.
 * @param {SourceItemLike} item @param {Slot[]} slots @param {Record<string, string> | undefined} map @returns {ListItem} */
export const itemOf = (item, slots, map) => {
  const entry = item.entry;
  /** @type {Record<string, string | undefined>} */
  const values = {};
  for (const slot of slots) {
    if (slot.id === 'tags') continue;
    const field = map?.[slot.id];
    values[slot.id] = clean(
      field !== undefined && entry ? (field ? entry[field] : undefined) : /** @type {Record<string, unknown>} */ (item)[slot.id],
    );
  }
  const mappedTags = map?.tags !== undefined && entry ? entry[map.tags] : undefined;
  const tags =
    map?.tags !== undefined && entry ? (Array.isArray(mappedTags) ? /** @type {string[]} */ (mappedTags) : []) : (item.tags ?? []);
  return { slots: values, tags, ...(entry ? { entry } : {}) };
};

/** The items a source's entries give for a block: the `map`, an item without a value in a required slot left out, the tag filter, then `How many`.
 * The one function both the site and the editor call.
 * @param {SourceItemLike[]} source @param {{ tags?: unknown, howMany?: unknown, map?: unknown }} props @param {Slot[]} [blockSlots] @returns {ListItem[]} */
export const itemsOf = (source, props, blockSlots) => {
  const slots = listSlots(blockSlots);
  const map = mapOf(props.map, slots);
  const required = slots.filter((s) => s.required);
  const items = source.map((s) => itemOf(s, slots, map)).filter((i) => required.every((s) => i.slots[s.id]));
  return chosenFrom(items, props.tags, props.howMany);
};

/** In the editor (a block's viewOf.ts): the items of the list a block reads, from the editor's data (`BlockData`), the same as the site's.
 * `sourceItems` is the editor's way of getting a source's entries (`(id, data) => SourceItemLike[]`).
 * @param {unknown} data @param {string} id @param {{ tags?: unknown, howMany?: unknown, map?: unknown }} props @param {Slot[] | undefined} slots
 * @param {(id: string, data: any) => SourceItemLike[]} sourceItems @returns {ListItem[]} */
export const listItems = (data, id, props, slots, sourceItems) => itemsOf(sourceItems(id, data), props, slots);

/** @typedef {(id: string) => Promise<{ items: SourceItemLike[], page?: string, missing?: boolean }>} ListReader How a site fetches a source's entries. */
/** @type {ListReader | undefined} */
let siteReader;

/** Told by the site's standard (defaults/standard.ts) once it is loaded: how this build fetches a list's entries. This file is also in the editor's
 * bundle, so it cannot import the site's alias itself. Holds a function, never a pending promise. @param {ListReader} read */
export const setListReader = (read) => {
  siteReader = read;
};

/** On the site (a block's load.ts), at build time: the items of a list for a block, and the page of the list (where `Show all` goes).
 * `missing` is true when no such list exists. `read` replaces the site's reader (tests, other builds); without it the site's own reader, which its standard registers (`setListReader`).
 * @param {string} id @param {{ tags?: unknown, howMany?: unknown, map?: unknown }} props @param {Slot[] | undefined} slots
 * @param {(id: string) => Promise<{ items: SourceItemLike[], page?: string, missing?: boolean }>} [read]
 * @returns {Promise<{ items: ListItem[], page?: string, missing: boolean }>} */
export const readList = async (id, props, slots, read = siteReader) => {
  if (!read) throw new Error("readList: no list reader. It runs at build time, after the site's standard (@site/standard) is loaded.");
  const found = await read(id);
  return { items: itemsOf(found.items, props, slots), page: found.page, missing: !!found.missing };
};

/** Who made a list (decision 8, spec 3.9): only its creator creates it and changes or deletes its definition. Derived from the id, never stored:
 * `posts` and `testimonials` are the system's (system lists), an id with a dot is the app named before the dot (`<app id>.<id>`), any other id is an own list (the Dynamic lists app's).
 * @param {unknown} id @returns {{ kind: 'system' } | { kind: 'app', app: string } | { kind: 'own' }} */
export const creatorOf = (id) => {
  const list = typeof id === 'string' ? id.trim() : '';
  if (coreListOf(list)) return { kind: 'system' };
  const dot = list.indexOf('.');
  return dot > 0 ? { kind: 'app', app: list.slice(0, dot) } : { kind: 'own' };
};
