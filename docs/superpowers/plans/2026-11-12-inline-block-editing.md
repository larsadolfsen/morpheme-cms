# Plan: typing every block in place

Design: `docs/superpowers/specs/2026-11-12-inline-block-editing-design.md` (section 5 has Cards, read from the Material 3 pages).
Status: plan for the project manager to hand to new sessions. One small pull request each, into `main`, each with the checks of the
spec and a changeset (`patch` or empty into `main`, else the owner decides).

## Done in #413 (waiting on the owner and the PM)

1. Shared parts for typing a block in place: `InlineItems`, `InlineField`, `InlineSlot`, `InlineAdd`; a block says how it is typed with
   `inline: { item, fields, icon, link, media, settings, blockSettings, texts }` (`src/blocks.ts`); its drawing is in `src/inlineViews.tsx`.
2. Cards on Material 3: media per card (icon, picture or video), types Outlined, Filled, Elevated; buttons on a card without a page.
   Old cards migrate (`FORMER.cards` in `lib/blocks.mjs`), the demo is migrated.
3. Cards typed in place (`src/InlineCards.tsx`): headline and text where they stand; Media and Link slots on the active card.

Not yet checked there: `check:demo`, `check:starter`, and a look at the typed cards in a browser.

## Owner decisions so far

- Follow Material 3. Card types Outlined (default), Filled, Elevated. Filled starts with Material's own color; Primary, Secondary and
  Tertiary are extra.
- Media is an icon, a picture or a video (a still with a play button). A video card is not a link.
- A card with a page is one link and has no buttons. A card without a page may have buttons.
- The old Colored background becomes Filled in the primary color.

## Cards: a carousel setting for mobile (owner, 2026-11-12)

A card setting (block level, in Edit next to Type and Color) that shows the cards as a carousel on a phone instead of stacked. The theme
already has a carousel (`theme/ui/Carousel.tsx`, `carouselLayout.ts`). Before building, read the Material 3 carousel pages
(m3.material.io/components/carousel) with the Playwright script, not from memory: which layouts M3 has (multi-browse, uncontained, hero),
item sizes, and the rule for cards in a carousel. Open: which layout the phone uses, and whether it is also offered on larger screens.
Own pull request after #413; it changes what a site shows, so it needs a release note line and the `check:screens` phone pass.

## Order of the rest

1. Points with icon, Steps, Checklist (one pull request, the shape of the List).
2. Segmented list and Questions and answers (check that "Rows from" shows the read-only list and is not typed).
3. Price cards (nested features) and Buttons (the label typed on the button).
4. Links (two levels: `Add group`, `Add page`).
5. Notice and Video (the `until` date stays in the sheet).
6. Document `inline` for apps' blocks; no app is moved without its own pull request.

Each block adds its drawing to `src/inlineViews.tsx`, an `inline` definition to its `index.tsx` and one entry to `inlineBlocks` in
`scripts/editor-screens.mjs`.

## Open questions for the owner

1. Buttons per card: one or several? (built for several, as M3's action area has.)
2. Old Standard cards draw outlined in the Material theme now (they were on the highest surface). Keep, or keep them filled-looking?
3. The minor changeset of #413 (main takes `patch` or empty by the rule).
4. Paste-to-create items: a pasted list of lines becomes items (Checklist, Steps, Questions and answers).
5. Converting a block into another (List to Segmented list, keeping the items).
