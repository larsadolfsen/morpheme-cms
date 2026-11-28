// What a carousel's images are told about how wide they are drawn (View.tsx): `sizes` and the loading of each item. Plain JavaScript so it is tested without a build
// (sizes.test.mjs). A browser picks the file from `sizes` before it has laid anything out. Only the layouts whose items are drawn much narrower than the one value
// every layout used (`(min-width: 600px) 352px, 100vw`) have `sizes` of their own: they fetch smaller files and nothing is sent that was not sent before. The others
// (hero, full screen, multi-aspect ratio) keep that value: a sharper `sizes` there would load larger files (owner, 28 Nov 2026: the first screen first, bytes never above before).

/** The value every layout used before: 352px from medium (600 px), the row's width below. */
export const BASE_SIZES = '(min-width: 600px) 352px, 100vw';
const PAGE = 'min(100vw, 72rem)';
const NARROW = '100vw - 2rem';

/** `sizes` of the layouts that have their own, as [media condition, width] entries (no condition: the default). */
const ENTRIES = {
  // Large items as wide as the theme says (`--mo-comp-carousel-large-item-width`), never wider.
  'multi-browse': [[null, '12.5rem']],
  // An item is 86% of the row on a phone, half of it from 616 px and a third from 840 px (the container queries of cards.css, plus the margins).
  uncontained: [
    ['(min-width: 840px)', `(${PAGE} - 5rem) / 3`],
    ['(min-width: 616px)', '(100vw - 4rem) / 2'],
    [null, `(${NARROW}) * 0.86`],
  ],
};

/** The layouts with `sizes` of their own. */
export const LAYOUTS = Object.keys(ENTRIES);

/** `sizes` of an image in `layout`; the base value for any other. `crop`: the part of the image shown, as percent of its width: the image is drawn that much wider than its box.
 * @param {string} layout @param {{ crop?: number }} [options] @returns {string} */
export function sizesOf(layout, { crop } = {}) {
  const entries = ENTRIES[layout];
  if (!entries) return BASE_SIZES;
  const scale = crop && crop > 0 && crop < 100 ? Math.round((100 / crop) * 100) / 100 : 1;
  const length = (size) => (scale !== 1 ? `calc(${size} * ${scale})` : /[ ]/.test(size) ? `calc(${size})` : size);
  return entries.map(([media, size]) => `${media ? `${media} ` : ''}${length(size)}`).join(', ');
}

/** How many of the first images of a carousel at the top of the page are loaded at once: the ones its first screen shows (two on a phone, three or more on a computer). */
export const EAGER_IMAGES = 3;

/** The loading attributes of a carousel's image: `rank` is its place among the images of a carousel at the top of the page (-1 elsewhere). The first is eager with high priority, as it
 * is the page's largest image and the browser would otherwise find it late; the next ones the first screen shows are eager too; every other is lazy. `decoding` stays async.
 * @param {number} rank @returns {{ loading: 'eager' | 'lazy'; fetchPriority: 'high' | undefined }} */
export const loadingOf = (rank) =>
  rank === 0
    ? { loading: 'eager', fetchPriority: 'high' }
    : { loading: rank > 0 && rank < EAGER_IMAGES ? 'eager' : 'lazy', fetchPriority: undefined };
