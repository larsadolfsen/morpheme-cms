// The arithmetic of the Lightbox (Lightbox.tsx, lightboxControl.ts), as pure functions so node --test can run them: which image the swipe track shows,
// the next index and the count that is announced.

/**
 * The index of the image a swipe track shows: its scroll position over the width of one image, rounded, kept among the images. The track of a
 * right-to-left page scrolls into negative positions: only the distance counts.
 * @param {number} scrollLeft
 * @param {number} width The width of the track (one image's width).
 * @param {number} total
 * @returns {number}
 */
export function indexAt(scrollLeft, width, total) {
  if (!(width > 0) || !(total > 0)) return 0;
  return Math.min(total - 1, Math.max(0, Math.round(Math.abs(scrollLeft) / width)));
}

/**
 * The index `delta` images on, kept among the images (the first has no image before it, the last none after it).
 * @param {number} index
 * @param {number} delta
 * @param {number} total
 * @returns {number}
 */
export const moved = (index, delta, total) => Math.min(Math.max(total - 1, 0), Math.max(0, index + delta));

/**
 * The count that is announced ("3 of 12"): the site's text with `{index}` and `{total}` where the numbers go; the index counts from 1.
 * @param {string} template
 * @param {number} index From 0.
 * @param {number} total
 * @returns {string}
 */
export const countText = (template, index, total) => template.replaceAll('{index}', String(index + 1)).replaceAll('{total}', String(total));
