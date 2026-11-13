# Rows from: the owner maps a list's fields to the block's slots (PR 2 of the empty-list work)

Status: design, for the PM's go before any code. Branch `claude/rows-from-field-mapping`. Follows PR #516 (a list starts empty, fields of any kind
and number, definition version 2).

## The owner's rules

- "The user decides what fields goes where." In a block's dynamic settings (`Rows from`) the user picks, for each slot the block draws, which field
  of the chosen list feeds it, or none.
- Fields belong to the list. The mapping belongs to the **place** (one block on one page), saved in that block's props, never in the list. The same
  list can be used in many blocks on many pages, each with its own mapping; a field unused in one place can be used in another.
- The default (the first field of the matching kind) only fills a slot nobody has mapped; it is never a limit. Nothing is dropped or hidden by the
  system. A row whose mapped field is missing shows nothing in that slot.
- Nothing in the list depends on one block type or place of use.

## What is already there (checked in the code, 13 Nov)

The mapping exists for four slots. `map` is a block prop `{ title?, text?, icon?, href? }` naming fields of the list (`src/standard/rows/rows.mjs`
`mapOf`, `withPart`, `fieldOfPart`, `mapped`, `rowsFromItems`); it is saved in the block's props, applied on the site (`load.ts`) and in the editor
(`view.ts`), and set from the dynamic block's text buttons and the field picker (`pickPart`, `rowParts`). A part missing from `map` keeps the list's
`asRows` field (the default). After PR #516 an own list's `asRows` names the first visible field of each kind, so the default already works and a
list's repeated fields are all offered as choices. So the mapping itself needs no new mechanism; what is missing is below.

## What PR 2 changes

1. **Choices by kind.** `fieldsForPart` guesses from the field type (`string` fits the title, icon and link). With several fields of one kind the
   icon picker would offer every text field. An own list's fields carry their kind (`OwnedList.fieldKinds`, `{ <field id>: kind }`, set by
   `ownListOf`); with it, a part offers only its kinds: title and text slots the `title` and `text` kinds, icon the `icon` kind, link the `href` kind.
   Lists with no kinds (apps' and the standard lists) keep today's rule, so nothing changes for them.
2. **Tags is a slot.** The tag filter reads the list's first `tags` field (`asRows.tags`). A list can have several, so `tags` joins the slots the
   owner maps (`PARTS` gets `'tags'`; `map.tags`; `Only with these tags` filters on the mapped field). It is offered only when the list has a
   `tags` field. No block draws tags, so it is the filter's field. The tag choice list shows the mapped field's name.
3. **Image is ready, not offered.** No block draws an image today, so no `image` slot is offered. `PARTS` stays the one place that lists the slots,
   so a block that draws one (the cards, finding 17) adds `'image'` there and gets the same picker, `map` and default. `itemOfEntry` takes `image`
   from `asRows` the day a block draws it.
4. **A removed or hidden field.** If a `map` names a field the list no longer has or shows, the row shows nothing in that slot (as today) and the
   picker says the field is gone instead of showing its id (`Removed field`), so the owner can pick another. The block is never changed by itself.
5. **Names.** Choices show the names the owner gave the fields (`Body text 2`, or the owner's own), not ids.
6. **One more fix (the PM's): no row is silently lost.** In `lib/ownListSave.mjs` a row of a list that has a title field is saved only when the
   title has text; a row with body text, an image or tags but no title is dropped on save. Any typed value now saves the row (named from its first
   title, else its first body text, else `item`).

## Where each change lands

`lib/ownListSave.mjs` and its test (6). `src/ownLists.ts` (`fieldKinds`), `src/schema.ts` (`OwnedList.fieldKinds?`). `src/standard/rows/rows.mjs`
and `view.ts` (1, 2, 4), `rows.test.mjs`. `src/MarkdownEditor.tsx` (`pickPart`, text of the removed field), `src/i18n/en-US|da-DK` (`blocks.rows.parts.tags`,
`Removed field`). `scripts/check-content.mjs`: a fixture with two body texts mapped differently in two blocks. `scripts/editor-screens.mjs`.

## Tests

- Unit: `fieldsForPart` with kinds (two body texts, two icons, an image that is never offered for a text slot); `withPart`/`fieldOfPart` for `tags`;
  `rowsFromItems` with `map.tags` filtering on the second tags field; `mapOf` ignores unknown parts; a `map` naming a missing field gives rows with
  nothing in that slot; `savePlan` saves a row with no title.
- Same list, two blocks, two maps: the unit test builds two blocks over one list and gets different rows (the mapping is per place).
- Screens (375 px and a computer): a list with two body texts and two icons; a Dynamic list block maps the text slot to `Body text 2`, a second
  block on the page maps it to `Body text`; both show their own field; a row typed with no title is saved.

## Not in this PR

No change to the list's definition, to the three themes' views, or to how an app's list declares `asRows`. `minor` changeset only if the owner
sees the tags slot and the by-kind choices as new (the PM decides; the fix of the lost row alone is `patch`).
