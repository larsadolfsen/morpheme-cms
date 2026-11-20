// The hidden copy of a block's sheet below expanded (BlockDialog.tsx; spec 2026-11-14-one-save-while-writing-design.md, 4.3): what was
// typed in a phone's or a medium window's sheet that has its own Save, kept in this browser until Save, Cancel or Discard, so a sheet that
// ended otherwise (the tab closed or reloaded, the phone killed the tab) can be put back when the page form opens again. One per page, in
// localStorage: { page, block: { index, type, before }, values, at }. No React; every access to the storage is wrapped, as it can throw
// (a private window, blocked site data). Exposes keep, take, drop, matches and KEEP_DAYS.

/** How long a copy is offered, in days; an older one is deleted without asking. */
export const KEEP_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

const keyOf = (page) => `editor-sheet-copy:${page}`;

function storageOf(store) {
  if (store) return store;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// The same JSON for the same values, whatever the order of their keys.
function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sorted(value[k])]),
    );
  return value;
}
const same = (a, b) => JSON.stringify(sorted(a ?? {})) === JSON.stringify(sorted(b ?? {}));

/** Keeps the sheet's values for the page: block is { index, type, before } (where the block is, and its props when the sheet opened). */
export function keep(page, block, values, { store, now = Date.now() } = {}) {
  const s = storageOf(store);
  if (!s || !page) return;
  try {
    s.setItem(keyOf(page), JSON.stringify({ page, block, values, at: now }));
  } catch {}
}

/** The page's copy, or null (none, or not readable). */
export function take(page, { store } = {}) {
  const s = storageOf(store);
  if (!s || !page) return null;
  try {
    const raw = s.getItem(keyOf(page));
    if (!raw) return null;
    const copy = JSON.parse(raw);
    const ok =
      copy &&
      copy.page === page &&
      copy.block &&
      Number.isInteger(copy.block.index) &&
      typeof copy.block.type === 'string' &&
      copy.values &&
      typeof copy.values === 'object' &&
      typeof copy.at === 'number';
    return ok ? copy : null;
  } catch {
    return null;
  }
}

/** Deletes the page's copy. */
export function drop(page, { store } = {}) {
  const s = storageOf(store);
  if (!s || !page) return;
  try {
    s.removeItem(keyOf(page));
  } catch {}
}

/** Whether the copy can be offered: the block is still where it was (here: { index, type, props } of the block at the copy's index, or
 * null when there is none), the same type, its props still equal `before`, and the copy is younger than KEEP_DAYS. */
export function matches(copy, here, { now = Date.now() } = {}) {
  if (!copy || !here) return false;
  if (now - copy.at >= KEEP_DAYS * DAY) return false;
  return here.index === copy.block.index && here.type === copy.block.type && same(here.props, copy.block.before);
}
