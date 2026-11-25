// The width and lead rules of a page's text (theme/layouts/PageLayout.astro), for check-side.mjs: textClasses reads the
// classes of the text wrapper from built HTML; widthProblem and leadProblem say what is wrong with them. No dependencies,
// so a unit test can run it. The wrapper says which kind of text it is (`mo-has-side`, `mo-is-single-column`), and the rules of that kind are
// in theme/styles/site-page.css (`.mo-page__text`): with a column the text stops at the page text measure; without one it is as wide as its
// container, its first paragraph is the lead and only its parts outside the blocks stop at the measure.

/** The classes of the text wrapper (data-editor="text") in a built page. */
export const textClasses = (html) =>
  html
    .match(/<div data-editor="text" class="([^"]*)"/)?.[1]
    .replace(/&(amp|gt);/g, (_, entity) => (entity === 'amp' ? '&' : '>'))
    .split(/\s+/) ?? [];

export const WITH_COLUMN = 'mo-has-side';
export const WITHOUT_COLUMN = 'mo-is-single-column';

/** The lead rule: without a column the text's first paragraph is the lead (`mo-is-single-column`: mo-type-lead's size, muted, 52ch); with one it is not. */
export function leadProblem(text, side) {
  if (side) return text.includes(WITHOUT_COLUMN) ? 'its first paragraph should not be a lead' : null;
  return text.includes(WITHOUT_COLUMN) ? null : `its first paragraph should be a lead (${WITHOUT_COLUMN})`;
}

/** The width rule for the text's classes: with a column the text stops at the page text measure (`mo-has-side`, the token
 * --mo-comp-block-text-measure-max); without one the text is as wide as its container (`mo-is-single-column`) and only its parts outside the
 * blocks stop at the measure. Returns what is wrong, or null. */
export function widthProblem(text, side) {
  if (side)
    return text.includes(WITH_COLUMN) && !text.includes(WITHOUT_COLUMN) ? null : `its text should be ${WITH_COLUMN}, not ${WITHOUT_COLUMN}`;
  return text.includes(WITHOUT_COLUMN) && !text.includes(WITH_COLUMN)
    ? null
    : `its text should be ${WITHOUT_COLUMN}, with the text measure for what is not a block`;
}
