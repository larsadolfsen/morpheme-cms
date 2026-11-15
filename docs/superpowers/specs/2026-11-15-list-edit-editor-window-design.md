# The edit page of a list as an editor window (design)

Status: spec and build plan for 0.19, no code in this pull request. Written 15 November 2026 in a brainstorm session from the owner's decisions of
the same day (section 1), **redrawn the same day after the owner's correction** that the list's texts are inline text in the flow, not blocks
(decision 5). Branch `0.19`. All four questions (section 11) are decided; decision 8 (layout) is the owner's direction of 15 Nov.

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
10. **(Decided, 15 Nov.)** **Field validation.** Each text field gets a **`Format`** choice in its settings sheet (the gear on the card): **Any text** (the default), **Email**, **Web address**, **Number**. The owner confirmed these four on 15 Nov (Q4); the UI label is the owner's **`Web address`** and the stored id stays **`url`**. The entry form checks it and shows a message (for example `Enter a valid email address`). It is stored on the field in `_list.json` as an optional key, **`format`**, unknown to older code like `notes`, so `parseDefinition` and `definitionText` keep it; a list without it stays byte-identical (section 12). Other validations the owner may want are not decided here.
11. **(Owner requirement, 15 Nov.)** **Reuse in the front end as a form.** The code must be reusable on the public site as a form (visitors fill in the same fields, for example a contact form). The field model, the formats, the validation and the entry form's field rendering rules are therefore **pure shared code under `lib/`** (no React, no editor imports, runs in the Worker and the browser, tested), and the editor's entry form is **one user** of it (section 12).
12. **(Owner requirement, 15 Nov.)** The same editor window must also work as a **form builder**, a later function (**Forms**) that behaves the same way: the same editor card (text between fields, `+ Insert`, field blocks, the settings sheet, `Format` validation, a name per field) for a form that **visitors fill in on the public site**. The window is therefore a generic **field flow editor** that takes a definition and a few **host options** (what the host adds); lists and forms share one component and one definition shape (**fields, notes and formats**). For a list the host adds the `Entry name` and the list page; for a form, later, its recipient, success message and submit button text (section 3.4). Forms is **not** built in 0.19; the 0.19 window and the shared validation module are written **host-neutral** (section 13). The owner clarified that **Forms will be added to the front end as a block** (a **Form block** on pages): 0.19 does **not** write it but **prepares for it**, so it can be added later without rework. The exact preparations are in section 12.4.
13. **(Owner, 15 Nov.)** **"Plan for everything, but don't show patterns. This is for developers."** (1) **Plan all validations** in `lib/fieldFormats.mjs`: **Required**, minimum and maximum length, number range (min and max), a choice list, phone, date, and a custom pattern. The settings sheet shows Required, length, range, choice list, phone and date as the owner needs them; the **custom pattern exists in the stored definition for developers** (the definition file or code) and is **never shown in the editor UI**. Section 12.5 says which are built in 0.19 (the recommendation: **Required plus the four formats**) and which come in later phases, each with its **stored key and message key**, so nothing needs a data change later. (2) **New field kinds are planned**: **`Country`** (a country picker that stores the ISO country code) and **`Address`** (a structured field with a **provider hook** so a lookup service can fill it later; no service, key or network call in 0.19). Section 12.6 marks each as planned, with its phase, and shows how it fits the same definition shape.

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

### 3.4 One field flow editor for lists and forms (decision 12)

The window is built as a generic component, **`FieldFlowEditor`** (`src/FieldFlowEditor.tsx`), that knows nothing about lists. It takes:

```ts
<FieldFlowEditor
  definition={definition}          // fields + notes + formats (the shape of section 6 and 12)
  onChange={(next) => …}           // the host keeps the waiting version and saves
  host={{
    settings: [...],               // the host's own boxes in the first accordion
    save: …,                       // the host's Save (the waiting version, SaveBar)
    labels: { … },                 // the host's words (the accordion's name, Delete)
  }}
/>
```

The component draws the **`Content`** accordion (the editor card, `+ Insert`, field blocks, text, the settings sheet with `Format`, Undo and Redo) and the first accordion (**`List settings`** for a list) from `host.settings`; the bottom Save bar is the host's. Everything in sections 3.2 to 6 is the component; nothing in it says `list` except the host's words.

| Host | Settings in the first accordion | Page around the window | Stored in | Status |
| :--- | :--- | :--- | :--- | :--- |
| **List** (`OwnListEdit.tsx`, a thin host) | List name, `Entry name` (decision 7), `Delete list` | The list page shows the text above the rows (section 3.1); entries are added on the entry form page | `_list.json` (`fields`, `notes`, `singular`) | **0.19** |
| **Form** (a later `FormEdit`) | Form name, recipient (where submissions go), success message, submit button text, `Delete form` | The form is embedded by a Form block on the public site (section 13) | The form's own definition file (to be planned), the same `fields`, `notes` and `format` | **Later** (not planned in 0.19) |

What this asks of the 0.19 build, and nothing more: `FieldFlowEditor` takes the **definition** and the **host options** as props and imports nothing from `OwnListEdit.tsx` or `useOwnList.tsx`; the pure code is named for what it does, not for lists (`lib/fieldFlow.mjs`, section 6; `lib/fieldFormats.mjs`, section 12); `OwnListEdit.tsx` is the list host and is the only file that knows `_list.json` and `Delete list`. No host option for forms is built in 0.19.

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

New pure functions, in a new `lib/fieldFlow.mjs` (each with tests, no ProseMirror): `flowOf(definition)` (the ordered flow: `{ type: 'text', style,
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
| 1c | **Shared field formats and validation** (decisions 10 and 11): `lib/fieldFormats.mjs` (`FORMATS`, `formatsOf`, `validate(value, field)` returning a message key and applying `required` and the four formats, `inputOf(field)`; every field key it does not know is kept, section 12.5), a neutral `parseFields` that reads `fields`, `notes` and `format` (`parseDefinition` calls it; a list without them is byte-identical), `entryProblems` calls `validate`, tests (each format valid and invalid, empty is valid, an unknown format is a problem, the module imports nothing from `src/`). No screen changes. | no | none | minor |
| 2 | **Extract `EditorBar`** from `MarkdownEditor.tsx` (section 5, step 1). No behaviour change. | no | none (screens rerun) | empty |
| 3 | **Card plugins by node name** (step 2) and the **flow editor spike** (step 3): `useFlowEditor` with a JSON document, no Markdown; `BlockHost` if needed. No behaviour change in the page editor. | no | none (screens rerun) | empty |
| 4 | **Storage of the list text.** `notes` in `parseDefinition` and `definitionText`, `lib/fieldFlow.mjs` (`flowOf`, `definitionOfFlow`, `textsOf`), `check:content`, tests (round trip, a file without `notes` byte-identical, bad style and `after`, ordering rules). The list page draws the text from `notes` (section 7.1) and the demo gets its `Services` list; no editing UI yet. | yes | the list page with the three styles, 375 and 1280, light and dark | minor |
| 5 | **The editor window: fields.** A host-neutral **`FieldFlowEditor`** (section 3.4: the definition and host options as props) is built on `useFlowEditor`, `EditorBar`, `blockBar`, `blockRow`, `blockHandle`, `planBar`, and `OwnListEdit.tsx` becomes the list host of it: the `List settings` accordion (name, `Entry name` with the optional `singular` in `_list.json`, `Delete list`), the `Content` accordion with one editor card, `+ Insert` with the field kinds, Undo and Redo, field blocks drawn as the entry form's fields (name typed in place), the row and the handle, Move up and Move down, `Remove field` (with `ask` and `heldBy`), the field settings sheet, the bottom `Save changes` bar, no `Shown` and no `Add item`. Text lines can be typed in Body medium and are saved. The waiting version stays; the old `FieldBar` goes. | yes | `List settings` closed and open, the window with blocks, a block active with its row, the sheet open, the Insert menu, 375 and 1280 | minor |
| 5b | **Format in the field settings sheet and on the entry form.** The `Required` switch and the `Format` choice (Any text, Email, Web address, Number) in the field's settings sheet; the entry form (`DataForm.tsx`) draws the input from `inputOf` and shows the message from `validate` when the field is left and on `Save` (the message texts, English and Danish). | yes | the sheet with Format open, an entry form field with its error message, 375 and 1280 | minor |
| 6 | **The editor window: text styles.** The three text styles in `+ Insert` and the style menu (Heading, Body medium, Label), `Enter` rules, the keys of the page editor for those styles, the bar's text tools reduced to them. | yes | text with the three styles, the style menu open, 375 and 1280 | minor |
| 7 | **Accessibility and phone pass.** Live region for moves, labels, the keyboard path, the unsaved dialog on back, `checkOwnList` extended (add a field at the cursor, type text, move by buttons and by handle, remove, save, reload keeps text and order, 375 and 1280). | yes | none new | patch |
| V | **More validations** (next version, to be planned): minimum and maximum length, number range, choice list, phone, the `date` check with framework phase 6, and the developer-only `pattern` (section 12.5); each rule's stored key and message key are already reserved. | later | — | — |
| K | **Country and Address kinds** (next version, with Forms, to be planned): `lib/countries.mjs`, `lib/address.mjs` and the provider hook, the `KINDS` entries, the entry form's picker and address block (section 12.6). | later | — | — |
| F | **Forms** (next version, to be planned). A `FormEdit` host of the same `FieldFlowEditor`, a Form block, the Worker's public submit endpoint and the rest of section 13. Not built in 0.19 unless the owner moves it in. | — | — | — |
| 8 | **Release notes** for 1 to 7 (skill `release-notes`), English and Danish. | yes | — | empty |

Order: 1 and 1c are independent. 5b needs 1c and 5. 2 and 3 precede 5. 4 precedes 5 (the window reads and writes what 4 stores). 5 precedes 6 and 7.

## 9. Tests

- **Unit** (`lib/ownListEdit.test.mjs`, `lib/ownList.test.mjs`, `lib/fieldFlow.test.mjs`): `parseDefinition` with and without `notes`, with a bad
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

**Q4. The set of formats and their names.** **Decided by the owner on 15 Nov 2026: yes, the four formats Any text, Email, Web address, Number**, with the UI label `Web address` (the stored id stays `url`). The owner's label wins over the standard names' `URL` (#702) for this choice. A Format applies to the Title and Body text kinds only, and `Required` (section 12.5) is built in 0.19 with the four formats. The owner has asked which other validations exist; that answer is not part of this spec yet.

## 12. Field formats and shared code (for a future site form)

### 12.1 The `Format` of a field (decision 10, proposal)

| Format | Stored | A value is valid when | Message key (English text) |
| :--- | :--- | :--- | :--- |
| Any text (default; no key) | (nothing) | always | none |
| `email` (Email) | `"format": "email"` | one `@`, text before it, a dotted domain after it, no spaces | `format.email` (`Enter a valid email address`) |
| `url` (Web address) | `"format": "url"` | an `https://` or `http://` address with a host | `format.url` (`Enter a valid web address`) |
| `number` (Number) | `"format": "number"` | digits with an optional minus and one optional decimal separator (`.` or `,`) and no spaces | `format.number` (`Enter a valid number`) |

- It applies to the **Title** and **Body text** kinds. The **Link** kind is a web address by its kind and has no Format choice; Icon, Image and Tags have none.
- An **empty value is valid** for every format (nothing is required unless the field's `required` says so, section 12.5); a Format never makes a field required.
- A value is stored **as text**, as every entry value is today (`entryProblems` wants a string), so `Number` stores `"120"`, never a JSON number; nothing about the data changes.
- Stored on the field: `{ "id": "email", "kind": "title", "label": "Email", "format": "email" }`. `parseDefinition` reads `format` (a value it does not know is the definition problem `The field "<id>" has an unknown format`; the field is read as Any text) and returns it; the fields are written whole by `definitionText`, so it is kept. A field without `format` is byte-identical. An older CMS ignores `format` and drops it on the next save (the same position as `notes` and `date`).
- **Existing entries** are not checked when the list loads. The entry form checks a field when the person leaves it and again on `Save`; `check:content` (`entryProblems`) reports a stored value that fails its format as a problem of that file, so a Format added to a field with old data shows what to fix. The message is shown with the field (M3 text field error state, as the editor's fields do).

### 12.2 What is shared (pure, under `lib/`)

New module **`lib/fieldFormats.mjs`**, plus what `lib/ownList.mjs` already has (it is pure: "no browser and no React"):

| Shared | Where | What it gives |
| :--- | :--- | :--- |
| Field kinds and the definition | `lib/ownList.mjs` (`KINDS`, `parseDefinition`, `fieldsOf`, `nameOf`) | The field model: id, kind, name, order, format. Unchanged, extended with `format`. |
| Formats | `lib/fieldFormats.mjs` (`FORMATS`, `formatsOf(kind)`) | The formats a kind may have (`title` and `text`: `email`, `url`, `number`; others none). |
| Validation | `lib/fieldFormats.mjs` `validate(value, field)` | `null` when valid, else a **message key** (`required`, `format.email`, `format.url`, `format.number`, and the later keys of section 12.5). It returns a key, not a sentence: the caller turns the key into English or Danish text, so the same function serves the editor (`t`), the site (`siteT`) and the Worker. |
| Input rules | `lib/fieldFormats.mjs` `inputOf(field)` | Plain data about the input a field draws: `{ element: 'input' \| 'textarea', type: 'text' \| 'email' \| 'url', inputmode, autocomplete }` (Email: `type="email"`; Web address: `type="url"`; Number: `inputmode="decimal"`; Body text: `textarea`). The editor's entry form maps it to its text field; a site form maps it to an HTML input. |
| Entry check | `lib/ownList.mjs` `entryProblems` | Calls `validate` per field, so the build's `check:content` and the form use one rule. |

`lib/fieldFormats.mjs` imports **nothing** from `src/`, React, Milkdown or the Worker; it runs in the browser, in the Worker and in Node, and has its own `node --test` file. The Worker's no-pending-promise rule (`CLAUDE.md`) is unaffected: the module has no I/O.

### 12.3 What is not shared

The editor window (shared by the list host and a later form host, section 3.4, but never by the site), the editor card and its bar, the settings sheets (the `Format` choice is drawn by the sheet, but its list of formats comes from `formatsOf`), the entry form's React components and the editor's text keys. They use the shared code; the site never imports them.

### 12.5 All the validations, planned (decision 13)

All of these are **planned now** so that the stored definition never needs a data change: the keys below are **reserved** on a field, `parseDefinition` and the window **keep every field key they do not know** (a round trip never drops one; `definitionOfFlow` writes back the keys it does not edit), and a later phase adds the rule to `validate` and, where the owner needs it, a control to the sheet. A key a phase has not built is stored and **not enforced** until its phase.

| Rule | Stored on the field | Message key (English text) | Settings sheet | Phase |
| :--- | :--- | :--- | :--- | :--- |
| **Required** | `"required": true` | `required` (`This field is required`) | A `Required` switch | **0.19** (recommended; `Required` is the one thing the owner's "plan for everything" most needs, and it is cheap) |
| Format: Email, Web address, Number | `"format": "email"` \| `"url"` \| `"number"` | `format.email`, `format.url`, `format.number` (section 12.1) | The `Format` choice | **0.19** (decision 10) |
| Minimum and maximum length | `"minLength": 3`, `"maxLength": 80` (whole numbers of characters) | `length.min` (`Enter at least {n} characters`), `length.max` (`Enter at most {n} characters`) | `Minimum length` and `Maximum length` boxes, shown for Title and Body text | Later (next version) |
| Number range | `"min": 0`, `"max": 100` (numbers; with `format: "number"`) | `range.min` (`Enter a number of at least {n}`), `range.max` (`Enter a number of at most {n}`) | `Smallest` and `Largest` boxes, shown with `Number` | Later |
| Choice list | `"format": "choice"`, `"choices": [{ "value": "a", "label": "Option A" }]` (a stored value is the `value`) | `choice` (`Choose one of the options`) | A list editor for the options | Later |
| Phone | `"format": "phone"` (a number written as the person types it; a default country for the check is a later key) | `format.phone` (`Enter a valid phone number`) | Offered in the `Format` choice | Later |
| Date | the **`date` kind** of the framework spec (stored `YYYY-MM-DD`, framework phase 6); `validate` checks the stored form | `format.date` (`Enter a valid date`) | None: the kind is the choice (a `date` Format on a text field is not offered) | With framework phase 6 |
| **Custom pattern** | `"pattern": "^[A-Z]{2}-\\d{4}$"`, optional `"patternMessage": "Use two letters, a dash and four digits"` | `pattern` (the field's `patternMessage` when set, else `Enter a value in the right format`) | **Never shown** (no control, no menu item, no hint) | Later, for developers |

- **The pattern is for developers.** It is written in the definition file or by code and never drawn by the editor UI. The editor keeps it untouched when it saves the field; `parseDefinition` checks that it compiles, is at most 200 characters, and runs on a value capped at 1,000 characters (a pattern that does not compile is the definition problem `The field "<id>" has a pattern that is not valid`). The message text, when set, is written in the definition's language (English first, as every stored text).
- **Order of the checks:** `required`, then the kind's own check (a `country` is a known code), then `format`, then length, then range, then choice, then `pattern`; the first that fails gives the one message (`validate` returns one key, never a list).
- **No data change later:** nothing is renamed or moved; a field with `required` or `format` from 0.19 reads the same in every later phase.
- **Built in 0.19:** the PRs 1c and 5b (section 8) build `required` and the four formats; the other rows are **planned**, in the placeholder PR **V** (section 8).

### 12.6 Planned field kinds: Country and Address (decision 13)

Both are **planned** and **not built in 0.19** (the recommendation: build them with Forms, section 13, where they matter; if a kind is trivially cheap when the build reaches it, the PM may bring it forward). Each fits the same definition shape, `fields[{ id, kind, label?, format?, … }]`, the same entry form and the same Form block.

| | `country` (Country) | `address` (Address) |
| :--- | :--- | :--- |
| What the person sees | A drop-down of countries, names in the **site's language**, sorted by that language | One block of boxes: Street, Line 2, Postal code, City, Country (the Country box is a `country` picker) |
| Stored value | The **ISO 3166-1 country code** as text (`"DK"`), like any text value | An **object** under the field id: `{ "street": "…", "line2": "…", "postalCode": "…", "city": "…", "country": "DK" }` (parts missing when empty) |
| Shared code | New `lib/countries.mjs`: `COUNTRY_CODES` (the ISO list), `countryName(code, locale)` (from `Intl.DisplayNames`, so no list of names is stored or translated by hand and it runs in the browser and in the Worker), `isCountry(code)` | New `lib/address.mjs`: `ADDRESS_PARTS`, `isAddress(value)`, `emptyAddress()`, and the provider hook below |
| `validate` | The value is a known code (`country` message key `Choose a country`) | `required` means street, postal code, city and country are all present (`address` message key `Enter the full address`); a postal-code pattern per country is a later key |
| Definition example | `{ "id": "country", "kind": "country", "label": "Country", "required": true }` | `{ "id": "address", "kind": "address", "label": "Address", "country": "DK" }` (the optional `country` is a default or a limit, later) |
| Where it touches existing code | `KINDS` in `lib/ownList.mjs` gets the entry (`asRows: null`, no place in a row), `entryProblems` accepts a string code, `kindNames`, the `+ Insert` menu, the entry form's picker, and the Danish and English texts | The same, and `entryProblems`, `heldBy`, `dropField` and the entry form learn **an object value** (today a value is a string or a list of tags) |
| Phase | Planned: with Forms | Planned: with Forms |

**The address provider hook** (a shared contract, **no service, key or network call in 0.19**). `lib/address.mjs` defines only the shape; it does no I/O:

```ts
type AddressParts = { street?: string; line2?: string; postalCode?: string; city?: string; country?: string };
type AddressSuggestion = { label: string; parts: AddressParts };
type AddressProvider = {
  id: string;
  // The query is what the person typed; `country` and `locale` narrow it; `signal` cancels it.
  lookup(query: string, options: { country?: string; locale?: string; signal?: AbortSignal }): Promise<AddressSuggestion[]>;
};
```

A host (the editor's entry form now, a Form block later) is given a provider **as a function it calls**, never one the shared module imports, so the module stays pure and the Worker's rules (no pending I/O promise kept in module memory) hold. With no provider the Address box is five plain boxes.

**How a service could plug in later**, each as one `AddressProvider`, written in its own file and not in the shared module:

- **The Danish address register** (the public address API of the Danish authorities, DAWA or its successor, to be checked when the work starts): an autocomplete on a street, a postal code and a city, answered as `AddressParts` with `country: "DK"`.
- **A map service** (a places or geocoding API): the same `lookup`, for addresses anywhere.
- The call is made **from the Worker**, not the browser, so a key is kept as a site secret and never sent to a visitor; the site's privacy text must then say that what a visitor types is sent to the service (section 13). Which services, their keys, cost and rate limits are decisions for the Forms spec.

### 12.4 Preparing for a Form block (decision 12)

A later **Form block** on pages (the owner: Forms are added to the front end as a block) reads the **same definition** the editor window writes, draws each field as an HTML input from `inputOf`, checks it in the browser with `validate` and, when the Worker receives it, checks it again with the same `validate` (the browser's check is never trusted); the messages are the site's texts (`siteT`), chosen by the message key. **0.19 does not write that block.** It makes these preparations, each small, so the block can be added without rework:

**(a) One definition shape that does not say "list".** The shared shape is `{ version, label, fields: [{ id, kind, label?, format? }], notes?: [{ style, text, after }] }`: the fields, the notes and the formats, and nothing else. What belongs to one host sits **beside** it and is read by that host only: a list's `singular` and `dropped`; a form's recipient, success message and submit button text (later). The parse is a neutral **`parseFields(raw)`** (new, in `lib/fieldFlow.mjs`; it checks `fields`, `notes` and `format` and returns them); `parseDefinition` in `lib/ownList.mjs` stays the list's parse and **calls** it, adding `singular` and `dropped`. The names in the shared files (`fields`, `notes`, `format`, `kind`, `FIELD_KINDS`) never say `list` or `entry`.

**(b) Readable by a block through the same reader as lists.** The framework spec's reader (`lib/lists.mjs`: `readList`, `listSlots`, framework phase 1, #703) has a **source table** that names where a source's items come from. 0.19 adds, at the time phase 1 lands, one more kind of question that table can answer: **"the fields of definition X"**, `readFields('<definition id>')`, giving `{ fields, notes, label, missing }` at build time (missing: true when no such definition exists, as `readList`). In 0.19 the only definition it knows is an own list's (`_list.json`); a form's is one more source kind added to the same table later. A block asks for **the fields**, not for entries; entries stay `readList`'s. `readFields` is a pure function of the files, with the same editor-and-site pair (`readFields` on the site, `fieldsOf(data, id)` in the editor) as `readList`/`listItems`.

**(c) The shared `lib/fieldFormats.mjs` and the field rendering rules are host-neutral.** `FORMATS`, `formatsOf(kind)`, `validate(value, field)` and `inputOf(field)` (section 12.2) take a field and a value and know nothing about lists, entries, the editor, the Worker or the site. The message keys (`required`, `format.email`, `format.url`, `format.number`, and the later keys of section 12.5) are plain strings the host turns into text.

**(d) The editor window is host-neutral.** `FieldFlowEditor` (section 3.4) takes the definition and host options as props and imports nothing from the list's files; `OwnListEdit.tsx` is the one list host.

**(e) Where a form definition could be stored later (a convention, no files created).** As an own list is the folder `src/data/<id>/` with its definition `_list.json` and one file per entry, a form would be the folder **`src/data/<id>/`** with its definition **`_form.json`** (the same `fields`, `notes` and `format`, plus the form's host settings) and, when the owner decides it, its submissions as entry files in the same folder, so a submission could be read by the same entry code as a list's. A form's id and a list's id share one namespace (`idOf`'s `taken` check already covers every folder in `src/data/`), so they never collide, and a folder with `_form.json` is not a list (`ownListProblems` already looks only for `_list.json`). `DEFINITION_FILE` stays `_list.json` for lists; the form's file name is a later decision of the Forms spec, and **no `_form.json` file, folder, reader or check is created in 0.19.**

**What 0.19 explicitly does not do:** write the Form block; write `FormEdit` or any form host option; read, store or create `_form.json`; add a public submit endpoint, spam protection, storage or email of submissions, privacy text or consent; add file uploads or any validation beyond `required` and the four formats (section 12.5); add a second definition source to the reader beyond an own list's. The Forms items are listed in section 13 as open for a later version.

## 13. Forms later

A later **Forms** function (decision 12) makes a form the owner builds in the same window and visitors fill in on the public site. What it adds **beyond lists**, none of it in 0.19 unless the owner moves it in:

- **Where a form lives and its host options:** the form's own definition (the same `fields`, `notes` and `format` as a list, section 6 and 12), in its own file and its own page in the editor, with the host settings in the first accordion: name, **recipient**, **success message**, **submit button text**.
- **How a Form block embeds it:** a block that names a form (as `Rows from` names a list) and draws every field from `inputOf` with the text above, the submit button and the messages from `validate`, in the theme's own parts.
- **A public submit endpoint in the Worker:** where a submission goes, its limits, and the second check with the same `validate` (section 12.4).
- **Spam protection:** a honeypot, a challenge, rate limiting.
- **Where submissions are stored and shown:** a list's entries or a D1 table, who reads them in the editor, how long they are kept.
- **Email notification** to the recipient and a receipt to the visitor.
- **Privacy text and consent:** a consent checkbox, a link to the privacy page, what is stored.
- Also file uploads for an Image field, and the page for visitors without JavaScript (section 12.4).

The build plan has one placeholder, **F, Forms (next version, to be planned)**; it needs its own spec.

## 14. Not in this spec

- Selecting several cards at once and copy and paste of cards (the page editor has them; the window has its own `Save` and waiting version).
- Rich text in the list text (bold, links, colours, lists): the owner allowed three styles only.
- Showing the list text on the site, in a block, or in an entry form.
- Typing entries on the edit page (cancelled, section 10).
- Building Forms (section 13): only the host-neutral `FieldFlowEditor` and shared code are 0.19.
- Changes to Testimonials' or an app's list page other than the FAB menu of PR 1.
