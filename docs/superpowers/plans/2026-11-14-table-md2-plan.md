# Table: Material 2's data table features, the build plan (0.19)

Status: implementation plan, no code. For the 0.19 PM (session `session_01GGzusM6Drd3fXeyEx7JXoL`). Written 14 Nov 2026 against `0.19` at
`afb6bc5` (#645 merged).

The design is decided: `docs/superpowers/specs/2026-11-13-table-md2-design.md` (the *table spec*, owner decisions of 13 Nov). This plan
turns it into small pull requests into `0.19` and lines it up with the work landing now:

- *Paste and Change to* (`docs/superpowers/specs/2026-11-14-paste-and-change-to-design.md`, its build plan in section 9, landing in
  `0.18`): paste into a Table, Change to and from a Table, the Table's `header` / `rows` / `columns` shape.
- *Density* (`docs/superpowers/specs/2026-11-13-density-design.md`, built): the table's rows already read `--mo-density`.
- *Dynamic lists* (PR #651, branch `spec/dynamic-lists-framework`, section 9 and build phase 9): a Table filled from a list.
- *Choice group* (PR #641, branch `spec/choice-group`, 0.18): the theme part that replaces `SegmentedButton` for a choice setting.

Nothing here changes a decision of those specs. Where two of them disagree, section 2 says so and which one this plan follows.

## 1. What changed since the table spec

1. **The version.** The table spec says "all in 0.17.0". The work is now 0.19: every PR goes into `0.19` with a `minor`, `patch` or
   empty changeset, never `major` (skill `changesets`).
2. **Density is built, so the table spec's PR 3 is gone.** The density spec (section 3, decided) dropped the `density` block setting
   (`Comfortable` / `Compact`): the Table follows the theme's density. Its PR 4 put the density term on `.block-table-grid` in
   `theme/styles/blocks.css` (row `calc(3.25rem + var(--mo-density) * var(--mo-density-step))`, header `3.5rem + …`), and
   `scripts/check-density.mjs` checks those two selectors. The density spec's open item says: "When a shared `DataTable` is made, it
   takes that term with it." Phase T0 does that. No `density` prop is ever stored.
3. **`columns` exists.** `src/standard/table/rows.mjs` already has `columns` (`[{ align }]`) with `columnsOf`, `alignOf` (automatic:
   right when every body cell is a number), `withAlign`, `columnAddedAt`, `columnRemovedAt`, `columnsCut`, used by
   `src/MarkdownEditor.tsx` `gridActions` (the rows/columns contextual menu: add/delete row and column, align left/centre/right/auto).
   `striped` is a block setting. The `kind` key is added to the same entries.
4. **Change to keeps `columns`.** `lib/changeTo.mjs` (#645, on `0.19`) keeps `rows`, `header`, `striped` and `columns` unseen when a
   Table becomes another block, and gives them back unchanged on the way back. A `kind` (and the dynamic table's `field`, `label`)
   rides along inside `columns` with no change to `changeTo`.

## 2. Reconciled with the other specs

| Topic | Table spec | Other spec | This plan |
| :--- | :--- | :--- | :--- |
| Density | PR 3: a `density` block setting | Density spec section 3: no block setting; rows read `--mo-density` (built) | The density spec. T0 moves the built term into `DataTable`; no PR 3. |
| Density in a dynamic table | — | Dynamic lists 9.4: "Sticky header and density: block settings, unchanged" | Density is not a block setting (density spec). Read 9.4 as "density: the theme's, unchanged". **For the PM:** a one-word fix in #651 (`block settings` → `the theme's` for density). |
| Missing `kind` | "a missing entry or an unknown `kind` is `text`" | Dynamic lists 9.4: "draws an unbuilt kind as `text`"; 9.3: a stored kind the field cannot take is read as the field's default | Same rule: unknown or unbuilt kind is `text`. A dynamic column's default kind comes from its field (9.3), worked out before the rows reach `DataTable`. |
| Automatic align of a `text` column | `text` aligns start | Today's code: a column of numbers aligns right by itself (`alignOf`) | Keep today's behaviour: a column with **no stored kind** keeps the automatic rule (all body cells numbers: end), so no old table moves. A column with `kind: 'text'` stored aligns start. |
| `columns` keys | `{ kind, align? }` | Dynamic lists 9.2: adds `field`, `label`; `typedColumns` beside `columns` | `columnsOf` keeps every key it does not know (it already spreads the entry); a test pins it. `DataTable` takes the header names, kinds and aligns, never `field`. |
| A tag cell with several tags | "a short word" | Dynamic lists 9.3: a `tags` field is "one chip per tag"; as `text`, "names joined by commas" | One rule for both: a `tag` cell is split on commas, one chip per part. A dynamic `tags` field gives `"a, b"`, so `DataTable` takes the rows unchanged. |
| Image cell | "an image from the library, as other blocks store one" | Dynamic lists 9.3: "the stored address"; 9.4: search an image cell "by its alt text" | A cell string can carry both: `![alt](address)` (Markdown's image form, the twin of the `link` kind's `[text](address)`), or a bare address (alt empty). The dynamic table's bare address works unchanged. |
| Choice settings | `Comfortable` / `Compact` | Choice group (#641): `ChoiceGroup` replaces `SegmentedButton` for every choice setting | The only new choice setting is the sticky header's height (T2): a `ChoiceGroup` via a `segments: true` select field. All other new settings are on/off: the theme's `Switch` (`type: 'boolean'`, as `striped`). |
| Column kind picker | "the typed-in-place cell for each kind" (no picker named) | Dynamic lists 9.5: a tap on a dynamic column's header opens the field and kind picker | Typed table: a `Column type` row with a submenu in the rows/columns contextual menu, beside the alignment rows (the editor's own workspace, so M3 does not bind it). It uses the `CardRow` submenu that Change to adds in 0.18 (its step 5). The dynamic table's header picker is #651's, phase 9. |

Change to (#645) moves cell strings as they are. After T5, a `link` cell moved to a List title moves as `[text](address)`. This plan does
not change that (changing it would break #635's round-trip match by the first cell). Decision 3 (section 7) keeps it so in 0.19.

## 3. When each phase can start (0.18 gate)

The 0.18 PM's rule: build the Table block's parts only after the Table steps of the paste and Change to plan have merged into `0.18`
**and reached `0.19`** (0.18 is merged forward). In that plan (section 9), the steps that touch the Table are **3** (paste in the Table,
`InlineTable.tsx`), **5** (Change to between the list blocks: it adds the `CardRow` submenu and the `⋮` row in `MarkdownEditor.tsx`,
which T1 uses) and **6** (Change to and from the Table). The brief names 3 and 5; 6 needs 5 and touches the Table's targets, so this
plan waits for all three (confirmed by the 0.19 PM, 14 Nov).

| Phase | Touches the Table block's own files? | Starts |
| :--- | :--- | :--- |
| T0 `DataTable` part | No: `theme/ui/`, `theme/styles/`, `theme/blocks/table/View.tsx`, `theme/blocks/cookies/View.tsx`, the parts page. `InlineTable.tsx` keeps its class names, which stay on the part. | **Before** the gate |
| T1a column model, pure functions | Only new pure functions (`rows.mjs` additions, new `theme/ui/dataTable*.mjs`), no caller changes | **Before** the gate |
| T1 to T8 | Yes: `src/standard/table/`, `InlineTable.tsx`, `gridActions`, the Table's texts | **After** the gate |

T2 also needs `ChoiceGroup` (choice group PRs 1 and 2 in `0.18`, merged forward). T5's `tag` follows decision 1 (section 7).

## 4. The part: `DataTable`

`theme/ui/DataTable.tsx`, CSS `.data-table` in `theme/styles/ui.css`, part id `DataTable` in `site/themeParts.mjs` (prefix
`data-table`), exported in `src/themeUi.ts`, shown on the theme's parts page. M3 names where M3 has a name; MD2's data table where M3 has
none (table spec, *Material 3 and Material 2*).

```ts
type DataColumn = { kind?: string; align?: 'left' | 'center' | 'right' };  // anything else ignored

DataTable({
  label,                 // the scroll region's name for a screen reader (today's `view.label`)
  head,                  // string[] | null: the header row's cells (null: no header row)
  rows,                  // string[][]: body rows, rectangular, one-line strings (as `rectangle()` gives)
  columns,               // DataColumn[], as wide as the rows
  align,                 // the drawn alignment per column (from `alignOf`), so the editor and the site agree
  striped, stickyHeight, sortable, paginate, search,   // the features, each off by default, added phase by phase
  texts,                 // the site-language texts the features need (siteT), added phase by phase
  className, ...rest
})
```

- **Rows in, unchanged.** `DataTable` only draws strings. It never knows whether rows were typed or come from a list (dynamic lists
  9.4). The block's `view.ts` (typed) and #651's `listColumns` (dynamic) both hand it `head`, `rows`, `columns`.
- **Pure helpers** in `theme/ui/dataTableCells.mjs`, tested with `node --test`: `kindOf(entry)` (unknown is `text`), `cellOf(kind, text)`
  (the parsed cell: a number's sort value, a date, a link's text and address, an image's alt and address, the tags), `sortKey`,
  `searchText(kind, text, iconLabel)`, `pageOf(count, size, n)`. The script and the server use the same functions.
- **Classes kept.** The root keeps `block-table block-table-grid` beside `data-table`, so stores' themes that style `.block-table-grid`
  look the same, and `InlineTable.tsx` and the screens checks that use those classes keep working. The CSS moves under `.data-table`
  with the old selectors as aliases until a `THEME_API` raise (not in this plan).
- **Behaviour on the site** in `theme/ui/dataTable.script.ts` (`site/blockScripts.ts` already runs `ui/*.script.ts`): one script for
  sorting, pagination and search, so they work together (filter, then sort, then page). Without JavaScript every row shows in saved
  order (decisions 3, 4, 5).
- **In the editor.** The Table is typed in place in saved order with every row; no sort buttons, pages or search field in the typed
  view. Preview shows the site. No editor screen moves to `DataTable` (decision 8).

## 5. The phases

Every PR: base `0.19`, one changeset, `npm run check` green, plus the checks below and the `check` job green; link and head sha to the PM;
the PM merges. A visible PR adds before/after screenshots to its own PR as the `pm` skill says; a change nobody sees needs none. Every
visible decision outside the editor's workspace loads the skill `material-3`, reads the real pages and quotes them in the PR. Release
notes follow the skill `release-notes` (English and Danish, a mark each); the drafts below are English only, the PR writes both.

Checks named per phase: `check:screens` units run at **375 and 1280 px** (`scripts/editor-screens.mjs`); `check:contrast` is run by hand
after `npm run build` for every phase that adds a coloured mark (on each section colour, light and dark, site and in place);
`node ../../../bin/morpheme.mjs check:themes` for every phase that changes the theme.

### T0. The shared `DataTable` part (before the gate)

- **Files:** new `theme/ui/DataTable.tsx`, `.data-table` in `theme/styles/ui.css` (moved from the `.block-table-grid` rules of
  `theme/styles/blocks.css`, with the density term, hover, stripe and focus ring), `theme/blocks/table/View.tsx` and
  `theme/blocks/cookies/View.tsx` draw through it, `site/themeParts.mjs`, `src/themeUi.ts`, the parts page entry,
  `scripts/check-density.mjs` (its two table rows point at the new selectors).
- **Tests:** unit: `site/themeParts.test.mjs` with the new part. `check:density` (the term moved, still read). `check:screens`: the
  existing table units (alignment, density sizes, `inlineBlocks` on every section colour) unchanged, plus a `dataTable` unit on the parts
  page (375, 1280: no overflow, the region scrolls sideways, computed row heights at each density step equal today's). `check:themes`.
  No contrast run: no colour changes.
- **Changeset:** empty (decision 7: nothing visible changes). The parts page gains an entry: screenshots of that page only.
- **Release note:** none.

### T1a. The column model, pure functions (before the gate)

- **Files:** `src/standard/table/rows.mjs`: `columnsOf` keeps `kind` and unknown keys (`field`, `label`), `withKind(columns, width, c,
  kind)`, `alignOf` by kind (number: end; icon, yesno: centre; no stored kind: today's automatic rule). `theme/ui/dataTableCells.mjs` (section 4)
  for `text` and `number` (other kinds return `text` until their phase).
- **Tests:** unit: `rows.test.mjs` (old `columns` read the same; `kind` survives add, move, delete and cut of columns; a `field` and a
  `label` survive; an unknown kind is `text`), `theme/ui/dataTableCells.test.mjs` (number parsing as `isNumber` accepts it: `1,299`, `12 %`,
  `149 kr`, `−3`; sort keys). No caller uses the new functions yet.
- **Changeset:** empty. **Release note:** none.

### T1. Kinds `text` and `number` (after the gate)

- **What:** a column can be `Text` or `Number`. Number: end-aligned, tabular figures, numeric sort key (used from T4). Typed in place as
  today (a textarea); the kind is picked in the rows/columns menu: `Column type` › `Automatic`, `Text`, `Number` (Automatic removes
  `kind`, as `Automatic` removes `align`). Later phases add their kinds to the same submenu.
- **Files:** `src/standard/table/view.ts` (`TableView` gets `columns`), `theme/blocks/table/View.tsx`, `theme/ui/DataTable.tsx`,
  `src/InlineTable.tsx` (draws with `DataTable`'s classes, the number column's figures), `src/MarkdownEditor.tsx` `gridActions` (the
  submenu, `withKind`), `src/blocks.ts` (grid texts), `src/i18n` en-US and da-DK (`Column type`, `Automatic`, `Text`, `Number`), the
  contextual menu icons (Material Symbols by name).
- **Tests:** unit: `rows.test.mjs` (`withKind`). `check:screens`: unit `tableKinds` (a number column ends right with tabular figures on the
  site and in place; the menu's submenu on a phone as the sheet's next level; undo of a kind change) at 375 and 1280; the existing
  `inlineBlocks` colour run covers the Table. `check:editor-colors`, `check:language`. Contrast: none (no new colour).
- **Changeset:** `minor`. **Release note:** `line`, `feature`. Draft: *A table column can be set to Number, so its figures line up on the
  right*.

### T2. Sticky header (after the gate; needs `ChoiceGroup`)

- **What:** a `Sticky header` switch (`stickyHeader`, off). A header only sticks inside a box with a height, so when it is on, a `Height`
  choice (`stickyHeight`: `small`, `medium`, `large`, default `medium`) caps the table's box and its rows scroll under the header
  (`position: sticky` on `thead th`, MD2's web `mdc-data-table--sticky-header`). The choice is a `segments: true` select, drawn by
  `ChoiceGroup`. Off when `header` is off (the field is hidden, as other dependent fields are). Not in the typed view (it shows every row).
- **Files:** `src/standard/table/index.tsx` (fields), `view.ts`, `theme/ui/DataTable.tsx`, `theme/styles/ui.css`, i18n en/da.
- **Tests:** unit: `view.ts` defaults (absent is off; a stored height without the switch does nothing). `check:screens`: unit
  `tableSticky` on the demo test page: scroll the box, the header stays at its top, nothing overflows the page sideways, 375 and 1280;
  the settings sheet with the switch and the choice group (en-US and da-DK). Contrast: the header over scrolled rows keeps its tint on
  every section colour.
- **Changeset:** `minor`. **Release note:** `line`, `feature`. Draft: *A long table can keep its header row in view while you scroll*.
- The three heights are decision 2 (section 7).

### T4. Sorting (after T1)

- **What:** a `Sorting` switch (`sortable`, off; decision 3). On the site `dataTable.script.ts` turns each header cell's text into a
  button with an M3 arrow icon (Material Symbols `arrow_upward` / `arrow_downward`, by name), sets `aria-sort`, and sorts by kind
  (numbers numerically, dates by date from T5, text by the site language's collation); a click reverses the direction (MD2, *column
  sorting*). Without JavaScript, the saved order. Hidden when `header` is off. No progress bar (table spec: sorting is instant).
- **Files:** `src/standard/table/index.tsx`, `view.ts`, `theme/ui/DataTable.tsx` (`data-sortable`, the cells' `data-sort` keys from
  `dataTableCells.mjs`), `theme/ui/dataTable.script.ts` (new), `theme/styles/ui.css`, i18n en/da (the button's label, *Sort by {column}*).
- **Tests:** unit: `dataTableCells.test.mjs` (sort keys and order for each built kind; stable for equal keys; empty cells last). `check:screens`:
  unit `tableSort` (click a number column twice: order and `aria-sort` both ways; keyboard Enter on the header button; with scripts
  off the saved order), 375 and 1280. Contrast: the arrow icon on every section colour.
- **Changeset:** `minor`. **Release note:** `paragraph`, `feature`, title *Table sorting* (the table spec: a visitor sees it, and it is an
  edge over a static page). Draft: *Visitors can find what they need in a long table without scrolling through it. Turn on Sorting in the
  Table's settings, and each column header becomes a button that sorts the rows. Numbers sort as numbers, and the saved order stays the
  same.*

### T5. Kinds `link`, `date`, `tag`, `yesno` (after T1)

- **Cells:** `link` `[text](address)`, drawn as the theme's link, with a 48 dp hit area on touch (density spec 2.3, its open item);
  `date` ISO `YYYY-MM-DD`, drawn with `formatDate` (`site/format.ts`) in the site's language, a cell that is not a date drawn as typed;
  `tag` split on commas, one chip each (decision 1, section 7); `yesno` `yes`, `no` or empty, drawn as `check` / `remove` icons with a
  visually hidden *Yes* / *No* in the site's language.
- **Typed in place** (the editor's workspace): `link` typed as its text, the address set with the bar's Link (the Table already has the
  `link` text); `date` typed as ISO with the placeholder `YYYY-MM-DD`; `tag` typed with commas; `yesno` a tap cycles Yes, No, empty.
- **Files:** `theme/ui/dataTableCells.mjs` (`cellOf`, sort and search for the four), `theme/ui/DataTable.tsx`, `theme/styles/ui.css`,
  `src/InlineTable.tsx`, `gridActions` (four more kinds in the submenu), i18n en/da.
- **Tests:** unit: parsing each kind (a broken link or date drawn as text), sort by date, comma tags. `check:screens`: unit `tableKinds`
  grows (each kind on the site and in place; the link's hit area at 375 with `pointer: coarse`), 375 and 1280; `inlineBlocks` colour
  run. Contrast: the link, chips and icons on every section colour.
- **Changeset:** `minor`. **Release note:** one `line`, `feature`. Draft: *A table column can hold links, dates, tags or a yes-no mark*.

### T6. Kinds `icon` and `image` (after T5)

- **Cells:** `icon` an icon name of the site's icon set, drawn through the shared `Icon` (`src/icon.tsx`, Material Symbols unless the site
  picked another pack), centred, its name as the screen-reader label; `image` `![alt](address)` or a bare address (section 2), a
  40 × 40 dp thumbnail (MD2 icon size) through the image pipeline as other blocks' images, so `check:content` applies.
- **Typed in place:** a tap opens the editor's icon picker or the image library; the image's alt typed in the picker, as Cards does.
- **Files:** `theme/ui/dataTableCells.mjs`, `theme/ui/DataTable.tsx`, `theme/styles/ui.css`, `src/InlineTable.tsx`, `gridActions`, the
  content check for image paths in a Table cell, i18n en/da.
- **Tests:** unit: `![alt](address)` and a bare address; an unknown icon name drawn as text. `check:screens`: `tableKinds` grows (both
  kinds, the picker opens from a cell), 375 and 1280; `check:phosphor` (no direct import). `check:content` with an image in a cell.
  Contrast: icons on every section colour.
- **Changeset:** `minor`. **Release note:** `paragraph`, `feature`, title *Icons and images in tables*. Draft: *A table can show more than
  words. Set a column's type to Icon or Image in the column menu and pick one for each cell. Icons follow the site's icon set, and images
  come from your library.*

### T7. Pagination (after T4)

- **What:** a `Pages` switch (`paginate`, off; decision 4). The script shows 25 rows per page below the `expanded` breakpoint and 50 from it
  (`atLeast()` of `lib/breakpoints.mjs`), and under the table MD2's range text (*1–25 of 100*) with previous and next icon buttons. No
  rows-per-page menu, no first and last. Without JavaScript every row shows and there is no footer. The range is a live region.
- **Files:** `index.tsx`, `view.ts`, `DataTable.tsx` (footer slot), `dataTable.script.ts`, `dataTableCells.mjs` (`pageOf`), `ui.css`, i18n en/da.
- **Tests:** unit: `pageOf` (last partial page, 0 rows, a change of breakpoint keeps the first visible row). `check:screens`: unit
  `tablePages` (60 rows: 25 at 375, 50 at 1280, next and previous, the range text, scripts off shows all), 375 and 1280. Contrast: the
  footer's text and icon buttons on every section colour.
- **Changeset:** `minor`. **Release note:** `line`, `feature`. Draft: *A long table can show its rows a page at a time*.

### T8. Search (after T4 and T7)

- **What:** a `Search` switch (`search`, off; decision 5). Above the table, the theme's search bar look (`Search`, `.search`) used as a field
  that filters the rows in place; then sort, then pages run on what is left. It matches the drawn text: an icon by its label, an image by
  its alt, a tag by its names (dynamic lists 9.4). An empty result shows one line, *No rows match*. Without JavaScript the field is not
  drawn and every row shows.
- **Material 3:** the search page says "Search bar: Use to search contents in a specific view" and "Add a search bar below a title to
  search specific content" (read 14 Nov 2026, `/components/search/guidelines`). M3's bar opens a results view; filtering the rows below is
  the nearest M3 pattern, so `Search` gets a mode with no view (its field is the bar). The PR quotes the page and, if the owner wants it
  recorded, adds a deviation entry.
- **Files:** `theme/ui/Search.tsx` (the mode), `DataTable.tsx`, `dataTable.script.ts`, `dataTableCells.mjs` (`searchText`), `ui.css`, i18n en/da.
- **Tests:** unit: `searchText` per kind; case and accent folding in the site language. `check:screens`: unit `tableSearch` (type, rows
  narrow, pages reset, the empty line, clear), 375 and 1280. Contrast: the bar on every section colour.
- **Changeset:** `minor`. **Release note:** `line`, `feature`. Draft: *A table can have a search field that narrows its rows*.

### Order

T0 and T1a now. After the gate: T1, then T2, T4 and T5 side by side (T2 and T4 change the table as a whole, T5 its cells), T6 after T5,
T7 after T4, T8 after T4 and T7. Dynamic lists' phase 9 needs T0, T1, T5 and T6 (its own rule); its sorting, pages and search work the
day T4, T7 and T8 land, because `DataTable` takes its rows unchanged.

## 6. Proof that old tables and other work stay as they are

- An old Table (no `columns`, or `columns` with only `align`) draws the same at every phase: `check:editor` (each page the same after a
  save) and the existing screens units.
- Change to: #645's `lib/changeTo.test.mjs` round trip Table → List → Table gets a case with `kind`, `field` and `label` in `columns`
  (T1a), so the dynamic table's keys are known to survive.
- Paste: a pasted Table starts with no `columns` (0.18 step 3), so its columns are automatic, as today.
- The Cookie list draws through `DataTable` from T0 and gets none of the features.

## 7. Decisions

Decided by the 0.19 PM on the owner's behalf, 14 Nov 2026 (the owner was away and asked the PM to decide); the owner may revise them.

1. **The `tag` cell is drawn in the assist chip's look, not interactive.** M3's chips page says "Chips appear as a group of interactive
   elements", and assist chips "represent smart or automated actions … start with a verb" (`/components/chips/guidelines`, read 14 Nov
   2026). A tag in a table cell does nothing when tapped, so this is a deviation. T5 records it in `docs/material-deviations.md` in its own
   PR, quoting the M3 page as read then.
2. **The sticky header's heights** are `Small`, `Medium` and `Large`: 40 %, 60 % and 80 % of the screen's height, default `Medium`.
3. **Change to and a link column.** A `link` cell moves to a List's title as `[text](address)`, unchanged in 0.19, so the round trip stays
   exact. After T5, a follow-up may move the address into the item's `href`; that is decided then.
