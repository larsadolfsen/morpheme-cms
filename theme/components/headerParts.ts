// The classes of the header's parts that its settings move or put in (Header.astro, MobileNav.astro), shared with the
// editor's preview of the header (src/headerTheme.tsx), so both draw them the same.
// Exposes headerEdge, headerMenuClass, headerCtaClass, mobileNavClass and mobileNavListClass. Uses ui/Tabs.tsx.
import { tabsClass } from '@theme/ui/Tabs';

/** The place of a part at the start of the row (the menu button) and at its end (the phone, or the menu button). */
export const headerEdge = { start: '-ml-2 mr-1', end: '-mr-2 ml-1' } as const;

/** The menu button's box at either side: shown where the menu's items are not (below large, or when they do not fit). */
export const headerMenuClass = (side: 'start' | 'end') => `${headerEdge[side]} large:hidden large:group-data-crowded/header:block`;

/** The header's own button's box (header.json): only from the medium window size up. */
export const headerCtaClass = 'hidden shrink-0 medium:block';

/** The bar of "Mobilmenu" under the header, where the menu's items are not, and its row of tabs. */
export const mobileNavClass = 'large:hidden large:group-data-crowded/header:block';
export const mobileNavListClass = `${tabsClass} relative mx-auto max-w-6xl px-1 medium:px-4`;
