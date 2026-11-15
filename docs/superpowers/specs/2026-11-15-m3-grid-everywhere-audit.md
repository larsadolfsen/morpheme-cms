# M3 grid everywhere: audit (0.18)

Status: audit only, 15 Nov 2026. No code, styles, tests or content changed. Every theme component named under
*Proposal* is a proposal: the owner must approve it before anyone builds it (`developer` skill, *no own components*).

Owner question: "We need to adapt to the md3 grid everywhere. How bad is it?" Earlier words: "On md3 mobile always have 2
cola, the question is do we have a span of 2. Some widgets may have a span of 1."

**Short answer: medium.** The breakpoints are already M3's and the spacing scale is already M3's. What is missing is the
grid itself: nothing in the repository counts columns as 4 / 8 / 12, and there is no span, margin or gutter token. Each
place picks its own column count (1, 2, 3, 4 or 12) by its own rule. The editor is small work; the site's blocks are the
large part, and they change how existing sites look.

## 1. What M3 prints

Read with Playwright on 15 Nov 2026 (text, then page screenshots for the images).

**Breakpoints** (`https://m3.material.io/foundations/layout/breakpoints`). "There are five main breakpoints: compact,
medium, expanded, large, and extra-large"; "(previously window size class)". Table: Compact "Under 600dp"; Medium
"600–839dp"; Expanded "840–1199dp"; Large "1200–1599dp"; Extra-large "1600dp+". The repository already has exactly
these (`theme/styles/base.css:287-293`, `lib/breakpoints.mjs`).

**Grid** (`https://m3.material.io/foundations/layout/grids-spacing/grids`). Text: "Layouts in Material are based on a
grid that adapts across all breakpoints"; "Grids adapt across breakpoints. As the size increases, column count, width, and
spacing change as well."; "When moving between sizes, column count may increase to show more content or controls."; "On
compact screens, fewer columns are used to create a focused layout". **The page never prints a column number in text.**
The numbers come from its diagram only. Re-read on 15 Nov with the image downloaded and its columns counted by pixel scan
(screenshots on the branch `pr-screenshots/743`): the diagram is one row of **12 drawn columns** in three colours (4 grey,
4 violet, 4 pink) under three brackets. The *Compact* bracket spans the first **4** columns (grey), the *Medium/Expanded*
bracket the first **8**, the *Large/Extra-large* bracket all **12**. Column widths differ between the colour groups in the
drawing and carry no dp values. So: **compact 4, medium and expanded 8, large and extra-large 12**, read from
the diagram, not from a sentence. The owner reads 5 columns on compact; the diagram shows 4 (open point 1).

**Feed** (`https://m3.material.io/foundations/layout/canonical-examples/feed`). "Compact: A feed layout should stack
vertically, like a list of cards with individual items filling the width of the pane." Medium: "can be split across
multiple columns". Expanded and up: "The number of columns should usually increase at expanded breakpoints." Note: on a
phone M3's own card feed is **one** card per row, not two.

**Spacing** (`https://m3.material.io/styles/spacing/tokens`, `…/applying-spacing`, `…/grids-spacing/spacing`). "The spacing
system is measured on an 8dp scale, where space100 = 8dp"; tokens Space 0 to Space 900 (0, 2, 4, 6, 8, 10, 12, 14, 16, 20,
24, 32, 36, 40, 48, 56, 64, 72dp). "The spacing system tokens are only used on Jetpack Compose." "Adaptive layout: Map the
spacing to different system tokens for each device type." The repository's `--mo-space-*` already match this list.

**Margins and gutters.** Terms: "Margin: The space between the edge of the screen and any elements inside of it"; "Gap:
The space between components or elements within a container"; "Spacer: The space between two panes on a foldable
device" (`https://m3.material.io/foundations/layout/layout-overview`). Margin rulers "come with some wiggle room … The
standard ruler can be adjusted to the left or right" (grids page). Read for numbers, text and every diagram on the grids,
feed, list-detail, supporting-pane, scaffold and adaptive-design pages: **M3 prints no margin number and no gutter number
per breakpoint, in text or in any image.** The diagrams show margin rulers and columns with no dimensions. The only
numbers M3 prints near this are in the *Cards* specs (`https://m3.material.io/components/cards/specs`): "Left/right
padding 16dp" (inside a card) and "Padding between cards 8dp max". That 8dp is for cards in a card list; the layout grid's own
gutter is not printed (see the owner's decision in section 5). Lists guidance says "Adjust margins to create a more comfortable line length for reading"
(`https://m3.material.io/components/lists/guidelines`), which is the only margin rule: margins grow so text keeps a
readable measure.

**Maximum width.** M3 prints no maximum content width and no layout width for large or extra-large. It says layouts
change column count (12 on large and up), and that margins adapt for line length. A page container with a maximum width
is therefore our own rule where M3 is silent.

**Masonry.** The word does not appear on any layout page read. The feed page says a feed "can organize content of
different sizes, like using small and large cards", that items "reflow when the amount of available space changes", and
that "The order of items is determined by their position". The spacing page says "Cards should maintain consistent
horizontal spacing to establish a strong rhythm when their height varies". So: cards of different heights on grid
columns with an even gap are M3; a column-first masonry flow is not described.

**Spans.** M3 prints no "span" concept for web. A pane or card simply occupies columns.

**Not read:** the Figma kit and Compose rulers (external). The M3 spacing tokens page says its tokens are Compose-only;
M3 has no web token for grid, margin or gutter to copy.

Pages read: `/foundations/layout/{layout-overview, scaffold, breakpoints, canonical-examples, canonical-examples/feed,
grids-spacing/overview, grids-spacing/grids, grids-spacing/spacing, grids-spacing/density}`,
`/foundations/layout/canonical-examples/{list-detail, supporting-pane}`, `/foundations/layout/understanding-layout/{overview,
parts-of-layout, spacing, adaptive-design}`, `/styles/spacing/{overview, tokens, applying-spacing}`,
`/components/{cards/specs, cards/guidelines, carousel/guidelines, lists/guidelines}`, `/foundations/design-tokens` (all
under `https://m3.material.io`). Two URLs
(`understanding-layout/breakpoints`, `…/window-size-classes`) only redirect to the overview.

## 2. Is "2 columns with spans of 1 or 2 on a phone" compatible?

Yes, if the span counts **cells of two grid columns**, not grid columns. Compact has 4 columns: a "2 column" phone layout
is a 4-column grid in which a normal card spans 2 (half the width) and a wide card spans 4 (full width). A span of
**1 grid column** is a quarter of the width, about 80 px on a 360 dp phone: too small for a widget. So the owner's "span
of 1" is a half-width cell (2 grid columns) and "span of 2" a full-width cell (4 grid columns).

Two things to know:

- **Two cards across on a phone is span 2 of 4: it is on M3's grid.** One thing M3 does print is on its feed page:
  "A feed layout should stack vertically, like a list of cards with individual items filling the width of the pane"
  (compact). So for a *feed of cards* (the cards block, blog lists) M3's recommendation is span 4 of 4. For the
  dashboard widgets, which are not a feed, half width (span 2 of 4) follows the grid with nothing in M3 against it. The
  owner's call: whether the dashboard counts as a feed (open point 1).
- Cell width does not carry up evenly. With a cell of 2 columns, medium and expanded (8) give 4 cells per row, large (12)
  gives 6. Three across does not divide 8, so the "3 columns from 600" the repository uses today for the image grid, and
  "3 from 840" for cards, have no place on M3's 8-column grid; 3 fits only 12 (large, spans of 4).

**Span model (proposal).** A widget or card declares its span once, in cells (`1` = narrow, `2` = wide, optionally `3`),
and the grid maps cells to grid columns per breakpoint: 2 columns per cell on compact and medium and expanded (4 / 8
columns), 2 per cell on large (12 columns, so up to 6 across). A cell wider than the row clamps to a full row (a span-2
widget on a phone is full width; a span-1 widget is half). Items reflow in order, as the feed page asks ("The order of
items is determined by their position").

## 3. Where the repository lays things out

Technique and values read from the files, 15 Nov 2026 (version 0.17.0 on the `0.18` line). "M3" means 4 / 8 / 12
columns on compact / medium and expanded / large and up. Size: S under a day, M a few days, L a week or more. Risk: High
means it changes how a published site looks. Gaps in blocks use `--card-gap` (0.5rem) today unless noted.

### Editor

| Place | Files | Today | Differs from M3 | Size | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Start screen dashboard | `src/DashboardGrid.tsx:105`, `src/DashboardEdit.tsx:207` | CSS grid, `gap-4`, 1 column below 600, 2 from 600, no step above; no span; inside the 768 px (or 1152 px `panel`) column | No span, 1 column on a phone, no 8 or 12 step | S | None (editor) |
| Media grid | `src/Media.tsx:282`, `theme/styles/ui.css:2575-2595` (`.image-grid`) | CSS multi-column masonry: 2 / 3 from 600 / 4 from 1200, gap 8 px (`--card-gap`) | Counts are 2 / 3 / 4, not 2 / 4 or 4 / 6 cells of M3; masonry, not grid cells. The image grid *block* uses the same class | M | Site (image grid block) |
| Page frame and centre column | `src/Screen.tsx:146,233`, `src/editor.css:725-815` | Centred `max-width` 48rem (72rem for `panel`), margins `px-4` then `px-6` from 600, start and end clamped to rail, drawer and side panel by custom properties | Margins are not tokens and not per breakpoint; column is a width, not columns | M | None |
| `FormColumns` and settings pane | `src/ui.tsx:3676-3708`, `src/SettingsSections.tsx:39` | Flex column; from 1200 grid `minmax(0,1fr) 22rem`, gap 2rem; pane variant an absolute strip | 12 columns would be about 8 + 4 | S–M | None |
| Field pairs in forms | `BlockParts.tsx:297,386,408`, `PickerParts.tsx:41`, `ContainmentParts.tsx:51,124`, `ActionParts.tsx:203`, `SelectionParts.tsx:17`, `NavigationParts.tsx:240`, `UpdatesNotice.tsx:129` | Tailwind `grid medium:grid-cols-2` or `expanded:grid-cols-2`, `gap-4` or `gap-6` | 2 equal columns at medium is a span of 4 of 8: compatible. Only the gap token differs | S | None |
| Small grids | `src/MediaProviderPicker.tsx:133`, `src/ui.tsx:776,1264,1835,2430`, `src/Parts.tsx:418,763` | `grid-cols-2..6` or `auto-fill minmax(3rem..9rem)`, `gap-1.5..3` | Swatch, icon and picker grids, not layout; M3 has no rule | none | none (leave) |
| Library and settings lists | `src/Library.tsx`, `src/Advanced.tsx`, `src/CmsPage.tsx` | `ListItem` rows; `columns` prop puts headline and supporting text side by side from 840 (`ui.css:2682`) | Lists, not grids; no change needed | none | none |

### Site and theme

| Place | Files | Today | Differs from M3 | Size | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Page container | `theme/components/Container.astro:9`, `theme/styles/blocks.css:98-107,192-199` | `mx-auto max-w-6xl px-4 medium:px-6` (72rem; 16 then 24 px); the same values exist unlinked as `--block-page-width`, `--block-gutter` (1rem, 1.5rem from 600) | Margin is correct in spirit but hard-coded twice; no per-breakpoint token; the 72rem max width is ours (M3 prints none) | S | Low if values stay |
| Post text column | `theme/layouts/PostLayout.astro:44`, `PostHeader.astro:22`, `PageLayout.astro:94` | `max-w-3xl` (48rem), `66ch` measure | Reading measure, M3 prints none; keep | none | none |
| Page with side column | `theme/styles/components.css:236-275` | Grid `minmax(0,1fr) 20rem`, gap 3rem from 600 | a 20rem side column is a fixed width, not a span; on M3 it would be about 3 of 8 (600–1199) or 4 of 12 (from 1200) | M | Medium |
| Footer | `theme/components/Footer.astro:25-71` | 12-column Tailwind grid **from 840**, spans 5 / 4 / 3 | M3 has 8 columns at 840–1199; 12 only from 1200 | S | Medium (footer reflows) |
| Blog | `BlogPosts.tsx:25`, `PostList.tsx:36`, `RelatedPosts.astro:21` | 12-column from 840 with 7 + 5; 2 columns from 840; 3 columns from 600 | Same 12-at-840 issue; 3 at 600 does not divide 8 | S | Medium |
| Cards block | `theme/styles/blocks.css:631-634,1613`, `base.css:522` | 1 column below 600, 2 from 600, 3 from 840 in front-page place | 3 at 840 does not divide 8; phone is 1 column (M3 feed: 1 as well) | M | High |
| Cards carousel | `blocks.css:722-771` | Phone: scroller, items 85 %; from 600 a 2-column grid | Carousel items are the M3 carousel's own; the 2-column part is a grid | S | Medium |
| Generic carousel | `theme/styles/ui.css:2249-2370` | Items 86 %, 2 from 600, 3 from 840 | M3 carousel page governs; not the layout grid | none | none (leave) |
| Image grid block | `theme/blocks/imagegrid/View.tsx:89`, `blocks.css:807-817`, `ui.css:2575` | Masonry, option 2 / 3 / 4 columns, auto is 2 / 3 / 3 / 4 | As the media grid; the `columns` option is saved in sites' content | M | High (saved option) |
| Price cards | `blocks.css:1708-1742` | Container queries at 34 / 40 / 56rem, 1 to 4 columns | Counted by the block's own width, not window | M | High |
| Panels, points, media, checklist | `blocks.css:953-1003,1702-1706` | `auto-fit minmax(16–23rem, 1fr)`, gaps 1 to 3rem | Not on any column count; count follows available width | L | High |
| CTA | `blocks.css:1406-1409,1639-1655` | 12 columns **from 600** (image 2, body 6, buttons 4), gap 2.5rem | 600–839 has 8 columns in M3, so the spans 2 + 6 + 4 do not fit | S | Medium |
| Timeline, prices, copy rows, facts | `blocks.css:1083-1150,1439-1450,1030-1057,1220` | Own grids, 1 to 2 columns, gaps 0.75–1.5rem | Content layout inside a block | S each | Low |
| Buttons row, chips, segmented | `blocks.css:379,1609`, `ui.css:4644` | Flex or `grid-auto-flow: column` | Components, not layout grid | none | none |

## 4. How big, and what it needs

**THEME_API: recommend no bump, a fallback.** `lib/contracts.mjs:24` is `THEME_API = 4`, and its comment already lists
the M3 `--breakpoint-*` tokens as part of 4. A bump (to 5) makes every store theme invalid until it is re-published
(`docs/superpowers/plans/2026-11-14-store-auto-updates-plan.md` line 73: the store needs a version of each theme before a
CMS that raises it goes to `latest`). The grid can avoid that: build it from what themes already must have (the
`--breakpoint-*` tokens and Tailwind's `grid-cols-*` / `col-span-*` utilities, which the editor and the theme already use),
and give every new token a fallback (`var(--grid-gutter, 1rem)`, the `--card-gap, 8px` pattern). An older theme then
renders the same as today. Bump to 5 only if a later change makes a theme *define* something new, and then together with
a store release of every theme.

**Sites.** The Sarashjemmesidedata site and customers use the theme. A change to a block's column count or the page
container changes their pages. With M3 as the rule the blocks follow the grid, so a block that moves (for example 3 at 840 to 2
at 840 and 3 at 1200) changes sites. Each such pull request carries a release note (`release-notes` skill). Changes that keep
today's result (tokens behind the current values) need none.

**Proposal (not built): one shared grid in the theme.** Needs the owner's approval before anyone builds it, and it must
be shown in *Developer › Parts › UI components* and used through `src/ui.tsx`.

- Tokens (`theme/styles`, new): `--grid-columns` (4 / 8 / 12 by breakpoint, via the existing `--breakpoint-*`),
  `--grid-margin`, `--grid-gutter`. M3 prints no value for either (section 1). Owner's values (15 Nov): **margin 16 px compact, 24 px from
  medium; gutter 16 px compact, 24 px from medium** (Space 200 and Space 300 on M3's scale). They match today's page
  margin and `--block-gutter` (1rem, 1.5rem from 600). The 8 px `--card-gap` is replaced by the grid gutter wherever a
  place moves onto the grid (see open point 2).
- One layout part: a grid container (`display: grid; grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr))`)
  plus span utilities in cells (section 2), `col-span` equivalents for 4 / 8 / 12 for page-level use. Editor components
  would use it through `src/ui.tsx`; no screen writes its own grid.
- The media grid and image grid block: M3 describes cards of varying height on grid columns with an even gap, not a
  column-first masonry flow (section 1). So the grid part's rows (CSS grid, items aligned to the top, even gap) replace
  `column-count`; counts become spans in cells. Item order then reads along rows, as the feed page says ("determined by
  their position").

## 5. Recommendation and rollout

**Owner input (relayed by the PM, 15 Nov).** On the dashboard each widget declares a span, full or half, with no edit
control. "This is on all editor pages and also on the site, even though we don't use it." So the target is **one theme
grid** (M3's 4 / 8 / 12 columns, tokens, span utilities) that exists everywhere in the editor and the site, whether or not
a place uses it yet. The Library media grid and the dashboard are the first users; that part is being built in pull
request #741 and this audit does not repeat it. Where #741 builds the grid itself, the steps below start from its tokens
and span utilities and must not add a second set.

Small pull requests, in this order:

1. **#741: the grid and its first two users** (Library media grid, dashboard with full / half spans). Open points for
   that pull request, from this audit: spans counted in cells of two grid columns (section 2), so half is 2 of 4 on a
   phone; tokens for columns, margin and gutter with fallbacks; the media grid's 3 columns at 600–1199 do not divide M3's 8
   (they follow the grid's rows instead, section 4); the image grid block shares the media grid's class, so splitting it keeps sites unchanged.
2. **Link the page container and the editor margins to the tokens** (`Container.astro`, `Screen.tsx`,
   `blocks.css:98`). Same pixel values, two copies removed. No visible change.
3. **Editor `FormColumns` and field pairs** on the grid (8 + 4 of 12 from large, spans of 4 of 8 for pairs). Editor only.
4. **12-columns-at-840 places** (footer, blog, CTA): move to 8 at 600–1199 and 12 from 1200 with the same spans in
   cells. Small, medium risk.
5. **Blocks, one pull request each**, in order: cards, image grid, price cards, then panels, points, media and checklist.
   Each is opt-in or comes with a release note, because it changes published sites. `auto-fit` blocks last: they work
   today and nothing in M3 asks for their change.

### What it takes to bring the other places onto the grid

Once the grid exists, "available everywhere" costs nothing; "used everywhere" is the table below. All of it is
replacing a layout rule with the grid container and a span, never a new component.

| Place | What to do | Size | Site changes? |
| :--- | :--- | :--- | :--- |
| Field pairs (`BlockParts`, `PickerParts`, `ContainmentParts`, `ActionParts`, `SelectionParts`, `NavigationParts`) | `grid medium:grid-cols-2` becomes the grid with two spans of 4 of 8 | S | No |
| `FormColumns`, settings pane | main span 8 + side span 4 of 12 from large; the `pane` strip stays | S–M | No |
| Page frame, centre column | margins from tokens; width stays | M | No |
| Footer, blog, CTA | 12-at-840 becomes 8 / 12 by breakpoint; spans in cells | S | Yes, reflows |
| Cards, image grid, price cards | counts become spans in cells; 3 across only on 12 columns | M each | Yes, High |
| Panels, points, media, checklist | `auto-fit` to spans; counts follow the breakpoint | L | Yes, High |
| Post text column, carousels, pickers, lists | leave (*Would not change*, below) | none | No |

**Would not change:** the breakpoints (already M3's); the spacing scale (already M3's); the 72rem page width and the
reading measures (M3 prints none); the generic and cards carousel widths (M3 carousel rules, not the layout grid);
swatch, icon and provider pickers; list rows; the editor's inline block parts (they share the theme's block classes, so
they follow the blocks); anything that would need a `THEME_API` bump before the store has the new theme versions.

**Decisions, with M3 as the rule** (owner, via the PM: "We follow md3."; no deviation unless the owner approves one)

| Earlier question | Decision | Why |
| :--- | :--- | :--- |
| Margin and gutter values | M3 prints none for layout. Owner: margin 16 px compact / 24 px from medium; gutter 16 px compact / 24 px from medium | Owner's answer; on M3's spacing scale |
| 2 cards on a phone | Span 2 of 4: on the grid. Feed of cards: span 4 of 4 per the feed page | Section 2 |
| Site blocks follow the grid | Yes, one pull request each, with a release note | M3 rule |
| 12 columns from 840 (CTA from 600) | 8 columns at 600–1199, 12 from 1200, spans in cells | Grids page diagram |
| `THEME_API` bump | No bump: fallbacks and already-contracted tokens (section 4) | A bump invalidates every store theme until re-published |
| Masonry or rows | Grid rows, items aligned to the top, even gap | Feed and spacing pages (section 1); M3 never prints masonry |
| 72rem page width | Stays as our own limit (owner) | M3 prints no maximum width (section 1) |

**Flagged open points** (the owner's two earlier questions are answered above and removed)

1. **Compact columns: 4 or 5?** The owner says compact has 5 columns and that widgets may use "1 + 4" columns. The M3 grids
   diagram shows 4 on compact (section 1, screenshots on `pr-screenshots/743`). With 4 columns a "1 + 4" row does not
   fit; the same idea fits as 1 + 3 or 2 + 2. This doc keeps **4** until the owner points to a page or image that shows 5.
   The grid part must take the column count from one token, so a change of count is a value, not a rebuild.
2. **Gutter 16 / 24 against the Cards specs.** M3 prints "Padding between cards 8dp max"
   (`https://m3.material.io/components/cards/specs`). A card grid on the layout grid with gutter 16 / 24 is wider than
   that. Either cards keep 8 px between them inside a grid cell area, or the owner approves the wider gap as a
   recorded deviation (`docs/material-deviations.md`). To decide before the card blocks move (step 5).
