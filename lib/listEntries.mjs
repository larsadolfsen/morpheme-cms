// A list's entries typed in place on its edit page (src/OwnListEntries.tsx; PR B of docs/superpowers/plans/2026-11-14-dynamic-list-edit-page.md, built in the core for every list,
// docs/superpowers/specs/2026-11-14-dynamic-lists-framework-design.md section 11, phase 8). What it decides without the screen lives here: which of a list's fields each part of a
// row (title, text, icon, link, image, tags) is, how an entry's data becomes a row and a row's changes go back into the entry's data, and the `order` of each row.
import { entryOfRow, moveOrders } from './ownList.mjs';

const has = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null);

/**
 * The kind (`icon`, `title`, `text`, `image`, `href`, `tags`) of each field of a list, by the field's name. A list the owner made says it (`fieldKinds`); another list
 * (Testimonials, an app's) is read from `asRows` (the fields that fill a row) and the fields' types (an `image` is an image).
 * @param {{ fieldKinds?: Record<string, string>; asRows?: { title: string; text?: string; icon?: string; href?: string; tags?: string }; fields: { name: string; type?: string }[] }} list
 * @returns {Record<string, string>}
 */
export function kindsOfList(list) {
  if (list.fieldKinds) return { ...list.fieldKinds };
  /** @type {Record<string, string>} */
  const kinds = {};
  for (const f of list.fields) if (f.type === 'image') kinds[f.name] ??= 'image';
  for (const kind of ['title', 'text', 'icon', 'href', 'tags']) {
    const name = list.asRows?.[kind];
    if (name) kinds[name] = kind;
  }
  return kinds;
}

/** The field of each part of a row: the first field of that kind, in the list's order. `{ title: 'name', text: 'quote' }`. @param {{ name: string; type?: string }[]} fields @param {Record<string, string>} kinds */
export function slotFields(fields, kinds) {
  /** @type {Record<string, string>} */
  const slots = {};
  for (const f of fields) {
    const kind = kinds[f.name];
    if (kind && !(kind in slots)) slots[kind] = f.name;
  }
  return slots;
}

/** The row an entry is drawn as: the value of each part's field, no key for an empty one. @param {Record<string, any>} data @param {Record<string, string>} slots */
export function rowOfData(data, slots) {
  /** @type {Record<string, any>} */
  const row = {};
  for (const [part, field] of Object.entries(slots)) if (has(data[field])) row[part] = data[field];
  return row;
}

/**
 * An entry's data after its row was typed in: the data it had, with the field of each part set from the row (a key is left out when the row has nothing there), and the
 * fields no part shows kept as they were. `order` is set.
 * @param {Record<string, any>} data @param {Record<string, any>} row @param {Record<string, string>} slots @param {number} order
 */
export function dataOfRow(data, row, slots, order) {
  const own = entryOfRow(row, order, Object.keys(slots));
  /** @type {Record<string, any>} */
  const next = { ...data };
  for (const field of Object.values(slots)) delete next[field];
  for (const [part, field] of Object.entries(slots)) if (has(own[part])) next[field] = own[part];
  next.order = order;
  return next;
}

/** Whether an entry has nothing a person typed or picked: no value but `order`. @param {Record<string, any>} data */
export const isBlank = (data) => !Object.entries(data).some(([k, v]) => k !== 'order' && has(v));

/**
 * The `order` of each row, top to bottom, strictly rising: a row keeps the order it has while that is above the one before it; a row with none, or one that is not, gets a
 * number between its neighbours (half way), or one past the last, or one before the first. A row in the middle of the list is added with no other entry rewritten.
 * @param {(number | undefined)[]} orders
 * @returns {number[]}
 */
export function orderRows(orders) {
  const kept = [];
  let last = -Infinity;
  for (const o of orders) {
    const ok = typeof o === 'number' && Number.isFinite(o) && o > last;
    kept.push(ok ? o : undefined);
    if (ok) last = o;
  }
  const out = [];
  for (let i = 0; i < kept.length; i++) {
    if (kept[i] !== undefined) {
      out.push(kept[i]);
      continue;
    }
    const before = out.length ? out[out.length - 1] : undefined;
    const after = kept.slice(i + 1).find((o) => o !== undefined);
    out.push(
      before === undefined && after === undefined
        ? 0
        : after === undefined
          ? Math.floor(before) + 1
          : before === undefined
            ? Math.ceil(after) - 1
            : (before + after) / 2,
    );
  }
  return out;
}

/**
 * Moves the row at `i` by `by` (-1 up, 1 down): the two rows swap places and their orders. Rows are `{ order?: number }`; returns the new rows, or the same array when the move
 * is not possible.
 * @template {{ order?: number }} T @param {T[]} rows @param {number} i @param {-1 | 1} by
 */
export function moveRow(rows, i, by) {
  const swap = moveOrders(
    rows.map((r, n) => ({ slug: String(n), order: r.order })),
    i,
    by,
  );
  if (!swap.length) return rows;
  const next = rows.slice();
  const [a, b] = swap;
  next[i + by] = { ...rows[i], order: a.order };
  next[i] = { ...rows[i + by], order: b.order };
  return next;
}
