# The edit page of a list as an editor window (design)

Status: spec and build plan for 0.19, no code in this pull request. Written 15 November 2026 in a brainstorm session from the owner's decisions of
the same day (section 1), **redrawn the same day after the owner's correction** that the list's texts are inline text in the flow, not blocks
(decision 5). Branch `0.19`. All three questions (section 11) are decided; decision 8 (layout) is the owner's direction of 15 Nov.

Read for this spec:

- the code on `0.19` (`b780512`): `src/OwnListEdit.tsx`, `src/OwnList.tsx`, `src/useOwnList.tsx`, `src/Library.tsx` (`List`), `src/CreateFab.tsx`,
  `src/ListFab.tsx`, `lib/ownList.mjs`, `lib/ownListEdit.mjs`, `src/ownLists.ts`;
- the page editor: `src/MarkdownEditor.tsx` (3,118 lines), `src/blockBar.ts`, `src/blockRow.ts`, `src/blockDrag.mjs`, `src/blocks.ts`,
  `src/inlineViews.tsx`, `src/textBar.mjs` (`planBar`), `src/bodySize.mjs`, `src/eyebrow.mjs`, `lib/body-size.mjs`, `lib/eyebrow.mjs`;
- `docs/superpowers/specs/2026-11-14-dynamic-lists-framework-design.md` (corrected in this pull request, section 10) and
  `docs/superpowers/plans/2026-11-14-dynamic-list-edit-page.md`; `2026-11-14-settings-sheets-design.md` (the settings pattern);
- m3.material.io *FAB menu* (Overview, Guidelines, Accessibility), *Floating action button* (Guidelines) and *Typography* (Applying type),
  read with Playwright on 15 Nov 2026 (section 7.2). The *Specs* pages' token tables were not read; this spec quotes no token value.

Words: a **list** is a set of entries with fields. A **field block** is a field of the list drawn as a block (a card) in the editor window. The
**list text** is the inline text the owner writes in the window; it shows on the list page. The **list page** (`#list/<id>`) shows the entries;
the **entry form page** is where an entry is typed; the **edit page** (`#list/<id>/edit`) is where the list is designed.

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
3. In the same editor window the owner designing the list can add **text** that shows on the **list page**, to describe the list to whoever
   manages entries. Only three styles: a **heading** (the h3 style), **Body medium** and **Label** (Material 3 type roles). No other text style.
4. The per-field `Shown` switches are gone (done in #704); the block's slot map decides what is shown where.
5. **(Correction, 15 Nov.)** The texts are **not blocks**. In the window the text is **inline text in the flow**, exactly like paragraphs and
   headings in the page editor: typed in place, styled from the text bar. Only the form fields (Icon, Title, Body text, Image, Link, Tags …) are
   blocks (cards with handle, move, settings, delete), placed between the inline text. The window is **a flow of inline text with field blocks in
   it, as a page is**. The texts have no card, no settings sheet and no plain input.

6. **(Decided, 15 Nov.)** Locked lists (those an app provides) stay locked in 0.19: no editor window and no list text for them. `LockedListEdit` is unchanged (section 3.3, Q1).
7. **(Decided, 15 Nov.)** A list the owner made gets an **`Entry name`** box next to the list's name on the edit page, stored as an optional `singular` in `_list.json`. The FAB menu says `Add <entry name>`; empty means `Add item`. The name is never guessed from the list's name (Q2). #712's `singularOf` guess from the list name is replaced by this when the window is built (a follow-up for #712's session).
8. **(Decided, 15 Nov. Layout.)** The edit page mimics the page's edit screen on a phone and has the same features: a **`List settings`** accordion at the top (closed by default, as `Page settings`) holding the list name, the `Entry name` box and `Delete list` and nothing else; below it a **`Content`** accordion (open) holding **one editor card**, the page editor's own card, with its bar (Undo, Redo, `+ Insert`, and the text tools while the cursor is in text) and the flow under it; the `+ Insert` offers the three text styles and the field kinds, as the page editor's Insert does for blocks; field blocks are drawn **as the form fields of the entry form page**; the bottom bar is the page editor's Save bar (label `Save changes`, shown while something waits; there is no Publish for lists). The separate `FieldBar` of the old draft is gone (section 3.2).
9. **(Decided, 15 Nov.)** The list text stands **above the rows, in the order written** (Q3, section 3.1).

**Base check.** On `0.19` at `b780512` #704 is not merged: `OwnListEdit.tsx` still has `Shown`, `dropped` and `Remove data`. This spec assumes #704
has landed. If it has not when the window is built, that PR starts from a rebase on it; `dropped` is never carried into the new window.

## 2. What exists today

| Part | Where | Fact |
| :--- | :--- | :--- |
| The edit page | `src/OwnListEdit.tsx` (261 lines) | A form: a name box, `FieldBar` (a `Toolbar` with `planBar` and a `⋮` menu), one `own-list-field` row per field (name box, move arrows, `Shown`, `Remove field`), `Add item`, `Delete list`. Changes are a **waiting version** in `useOwnList`, committed once by the page's `Save` (`SaveBar`). |
| Its rules | `lib/ownListEdit.mjs` | `addField`, `moveField`, `renameField`, `confirmDrop` (field and its data out of every entry), `heldBy`, `definitionText`, `listUses`, `editPageOf`. Pure, tested. |
| The definition | `lib/ownList.mjs` | `_list.json` version 2: `{ version, label, fields: [{ id, kind, label? }], dropped }`. `parseDefinition` builds the result from known keys only. Kinds: icon, title, text, image, href, tags (+ `date`, not in the bar yet). |
| The list page | `Library.tsx` `List`, `OwnList.tsx` | Rows with move arrows; `own.fab` is `EditFab` (a pencil, one action). A list with no fields shows `noFields` and a filled button. |
| FAB | `ui.tsx` `FabMenu`; `CreateFab`, `EditFab`, `ListFab` | `FabMenu` takes a list of actions; with one it is a plain FAB. `ListFab` already opens a menu for a list with several entry kinds. |
| The page editor | `MarkdownEditor.tsx` | A Milkdown/ProseMirror document. Text: `heading`, the plain paragraph, `bodyMedium`, `bodySmall`, `bodyLarge`, `eyebrow` (Label). Blocks: `siteBlock` and `image` nodes drawn by `blockCard`/`imageCard` node views. |
| The page editor's block chrome | `blockHandle` (l. 740, takes a `view`), `blockBar.ts`, `blockRow.ts`, `blockDrag.mjs`, `move` (l. 328), `cardDeletes`, `gapHere`, `tapBelow` | Drag handle, action row, bar state, the keys and the free lines between blocks. |
| The page editor's bar | `MarkdownEditor.tsx` l. 2640 to 3050 | One `Toolbar`: the text tools while the cursor is in the text (the T menu: style), or the active block's tools, then the main tools (Insert, Undo, Redo), laid out by `planBar` (`context` and `fixed` tools), with a `⋮` menu. |
| Text styles | `src/eyebrow.mjs`, `src/bodySize.mjs`, `lib/*.mjs` | **Label** is `<p class="label-medium">` (node `eyebrow`); **Body medium** is `<p class="body-medium">` (`bodyMedium`), the plain paragraph. Both are M3 roles drawn by the theme. A label has no bold, italic, link or colour. |

Three facts shape the design:

- **The window needs real text editing**, so it is a ProseMirror editor, not a React list. Text is edited in place with the page editor's
  text bar; a field card is an atom node in the same document. This is the page editor's own model (text and blocks in one flow), so the
  behaviour is the same by construction, not by copying.
- **`parseDefinition` and `definitionText` write only known keys.** A new key in `_list.json` is lost on the next save by code that does not
  know it. The list text needs both functions changed in the same PR as its first use (section 6).
- **The list page has no text of its own today.** It draws rows and a FAB; nothing above the rows can be written by the owner.

## 3. The screens

### 3.1 List page (`#list/<id>`)

Rows are as today (`List` in `Library.tsx`, move arrows, search). Changes: the **list text** above the rows, and the FAB.

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

- The list text stands **above the rows**, in the order it is written in the window, in the page's reading column, **drawn as in the editor window** (the same Heading in the h3 style, Body medium and Label, and the same spacing). No list text means the page is as today. **The entry form page (`#new/<id>`) shows no list text at all** (decision 9; the owner, 15 Nov).
- **The FAB** keeps its place and size (the editor's FAB). Its icon is the pencil of `EditFab` while closed, and it becomes the close button when
  open (M3, section 7.2). The menu has two items: `Add <entry>` and `Edit list`. `Add <entry>` opens `#new/<id>`, the entry form page; `Edit list`
  opens `#list/<id>/edit`.
- **A list with no field** has nothing to add: the FAB is the single action `Edit list` (M3: "Don't use a FAB menu with one item"), and the page
  says `noFields` under the list text, as today.
- `<entry>` is the list's entry name. Testimonials and apps give it in `create` (`Add testimonial`). A list the owner made has no singular yet:
  it reads `Add item` (today's `t.ownList.create`) until the owner fills the `Entry name` box on the edit page (decision 7, Q2). Nothing is guessed from the list's name.
- Entries are added only on the entry form page. The edit page has no `Add item` button and no rows.

### 3.2 Edit page (`#list/<id>/edit`) as an editor window

The edit page mimics the page editor's edit screen (the owner's direction, decision 8). It has a top app bar (`Screen`, back arrow to the list), two
accordions, and the page editor's bottom **Save bar** (`SaveBar`, label `Save changes`, shown while something waits, as today; the list's
waiting-version behaviour is unchanged). The accordions are the entry form's sections (`EntryForm.tsx`: `Page settings` and `Content`); their look is
the editor's own (`CLAUDE.md`: the editor's workspace follows the editor, not Material 3's components).

1. **`List settings`** (closed by default). It holds the list's **name** (a `TextField`), the **`Entry name`** box (decision 7: `Used on the button: Add
   service`) and **`Delete list`** (the last control, as today: refused while a block reads the list, `listUses`). It holds **no fields and no text**.
2. **`Content`** (open). It holds **one editor card**, the same card as the page editor's: the bar row at its top (Undo, Redo, `+ Insert`, and the text
   tools while the cursor is in text) and the **flow** under it. The flow is **inline text and field blocks in one order**, as a page is: the owner types
   a heading, then a line of Body medium, then inserts a `Title` field (a block), then more text, then an `Image` field, and so on. A free line between two
   blocks is where the owner types text, as the page editor's free lines between blocks are.

```
375 px (phone)                       the same, List settings open
┌─────────────────────────────┐      ┌─────────────────────────────┐
│ ←  Services                 │      │ ←  Services                 │
├─────────────────────────────┤      ├─────────────────────────────┤
│ ▸ List settings             │      │ ▾ List settings             │
├─────────────────────────────┤      │   List name                 │
│ ▾ Content                   │      │   [ Services              ] │
│ ┌─────────────────────────┐ │      │   Entry name                │
│ │ Aa▾            ↺  ↻  ＋ ⋮│ │ bar  │   [ service               ] │
│ ├─────────────────────────┤ │      │   Used on the button:       │
│ │ Keep each service to    │ │ Head-│   Add service               │
│ │ two lines               │ │ ing  │   [ Delete list ]           │
│ │ Add the price in the    │ │ Body │ ▸ Content                   │
│ │ last field.▏            │ │ med. │                             │
│ │ ┌ ⠿ ──────────  ↑ ↓ ⚙ ┐ │ │ block│                             │
│ │ │ Name                │ │ │ (act-│                             │
│ │ │ ┌─────────────────┐ │ │ │ ive) │                             │
│ │ │ │                 │ │ │ │ form │                             │
│ │ │ └─────────────────┘ │ │ │ field│                             │
│ │ └─────────────────────┘ │ │      │                             │
│ │ PUBLISHING              │ │ Label│                             │
│ │ ┌ Price ──────────────┐ │ │      │                             │
│ │ │ ┌─────────────────┐ │ │ │      │                             │
│ │ │ └─────────────────┘ │ │ │      │                             │
│ │ └─────────────────────┘ │ │      │                             │
│ │ ┌ Image ──────────────┐ │ │      │                             │
│ │ │ ▢  Add an image     │ │ │      │                             │
│ │ └─────────────────────┘ │ │      │                             │
│ │ Ask before you delete.▏ │ │ Body │                             │
│ └─────────────────────────┘ │      │                             │
├─────────────────────────────┤      ├─────────────────────────────┤
│       [ Save changes ]      │ Save │       [ Save changes ]      │
└─────────────────────────────┘ bar  └─────────────────────────────┘

1280 px (expanded; the main menu is the navigation rail; a field's settings in the side sheet)
┌──┬─────────────────────────────────────────────────┬──────────────────────┐
│▤ │ ←  Services                                     │ Field settings       │
│▤ ├─────────────────────────────────────────────────┤ Price                │
│  │ ▸ List settings                                 │ ────────────────     │
│  ├─────────────────────────────────────────────────┤ Name [ Price       ] │
│  │ ▾ Content                                       │ Kind: Title          │
│  │ ┌─────────────────────────────────────────────┐ │ Used by 12 entries   │
│  │ │ Aa▾                              ↺  ↻  ＋  ⋮ │ │ [ Remove field ]     │
│  │ ├─────────────────────────────────────────────┤ │                      │
│  │ │ Keep each service to two lines              │ │ [ Save ] [ Cancel ]  │
│  │ │ Add the price in the last field.▏           │ │                      │
│  │ │ ┌ ⠿ ───────────────────────  ↑ ↓ ⚙ ┐        │ │                      │
│  │ │ │ Name   [ ______________________ ]  │        │ │                      │
│  │ │ └────────────────────────────────────┘        │ │                      │
│  │ │ PUBLISHING                                  │ │                      │
│  │ │ ┌ Price ─────────────────────────────────┐  │ │                      │
│  │ │ │ [ ______________________________ ]     │  │ │                      │
│  │ │ └────────────────────────────────────────┘  │ │                      │
│  │ │ Ask before you delete.                      │ │                      │
│  │ └─────────────────────────────────────────────┘ │                      │
│  ├─────────────────────────────────────────────────┤                      │
│  │               [ Save changes ]                  │                      │
└──┴─────────────────────────────────────────────────┴──────────────────────┘
```

**Inline text.** Typed in place, with a cursor, selection, `Enter`, `Backspace`, undo and redo, as in the page editor. Three styles and no
others: **Heading** (the h3 style), **Body medium** (the plain paragraph) and **Label**. The style is chosen from the text bar's style menu (the
page editor's `Aa▾`, reduced to these three) and by the page editor's own keys. There are no bold, italic, links, colours, lists, alignment or
images. `Enter` makes a new line in the style the page editor gives (after a heading Body medium, after Body medium Body medium, after a Label a
Heading, as the page editor's label sits above its heading). A line that is empty is not saved.

**Text before, between and after the blocks.** The owner may put text before the first block, between any two blocks and after the last, all in the one
flow (the wireframes show a Heading and a Body line before the first block, a Label between `Name` and `Price`, and a Body line after the last). It works as in
the page editor: the flow always ends in a free line, so there is somewhere to type after the last block; `Enter` at the end of a line, or a tap in the free
space below a block (`tapBelow`), puts the cursor in a free line there; the arrow keys move the caret into and out of a block (`nextToCard`); `Backspace` in an
empty line next to a block removes the line, not the block (`cardDeletes`); two blocks side by side keep a free line between them for the cursor
(`gapHere`). Free lines are not text until something is typed in them: an empty line is not saved (section 6).

**Field blocks.** A field block is drawn **as the form field of the entry form page** (`#new/<id>`, `DataForm.tsx`): the field's name as its label, and the
input the person will fill in (a text outline, a body-text area, an icon picker, an image placeholder, a tag chip row), disabled, so the owner sees what the
entry form will be. The field's **name is typed in place** in its label: every field has a name the owner types on its card, and that name is the label of the field on the entry form; an empty name is the kind's name (`Title`, `Title 2` and so on, as `nameOf` numbers kinds). Tapping a block makes it active. The block has the page editor's **action row**
(Move up, Move down, Settings, and the drag handle at the end, `blockRow.ts`). `Hide` and `Show` do not exist (nothing to hide: `Shown` is gone). A block
moves between texts and other blocks by the handle (`dragSteps`) or by Move up and Move down; as in the page editor, it moves **one part at a time** past
text lines and blocks.

**The bar** is the page editor's one bar (`planBar`), at the top of the editor card, in the page editor's order: the tools of the place at the left
(`context`), a divider, then the tools that are always there (`fixed`: Insert, Undo, Redo). There is **no separate field bar**; the field kinds are in
`+ Insert`.

- **Cursor in text:** the style menu (Heading, Body medium, Label; the current one marked), the page editor's text tools reduced to what these styles
  allow (none of bold, italic, link, colour, list, align).
- **A field block active:** the block's tools from `blockBar`: Move up, Move down, the gear (Settings), `⋮` with `Remove field`.
- **Always:** **`+ Insert`**, Undo and Redo. `+ Insert` is the page editor's Insert control, with its items replaced: **Heading**, **Body medium**,
  **Label** (the three text styles), then the field kinds **Icon**, **Title**, **Body text**, **Image**, **Link**, **Tags** (and **Date** when phase 6 of
  the framework spec lands). A text style turns the line at the cursor into that style, or, with a block active, puts a new line in that style after it.
  A field kind puts the field block **at the cursor** (after the current line or block, as the page editor's Insert puts a block) and makes it active with
  its name box focused. `planBar` puts what does not fit in the `⋮` menu (four tools at 375 px).

**The field's settings sheet** is the page editor's block settings sheet (same host, side sheet from 600 px and subpage below, per
`2026-11-14-settings-sheets-design.md`). Its content is short: the field's **name**, the **kind** (read only), `Used by <n> entries` and
`Remove field`. `Remove field` asks first (`ask`, today's `removeDataAsk` with `heldBy(entries, id)`), then takes the field and its data out of
every entry at the page's `Save` (`confirmDrop`; the removal waits for the final `Save`, as the autosave spec decided). The texts have **no**
sheet.

### 3.3 Locked lists

`LockedListEdit` (Testimonials, an app's locked list) is unchanged: its fields are read-only rows, no window, no text. **Decided by the owner on 15 Nov (Q1, decision 6).**

## 4. Which page-editor parts are reused

| Part | Source | Used here | Needs extraction first? |
| :--- | :--- | :--- | :--- |
| Editor engine (Milkdown/ProseMirror, history, text input) | `MarkdownEditor.tsx` | Yes: a **flow editor** with a restricted schema (three text styles, no marks, one `fieldBlock` atom). Its content is the definition (section 6), not Markdown. | **Yes**: the editor is built inside one 3,100-line component (step 3 below). |
| Text schemas | `bodySize.mjs` (`bodyMedium`), `eyebrow.mjs` (`eyebrow`), the heading node | Yes: Heading (level 3 only), Body medium, Label. | No. |
| Bar layout | `textBar.mjs` `planBar`, `toolWidth` | Yes. | No. |
| Bar rendering (context group, Insert, Undo, Redo, `⋮`, ghost measuring) | `MarkdownEditor.tsx` l. 2640 to 3050 | Yes, with **`+ Insert` carrying the three text styles and the field kinds** instead of the block picker. | **Yes** (step 1, with Insert's items as a parameter). |
| Sections and Save bar | `EntryForm.tsx` (`Page settings` and `Content` sections), `FormFrame.tsx` `SaveBar` | Yes: `List settings` and `Content` accordions and the bottom `Save changes` bar. | No (the sections are the entry form's; checked in PR 5 that they can host a non-form child). |
| Form field look | `DataForm.tsx` (the entry form page's fields) | Yes: field blocks are drawn with the entry form's field parts, disabled. | No. |
| Drag handle | `blockHandle` (takes a `view`), `blockDrag.mjs` | Yes, as is: it reads the top-level parts of the document. | No (checked: `move(view, i, by)` and `parts()` read `doc.forEach`, with no `siteBlock` test but `locked`). |
| Bar state store, action row | `blockBar.ts`, `blockRow.ts` | Yes: the field card tells them its tools. | No. |
| Keys and free lines between cards | `cardDeletes`, `gapHere`, `tapBelow`, `isCard` | Yes. | **Yes** (step 2): they test for `siteBlock` and `image` by name. |
| Block settings host (side sheet or subpage, `Save`/`Cancel`, unsaved dialog) | `Sheet.tsx`, `liveSheet.mjs`, `BlockDialog.tsx` (`BlockAsk`) | Yes. | **Partly** (step 3); the field form is new. |
| Field card's node view | `blockCard` (inline, typed-in-place) | **A new, small node view** (`fieldBlock`) that calls `blockBar.show`, `blockRow` and `blockHandle`; it does not reuse `blockCard`'s 600 lines. | n/a |
| Card look | `editor.css` `.site-block-card`, `.site-block-handle`, `.site-block-has-row`, drop marks | Yes, by class. | No. |
| Block selection of several cards | `blockSelection.ts`, `blockSelectable` | **Not in 0.19.** | n/a |

**The engine, compared honestly.** The owner wants inline text and blocks in one flow that behaves like the page editor and is not Markdown.

| | (a) A small ProseMirror instance (schema: Heading, Body medium, Label, one `fieldBlock` atom), serialised to the list's JSON | (b) React cards (a list of cards, a text box per line) |
| :--- | :--- | :--- |
| Typing text between cards | The browser's own caret, selection, `Enter`, `Backspace`, undo and redo, IME and spell check; the page editor's free lines and keys (`gapHere`, `tapBelow`, `nextToCard`). | Each line is its own input; a caret cannot cross lines, `Enter` and `Backspace` between lines, selection across lines, undo across cards and focus order all have to be written, and will differ from the page editor. |
| Text bar and styles | The page editor's bar and style menu apply to the selection as they do today. | A style button per input, a second set of rules. |
| Moving a card past text | `blockHandle` and `move` as they are (they read the document's top-level parts). | A new drag over a list of mixed items. |
| Screen readers | One text region with real paragraphs and headings, as the page editor. | Many inputs and cards to tab through; reading the text as a whole is not possible. |
| Behaves like the page editor | By construction (same engine). | Only by copying its behaviour, which drifts. |
| Extraction cost | `EditorBar`, card keys by node name, an editor host hook, a spike (section 5): about three PRs, the largest the bar. | Smaller (no host), but the window then re-implements text editing, which is the larger cost over time. |
| Storage | A thin, tested adapter between the flow and the definition (section 6); no Markdown. | The same functions, no adapter. |

**Recommendation: (a).** Inline text between blocks is what the page editor's ProseMirror already does, and (b) would have to rebuild it badly. The cost is
the three extraction PRs, each screen-neutral and checked against the page editor's own screens, and the spike that shows whether Milkdown's core can
run on a JSON document (else ProseMirror directly).

**Not Markdown.** The window is a ProseMirror document whose node types are the three text styles and `fieldBlock`; it is read from the definition
and written back to it by pure functions (section 6). Nothing is parsed or serialised as Markdown. Whether Milkdown's core can start from a JSON
document and report ProseMirror changes without its Markdown pipeline is checked in PR 3's spike (section 8); if it cannot, the window uses
ProseMirror directly with the same schemas (the editor already imports `prosemirror` through `$prose`), and nothing else here changes.

## 5. Extraction order (the smallest safe order)

Each step moves code without changing what the page editor does and ends with the page editor's checks unchanged (`npm run check`, and
`check:screens` before and after with the same screenshots). No step changes the edit page.

1. **`EditorBar`** (`src/EditorBar.tsx`): move the bar's rendering (context group, Insert, Undo, Redo, `⋮`, ghost measuring, the `planBar` call) out of the
   editor's component into a component that takes `{ name, context tools, fixed tools, insert items, state }` and renders the `Toolbar`. The page editor passes today's
   values. Risk: medium (about 400 lines), so it is one pull request on its own. Test: `textBar.test.mjs` and `check:screens`' bar checks at 375 and
   1280 px.
2. **Card plugins by node name**: `cardDeletes`, `gapHere`, `tapBelow`, `nextToCard` and `isCard` take the names of the card nodes (`siteBlock`
   and `image` today) as a parameter and are exported from their own module (`src/cardKeys.ts`). Risk: low (one parameter, one caller). Test:
   the page editor's key screens, plus a unit test of the keys on a small document with another node name.
3. **The flow editor's host** (`src/FlowEditor.tsx`): the part of `MarkdownEditor.tsx` that creates the editor (schemas, history, `$prose`
   plugins, `view` access) is made a hook, `useFlowEditor({ schema, doc, plugins, onChange })`, that the page editor calls with its schema and
   the window calls with its own. **A spike first** (PR 3): a JSON document in, ProseMirror changes out, no Markdown. If `BlockAsk`'s `edit` needs
   a ProseMirror view that the window lacks, `BlockHost` is extracted here too (the sheet host without a document), recorded in the PR.

Only then the window is built (section 8). `MarkdownEditor.tsx` shrinks and gains no behaviour. Each PR names the screens it reran.

## 6. Storage: the list text and its place in the flow

**Proposal.** `_list.json` version 2 gets one new optional key, **`notes`**: the list's text, one entry per line, in the order written, each with
the field it follows.

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
    { "style": "heading", "text": "Keep each service to two lines", "after": null },
    { "style": "body", "text": "Add the price in the last field.", "after": null },
    { "style": "label", "text": "Publishing", "after": "title" }
  ]
}
```

| Key | Rule |
| :--- | :--- |
| `notes` | Optional array. Missing or empty: no list text, exactly as before. |
| `style` | `heading`, `body` or `label`. Any other value is the definition problem `The text at <n> has an unknown style`. |
| `text` | Plain text, trimmed, at most 500 characters, no new line, no Markdown, no HTML. A line is one entry; two lines are two entries. Empty lines are not saved. |
| `after` | The id of the field the line comes **after** in the window, or `null` for before the first field. An id the list has no field for is the definition problem `The text at <n> follows a field the list does not have`, and is read as `null`. |

**The flow is derived, so there is one order.** The window shows: the notes with `after: null` in array order, then for each field in `fields`
order: the field, then the notes with `after` equal to it, in array order. Saving derives the other way: `fields` is the field blocks in document
order, and each note's `after` is the nearest field block before it in the document (`null` if none). Consequences:

- **One source for the field order** (`fields`, as today): the entry form, `asRowsOf`, `fieldKinds`, `entryProblems` and the `Rows from` picker read
  only `fields` and do not see `notes`.
- **Moving a card** past text changes `fields` order only when it passes another card; passing text changes only the text's `after`. Nothing
  else to keep in step.
- **Removing a field** leaves its texts where they stand: their `after` becomes the nearest field before (or `null`) on the next save.
- **On the list page** the field blocks have no place, so the page shows **all the notes in array order** above the rows; where a line stands
  among the cards in the window affects only the window (Q3).

**Text in all three places is covered by `after`.** Text before the first block is `after: null`; text between two blocks is `after` the first of them; text after
the last block is `after` the last field. Several lines in the same place are several entries with the same `after`, in array order. Nothing else is stored for it.
Display is as decided (decision 9): on the **list page** all the text stands above the rows in the order written, never between rows; on the **entry form page**
(`#new/<id>`) none of it is shown.

**Compatibility with lists saved before.**

- A `_list.json` without `notes` is a list with no text. No migration, no file is rewritten, `DEFINITION_VERSION` stays `2`: the new key is an
  addition, as `date` is. The window opens it as the field cards in `fields` order with no text.
- `parseDefinition` returns `notes` (an empty array when missing). `definitionText` writes `notes` **only when it is not empty**, as it writes
  `dropped` only while something waits, so a list without text has a byte-identical file. Both changes are unit tested (round trip with and
  without notes; an unknown key is still ignored).
- **An older CMS reading a newer file** ignores `notes` and, if it saves the list, drops them. Sites only move forward with the CMS version (the
  same position as `date`); nothing guards a downgrade.
- `check:content` (`ownListProblems`) reports a bad `notes` entry as a problem of the file, like any other definition problem.
- `listUses`, `Delete list`, `Rows from` and the entry files are unaffected; the waiting version (`useOwnList.change`) stores the whole definition
  text, so text and fields wait and commit together in one `Save`.

New pure functions, in a new `lib/ownListFlow.mjs` (each with tests, no ProseMirror): `flowOf(definition)` (the ordered flow: `{ type: 'text', style,
text }` and `{ type: 'field', id }` items), `definitionOfFlow(definition, flow)` (the definition with `fields` order, `notes` and `after` derived;
fields and their names are kept as they are), and `textsOf(definition)` (the notes in order, for the list page). The window turns the flow to a
ProseMirror document and back with a thin, tested adapter.

## 7. How the list text renders

### 7.1 On the list page, and in the demo

- **Styles.** `heading` is drawn with the **h3 style** and the **semantic level 2**: the page's title is the one `h1`, so the next level is `h2`;
  the owner asked for the h3 *look*, which `.prose :where(h3)` in `theme/styles/base.css` draws; the list page uses the same CSS variables, not a
  new size. `body` is `.body-medium`, `label` is `.label-medium` (`lib/body-size.mjs`, `lib/eyebrow.mjs`): the classes the page editor writes for
  those styles, so the text looks as the same words look in a page.
- **Colour** is the theme's context tokens: `--mo-on-surface` for heading and body, `--mo-on-surface-variant` for the label, as the editor's text
  (`CLAUDE.md`: colours in editor-drawn parts come only from the theme's roles). `check:editor-colors` stays green.
- **Order and spacing.** Lines stack in `notes` order with the editor's paragraph spacing, then the rows; a `label` above a `heading` pairs as it
  does in a page's text (the `.label-medium + h3` rule in `blocks.css`).
- **Empty.** No `notes`: nothing is drawn, the page is as today. A line empty after trimming is not drawn and not saved.
- **Search.** The list's search box searches the rows only, not the text.
- **The demo.** A made-up own list (for example `Services`) is added to the demo in PR 4 (`demo/src/data/services/` with a `_list.json`, a few
  entries and three lines of text, one of each style) so `check:screens` and the app's screenshots show the list page with text. The text is editor
  data: it appears nowhere on the **site** (no change to the site's HTML, no same-HTML check needed).

### 7.2 What Material 3 says (read 15 Nov 2026 with Playwright)

The FAB menu and the type roles are used outside the editor's own window (the list page), so they follow m3.material.io. The window itself follows
the page editor.

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
- **M3 does not print** the order of the items, so this spec chooses: `Add <entry>` first (the frequent, constructive action; FAB Guidelines:
  "A FAB promotes an important, constructive action such as: Create") and `Edit list` second.

**FAB** (Guidelines): "A FAB can transform into an extended FAB on larger screens, or it can transition into a FAB menu when selected. Use a
FAB menu when there are many kinds of actions relevant to the FAB." "Don't display multiple FABs on a single screen." One FAB per screen holds.

**A deviation to record.** FAB menu Guidelines: "When a FAB is paired with other components, like the floating toolbar or navigation rail, don't
use the FAB menu." From `medium` the editor's main menu is a **collapsed navigation rail** (`MainMenu.tsx`, `MainRailItem`), so the list page's
FAB menu at 1280 px sits beside a rail. The owner decided the FAB menu in words (decision 1), and `ListFab` already opens a menu next to the rail
for a list with several entry kinds. PR 1 adds the entry to `docs/material-deviations.md`: what Material says (the sentence above), what we do
instead (the FAB menu stays beside the rail), why (the owner's decision of 15 Nov and the existing `ListFab`), the date and the pull request.

**Typography** (Applying type), quoted: "The Material 3 type scale organizes styles into five roles that are named to describe their purposes:
display, headline, title, label, body." "Headlines are best-suited for short, high-emphasis text on smaller screens." "Body styles are used for
longer passages of text in your app." "Label styles are smaller, utilitarian styles, used for things like the text inside components or for very
small text in the content body, such as captions." So the three styles are three roles at three levels of emphasis. The owner fixed the sizes
(h3 look, Body medium, the editor's `.label-medium`), which are theme tokens; no token value is quoted here and none is changed. Nothing here
deviates.

### 7.3 Accessibility

- **Headings.** One `h1` (the page title); a heading line is an `h2` with the h3 look (section 7.1), so the outline has no gap.
- **The window.** The text area is the page editor's own pattern: one labelled multi-line text box (`aria-label` `List text and fields`) with the
  browser's caret and selection, so a screen reader reads the lines in order; a heading line in the window is an `h2` too. Visible focus.
- **Accordions.** `List settings` and `Content` are disclosure buttons with `aria-expanded` and `aria-controls`, as the entry form's sections are; `Delete list` is reachable by keyboard in `List settings`, and the Save bar is a labelled region at the page's end.
- **The bar.** A `Toolbar` with `role="toolbar"` and the page editor's group labels; arrow keys move within it. Every button has a name; the
  style menu says the current style; `planBar`'s `⋮` has `aria-haspopup`.
- **Cards.** A field card is `role="group"` with the label `<name> field, <kind>`, as a page block is. The arrow keys move the caret into and out
  of a card (`nextToCard`), `Enter` on a selected card opens its settings, `Delete` and `Backspace` on a selected card ask first (`ask`), and focus
  returns to the line before it.
- **Moving without a pointer.** Move up and Move down are buttons in the row and the bar; they announce the result in a live region (`<name>
  moved to position 2 of 3 fields`), and are `disabled` with a reason at an end (M3: a disabled control is shown, not hidden). The drag handle is
  `tabIndex -1`, as the page editor's, because the buttons are the keyboard way.
- **Targets.** Row buttons are 44 dp (`SIZE` in `blockRow.ts`), the editor's touch size; the FAB menu's items are 48 dp (M3).
- **Reduced motion.** The row's spring and the FAB menu's transition follow `motionReduced` (`lib/motion`), as the page editor's do.
- **Colour.** `check:screens` runs its contrast checks on the window and on the list page with text, in light and dark, on every section colour
  that applies.
- **The FAB menu:** initial focus on the close button; Tab through the items; Space or Enter activates; Escape closes and returns focus to the FAB.

## 8. Build plan

Pull requests into `0.19`, each small, each with a changeset (`patch` or `minor`, never `major`; `--empty` where the owner sees nothing),
`npm run check` and the checks of the skill `checks`. A visible PR carries screenshots at 375 and 1280 px. The extractions (PRs 2 to 4) are
screen-neutral and compare `check:screens` before and after.

| # | Pull request | Visible | Screenshots | Changeset |
| :--- | :--- | :--- | :--- | :--- |
| 0 | This spec, and the corrections to the framework spec and the edit-page plan (section 10). | no | — | empty |
| 1 | **List page FAB menu.** `Add <entry>` and `Edit list` in a `FabMenu` (a plain `Edit list` FAB for a list with no field); entries are added at `#new/<id>` only; the deviation entry in `docs/material-deviations.md`; labels and Danish; unit test of the FAB's actions (`fabScreens.ts`); a screen check of the menu open at 375 and 1280. | yes | the closed FAB and the open menu, 375 and 1280 | minor |
| 2 | **Extract `EditorBar`** from `MarkdownEditor.tsx` (section 5, step 1). No behaviour change. | no | none (screens rerun) | empty |
| 3 | **Card plugins by node name** (step 2) and the **flow editor spike** (step 3): `useFlowEditor` with a JSON document, no Markdown; `BlockHost` if needed. No behaviour change in the page editor. | no | none (screens rerun) | empty |
| 4 | **Storage of the list text.** `notes` in `parseDefinition` and `definitionText`, `lib/ownListFlow.mjs` (`flowOf`, `definitionOfFlow`, `textsOf`), `check:content`, tests (round trip, a file without `notes` byte-identical, bad style and `after`, ordering rules). The list page draws the text from `notes` (section 7.1) and the demo gets its `Services` list; no editing UI yet. | yes | the list page with the three styles, 375 and 1280, light and dark | minor |
| 5 | **The editor window: fields.** `OwnListEdit.tsx` is rebuilt on `useFlowEditor`, `EditorBar`, `blockBar`, `blockRow`, `blockHandle`, `planBar`: the `List settings` accordion (name, `Entry name` with the optional `singular` in `_list.json`, `Delete list`), the `Content` accordion with one editor card, `+ Insert` with the field kinds, Undo and Redo, field blocks drawn as the entry form's fields (name typed in place), the row and the handle, Move up and Move down, `Remove field` (with `ask` and `heldBy`), the field settings sheet, the bottom `Save changes` bar, no `Shown` and no `Add item`. Text lines can be typed in Body medium and are saved. The waiting version stays; the old `FieldBar` goes. | yes | `List settings` closed and open, the window with blocks, a block active with its row, the sheet open, the Insert menu, 375 and 1280 | minor |
| 6 | **The editor window: text styles.** The three text styles in `+ Insert` and the style menu (Heading, Body medium, Label), `Enter` rules, the keys of the page editor for those styles, the bar's text tools reduced to them. | yes | text with the three styles, the style menu open, 375 and 1280 | minor |
| 7 | **Accessibility and phone pass.** Live region for moves, labels, the keyboard path, the unsaved dialog on back, `checkOwnList` extended (add a field at the cursor, type text, move by buttons and by handle, remove, save, reload keeps text and order, 375 and 1280). | yes | none new | patch |
| 8 | **Release notes** for 1 to 7 (skill `release-notes`), English and Danish. | yes | — | empty |

Order: 1 is independent. 2 and 3 precede 5. 4 precedes 5 (the window reads and writes what 4 stores). 5 precedes 6 and 7.

## 9. Tests

- **Unit** (`lib/ownListEdit.test.mjs`, `lib/ownList.test.mjs`, `lib/ownListFlow.test.mjs`): `parseDefinition` with and without `notes`, with a bad
  style, a bad `after` and an over-long text; `definitionText` byte-identical for a list without text and a full round trip with text; `flowOf` and
  `definitionOfFlow` are each other's inverse on any flow; moving a card past text keeps `fields` order unless it passes a card; removing a field
  re-anchors its text; `moveField` and `confirmDrop` leave `notes` alone.
- **Unit** for the card keys with another node name, the adapter between the flow and a ProseMirror document, and the FAB's actions (two items,
  one item with no field, `Add <entry>` first).
- **Screens:** the list page with text, FAB closed and open; the window with fields only, with text, a card active, the sheet open, the overflow
  menu at 375 px; a keyboard-only run (Tab to the window, Arrow into a card, Move down by button, announce, Delete, `ask`, focus); reload keeps the
  text and the order.
- `check:editor-colors`, `check:language` (English only outside the language files; `image` not the old word), `check:density`.

## 10. What in the framework spec disagrees (and is fixed here)

Marked in `docs/superpowers/specs/2026-11-14-dynamic-lists-framework-design.md`; the same pull request changes that text:

1. **Section 1, point 6 and section 11, phase 8 `PR B`:** an own list's entries typed in place on its edit page. **Cancelled** by decision 1: entries
   are added on the entry form page, never on the edit page. Phase 8 and its release-note phase move into this spec's plan. The framework
   spec's phases are not renumbered (a gap is marked) so links to *phase 9* and *phase 10* in other specs still point at the right work.
2. **The paragraph "PR B: built in the core (decided, Q10)"** and **Q10 in section 13:** replaced by the decision that there is no PR B; Q10 reads
   `Cancelled by the owner on 15 Nov: entries are not typed on the edit page`.
3. **Section 2, row *The list's pages* and section 3.7:** the edit page is described as `the fields`; it is now **the editor window of this spec**
   (inline text with field blocks in the flow), and the entries page stays the list page with the FAB menu.
4. **Section 4.1, `Edit list`:** the field bar of #616 is now the editor window; `Shown` is gone (decision 4).
5. **The dependency line "Phase 8 needs only #616, so it can run beside 1 to 4"** and the phase 10 title **`Release notes for 8 and 9`:** edited.
6. **`docs/superpowers/plans/2026-11-14-dynamic-list-edit-page.md`, *PR B* and *Entries*:** carries the same note.

It does not disagree with the rest: the framework's `locked` lists keep `LockedListEdit` (section 3.3 here), `listEdit` stays the slot the app's
window is drawn through (the editor window is the thing in that slot), and `lib/ownList.mjs` stays core.

## 11. Questions for the owner (all decided)

**Q1. Do locked lists get list text?** **Decided by the owner on 15 Nov 2026: no.** Locked lists (those an app provides) stay locked in 0.19, with no editor window and no list text; `LockedListEdit` is unchanged. Text for them is a later step (an `app.json` `notes` key in a later contract) when an app asks for it.

**Q2. What is `<entry>` for a list the owner made?** **Decided by the owner on 15 Nov 2026:** an `Entry name` box next to the list's name on the edit page (hint `Used on the button: Add service`), stored as an optional `singular` in `_list.json`, built in PR 5. The FAB menu says `Add <entry name>`; empty means `Add item`. No guessing from the list's name. It is one optional key like `notes`, and the framework spec's `singular` for an app's list has the same name. #712's `singularOf` guess is replaced by this when the window is built.

**Q3. Where does a line of text stand on the list page?** **Decided by the owner on 15 Nov 2026: yes, the text stands above the rows, in the order written** (decision 9). The list page has no fields, so a line written between two field blocks in the window cannot stand between them there. A line's place among the blocks matters only in the window (it says which field the line is about). Text below the rows is not offered; if it is wanted later, a second value of `after` for "the end" is the only storage change.

## 12. Not in this spec

- Selecting several cards at once and copy and paste of cards (the page editor has them; the window has its own `Save` and waiting version).
- Rich text in the list text (bold, links, colours, lists): the owner allowed three styles only.
- Showing the list text on the site, in a block, or in an entry form.
- Typing entries on the edit page (cancelled, section 10).
- Changes to Testimonials' or an app's list page other than the FAB menu of PR 1.
