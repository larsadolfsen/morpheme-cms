// Material 3's breakpoints (m3.material.io/foundations/layout/breakpoints): the window widths where the site's and the
// editor's layouts change, for scripts (matchMedia, the preview's widths). The CSS has the same ones as Tailwind's
// --breakpoint-* (theme/styles/base.css); breakpoints.test.mjs checks that they agree.

/** @typedef {'compact' | 'medium' | 'expanded' | 'large' | 'extraLarge'} Breakpoint */

/** Where each breakpoint begins, in dp (CSS px); compact is everything below medium. */
export const BREAKPOINTS = /** @type {const} */ ({ compact: 0, medium: 600, expanded: 840, large: 1200, extraLarge: 1600 });

/** The media query for a window at least as wide as a breakpoint, in rem as the CSS writes it.
 * @param {Exclude<Breakpoint, 'compact'>} name */
export const atLeast = (name) => `(width >= ${BREAKPOINTS[name] / 16}rem)`;

/** The breakpoint a window `width` px wide is in.
 * @param {number} width
 * @returns {Breakpoint} */
export function breakpointOf(width) {
  const names = /** @type {Breakpoint[]} */ (Object.keys(BREAKPOINTS));
  return names.findLast((name) => width >= BREAKPOINTS[name]) ?? 'compact';
}
