# Material 3 names for the color variables: plan

Status: plan, not started. Written on 2026-11-08 at the owner's request ("wait with the variable names but write a plan").

## Goal

Every site color is named after its Material 3 color role (`md.sys.color.*` without the prefix): the CSS variable,
the key in `src/data/colors.json`, the Tailwind color and the name in code. The labels under Colors already use
Material 3's names (PR #183). Only the variables still have the old names.

## Today and the target

| Today (`--…`, key in `colors.json`) | Label under Colors | Material 3 role (`colorRoles`) | Target |
|---|---|---|---|
| `bg` | Background | `surfaceBright` | `surface-bright` (see decision 1) |
| `surface` | Surface (cards) | `surfaceContainerLowest` / `surfaceContainerLow` (dark) | `surface-container-lowest` (see decision 2) |
| `surface-dim` | Surface dim | `surfaceDim` | unchanged |
| `surface-default` | Surface | `surface` | `surface` (once the old `surface` is gone, step 6) |
| `surface-bright` | Surface bright | `surfaceBright` | unchanged |
| `surface-container-*` | Surface container … | `surfaceContainer*` | unchanged |
| `inverse-surface`, `inverse-on-surface`, `inverse-primary` | Inverse … | same | unchanged |
| `tint` | Tint | `surfaceContainerHigh` | `surface-container-high` (see decision 3) |
| `ink` | On surface | `onSurface` | `on-surface` |
| `muted` | On surface variant | `onSurfaceVariant` | `on-surface-variant` |
| `line` | Outline variant | `outlineVariant` | `outline-variant` |
| `outline` | Outline | `outline` | unchanged |
| `accent` | Primary | `primary` | `primary` |
| `accent-hover` | Primary hover | `primaryHover` (not Material's) | `primary-hover` (see decision 4) |
| `on-accent` | On primary | `onPrimary` | `on-primary` |
| `accent-container` | Primary container | `primaryContainer` | `primary-container` |
| `on-accent-container` | On primary container | `onPrimaryContainer` | `on-primary-container` |
| `secondary…`, `tertiary…`, `error…` | Secondary … | same | unchanged |

`surface` is the hard part. Today it is the cards' color. In Material 3 it is the plain surface, which is
`surface-default` here. The new meaning can't be given to `--surface` while anything still reads it as the cards'
color, so the rename takes two releases (steps 1–5, then step 6).

## Where the names are used (2026-11-08)

- **CSS variables**: `theme/styles/` (`global.css`, `base.css`, `blocks.css`, `components.css`, `ui.css`,
  `elevation.test.mjs`), `src/editor.css` and `src/ui.tsx`. Most of the theme reads the colors through the `--md-*`
  aliases and the parts' variables (`--block-*`, `--card-*` …), so only those declarations change. There are about
  270 direct uses, mostly `--ink`, `--accent` and `--muted`.
- **Tailwind colors** (`theme/styles/base.css`, `@theme inline`): the utilities `text-muted` (126 uses),
  `*-accent` (39), `border-line` (28), `*-tint` (12), `*-ink` (6), `*-surface` (6), `*-on-accent` (5), `bg-bg` (1),
  in `src/`, `theme/blocks/` and `pages/`.
- **Keys in code**: `defaults/colors.ts` (`colorFields`, `colorPairs`, `colorRoles`), `lib/dynamic-colors.ts`
  (`MIXED`), `lib/colors.ts` (`pageColor`), `src/Colors.tsx` (`SHOWN`, `choiceOf` reads `light.accent`),
  `src/Library.tsx` (the page swatches), `scripts/app-screenshots.mjs`, `scripts/page-colors.mjs`.
- **Data**: every site's `src/data/colors.json`, plus the demo's and the starter's.
- **Outside this repository**: the other themes in the app store (`check:themes`), apps with a `page-colors` hook
  (they return colors by name, `site/pageColors.ts`), and any custom CSS on a site or in `morpheme-website`.
- **Not color variables, kept as they are**: the values stored in a site's Markdown. These are the section colors
  (`section: 'tint' | 'accent'`, `.text-section-tint`, `.text-section-accent`), the text colors
  (`<span class="color-accent">`, `color-muted`, `lib/text-colors.mjs`) and the cards' `background: 'accent'`.
  Renaming them would mean rewriting every site's content for no visible gain. Their CSS reads the new variables.

## Steps

1. **Migration in `lib/colors.ts`.** Add `LEGACY_NAMES` (old → new, the table above) and `withMaterialNames(colors)`.
   A file with the key `accent` is in the old names: each key is renamed and the old `surface` becomes
   `surface-container-lowest` unless that key is already there. Call it wherever a file of colors is read, before
   `completeColors`: `pages/editor/index.astro`, `site/pageColors.ts`, `src/checkSite.ts`, the theme's
   `Base.astro`/`colorsCss` and `scripts/page-colors.mjs`. The editor writes the new names on the next save. Unit
   tests: an old file, a new file, and a half-migrated one.
2. **Rename in code and data.** `colorFields`, `colorPairs`, `colorRoles`, `MIXED`, `SHOWN`, `choiceOf`, the swatches
   and the scripts get the new keys. Regenerate the demo's and the starter's `colors.json` in the new names.
3. **Rename in CSS.** Rename every `var(--old)` in `theme/styles/`, `src/editor.css` and `src/ui.tsx`, including the
   swapped colors for a section on the primary color (`.text-section-accent > *` in `global.css`). Keep the `--md-*`
   aliases, but point them at the new names.
4. **Aliases for one minor line.** `theme/styles/base.css` declares the old names on `:root` as aliases of the new
   ones (`--accent: var(--primary)`, `--ink: var(--on-surface)` …). Its `@theme inline` keeps the old Tailwind colors
   beside the new ones (`--color-primary` and `--color-accent`), so other themes, apps and a site's own CSS keep
   working. `--surface` keeps its old meaning (the cards) for now, as an alias of `--surface-container-lowest`. Rename
   the Tailwind utilities in this repository (`text-muted` → `text-on-surface-variant` …).
5. **Guard.** `scripts/color-names.test.mjs`, run by `npm test`, fails on an old name (`var(--accent)`, `text-muted` …)
   outside the alias block in `base.css`, in the same way as `scripts/pending-shared.test.mjs`. Ship steps 1–5 as one
   pull request: a **minor** change, because nothing a site has stops working.
6. **The next minor line: `surface` becomes Material's.** Once the app store's themes no longer read `--surface` as
   the cards' color (check with `check:themes`), make `surface` the Material 3 surface, drop `surface-default` (the
   migration renames it) and remove the aliases from step 4. This is the step that can change how a theme outside
   this repository looks, so its changeset says so. It is **major** if a theme in the app store still depends on the
   old names.

## Decisions for the owner

1. **The page's own variable.** Option A: drop `bg` and put the page on `surface-bright` (Material has no background
   role any more). Option B: keep a short alias, `--background: var(--surface-bright)`. Recommended: A, with
   `--md-background` in the theme as the one place that says which surface the page is.
2. **Cards in dark mode.** Today, cards are `surfaceContainerLow` in dark mode and `surfaceContainerLowest` in light
   mode. Merging them into `surface-container-lowest` makes dark cards darker (tone 4 instead of 10). Option A: accept
   that. Option B: point the theme's cards at
   `surface-container-low` in dark mode. Recommended: B, so dark mode looks the same as today.
3. **Tint.** `tint` takes the same role as `surface-container-high`. Option A: drop it, so light boxes and the
   section color "Tint" use `surface-container-high`. Option B: keep it as its own color. Recommended: A. The
   section's stored value stays `tint`.
4. **Primary hover.** This is not a Material color. Material draws hover as a state layer (on primary at 8% over
   primary). Option A: keep `primary-hover` as a color under Colors. Option B: drop it and draw the state layer in
   CSS (`color-mix(in srgb, var(--on-primary) 8%, var(--primary))`). Recommended: B. It removes one color the owner
   has to keep readable, and Material's contrast already holds for it.
5. **When the aliases go** (step 6): after one minor line, or when `check:themes` is clean. Recommended: when
   `check:themes` is clean.

## Checks

`npm run check`, `check:screens`, `check:demo`, `check:starter`, and `check:themes` in `.morpheme/demo/site/`. Also
check by hand: an old site's `colors.json` (keys `accent`, `ink` …) opens under Colors with its own colors, and saves
in the new names. A theme that reads `--accent` still gets the primary color during the alias line.
