// The levels of a page's headings as the editor keeps them: the first heading is the page's H1, and no later one is.
// Exposes headingLevels, showsH1Choice and headingChoices (pure); the editor's plugin that applies it is src/firstHeading.mjs. No dependencies.

/**
 * The levels with the first set to 1 and every later 1 set to 2 (the others as they are).
 * @param {number[]} levels The levels (1 to 6) of the headings of a text, in order.
 * @returns {number[]}
 */
export function headingLevels(levels) {
  return levels.map((level, i) => (i === 0 ? 1 : level === 1 ? 2 : level));
}

/** Whether the editor offers the H1 choice: only while the text has no H1 (a page has one H1, its first heading).
 * @param {number[]} levels The levels (1 to 6) of the headings of a text, in order.
 * @returns {boolean} */
export const showsH1Choice = (levels) => !levels.includes(1);

/** The heading levels the editor offers on a page: only the H1 while the text has no H1, after that H2 and H3.
 * @param {number[]} levels The levels (1 to 6) of the headings of a text, in order.
 * @returns {number[]} */
export const headingChoices = (levels) => (showsH1Choice(levels) ? [1] : [2, 3]);
