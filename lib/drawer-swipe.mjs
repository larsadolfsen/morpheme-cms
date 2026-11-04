// When a drag across the modal drawer closes it (Material 3: a swipe toward the drawer's edge).
// Exposes swipeCloses and SWIPE_DISTANCE (pure); used by MainDrawer in src/ui.tsx. No dependencies.

/** How far, in px, a drag must go toward the edge to count as a swipe. */
export const SWIPE_DISTANCE = 48;

/** Whether a drag of `dx` and `dy` px (pointer up minus pointer down) is a swipe toward the drawer's start edge: the left
 * edge, or the right one when the text runs right to left (`rtl`). It must be far enough and mostly sideways, so scrolling
 * the list never closes it.
 * @param {number} dx
 * @param {number} dy
 * @param {boolean} [rtl]
 * @returns {boolean} */
export function swipeCloses(dx, dy, rtl = false) {
  const toward = rtl ? dx : -dx;
  return toward >= SWIPE_DISTANCE && toward >= Math.abs(dy) * 2;
}
