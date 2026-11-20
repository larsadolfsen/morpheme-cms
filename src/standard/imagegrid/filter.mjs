// What the "Image grid" shows and how its tag filter works, as pure functions (the script of theme/blocks/imagegrid/ only wires them): which
// images, in which order and how many (`gridImages`), the tags to filter by, which images a choice of tags shows (an image shows only if it has
// all the chosen tags), which tags a visitor can still add without an empty grid, and the chosen tags in the page's address (`#tags=sea,food`).
// Used by view.ts, load.ts and the theme's script; node --test runs it (filter.test.mjs).

/** @typedef {{ src: string; tags: string[] }} Tagged An image of the grid, with the slugs of its tags. */

/** How many images a block shows when `Show at most` is empty. */
export const DEFAULT_MAX = 100;

/** The orders a block has, the first the default. */
export const ORDERS = ['newest', 'oldest', 'library', 'random'];

/** The month an image was uploaded in, "2026-10" (its folder, /images/uploads/<year>/<month>/), or '' outside such a folder. @param {string} src */
const monthOf = (src) => /\/(\d{4})\/(\d{2})\/[^/]+$/.exec(src)?.slice(1).join('-') ?? '';

/**
 * The images in the order the block asks for: `newest` and `oldest` by the month they were uploaded (then by name), `library` as they come (the
 * order the owner picked them in, or the Library's own), `random` shuffled (`random` is a function that gives 0 up to 1).
 * @template {{ src: string }} T
 * @param {T[]} images
 * @param {string} [order]
 * @param {() => number} [random]
 * @returns {T[]}
 */
export function ordered(images, order = 'newest', random = Math.random) {
  const list = [...images];
  if (order === 'library') return list;
  if (order === 'random') {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  // By month, newest first or oldest first; images of one month by name.
  const name = (a, b) => (a.src < b.src ? -1 : a.src > b.src ? 1 : 0);
  const month = (a, b) => (monthOf(a.src) < monthOf(b.src) ? -1 : monthOf(a.src) > monthOf(b.src) ? 1 : 0);
  return list.sort(order === 'oldest' ? (a, b) => month(a, b) || name(a, b) : (a, b) => month(b, a) || name(a, b));
}

/**
 * The number of images the block shows: `Show at most` as a whole number from 1 to 500, else DEFAULT_MAX.
 * @param {unknown} value
 * @returns {number}
 */
export function maxOf(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 500) : DEFAULT_MAX;
}

/**
 * The images that have any of the tags (all of them without tags): how a block picks its images by tags, as the posts and testimonials blocks do.
 * (The visitor's filter is another rule: an image must have all the chosen tags, `matching`.)
 * @template {Tagged} T
 * @param {T[]} images
 * @param {string[]} tags
 * @returns {T[]}
 */
export const withAnyTag = (images, tags) => (tags.length ? images.filter((image) => image.tags.some((tag) => tags.includes(tag))) : images);

/**
 * The images to show: those with any of the tags `anyOf` (all of them without tags), in the block's order, at most `max` of them.
 * @template {Tagged} T
 * @param {T[]} images
 * @param {{ anyOf?: string[]; order?: string; max?: unknown; random?: () => number }} [how]
 * @returns {T[]}
 */
export function gridImages(images, { anyOf = [], order, max, random } = {}) {
  return ordered(withAnyTag(images, anyOf), order, random).slice(0, maxOf(max));
}

/**
 * The tags the images have, each once, in the order they first come.
 * @param {Tagged[]} images
 * @returns {string[]}
 */
export const tagsOf = (images) => [...new Set(images.flatMap((image) => image.tags))];

/**
 * The images that have all of the chosen tags (all of them when none is chosen).
 * @template {Tagged} T
 * @param {T[]} images
 * @param {string[]} chosen
 * @returns {T[]}
 */
export const matching = (images, chosen) =>
  chosen.length ? images.filter((image) => chosen.every((tag) => image.tags.includes(tag))) : images;

/**
 * The tags a visitor cannot add to the chosen ones, because no image would be left: shown disabled, so the grid can never be emptied by a tap.
 * A chosen tag is never disabled (it can always be taken off).
 * @param {Tagged[]} images
 * @param {string[]} chosen
 * @param {string[]} [all] The tags in the filter; the images' own by default.
 * @returns {string[]}
 */
export function disabledTags(images, chosen, all = tagsOf(images)) {
  return all.filter((tag) => !chosen.includes(tag) && !matching(images, [...chosen, tag]).length);
}

/**
 * The chosen tags with `tag` taken off when it is chosen, else added at the end.
 * @param {string[]} chosen
 * @param {string} tag
 * @returns {string[]}
 */
export const toggled = (chosen, tag) => (chosen.includes(tag) ? chosen.filter((t) => t !== tag) : [...chosen, tag]);

/**
 * The tags in a page address's fragment (`#tags=sea,food`), the known ones only, each once, in the order they are written.
 * @param {string} hash
 * @param {string[]} known
 * @returns {string[]}
 */
export function chosenFrom(hash, known) {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get('tags') ?? '';
  return [...new Set(value.split(',').map((tag) => tag.trim()))].filter((tag) => tag && known.includes(tag));
}

/**
 * The fragment for the chosen tags: "tags=sea,food", or '' for none (so the address has no fragment).
 * @param {string[]} chosen
 * @returns {string}
 */
export const fragmentOf = (chosen) => (chosen.length ? `tags=${chosen.map(encodeURIComponent).join(',')}` : '');
