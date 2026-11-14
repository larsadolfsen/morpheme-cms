# Paste to make items, and Change to (design)

Status: spec and build plan for the 0.18 PM, every open point decided by the owner (section 10). No code in this pull request.
Owner decisions of 14 Nov 2026, building on the open
questions 4 and 5 and the Steps decision on paste of 12 Nov in `docs/superpowers/plans/2026-11-12-inline-block-editing.md`.

**Owner decisions (14 Nov 2026)**

1. **Paste lines to make items** in every block made of repeated items: List, Steps, Segmented list, FAQ list (each line a
   question), Cards (each line a card title), Table (each line a row; tabs make cells). The exception decided on 12 Nov stays: if
   the pasted text has headings among its lines (`#` lines, or H1 to H6 from a document), the paste is left as it is and no items
   are made.
2. **`Change to`** turns one repeating block into another (List, Steps, Segmented list, FAQ list, Cards, Table), from the block's
   menu and from the command palette. Each item's title and text move over. What the new block cannot show (an icon, an image, a
   link, extra columns) stays in the saved block, so changing back brings it back. Undo works.

The block's `⋮` menu is part of the editor's own workspace, so Material 3 does not bind it (CLAUDE.md, *Material 3 everywhere except
the editor*); nothing here touches the site's look or a screen outside the workspace.

## 1. Today in code

**Paste.** Only Steps makes items from a paste.

- `linesFromPaste(text, html)` in `src/inlineRows.mjs`: the trimmed, non-empty lines of the plain text, or `null` (paste left as it
  is) when there are fewer than two, or when a line starts with `#`–`######` and a space, or the HTML has an `h1`–`h6`. A list
  marker at the start of a line (`-`, `*`, `•`, `1.`, `1)`) is dropped. Tested in `src/inlineRows.test.mjs`.
- `InlineItems` (`src/InlineItems.tsx`) has a `paste` prop. With it, a paste into the **first typed field** of a block **with no
  item that has content** is caught: the lines replace the items, one item per line in the first field (`{ [first]: line }`), and the
  cursor goes to the last field of the last item.
- Only `InlineSteps.tsx` passes `paste`. `InlineList`, `InlineSegmented`, `InlineFaq` and `InlineCards` use `InlineItems` without
  it. `InlineTable.tsx` is a grid of its own (`src/inlineGrid.mjs`) and has no paste handling: a paste goes into one cell, where the
  view later shows line breaks as spaces (`oneLine`).

**Change to.** Nothing exists. `FORMER` in `lib/blocks.mjs` maps an old block type to a new one when a page is read (Points and
Links to List, Expandable list to Segmented list): a one-way migration, not an owner action, and not reversible.

**The block menu.** A block typed in place has its own menu in the text bar's `⋮` (`menuItems()` in `src/MarkdownEditor.tsx`, about
line 1485, sent to `blockBar` as `menu`): Block settings, the list's page for a block that reads one, Hide on the page or Show,
Move up, Move down, Select, Remove. The action row above the active block (`src/blockRow.ts`, #625) draws four kinds only (`up`,
`down`, `visibility`, `settings`); this spec adds nothing to it. A menu row is a `CardRow` (`src/blockBar.ts`): icon, label, action,
danger, disabled. It has no submenu yet; the editor's `Menu` (`ui.tsx`, over the theme's `Menu.tsx`) supports `submenu` and a bottom
sheet on a phone (`2026-11-13-command-palette-and-context-menus-design.md`, table of parts).

**How a block is saved.** One `siteBlock` node with `attrs.type` and `attrs.props`, written as `<div data-block="<type>"
data-props="<json>">` (`blockHtml`). Every change to a block is a `setNodeMarkup` on that node, one ProseMirror step, so undo
already covers it.

**The six blocks' saved shapes.**

| Block (type) | List key | Item | Typed in place | Other item keys | Block keys |
| :--- | :--- | :--- | :--- | :--- | :--- |
| List (`list`) | `items` | object | `title`, `text` | `icon`, `iconColor`, `href` | `from` and its settings (`tags`, `howMany`, `map`) |
| Segmented list (`segmented`) | `items` | object | `title`, `text` | `icon`, `iconColor`, `href`, `buttons` (`{ label, href }[]`, sheet allows 1) | head (`eyebrow`, `heading`, `intro`), `from` …, `only`, `show`, `maxRows`, `button`, `buttonHref` |
| Steps (`steps`) | `items` | object | `title`, `text` | none | head |
| FAQ list (`faq`) | `items` | object | `question`, `answer` (Markdown) | none | head, `from` …, `only`, `button`, `buttonHref` |
| Cards (`cards`) | `items` | object | `title`, `subhead`, `text` | `icon`, `iconColor`, `image`, `alt`, `video`, `href`, `buttons` (button list) | head, `design`, `color`, `phone`, `media` |
| Table (`table`) | `rows` | `string[]` | every cell | none | `header` (on unless `false`), `striped`, `columns` (`[{ align }]`) |

Every block also has `hidden`. A view reads only the keys it knows: a key it does not know is never drawn (List's view spreads the
row, but the theme draws only its own fields).

## 2. Paste to make items

### Where a paste makes items

A paste makes items when **all** of these hold:

1. It goes into the **first typed field of an empty item** (an item with no content, `isEmptyRow`). That is the faded item of an
   empty block, as today, and also an empty item in a block that has others (one just made by Enter or `Add below`; owner,
   decision 1).
2. The block types its items (`from` is not set: a block that reads a list has no typed items).
3. `linesFromPaste` gives at least two lines (Table: or one line with at least two cells, see below).
4. No heading among the lines (the 12 Nov exception, unchanged).

Otherwise the paste is the browser's own, into the field.

The empty item is replaced by the lines' items, in place, and the items after it stay after them. The cursor goes to the last
field of the last new item, so typing goes on where the paste ended. One paste is one undo step (section 6).

### Each block

| Block | First field | One line makes | A tab in the line (decision 2) |
| :--- | :--- | :--- | :--- |
| List | `title` | a row with that heading | before it the heading, after it the text |
| Steps | `title` | a step with that heading | before it the heading, after it the text |
| Segmented list | `title` | a row with that heading | before it the heading, after it the text |
| FAQ list | `question` | a question; the answer is empty | before it the question, after it the answer |
| Cards | `title` | a card with that headline | before it the headline, after it the text |
| Table | cell of column 1 | a row; tabs make its cells | always cells |

Cards start with three faded empty cards (the first active): the paste goes into the first, and the other two are gone with the
faded items once the block has items. None of the six has a `max` today; if one gets one, the lines past it are left out and the
snackbar says how many were not added (decision 6).

### The Table

- A line is a row; a tab splits the line into cells. Each cell is trimmed and kept on one line (`oneLine`). The rows are made
  rectangular (`rectangle()` in `src/standard/table/rows.mjs`): a short row gets empty cells.
- A paste is caught when the Table is empty (every cell empty, which includes a new Table's one empty cell or its two empty rows)
  and the cursor is in any cell. A paste into a Table with content is the browser's own, into the one cell (decision 3: not in 0.18).
- The Table's `header` setting is not changed: it is on by default, so the first pasted line is the header row, as a copy from a
  spreadsheet expects (decision 4). `columns` (alignment) starts empty: every column is automatic.
- A document's table (Google Docs, Word) puts an HTML `<table>` on the clipboard and often one cell per line in the plain text. When
  the HTML has a `<table>`, its `tr` and `td`/`th` give the rows and cells (text only, no formatting); otherwise the plain text with
  tabs (Excel, Google Sheets, Numbers) does.
- One line with at least two cells already makes a row (a one-row copy from a spreadsheet). One line with no tab is the browser's
  paste, as in every block.
- The heading exception applies here too.

### The parser

Both parsers are plain functions, no browser, in `src/inlineRows.mjs` next to `linesFromPaste` (or a new `src/pasteItems.mjs` if it
grows), tested with `node --test`:

- `linesFromPaste(text, html)` stays as it is.
- `itemsFromPaste(text, html, fields)`: `linesFromPaste`, then each line to `{ [fields[0]]: before tab, [fields[1]]: after tab }`
  (the text left out when empty; decision 2).
- `gridFromPaste(text, html)`: `string[][]` or `null`. From the HTML `<table>` when there is one (a small tolerant reader of
  `tr`/`td`/`th`, entities decoded, tags inside cells dropped), else the plain lines split on tabs. `null` when there is a heading,
  or fewer than two lines and fewer than two cells.

## 3. Change to

### What it does

`Change to` sets the block's `type` to the new block and its props to the changed props, in one `setNodeMarkup` (one undo step).
The block stays where it is, stays active, and the cursor goes to the first field of the item that had it (or the first item).

**The rule for every change, A to B:**

1. **Items.** Each item of A becomes one item of B, in the same order. A's title moves to B's title, A's text to B's text (the
   mapping below). What A's item had beyond that **stays on the item, under its own key**, so B draws it when B knows the key (an
   icon from List into Segmented list) and keeps it unseen when B does not (an icon into Steps).
2. **Block props.** Every prop of A stays in B's props (`hidden`, the head, `only`, `design`, `header` …). B uses those it knows
   with the same meaning (`only`, `button`, `buttonHref` between FAQ list and Segmented list; the head between the blocks that have
   one) and ignores the rest. B's own props that A did not have get B's defaults, by being absent.
3. **Nothing is lost on the way back.** Changing B back to A gives A's items with every key they had; when the title and text were
   not edited in B, A's props are equal to what they were, plus B's own props that B added (they stay unseen).
4. **A block saved before never changes by itself.** A block that is not changed is read and saved exactly as before: no new key,
   no migration, nothing in `FORMER`. The kept keys only appear when an owner uses `Change to`.

### Title and text of each block

| Block | Title | Text | Drawn by it as well (when the item has it) | Kept, not drawn |
| :--- | :--- | :--- | :--- | :--- |
| List | `title` | `text` | `icon`, `iconColor`, `href` | everything else |
| Segmented list | `title` | `text` | `icon`, `iconColor`, `href`, `buttons` | everything else |
| Steps | `title` | `text` | none | everything else |
| FAQ list | `question` | `answer` | none | everything else |
| Cards | `title` | `text` | `subhead`, `icon` + `iconColor` (media Icon), `image` + `alt` (media Image), `video` (media Video), `href`, `buttons` | everything else |
| Table | cell 1 | cell 2 | cells 3 and on (as columns) | see below |

A card's text is optional (decision 10), so cards made from Steps without texts, or from a one-column Table, are valid cards and
the sheet does not call them wrong.

So a Cards → List change shows the cards' icons and links in the List, keeps `subhead`, `image`, `alt`, `video` and `buttons` on
the rows unseen, and List → Cards brings them all back.

**Where the key names differ** (FAQ list's `question`/`answer`, the Table's cells), the change renames: the item gets B's key and
loses A's. Where a value has to be changed to fit, the original is kept:

- **FAQ list's answer is Markdown;** List, Steps, Segmented list and Cards have plain text. FAQ → other: `text` is the answer as
  plain text (bold, italic and links dropped, a list's items one per line), and the item keeps `answer` (the Markdown) unseen.
  Other → FAQ: when the item still has an `answer` and its plain text equals `text`, that `answer` is used (formatting back);
  otherwise `answer` is `text`.
- **A Table cell is one line.** A text with line breaks becomes one line in the cell (`oneLine`). Back from the Table, the kept
  item's text is used when the cell still equals it on one line.

**A row with no title of its own.** A List or Segmented list row with a page and no heading shows the page's title. The title that
moves is the one shown, so the row does not become an empty step (decision 5). The row keeps its `href`, so back in the List it
still links.

### The Table, both ways

The Table's rows are arrays, not objects, so they cannot carry another block's keys. Instead the change keeps the other block's
whole list, and matches on the way back:

- **Other → Table.** `rows` is one row per item: `[title, text]` (one column when no item has a text). The block keeps its `items`
  as they were (the Table does not know `items`, so it is unseen). `header` is `false` (decision 11), because the first item is not a header,
  unless the block kept a header row from an earlier Table (below): then `header` is `true` and that row is the first row again.
  Extra columns kept from an earlier Table come back by the same match as below.
- **Table → other.** Each body row (all rows but the first when `header` is on) becomes one item: cell 1 is the title, cell 2 the
  text. The block keeps `rows`, `header`, `striped` and `columns` as they were (unseen in the other block), which holds the header
  row and the cells from column 3 on. If the block kept `items` from before it was a Table, each new item is matched with a kept
  item, and gets that item's other keys (icon, link, image …):
  - first the kept item with the same title, in order (a moved row still finds its icon);
  - a row whose title was edited, or a new row, gets no kept keys;
  - a kept item that matches no row is dropped (its row was removed in the Table).
- **Other → Table again.** The header row and the cells from column 3 on come back from the kept `rows` by the same match: the kept
  row whose first cell equals the item's title.

A Table → List → Table where nothing was edited gives the same `rows`, `header`, `striped` and `columns` as before.

### Which blocks are offered

From each of the six, the other five, with two limits:

1. **A block that reads its rows from a list** (`from` set: List, Segmented list or FAQ list with *Rows from*) is offered only List,
   Segmented list and FAQ list, the blocks that can read a list. `from`, `tags`, `howMany` and `map` move over as they are (`map`
   names the same row parts in all three). Steps, Cards and Table are not offered: they have no rows of their own to show.
2. **The page's template** (`collections.ts` rules): a target the template does not allow on this page is not offered, and a block
   the template locks offers no `Change to` at all.

All other pairs make sense, because every one of the six is a list of things with a title and, mostly, a text. If no target is left,
the menu has no `Change to` row.

### The menu item

- **Place:** in the block's `⋮` menu, right after `Block settings` (and the list's own page, when there is one), before `Hide on the
  page`. Not in the action row above the block (`blockRow.ts` keeps its four buttons).
- **Text:** `Change to`, a row with a submenu (the menu's trailing arrow says there is more, so no ellipsis; decision 7). Its
  icon: Material Symbols `swap_horiz` (drawn by name through `Icon`, CLAUDE.md *Icons*).
- **Submenu:** the targets in a fixed order, List, Segmented list, Steps, FAQ list, Cards, Table, each with its block's icon and its
  block name (`t.blocks.<type>.label`, so the names are those of *Insert*). The current block is not in it.
- **After the change:** a snackbar `Changed to <block>` with `Undo` (decision 8).

| Key | en-US | da-DK |
| :--- | :--- | :--- |
| `t.text.changeTo` | Change to | Skift til |
| `t.text.changedTo(name)` | Changed to {name} | Skiftet til {name} |
| `t.actions` label of `block.change-to-<type>` | Change to {name} | Skift til {name} |

The block names already exist: List / Liste, Segmented list / Segmenteret liste, Steps / Trin, FAQ list / FAQ-liste, Cards / Kort,
Table / Tabel. Undo in the snackbar uses the editor's existing word.

Word choice (CLAUDE.md, M3 *Word choice*): an active verb and the thing, no filler; `Change to` reads as the start of the sentence the
submenu finishes ("Change to Table").

### The command palette

The palette's spec is being updated in another session; this spec only names the actions. One action per target, registered by
`MarkdownEditor.tsx` while a block of the six is active, with the same limits as the menu:

`block.change-to-list`, `block.change-to-segmented`, `block.change-to-steps`, `block.change-to-faq`, `block.change-to-cards`,
`block.change-to-table`.

Label `Change to <block>` (`Skift til <blok>`), group *Block*, so typing "table" or "change" finds it. No default shortcut.

## 4. Touch and keyboard

- **Phone:** the `⋮` menu is a bottom sheet; `Change to` opens its submenu as the sheet's next level with a back row (the editor
  `Menu`'s submenu on a phone). Rows have the editor's touch size (44 dp, `blockRow.ts`'s `SIZE`). A paste from the phone's
  long-press *Paste* is the same `paste` event and works the same.
- **Keyboard:** in the `⋮` menu, arrows move to `Change to`, Right arrow or Enter opens the submenu, Left arrow or Escape closes it,
  Enter chooses; type-ahead letters work in both levels (the palette spec adds them to the editor's `moveInMenu`). Focus goes back to
  the block's field after the change. `Ctrl/⌘+Z` undoes the change, `Ctrl/⌘+Shift+Z` redoes it.
- **Screen readers:** the submenu row has `aria-haspopup="menu"` and `aria-expanded`; the snackbar is announced (the editor's
  snackbar is a live region).

## 5. The saved data, in one example

A List with two rows, one with an icon and a page:

```json
{ "items": [{ "icon": "clock", "title": "Opening hours", "text": "Mon–Fri", "href": "/contact" }, { "title": "Parking" }] }
```

Change to **Steps**: type `steps`, the props unchanged (`icon` and `href` stay on the first item, Steps does not draw them).

Change that to **FAQ list**: type `faq`,

```json
{ "items": [{ "icon": "clock", "question": "Opening hours", "answer": "Mon–Fri", "href": "/contact" }, { "question": "Parking" }] }
```

Change that to **Table**: type `table`, `header: false`, `rows: [["Opening hours", "Mon–Fri"], ["Parking", ""]]`, and `items` kept as
in the FAQ list. Back to **List**: the rows matched with the kept items by title: the first list above, plus `rows` and `header`
kept unseen.

**Kept data is never on the site.** It is in the page's Markdown (the block's `data-props`), which only the editor and the build
read. The site's HTML has only what the block draws. A check proves it (section 8).

## 6. Undo

- `Change to` is one `setNodeMarkup` with the new `type` and `props`, in one transaction with `closeHistory` before it, so it is
  its own undo step even right after typing.
- A paste that makes items is one `onChange` (one transaction), also its own undo step.
- Undo after `Change to` gives the old type and props and the same active item; redo gives the change again.

## 7. Release notes

Two paragraphs, both `feature`, ids by the changesets of PR 2 and PR 5 of the build plan. Later PRs of the same feature edit these
notes instead of adding new ones (*several changes to the same feature are one note*).

**Paste a list** / **Indsæt en liste**

- en-US: A list copied from a document no longer lands as one long line. Paste it into an empty List, Steps, Segmented list, FAQ
  list, Cards or Table, and each line becomes an item; tabs split a table’s cells. A paste with headings stays as it is.
- da-DK: En liste kopieret fra et dokument lander ikke længere som én lang linje. Indsæt den i en tom Liste, Trin, Segmenteret
  liste, FAQ-liste, Kort eller Tabel, så bliver hver linje et punkt, og tabulatorer deler en tabels celler. Tekst med overskrifter
  indsættes, som den er.

**Change to** / **Skift til**

- en-US: A block no longer has to be built again to get another look. Open the block’s ⋮ menu, choose Change to and pick another
  list block. Titles and texts move over, and icons, images and links are kept for when you change back.
- da-DK: En blok skal ikke længere bygges forfra for at få et andet udseende. Åbn blokkens ⋮-menu, vælg Skift til, og vælg en anden
  listeblok. Titler og tekster flytter med, og ikoner, billeder og links gemmes, til du skifter tilbage.

PR 2 ships the List, Steps, Segmented list, FAQ list and Cards part; PR 3 adds "or Table" and the tab sentence to the note.

## 8. Checks

**Unit tests (`node --test`), in `npm test`:**

- `src/inlineRows.test.mjs` (or `src/pasteItems.test.mjs`): `itemsFromPaste` for each block's first field; tabs; list markers;
  `\r\n`; blank lines; a heading by `#` and by `<h2>` in the HTML gives `null`; one line gives `null`. `gridFromPaste`: Excel/Sheets
  TSV, a ragged paste made rectangular, a Google Docs and a Word `<table>` HTML (samples saved as fixtures), entities, a one-line
  two-cell row, a heading.
- `lib/changeTo.test.mjs` (`changeTo(fromType, toType, props, titleOf)` is a plain function in `lib/changeTo.mjs`):
  - every ordered pair of the six: title and text move;
  - every pair A → B → A with nothing edited: A's items deep-equal the original; for the Table, `rows`, `header`, `striped` and
    `columns` equal;
  - kept keys: Cards → List → Cards keeps `subhead`, `image`, `alt`, `video`, `buttons`;
  - FAQ Markdown: plain text in the other block, the Markdown back when unedited, the edited text when edited;
  - Table matching: a moved row keeps its icon, an edited title loses it, a removed row drops its kept item, header row and column 3
    come back;
  - `targets(type, props, rules)`: five targets; three with `from`; none for a locked block; template limits;
  - a page-title row moves the shown title.

**`check:screens`, at 375 px and 1280 px** (new units in `scripts/editor-screens.mjs`):

- `inlinePaste`: for each of the six, a `paste` event with a `DataTransfer` of three lines (and a TSV grid for Table) into the
  empty block: the item count, the first field's texts, the cursor in the last item; a paste with a `#` line leaves one item with
  the text; `Ctrl+Z` gives the empty block back.
- `changeTo`: the `⋮` menu has `Change to` after `Block settings` with the five targets (three for a List with *Rows from*); List with
  an icon → Steps → List shows the icon again; List → Table → List the same; undo after a change gives the List back; the snackbar text;
  the submenu as the sheet's next level on the phone.
- The site's HTML of a page with a changed block has none of the kept texts (a block changed in the demo test page, checked in
  `check:screens:extra` or `check:demo`).

**Also:** `npm run check` (with `check:language` for the new `da-DK` texts, `check:phosphor`, `check:release-notes`), `check:editor`
(every page the same after a save, so an unchanged block stays byte for byte the same), and `check:demo`.

## 9. Build plan

Small pull requests into `0.18`, each mergeable on its own, each with its changeset (skill `changesets`) and a green `check`.

1. **The pure functions** (`empty` changeset). `itemsFromPaste`, `gridFromPaste` and `lib/changeTo.mjs` (`changeTo`, `targets`) with
   their unit tests. Nothing calls them yet.
2. **Paste in List, Segmented list, FAQ list and Cards** (`minor`). `paste` on in their `Inline*.tsx`; `InlineItems` uses
   `itemsFromPaste` (a tab splits title and text, decision 2) and also catches a paste into an empty item of a non-empty block
   (decision 1), which Steps gets too; the paste is its own undo step. `check:screens` unit `inlinePaste` for the five. Release
   note *Paste a list* without the Table.
3. **Paste in the Table** (`minor`). `InlineTable.tsx` catches a paste into an empty Table with `gridFromPaste`. The `inlinePaste`
   unit gets the Table. Edits the note of PR 2 (Table, tabs).
4. **A card's text is optional** (`patch`, decision 10). `required` off the Cards `text` field (`src/standard/cards/index.tsx`); a
   card with no text draws no empty text area on the site or in place (check `theme/blocks/cards/View.tsx` and `InlineCards.tsx`);
   `check:content` and `check:demo` accept a card without text. A `check:screens` unit (a card with only a headline at 375
   and 1280). Release note: a `line`, `improvement`: en-US *A card’s text is optional*, da-DK *Et korts tekst er valgfri*. Before
   PR 5, so cards made by Change to are valid.
5. **Change to between List, Segmented list, Steps, FAQ list and Cards** (`minor`). `CardRow` gets `submenu`; `menuItems()` adds the
   row; the change is one `setNodeMarkup` with `closeHistory`; the snackbar with Undo; `t.text.changeTo`, `changedTo` in both
   languages. `check:screens` unit `changeTo`, and the kept-text check of the site's HTML. Release note *Change to*.
6. **Change to and from the Table** (`minor`). The Table in the targets and the matching; the `changeTo` unit gets List → Table →
   List. The note of PR 5 already says "another list block"; no note change.
7. **The palette actions** (`patch`, no note of its own: it is the same feature). The six `block.change-to-*` actions, after the
   palette's action registry (`src/actions.ts`) has landed in `0.18`; until then this PR waits.

PR 2 and PR 4 can be built side by side after PR 1; PR 3 after PR 2; PR 5 after PR 1 and PR 4; PR 6 after PR 5; PR 7 after PR 5
and the palette's registry.

## 10. Owner decisions (14 Nov 2026)

The owner approved every recommendation of the first draft (relayed by the 0.18 PM):

1. **A paste into an empty item of a block that has items** (after Enter or `Add below`) makes items too, not only a paste into an
   empty block.
2. **A tab in a pasted line splits title and text** in List, Steps, Segmented list, FAQ list and Cards, as it splits a Table's cells.
3. **A paste into a Table that has content** is the browser's own paste into the one cell: not in 0.18. A spreadsheet-like paste
   that fills cells from the cursor is a later plan.
4. **A pasted Table keeps its `header` setting** (on by default), so the first pasted line is the header row.
5. **A row whose title comes from its page** (List, Segmented list): the shown title moves over and the link is kept.
6. **Lines past a block's maximum** are left out, and a snackbar says how many.
7. **The menu text is `Change to`** with a submenu arrow, no ellipsis; Danish `Skift til`.
8. **A snackbar after the change**: `Changed to Steps` with `Undo`.
9. **Kept data stays**; no clean-up action.
10. **A card's text becomes optional** (its own pull request, build plan step 4).
11. **A table made by `Change to` has no header row** (`header: false`).
