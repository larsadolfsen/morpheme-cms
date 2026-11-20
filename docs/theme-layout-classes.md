# The layout classes

`theme/styles/layout.css` (layer `utilities`, tokens in `theme/styles/tokens/layout/comp/`) holds a small set of named layout helpers, the
vocabulary of plan `docs/superpowers/plans/2026-11-16-move-away-from-tailwind.md` §3.2. Each class sets layout only, with logical properties, `gap`
and tokens: never colour, shape, type or state (those belong to the part). `theme/styles/layout.test.mjs` fails on anything else. `base.css` imports the file, so every theme has it.

| Class | Declarations | Token |
| :-- | :-- | :-- |
| `mo-row` | `display: flex; align-items: center; gap` | `--mo-comp-row-gap` (8px) |
| `mo-row-wrap` / `-start` / `-end` / `-between` | `flex-wrap: wrap` / `align-items: flex-start` / `justify-content: flex-end` / `justify-content: space-between` | |
| `mo-stack` | `display: flex; flex-direction: column; gap` | `--mo-comp-stack-gap` (16px) |
| `mo-grid` | `display: grid; gap; grid-template-columns: repeat(var(--mo-comp-grid-columns, 1), minmax(0, 1fr))` | `--mo-comp-grid-gap` (16px), `--mo-comp-grid-columns` |
| `mo-grid-2` / `-3` / `-4` | sets `--mo-comp-grid-columns`: 1 on a phone; `-2`: 2 from 37.5rem; `-3`: 2, then 3 from 52.5rem; `-4`: 2, 3, then 4 from 75rem | |
| `mo-fill` | `flex: 1 1 0%; min-inline-size: 0` | |
| `mo-keep` | `flex-shrink: 0` | |
| `mo-truncate` | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` | |
| `mo-clamp-2` | `overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2` | |
| `mo-center` | `margin-inline: auto; max-inline-size` | `--mo-comp-center-measure` (`none`) |
| `mo-cover` | `object-fit: cover; inline-size: 100%; block-size: 100%` | |
| `mo-visually-hidden` | the clip pattern (`position: absolute`, 1px size, `clip-path: inset(50%)`) | |
| `mo-hidden`, `mo-contents` | `display: none`, `display: contents` | |

## Another value

The tokens sit on `:root`. An element that needs another gap, column count or measure sets the token on itself
(`[--mo-comp-row-gap:var(--mo-ref-space-150)]`), never on `:root`. `mo-grid` is for plain columns; cards of different heights use `.mo-staggered-grid`
(`docs/theme-grid.md`).

## When to use a part rule instead

A class here is for a layout of three or more places. A cluster that draws a surface or a control (a header's actions, a cookie banner's row)
is not a vocabulary class: it keeps its look in a named rule of the part, in the file that styles it. Spacing between blocks is the part's own
spacing, not a layout class. A new class needs three uses and goes in plan §3.2 first.
