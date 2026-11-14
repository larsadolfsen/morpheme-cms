// The one rule for the alternative text of an image in use (the grid, the Image in a text, the hero and section images, the
// post's top image): the use's own text wins, else the Library's base text (the image's record, src/fileRecords.mjs), else
// there is none. Decorative follows the same order: a use marked decorative draws `alt=""` whatever the Library says; a Library image
// marked decorative is decorative in every use that has no text of its own. Nothing is ever made up. Pure, so node --test can run it.

/**
 * @typedef {{ alt?: string; decorative?: boolean }} AltUse An image in use: its own text, and whether it is marked decorative there.
 * @typedef {{ alt?: string; decorative?: boolean }} AltBase What the Library's record of the image holds.
 * @typedef {{ alt: string; decorative: boolean; from: 'use' | 'library' | 'none' }} AltResolved `alt` is what to draw (the empty string for a decorative image or none); `from` says where it came from.
 */

/**
 * The text an image in use is drawn with.
 * @param {AltUse} use
 * @param {AltBase | undefined} [base]
 * @returns {AltResolved}
 */
export function resolveAlt(use, base) {
  if (use.decorative) return { alt: '', decorative: true, from: 'use' };
  const own = use.alt?.trim();
  if (own) return { alt: own, decorative: false, from: 'use' };
  if (base?.decorative) return { alt: '', decorative: true, from: 'library' };
  const library = base?.alt?.trim();
  if (library) return { alt: library, decorative: false, from: 'library' };
  return { alt: '', decorative: false, from: 'none' };
}
