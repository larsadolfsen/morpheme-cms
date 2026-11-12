# Inline editing for all blocks (design)

Status: proposal for the owner. Design only, no code. Owner request: "We need to add in line editing for all blocks".
Today only the List block is typed in place (`inline: true`, `src/InlineList.tsx`, `src/inlineBar.ts`, `src/inlineRows.mjs`,
node view `blockCard` in `src/MarkdownEditor.tsx`, check `checkInlineList` in `scripts/editor-screens.mjs`).

The owner asked "Didn't we design a new card experience like the list". No such design exists in `docs/superpowers/specs/`
or in the code; Cards is in this spec, first in the order of delivery.

## 1. The shared pattern (from InlineList)

**What the List does now**

- The block's card in the text is the block drawn as the site draws it (the theme's own list markup), with its text fields as
  `textarea`s where the text stands. No picture of the block, no sheet when a new one is inserted (`inline: true`, `fresh`).
- Only the **active** item shows its empty fields and slots (icon slot, link slot). The other items show their live look.
- A dotted outline round the active item, no background colour.
- While the block has no item, one empty, faded item is there; typing in it starts the first item. Once the block has an item the
  empty one is hidden.
- While the block is active and has items, a text button `Add <item>` sits under the last item.
- Keys: Enter in the title goes to the text; Enter in the last field adds an item below; Backspace in an empty first field removes
  the item.
- Icon slot opens the icon picker; link slot opens the item's settings sheet (everything that is not typed).
- One floating toolbar (`inlineBar`): `Add above`, `Add below`, `Move up`, `Move down`, `Link` (while the item has content) and the
  block's own menu (its handle: Hide, Move, Remove). 48 dp targets. Selection drives it, not hover: it shows while the block has
  focus, on desktop over the block, on a phone docked above the keyboard and the save bar; on a phone `Move up`, `Move down` and
  `Link` fold under one `Row` button next to `Edit` (the item's settings sheet).

**Components to extract (one PR, no change of look):**

1. `InlineItems` (generic): items, `active`, `focus`, `onChange`, a per-block `renderItem(item, here)` that returns the block's
   own theme markup with `InlineField` in place of text. `InlineList` becomes a thin user of it.
2. `InlineField`: the auto-height `textarea` (`field-sizing`, fallback in a layout effect), its key rules and focus handling.
3. `InlineSlot`: the icon, image and link slots (button that opens a picker or the settings sheet).
4. `InlineAdd`: the text button `Add <item>` (`t.blocks.<block>.addItem`), shown while active and not empty.
5. `inlineBar` stays as it is; a block can switch actions off (`Link`, `Move`), which is the only change.
6. `BlockDefinition.inline` grows from a flag to `inline: { item: 'items', fields: [...] }` so `blockCard` knows which list to
   type and which fields are typed; everything else of the block stays in its sheet. `check:screens` gets one generic
   `checkInlineBlock(type)` that replaces `checkInlineList` (same asserts: add button text, dotted outline, no background,
   toolbar icons, faded row hidden, 375 px and desktop).

**Owner rules (apply to every block below)**

- No block-level label, heading or eyebrow field in the in-place form: the `headFields` (`eyebrow`, `heading`, `intro`) are not
  shown. A section's heading is written in the text above the block, as in the List.
- Only the active style is shown: a block with a `design` or `layout` choice draws only the chosen look; the choice itself sits in
  the sheet (`Edit`), not as a second drawing.
- Add is a text button (`Add card`, `Add step`), never an icon-only button. Above/Below stay icon buttons in the toolbar.
- Everything that is not text stays in the settings sheet: link target, filters, counts, `only`, toggles, colours.
- The empty item is hidden once the block has an item; the active item has the dotted line.

## 2. Inventory

"Today" = how it is edited now. "Sheet" = what stays in the settings sheet. `edit` = it has an own page (`Block.edit`).

### Repeating blocks (items)

| Block (type) | Today | In-place form | Item toolbar | Add button | Stays in sheet |
| --- | --- | --- | --- | --- | --- |
| Cards (`cards`) | Sheet with fields + `edit` page | Cards drawn in the chosen design; title and text typed in each card; icon or image slot on top by design | Above, Below, Move, Link | `Add card` | design, background, link (`href`), image pick, icon pick via slot |
| Points with icon (`points`) | Sheet | Rows/columns as the site; icon slot, title, text typed; `more` text typed after the text when the link is set | Above, Below, Move, Link | `Add point` | link, `more` text if not typed |
| Segmented list (`segmented`) | Sheet | Segments typed: icon slot, title, text | Above, Below, Move, Link | `Add segment` | `only`, `show`, `maxRows`, button text and link, Rows from |
| Steps (`steps`) | Sheet | Numbered steps; title and text typed | Above, Below, Move | `Add step` | none |
| Checklist (`checklist`) | Sheet, a list of strings | Each line typed in place (single field) | Above, Below, Move | `Add item` | none |
| Questions and answers (`faq`) | Sheet | Question typed in the summary line, answer typed in the open panel (markdown, same editor as the text) | Above, Below, Move | `Add question` | `only` (one open), button text and link, Rows from |
| Price cards (`pricecards`) | Sheet, nested lists | Card typed: name, price, unit, text, features as a checklist inside the card (nested `Add feature`), button label | Above, Below, Move | `Add price card` | featured, badge, button target, max 4 cards |
| Buttons (`buttons`) | Sheet + `edit` page | The buttons as the site draws them; label typed on the button itself | Above, Below, Move, Link | `Add button` | target, kind, icon |
| Links (`links`) | Sheet, groups with page lists | Groups typed: group title, then the pages as rows (page pick in a slot, since the title comes from the page) | Above, Below, Move | `Add group` / `Add page` | group link, fixed pages |
| Expandable list (`accordion`, former) | Sheet + `edit` page | None: stays in its sheet until its content is moved to Segmented list | none | none | all |
| List (`list`) | In place | Done | Above, Below, Move, Link | `Add list row` | link |

For Segmented list, Questions and answers and List, the "Rows from" variant (`from`) is not typed: the rows come from a list
(`RowsFromList`), as the List already does; only the sheet changes it.

### Single blocks

| Block (type) | Today | In-place form | Stays in sheet |
| --- | --- | --- | --- |
| Notice (`notice`) | Sheet | Text typed in the notice, as the site draws it (markdown, inline) | `until` date |
| Video (`video`) | Sheet | The video frame with a URL slot; `title` typed under it | URL problem message, validity |
| Banner (`hero`, former) | Sheet | Not offered; in place only where the text already shows it as a section (lib/remark-banner-section.mjs) | placement, width |
| Testimonials (`testimonials`) | Sheet + `edit` page | Reads a list: not typed. The card shows the testimonials as drawn; `Edit testimonials` opens the list | layout, filter, categories, picked |
| Blog posts (`posts`) | Sheet + `edit` page | Reads posts: not typed. Drawn as the site draws it | design, show, categories, count, order, picked, link |
| Cookie notice (`cookies`) | `edit` page only | Not typed (a list's own page) | none |
| HTML (`html`) | Card with code field | Stay as code: a code area in place is already the best form | none |
| A fixed page's sections (`sectionBlocks`) | Written in the text | Already in place | none |
| An app's blocks (`app`) | Sheet | Opt in per app with the same `inline` definition, after the standard ones | per block |

So in-place typing reaches 10 repeating blocks plus Notice and Video. Testimonials, Posts, Cookies and HTML read from elsewhere
or are code, so their in-place form is the live drawing and `Edit`.

## 3. Order of delivery (small PRs into `main`, each with an empty changeset unless it changes what a site owner sees; each owner-visible one has a release note paragraph as the `release-notes` skill says)

1. **Extract** `InlineItems`, `InlineField`, `InlineSlot`, `InlineAdd` from InlineList; generic `inline: { ... }` definition; List
   on top of it. No change of look. Screens: `checkInlineList` becomes `checkInlineBlock('list')`, must stay green.
2. **Cards**. Own PR for design reasons: three designs (text, icon, image) and a background. Only the chosen design is drawn;
   the image slot uses the existing image picker. Screens: `checkInlineBlock('cards')` for each design at 375 px and desktop.
3. **Points with icon**, **Steps**, **Checklist** (one PR: the same shape as Cards without designs). Screens: one pass each.
4. **Segmented list** and **Questions and answers** (the two with `Rows from`, so the PR also checks that `from` shows
   `RowsFromList` and is not typed). Screens: typed form and `from` form.
5. **Price cards** (nested features) and **Buttons** (label on the button).
6. **Links** (two levels: `Add group`, `Add page`). Screens: both add buttons.
7. **Single blocks**: Notice, Video. Screens: the frame, the `until` stays in the sheet.
8. **Apps' blocks**: `inline` definition documented for apps; no app is moved without its own PR.

Cross-cutting in every PR: `check:screens` covers the add button text, dotted outline, no background colour, hidden empty item,
toolbar icons and the phone `Row` fold; `check:language` for the new `da-DK` texts (`Add card` and so on); existing saved
content opens unchanged (the in-place form reads and writes the same props).

## 4. Open questions for the owner

1. **Existing `eyebrow`, `heading`, `intro` on saved blocks.** The rule says no block-level head in place. Recommendation:
   keep drawing them on the site, hide the fields in place, and keep them editable in the sheet only when they are filled
   (so no content is lost); new blocks have none.
2. **Image and icon slots on Cards.** Recommendation: the same slot as the List's icon slot, opening the existing picker; the image
   card shows an image slot that is empty and faded until a picture is chosen.
3. **Questions and answers: the answer typed open or closed?** Recommendation: the active question is open while it is typed;
   the others show closed, as the site draws them.
4. **Which blocks may keep the sheet only?** Recommendation: Testimonials, Posts, Cookie notice and HTML (they read from elsewhere
   or are code), plus the former Banner and Expandable list.
5. **One release or many?** Recommendation: Cards (step 2) is released on its own with a release paragraph; the other repeating
   blocks (steps 3–6) as one paragraph "Type in place in more blocks", the single blocks as a line.
