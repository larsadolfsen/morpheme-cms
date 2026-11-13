# Site spacing audit against Material 3

Date: 2026-11-13. Audit only: no product code changed. Follows the Material 3 conformance audit (`2026-11-13-material-3-conformance-audit.md`, #520), which measured the editor screens and the theme's parts but not the layout spacing of the site's blocks.

## How it was measured

- **The demo** was built (`npm run build`), served, and opened in headless Chromium at 375, 600, 840 and 1280px (the widths of M3's compact, medium and expanded breakpoints and a large window; `lib/breakpoints.mjs` has the same 0, 600, 840, 1200, 1600). Every value below is `getComputedStyle` or a `getBoundingClientRect` distance between two real neighbours, never CSS reading alone. Blocks measured: Buttons, Cards (outlined, filled, elevated, with media, as a carousel), List (plain, segmented, with links), Points with icon (draws the same `ListItem` rows as List), Checklist, Steps, Table, FAQ/Accordion, Price cards, Testimonials (carousel), Notice, Posts, Banner (Hero), Video, Cookies table. A throwaway demo page was built to measure the Banner, which the demo's real pages do not use; it is not committed.
- **Material 3.** The real pages on `m3.material.io` were opened in headless Chromium and read (collapsed parts expanded): Grids & spacing (overview, grids, spacing, density), Spacing (overview, applying spacing, tokens), Breakpoints (overview, compact, medium, expanded, large and extra-large), and the specs pages of Cards, Lists, Buttons, Button groups, Carousel, Divider, Dialogs and App bars. Numbers on these pages that are drawn only as images could not be read; where that matters it is said.
- **M3 is silent on a lot.** It prints no section padding, no space between a heading and a block, no space between paragraphs and no block margins: its layout pages are about app windows (panes, rails, bars), not marketing pages. Where M3 is silent a row says so and names the nearest M3 pattern (the 8dp scale and "desktop can be more generous than mobile").

## What Material 3 says (quoted)

- Unit: "The spacing system is measured on an 8dp scale, where space100 = 8dp" and "The main spacing units are multiples of 8dp". "Values other than multiples of 8 are also used in layouts and Material components, like 2dp, 4dp, 6dp, and 10dp." The tokens: 0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 36, 40, 48, 56, 64, 72dp (`/m3/pages/spacing/tokens`). So a value that is a multiple of 4 is on the system; 17.5, 27.5, 35.2, 13.2 and 3.5 are not.
- Margins: compact: "Margins are 16dp from the leading and trailing edge of the window" (`/foundations/layout/applying-layout/compact`). Medium: "Medium layouts have margins of 24dp. The spacer between panes is also 24dp." Expanded: "Expanded layouts have a leading and trailing margin of 24dp. The spacer between panes is 24dp." Large and extra-large: "Large and extra-large layouts have a leading and trailing margin of 24dp. The spacer between panes is 24dp." Breakpoints: compact under 600, medium 600 to 839, expanded 840 to 1199, large 1200 to 1599, extra-large 1600 and up.
- Direction: "Desktop layouts can use more generous spacing than mobile layouts" and "Cards should maintain consistent horizontal spacing to establish a strong rhythm when their height varies" (`/foundations/layout/grids-spacing/spacing`). "Similar elements should have the same spacing and sizing in a layout". "Buttons should be close to the content they're affecting."
- Density: "Density shouldn't automatically change across breakpoints or orientation unless a person changes it" and "The default target size should be at least 48x48 CSS pixels" (`/grids-spacing/density`).
- Cards (`/components/cards/specs`, Measurements): "12dp corner radius", "Left/right padding 16dp", "**Padding between cards 8dp max**".
- Carousel (`/components/carousel/specs`): leading/trailing padding 16dp, top/bottom padding 8dp, padding between elements 8dp (multi-browse, hero, uncontained). The full-screen carousel: 0dp padding, 16dp between elements.
- Lists (`/components/lists/specs`, baseline): label left padding 16dp, leading element left padding 16dp, trailing element right padding 24dp (baseline), padding above and below a divider 0dp, divider inset 16dp left. Segmented gap 2dp and Expressive padding/gap 16/12 are in the #520 audit from the same page.
- Button groups (`/components/button-groups/specs`): standard group gap by size XS 18dp, S 12dp, M 8dp, L 8dp, XL 8dp; connected groups 2dp. Buttons: icon and label gap 4 (XS), 8 (S, M), 12 (L), 16 (XL) (#520, row 1).
- Dialogs (`/components/dialogs/specs`): padding 24dp all sides, 8dp between buttons, 16dp between title and body, 24dp between body and actions.
- Dividers (`/components/divider/specs`): inset left margin 16dp, middle inset 16 and 16, 4dp between divider and supporting text.
- App bars (`/components/app-bars/specs`): the spacing tables are drawn as images and print no numbers; M3 gives no readable value for the site's header, so it is listed as silent.

## Results

"Fix" is small (one or a few lines), medium (one file or part) or large (many files). "=" means equal to what Material says or on its scale.

### Page frame (margins and rhythm)

| # | Where (file) | What we have (measured) | What Material says | Difference | Fix |
| - | ------------ | ----------------------- | ------------------ | ---------- | --- |
| 1 | Side margin below 600px: the page's frame (`theme/components/Container.astro`, `px-5`) at 375px | 20px | Compact: 16dp margins | 4 too wide | small |
| 2 | Side margin from 600px up: same file, `medium:px-8` at 600, 840 and 1280px | 32px (the content sits at 96px from the edge at 1280 because it is centred in 72rem) | Medium, expanded, large: 24dp margins | 8 too wide at 600 to 1199. At 1280 the centred column is wider than 24, which M3 allows | small |
| 3 | Gap between blocks and text: block margin (`blocks.css`, `.block-in-text`), measured above and below each block | 32 above and below; Steps, Price cards, Testimonials, Posts 40 | Silent. 8dp scale: 32 and 40 are both on it | = (32, 40) | none |
| 4 | Heading above a block: h2 margin 56 above, 28 below; h3 35.19 above, 13.2 below (`.prose :where(h2, h3)`, `theme/styles/base.css`, em-based) at every width | h2 56/28 are on the 4dp grid; h3 35.19 and 13.2 are not (1.6em and 0.6em of 22px) | Silent on heading space; units "multiples of 4/8" | h3 off the grid by 3.2 and 0.8 | small |
| 5 | Paragraph space: `p` margin 17.5px (1.25em of 14px); the lead paragraph 27.5px (1.25em of 22px), at every width | 17.5 and 27.5 | Silent; units multiples of 4 | off the grid (16 and 28 nearest) | small |
| 6 | Image in text: figure/img margin 28 above and below | 28 | Silent; on the 4dp grid | = | none |
| 7 | Page header: top padding 32 at 375, 56 from 600; the h1 gap 12 above; content block starts 32 below the header at 375, 48 from 600 (`pt-8 medium:pt-14`, `mt-8 medium:mt-12`) | 32/56 and 32/48 | "Desktop layouts can use more generous spacing than mobile layouts" | = (all on the 8dp scale, more generous from medium) | none |
| 8 | Footer: padding 48 top and bottom at 375, 64 from 600; the columns' gap 40 (`Footer.astro`, `gap-10 py-12 medium:py-16`) | 48/64, gap 40 | Spacer between panes 24dp at medium and up | 40 vs 24 where the footer's columns sit side by side | small |
| 9 | Home page sections: `--theme-section-space` 5rem (80) at 375, 8rem (128) from 600 (`components.css`) | 80/128 | Silent; both on the 8dp scale; "more generous" on larger windows | = | none |

### Blocks

| # | Block, where | What we have (measured) | What Material says | Difference | Fix |
| - | ------------ | ----------------------- | ------------------ | ---------- | --- |
| 10 | **Cards**: gap in the grid (`blocks.css` 862, `--card-gap` 0.5rem, `global.css` 192), every design and width: 8 vertical (one column at 375), 8 vertical and horizontal in two columns (600, 840) and at 1280 | 8 | Cards: "Padding between cards 8dp max". Rhythm: "Cards should maintain consistent horizontal spacing" | = on main. Another session is changing the Card gap now (session_01GGzusM2gXx6wxMdYVzg6xj); this audit does not touch it. Its result must stay at 8 or below and equal in both directions | none here |
| 11 | Cards: padding inside (`.block-card`), and icon to title 16, title to text 6 | padding 16 all sides; 16 and 6 | Cards: "Left/right padding 16dp". 6 is a printed nested unit (space75) | = | none |
| 12 | Cards as a carousel (`.block-cards-carousel`): at 375 the strip has padding 8 top and bottom, 16 on the sides, items 8 apart; from 600 it becomes a grid with 8 | 8 / 16 / 8 | Carousel: leading/trailing 16, top/bottom 8, between 8 | = | none |
| 13 | **Testimonials** carousel (`.carousel-items`, `ui.css` 2081, `--carousel-gap` 1rem default; the cards block sets 0.5rem only for itself) at 375: gap between the cards | 16 | Carousel: padding between elements 8dp (the full-screen carousel is 16) | 8 too wide; also not the same as the Cards' 8 ("similar elements should have the same spacing") | small |
| 14 | **Price cards** (`.block-plans-list`): gap 8 vertical (375) and 8 horizontal (840, 1280); inside the card 16 padding, name to price 16, price to text 12, text to features 24 | 8; 16/12/24 | Cards 8 max, 16 padding | = (gap and padding). The 24 and 12 inside are on the grid; M3 is silent | none |
| 15 | **List**, **Points** (the `ListItem` rows: `ui.css` 2371, `--list-item-*` in `global.css`): padding 16, gap icon to text 12, rows touching (gap 0) | 16, 12, 0 | List: 16 leading padding, 12 gap (#520), 0dp above and below a divider | = | none |
| 16 | List, segmented variant: 2px between rows | 2 | Lists, segmented: 2dp (#520) | = | none |
| 17 | **Checklist** (the Price cards' feature list, `.block-plan-features`): row padding 3.5 above and below, no side padding, rows 27 high | 3.5 / 0 | Silent for a compact feature list; nearest: the list's 4dp unit and the 8dp scale. 3.5 is not on it | 0.5 off the grid | small |
| 18 | **FAQ / Accordion**: rows 2 apart; row padding 16 vertical and 24 horizontal; icon gap 16 | 2; 16/24; 16 | Segmented list gap 2dp; list padding 16 (24 on the trailing side) | = | none |
| 19 | **Notice**: padding 16 vertical, 24 horizontal; margin 32 | 16/24 | Silent. Nearest: dialogs pad 24 all round; lists 16 | 16 vertical vs 24 for a dialog-like card; not wrong | none |
| 20 | **Steps**: 40 between steps; line 1px wide | 40 | Silent; on the 8dp scale | = | none |
| 21 | **Buttons** (row of buttons): gap 12 vertical and horizontal, default button 40 high, padding 24 | gap 12 | Button group, standard: S 12dp (the default size is S) | = for the gap. The button's own size and padding are in #520 rows 1 and 2 | none here |
| 22 | Buttons inside a card: gap 12 (the row) | 12 | Same as the row above; cards print no number for their action area | = | none |
| 23 | **Table** (`block-table-grid`): header 56, rows 52, cell padding 16 (Material 2 structure, owner decision in #520) | 56/52/16 | Material 2 data tables: header 56, row 52, padding 16 (#520) | = | none |
| 24 | **Posts** (`PostList.tsx`): rows 20 padding above and below on a rule, thumbnail column 88, gap 16 (375) and 20 (600 and up), two columns with 48 between from 840 | 20, 16/20, 48 | Silent. Cards 8 max and the list's 16/12 are the nearest; 20 and 48 are on the scale | = to the scale; 48 between columns is wide against the 24 spacer M3 prints for panes | small |
| 25 | **Banner (Hero)**: block margin 32; title to subtitle 20; paragraph to paragraph 16; image and text 32 apart (375, 600) and 48 (840, 1280) | 20, 16, 32/48 | Silent. On the scale; "more generous" on larger windows | = | none |
| 26 | **Video** facade: padding 24, play icon to title 8 | 24, 8 | Silent. Nearest: dialog padding 24 | = | none |
| 27 | **Cookies table**: same table values as row 23 | = | = | = | none |
| 28 | **Testimonials** filter chips: chips 8 apart, 24 to the cards | 8, 24 | Chips: 8dp between chips (M3 chip page, not re-read here) | = | none |

### Totals

28 rows: 17 equal or on the scale, 3 M3-silent and on the scale, 8 differ: the two side margins (rows 1 and 2, the most visible: every page at every width), the two em-based text spaces (rows 4 and 5), the Testimonials carousel gap (13), the Checklist row padding (17), the footer's column gap (8) and the Posts' column gap (24, borderline). **Cards (rows 10 and 11) are already equal on `main`.** On a phone the Cards are one column, 8 apart with 16 padding: this is what Material prints ("8dp max"), so no measured value is outside the rule. If the other session changes the gap, the line to hold is "8dp max", the same in both directions.

## Build plan

Small pull requests, in this order. Each is one task for one session; each adds a patch changeset and a release note line only where the owner sees the change.

1. **Side margins to 16 and 24** (rows 1, 2). Files: `theme/components/Container.astro` (`px-5 medium:px-8` to `px-4 medium:px-6`); then every place that repeats the same offsets (search `px-5`, `medium:px-8`, `-mx-5`, `max-w-6xl` under `theme/`, and `--carousel-bleed` in `theme/styles/blocks.css` and `ui.css`, which bleeds a carousel by the margin). Check the editor preview (`check:screens`) and the wide blocks (Table, Carousel) at 375 and 600. Medium fix, biggest effect.
2. **Text spaces on the grid** (rows 4, 5). Files: `theme/styles/base.css` (the `.prose` rules, `post-lead + .prose` at line 329). Set paragraph 16px, lead 24px, h3 32 above and 12 below, replacing the em values. Small.
3. **Testimonials carousel gap to 8** (row 13). File: `theme/styles/blocks.css` (set `--carousel-gap: 0.5rem` for `.block-testimonials .carousel`, the way `.block-cards-carousel` does) or the default in `ui.css` 2081. Small.
4. **Checklist row padding to 4** (row 17). File: `theme/styles/blocks.css` near 1137 (the feature list's `--list-item-padding-block`). Small.
5. **Footer and Posts column gaps to 24 from medium** (rows 8, 24). Files: `theme/components/Footer.astro` (`gap-10` to `gap-6`), `theme/components/PostList.tsx` (`gap-x-12` to `gap-x-6`). Small; ask the owner first whether the Posts' wider gap is wanted.
6. **A check against drift.** Add a script to `npm run check:css-values` (or beside it) that fails when a block's `margin`, `padding` or `gap` is not a multiple of 4px in the demo at 375 and 1280, with an allowlist for the printed nested units (2, 6, 10). Medium. Only after 1 to 5, so the rule starts green.
7. **Cards gap**: not in this plan; session_01GGzusM2gXx6wxMdYVzg6xj owns it. When it lands, re-run this audit's Cards rows (10, 11) and confirm: gap at most 8 and the same in both directions.

Not measured: the site's header (app bar spacing is drawn as images on the M3 app bars page), the editor's own workspace (outside this rule), other themes (`check:themes`), and the Image grid block (still a spec, #521).
