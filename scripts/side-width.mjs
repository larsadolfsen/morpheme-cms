// The width rule of a page's text (theme/layouts/PageLayout.astro), for check-side.mjs: textClasses reads the classes of
// the text wrapper from built HTML; widthProblem says what is wrong with them. No dependencies, so a unit test can run it.

/** The classes of the text wrapper (data-editor="text") in a built page. */
export const textClasses = (html) =>
  html
    .match(/<div data-editor="text" class="([^"]*)"/)?.[1]
    .replaceAll('&amp;', '&')
    .replaceAll('&gt;', '>')
    .split(/\s+/) ?? [];

/** The width rule for the text's classes: with a column the text stops at 66ch; without one the text is as wide as its
 * container (max-w-none) and only its parts outside the blocks stop at 66ch. Returns what is wrong, or null. */
export function widthProblem(text, side) {
  if (side) return text.includes('max-w-[66ch]') && !text.includes('max-w-none') ? null : 'its text should be max-w-[66ch], not max-w-none';
  return text.includes('max-w-none') && text.includes('[&>:not(.not-prose)]:max-w-[66ch]')
    ? null
    : 'its text should be max-w-none, with 66ch for what is not a block';
}
