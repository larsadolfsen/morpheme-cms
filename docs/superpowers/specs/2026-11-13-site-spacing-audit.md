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

## Corners (from the token lists)

The corner values ARE on the pages. The component pages' Specs tab has a token viewer; its "shape" tokens show a drawing in the table, but clicking a token opens a panel that prints "Shape family: Rounded corners" and "Default size: 12dp" (or "Circular"). Every value below was read from those panels with Playwright (`m3.material.io/components/<name>/specs`, token set named in the table) and compared with the computed `border-radius` of the same part on the editor's Parts screen (`#developer/parts/ui`, demo build, 1280px; the phone gave the same) and of the blocks on `/blocks/`. #520 said these values could not be read; they can, and that note is out of date. The FAB page and the Bottom sheet page have no token viewer, and the Slider page has none: not read. M3 prints no shape for dividers, progress and the radio button.

### Parts (M3 token, value, ours)

| Part | M3 token and value (page) | Ours (measured) | Result |
| ---- | ------------------------- | --------------- | ------ |
| Card (elevated, filled, outlined) | `md.comp.*-card.container.shape` 12dp (`/components/cards/specs`) | 12 | = |
| Dialog, basic | `md.comp.dialog.container.shape` 28dp (`/dialogs/specs`) | 32 | **4 too round** |
| Dialog, full screen | `full-screen-dialog.container.shape` 0dp | 32 as drawn in the Parts frame | differs; check whether the real full-screen dialog fills the window (then 0) |
| Date picker, docked / modal | docked 16dp, modal 28dp; date input 28dp (`/date-pickers/specs`) | docked 16, modal 32 | docked =, **modal 4 too round** |
| Time picker, time input | container 28dp; selectors 8dp (`/time-pickers/specs`) | container 32 | **4 too round** |
| Menu | `menus.container.shape` 16dp (the Expressive menu; the baseline `menu.container.shape` is 4dp); item 4dp, first and last child 12dp, selected 12dp (`/menus/specs`) | container 16; every item 12 | container =; **items are 12, M3's middle items are 4** |
| Snackbar | 4dp (`/snackbar/specs`) | 4 | = |
| Tooltip | plain 4dp, rich 12dp (`/tooltips/specs`) | plain 4 | = |
| Chips | 8dp (assist, filter, input, suggestion) | 8 | = |
| Buttons | round: circular; square XS 12, S 12, M 16, L 28, XL 28; pressed 8, 8, 12, 16, 16 (`/buttons/specs`) | round (20 at 40 high = full) | = (square and pressed not drawn on any measured part) |
| Icon buttons | round: circular; square XS 12, S 12, M 16, L 28, XL 28 | circular; square 12, 12, 16 measured | = |
| Segmented button, split button, search bar, badge, loading indicator, switch (track, handle), toolbar (standard, vibrant, floating) | circular | 9999 | = (the switch track computes 0: it is drawn with another clip, not verified) |
| FAB menu (close button, items) | circular | items 9999; close button 0 on the measured wrapper | items =; wrapper is not the drawn shape, not verified |
| Extended FAB | small 16, medium 20, large 28 (`/extended-fab/specs`) | 16, 20 | = |
| FAB (56, 80, 96) | not read (no token viewer) | 16, 20, 28 | nearest: the extended FAB's 16, 20, 28 |
| Navigation bar, top app bar, docked toolbar | container 0dp | 0 | = |
| Navigation rail | collapsed 0, expanded 0, expanded modal 16dp | 0; modal 0/16/16/0 | = |
| Navigation drawer | `navigation-drawer.container.shape` 0dp (`/navigation-drawer/specs`) | standard drawer 0/16/16/0 | **16 on the free edge, M3 prints 0** |
| Tabs | container 0dp; primary active indicator 3dp | 0 | = |
| Text field | outlined 4dp; filled: the panel prints "Default size 0dp" (`/text-fields/specs`) | outlined 4; filled 4/4/0/0 | outlined =; filled: the panel prints 0, ours has 4 on top (the drawing may be a top-only corner; not settled) |
| Checkbox | container 2dp | box not measured: its wrapper is a 40px circle | not verified |
| Carousel | item 28dp (`/carousel/specs`) | 28 | = |
| List | container 16dp; item 4dp (Expressive); hovered 12, focused, pressed, selected 16; leading avatar circular; leading image 8dp (Expressive), video 8dp (`/lists/specs`) | row 4; segmented list container 12 | rows =; **segmented container 12 vs 16** |
| List, expand (the FAQ's kind of row) | container 16dp (`/lists/specs`, "List - Expand") | rows 16 outer and 4 inner; the `.block-accordion` wrapper 12 | rows =; **wrapper 12 vs 16** |
| Bottom sheet | not read (no token viewer) | 28 top | nearest: the dialog's 28 |
| Side sheet | docked 0, detached 16dp (`/side-sheets/specs`) | not on the Parts screen | not measured |
| App bars | container 0dp; search bar circular | 0 | = |

### Blocks: which surface follows the Card corner

Blocks are mostly cards, and the Card corner is 12 (`--card-radius`, `global.css` 190, `var(--mo-shape-medium)`). Measured on `/blocks/`:

| Block surface | Radius (variable) | Result |
| ------------- | ----------------- | ------ |
| Cards (all three kinds), Price card, Testimonial | 12 (`--card-radius` through the `Card` part) | = |
| Cards inside the phone carousel (`.block-cards-carousel .carousel-item .card`) | 28 (`--carousel-item-radius` 1.75rem) | M3 Carousel prints 28 for an item; as a Card it is 12. Equal to the Carousel page, not to the Cards page |
| Notice (`.block-notice`) | 12 (`--block-radius`) | = in value, but it reads `--block-radius`, not the Card variable |
| Table box (`.block-table-grid`) | 12 (`--card-radius`, fallback `--block-radius-small`) | = |
| Video facade (`.prose .video-facade`) | 12 (`--block-radius`) | = in value, own variable |
| Banner image (the Banner image classes) | `--block-radius` 12 | = in value (not on the demo: measured from CSS) |
| Accordion wrapper / rows | 12 / 16 outer, 4 inner | wrapper differs from the List-expand token (16) |
| Segmented list | 12 container, 4 inner | differs from the List token (16) |
| Posts thumbnail (the post thumbnail class) | 16 (`--block-radius-small`) | M3 list image is 8dp; M3 card media follows the card, 12 |
| Filter chips, buttons, badges, step numbers | 8, full, full, full | = (M3: chips 8; circular for avatars and badges) |

`--block-radius` is 12 here, `--block-radius-small` is 16 and `--block-control-radius` is full, set per theme in `global.css` 75 to 79. Two variables for what M3 calls one Card corner is the root of the Notice, Video and Banner differences: they are equal today only because the theme sets both to 12.

## Cards: component or own CSS

Checked in `theme/blocks/*` (imports) and measured. "Part" means the block draws the theme's `Card` (`theme/ui/Card.tsx`, `.card` in `ui.css`) or `ListItem`; "own" means a box in `theme/styles/blocks.css` or Tailwind.

| Block | Uses | Radius | Padding | Gap between items |
| ----- | ---- | ------ | ------- | ----------------- |
| Cards | `Card` (`cards/LinkCards.tsx`) | 12 (`--card-radius`) | 16 | 8 (`--card-gap`) |
| Price cards | `Card` (`pricecards/View.tsx`) | 12 | 16 | 8 |
| Testimonials | `Card` (`Testimonial.tsx`), `Chip`, `Carousel`, `RowList` | 12 | 16 at 375, **28 at 1280** | grid 8; phone carousel **16** (row 13) |
| Links | `Panel` (`Panel.tsx`, a `Card`) with a `List` (`links/LinkGroups.tsx`) | 12 | not on the demo | `--card-gap` |
| List, Points with icon, Checklist | `ListItem` (`ui/List`) | row 4, no box | 16 | 0 |
| Segmented | `ListItem`, `list-segmented` | 12 / 4 | 16 | 2 |
| FAQ / Accordion | own `details` rows (`faq/Accordion.tsx`; `Button` only for its row link) | 12 wrapper, 16/4 rows | 16/24 | 2 |
| Notice | own (`.block-notice`) | 12 (`--block-radius`) | 16/24 | n/a |
| Table, Cookies | own (`.block-table-grid`) | 12 (`--card-radius`) | 16 per cell (M2) | n/a |
| Posts | own (Tailwind in `PostList.tsx`) | thumb 16 | 20 above and below, on a rule | 0 vertical, 48 columns |
| Steps | own (`StepList.tsx`), no box | number circle | n/a | 40 |
| Video | own (`.video-facade`) | 12 | 24 | n/a |
| Banner (Hero) | own | image 12 | none | 32 or 48 |
| Buttons | `Button` | full | 0 / 24 | 12 |

So four blocks use the `Card` part (Cards, Price cards, Testimonials, Links through Panel), five use `ListItem`, and Notice, Table, Posts, Steps, Video, Banner and the Accordion draw their own boxes. The Cards worker's branch `card-spacing-m3` (read: `origin/card-spacing-m3`, two commits) changes only the Cards block and adds `--card-subhead-gap` 4, `--card-text-gap` 8, `--card-media-gap` 16 and `--card-action-gap` 16 to `global.css`, makes the phone carousel use `--card-gap`, and keeps `--card-gap` at 8. This audit treats those five variables as shared and does not redefine them.

### Inner spacing of the other card blocks (not covered by that branch)

| Block | Measured inside the card | M3 | Result |
| ----- | ------------------------ | -- | ------ |
| Price card | padding 16; badge to name 12; name to price 16; price to text 12; text to features 24; features to buttons 0 | Cards prints only 16 left and right and 8 between cards; the 4dp unit and 8dp scale | all on the grid; 12 and 24 are not the Cards block's 8 and 16, so the two card blocks space the same parts differently |
| Testimonial | padding 16 (375) and 28 (1280); head to text 12; text to name 0 (375) and 24 (1280) | 16, and "Density shouldn't automatically change across breakpoints" | **28 and 24 only at 1280: the card changes with the window** |
| Panel (Links) | not on the demo; takes its gap from `--card-gap`, its inside is its own CSS | same | not measured |

## Standard parts for blocks that draw their own box

For each block with its own box: the standard part that fits, what would change, and the move (all small, visual change stated). M3 has no part for a notice, a stepper or a hero; where none fits, that is said.

| Block | Fitting part | What changes visually | Move |
| ----- | ------------ | --------------------- | ---- |
| Notice | `Card`, filled, no media (M3 Cards page; M3 has no banner) | Corner now `--card-radius` (12, same value); padding 16/24 becomes the Card's 16; same fill | small |
| Table, Cookies | `Card` outlined as the frame around the M2 table | None: it already draws the outlined card's border and 12 corner; the corner would come from one place | small |
| FAQ / Accordion | `ListItem` expandable, the M3 List "expand" kind (container 16, item 4) | Wrapper 12 becomes 16; rows unchanged; the open/close arrow comes from the part | medium |
| Segmented | already `ListItem`; only the container radius var | 12 becomes 16 (row 4 in this table's Corners result) | small |
| Posts | `ListItem` with a leading image and dividers (M3 Lists: leading image 8dp, row 72 or 88) | Thumbnail corner 16 becomes 8 and the row loses its custom 20 padding for the list's 16; rule between rows stays | medium |
| Video | `Card` with media (Cards page: media follows the card corner) | None in value (12); the corner comes from the Card | small |
| Banner | no M3 part; the image takes the Card media corner | None in value | none |
| Steps | no M3 part (M3 has no stepper); the number could be a `ListItem` leading avatar (circular, as printed) with the 40 gap kept | Only if the owner wants the connector line dropped | not planned |
| Links, Testimonials, Price cards, Cards | already `Card` | n/a | n/a |

## Icons and touch targets of parts #520 did not open (measured live)

Measured on `#developer/parts/ui` at 1280px (the phone sizes are the same). "Box" is the element's own size; "target" is a `::before` or `::after` box where one is drawn. M3's rule (`/foundations/designing/structure` in #520, row 6): targets at least 48 by 48dp, pointers 44.

| Part | Icon size | Box and target | Material says | Result |
| ---- | --------- | -------------- | ------------- | ------ |
| Snackbar | 24 (close icon button); the link's arrow 14 | one line 48 high, two line 68; action button 40 high with a 48 target; close 40 | snackbar icon 24 (#520); one-line 48 | icon = ; the 14px arrow inside the snackbar link is not 24 (M3 prints no size for it); target = |
| Dialog | 24 (the icon); the check glyph in the box 14 | actions 40 high, 48 target on one button, none on the other (92.5 by 40) | dialog icon 24 | = for the icon; **one action button has no 48 target** |
| Navigation bar | 24 | items 64 to 68 high, 96 to 140 wide | bar 64; icon 24 | = |
| Navigation rail | 24 | items 48, 56 and 80 by 52, collapsed rail 96 wide | rail 96 | = |
| Menu | 20 | item 44 high | menu items 44, icon 20 (Expressive); baseline 48 and 24 (#520) | = to the Expressive set; under the 48 pointer-target rule M3 gives for lists |
| FAB menu | 24 (items) | items 56 high | FAB menu items 24 (#520) | = |
| Icon button, small | 24 | box 48 by 48 (circle 24 radius) and 40 by 40 for the "standard" kind | small: 40 with a 48 target | = (the 48 is the target; the visible shape is 48, not 40: see #520 row 3) |
| Icon button, XS | 20 | 36 by 36, no target box drawn | XS 32 with a 48 target (#520 row 3) | **target 36, under 48** |
| Icon button, narrow | 24 | 38.4 by 48 | narrow small 32 wide with a 48 target | **width 38.4, under 48** |
| Icon button, medium | 24 | 60 by 60 | medium 56 (#520) | 4 too big |
| Chip | 18 | 32 high, no target box | chip 32 high (#520, row 7) | **height 32 under 48, no extended target** |
| Tab | n/a | 48 and 64 high | tabs 48, 64 | = |
| List row | 20 | 56, 60, 68, 72, 76, 88 high | rows 56, 72, 88 | = for 56, 72, 88 |
| Checkbox, radio | glyph 14 in an 18 box | 40 by 40 state layer | checkbox 18, state layer 40 | = |
| Switch | 16 | track 52 by 32 | track 52 by 32 | = |

## Build plan

Small pull requests, in this order. Each is one task for one session; each adds a patch changeset and a release note line only where the owner sees the change.

1. **Side margins to 16 and 24** (rows 1, 2). Files: `theme/components/Container.astro` (`px-5 medium:px-8` to `px-4 medium:px-6`); then every place that repeats the same offsets (search `px-5`, `medium:px-8`, `-mx-5`, `max-w-6xl` under `theme/`, and `--carousel-bleed` in `theme/styles/blocks.css` and `ui.css`, which bleeds a carousel by the margin). Check the editor preview (`check:screens`) and the wide blocks (Table, Carousel) at 375 and 600. Medium fix, biggest effect.
2. **Text spaces on the grid** (rows 4, 5). Files: `theme/styles/base.css` (the `.prose` rules, `post-lead + .prose` at line 329). Set paragraph 16px, lead 24px, h3 32 above and 12 below, replacing the em values. Small.
3. **Testimonials carousel gap to 8** (row 13). File: `theme/styles/blocks.css` (set `--carousel-gap: 0.5rem` for `.block-testimonials .carousel`, the way `.block-cards-carousel` does) or the default in `ui.css` 2081. Small.
4. **Checklist row padding to 4** (row 17). File: `theme/styles/blocks.css` near 1137 (the feature list's `--list-item-padding-block`). Small.
5. **Footer and Posts column gaps to 24 from medium** (rows 8, 24). Files: `theme/components/Footer.astro` (`gap-10` to `gap-6`), `theme/components/PostList.tsx` (`gap-x-12` to `gap-x-6`). Small; ask the owner first whether the Posts' wider gap is wanted.
6. **A check against drift.** Add a script to `npm run check:css-values` (or beside it) that fails when a block's `margin`, `padding` or `gap` is not a multiple of 4px in the demo at 375 and 1280, with an allowlist for the printed nested units (2, 6, 10). Medium. Only after 1 to 5, so the rule starts green.
    **Step 6, done:** `checkSpacingGrid` in `scripts/editor-screens.mjs` (a unit of `check:screens`, so CI runs it) measures every margin, padding and gap on the demo's Blocks page at 375 and 1280; its exceptions, each with a reason, are in `scripts/spacing-grid.allow.mjs` (the nested units 2, 6 and 10; inline code, the check list's em spaces from the text style and the chip's padding). It started green after the block head (2.5em and 1.25em to 2rem and 1rem) and the check list's gap (0.75em to 0.75rem) went onto the grid.
7. **Cards gap**: not in this plan; session_01GGzusM2gXx6wxMdYVzg6xj owns it (`card-spacing-m3`, with `--card-subhead-gap`, `--card-text-gap`, `--card-media-gap`, `--card-action-gap`, which stay as they are). When it lands, re-run the Cards rows (10, 11) and confirm the gap is at most 8 and the same in both directions. The PRs below start after it, because they touch the same files (`blocks.css`, `global.css`).
8. **Corner values** (Corners section). Files: `theme/styles/ui.css` and `global.css`. Dialog, modal date picker, time picker 32 to 28 (`--dialog-radius` and the pickers' variables); menu items 12 to 4 with the first and last child 12; navigation drawer's free-edge corner 16 to 0 (decide with the owner: the owner may want it); segmented list container 12 to 16 (`--list-segmented-radius`, `global.css` and `ui.css` 2263). Small each, one PR for the dialogs and pickers, one for the menu, one for the drawer and list. Re-run `check:screens`.
9. **One Card corner for block surfaces** (Corners and Cards sections). Files: `theme/styles/blocks.css` (`.block-notice` 256, `.prose .video-facade` 2036, the Banner image rule 501, `.block-accordion` 323, `.block-table-grid` 1447), `theme/styles/global.css` 75 to 79. Make Notice, Video, Banner image and Table read `--card-radius`; make the accordion wrapper read the list's 16. No visible change today (all 12); it removes the second variable. Small.
10. **Move card-like block surfaces onto the Card part** (Standard parts section), one PR each, in this order: Notice to `Card` filled (`theme/blocks/notice/View.tsx`); Table and Cookies to a `Card` outlined frame (`theme/blocks/table/View.tsx`, `cookies/View.tsx`); Video to a `Card` with media (`theme/blocks/video/View.tsx`). Each small; the editor's preview follows because it uses the same views. Check with `check:screens` and the editor's block shots.
11. **Move row-like blocks onto `ListItem`**: Posts to a list with a leading image (`theme/components/PostList.tsx`, thumbnail 16 to 8, rows 72 or 88; ask the owner before, it changes how the post list looks) and the FAQ to the List "expand" kind (`theme/blocks/faq/Accordion.tsx`, `theme/blocks/accordion/PageRow.tsx`). Medium each.
    **Step 10, Video: skipped (PM, 14 Nov).** Step 9 already gave Video the Card corner (`--card-radius`). A `Card` link on the video would add the Card's hover state layer (a visible change), put a card inside a card where the video is a card's media, and the markdown video (`lib/video.mjs`, made outside React) would no longer match. **Step 10, Table:** done (#582), the box is an outlined `Card` with its own border kept. **Step 10, Cookies:** left as it is: the Cookie list has no box today (no border, corner or padding), so a Card would add a frame; the owner decides.
12. **One inner spacing for the card blocks**: Price cards and Testimonials take the Cards block's tokens (`--card-text-gap` 8, `--card-media-gap` 16, `--card-action-gap` 16) where they space the same parts, and Testimonials keep 16 padding at every width (28 and 24 at 1280 go). Files: `theme/blocks/pricecards/`, `theme/blocks/testimonials/`, `blocks.css` 1616 and 1903. Medium. After 7.
13. **Touch targets** (Icons and touch targets section). Files: `theme/styles/ui.css`: XS icon button and narrow icon button get a 48 by 48 target (`::after` as the small button has), the chip gets a 48 high target, the second dialog action button gets its target. Small each, one PR. Needs the owner to confirm that the chip's target may overlap its neighbour as M3 draws it.
    **Step 13, done:** the chip's 48 high target and the buttons' came with Density PR 2 (#554, the `::after` area in `ui.css`); the icon buttons (XS 36, narrow 38.4 wide) now take the same area, also across their width.

Not measured: the site's header (app bar spacing is drawn as images on the M3 app bars page), the editor's own workspace (outside this rule), other themes (`check:themes`), the Image grid block (still a spec, #521), the Links block and its Panel (not on the demo), the FAB, bottom sheet and slider corners (no token viewer on their pages), the side sheet (not on the Parts screen) and the switch track and checkbox corner (drawn with a clip that computes as 0).
