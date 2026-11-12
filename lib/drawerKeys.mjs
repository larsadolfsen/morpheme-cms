// Where the arrow keys, Home and End move the focus among a navigation drawer's items (theme/ui/navigationDrawerControl.ts
// does the DOM). Exposes drawerKeyTarget; no dependencies.

/**
 * The index to focus for a key, or null when the key is not one of ours, there are no items, or the focus is not on one.
 * Up and down stop at the first and the last item.
 * @param {string} key a KeyboardEvent's `key`
 * @param {number} current the index of the focused item
 * @param {number} count how many items there are
 * @returns {number | null}
 */
export function drawerKeyTarget(key, current, count) {
  if (count === 0 || current < 0 || current >= count) return null;
  switch (key) {
    case 'ArrowDown':
      return Math.min(current + 1, count - 1);
    case 'ArrowUp':
      return Math.max(current - 1, 0);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}
