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
- **Sizes (Specs, uncontained).** Leading padding 16 dp, top and bottom padding 8 dp, gap between items 8 dp, item corner radius
  28 dp. At compact widths up to three items at once, and only with text if there are no more than three. Uncontained items bleed
  past the padding on each side and the next one peeks in.
- **Scrolling.** Snap-scrolling for multi-browse, hero and full-screen; default scrolling is for uncontained (snap also works).
- **Accessibility.** On a page that scrolls vertically, a carousel needs a way to see all items without scrolling sideways (not
  full-screen): a *Show all* button under it (4 dp padding) that opens a dedicated vertically scrolling page of all items, or, when
  the carousel has a header, a 48 dp arrow icon button next to the header; the header is repeated on that page. Avoid customizing
  this; if a product must, put a *Show all* button in nearby navigation. Tab moves focus to the first item (not to the container),
  then Tab or the arrow keys move between items; Space or Enter activates the focused item; Up and Down leave the carousel. The
  container has the container role and a label; each item's label says the item in focus and the total. Do not add buttons or
  other UI inside the carousel or beside it, or cover it: buttons go above or below. Tapping an item shows a ripple and a
  slight shape change. With reduced motion there is no parallax and no growing items: all items the same size, reaching the
  window's edges.

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
- M3's measurements are set for the Cards carousel on `.block-cards-carousel`: `--carousel-gap: 0.5rem` (8 dp; the theme's default
  is 1 rem), `padding-block` 0.5 rem (8 dp), and the card's corners are the carousel's `--carousel-item-radius` (28 dp, the
  theme's extra-large shape) so that the item and the card are one shape. `--carousel-bleed` stays the page's gutter (1.25 rem).
  `--carousel-dot-*` as they are.
- `check:themes` (`scripts/check-themes.mjs`) builds the demo with each theme and opens every screen. Add a demo page with a
  Carousel-on-phones Cards block, so each theme is checked with it, and make `check:themes` fail a theme that leaves
  `.block-cards-carousel` unstyled (no `overflow-x: auto`), the way it is meant to fail one that leaves a design unstyled (#413).

## Following Material 3, point by point

| M3 point (carousel pages) | In this proposal |
| :--- | :--- |
| Layout best for text-heavy items | Uncontained. |
| Items bleed past the padding, the next peeks in | The theme's uncontained row (86 % items, `--carousel-bleed`). |
| Gap 8 dp, top and bottom padding 8 dp, corners 28 dp | Set on `.block-cards-carousel` (above). |
| Leading padding 16 dp | The page's gutter, 1.25 rem (20 px), so the first card lines up with the text (see Remaining deviations). |
| Up to two lines of text at compact widths unless the background is simple | A card's surface is one colour (outlined, filled or elevated), which M3 counts as simple; the card's text is clamped by the theme as it is in the grid. |
| Snap-scrolling is for multi-browse, hero and full-screen; uncontained may use either | Snap on (`scroll-snap-type: x mandatory`, already the theme's). |
| A way to see all items without sideways scrolling | `Show all` (below). |
| Container is labelled and has the container role | `role="region"` with `aria-label` (the block's heading, else `Cards`) and the roledescription `carousel`, as `Carousel.tsx` does. |
| An item's label says which of how many it is | `aria-label` `n of N` on each item (`siteT.blocks.testimonials.slideOf`, to move to a shared text `siteT.blocks.cards.slideOf`). |
| Tab or arrows move between items; Space or Enter activates; Up and Down leave; the container is not focused | See Keyboard. |
| No buttons or other UI inside or beside the carousel, none covering it | The page indicator and `Show all` are under the row. A card's own link or buttons are the item's content, not controls of the carousel. |
| Reduced motion: no parallax, no growing items, edges reached | Uncontained has neither; the indicator jumps instead of scrolling smoothly; the row reaches the phone's edges (`--carousel-bleed`). |

### Show all

- A text button `Show all` (da-DK `Vis alle`) under the carousel, under the page indicator, with 4 dp padding as M3 says. It is
  a real button (`aria-expanded`). Pressed, the carousel turns into the stacked cards in place (the same cards, no new page,
  no reload), the button reads `Show fewer` (da-DK `Vis færre`) and returns the carousel; focus stays on the button.
- Shown only on phones (below 600 px) and only with JavaScript. Without JavaScript the row is not styled as a carousel at all:
  the CSS is under `.js` (set by `Base.astro`), so the cards are simply stacked and nothing is missing.
- When the block has a heading M3 allows an arrow icon button next to it instead; we use `Show all` always, which M3 gives
  as the default.
- The state is not saved: every visit starts as a carousel.

### Keyboard

- Items are not tab stops themselves; the item's focus target is its link (a card with a page is one link) or its first button.
  A card with neither (text only) has `tabindex="0"` on its item so it is reachable. The container is never focused.
- Left and Right arrows (Right and Left when the page is right-to-left) move focus to the previous or next item's target and scroll
  it into view; Tab does the same through the items and then on to the next control; Up and Down are not handled, so they leave
  the row as they do anywhere. Space or Enter activates a link or button as it already does.
- `Show all` is the next tab stop after the last card.

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
- **Keyboard and labels (`check:screens`, phone):** Tab reaches the first card and not the container; the arrow keys move
  between cards and scroll them into view; each item reads `n of N`; the container has a label; `Show all` expands the cards
  in place and `Show fewer` returns them, with focus kept on the button; without `.js` the cards are stacked and there is no button.
- **Measurements (`check:screens`, computed style at 375 px):** gap 8 px, vertical padding 8 px, the card's corners 28 px.
- **Reduced motion:** with `prefers-reduced-motion`, the carousel's dots jump (no smooth scroll), as in `carousel.script.ts`.
- **Release note:** one *line* (the setting changes what a site shows, but it is opt-in): English and Danish with
  the `release-notes` skill. Changeset: `minor` into a version line that allows it; into `main` `patch` until 0.15.1 is out.

## Remaining deviations from Material 3

1. **Leading padding is 20 px (the page's gutter), not 16 dp**, so the first card lines up with the text above it. M3's 16 dp is
   the inset from the screen edge of an app; on a site the page's gutter is the nearest equal. Changing the gutter for one block
   would misalign it with the rest of the page.
2. **`Show all` expands the cards in place instead of opening a dedicated page.** M3's recommendation is a page of all items; we
   have no such page for a block, and a page per block is out of proportion. The requirement itself (all items reachable without
   sideways scrolling) is met, and the PM and owner asked for it in place.
3. **Larger screens show a grid, not a carousel** (the setting is `On phones`). M3 shows more items at once on larger screens; the grid
   shows all of them.

## Open questions, with my recommendation

1. **Phone only, or larger screens too?** Recommend phone only: the grid shows all cards, which is M3's accessibility rule, and a
   carousel of cards on a computer hides content for nothing. If the owner wants it, a later `On tablets` is a new value.
2. **`Show all` in place, or a page?** Recommend in place (deviation 2): no new route, no extra build output, works with the
   editor's Preview and the demo. A dedicated page would follow M3 to the letter and is a larger build.
3. **One markup or two?** Recommend one: the `Carousel` markup drawn for the cards and turned into the grid by CSS at `medium`,
   not two lists with one hidden. It keeps one copy of the text and pictures for search and screen readers; the cost is that a
   screen reader on a computer still hears "carousel". Alternative: draw both and hide one with `display: none` (cleaner
   announcements, double markup).

## How it is built

One implementation pull request, started from `main` after the Cards-changes pull request (#413 and its follow-up, in progress)
is merged, because it changes the same files (`src/standard/cards/*`, `theme/blocks/cards/LinkCards.tsx`, `blocks.css`). It holds the
setting, the carousel drawing with `Show all` and the keyboard, the theme CSS, the strings in both languages, the tests and
screens checks, and the release note line.
