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
the diagram, not from a sentence. The owner first read 5 on compact and then
decided (15 Nov) that compact is **4 columns, as M3**.

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

Yes. **Decided (owner, 15 Nov):** compact is 4 columns as M3, and the technique is **CSS columns, no script**
(`column-count`, with `column-span: all` for a full-width item). A card is **full width or one column**; on a phone two
columns of the 4-column grid are one visible column each, so "one column" is half the width. There is no measured-row
grid and no other span: a span of 1 of the 4 grid columns (about 80 px on a 360 dp phone) is too narrow for a widget and
is not offered.

- The visible column count is the grid's column count divided by two: **2 on compact (4), 4 on medium and expanded (8),
  6 on large and up (12)**, proposed; a site or screen may use fewer. M3's grid does not divide into 3 on 8 columns, so
  the "3 across" the repository uses today (image grid from 600, cards from 840) has no place at 600–1199 and fits only
  large (12) as 3 of 4.
- Two cards across on a phone is on M3's grid. One thing M3 does print is on its feed page: "A feed layout should stack
  vertically, like a list of cards with individual items filling the width of the pane" (compact). So a feed of cards
  (the cards block, blog lists) is full width on a phone; the dashboard widgets (not a feed) may be half width, as the
  owner decided.
- CSS columns fill down each column, then across, so item order reads column by column. The feed page says "The order of
  items is determined by their position"; this follows from the owner's technique and is accepted, not a deviation that
  needs recording unless the owner says so.

**Span model.** Each widget or card has one of two sizes: *full* (`column-span: all`) or *one column*. Anything else
(2 of 3 columns, a 1 + 3 split, a measured row) is out of scope.

## 3. Where the repository lays things out

Technique and values read from the files, 15 Nov 2026 (version 0.17.0 on the `0.18` line). "M3" means 4 / 8 / 12
columns on compact / medium and expanded / large and up. Size: S under a day, M a few days, L a week or more. Risk: High
means it changes how a published site looks. Gaps in blocks use `--card-gap` (0.5rem) today unless noted.

### Editor

| Place | Files | Today | Differs from M3 | Size | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Start screen dashboard | `src/DashboardGrid.tsx:105`, `src/DashboardEdit.tsx:207` | CSS grid, `gap-4`, 1 column below 600, 2 from 600, no step above; no span; inside the 768 px (or 1152 px `panel`) column | Target: CSS columns 2 / 4 / 6, a widget full or one column; today 1 on a phone, no span, no step above 600 | S | None (editor) |
| Media grid | `src/Media.tsx:282`, `theme/styles/ui.css:2575-2595` (`.image-grid`) | CSS multi-column masonry: 2 / 3 from 600 / 4 from 1200, gap 8 px (`--card-gap`) | Technique already matches the decision (CSS columns). Counts are 2 / 3 / 4, target 2 / 4 / 6; gap 8 px, target 16 / 24. The image grid *block* uses the same class | M | Site (image grid block) |
| Page frame and centre column | `src/Screen.tsx:146,233`, `src/editor.css:725-815` | Centred `max-width` 48rem (72rem for `panel`), margins `px-4` then `px-6` from 600, start and end clamped to rail, drawer and side panel by custom properties | Margins are not tokens and not per breakpoint; column is a width, not columns | M | None |
| `FormColumns` and settings pane | `src/ui.tsx:3676-3708`, `src/SettingsSections.tsx:39` | Flex column; from 1200 grid `minmax(0,1fr) 22rem`, gap 2rem; pane variant an absolute strip | 12 columns would be about 8 + 4 | S–M | None |
| Field pairs in forms | `BlockParts.tsx:297,386,408`, `PickerParts.tsx:41`, `ContainmentParts.tsx:51,124`, `ActionParts.tsx:203`, `SelectionParts.tsx:17`, `NavigationParts.tsx:240`, `UpdatesNotice.tsx:129` | Tailwind `grid medium:grid-cols-2` or `expanded:grid-cols-2`, `gap-4` or `gap-6` | Two equal columns at medium is half of 8: compatible. Only the gap token differs | S | None |
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
`--breakpoint-*` tokens and Tailwind's `columns-*` and `grid-cols-*` utilities, which the editor and the theme already use),
and give every new token a fallback (`var(--mo-grid-gutter, 1rem)`, the `--card-gap, 8px` pattern). An older theme then
renders the same as today. Bump to 5 only if a later change makes a theme *define* something new, and then together with
a store release of every theme.

**Sites.** The Sarashjemmesidedata site and customers use the theme. A change to a block's column count or the page
container changes their pages. With M3 as the rule the blocks follow the grid, so a block that moves (for example 3 at 840 to 2
at 840 and 3 at 1200) changes sites. Each such pull request carries a release note (`release-notes` skill). Changes that keep
today's result (tokens behind the current values) need none.

**Proposal (not built): one shared grid in the theme.** Needs the owner's approval before anyone builds it, and it must
be shown in *Developer › Parts › UI components* and used through `src/ui.tsx`.

- Tokens (`theme/styles`, new): `--grid-columns` (4 / 8 / 12 by breakpoint, via the existing `--breakpoint-*`),
  `--mo-grid-margin`, `--mo-grid-gutter`. M3 prints no value for either (section 1). Owner's values (15 Nov): **margin 16 px compact, 24 px from
  medium; gutter 16 px compact, 24 px from medium** (Space 200 and Space 300 on M3's scale). They match today's page
  margin and `--block-gutter` (1rem, 1.5rem from 600). The 8 px `--card-gap` is replaced by the grid gutter wherever a
  place moves onto the grid (owner-approved deviation G1, below).
- One layout part: a container with `column-count` from the token above (2 / 4 / 6), `column-gap: var(--mo-grid-gutter)`,
  children `break-inside: avoid` with the same gap below, and a *full* modifier (`column-span: all`). Editor components
  would use it through `src/ui.tsx`; no screen writes its own columns. It needs no script.
- The media grid and image grid block already use this technique (`.image-grid`, `column-count`). What changes is the
  token behind it (counts 2 / 4 / 6 instead of 2 / 3 / 4, gap 16 / 24 instead of 8). Cards of varying height on columns
  with an even gap is what the spacing page describes (section 1).

## 5. Recommendation and rollout

**Owner decisions (15 Nov, relayed by the PM).** The target is **one theme grid** available everywhere in the editor and
the site, whether or not a place uses it yet: M3's 4 / 8 / 12 columns (compact 4, as M3), made with **CSS columns, no
script**; a widget or card is **full width or one column** (one column is half on a phone); **margin 16 px compact and
24 px from medium, gutter 16 px compact and 24 px from medium**, as tokens (M3 prints none, these are the owner's
numbers); the 72rem page width stays as our own limit. On the dashboard each widget declares full or half with no edit
control. The Library media grid and the dashboard are the first users, being built in pull request #741; this audit does
not repeat that and the steps below start from its tokens, which must not be duplicated.

Small pull requests, in this order:

1. **#741: the grid and its first two users** (Library media grid, dashboard with full / one-column widgets). Points for
   that pull request, from this audit: tokens for column count, margin and gutter with fallbacks; counts 2 / 4 / 6 (3 across
   does not divide M3's 8 at 600–1199); the image grid block shares the media grid's class, so changing the class changes
   sites: split it for the editor first, or treat it as the first block change of step 5.
2. **Link the page container and the editor margins to the tokens** (`Container.astro`, `Screen.tsx`,
   `blocks.css:98`). Same pixel values, two copies removed. No visible change.
3. **12-columns-at-840 places** (footer, blog, CTA): move to M3's 8 columns at 600–1199 and 12 from 1200. Small, medium
   risk.
4. **Cards block and blog lists**: full width on a phone (feed page), CSS columns above, gutter from the token. Release note.
5. **Image grid block, then price cards**: onto the token (counts, gap). Release note each.

### What it takes to bring the other places onto the grid

Once the grid exists, "available everywhere" costs nothing; "used everywhere" is the table below. All of it is replacing a
layout rule with the token and the CSS-columns part, never a new component. **A span other than full width or one column
is out of scope** (owner, 15 Nov): places that need a fixed side column or an uneven split keep their own layout.

| Place | What to do | Size | Site changes? |
| :--- | :--- | :--- | :--- |
| Field pairs (`BlockParts`, `PickerParts`, `ContainmentParts`, `ActionParts`, `SelectionParts`, `NavigationParts`) | Already two equal columns from 600 or 840; take the gap from the token | S | No |
| `FormColumns`, settings pane | Main column + 22rem side column is an uneven split: out of scope, stays; only gaps and margins from tokens | S | No |
| Page frame, centre column | Margins from tokens; width stays | M | No |
| Footer, blog, CTA | Uneven 12-column splits (5 / 4 / 3, 7 / 5, 2 / 6 / 4): out of scope as spans; keep their own grid but switch at M3's breakpoints (8 at 600–1199, 12 from 1200) and take gaps from tokens | S | Yes, reflows |
| Cards block, blog lists | Full width on a phone, CSS columns above, gutter from token | M | Yes, High |
| Image grid block, media grid | Counts 2 / 4 / 6 and gutter from token (already CSS columns) | M | Yes, High |
| Price cards | Count by window instead of block width, or leave (container queries) | M | Yes, High |
| Panels, points, media, checklist | `auto-fit` blocks: leave until a block needs it (changed 18 Nov 2026: cards and lists plan, step 4 moves the panels onto the theme grid with the other cards; see below) | L | Yes, High |
| Post text column, carousels, pickers, lists | Leave (*Would not change*, below; the lists' look changes in step 5 of the cards and lists plan, not their layout) | none | No |

**Superseded by the cards and lists plan (18 Nov 2026, `plans/2026-11-17-cards-and-lists-0-19.md`) for the cards.** Step 4 of the plan moves every card of the site onto the theme grid (G1), without Tailwind, together with `Card`'s M3 props: *Cards*, *Price cards*, *Notice*, *Table*, *Cookie list*, *Links* and the panels, *Image grid* (`ImageTile`), *Testimonials*, related posts (`PostCard.tsx`) and the 404 page. So the rows above that say price cards, panels or the cards block are left or counted by their own width no longer hold for 0.18: they go onto the grid in step 4. In 0.19 the collection (step 6) sets the count of cards beside each other: "2 cards side by side from 600 dp, 3 from 840 dp" (design `2026-11-17-list-to-cards-design.md`, 9.9), which replaces the "3 does not divide 8" objection of section 2 for cards in a collection. The editor's cards keep their content as `children` and change only their look.

**Would not change:** the breakpoints (already M3's); the spacing scale (already M3's); the 72rem page width and the
reading measures (M3 prints none); the generic and cards carousel widths (M3 carousel rules, not the layout grid);
swatch, icon and provider pickers; list rows; the editor's inline block parts (they share the theme's block classes, so
they follow the blocks); anything that would need a `THEME_API` bump before the store has the new theme versions.

**Decisions, with M3 as the rule** (owner, via the PM: "We follow md3."; no deviation unless the owner approves one)

| Earlier question | Decision | Why |
| :--- | :--- | :--- |
| Margin and gutter values | M3 prints none for layout. Owner: margin 16 px compact / 24 px from medium; gutter 16 px compact / 24 px from medium | Owner's answer; on M3's spacing scale |
| Compact columns | 4, as M3 (the owner's 5 is dropped) | Diagram: Compact bracket spans 4 (section 1) |
| Technique | CSS columns, no script; a card is full width or one column; no other span | Owner, 15 Nov |
| 2 cards on a phone | One column of the 4-column grid is half width; a feed of cards stays full width per the feed page | Section 2 |
| Site blocks follow the grid | Yes, one pull request each, with a release note | M3 rule |
| 12 columns from 840 (CTA from 600) | 8 columns at 600–1199, 12 from 1200 | Grids page diagram |
| Gap between cards | 16 px compact, 24 px from medium, the grid gutter: an owner-approved deviation from "8dp max" (Cards specs), entry G1 | Owner, 15 Nov |
| `THEME_API` bump | No bump: fallbacks and already-contracted tokens (section 4) | A bump invalidates every store theme until re-published |
| Masonry or rows | CSS columns (what `.image-grid` already is), even gap | Owner; feed and spacing pages (section 1) |
| 72rem page width | Stays as our own limit (owner) | M3 prints no maximum width (section 1) |

**Open points: none.** The questions asked here are all answered (4 columns, CSS columns, margin and gutter, 72rem, the
cards gutter). The one deviation is recorded below and in `docs/material-deviations.md` (entry G1).

**Deviation, owner-approved (15 Nov 2026): cards use the 16 / 24 gutter.** M3 (Cards specs,
`https://m3.material.io/components/cards/specs`): "Padding between cards: 8dp max". We: cards on the layout grid are
16 px apart on compact and 24 px from medium (the grid gutter), not 8 px. Why: owner decision, "Cards use the 16/24
gutter too", relayed by the PM; one gutter for the whole grid. It replaces `--card-gap` (0.5rem, documented in
`theme/styles/ui.css:2382` as "8px, Material 3's at most"). **Affected when they move onto the grid:** the cards block
(`.block-cards`, `blocks.css:631-634`), the cards carousel grid from 600 (`blocks.css:722-771`), the image grid block and
the media grid (`.image-grid`, `ui.css:2575-2595`, `blocks.css:807-817`), price cards (`blocks.css:1708-1742`), the prices
cards (`.block-price-cards`), panels (`blocks.css:953-965`), related posts (`RelatedPosts.astro:21`) and the editor's own
uses of `--card-gap` (`src/editor.css:903,911,953`). Image grid entry 17 (8 px apart) is replaced for the gap when the
image grid moves.
