# Cards: the multi-aspect ratio carousel

Owner, 25 Nov 2026 (relayed by PM 0.19.6): the Cards block gets Material 3's uncontained multi-aspect ratio carousel as a layout choice.
The theme's Carousel has the layout from PR #1194 (`layout="multi-aspect-ratio"`, an item's `aspect`); this spec puts it in the block.

## What Material 3 prints (read with Playwright on 25 Nov 2026)

- Carousel, Guidelines: "The uncontained multi-aspect ratio carousel has the same layout as the uncontained carousel but contains items
  of various sizes. Item widths can range anywhere between 9:16 for min width size to 16:9 for max width. Only use this carousel layout if
  the items have various widths."
- Carousel, Specs: "Uncontained multi-aspect ratio carousels only have leading padding, with 8dp of padding between items"; alignment
  vertically centered, leading padding 16dp, top and bottom padding 8dp, item corner radius 28dp.
- Carousel, Guidelines: "Carousel items emphasize visuals, but can also contain brief text that adapts to the item size."

Pages read: `https://m3.material.io/components/carousel/overview`, `…/specs`, `…/guidelines`, `…/accessibility`.

## The design

1. **The choice.** The block's `layout` field (shown only with `phone: carousel`) gets the option `multi-aspect-ratio`, labelled
   **Multi-aspect ratio** (da-DK `Flere formater`), after Uncontained, with the hint "Cards of different widths, each as wide as its
   image." (da-DK "Kort i forskellige bredder, hvert så bredt som sit billede."). Like the other layouts it is a version of the block of
   its own under Blocks (`versions`).
2. **Only with images.** The widths come from the images, so the option is offered only when `media` is `image` (the field's `only`
   gets that condition for this option). `layoutOf` in `src/standard/cards/view.ts` gives `multi-aspect-ratio` only when the block has
   a carousel and image media; otherwise it gives the uncontained layout, so a block switched to icons or no media keeps working and
   its stored choice comes back when images do.
3. **The card's aspect ratio.** Each card gets `aspect` (string), labelled **Image aspect ratio** (the block's existing `ratio` label
   and its Danish), hint "This card's image uses it." (da-DK "Dette korts billede bruger det."). Options, narrow to wide:
   `9:16`, `2:3`, `3:4`, `4:5`, `1:1`, `4:3`, `3:2`, `16:9` (FORMATS plus M3's 9:16 minimum; nothing outside 9:16 to 16:9). Default
   `1:1`. It shows only with this layout, in the card's sheet right after the image and its alt text (add `aspect` to `inline.media`
   in `src/standard/cards/index.tsx`, after `alt`). With this layout the block's `ratio` field is hidden; it stays stored and is used
   again when the layout changes back.
4. **What a card is in the carousel.** The card is the carousel item: its width follows its image's aspect at the carousel's item
   height (the Carousel's `aspect`, clamped by `aspectOf`), with the image on top in M3's 28dp corners and the card's headline, subhead,
   text and its link or buttons below, as brief text that wraps to the card's width. The design (outlined, filled, elevated), colour,
   Highlighted and the link or buttons work as in every other layout. Free scrolling and no page indicator, as the Carousel does.
5. **Larger screens.** As for every layout today, the carousel is for phones only (`phoneHint`): from 600 dp the cards show together, and
   each image keeps its own card's aspect, so what the owner chose per card is seen everywhere. Cards are top-aligned in their row.
6. **The image crop.** The image field crops to the card's `aspect` (the same crop `ratio` drives today, `lib/crop.mjs`), so the picked
   focus point holds in every shape.
7. **Editor.** The inline view (`InlineCards.tsx`) draws the same layout through the same `View.tsx` and Carousel. The aspect is picked in
   the card's sheet; nothing changes in the editor's bar or menus. `viewOf.ts` and `load.ts` pass `aspect` through.
8. **Accessibility.** Each card stays a list item with its name (the Carousel's `aria-roledescription` and labels); free scrolling is
   reachable by keyboard and swipe as in the uncontained layout. Alt text works as for any card image.
9. **No migration.** No card has `aspect` today; a block without the new layout draws as before.

## Delivered with it

- Texts in `src/i18n/en-US/blocks.ts` and `src/i18n/da-DK/blocks.ts` (`layoutMultiAspect`, `layoutMultiAspectHint`, `aspectHint`);
  `check:language` and `check:content` green.
- The demo's `/blocks/cards/` page gets a carousel group in this layout with images of five different shapes (9:16 to 16:9), next to the
  highlighted groups.
- A screens unit in `scripts/screens/<area>.mjs` for the layout and the card sheet's aspect field.
- Before and after screenshots, phone and computer; a release note (both languages); the changeset the base allows.

## Order

0.19.6 (owner, 25 Nov 2026), branch `feature/0.19.6-m3-names`, after the last open 0.19.6 pull request is merged. Divider #1196 and Carousel #1194 are merged; then one developer session for both Cards specs, as two pull requests in a row on the same files:
first this one (`cards-multi-aspect`), then `cards-highlighted` merged after it from the updated feature branch. One session avoids two
sessions conflicting in `src/standard/cards/` and `theme/styles/cards.css`.
