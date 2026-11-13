# Table: what Material Design 2's data table has that we lack (design proposal)

Status: proposal for the owner, 2026-11-13. No code. Answers "Do we have all types of fields in the table from MD2?"
Builds on the Table block (`src/standard/table/`, `theme/blocks/table/View.tsx`, `src/InlineTable.tsx`) and on the work of
other sessions now in flight: per-column `align` and `striped` (sessions `session_01GGzusPnVbTRrjmu8Tb6Vc4` and
`session_01GGzusM9KdxEvGk7Tumi3nQ`) and the rows/columns contextual menu (`session_01GGzusPeojcdkPiX9ycSzuK`).

## Short answer

No. Our Table has text cells only. MD2 describes more, but most of it is for apps, not for page content. Seven additions fit a
website table; selection checkboxes, row actions and inline inputs do not.

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
| Pagination | none | missing | only for long tables |
| Header truncation and tooltip | wraps | not needed: a page can wrap | no |
| Row checkbox, header checkbox | none | missing | no: app feature, a page has no selection to act on |
| Row actions, inline menus, inputs | none | missing | no: needs a backend, not page content |
| Filter chips, search field | none | missing | no, for now (see question 5) |
| Progress bar while sorting | none | missing | no: sorting is instant on a page |

## Recommendation

Build what a visitor reads and scans; leave what an app user operates. The table stays static page content: saved as block
props, drawn by the theme with M3 tokens, typed in place with the contextual menu, and working without JavaScript.

### Data model

Cells stay strings (`rows: string[][]`), so an old table is unchanged and the Markdown/props stay readable. A new optional
`columns` array holds one entry per column: `{ kind, align?, sortable? }`. A missing `columns`, a missing entry or an unknown
`kind` is `text`. `rectangle()` in `rows.mjs` keeps `columns` as wide as the rows, like it does the rows. Each kind gives its
cell string a meaning:

| `kind` | Cell holds | Automatic align | Drawn as |
| :--- | :--- | :--- | :--- |
| `text` (default) | text | start | text |
| `number` | a number as typed (`1,299`, `12 %`) | end | text, tabular figures |
| `date` | a date (ISO `2026-11-13`) | start | date in the site's language |
| `link` | `[text](address)` | start | the theme's link |
| `icon` | an icon name from the site's icon set | centre | icon with a label for screen readers |
| `image` | an image from the library, as other blocks store one | start | thumbnail, 40 × 40 dp (MD2 icon size) |
| `tag` | a short word | start | an assist chip, non-interactive |
| `yesno` | `yes`, `no` or empty | centre | check or dash, with a text label for screen readers |

Alignment is automatic by kind, with an override per column (`align`, as the in-flight work stores it): the override wins. The
in-flight `align` and `striped` stay as they are; `kind` is the next key beside `align` on the same `columns` entry, so the
workers should agree on that shape (question 1).

### Features, cost and order

Cost: small is under a day, medium a few days, large a week or more.

| # | PR | Cost | Storage and old tables | Release note |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `columns` with `kind` `text` and `number`; automatic right-align for numbers; the typed-in-place cell for each kind; `columns` kept by the grid functions when rows and columns are added, moved or deleted | medium | adds optional `columns`; no `columns` is all text, so nothing migrates | line |
| 2 | Sticky header, with `max height` setting off by default (a table only sticks when it has a height to scroll in) | small | adds `stickyHeader` (boolean, default off) | line |
| 3 | Density: `Comfortable` (52 dp rows, the default) and `Compact` (MD2's 6 dp / 8 dp padding) | small | adds `density`; absent is `comfortable` | line |
| 4 | Sort on the site: a small progressive script; the header becomes a button with M3 arrow icon and `aria-sort`; sorting by kind (numbers numerically, dates by date); the table is valid and in saved order without the script | medium | adds `sortable` per column (default off) | paragraph: it is something a visitor sees and an edge over a static page |
| 5 | Kinds `link`, `date`, `tag`, `yesno` | medium | none beyond `kind`; cell strings as the table above | line (one line for all four) |
| 6 | Kinds `icon` and `image` | medium | none beyond `kind`; images are stored as other blocks store them, so the image pipeline and `check:content` apply | paragraph: it changes how the table looks |
| 7 | Pagination, only when rows exceed a limit (proposal: 25), with MD2's range text and previous/next, no rows-per-page menu | large | adds `pageSize` (default off); progressive: all rows without the script, so search engines see them | line |

Order: 1, then 2 and 3 in any order, then 4, 5, 6, 7. Each is its own PR with a patch or minor changeset (on `0.17`, minor
is allowed) and the release note named; the paragraph rule of CLAUDE.md applies (what changes how the
site looks).

### Not recommended

Selection checkboxes (with the header checkbox and the selected-row colour), row actions, inline menus and inputs, the
progress bar and header truncation with tooltip. A published page has nothing to select or act on, and each needs a backend or
an app. An app can draw its own table with the same M3 tokens (contract 4); the block stays content.

## Open questions for the owner

1. **One `columns` shape for all workers?** The in-flight `align` and `striped` and this `kind` should share one `columns`
   array (`{ align, kind, sortable }`) instead of parallel keys. Recommendation: yes; `striped` stays a block setting.
2. **Is `number` enough, or also `currency` and `percent`?** Recommendation: `number` only; the cell keeps the typed text, so
   `1,299 kr` and `12 %` already work and sort by their leading number.
3. **Sorting: default on or off?** Recommendation: off per column; the owner turns it on for the columns that need it, and a
   table with a few rows should not look interactive.
4. **Pagination limit?** Recommendation: 25 rows, only when the owner turns it on; no rows-per-page menu.
5. **A search/filter field above the table?** MD2 mentions filter chips, not a search field. Recommendation: not now; sorting
   and pagination first, and only if sites ask.
6. **Kinds in one release or spread?** Recommendation: spread as in the order above, so the first release already fixes
   numbers, the common complaint.
7. **Danish release notes:** each paragraph or line written in both languages per the `release-notes` skill when its PR is
   built; this spec adds no note itself.
