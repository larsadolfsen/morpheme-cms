# Theme coverage on the Parts screens (design)

> **Status:** approved by the owner on 5 November 2026. Builds on
> `2026-11-05-material-fallback-design.md` (Material in `@layer fallback` under every theme).

## Problem

A theme decides how everything looks. Material only catches what a theme forgets. Today nobody can see what a theme
forgets: Venus 1.1.0 still draws its checkbox, radio button, switch, slider, date picker and time picker with
Material's rules, and only a close look shows it.

The editor already has the overview: *Appearance › Parts › UI components* (`#udseende/dele/ui`, `ComponentParts` in
`src/BlockParts.tsx`) draws every UI component in every kind, size and state. The editor loads the site's active theme
(`pages/editor/index.astro` imports `@theme/styles/global.css`), so on a Venus site the screen shows Venus. What is
missing is a mark that says which parts the theme styles itself and which fall back to Material.

## Decisions (owner, 5 November 2026)

- The marks go on the existing Parts screen *UI components*. No new screen, no CLI report.
- A static read of the theme's CSS decides. A part that only changes through variables (colours, shapes) counts as
  Material.
- Scope: the UI components (Material's `theme/styles/ui.css`) and the site frame (top app bar, its menu, navigation
  drawer, FAB, footer). Blocks and the blog are not in scope.
- Each part shows its status and, when partly styled, the pieces the theme leaves to Material.
- The header menu and the footer are Astro components. They get a status-only part, without a drawing.

## Design

### 1. Parts catalogue: `site/themeParts.mjs`

A hand-written list of the parts a theme can style. Each entry has a unique `id`, a `group` and its class prefixes.

```js
/** @typedef {{ id: string, group: 'ui' | 'frame', prefixes: string[] }} ThemePart */
export const THEME_PARTS = [
  { id: 'Button', group: 'ui', prefixes: ['button'] },
  { id: 'ButtonGroup', group: 'ui', prefixes: ['button-group'] },
  { id: 'Checkbox', group: 'ui', prefixes: ['checkbox'] },
  { id: 'Fab', group: 'frame', prefixes: ['fab', 'extended-fab'] },
  { id: 'HeaderMenu', group: 'frame', prefixes: ['md-nav-item', 'md-nav-toggle'] },
  { id: 'Footer', group: 'frame', prefixes: ['md-footer'] },
  // … one entry per component in theme/ui/ and per frame part
];
```

- `id` is the name the editor's `Part` shows (`Checkbox`, `RadioButton`, `TopAppBar` …).
- A class matches a prefix when it equals the prefix or starts with the prefix and `-`.
- A class belongs to the part with the longest matching prefix. `button-group-connected` is ButtonGroup's,
  `chip-set-wrap` is ChipSet's, `fab-menu-item` is FabMenu's.
- A part's **pieces** are all the classes in Material's CSS chain (`theme/styles/base.css`, `ui.css`,
  `components.css`, `global.css`) that belong to it. Nobody keeps the pieces by hand.
- Frame parts: `TopAppBar`, `HeaderMenu`, `NavigationDrawer`, `DrawerHead` (`md-drawer`), `Fab`, `FabMenu`, `Footer`,
  `ActionBar` (`theme-action-bar`), `Logo` (`theme-logo`).

### 2. Coverage: `site/themeCoverage.mjs`

Pure functions, no file access, tested with Node:

```js
/** The classes of Material's CSS, by part id. */
export function partPieces(materialCss: string, parts: ThemePart[]): Record<string, string[]>
/** The classes a theme's own rules style (rules that set more than custom properties). */
export function styledClasses(themeCss: string): Set<string>
/** Each part's status and the pieces the theme leaves to Material. */
export function themeCoverage({ materialCss, themeCss, parts }): Record<string, PartCoverage>
/** @typedef {{ group: 'ui' | 'frame', status: 'own' | 'partly' | 'material', pieces: number, missing: string[] }} PartCoverage */
```

Rules of `styledClasses`:

- A rule counts when it sets at least one declaration that is not a custom property (`--*`).
- A rule counts at the top level and inside `@media`, `@supports` and `@container`. A rule inside any `@layer` does
  not count: a layered rule loses to `fallback`.
- The classes that count are those in the subject of the selector (the compound after the last combinator), also
  inside `:is()` and `:where()`. Classes inside `:not()` and `:has()` do not count. `.card .button` styles `button`,
  not `card`.
- Each selector of a selector list counts on its own.

Status: `own` when every piece is styled, `material` when no piece is styled, else `partly`. A part without pieces is
left out.

### 3. Delivery: `virtual:theme-coverage`

`themePlugin` in `site/theme.mjs` answers a new virtual module, as it answers `virtual:all-icons` now.

```ts
// default export
type ThemeCoverage = { theme: string; parts: Record<string, PartCoverage> } | null;
```

- On the standard theme (`saturn`) the module exports `null`.
- Else the plugin reads Material's CSS chain from this package's `theme/styles/` and the active theme's
  `styles/global.css` with the relative `@import`s it follows (one level and deeper). It skips package imports
  (`@morphemecms/cms/…`).
- It reads the files when the site is built or the dev server starts, as the theme's icons are read now.
- `postcss` moves from `devDependencies` to `dependencies`, and `postcss-selector-parser` (`^6.0.10`, installed now
  through Tailwind) is added there: a site runs this code.

### 4. Editor: *Appearance › Parts › UI components*

- **`CoverageBadge`** (new, `src/CoverageBadge.tsx`): the status of one part, *Own style*, *Partly own* or
  *Material*. For *Partly own* it lists the missing pieces in mono under the badge.
- **`Part`** (`src/PartsShown.tsx`): gets an optional `coverage` prop, the catalogue id. It defaults to the first name
  in `name` (`'ListItem, Group, …'` → `'ListItem'`). It shows the badge next to the name when the module has an entry.
- **Summary** at the top of the screen, from the module: e.g. "Venus styles 31 of 45 parts fully. 14 still
  use Material in part or in full." (`CoverageSummary`, `src/CoverageSummary.tsx`).
- **Filter**: `PartsShown` gets an optional second filter group, *Style*: All, Own style, Partly own, Material. Kept
  as the group filter is kept. A part without a catalogue entry is hidden while the filter is not *All*.
- **Site frame group**: a new group on the screen, last. TopAppBar, NavigationDrawer, Fab and FabMenu keep their
  drawings in their present groups, with their badges. The new group has status-only parts for HeaderMenu,
  DrawerHead, Footer, ActionBar and Logo (`FrameParts`, `src/FrameParts.tsx`).
- On the standard theme nothing of this shows: no badges, no summary, no *Style* filter.
- Texts: en-US first in `src/i18n/en-US/parts.ts`, then da-DK.

## Not in scope

- Blocks (`blocks.css`), the blog and post pages, and the *Values* screen.
- A warning in `npm run check` of `morpheme-apps` or in `check:themes`.
- Venus's own style for the parts this page marks as Material: that is a later task in `morpheme-apps`.

## Checks

- `site/themeCoverage.test.mjs` covers, with small CSS fixtures:
  - all pieces styled → `own`; none → `material`; some → `partly` with the right `missing`;
  - a rule that sets only custom properties does not count;
  - a rule inside `@media` counts; a rule inside `@layer` does not;
  - `.card .button` counts for `button` only; `:not(.button)` does not count;
  - the longest prefix wins (`button-group-x` is ButtonGroup's, not Button's).
- `site/themeParts.test.mjs`, on Material's real CSS:
  - every part has at least one piece (catches a renamed class);
  - every class in `ui.css` belongs to a part, except a short allow-list of non-part classes;
  - Material's own CSS as a theme gives `material` for every part (all its rules are in `@layer fallback`).
- `npx prettier --check .`, `node --test` over the `*.test.mjs` files and `npm run build` pass.
- By hand, on a site with Venus active (a local `npm pack` of this branch in `morpheme-apps/site/`): *UI components*
  marks Checkbox, RadioButton, Switch, Slider, DatePicker and TimePicker as *Material*; the *Style* filter on
  *Material* shows only those and the other gaps. On the demo (Material) no marks show.
- The release to npm stays the owner's step (2FA).
