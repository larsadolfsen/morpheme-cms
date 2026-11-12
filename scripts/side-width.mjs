// The width and lead rules of a page's text (theme/layouts/PageLayout.astro), for check-side.mjs: textClasses reads the
// classes of the text wrapper from built HTML; widthProblem and leadProblem say what is wrong with them. No dependencies,
// so a unit test can run it.

/** The classes of the text wrapper (data-editor="text") in a built page. */
export const textClasses = (html) =>
  html
    .match(/<div data-editor="text" class="([^"]*)"/)?.[1]
    .replaceAll('&amp;', '&')
    .replaceAll('&gt;', '>')
    .split(/\s+/) ?? [];

/** The width rule for the text's classes: with a column the text stops at 66ch; without one the text is as wide as its
 * container (max-w-none) and only its parts outside the blocks stop at 66ch. Returns what is wrong, or null. */
export const LEAD = ['[&>p:first-child]:type-lead', '[&>p:first-child]:text-on-surface-variant', '[&>p:first-child]:max-w-[52ch]'];

/** The lead rule: without a column the text's first paragraph is the lead (type-lead, muted, 52ch); with one it is not. */
export function leadProblem(text, side) {
  const has = LEAD.filter((c) => text.includes(c)).length;
  if (side) return has === 0 ? null : 'its first paragraph should not be a lead';
  return has === LEAD.length ? null : 'its first paragraph should be a lead (type-lead, text-on-surface-variant, max-w-[52ch])';
}

export function widthProblem(text, side) {
  if (side) return text.includes('max-w-[66ch]') && !text.includes('max-w-none') ? null : 'its text should be max-w-[66ch], not max-w-none';
  return text.includes('max-w-none') && text.includes('[&>:not(.not-prose)]:max-w-[66ch]')
    ? null
    : 'its text should be max-w-none, with 66ch for what is not a block';
}
