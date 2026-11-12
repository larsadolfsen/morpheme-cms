# Cards: a carousel on phones (design proposal)

Status: proposal for the owner, 2026-11-12. No code. Follows "Cards: a carousel setting for mobile" in
`docs/superpowers/plans/2026-11-12-inline-block-editing.md` (PR #413). Builds on the Cards settings of #413 (`kind`, `color`).

## What Material 3 says

Read from m3.material.io/components/carousel (Overview, Specs, Guidelines, Accessibility), rendered with Chromium on 2026-11-12.

- **Layouts.** Multi-browse, uncontained, hero (start or centre aligned) and full-screen; since November 2025 also uncontained
  multi-aspect ratio (not in the theme, not needed).
- **Best for.** Multi-browse: many visual items, like photos. Hero: spotlighting very large visual items. Full-screen:
  immersive, vertically scrolling feeds, portrait only. **Uncontained: "highly-customized or text-heavy carousels, stacked image
  and text, traditional carousel behavior"**; its items keep one size, so text is never masked or cropped.
- **Text.** Items are primarily visual; text is brief. "If your carousel items require a lot of text, consider using the
  uncontained layout, or use a series of cards instead." Avoid more than two lines of text in an item at compact widths, unless the
  background is simple. Multi-browse and hero shrink items to 40–56 dp and mask them, so they hide text.
- **Sizes.** Item corners 28 dp, gap 8 dp, 16 dp padding at the start, 8 dp above and below. At compact widths up to three items
  at once, and only with text if there are no more than three. Uncontained items bleed past the padding and the next one peeks in.
- **Scrolling.** Snap-scrolling for multi-browse, hero and full-screen; default scrolling is for uncontained (snap also works).
- **Accessibility.** On a page that scrolls vertically, a carousel needs a way to see all items without scrolling sideways (not
  full-screen): a *Show all* button under it, or an arrow next to its header. Tab or arrows move between items, Space or Enter
  activates; the container is labelled and an item's label says which of how many it is; no buttons over or beside the carousel. With
  reduced motion there is no parallax and no growing items: all items the same size, reaching the window's edges.

## The setting

- **Name (en-US):** `On phones`, a segmented choice in the block's Edit sheet under the card `Design` (the #413 `kind`, to be named
  `Design`) and `Color`. Values: `Stacked` (default) and `Carousel`.
- **da-DK:** `På mobil`, with `Stablet` and `Karrusel`.
- **Hint (en-US):** `Cards are swiped sideways on a phone. Larger screens show them together.`
- The setting is shown for Cards only when there are at least two cards; one card is never a carousel.

## Which layout a phone uses

**Uncontained**, the theme's default (`carouselClass('uncontained')`). A card has a headline, supporting text, media and a link or
buttons: that is "text-heavy, stacked image and text", which M3 gives to uncontained. One card is shown full width with the next
one peeking in (the theme's `--carousel-bleed` takes the row to the phone's edges), snap-scrolling, with the theme's page indicator
under it. Multi-browse and hero would mask the card's text and buttons, and full-screen is not for cards. `carouselLayout.ts` is not
used (only `keylineLayouts` run it), so there is no script work and nothing moves under reduced motion.

## Larger screens

No. At `medium` (600 dp) and up the cards stay the grid they are. M3 shows more items at once on larger screens, and a grid shows
all of them, which meets its "see all items without scrolling sideways" rule where the carousel cannot. The switch is at the
`compact`/`medium` breakpoint of `lib/breakpoints.mjs` (below 600 px), in CSS, so it follows the window and not the device.

## How the editor previews it

- **In place** (the inline Cards of #413): always the stacked cards. Editing inside a row that scrolls sideways would hide the card
  being typed in. When `On phones` is `Carousel` the block's toolbar shows a small chip, `Carousel on phones`, so the choice is not
  forgotten.
- **Edit sheet:** the block's preview gets a variant, `Carousel`, drawn with the real `Carousel` component at phone width.
- **Preview** of the page (the bar of window sizes): the real carousel at the phone size, as the site draws it. Here the owner
  swipes, sees the indicator, and checks it.

## What the theme must style

`Carousel` is already one of the theme's parts (`site/themeParts.mjs`, prefix `carousel`), so a theme that styles it has what this
needs. New for the cards:

- `LinkCards.tsx` draws, with `phone: 'carousel'`, the `Carousel` markup (uncontained) around the same cards, with a card as the
  item's content, and `block-cards-carousel` on it. `blocks.css` turns it into the grid at `medium` and up (no row, indicator
  hidden) and gives a card in the row a width of about 85 % of the row, so the next one shows.
- Per design (`kind`: outlined, filled, elevated; `color`): the card keeps its own surface, outline and elevation, and an elevated
  card needs room above and below the row for its shadow, which `overflow-x: auto` would clip: `padding-block` on the row.
- Tokens already there: `--carousel-bleed`, `--carousel-gap`, `--carousel-item-radius` (a card keeps its own corners, so the item has
  none), `--carousel-dot-*`.
- `check:themes` (`scripts/check-themes.mjs`) builds the demo with each theme and opens every screen. Add a demo page with a
  Carousel-on-phones Cards block, so each theme is checked with it, and make `check:themes` fail a theme that leaves
  `.block-cards-carousel` unstyled (no `overflow-x: auto`), the way it is meant to fail one that leaves a design unstyled (#413).

## The saved prop and migration

- `phone: 'carousel'` on the block's props. Absent (and `''`) is stacked. A select with an empty first value, as `kind` is, so a
  later `hero` for picture-only cards is a new value, not a new field.
- **No migration.** Existing cards have no `phone`, and read as stacked; saved back they stay without it. `FORMER.cards` is not
  touched. No new `check:content` rule beyond the field's own options.
- The site's `load.ts` and the editor's `view.ts` carry `phone` into `CardsView`.

## Tests and screens checks

- **Unit:** `view.ts` carries `phone`; a missing `phone` is stacked; fewer than two cards never makes a carousel; the saved props of an
  old Cards block are unchanged by an open and a save (the existing round-trip check).
- **`check:screens` (phone 375 px and computer 1280 px):** with a Cards block on `Carousel`: at 375 the row scrolls sideways, one
  card is whole and the next peeks in, the indicator shows one dot per card, no card is clipped (an elevated one keeps its shadow),
  no horizontal scroll on the page; at 1280 the same block is the grid and the indicator is hidden. The Edit sheet shows the
  setting only with two cards or more. In place, the cards are stacked and the chip shows.
- **`check:themes`:** as above, with every installed theme.
- **Reduced motion:** with `prefers-reduced-motion`, the carousel's dots jump (no smooth scroll), as in `carousel.script.ts`.
- **Release note:** one *line* (the setting changes what a site shows, but it is opt-in): English and Danish with
  the `release-notes` skill. Changeset: `minor` into a version line that allows it; into `main` `patch` until 0.15.1 is out.

## Open questions, with my recommendation

1. **Phone only, or larger screens too?** Recommend phone only: the grid shows all cards, which is M3's accessibility rule, and a
   carousel of cards on a computer hides content for nothing. If the owner wants it, a later `On tablets` is a new value.
2. **Is a *Show all* button needed?** M3 requires a way to see all items without sideways scrolling on a vertically scrolling page.
   Recommend that we do not build a Show all page: every card is in the page in reading order and is focusable, the indicator dots
   are buttons that jump to a card, and `Stacked` stays the default. This is a small deviation from M3, and the owner should accept it.
3. **One markup or two?** Recommend one: the `Carousel` markup drawn for the cards and turned into the grid by CSS at `medium`,
   not two lists with one hidden. It keeps one copy of the text and pictures for search and screen readers; the cost is that a
   screen reader on a computer still hears "carousel". Alternative: draw both and hide one with `display: none` (cleaner
   announcements, double markup).
