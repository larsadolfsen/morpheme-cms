# Table: what Material Design 2's data table has that we lack (design proposal)

Status: decided by the owner, 2026-11-13 (see Decisions). No code. Answers "Do we have all types of fields in the table from MD2?"
Builds on the Table block (`src/standard/table/`, `theme/blocks/table/View.tsx`, `src/InlineTable.tsx`) and on the work of
other sessions now in flight: per-column `align` and `striped` (sessions `session_01GGzusPnVbTRrjmu8Tb6Vc4` and
`session_01GGzusM9KdxEvGk7Tumi3nQ`) and the rows/columns contextual menu (`session_01GGzusPeojcdkPiX9ycSzuK`).

## Short answer

No. Our Table has text cells only. MD2 describes more, and eight column types and five table features fit a website table.
Selection checkboxes, row actions and inline inputs do not: a published page has nothing to select or act on. A shared
`DataTable` part in `theme/ui/` comes first, with no visible change, and the Table block builds on it.

## Material 3 and Material 2

Material 3 has no data table component. The M2 page itself says "Material 2 is no longer maintained". We already use MD2 for the
table's dimensions (`theme/styles/blocks.css`, `.block-table-grid`: row 52 dp, header row 56 dp, 16 dp side padding, 1 dp outline,
no elevation, hover state) and M3 for everything else (type scales, surface container for the header, outline variant, small
shape, state layer). This proposal keeps that split: MD2 says what a table does, the M3 tokens say how it looks.

## What MD2 defines

Read on 2026-11-13 from m2.material.io/components/data-tables (Usage, Anatomy, Behavior, Specs) and its Web page
(m2.material.io/components/data-tables/web), rendered with Chromium. The design page does not name every cell type; where it is
silent, this says so.

- **Anatomy** (Anatomy): header row, rows, pagination, row checkbox, sort button, container.
- **Content** (Usage): a table "can contain" interactive components (chips, buttons, menus) and non-interactive elements
  (badges), and tools to query and manipulate data. Principles: organized, interactive, intuitive. The page has no list of cell
  types; icons "that communicate alerts" and inline menus (a menu in a cell) are named under Anatomy and Behavior.
- **Header** (Anatomy, Behavior): names describe the column; medium weight; truncated with an ellipsis, a tooltip shows the full
  name on hover.
- **Sorting** (Anatomy; Web, "column sorting"): a sort arrow beside the header name; a click on the name or arrow reverses the
  direction and the arrow; the web component sets `aria-sort`; a linear progress bar while sorting runs.
- **Selection** (Anatomy; Web): a checkbox per row and a header checkbox for all; a selected row gets a background colour (so
  screen magnification users see it).
- **Toolbar** (Anatomy): "pagination or filter chips" go directly above or below the table. No search field is specified.
- **Footer / pagination** (Behavior): rows per page (a menu), the range and total ("25 rows per page … total of 100"), previous
  and next arrows (the web version also has first and last).
- **Row actions**: not specified on the design page; only inline menus in a cell.
- **Density / size** (Specs): row 52 dp, header 56 dp, 16 dp padding, 32 dp or more between columns; cell padding "minimized to
  improve content density": 6 dp top and bottom, 8 dp left (a second, tighter spec). No named density levels.
- **Alignment** (Specs, "Numeric alignment"): numbers right-aligned, the header name aligned with them. Text left (the default).
- **Sticky header** (Web only): `mdc-data-table--sticky-header` keeps the header on vertical scroll.
- **Hover** (Behavior): a row shows a background on hover; a header may show the sort arrow on hover.
- **Container**: 4 dp corners, 1 dp outline, 0 dp elevation, expands to fit content. The spec has no horizontal-scroll rule;
  our scroll box is our own.

## What we have, and the gap

| MD2 feature | Our Table today | Gap | Fits a site? |
| :--- | :--- | :--- | :--- |
| Header row | `header` toggle, `th scope=col` | none | yes (have) |
| Text cells | one line of text | none | yes (have) |
| Dimensions, hover, outline | as MD2 (see above) | none | yes (have) |
| Numeric alignment | in flight: per-column `align` | no automatic right-align for numbers | yes |
| Striped rows | in flight (not MD2) | none | yes |
| Rows/columns menu | in flight | none | yes |
| Numeric / date cells | plain text | not known as numbers, so no right-align, no right sort | yes |
| Link, icon, image, tag (chip), yes-no mark | plain text only | missing | yes |
| Sort arrow, sort on click | none | missing | yes, small script |
| Sticky header | none | missing | yes |
| Density | one size | missing | yes |
| Pagination | none | missing | yes, a setting, off by default |
| Header truncation and tooltip | wraps | not needed: a page can wrap | no |
| Row checkbox, header checkbox | none | missing | no: app feature, a page has no selection to act on |
| Row actions, inline menus, inputs | none | missing | no: needs a backend, not page content |
| Search field above the table | none | missing | yes (MD2 names filter chips only; the owner wants a search) |
| Filter chips | none | missing | no: a search covers it |
| Progress bar while sorting | none | missing | no: sorting is instant on a page |

## Recommendation

The Table block stays static page content: saved as block
props, drawn by the theme with M3 tokens, typed in place with the contextual menu, and working without JavaScript.

### Data model

Cells stay strings (`rows: string[][]`), so an old table is unchanged and the Markdown/props stay readable. A new optional
`columns` array holds one entry per column: `{ kind, align? }`. A missing `columns`, a missing entry or an unknown
`kind` is `text`. `rectangle()` in `rows.mjs` keeps `columns` as wide as the rows, like it does the rows. Each kind gives its
cell string a meaning:

| `kind` | Cell holds | Automatic align | Drawn as |
| :--- | :--- | :--- | :--- |
| `text` (default) | text | start | text |
| `number` | a number as typed (`1,299`, `12 %`, `149 kr`) | end | text, tabular figures |
| `date` | a date (ISO `2026-11-13`) | start | date in the site's language |
| `link` | `[text](address)` | start | the theme's link |
| `icon` | an icon name from the site's icon set | centre | icon with a label for screen readers |
| `image` | an image from the library, as other blocks store one | start | thumbnail, 40 × 40 dp (MD2 icon size) |
| `tag` | a short word | start | an assist chip, non-interactive |
| `yesno` | `yes`, `no` or empty | centre | check or dash, with a text label for screen readers |

Money and percent are typed text in a `number` column: they align right like numbers, and there is no `currency` kind.
Alignment is automatic by kind, with an override per column (`align`): the override wins. All workers share this one `columns`
array (`{ align, kind }`; #506 stores `columns[i].align`). `striped` stays a block setting, and so do the new `sortable`,
`stickyHeader`, `density`, `paginate` and `search`.

### Features, cost and order

Cost: small is under a day, medium a few days, large a week or more. All of it ships in 0.17.0, each as its own PR.

| # | PR | Cost | Storage and old tables | Release note |
| :--- | :--- | :--- | :--- | :--- |
| 0 | Shared `DataTable` in `theme/ui/` (M3 names, tokens only, shown on the parts page): the Table block's markup and CSS (`.block-table-grid`) move into it | medium | none | none (empty changeset): nothing visible changes |
| 1 | `columns` with `kind` `text` and `number`; automatic right-align for numbers; the typed-in-place cell for each kind; `columns` kept by the grid functions when rows and columns are added, moved or deleted | medium | adds optional `columns`; no `columns` is all text, so nothing migrates | line |
| 2 | Sticky header, with a `max height` setting (a table only sticks when it has a height to scroll in) | small | adds `stickyHeader` (boolean, default off) | line |
| 3 | Density: `Comfortable` (52 dp rows, the default) and `Compact` (MD2's 6 dp / 8 dp padding) | small | adds `density`; absent is `comfortable` | line |
| 4 | Sorting: one switch in the Table's settings for the whole table, off by default. A small progressive script makes each header a button with an M3 arrow and `aria-sort`; sorts by kind (numbers numerically, dates by date); without the script the table is in saved order | medium | adds `sortable` (table prop, default off) | paragraph: a visitor sees it, and it is an edge over a static page |
| 5 | Kinds `link`, `date`, `tag`, `yesno` | medium | none beyond `kind`; cell strings as the kinds table | line (one for all four) |
| 6 | Kinds `icon` and `image` | medium | none beyond `kind`; images are stored as other blocks store them, so the image pipeline and `check:content` apply | paragraph: it changes how the table looks |
| 7 | Pagination: a Table setting (switch, off by default); 25 rows per page on small screens, 50 on large; MD2's range text and previous/next arrows; no rows-per-page menu; all rows show without JavaScript | large | adds `paginate` (boolean, default off) | line |
| 8 | Search: a Table setting (switch, off by default); a field above the table that filters rows by their cell text; progressive: all rows show without JavaScript | medium | adds `search` (boolean, default off) | line |

Order: 0, then 1, then 2 and 3 in any order, then 4, 5, 6, 7, 8 (search comes after sorting and pagination). Each PR has a patch
or `minor` changeset (on `0.17`, minor is allowed, never major) and the release note named; the paragraph rule of CLAUDE.md applies
(what changes how the site looks). Each PR writes its notes in English and Danish, as the `release-notes` skill says.

### Not for the site's Table block

Selection checkboxes (with the header checkbox and the selected-row colour), row actions, inline menus and inputs, filter chips,
the progress bar and header truncation with tooltip. They are app features: a published page has nothing to select or act on.
An app can draw its own table with the same M3 tokens (contract 4).

### The editor

The editor has no tables today, and no editor screen moves to `DataTable`. If the editor ever needs a table, it can use the
shared part (it already draws with the theme's parts, so its look follows the theme). A separate audit is checking that every
other editor surface uses the theme's shared parts, so that themes can style the backend.

## Decisions (owner, 2026-11-13)

1. One `columns` array for all workers, `{ align, kind }`; `striped` stays a block setting.
2. `number` only. Money and percent are typed text in a number column and align right.
3. Sorting is off by default and is one switch in the Table's settings for the whole table (the table prop `sortable`, not per column).
4. Pagination is a Table setting (off by default): 25 rows per page on small screens, 50 on large; no rows-per-page menu; all
   rows without JavaScript.
5. A search field above the table is a Table setting, off by default. It is built after sorting and pagination, progressive, and
   searches the cell text.
6. All eight column types are built (text, number, date, link, icon, image, tag, yes-no), split into PRs in the order above, all in 0.17.0.
7. The shared `DataTable` in `theme/ui/` comes first (PR 0), with no visible change.
8. No editor screen moves to it; the shared part is for the site's Table block now.
9. Each PR writes its Danish and English notes.
