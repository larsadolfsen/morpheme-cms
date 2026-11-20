// Which of a form's sections is in view while the page scrolls (EntryForm.tsx marks it in the sections list): pure, so it
// is tested (section-in-view.test.mjs). Exports sectionInView and spyLine. No dependencies.

/**
 * @param {string[]} order the sections, from the top of the page down
 * @param {Record<string, number | undefined>} tops each section's top, from the top of the window
 * @param {number} line
 * @returns {string | undefined} the last of `order` whose top is above `line`; with all of them below it, the first one that is drawn; a section with no top (`undefined`: not drawn) is skipped.
 */
export function sectionInView(order, tops, line) {
  /** @type {string | undefined} */
  let here;
  for (const id of order) {
    const top = tops[id];
    if (top !== undefined && (here === undefined || top <= line)) here = id;
  }
  return here;
}

/**
 * where a section's top must be to count as in view: a third of the window's height; at the bottom of the page, 96px above the window's bottom, so the last section can be marked.
 * @param {number} height the window's height
 * @param {boolean} atBottom the page is scrolled to its end
 */
export const spyLine = (height, atBottom) => (atBottom ? height - 96 : height / 3);
