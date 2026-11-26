# Inline parts: how a list row or a card is edited in the page editor

Status: owner's decisions from the brainstorm of 26 Nov 2026. For 0.19.8, the editor revision (owner, 26 Nov 2026), with B5 *Items inline* of
`plans/2026-11-22-0-19-7-ui-fixes.md`. Mocks beside this file: `2026-11-26-inline-parts/list.html` and `2026-11-26-inline-parts/cards.html` (open them
in a browser; light and dark).

## Why

On a phone the live editor (26 Nov 2026) shows placeholders that look like real text, only the focused part has a box, the
row's text jumps sideways when a `+` slot appears, and a blue box shows for a tap as well as for the keyboard. The owner's
answer is one set of rules for every item that is edited where it stands: the rows of a list and every card.

## Where it applies

The page and post editor. It follows Material 3 like the rest of the editor (`CLAUDE.md`, *Material 3 everywhere*, owner,
26 Nov 2026), except for the two deviations the owner chose in words in this brainstorm (*Deviations to record*, below).

- **Rows:** List (`src/standard/list/`) and Expand (`src/standard/expand/`), which share the row's fields
  (`src/standard/rows/listParts.ts`).
- **Cards:** every block drawn as cards ("all cards needs to be revised", owner, 26 Nov 2026): Cards, Price cards and
  Testimonials, and any other inline block whose items the theme draws with its card. The developer lists them from
  `inlineBlocks` and `theme/blocks/*/View.tsx` in the pull request.

## The rules

1. **Closed items are drawn as the site draws them.** A row or card that is not active shows no borders, no buttons and no
   slots. A row without an icon starts at the left, as on the site.
2. **One item is active at a time.** A click or tap on an item makes it active.
3. **The active item's clickable parts have a regular border.** A solid 1px line in the `outline` role (it meets
   WCAG 1.4.11's 3:1; `outline-variant` does not, at about 1.6:1), with small rounded corners. Each part is at least 48px high.
   The parts:
   - a row: the icon slot (48×48, round), the label text, the supporting text and the link button (48×48, round);
   - a card: the image (tap to change it), the headline, the subhead, the supporting text and the link button
     (48×48, round, at the bottom right).
4. **The part you are in has a border in the primary colour:** 2px in the `primary` role, in place of the grey one. "Blue" in this spec and the mocks is the theme's primary colour (blue in the mocks); a site with another primary colour shows that, and inside a coloured section the section's remapped role (`CLAUDE.md`, *Colours in editor-drawn block parts*).
5. **The keyboard focus ring shows for the keyboard only** (`:focus-visible`): the theme's solid ring outside the part, with a
   gap, never in the active border's colour. A tap or a click shows no ring, only the primary border.
6. **No tinted background** on the active row or card (owner, 26 Nov 2026).
6a. **The active item has a dotted line around it** (owner, 26 Nov 2026: "The list item needs a dotted line"), in the primary
    colour, like the selected block, with the item menu inside it at the top (rule 14). A card's dotted line takes the place of its
    own outline while it is active.
7. **The selected block keeps its dotted primary-colour outline**, so a selected block reads differently from a part. *(Architect's
   recommendation; the owner has not answered it.)*
8. **The text keeps its formatting** in the parts: the label text and the headline in their own type, the subhead and the
   supporting text in theirs. The parts do not take M3's text-field type.
9. **Empty parts ask for an action**, in the placeholder colour (`on-surface-variant` at full strength, so it meets 4.5:1 and
   never looks like content):
   - a row: *Your label*, *Your supporting text*;
   - a card: *Your headline*, *Your subhead*, *Your supporting text*.
10. **The empty icon slot shows `add`;** a row's link button shows `add_link` without a page and `link` with one.
11. **The fields take Material 3's names** (owner, 26 Nov 2026: "Call them that"). M3 Lists, Specs, *Anatomy*: label text and
    supporting text. M3 Cards, Guidelines, *Anatomy*: headline, subhead and supporting text.

    | Block | Today (`src/i18n/en-US/blocks.ts`) | New |
    | :--- | :--- | :--- |
    | List, Expand | `title: 'Heading'`, `text: 'Text'` | *Label text*, *Supporting text* |
    | Cards | `title: 'Heading'`, `subhead: 'Subheading'`, `text: 'Text'` | *Headline*, *Subhead*, *Supporting text* |

    The hints and example texts that use the old names change with them (List's hint *Rows with icon, heading and text.*).
    The Danish texts follow the skill `site-editor-writing`. Stored field names (`title`, `subhead`, `text`) do not change.
12. **Add buttons** (*Add list row*, *Add card*) are Material 3's outlined button: an `outline-variant` outline, an
    `on-surface-variant` label (M3 Buttons, Specs, read 26 Nov 2026).

13. **One menu per level** (owner, 26 Nov 2026: "yes"). Each action has one home:
    - the editor's toolbar holds the page and its text only (*Add block*, text formatting, undo, redo, its overflow menu), never a
      block's or an item's action;
    - the block menu, on the selected block, holds every action of the block (move, hide, duplicate, delete, *Block settings*);
    - the item menu, on the active row or card, holds every action of the item: move up, move down, *Add item* (a menu with
      *Above* and *Below*, plan B, *bundled actions*) and *Remove*. The link stays the item's own link button (rule 10), so it is
      not in two places.

    An item menu never replaces the block menu (owner, 26 Nov 2026: "No an item menu cannot replace a block menu"): while an item is
    active, the block keeps its menu and the item shows its own as well. Escape, or a tap on the block outside the item, closes the
    item and its menu.
14. **The item menu looks like the block menu, one size smaller** (owner, 26 Nov 2026: "yes"): the same bar and icon buttons, with
    M3's next smaller icon-button size (read on the M3 *Icon buttons* pages in the build), keeping a 48px target.
15. **The Save bar hides while the phone's keyboard is open** (owner, 26 Nov 2026: "yes") and comes back when the keyboard closes.

## Deviations to record

In `docs/material-deviations.md`, in the same pull request. The owner chose both in words on 26 Nov 2026, after an M3 mock with
56dp outlined text fields: "No let's go back to the current one and deviate from MD. Try making the fields on active 48px high.
Center link and icon verically", and then "Keep current formatting."

- A part is a bordered box 48px high, where M3's outlined text field is 56dp with a floating label ("deviate from MD", "make the
  fields on active 48px high").
- The text in a part keeps the site's type instead of the text field's ("Keep current formatting.").

## Open questions

1. **Block outline:** keep it dotted (rule 7), or another mark? Being discussed with the owner.
2. **Ghost text:** the owner's screenshot of 26 Nov 2026 (22.21) shows "G" under the label text while "Gh" is typed. Check whether
   the drawn row shows through the part and lags a keystroke.
3. **The dashed circle** at the selected block's top-left corner: what is it, and does it stay?

## Checks

- `check:screens`: a unit per row block and per card block, closed and active, on a phone and a computer, light and dark, and with
  the keyboard (focus ring) and the pointer (primary border); the toolbar holds no block or item action, an active item shows its
  menu and the block keeps its own, and on a phone the Save bar is hidden while the keyboard is open.
- Contrast: the part's border (3:1), the placeholders (4.5:1), on every section colour (`check:screens` already walks
  `inlineBlocks` on each).
