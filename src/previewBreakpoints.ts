// The window sizes the full-screen Preview (pagePreview.tsx) offers: the breakpoints the site and its theme have, read from
// the page in the frame (the theme's `--breakpoint-*` on :root, theme/styles/base.css), so a theme with other breakpoints
// shows its own; lib/breakpoints.mjs (Material 3's) is what a page without them gets. Also the page's height at each size.
import { BREAKPOINTS, type Breakpoint } from '../lib/breakpoints.mjs';

export const SIZES: Breakpoint[] = ['compact', 'medium', 'expanded', 'large', 'extraLarge'];

/** The CSS name of each size's variable (`--breakpoint-extra-large`). */
const VARIABLE: Record<Exclude<Breakpoint, 'compact'>, string> = {
  medium: '--breakpoint-medium',
  expanded: '--breakpoint-expanded',
  large: '--breakpoint-large',
  extraLarge: '--breakpoint-extra-large',
};

/** Where each size begins, in px: the page's own (a variable in rem or px) or, where it has none, Material 3's. */
export function siteBreakpoints(doc: Document | null | undefined): Record<Breakpoint, number> {
  const found: Record<Breakpoint, number> = { ...BREAKPOINTS };
  const root = doc?.documentElement;
  if (!root || !doc?.defaultView) return found;
  const style = doc.defaultView.getComputedStyle(root);
  const rem = parseFloat(style.fontSize) || 16;
  for (const name of Object.keys(VARIABLE) as (keyof typeof VARIABLE)[]) {
    const m = style
      .getPropertyValue(VARIABLE[name])
      .trim()
      .match(/^([\d.]+)(rem|px)$/);
    if (m) found[name] = parseFloat(m[1]) * (m[2] === 'rem' ? rem : 1);
  }
  return found;
}

/** The size a window `width` px wide is in, with those breakpoints. */
export const sizeAt = (width: number, at: Record<Breakpoint, number>): Breakpoint =>
  SIZES.findLast((name) => width >= at[name]) ?? 'compact';

/** The width a size is picked at: its beginning, its narrowest window, so the tightest layout is seen; compact at a common
 * phone's. */
export const widthOf = (size: Breakpoint, at: Record<Breakpoint, number>) => (size === 'compact' ? 390 : at[size]);

/** The height of the page at each size: a window of that size usually has, a phone's (an iPhone 14's, 844) for compact, a
 * tablet's (an iPad's, 1024 in portrait for medium, 800 in landscape for expanded) and a laptop's (800, a 1440 × 900 laptop's
 * with its bars; 900 for a larger screen). The page scrolls in it. */
export const HEIGHT: Record<Breakpoint, number> = { compact: 844, medium: 1024, expanded: 800, large: 800, extraLarge: 900 };

/** The narrowest and widest the page is dragged to, px. */
export const MIN_WIDTH = 320;
export const MAX_WIDTH = 2560;
