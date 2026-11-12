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

## Steps: user stories

Steps has a heading and a text per step, numbered along a line, and nothing else to pick: no icon, no media, no link. So it is the
simplest in-place block, with no slots and no sheet.

**As a site owner,**

1. I insert Steps and start typing at once, with no sheet. I see one faded, empty step numbered 1; typing in it makes the first step.
2. I type each step's heading and text where they stand, drawn as the site draws them (the numbers and the line included).
3. Enter in the heading goes to the text. Enter in the text adds the next step below. Backspace in an empty heading removes the step.
4. While the block is active, a text button `Add step` is under the last step. It is gone when I leave the block.
5. The active step has the dotted outline and no background color; the other steps show their live look.
6. A floating toolbar has `Add above`, `Add below`, `Move up`, `Move down` and the block's menu (Hide, Move, Remove). There is no Link and
   no Edit button, because a step has nothing to set.
7. Moving a step renumbers all steps at once.
8. A heading written above the block is the block's heading; Steps has no heading, label or intro field of its own in place (the spec's
   owner rule). Old Steps that have `heading` or `intro` keep showing them on the site, and they stay editable in the block's sheet only
   when filled.
9. Steps I saved before open unchanged and are saved back in the same form.

**Acceptance (screens, phone 375 px and computer):** the add button text, the dotted outline, no background, the faded empty step hidden once
there is a step, the toolbar icons without Link or Edit, and the saved props are the same as before (`items: [{ title, text }]`).

**Owner decisions (2026-11-12)**

- A step with a heading and no text is valid: the text field stops being required (a change to the field when this is built).
- The numbers are not editable: steps always start at 1.
- Paste-to-create: open, the owner asked what it means (see the next line).

**Paste-to-create, in one example:** the owner copies a list from a document (`Order\nPay\nGet it`) and pastes it into an empty Steps
block. Each line becomes a step with that line as its heading, instead of one long heading with line breaks in it. It would work the
same in Checklist and Questions and answers. It is a nice-to-have, not needed for the first version of Steps.
