// The 4 dp grid of the site's spacing (docs/superpowers/specs/2026-11-13-site-spacing-audit.md, step 6): checkSpacingGrid in
// editor-screens.mjs measures every margin, padding and gap of the demo's Blocks page at 375 and 1280 and fails on one that is
// not a multiple of 4 px. Material 3 prints a few nested units that are half or a quarter of that (the unit it draws is 4 dp,
// its small gaps 2, 6 and 10), and a few spaces are not ours to set: they are the reasons below.

/** Values in px that Material 3 prints inside a part (2: the gap of a segmented list, 6 and 10: a part's small inner spaces). */
export const nestedUnits = [2, 6, 10];

/**
 * A deliberate exception: an element (CSS `selector`, tested with `matches`) and the properties (`props`: margin, padding
 * or gap, each of any side) that may be off the grid, with the reason. An entry that matches nothing is no problem, but
 * an exception that has been fixed should go.
 */
export const allow = [
  {
    selector: ':not(pre) > code',
    props: ['padding'],
    reason: "inline code in a text: the text style's padding in em (0.07 and 0.245 of its size), the box around a few letters, not layout",
  },
  {
    selector: '.mo-prose ul.contains-task-list, .mo-prose li.task-list-item',
    props: ['margin', 'padding'],
    reason:
      "a check list in a text: the text style's list spaces in em (the typography the theme had), a list in a text and not a block's own spaces",
  },
  {
    selector: '.mo-chip',
    props: ['padding'],
    reason:
      'a chip: Material 3 sets its height (32 dp), the room above and below its label is what is left of it (Density takes 2 px off each side)',
  },
  {
    selector: '.mo-visually-hidden',
    props: ['margin'],
    reason: 'the standard visually hidden text (1 px box, margin -1 px): it takes no room, so it is not layout',
  },
  {
    selector: '.mo-block-carousel__item-label',
    props: ['padding'],
    reason:
      "a carousel item's label: its side padding is 1rem plus the item's mask inset (a px value set while the item changes size, theme/ui/carouselLayout.ts), so the text stays inside the visible part of the item; it is not a layout space",
  },
];
