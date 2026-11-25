# One highlighted card in Cards

Owner, 25 Nov 2026: "Add a highlighted option to cards. Do the designs yourself." Earlier the same day the owner agreed that a card's
style (outlined, filled, elevated) stays one choice for the whole group, so a user who wants one card to stand out switches it to
Highlighted instead of giving it its own style. This replaces the proposal of a per-card colour field (CTO session, 25 Nov): no
per-card `color` or `design` is added.

## What Material 3 prints (read with Playwright on 25 Nov 2026)

- Cards, Guidelines, *Cards in a collection*: "By default, cards in a collection are coplanar. They share the same resting elevation
  unless they're picked up or dragged." So a highlighted card never gets more shadow than the others.
- Cards, Guidelines, *Variants*: the three variants "provide the same legibility and functionality, so the variant you use depends
  on style alone." So a highlighted card does not change variant to show emphasis.
- Color roles: "Primary roles are for important actions and elements needing the most emphasis"; "Primary container: Standout fill
  color against surface, for key components"; "Tertiary roles are for smaller elements that need special emphasis". So emphasis is
  the container colour.
- M3 prints no thicker or coloured outline for a card, and its Badge is for counts and status on icons (a large badge holds at most
  four characters), not a text label on a card.

Pages read: `https://m3.material.io/components/cards/overview`, `…/specs`, `…/guidelines`, `…/accessibility` and
`https://m3.material.io/styles/color/roles`.

## The design

1. **The setting.** Each card in Cards gets `featured` (boolean), labelled **Highlighted** with `On` / `Off` (da-DK `Fremhævet`,
   `Til` / `Fra`), the same stored name, label and words as Pricecards. It sits in the card's sheet (`settings` in
   `src/standard/cards/index.tsx`), after the fields the card has, and shows for every design. No hint text.
2. **One per group.** At most one card in a group is highlighted. Switching it on for one card switches it off on the others in the
   same block, in the same edit (one undo step). Content that has more than one (hand-edited) draws only the first as highlighted.
   Pricecards gets the same rule.
3. **The look.** The highlighted card keeps its place, size, content and the group's resting elevation, and takes M3's container
   colour as its fill, with the container's on-colour for its text and icons (and its parts inside, such as buttons, take the
   pairing M3 prints on that container, as a filled card in that colour already does):
   - outlined or filled group: drawn as a filled card in **primary container**, no outline (both level 0, so the group stays
     coplanar);
   - elevated group: stays an elevated card (level 1 shadow) with the **primary container** fill;
   - a filled group whose colour is already primary container: the highlighted card is **tertiary container** instead.
4. **Inside a coloured section.** The fill comes from two component tokens, `--mo-comp-card-highlighted-container` and
   `--mo-comp-card-highlighted-on-container`, declared with the cards tokens (`theme/styles/tokens/`), default primary container and
   on-primary-container. Where the section remaps the roles, the tokens are declared again (the selector heads in
   `theme/styles/tokens/material/sys.css`), so the highlighted card never takes the section's own fill:
   - a section on Primary (whose surface is primary container): tertiary container and on-tertiary-container;
   - a section with an image (every container is inverse surface there): `--mo-sys-color-primary` and `--mo-sys-color-on-primary`,
     which that section already maps to inverse primary and inverse surface.
   The developer checks each case with `check:screens` (text, icons and the card against its background on every section colour,
   light and dark), and names a case M3's pairing cannot meet in the PR instead of inventing a colour.
5. **Pricecards takes the same look.** Its highlighted plan loses the 2 px inset accent outline (`.mo-is-featured` in
   `theme/styles/cards.css`), which M3 does not print, and uses rules 3 and 4. Its label ("Most popular") stays as it is: it is card
   content, as `docs/material-deviations.md` already records for a price or a badge on a card. Cards gets no label.
6. **One class.** Both blocks mark the card with the same class (today `mo-is-featured`; under contract 8 the name the names spec
   gives a state class), styled once in `theme/styles/cards.css`. A theme built on Material inherits it; a theme may restyle it through
   the two tokens only. Adding the class breaks no theme, so `THEME_API` and `APP_API` do not move.
7. **Editor.** The inline view draws the highlighted card exactly as the site (same `View.tsx`); nothing else changes in the editor's
   bar or menus. `viewOf.ts` and `load.ts` pass `featured` through; `view.ts` applies rule 2.
8. **Accessibility.** Text and icons use M3's container pairs, so contrast holds as for any filled card. The highlight is emphasis, not
   information, so nothing is announced to screen readers; a site owner who wants to say why a card stands out writes it in the card.
9. **No migration.** A card without `featured` is not highlighted; old content draws as before.

## Delivered with it

- The demo's `/blocks/cards/` page gets one group per design with its second card highlighted, and one inside a Primary section;
  `/blocks/pricecards/` shows the new look.
- Before and after screenshots of both demo pages and the card's sheet, phone and computer (skill `developer`, 3b).
- A release note (skill `release-notes`): "Highlight one card in Cards" in both languages; Pricecards' new look is in the same note.
- The changeset the base branch allows (skill `changesets`).
