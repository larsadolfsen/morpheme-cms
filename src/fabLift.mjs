// How far the editor's footer stands up into the window: the FAB is lifted by this much (fabPresence.tsx useFabLift). Pure.
// Exposes fabLift.

/** The height of the footer's part inside the window, 0 when the footer is below the window or not drawn (`top`: its top edge
 * from the window's top, `height`: the window's height). */
export function fabLift(top, height) {
  if (typeof top !== 'number' || !Number.isFinite(top)) return 0;
  return Math.max(0, Math.round(height - top));
}
