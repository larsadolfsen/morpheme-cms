// What a carousel's images are told about how wide they are drawn (View.tsx): the `sizes` of each layout and the loading of each item. Plain JavaScript so it is
// tested without a build (sizes.test.mjs). The numbers are the theme's own (theme/styles/cards.css, theme/styles/blocks/carousel.css, tokens/ui/comp/carousel.css): a browser picks
// the file from `sizes` before it has laid anything out, so a layout's `sizes` says what that layout draws, not one value for all.

/** The widest a page's content is (72rem, the page grid) and the margins of the row: 1rem a side below medium (600 px), 1.5rem from it. */
const PAGE = 'min(100vw, 72rem)';
const NARROW = '100vw - 2rem';
const WIDE = `${PAGE} - 3rem`;
/** Material's carousel height (`--mo-comp-carousel-height`, theme/styles/blocks/carousel.css): a multi-aspect item is this high and as wide as its aspect makes it. */
export const ITEM_HEIGHT_PX = 320;
/** Multi-browse's large item (`--mo-comp-carousel-large-item-width`), a hero's small item (`--mo-comp-carousel-small-item-max-width`) and the gap beside it. */
const LARGE = '12.5rem';
const SMALL_AND_GAP = '4rem';

/** The `sizes` of an item's image in each layout, as [media condition, width] entries (no condition: the last, the default). */
const ENTRIES = {
  // Large items as wide as the theme says, never wider.
  'multi-browse': [[null, LARGE]],
  // An item is 86% of the row on a phone, half of it from 616 px and a third from 840 px (the container queries of cards.css, plus the margins).
  uncontained: [
    ['(min-width: 840px)', `(${PAGE} - 5rem) / 3`],
    ['(min-width: 616px)', '(100vw - 4rem) / 2'],
    [null, `(${NARROW}) * 0.86`],
  ],
  // A hero's large item is the row less a small item and a gap, but never wider than twice its height: a wider row gets more large items (carouselLayout.ts, arrangement).
  hero: [
    ['(min-width: 600px)', `min(${PAGE} - 7rem, ${2 * 320}px)`],
    [null, '100vw - 6rem'],
  ],
  // The same with one or two items, where one large item takes the row.
  'hero-short': [
    ['(min-width: 600px)', `${PAGE} - 7rem`],
    [null, '100vw - 6rem'],
  ],
  // A center-aligned hero has exactly one large item between two small ones and two gaps.
  'hero-center': [
    ['(min-width: 600px)', `${PAGE} - 11rem`],
    [null, '100vw - 10rem'],
  ],
  // One item is the whole row: out to a phone's edges, the page's width from medium. From 840 px and in landscape it is drawn as a hero (FULL_SCREEN_AS_HERO in carouselLayout.ts).
  'full-screen': [
    ['((min-width: 52.5rem) or (orientation: landscape))', `min(${PAGE} - 7rem, ${2 * 320}px)`],
    ['(min-width: 600px)', WIDE],
    [null, '100vw'],
  ],
};

/** The layouts with a `sizes` of their own (multi-aspect-ratio has a width for each item). */
export const LAYOUTS = [...Object.keys(ENTRIES).filter((k) => k !== 'hero-short'), 'multi-aspect-ratio'];

/** `sizes` of an image in `layout`. multi-aspect-ratio: the item's own width (`aspect` is width / height, 9:16 to 16:9). `count`: the carousel's items (a hero of one or two has one large item, as wide as the row allows). `crop`: the part of the image shown, as percent of its width: the image is drawn that much wider than its box.
 * @param {string} layout @param {{ aspect?: number; crop?: number; count?: number }} [options] @returns {string} */
export function sizesOf(layout, { aspect = 1, crop, count = 3 } = {}) {
  const entries =
    layout === 'multi-aspect-ratio'
      ? [[null, `${Math.round(aspect * ITEM_HEIGHT_PX)}px`]]
      : (ENTRIES[layout === 'hero' && count <= 2 ? 'hero-short' : layout] ?? ENTRIES.uncontained);
  const scale = crop && crop > 0 && crop < 100 ? Math.round((100 / crop) * 100) / 100 : 1;
  const length = (size) => (scale !== 1 ? `calc(${size} * ${scale})` : /[ ]/.test(size) ? `calc(${size})` : size);
  return entries.map(([media, size]) => `${media ? `${media} ` : ''}${length(size)}`).join(', ');
}

/** The loading attributes of a carousel's image: the first one of a carousel at the top of the page (`first`) is eager with high priority, as it is the page's largest image and
 * the browser would otherwise find it late; every other is lazy. `decoding` stays async. */
/** @param {boolean} first @returns {{ loading: 'eager' | 'lazy'; fetchPriority: 'high' | undefined }} */
export const loadingOf = (first) => (first ? { loading: 'eager', fetchPriority: 'high' } : { loading: 'lazy', fetchPriority: undefined });
