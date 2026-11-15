# The edit page of a list as an editor window (design)

Status: spec and build plan for 0.19, no code in this pull request. Written 15 November 2026 in a brainstorm session from the owner's four
decisions of the same day (section 1). Branch `0.19`. Three questions are **open for the owner** (section 11), each with a recommendation.

Read for this spec:

- the code on `0.19` (`b780512`): `src/OwnListEdit.tsx`, `src/OwnList.tsx`, `src/useOwnList.tsx`, `src/Library.tsx` (`List`), `src/CreateFab.tsx`,
  `src/ListFab.tsx`, `lib/ownList.mjs`, `lib/ownListEdit.mjs`, `src/ownLists.ts`;
- the page editor: `src/MarkdownEditor.tsx` (3,118 lines), `src/blockBar.ts`, `src/blockRow.ts`, `src/blockDrag.mjs`, `src/blocks.ts`,
  `src/inlineViews.tsx`, `src/textBar.mjs` (`planBar`), `src/bodySize.mjs`, `src/eyebrow.mjs`, `lib/body-size.mjs`, `lib/eyebrow.mjs`;
- `docs/superpowers/specs/2026-11-14-dynamic-lists-framework-design.md` (corrected in this pull request, section 10) and
  `docs/superpowers/plans/2026-11-14-dynamic-list-edit-page.md`; `2026-11-14-settings-sheets-design.md` (the settings pattern);
- m3.material.io *FAB menu* (Overview, Guidelines, Accessibility), *Floating action button* (Guidelines) and *Typography* (Applying type),
  read with Playwright on 15 Nov 2026 (section 7.2). The *Specs* pages' token tables were not read; this spec quotes no token value.

Words: a **list** is a set of entries with fields. A **field block** is a field of the list drawn as a block in the editor window. A **text
block** is text the owner writes that shows on the list page. The **list page** (`#list/<id>`) shows the entries; the **entry form page** is
where an entry is typed; the **edit page** (`#list/<id>/edit`) is where the list is designed.

## 1. Owner decisions (15 November 2026, through the 0.19 PM)

1. A dynamic list (an own list such as Services or Testimonials) has two screens. The **list page** shows its entries as rows with move
   arrows and a round FAB. The FAB becomes a **FAB menu** with `Edit list` and `Add <entry>` (for example `Add testimonial`). Entries are
   added on the entry form page (name, image, alt text, text fields, tags and so on), **never on the edit page**. The edit page is only for
   the list's structure.
2. The **edit list page** (`src/OwnListEdit.tsx`, `#list/<id>/edit`) uses the same design pattern as the page editor on pages, where each
   form field acts like a block: an **editor window** with a toolbar to add a field (Icon, Title, Body text, Image, Link, Tags and the other
   kinds), **block cards** with move up and down, settings and delete (a field can be deleted with its data, as `Remove field` does today).
   It is **not stored as Markdown**: the list's field data (`lib/ownList.mjs`, `lib/ownListEdit.mjs`, `_list.json` `fields`) stays the
   storage. It must **behave** like the page editor (block cards, bar, settings sheet, drag and move), using the page editor's parts.
3. In the same editor window the owner can add **text blocks** that show on the **list page**, to describe the list to whoever manages
   entries. Only three styles: a **heading** (the h3 style), **Body medium** and **Label** (Material 3 type roles). No other text style.
4. The per-field `Shown` switches are gone (done in #704); the block's slot map decides what is shown where.

**Base check.** On `0.19` at `b780512` #704 is not merged: `OwnListEdit.tsx` still has `Shown`, `dropped` and `Remove data`. This spec assumes #704
has landed. If it has not when PR 2 starts, PR 2 starts from a rebase on it; `dropped` is never carried into the new window.

## 2. What exists today

| Part | Where | Fact |
| :--- | :--- | :--- |
| The edit page | `src/OwnListEdit.tsx` (261 lines) | A form: a name box, `FieldBar` (a `Toolbar` with `planBar` and a `⋮` menu), then one `own-list-field` row per field (name box, move arrows, `Shown`, `Remove field`), `Add item`, `Delete list`. Changes are a **waiting version** kept in `useOwnList` and committed once by the page's `Save` (`SaveBar`). |
| Its rules | `lib/ownListEdit.mjs` | `addField`, `moveField` (swap with the neighbour), `renameField`, `confirmDrop` (field and its data out of every entry), `heldBy`, `definitionText`, `listUses`, `editPageOf`. Pure, tested. |
| The definition | `lib/ownList.mjs` | `_list.json` version 2: `{ version, label, fields: [{ id, kind, label? }], dropped }`. `parseDefinition` builds the result from known keys only. Kinds: icon, title, text, image, href, tags (+ `date`, not in the bar yet). |
| The list page | `Library.tsx` `List`, `OwnList.tsx` | Rows with move arrows; `own.fab` is `EditFab` (a pencil, one action). A list with no fields shows `noFields` and a filled button. |
| FAB | `ui.tsx` `FabMenu`; `CreateFab`, `EditFab`, `ListFab` | `FabMenu` takes a list of actions; with one it is a plain FAB. `ListFab` already opens a menu for a list with several entry kinds. |
| The page editor's block | `MarkdownEditor.tsx` `blockCard` (l. 1486 on) | A ProseMirror node view: the card (`.site-block-card`), the block typed in place (`inline`), its state told to `blockBar`, its action row (`blockRow`), its drag handle (`blockHandle`). |
| The page editor's bar | `MarkdownEditor.tsx` l. 2640 to 3050 | One `Toolbar` that shows the text tools, or the active block's tools (`useSyncExternalStore(blockBar…)`), laid out by `planBar`, with a `⋮` menu. |
| Text styles | `src/eyebrow.mjs`, `src/bodySize.mjs`, `lib/*.mjs` | **Label** is `<p class="label-medium">` (the node `eyebrow`); **Body medium** is `<p class="body-medium">` (`bodyMedium`). Both are already M3 roles drawn by the theme. |

Three facts shape the design:

- **The page editor's block machinery is half ProseMirror and half not.** `blockBar.ts`, `blockRow.ts`, `blockDrag.mjs`, `planBar` and the Sheet
  have **no** ProseMirror dependency; `blockHandle`, `blockCard`, the bar's rendering and the block settings host live inside `MarkdownEditor.tsx`
  and take a `view: EditorView`. Section 5 extracts exactly those.
- **`parseDefinition` and `definitionText` write only known keys.** A new key in `_list.json` is lost on the next save by any code that does not
  know it. Text blocks need both functions changed in the same PR as their first use (section 6).
- **The page has no text of its own today.** The list page draws rows and a FAB; nothing above the rows can be written by the owner.

## 3. The screens

### 3.1 List page (`#list/<id>`)

Rows are as today (`List` in `Library.tsx`, move arrows, search). Changes: the **text blocks** above the rows, and the FAB.

```
375 px (compact)                          1280 px (expanded; main menu is the navigation rail)
┌─────────────────────────────┐           ┌──┬────────────────────────────────────────────┐
│ ←  Services           🔍  ⋮ │           │▤ │ ←  Services                       🔍    ⋮ │
├─────────────────────────────┤           │▤ ├────────────────────────────────────────────┤
│ Keep each service to two    │ Heading   │▤ │   Keep each service to two lines           │ Heading (h3 style)
│ lines                       │ (h3 style)│  │   Add the price in the last field. Only   │ Body medium
│ Add the price in the last   │ Body med. │  │   services with the tag "home" show on    │
│ field. Only services with   │           │  │   the front page.                         │
│ the tag "home" show on the  │           │  │   PUBLISHING                              │ Label
│ front page.                 │           │  │                                            │
│ PUBLISHING                  │ Label     │  │   ⇅ Haircut               120 kr   ↑ ↓    │
│                             │           │  │   ⇅ Colour                450 kr   ↑ ↓    │
│ Haircut              ↑ ↓    │           │  │   ⇅ Treatment             300 kr   ↑ ↓    │
│ Colour               ↑ ↓    │           │  │                                    ┌───┐   │
│ Treatment            ↑ ↓    │           │  │                                    │ ✎ │   │ FAB (closed)
│                       ┌───┐ │           │  │                                    └───┘   │
│                       │ ✎ │ │ FAB       │  │   FAB open (menu):  ┌ Add service ┐        │
│                       └───┘ │           │  │                     └ Edit list   ┘ [ × ]  │
└─────────────────────────────┘           └──┴────────────────────────────────────────────┘
```

- Text blocks stand **above the rows**, in the window's order, in the page's reading column. No text block means the page is as today.
- **The FAB** keeps its place and size (the editor's FAB). Its icon is the pencil of `EditFab` while it is closed, and it becomes the close
  button when open (M3, section 7.2). The menu has two items: `Add <entry>` and `Edit list`. `Add <entry>` opens `#new/<id>`, the entry form page;
  `Edit list` opens `#list/<id>/edit`.
- **A list with no field** has nothing to add: the FAB is the single action `Edit list` (M3: "Don't use a FAB menu with one item"), and the page
  says `noFields` under the text blocks, as today.
- `<entry>` is the list's entry name. Testimonials and apps give it in `create` (`Add testimonial`). A list the owner made has no singular
  yet: it reads `Add item` (today's `t.ownList.create`) until the owner names it (question Q3, section 11).
- Entries are added only on the entry form page. The edit page has no `Add item` button and no row area; `#new/<id>` is the one way to add.

### 3.2 Edit page (`#list/<id>/edit`) as an editor window

The page is the page editor's workspace for a list: a top app bar (`Screen`, back arrow to the list, the `SaveBar` when something waits), the
list's **name** (a `TextField`), the **bar** (sticky), and the window with the **cards**. The bar and the cards are the page editor's, so the
look is the editor's, not a new component (`CLAUDE.md`: the editor's own workspace follows the editor, not Material 3's components).

```
375 px                                         1280 px
┌─────────────────────────────┐                ┌──┬───────────────────────────────┬────────────────────┐
│ ←  Services       Save   ⋮  │                │▤ │ ←  Services          Save   ⋮ │ Field settings     │ (side sheet,
├─────────────────────────────┤                │▤ ├───────────────────────────────┤ Price              │  when a card's
│ [ Services              ]   │ list name      │  │ [ Services                  ] │ ──────────────     │  gear is tapped)
│ ┌─────────────────────────┐ │                │  │ ┌───────────────────────────┐ │ Name [ Price     ] │
│ │ T  ⌗  ¶  🖼  🔗  🏷   ⋮  │ │ bar            │  │ │ Heading Body Label │ I T ¶ 🖼 🔗 🏷 ⋮ │ │ Kind: Title        │
│ └─────────────────────────┘ │                │  │ └───────────────────────────┘ │ Used by 12 entries │
│                             │                │  │                               │ [ Remove field ]   │
│ ┌ Text on the list page ──┐ │ text block     │  │ ┌ Text on the list page ────┐ │ [ Save ] [ Cancel ]│
│ │ Keep each service to…   │ │ (zone 1)       │  │ │ Keep each service to…     │ │                    │
│ └─────────────────────────┘ │                │  │ └───────────────────────────┘ │                    │
│   ↑  ↓  ⚙                ⠿  │ action row     │  │         ↑  ↓  ⚙           ⠿   │
│                             │ (active card)  │  │                               │                    │
│ ┌ Title ──────────────────┐ │ field block    │  │ ┌ Title ────────────────────┐ │                    │
│ │ Name      [ sample    ] │ │ (zone 2)       │  │ │ Name        [ sample    ]  │ │                    │
│ └─────────────────────────┘ │                │  │ └───────────────────────────┘ │                    │
│ ┌ Title ──────────────────┐ │                │  │ ┌ Title ────────────────────┐ │                    │
│ │ Price     [ sample    ]  │ │                │  │ │ Price       [ sample    ]  │ │                    │
│ └─────────────────────────┘ │                │  │ └───────────────────────────┘ │                    │
│ ⋯                           │                │  │ ┌ Tags ─────────────────────┐ │                    │
│                             │                │  │ │ Tags                       │ │                    │
│ [ Delete list ]             │                │  │ └───────────────────────────┘ │                    │
└─────────────────────────────┘                │  │ [ Delete list ]               │                    │
                                               └──┴───────────────────────────────┴────────────────────┘
```

**Two zones in one window** (recommendation of Q1; the window keeps the page editor's single column of cards):

1. **Text blocks** (what the list page says) first, in their order. A card here is a `Text on the list page` card with its text typed in place.
2. **Field blocks** (what an entry has) below. A card here is the field as the entry form shows it: the kind's icon, the field's name, and a
   disabled sample of the input (a text field outline, an image placeholder, a tag chip) so the owner sees what the entry form will be.

A card never leaves its zone: the drag handle and Move up and Move down stop at the zone's edge, as the page editor's locked blocks stop a
drag (`limitSteps` in `blockDrag.mjs`, section 5). An empty zone shows its hint (`No text on the list page`, `This list has no fields`).

**The bar** (the page editor's one bar, `planBar`, sticky at the top of the window):

- With no card active: the **insert group**: one button per field kind (`Icon`, `Title`, `Body text`, `Image`, `Link`, `Tags`, then `Date` when
  phase 6 of the framework spec lands), then `Text` (a button with a menu: `Heading`, `Body medium`, `Label`). `planBar` puts what does not fit
  in the `⋮` menu (four tools at 375 px). Pressing a field button adds that field at the **end of the fields** and makes its card active with the
  name box focused; `Text` adds a block at the **end of the texts** with the cursor in it.
- With a **field card** active: the same tools as a page block, from `blockBar`: Move up, Move down, the gear (Settings), then `⋮` with `Remove field`.
  The insert group is still reachable from the bar's `⋮` (as the page editor's `Insert block`).
- With a **text card** active: the three **style** buttons (`Heading`, `Body medium`, `Label`; the active one pressed), Move up, Move down, `⋮` with
  `Remove text`. A text block has no settings sheet: its style is on the bar and its text is typed in the card.

**The card's action row** (`blockRow.ts`): Move up, Move down, Settings (field cards only) and the drag handle at the end, exactly as a page
block's. `Hide` and `Show` do not exist here (`RowItem` kind `visibility` is not used): there is nothing to hide, because `Shown` is gone.

**The field's settings sheet** is the page editor's block settings sheet (same host, same side sheet from 600 px and subpage below, per
`2026-11-14-settings-sheets-design.md`). Its content is short: the field's **name** (`FieldName` today), the **kind** (read only), `Used by
<n> entries` and `Remove field`. `Remove field` asks first (`ask`, as today: `removeDataAsk` with `heldBy(entries, id)`), then takes the field
and its data out of every entry at the page's `Save` (`confirmDrop`, today's rule; the removal waits for the final `Save`, as the autosave spec
decided). The name is also typed in place in the card (the card is the block, as a typed-in-place List's rows are), so the sheet is the way to
reach the rest, not the only way to rename.

**Delete list** stays as the last control under the window, as today (`Delete list` is refused while a block reads the list, `listUses`).

### 3.3 Locked lists

`LockedListEdit` (Testimonials, an app's locked list) is unchanged: its fields are shown as read-only rows, no bar, no text blocks. See Q2.

## 4. Which page-editor parts are reused

| Part | Source | Used here | Needs extraction first? |
| :--- | :--- | :--- | :--- |
| Bar state store | `src/blockBar.ts` | Yes: field and text cards tell the store their tools. | No: no ProseMirror, already a module. |
| Action row | `src/blockRow.ts` | Yes: Move up, Move down, Settings, handle. | No. |
| Drag rules | `src/blockDrag.mjs` (`dragSteps`, `limitSteps`) | Yes: moving by the handle, with a zone's edge as the lock. | No. |
| Bar layout | `src/textBar.mjs` `planBar`, `toolWidth` | Yes. | No. |
| Toolbar parts | `ui.tsx` `Toolbar`, `ToolbarButton`, `Menu`, `MenuItem` | Yes (as `FieldBar` does now). | No. |
| Drag handle (DOM, pointer, long press, edge scroll) | `MarkdownEditor.tsx` `blockHandle` (l. 740 to 880) | Yes. | **Yes**: it takes `view: EditorView` and reads `parts()` from the document. |
| The bar's rendering (context group, `⋮`, count, ghost measuring) | `MarkdownEditor.tsx` l. 2640 to 3050 | Yes. | **Yes**: it is inline in the editor's component. |
| Block settings host (sheet or side sheet, `Save`/`Cancel`, unsaved dialog) | `Sheet.tsx`, `liveSheet.mjs`, `BlockDialog.tsx` (`BlockAsk`) | Yes. | **Partly**: the host is reachable through `BlockAsk`; the field form for a list field is new. |
| Card look | `editor.css` `.site-block-card`, `.site-block-handle`, `.site-block-has-row`, drop marks | Yes, by class. | No (CSS only). |
| Typed-in-place text | `InlineItems.tsx`, `inlineViews.tsx` | **No**: those draw a block's rows as the theme draws them. A text block is plain text in a card; a field card is a name box and a sample. | n/a |
| Block selection (several blocks at once) | `blockSelection.ts` | **Not in 0.19.** | n/a |
| The text itself (ProseMirror, Milkdown, Markdown) | `MarkdownEditor.tsx`, `markdown.mjs` | **No.** | n/a |

**Not using ProseMirror is deliberate.** The owner said the field data is the storage and not Markdown. A second Milkdown instance would have to
turn `fields` into a document and back after every keystroke, and it would pull the page editor's undo, paste, link and image logic into a
screen that has none of it. The window is a React list of cards; what makes it **behave** like the page editor is that the bar, the row, the
handle, the drag rules, the sheet and the card look are the page editor's own modules, not copies.

## 5. Extraction order (the smallest safe order)

Each step moves code without changing what the page editor does, and ends with the page editor's checks unchanged (`npm run check`,
`check:screens` before and after, same screenshots). No step changes the edit page.

1. **`blockDragHandle`** (`src/blockDragHandle.ts`): move the body of `blockHandle` out, with its inputs made plain: `parts(): { el, locked }[]`,
   `self(): number | null`, `onMove(steps)`, `select?`. `MarkdownEditor.tsx` calls it with the view-based `parts` and the existing `move(view, …)`.
   It uses only `blockDrag.mjs`, `blockSelection` and `blockHandleIcon`. Test: `blockDrag.test.mjs` stays; a new test drives the handle's
   `plan()` on a fake DOM. Risk: low (one function, one caller; the owner's drag screens exist).
2. **`EditorBar`** (`src/EditorBar.tsx`): move the bar's rendering (the context group, the `⋮` menu, the ghost measuring, the `planBar` call) out
   of the editor's component into a component that takes `{ name, tools, fixed, state }` and renders the `Toolbar`. The editor passes today's
   values. Test: `textBar.test.mjs` and `check:screens`' bar checks at 375 and 1280 px. Risk: medium (about 400 lines, the largest step), so it is
   one pull request on its own and done before the window is built.
3. **`BlockHost`** (`src/BlockHost.tsx`): move the block's settings host (the part of `BlockAsk` that opens the sheet, keeps the unsaved
   dialog and returns on `Save`/`Cancel`) out of `BlockDialog.tsx` so a caller without a ProseMirror document can ask for a sheet. If a read of
   `BlockDialog.tsx` in PR 3 shows `BlockAsk.edit` already runs without a view, this step is skipped and recorded in the PR.
4. Only then the window (section 8, PR 4) is built on `EditorBar`, `blockDragHandle`, `BlockHost`, `blockBar`, `blockRow` and `planBar`.

`MarkdownEditor.tsx` shrinks by about 700 lines and gains no behaviour. The extractions are the only changes to a file with a single owner for
the page editor, so each PR names the screens it reran.

## 6. Storage: the text blocks and their order

**Proposal.** `_list.json` version 2 gets one new optional key, **`notes`**: the list page's text blocks, in their order.

```json
{
  "version": 2,
  "label": "Services",
  "fields": [
    { "id": "title", "kind": "title", "label": "Name" },
    { "id": "title-2", "kind": "title", "label": "Price" },
    { "id": "tags", "kind": "tags" }
  ],
  "notes": [
    { "id": "note-1", "style": "heading", "text": "Keep each service to two lines" },
    { "id": "note-2", "style": "body", "text": "Add the price in the last field." },
    { "id": "note-3", "style": "label", "text": "Publishing" }
  ]
}
```

| Key | Rule |
| :--- | :--- |
| `notes` | Optional array. Missing or empty: no text on the list page, exactly as before. |
| `id` | `^[a-z][a-z0-9-]{0,39}$`, unique among the notes (`note-1`, `note-2` … never reused, as `newFieldId` never reuses a field id). |
| `style` | `heading`, `body` or `label`. Any other value makes the file's `parseDefinition` problem `The text "<id>" has an unknown style`. |
| `text` | Plain text, trimmed, at most 500 characters. A new line is a line break in `body`, a space in `heading` and `label`. No Markdown, no HTML, no links. |

**Why a separate key and not entries of `fields`.** `fields` is read by the entry form, `asRowsOf`, `fieldKinds`, `entryProblems`, `heldBy`,
`dropField` and the `Rows from` picker; a "note" kind in it would leak into every one of them. A separate key leaves all of them untouched.

**Why two zones and not one order.** Text blocks show on the list page and fields on the entry form; an order that mixes them would mean
nothing on either screen. Two arrays give each its own order with no cross-reference and no rule about what happens to a note when a field is
removed. If the owner prefers one flow (Q1), `notes[].after` (the id of the field it stands after, or `null` for the top) is added and the
window derives the display order from it; this is the only storage change that option needs.

**Compatibility with lists saved before.**

- A `_list.json` without `notes` is a list with none. No migration, no file is rewritten, and `DEFINITION_VERSION` stays `2`: the new key is an
  addition, as `date` is.
- `parseDefinition` reads `notes` and returns it in the definition; a list without it returns `notes: []`. `definitionText` writes `notes`
  **only when it is not empty**, as it writes `dropped` only while something waits, so a list without text blocks has a byte-identical file.
  This is the one change to both functions and is unit tested (round trip with and without notes; an unknown key still ignored).
- **An older CMS reading a newer file** ignores `notes` and, if it saves the list, drops them (`parseDefinition` builds only known keys). Sites
  only move forward with the CMS version (the same position as `date`); nothing guards a downgrade.
- `check:content` (`ownListProblems`) reports a bad `notes` entry as a problem of the file, like any other definition problem.
- The ids of `notes` are not field ids and never appear in an entry's data, so `entryProblems` and the entry form do not see them.
- `listUses`, `Delete list` and `Rows from` are unaffected.
- The waiting version (`useOwnList.change`) already stores the whole definition text, so notes wait and commit with the fields in the same `Save`.

New pure functions in `lib/ownListEdit.mjs` (each with tests): `addNote(definition, style)`, `setNote(definition, id, patch)`, `moveNote(definition,
id, by)`, `removeNote(definition, id)`. They mirror `addField`, `renameField`, `moveField` and keep ids and order the same way.

## 7. How the text blocks render

### 7.1 On the list page, and in the demo

- **Styles.** `heading` is drawn with the **h3 style** and the **semantic level 2**: the page's title is the one `h1`, so the next level is `h2`;
  the owner asked for the h3 *look*, which a class gives (`.prose :where(h3)` in `theme/styles/base.css` draws the style; the list page uses
  the same CSS variables, not a new size). `body` is `.body-medium`, `label` is `.label-medium` (`lib/body-size.mjs`, `lib/eyebrow.mjs`): the
  classes the page editor already writes for those styles, so a text block looks as the same words look in a page's text.
- **Colour** is the theme's context tokens: `--mo-on-surface` for heading and body, `--mo-on-surface-variant` for the label, the same as the
  editor's text (`CLAUDE.md`: colours in editor-drawn parts come only from the theme's roles). `check:editor-colors` stays green.
- **Order and spacing.** Blocks stack in `notes` order with the editor's paragraph spacing, then the rows; a `label` above a `heading` pairs as
  it does in a page's text (`.label-medium + h3` rule in `blocks.css`).
- **Empty.** No `notes`: nothing is drawn, the page is as today. A block whose text is empty after trimming is not drawn (and not saved).
- **Search.** The list's search box searches the rows only, not the text blocks.
- **The demo.** A made-up own list (for example `Services`) is added to the demo in PR 5 (`demo/src/data/services/` with a `_list.json`, a few entries and
  three text blocks, one of each style) so `check:screens` and the app's screenshots
  show the list page with text. Text blocks are editor data: they appear nowhere on the **site** (no change to the site's HTML, no same-HTML check
  needed).
- **Editor-only:** the page where the text shows is the editor's list page, which is the editor's own workspace.

### 7.2 What Material 3 says (read 15 Nov 2026 with Playwright)

The FAB menu and the type roles are used outside the editor's own window (the list page), so they follow m3.material.io.

**FAB menu** (Guidelines, Overview, Accessibility), quoted:

- "A FAB menu opens from a FAB to show multiple related actions. It should always appear in the same place as the FAB that opened it."
- "FAB menus can contain 2–6 items. These should be closely related under a single action." The image caption on the same page: "Don't use a FAB
  menu with one item." The list page's menu has two items, and with no field the FAB is one action, not a menu (section 3.1).
- "The FAB should transform into the close button of the FAB menu." "FAB menu items should always have label text. The icons shouldn't be
  removed." Each item (`Add service`, `Edit list`) has its icon and label.
- "On web, the FAB menu uses a menu component for an experience that's consistent with other desktop apps." This is what `FabMenu` does.
- "FAB menu elements meet the minimum target size of 48dp." "Initial focus remains on the close button, which takes the place of the original
  FAB." "Space or Enter: Activate the focused button or item." On web: "The FAB's accessibility label should describe the menu that the FAB will
  open." The closed FAB's label names the list and says it opens actions (for example `Services: actions`); the open close button says `Close menu`.
- **M3 does not print** the order of the items, so this spec chooses: `Add <entry>` first (the frequent, constructive action, as the FAB's own
  guidance says: "a FAB promotes an important, constructive action such as: Create") and `Edit list` second.

**FAB** (Guidelines): "A FAB can transform into an extended FAB on larger screens, or it can transition into a FAB menu when selected. Use a
FAB menu when there are many kinds of actions relevant to the FAB." "Don't display multiple FABs on a single screen." One FAB per screen holds.

**A deviation to record.** FAB menu Guidelines: "When a FAB is paired with other components, like the floating toolbar or navigation rail, don't
use the FAB menu." From `medium` the editor's main menu is a **collapsed navigation rail** (`MainMenu.tsx`, `MainRailItem`), so the list page's
FAB menu at 1280 px sits beside a rail. The owner decided the FAB menu in words (decision 1), and `ListFab` already opens a menu next to the
rail for a list with several entry kinds. PR 1 adds the entry to `docs/material-deviations.md`: what Material says (the sentence above), what we
do instead (the FAB menu stays beside the rail), why (the owner's decision of 15 Nov and the existing `ListFab`), the date and the pull request.

**Typography** (Applying type), quoted: "The Material 3 type scale organizes styles into five roles that are named to describe their purposes:
display, headline, title, label, body." "Headlines are best-suited for short, high-emphasis text on smaller screens." "Body styles are used for
longer passages of text in your app." "Label styles are smaller, utilitarian styles, used for things like the text inside components or for very
small text in the content body, such as captions." So the three styles are three roles at three levels of emphasis: heading, body and label. The
owner fixed the sizes (h3 look, Body medium, Label medium, the editor's `.label-medium`), which are the editor's theme tokens; no token value is
quoted here and none is changed. Nothing here deviates.

### 7.3 Accessibility

- **Headings.** One `h1` (the page title); text headings are `h2` with the h3 look (section 7.1), so the outline has no gap.
- **The window.** The bar is a `Toolbar` with `role="toolbar"` and the page editor's group labels (`Field tools`, as today). Arrow keys move within
  it, as in the page editor. Every button has a label (no icon-only without a name); `planBar`'s `⋮` has `aria-haspopup`.
- **Cards.** A field card is `role="group"` with the label `<name> field, <kind>`; a text card is `role="group"` with `Heading text`, `Body medium
  text` or `Label text`. A text card's input is a labelled multi-line text box (`aria-label` = the card's group name); focus is visible.
- **Moving without a pointer.** Move up and Move down are buttons in the row and the bar; they announce the result in a live region
  (`<name> moved to position 2 of 3`), and are `disabled` with a reason at a zone's edge (M3: a disabled control is shown, not hidden). The drag
  handle is `tabIndex -1`, as the page editor's, because the buttons are the keyboard way (the page editor's rule).
- **Targets.** Row buttons are 44 dp (`SIZE` in `blockRow.ts`), the editor's touch size; M3's FAB menu rule is 48 dp for its own items.
- **Delete.** `Remove field` and `Remove text` use the editor's `ask` dialog; focus returns to the next card or to the bar.
- **Reduced motion.** The row's spring and the FAB menu's transition follow `motionReduced` (`lib/motion`), as the page editor's do.
- **Colour.** `check:screens` runs its contrast checks on the window and the list page with text blocks, in light and dark.
- **The FAB menu:** initial focus on the close button; Tab through the items; Space or Enter activates; Escape closes and returns focus to the FAB.

## 8. Build plan

Pull requests into `0.19`, each small, each with a changeset (`patch` or `minor`, never `major`; `--empty` where the owner sees nothing),
`npm run check` and the checks of the skill `checks`. A visible PR carries screenshots at 375 and 1280 px. The extractions (PRs 2 to 4) are
screen-neutral and compare `check:screens` before and after.

| # | Pull request | Visible | Screenshots | Changeset |
| :--- | :--- | :--- | :--- | :--- |
| 0 | This spec, and the corrections to the framework spec and the edit-page plan (section 10). | no | — | empty |
| 1 | **List page FAB menu.** `Add <entry>` and `Edit list` in a `FabMenu` (a plain `Edit list` FAB for a list with no field); the entry is added at `#new/<id>` only; the deviation entry in `docs/material-deviations.md`; the menu's labels and Danish; unit test of the FAB's actions (`fabScreens.ts`); screen check of the menu open at 375 and 1280. | yes | the closed FAB and the open menu, 375 and 1280 | minor |
| 2 | **Extract `blockDragHandle`** from `MarkdownEditor.tsx` (section 5, step 1). No behaviour change. | no | none (same screens, rerun) | empty |
| 3 | **Extract `EditorBar`** (step 2). No behaviour change. | no | none (same screens, rerun) | empty |
| 4 | **Extract `BlockHost`** if needed (step 3); otherwise this PR is a note in PR 5. | no | none | empty |
| 5 | **Storage of text blocks.** `notes` in `parseDefinition` and `definitionText`, `addNote`, `setNote`, `moveNote`, `removeNote`, `check:content`, tests (round trip, a file without `notes` is byte-identical, bad styles, ids never reused). The list page draws the texts (section 7.1) from `notes` in the demo; no editing UI yet. | yes | the list page with the three styles, 375 and 1280, light and dark | minor |
| 6 | **The editor window, fields.** `OwnListEdit.tsx` is rebuilt on `EditorBar`, `blockDragHandle`, `blockBar`, `blockRow`, `planBar`: the bar with the field kinds, field cards (name typed in place, sample input), the row and the handle, Move up and Move down, `Remove field` (with `ask` and `heldBy`), the field settings sheet, no `Shown` and no `Add item`. `Delete list` and the waiting version stay. The old `FieldBar` goes. | yes | window with cards, a card active with its row, the sheet open, the `⋮` overflow, 375 and 1280 | minor |
| 7 | **The editor window, text blocks.** The `Text` button and menu, text cards (typed in place, plain text), the three style buttons on the bar, the zones and their edges (`limitSteps`), `Remove text`. | yes | a text card active with the style buttons; both zones; 375 and 1280 | minor |
| 8 | **Accessibility and phone pass.** Live region for moves, labels, keyboard path, the unsaved dialog on back, the screens checks (`checkOwnList` extended: add, move by buttons and by handle, remove, save, reload keeps text, 375 and 1280). | yes | none new | patch |
| 9 | **Release notes** for 1 to 8 (skill `release-notes`), English and Danish. | yes | — | empty |

Order: 1 is independent. 2, 3 and 4 are independent of each other but precede 6. 5 precedes 7. 6 precedes 7. PR 5's editing UI waits for 7; the
list page already shows texts that a hand-written `_list.json` holds. 8 follows 7.

## 9. Tests

- **Unit** (`lib/ownListEdit.test.mjs`, `lib/ownList.test.mjs`): `parseDefinition` with and without `notes`, with bad style, id, text length;
  `definitionText` byte-identical for a list without notes and a full round trip with notes; `addNote` ids never reused; `moveNote` at the edges;
  `moveField` untouched; `confirmDrop` leaves `notes` alone.
- **Unit** for `blockDragHandle` (a fake DOM; steps for a pointer position; the lock stops at a zone's edge) and the FAB's actions (two items,
  one item with no field, `Add <entry>` first).
- **Screens:** the list page with text, FAB closed and open; the window with fields only, with texts, a card active, the sheet open, the
  overflow menu at 375 px; a keyboard-only run (Tab to a card, Move down by button, announce, Remove, `ask`, focus); reload keeps the texts.
- `check:editor-colors`, `check:language` (English only outside the language files; `image` not the old word), `check:density`.

## 10. What in the framework spec disagrees (and is fixed here)

Marked in `docs/superpowers/specs/2026-11-14-dynamic-lists-framework-design.md`; the same pull request changes that text:

1. **Section 1, point 6 and section 11, phase 8 `PR B`:** an own list's entries typed in place on its edit page. **Cancelled** by decision 1: entries
   are added on the entry form page, never on the edit page. Phase 8 and its release-note phase move into this spec's plan. The framework
   spec's phases are not renumbered (a gap is marked) so links to *phase 9* and *phase 10* in other specs still point at the right work.
2. **The paragraph "PR B: built in the core (decided, Q10)"** and **Q10 in section 13:** replaced by the decision that there is no PR B; Q10 reads
   `Cancelled by the owner on 15 Nov: entries are not typed on the edit page`.
3. **Section 2, row *The list's pages* and section 3.7:** the edit page is described as `the fields`; it is now **the editor window of this spec**
   (field blocks and text blocks), and the entries page stays the list page with the FAB menu. Text added in 3.7 and the section 5 table row
   for `OwnListEdit.tsx`.
4. **Section 4.1, `Edit list`:** the field bar of #616 is now the editor window; `Shown` is gone (decision 4).
5. **The dependency line "Phase 8 needs only #616, so it can run beside 1 to 4"** and the phase 10 title **`Release notes for 8 and 9`:** edited.
6. **`docs/superpowers/plans/2026-11-14-dynamic-list-edit-page.md`, *PR B* and *Entries*:** carries the same note.

It does not disagree with the rest: the framework's `locked` lists keep `LockedListEdit` (section 3.3 here), `listEdit` stays the slot the
app's window is drawn through (the editor window is the thing in that slot), and `lib/ownList.mjs` stays core.

## 11. Open questions for the owner

**Q1. One flow or two zones?** The window can keep text blocks and fields in **one** column the owner can mix, or in **two zones** (texts first,
fields below). The list page shows only the texts, the entry form only the fields, so a mix has no meaning on either screen.
*Recommendation:* **two zones**, text blocks above field blocks, a card never crossing between them. The texts show above the rows only (none
below). If you want one flow, only `notes[].after` is added to the storage (section 6).

**Q2. Do locked lists get text blocks?** An own list is the owner's, so it gets the window and the text blocks. Testimonials and an app's locked
list have fixed fields and no `_list.json` of their own.
*Recommendation:* **no, not in 0.19.** Their edit page stays `LockedListEdit`. A text for them is a later step (an `app.json` `notes` key, one
more field of the framework's contract 6) when an app asks for it.

**Q3. What is `<entry>` for a list the owner made?** The FAB menu says `Add testimonial`, but an own list has only its name (`Services`), and
no singular. Without one, the menu reads `Add item`.
*Recommendation:* **add an optional `singular` to `_list.json`**, one text box under the list's name in the window (`Entry name`, hint
`Used on the button: Add service`), written in PR 6. Until the owner sets it, `Add item`. It is one optional key like `notes`, and the framework
spec's `singular` for an app's list has the same name.

## 12. Not in this spec

- Block selection of several cards, copy and paste of cards, undo of a block (the page editor has them; the window has the page's own
  `Save` and the waiting version).
- Rich text in a text block (bold, links, colours): the owner allowed three styles only.
- Showing text blocks on the site, in a block, or in an entry form.
- Typing entries on the edit page (cancelled, section 10).
- Changes to Testimonials' or an app's list page other than the FAB menu of PR 1.
