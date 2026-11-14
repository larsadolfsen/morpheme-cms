/**
 * What selecting several rows does, as plain functions: toggle one, add a range, select all, keep to the rows still
 * there, and which key does what. A selection is a list of keys (a page's path, a notification's key) in the order
 * they were picked; `order` is the keys of the rows shown, top to bottom.
 * Exposes `toggleKey`, `rangeKeys`, `selectAllKeys`, `pruneKeys`, `neighbourKey` and `keyAction`.
 * Used by useSelection.ts. Tested in selectionRules.test.mjs.
 */

/** The keys with `key` added, or taken out when it is there. */
export function toggleKey(keys, key) {
  return keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key];
}

/** The keys with every row from `anchor` to `to` (either way round) added. Without a known anchor only `to` is added. */
export function rangeKeys(keys, order, anchor, to) {
  const a = order.indexOf(anchor);
  const b = order.indexOf(to);
  if (b < 0) return keys;
  const [from, until] = a < 0 ? [b, b] : [Math.min(a, b), Math.max(a, b)];
  return [...keys, ...order.slice(from, until + 1).filter((k) => !keys.includes(k))];
}

/** Every row shown. */
export function selectAllKeys(order) {
  return [...order];
}

/** The keys that are still among the rows shown. */
export function pruneKeys(keys, order) {
  const kept = keys.filter((k) => order.includes(k));
  return kept.length === keys.length ? keys : kept;
}

/** The key `step` rows from `key` (clamped to the first and last), or undefined when `key` is not shown. */
export function neighbourKey(order, key, step) {
  const i = order.indexOf(key);
  if (i < 0) return undefined;
  return order[Math.min(order.length - 1, Math.max(0, i + step))];
}

/**
 * What a key press does: 'toggle' (Space on a row, which starts selecting), 'range-next' or 'range-prev' (Shift+Arrow on a row), 'all' (Ctrl or
 * Cmd+A while selecting), 'clear' (Escape while selecting), else null. `onRow`: focus is on a selectable row.
 */
export function keyAction({ key, shiftKey, ctrlKey, metaKey }, { selecting, onRow, spaceStarts = false }) {
  if (key === 'Escape') return selecting ? 'clear' : null;
  if ((ctrlKey || metaKey) && !shiftKey && key.toLowerCase() === 'a') return selecting ? 'all' : null;
  if (!onRow) return null;
  // Space on a row toggles it; with `spaceStarts` it also starts selecting (the keyboard's way in to a list of links, which Enter opens).
  if (key === ' ' && !ctrlKey && !metaKey) return selecting || spaceStarts ? 'toggle' : null;
  if (shiftKey && key === 'ArrowDown') return 'range-next';
  if (shiftKey && key === 'ArrowUp') return 'range-prev';
  return null;
}
