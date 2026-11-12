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

0. Correction (checked in the code): Points with icon is a List now (`FORMER.points` in `lib/blocks.mjs`) and Checklist is a check list written
   in the text (`lib/remark-checklist.mjs`, `former: true`), so neither is built. The spec's inventory of them is out of date.
1. Steps (own plan: `2026-11-12-inline-steps.md`).
2. Segmented list (the next block, chosen 2026-11-12) and Questions and answers (check that "Rows from" shows the read-only list and is not typed).
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
- Paste-to-create: yes, except when the pasted text has headings among its lines: then the paste is left as it is and no steps are
  made from it. A line that is a heading is one marked as a heading in the pasted text (for example `#` or an H1 to H6 from a document).

**Paste-to-create, in one example:** the owner copies a list from a document (`Order\nPay\nGet it`) and pastes it into an empty Steps
block. Each line becomes a step with that line as its heading, instead of one long heading with line breaks in it. It would work the
same in Checklist and Questions and answers, with the same exception. It is not needed for the first version of Steps.

## Reconciled with findings 17 and 18 (`2026-11-11-intuitive-editor-design.md`)

The older spec is where the owner decided Cards and the rule for every block. Checked against what #413 built. The newer
`2026-11-12-inline-block-editing-design.md` wins where the two disagree (it is the later decision).

**Matches (built or already decided)**

- Three designs Outlined, Elevated, Filled; the old `Design` and `Background` settings go away (`FORMER.cards`, demo migrated).
- Filled colors: a small fixed set, Surface (default), Primary, Secondary, Tertiary; accent becomes Filled in the primary color.
- A card with a link has no buttons; a card without a link may have buttons (hidden in the sheet while a Link is set).
- Media has icon, image or video; a card without media shows no placeholder and no blank space.
- Checklist is a check list in the text, Points and Links are a List, Expandable list is a Segmented list, Banner is a section: all
  already migrated (`FORMER` in `lib/blocks.mjs`), so none is built in place.
- Steps stays its own block, rows with a title and a text, no settings (own plan).
- Testimonials, Cookies and Blog posts are not typed in place.

**Owner decision (12 November): findings 17 and 18 are the rule.** Every difference below is settled the way the older spec says, and
the Cards built in #413 are changed to follow it, in a coding session (this one is a brainstorm). What changes in the code:

- Media is one choice for the block (the first card's choice sets the type for every card), not per card; `FORMER.cards` and the fields
  follow.
- Filled card colors are the container roles (surface container, primary, secondary and tertiary containers) with readable text.
- The setting is named `Design` (not `Type`); Danish `Udseende` or the word the owner picks.
- A `Subhead` field is added (no Badge, Date or Tags, see the Header line below); adding a button hides the Link; the next button is shown empty and faded with no
  maximum; a new Card block starts with three empty cards, the first active (the 12 November spec still hides the empty item once the block has
  one: that newer rule stays).
- `check:themes` fails a theme that leaves a design unstyled.
- **Header line follows Material 3 (owner, 12 November: "follow MD3", read from m3.material.io/components/cards/guidelines):** a headline and
  an optional subhead (M3's "smaller text elements, such as an article byline or a tagged location"), then the supporting text. M3 has no
  Badge, Date or Tags element, so those are not separate card fields: a date or a tag is written in the subhead. This replaces the
  Subhead, Badge, Date and Tags fields of finding 17 with one `Subhead` field. Where the older spec and M3 disagree, M3 wins.
- Open, still to ask: the carousel for mobile.

**Differences, now settled by that decision**

1. **Media type per card or for the block.** Finding 17: the first card's choice sets the type for every card, so they stay aligned, and
   there is no block setting. Built: each card chooses its own media. Decide which one.
2. **Card fields not built:** Subhead, Badge, Date and Tags (finding 17 lists Media, Title, Subhead, Body text, Link, Buttons, Badge, Date,
   Tags). "Header line" in the owner's list may be the title only or title and subhead.
3. **Filled color roles.** Finding 17 names Material's `surface-container`, `primary-container`, `secondary-container` and
   `tertiary-container` (readable text). Built: the solid primary, secondary and tertiary with their on-colors. Change to the container
   roles, or keep.
4. **Add Button hides Link.** Finding 17: setting a Link hides the buttons and adding a button hides the Link, each with a short hint
   saying why. Built: only the first half.
5. **Buttons.** No fixed maximum; the next button is always shown empty and faded, as rows and cards. Built: a plain list in the sheet.
6. **A new Card block starts with three empty cards**, the first active. Built: one empty card. The 12 November spec says the empty item
   is hidden once the block has an item; that is the newer rule and is built for the List and Cards.
7. **Theme check.** A theme that leaves a design unstyled fails `check:themes`. Not built; only the Material theme styles the three designs
   and the four colors now.
8. **Setting name.** Finding 17 calls the setting `Design`; built as `Type` (Material 3 calls them variants). Decide the word.
9. **Dynamic cards.** A Card block takes its cards from a dynamic list (named `Dynamic card`), and the blog post card becomes a dynamic
   Card, so Blog posts need no special card. Not built. Own plan.
10. **Formatting in typed fields.** Finding 14 and 18 say the floating menu offers the tools a field allows (bold, italic and link in body
    text, none in titles). The typed fields built so far are plain text. Decide per field before Steps and Cards text get formatting.
11. **Table (new block)** is in finding 18 and not in this plan: cells typed in place, the next row and column shown empty and faded,
    `Add row`, `Add column`, `Delete row`, `Delete column` in the menu, a header-row setting on by default, scrolls sideways on a
    narrow screen. Check first whether the editor can create and edit tables (`remark-gfm` renders them). Own plan.

**Order, replacing the list above**

1. #413 (shared parts, Cards model, Cards in place), after the owner settles differences 1, 3 and 8 and the changeset.
2. Steps (own plan).
3. Cards follow-ups: differences 2, 4, 5, 6, 7 and the carousel for mobile, as the owner decides.
4. Segmented list and Questions and answers (`Only one open`, the active row shown open, "Rows from" read-only).
5. Buttons, Price cards, Notice, Video.
6. Dynamic cards, Table.
7. Apps' blocks documented.
