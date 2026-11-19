# The theme grid (`.mo-staggered-grid`)

One grid for every page of the editor and for the site's blocks. The Library's media grid and the Image grid block use it today; the start screen uses it too.

## How it packs

CSS columns (`theme/styles/ui.css`): the cards flow down the first column, then the next, each in its own height, `--mo-sys-grid-gutter` apart both ways. A short card leaves no hole. The DOM order is the reading and keyboard order; the visual order is column by column.

## Tokens

- `--mo-comp-grid-columns`: how many cards stand side by side. Set per window size class on `.mo-staggered-grid`: 2 on compact (under 600 dp), 3 from medium (600 dp), 4 from large (1200 dp). A part with other counts sets the token on its element (`[--mo-comp-grid-columns:1] medium:[--mo-comp-grid-columns:2]` on the start screen; the Image grid block's `data-columns` sets it from medium).
- `--mo-sys-grid-gutter`: the space between cards, both ways: 16 px on compact, 24 px from medium. `--mo-sys-grid-margin`: the page margin on the same steps (16 / 24 px). Owner values, 15 Nov 2026: M3's Grids pages print no margin or gutter value.
- `--mo-sys-grid-layout-columns`: M3's layout grid: 4 on compact, 8 on medium and expanded, 12 on large and extra-large. One token per size class; the count a span is given in.

## Spans

- `.mo-staggered-grid__span-full` on a direct child: the card goes across all columns. The cards before and after it pack on their own, with no holes.
- `.mo-staggered-grid__span-compact`: across all the columns under 600 dp, one column from there (the start screen's default for a widget without a `span`).
- A card is otherwise one column. Spans of other widths (a third, a quarter, two of three) are not possible in columns without leaving holes; they need masonry (`grid-template-rows: masonry`, not available in every browser) or a script that measures the cards. Neither is used.

## Material 3

M3's layout grid has 4 columns on compact, 8 on medium and expanded and 12 on large and extra-large (m3.material.io, Foundations, Layout, Grids: the image of the column mockup). M3 prints no count of cards per row, and no margin or gutter in the pages or images read; the margin and gutter (16 / 24 px) are the owner's values. The cards per row (`--mo-comp-grid-columns`: 2, 3, 4) are ours, on M3's breakpoints (600, 840, 1200, 1600 dp). See `docs/material-deviations.md`, entry 17.
