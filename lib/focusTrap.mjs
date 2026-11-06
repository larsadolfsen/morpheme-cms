// Keeps Tab inside a modal drawer (theme/components/MobileMenu.tsx does the DOM). Exposes visibleElements and trapTarget;
// no dependencies.

/**
 * The elements that are drawn now: one that is hidden (display: none, as the contact-page link is below the medium window
 * size) has no boxes and cannot take the focus, so it is neither the first nor the last stop.
 * @template {{ getClientRects(): { length: number } }} T
 * @param {ArrayLike<T>} elements
 * @returns {T[]}
 */
export function visibleElements(elements) {
  return Array.from(elements).filter((el) => el.getClientRects().length > 0);
}

/**
 * The index to focus when Tab would leave the list, or null when the browser may move the focus itself.
 * @param {boolean} shift whether Shift is held
 * @param {number} current the index of the focused element, -1 when it is not in the list
 * @param {number} count how many stops there are
 * @returns {number | null}
 */
export function trapTarget(shift, current, count) {
  if (count === 0) return null;
  if (current < 0) return shift ? count - 1 : 0;
  if (shift && current === 0) return count - 1;
  if (!shift && current === count - 1) return 0;
  return null;
}
