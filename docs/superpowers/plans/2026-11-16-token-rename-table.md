# Token rename plan: `--mo-ref-*`, `--mo-sys-*`, `--mo-comp-*`

Plan for PR 3 (the rename) and PR 4 (the fallbacks). Written 16 Nov 2026 by the Tokens session; **nothing in this document is built**. The table
is the proposal the PM takes to the owner. PR 1 (#860) and PR 2 only move the declarations into `theme/styles/tokens/`
(`docs/theme-token-files.md`); PR 3 renames them.

Owner decisions this plan follows: every token that is not Tailwind's is renamed to Material 3's naming with `md` written `mo`, in three tiers
(`--mo-ref-*`, `--mo-sys-*`, `--mo-comp-<component>-*`); no aliases, the old names are removed; Tailwind's own names are not renamed and get no
alias (in the `@theme` blocks only the right-hand sides change to the new names); fallbacks (PR 4) come last, with the final names.

## What M3 prints (pages read with Playwright, 16 Nov 2026)

- `https://m3.material.io/foundations/design-tokens/overview`: "All token names in a design system start with the system name (such as "md" for Material Design)", then "An abbreviation for the token class: "ref" for reference tokens, "sys" for system tokens, and "comp" for component tokens", then "descriptive words communicating the token's role". Three classes: reference tokens ("All available tokens with associated values"), system tokens ("Decisions and roles that give the design system its character, from color and typography, to elevation and shape"), component tokens ("The design properties assigned to elements in a component, such as the color of a button icon"). Examples printed: `md.ref.palette.secondary90`, `md.comp.fab.primary.container.color`.
- `https://m3.material.io/styles/typography/type-scale-tokens`: `md.sys.typescale.display-large` (baseline) and `md.sys.typescale.emphasized.display-large`; the attributes the page lists are font, weight, size, line height and tracking.
- `https://m3.material.io/styles/motion/easing-and-duration/tokens-specs`: `md.sys.motion.easing.emphasized`, `.emphasized.decelerate`, `.emphasized.accelerate`, `md.sys.motion.easing.standard` (+ `.decelerate`, `.accelerate`), `md.sys.motion.duration.short1` … `extra-long4` (50 ms … ).
- `https://m3.material.io/styles/motion/overview/specs`: "The spring composite tokens are used in the motion physics system. These composites combine two spring tokens (damping and stiffness) into a single token"; the easing and duration tokens are "used by the legacy system".
- `https://m3.material.io/styles/shape/corner-radius-scale`: ten steps (none, extra small 4dp … extra large 28dp, extra large increased 32dp, extra extra large 48dp, full); "Material has shape corner tokens to define all corners".
- `https://m3.material.io/styles/elevation/tokens`: "Elevation levels can be implemented with tokens … Use elevation level tokens (0–5)".
- `https://m3.material.io/styles/color/roles`, `https://m3.material.io/foundations/interaction/states/state-layers`, `https://m3.material.io/components/buttons/specs`: roles, state layers (8% hover, 10% pressed, 40dp layer) and the button's tokens.

**Component tokens (updated 17 Nov 2026, owner decision 1).** The component specs pages (`https://m3.material.io/components/<component>/specs`) do print their tokens, in a token module under "Tokens & specs": the names appear after the module's *expand all* button is pressed, one token set at a time (the menu above the table: for buttons "Button - Color - Elevated", "Button - Size - Medium" and so on). I opened 36 specs pages with Playwright, pressed expand all on every token set, and read the `md.comp.…` names: 3,996 distinct names (buttons, icon buttons, split button, FAB, extended FAB, FAB menu, chips, cards, lists, menus, navigation bar, rail and drawer, checkbox, radio, switch, sliders, dialogs, divider, text fields, progress indicators, loading indicator, badges, sheets, date and time pickers, search, segmented buttons, snackbar, toolbars, tooltips, app bars, carousel, button groups, tabs). A page prints both the current names (`md.comp.button.filled.container.color`) and the older "baseline" ones (`md.comp.filled-card.container.color`); where only the older form exists for a component (cards, chips, text fields, search, navigation bar), the table uses the form the page prints. Pages I read: the 36 `/components/<component>/specs` pages listed above.

**What the sys pages do not print as text:** the strings for colour roles, shape, elevation and state are not in the text of `styles/color/roles`, `styles/shape/…`, `styles/elevation/tokens` or the state-layers page (the token modules on those pages did not give names when expanded, and I did not check the images). They are in Google's own web tokens, so I checked those names against the public npm package `@material/web` 2.5.0 (Apache-2.0; downloaded with `npm pack` into a scratch folder, only the text of `tokens/versions/v0_192/_md-{ref,sys,comp}-*.scss` read, no code run; the names are the generated tokens "Google Material 3 v0.192, Web, Dynamic"). The package prints names as `--md-<class>-<group>-<name>`, the same shape as ours with `md` for `mo`. The type scale and motion names are also printed on the type-scale and easing and duration pages.

Result (Kind column):

- **S**: an exact M3 token. Components: the name an M3 specs page prints, for 153 of our 424 component tokens; the value type is the same except where the note says ours is a shadow and M3's a level. Colour, shape and type scale: the name `@material/web` has (45 colour roles, 7 shape steps, 75 type-scale names).
- **S?**: M3's pattern, but no such token in `@material/web` 2.5.0 and none printed by the pages I read: the 12 spring tokens (the package has easing and duration, not springs; the motion page prints "spring composite tokens"), 3 Expressive shape steps (`large-increased`, `extra-large-increased`, `extra-extra-large`) and 7 type names (`lead` and the three `-prominent-weight`).
- **O**: ours, M3 prints no token for it. Components: 271 tokens whose part or attribute M3 does not print (box, glyph, round, corners, padding, gap, font-size, hover surfaces and so on); they keep our words under the same prefix (`--mo-comp-<our name>`), as the owner said. Others: space, density, grid, size, block, section, page, editor, theme parts, the elevation suffixes (M3 has `--md-sys-elevation-level0` … `level5`, a number; ours are a colour and two shadows), the state layers (M3 has opacities: `--md-sys-state-hover-state-layer-opacity`; ours are the layer colour) and 2 colour names (`primary-hover`, `scrim-overlay`).

Sources: `@material/web` 2.5.0 on npm, `tokens/versions/v0_192/_md-ref-palette.scss` (91), `_md-ref-typeface.scss` (5), `_md-sys-color.scss` (49), `_md-sys-elevation.scss` (6), `_md-sys-motion.scss` (27: easing, duration, path), `_md-sys-shape.scss` (12), `_md-sys-state.scss` (4), `_md-sys-typescale.scss` (92), and 84 `_md-comp-*.scss` component files.

CSS custom properties cannot contain dots, so `md.sys.color.primary` becomes `--mo-sys-color-primary`, as Material's own web tokens do (`--md-sys-color-primary`).

## Scope

- 747 names are renamed; 129 are Tailwind's and stay (`--tw-*`, and everything declared in an `@theme` block: `--color-*`, `--text-*`, `--font-sans`, `--breakpoint-*`, `--radius-panel*`, `--shadow-soft`, `--ease-soft`, `--default-transition-*`). Their right-hand sides are repointed to the new names.
- The roles in `defaults/colors.ts` (`colorRoles`) are written as `--mo-<name>` into `<head>` by `colorsCss` and are declared nowhere in CSS: the rename changes that writer as well. `src/data/colors.json` keys are the role names without the prefix and do not change.
- Table kinds: **S** = an exact M3 token, **S?** = M3's pattern but no such token found, **O** = ours. The "reads" column counts the places a name is written in the repository's tracked files (CSS, TSX class strings, scripts, docs), excluding `docs/superpowers/`, release notes and changesets.

## Owner decisions (17 Nov 2026)

1. **Component tokens match M3** ("We match md3"): `md.comp.<component>.<part>.<attribute>` becomes `--mo-comp-<component>-<part>-<attribute>`, with M3's component and part names, read from the real specs pages. Where M3 prints no token for a part or attribute, ours stays under the same prefix and is listed as O. Result: 153 exact, 271 ours.
2. **Editor and standard-theme tokens** ("agree"): `--theme-*`, `--editor-*`, `--google-*` and `--page-*` become `--mo-comp-<part>-*`, the editor's too, one rule everywhere.
3. **THEME_API and APP_API go from 5 to 6, and `APP_APIS` then lists only 6** (owner, 17 Nov: "yes"). It is the last, separate commit of the rename PRs (3g below), with the contract tests (`lib/contracts.mjs` and the tests that read it) and a release note for site owners and theme and app authors, in en-US and da-DK, saying that the old names stop working. The store (morpheme-appstore) offers only the contracts the editor reads, so what must change there (the catalog's `app` and `theme` levels and any stored themes and apps written to 5) is for the PM to check: this session does not read that repository.

Totals: **280 exact M3 (S), 22 M3 pattern without a token (S?), 445 ours (O)**, of 747 renamed names.

## How the rename is split

Each PR is its own branch into 0.18, renames its names everywhere in the repository (CSS, TSX class strings, scripts, docs, demo, starter), removes the old names (no aliases), and carries the computed-value proof with the table's rows for that PR as the old-to-new map: every old name's computed value on the base equals the new name's value on the branch, on every distinct element of every demo page (light and dark, three widths), and all other computed properties are identical. A check, added with 3a, fails on any old name of a merged PR that comes back.

| PR | Names | Contents |
| :--- | ---: | :--- |
| 3a | sys, ref | colour roles (also `colorsCss` and `defaults/colors.ts`), shape, elevation, state, motion, typescale, space, density, grid, size, block, section, page; the `@theme` right-hand sides |
| 3b | comp | buttons: button, icon-button, split-button, button-group, fab, segmented-button, toolbar, app bar |
| 3c | comp | cards, lists (and `list-expand`, `list-segmented`), chips, carousel, grid |
| 3d | comp | inputs: text-field, checkbox, radio, switch, slider, search, date-picker, time-picker |
| 3e | comp | navigation (bar, rail, drawer), menu, dialog, snackbar, tooltip, badge, progress and loading indicator, sheets, divider, lightbox |
| 3f | comp | `--theme-*`, `--editor-*`, `--google-*`, `--page-*` and the rest |
| 3g | none | the contract bump: `THEME_API` and `APP_API` 5 to 6, `APP_APIS` lists only 6, the contract tests, `docs/app-contract.md`, the release note (en-US and da-DK); the last commit, confirmed by the PM before it is pushed |

3a is the widest (its names are written in about 3,700 places in tracked files, the components' in about 2,300), so it goes first and alone; each later PR touches only its own components' CSS and the places that read them. 3a also repoints the right-hand sides of the Tailwind `@theme` aliases that read renamed names.

## Readers outside this repository

The PM's scan of 17 Nov 2026 (it replaces the 16 Nov figure of 334 reads of 169 names and the note that Venus only reads `.type-body-medium`, which was about the type classes, not tokens): the left-hand column of `docs/superpowers/plans/token-rename/map.json` (747 names), whole names only (`(?![\w-])` boundary), on the main branch of each repository, without `node_modules` and lock files. This session did not read these repositories.

- **morpheme-apps:** 379 reads of 178 old names. `themes/venus/styles`: `tokens.css` 63, `controls.css` 92, `lists.css` 44, `panels.css` 42, `header.css` 20, `footer.css` 17, `blog.css` 1 (all Venus, 7 files); `apps/calendly/parts/calendly.ts` 3; `scripts/variable-names.test.mjs`, one doc and `CLAUDE.md` name some. Venus is the one theme and Calendly the one app.
- **morpheme-website:** no code. 516 text hits only, in `docs/superpowers` (14 files), `docs/rules.md`, `docs/editor.md`, `CLAUDE.md` and two `.agents` skills.
- **Sarashjemmesidedata:** 516 reads of 299 names, in `src/themes/theme_fa395ad84690acbd` (her installed copy of Venus, 6 files), `src/apps/sara` (1), one installed store app (1) and `docs/editor.md`. Those installed copies change only when she updates Venus or the app from the store at api 6.

So the code exposure is Venus (7 files), Calendly, Sara's app and one store app: each needs the rename and a re-release at api 6, which the PM routes in morpheme-apps. Every name they read is in the table, so nothing is missing from it.

## 3g: the store checklist

From the PM's reading of `src/releases.js` in morpheme-appstore (main), 17 Nov 2026; this session does not read that repository.

1. **The catalog is served per exact contract.** `apisFor(type, number)` returns `[4, 5]` for an app asking for 5 and `[number]` for everything else, and `storeCatalog` selects `releases.api IN (...)`. With `APP_API` and `THEME_API` at 6 the CMS asks `?app=6&theme=6` and gets nothing until an app or theme is released at api 6. No store code has to change for themes (`[6]`). For apps `apisFor('app', 6)` correctly stays `[6]`: apps on 4 and 5 are not offered to an editor at 6, as the owner wants, because they would draw without colours. The `[4, 5]` rule for 5 stays, so older CMS versions keep working. The only store change worth adding is a store test for `?app=6` (a PR in morpheme-appstore, not in this repository).
2. **Releases are made by `npm run release` in morpheme-apps**, which reads `THEME_API` and `APP_API` from the installed CMS. Venus and every store app must be re-released at api 6 after their tokens are renamed: an owner-only action. The 3g release note and PR text say that the store catalog is empty for contract 6 until then.
3. **Stored releases at api 4 and 5 stay for ever** and are not touched.

## How PR 3 will be proved

The computed-value script of PR 1 and PR 2 runs on the built demo before and after with this table as a map: every old name's computed value on every distinct element of every page must equal the new name's value (light and dark, three widths), the computed values of all other CSS properties must be identical, and no old name may remain in the repository (a check that fails on any name in the table's left column, except in release notes and the changelog, which are history).

## The table

Kind S = an exact M3 token (components: the name an M3 specs page prints; colour, shape and type scale: the name `@material/web` 2.5.0 has), S? = M3's pattern but no such token in `@material/web`, O = ours. "Declared" is the number of declarations, "Reads" the places the name is written in tracked files.

### color (47)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-error` | `--mo-sys-color-error` | S | `--md-sys-color-error` | 0 | 6 | M3 colour roles (roles page), md.sys.color.<role> |
| `--mo-error-container` | `--mo-sys-color-error-container` | S | `--md-sys-color-error-container` | 0 | 1 | ″ |
| `--mo-inverse-on-surface` | `--mo-sys-color-inverse-on-surface` | S | `--md-sys-color-inverse-on-surface` | 0 | 12 | ″ |
| `--mo-inverse-primary` | `--mo-sys-color-inverse-primary` | S | `--md-sys-color-inverse-primary` | 0 | 5 | ″ |
| `--mo-inverse-surface` | `--mo-sys-color-inverse-surface` | S | `--md-sys-color-inverse-surface` | 0 | 8 | ″ |
| `--mo-on-error` | `--mo-sys-color-on-error` | S | `--md-sys-color-on-error` | 0 | 2 | ″ |
| `--mo-on-error-container` | `--mo-sys-color-on-error-container` | S | `--md-sys-color-on-error-container` | 0 | 1 | ″ |
| `--mo-on-primary` | `--mo-sys-color-on-primary` | S | `--md-sys-color-on-primary` | 1 | 21 | ″ |
| `--mo-on-primary-container` | `--mo-sys-color-on-primary-container` | S | `--md-sys-color-on-primary-container` | 1 | 17 | ″ |
| `--mo-on-primary-fixed` | `--mo-sys-color-on-primary-fixed` | S | `--md-sys-color-on-primary-fixed` | 0 | 2 | ″ |
| `--mo-on-primary-fixed-variant` | `--mo-sys-color-on-primary-fixed-variant` | S | `--md-sys-color-on-primary-fixed-variant` | 0 | 2 | ″ |
| `--mo-on-secondary` | `--mo-sys-color-on-secondary` | S | `--md-sys-color-on-secondary` | 1 | 13 | ″ |
| `--mo-on-secondary-container` | `--mo-sys-color-on-secondary-container` | S | `--md-sys-color-on-secondary-container` | 1 | 29 | ″ |
| `--mo-on-secondary-fixed` | `--mo-sys-color-on-secondary-fixed` | S | `--md-sys-color-on-secondary-fixed` | 0 | 1 | ″ |
| `--mo-on-secondary-fixed-variant` | `--mo-sys-color-on-secondary-fixed-variant` | S | `--md-sys-color-on-secondary-fixed-variant` | 0 | 1 | ″ |
| `--mo-on-surface` | `--mo-sys-color-on-surface` | S | `--md-sys-color-on-surface` | 4 | 71 | ″ |
| `--mo-on-surface-variant` | `--mo-sys-color-on-surface-variant` | S | `--md-sys-color-on-surface-variant` | 4 | 59 | ″ |
| `--mo-on-tertiary` | `--mo-sys-color-on-tertiary` | S | `--md-sys-color-on-tertiary` | 1 | 11 | ″ |
| `--mo-on-tertiary-container` | `--mo-sys-color-on-tertiary-container` | S | `--md-sys-color-on-tertiary-container` | 1 | 15 | ″ |
| `--mo-on-tertiary-fixed` | `--mo-sys-color-on-tertiary-fixed` | S | `--md-sys-color-on-tertiary-fixed` | 0 | 1 | ″ |
| `--mo-on-tertiary-fixed-variant` | `--mo-sys-color-on-tertiary-fixed-variant` | S | `--md-sys-color-on-tertiary-fixed-variant` | 0 | 1 | ″ |
| `--mo-outline` | `--mo-sys-color-outline` | S | `--md-sys-color-outline` | 1 | 14 | ″ |
| `--mo-outline-variant` | `--mo-sys-color-outline-variant` | S | `--md-sys-color-outline-variant` | 1 | 16 | ″ |
| `--mo-primary` | `--mo-sys-color-primary` | S | `--md-sys-color-primary` | 4 | 91 | ″ |
| `--mo-primary-container` | `--mo-sys-color-primary-container` | S | `--md-sys-color-primary-container` | 1 | 10 | ″ |
| `--mo-primary-fixed` | `--mo-sys-color-primary-fixed` | S | `--md-sys-color-primary-fixed` | 0 | 2 | ″ |
| `--mo-primary-fixed-dim` | `--mo-sys-color-primary-fixed-dim` | S | `--md-sys-color-primary-fixed-dim` | 0 | 2 | ″ |
| `--mo-primary-hover` | `--mo-sys-color-primary-hover` | O |  | 1 | 6 | ours: a state colour |
| `--mo-scrim` | `--mo-sys-color-scrim` | S | `--md-sys-color-scrim` | 0 | 3 | ″ |
| `--mo-scrim-overlay` | `--mo-sys-color-scrim-overlay` | O |  | 1 | 7 | ours: the scrim as drawn over the page |
| `--mo-secondary` | `--mo-sys-color-secondary` | S | `--md-sys-color-secondary` | 1 | 20 | ″ |
| `--mo-secondary-container` | `--mo-sys-color-secondary-container` | S | `--md-sys-color-secondary-container` | 1 | 27 | ″ |
| `--mo-secondary-fixed` | `--mo-sys-color-secondary-fixed` | S | `--md-sys-color-secondary-fixed` | 0 | 1 | ″ |
| `--mo-secondary-fixed-dim` | `--mo-sys-color-secondary-fixed-dim` | S | `--md-sys-color-secondary-fixed-dim` | 0 | 1 | ″ |
| `--mo-shadow` | `--mo-sys-color-shadow` | S | `--md-sys-color-shadow` | 0 | 53 | ″ |
| `--mo-surface` | `--mo-sys-color-surface` | S | `--md-sys-color-surface` | 1 | 33 | ″ |
| `--mo-surface-bright` | `--mo-sys-color-surface-bright` | S | `--md-sys-color-surface-bright` | 1 | 3 | ″ |
| `--mo-surface-container` | `--mo-sys-color-surface-container` | S | `--md-sys-color-surface-container` | 1 | 19 | ″ |
| `--mo-surface-container-high` | `--mo-sys-color-surface-container-high` | S | `--md-sys-color-surface-container-high` | 1 | 41 | ″ |
| `--mo-surface-container-highest` | `--mo-sys-color-surface-container-highest` | S | `--md-sys-color-surface-container-highest` | 1 | 17 | ″ |
| `--mo-surface-container-low` | `--mo-sys-color-surface-container-low` | S | `--md-sys-color-surface-container-low` | 1 | 11 | ″ |
| `--mo-surface-container-lowest` | `--mo-sys-color-surface-container-lowest` | S | `--md-sys-color-surface-container-lowest` | 1 | 8 | ″ |
| `--mo-surface-dim` | `--mo-sys-color-surface-dim` | S | `--md-sys-color-surface-dim` | 1 | 3 | ″ |
| `--mo-tertiary` | `--mo-sys-color-tertiary` | S | `--md-sys-color-tertiary` | 1 | 15 | ″ |
| `--mo-tertiary-container` | `--mo-sys-color-tertiary-container` | S | `--md-sys-color-tertiary-container` | 1 | 9 | ″ |
| `--mo-tertiary-fixed` | `--mo-sys-color-tertiary-fixed` | S | `--md-sys-color-tertiary-fixed` | 0 | 1 | ″ |
| `--mo-tertiary-fixed-dim` | `--mo-sys-color-tertiary-fixed-dim` | S | `--md-sys-color-tertiary-fixed-dim` | 0 | 1 | ″ |

### shape (10)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-shape-extra-extra-large` | `--mo-sys-shape-corner-extra-extra-large` | S? | not found (M3 Expressive step) | 1 | 1 | M3 corner scale step names (corner-radius-scale page: extra small … extra extra large, full, none) |
| `--mo-shape-extra-large` | `--mo-sys-shape-corner-extra-large` | S | `--md-sys-shape-corner-extra-large` | 1 | 15 | ″ |
| `--mo-shape-extra-large-increased` | `--mo-sys-shape-corner-extra-large-increased` | S? | not found (M3 Expressive step) | 1 | 1 | ″ |
| `--mo-shape-extra-small` | `--mo-sys-shape-corner-extra-small` | S | `--md-sys-shape-corner-extra-small` | 1 | 16 | ″ |
| `--mo-shape-full` | `--mo-sys-shape-corner-full` | S | `--md-sys-shape-corner-full` | 2 | 80 | ″ |
| `--mo-shape-large` | `--mo-sys-shape-corner-large` | S | `--md-sys-shape-corner-large` | 1 | 25 | ″ |
| `--mo-shape-large-increased` | `--mo-sys-shape-corner-large-increased` | S? | not found (M3 Expressive step) | 1 | 3 | ″ |
| `--mo-shape-medium` | `--mo-sys-shape-corner-medium` | S | `--md-sys-shape-corner-medium` | 1 | 23 | ″ |
| `--mo-shape-none` | `--mo-sys-shape-corner-none` | S | `--md-sys-shape-corner-none` | 1 | 6 | ″ |
| `--mo-shape-small` | `--mo-sys-shape-corner-small` | S | `--md-sys-shape-corner-small` | 1 | 15 | ″ |

### elevation (17)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-elevation-0-color` | `--mo-sys-elevation-level0-color` | O | `--md-sys-elevation-level0` exists; our suffix is not M3's | 2 | 13 | M3 has levels 0 to 5 (token md.sys.elevation.levelN is a distance); our level has a colour and two shadows |
| `--mo-elevation-0-shadow` | `--mo-sys-elevation-level0-shadow` | O | `--md-sys-elevation-level0` exists; our suffix is not M3's | 2 | 35 | ″ |
| `--mo-elevation-1-color` | `--mo-sys-elevation-level1-color` | O | `--md-sys-elevation-level1` exists; our suffix is not M3's | 2 | 17 | ″ |
| `--mo-elevation-1-rest-shadow` | `--mo-sys-elevation-level1-rest-shadow` | O | `--md-sys-elevation-level1` exists; our suffix is not M3's | 2 | 30 | ″ |
| `--mo-elevation-1-shadow` | `--mo-sys-elevation-level1-shadow` | O | `--md-sys-elevation-level1` exists; our suffix is not M3's | 4 | 26 | ″ |
| `--mo-elevation-2-color` | `--mo-sys-elevation-level2-color` | O | `--md-sys-elevation-level2` exists; our suffix is not M3's | 2 | 18 | ″ |
| `--mo-elevation-2-rest-shadow` | `--mo-sys-elevation-level2-rest-shadow` | O | `--md-sys-elevation-level2` exists; our suffix is not M3's | 2 | 13 | ″ |
| `--mo-elevation-2-shadow` | `--mo-sys-elevation-level2-shadow` | O | `--md-sys-elevation-level2` exists; our suffix is not M3's | 4 | 23 | ″ |
| `--mo-elevation-3-color` | `--mo-sys-elevation-level3-color` | O | `--md-sys-elevation-level3` exists; our suffix is not M3's | 2 | 9 | ″ |
| `--mo-elevation-3-rest-shadow` | `--mo-sys-elevation-level3-rest-shadow` | O | `--md-sys-elevation-level3` exists; our suffix is not M3's | 2 | 18 | ″ |
| `--mo-elevation-3-shadow` | `--mo-sys-elevation-level3-shadow` | O | `--md-sys-elevation-level3` exists; our suffix is not M3's | 4 | 18 | ″ |
| `--mo-elevation-4-color` | `--mo-sys-elevation-level4-color` | O | `--md-sys-elevation-level4` exists; our suffix is not M3's | 2 | 3 | ″ |
| `--mo-elevation-4-rest-shadow` | `--mo-sys-elevation-level4-rest-shadow` | O | `--md-sys-elevation-level4` exists; our suffix is not M3's | 2 | 3 | ″ |
| `--mo-elevation-4-shadow` | `--mo-sys-elevation-level4-shadow` | O | `--md-sys-elevation-level4` exists; our suffix is not M3's | 4 | 17 | ″ |
| `--mo-elevation-5-color` | `--mo-sys-elevation-level5-color` | O | `--md-sys-elevation-level5` exists; our suffix is not M3's | 2 | 4 | ″ |
| `--mo-elevation-5-rest-shadow` | `--mo-sys-elevation-level5-rest-shadow` | O | `--md-sys-elevation-level5` exists; our suffix is not M3's | 2 | 3 | ″ |
| `--mo-elevation-5-shadow` | `--mo-sys-elevation-level5-shadow` | O | `--md-sys-elevation-level5` exists; our suffix is not M3's | 4 | 7 | ″ |

### state (2)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-hover` | `--mo-sys-state-mo-hover-layer` | O | `--md-sys-state-hover-state-layer-opacity` (an opacity); ours is the layer colour | 1 | 23 | M3 state tokens are opacities (hover 8%, pressed 10%); ours are the layer colour |
| `--mo-pressed` | `--mo-sys-state-mo-pressed-layer` | O | `--md-sys-state-hover-state-layer-opacity` (an opacity); ours is the layer colour | 1 | 13 | ″ |

### motion (12)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--motion-effects` | `--mo-sys-motion-spring-default-effects` | S? | not found (package has easing and duration, no springs) | 1 | 97 | M3 spring composite tokens (md.sys.motion.spring.<speed>.<spatial|effects>); the -duration part is ours |
| `--motion-effects-duration` | `--mo-sys-motion-spring-default-effects-duration` | S? | not found (package has easing and duration, no springs) | 1 | 3 | ″ |
| `--motion-effects-fast` | `--mo-sys-motion-spring-fast-effects` | S? | not found (package has easing and duration, no springs) | 1 | 17 | ″ |
| `--motion-effects-fast-duration` | `--mo-sys-motion-spring-fast-effects-duration` | S? | not found (package has easing and duration, no springs) | 1 | 1 | ″ |
| `--motion-effects-slow` | `--mo-sys-motion-spring-slow-effects` | S? | not found (package has easing and duration, no springs) | 1 | 5 | ″ |
| `--motion-effects-slow-duration` | `--mo-sys-motion-spring-slow-effects-duration` | S? | not found (package has easing and duration, no springs) | 1 | 2 | ″ |
| `--motion-spatial` | `--mo-sys-motion-spring-default-spatial` | S? | not found (package has easing and duration, no springs) | 1 | 43 | ″ |
| `--motion-spatial-duration` | `--mo-sys-motion-spring-default-spatial-duration` | S? | not found (package has easing and duration, no springs) | 1 | 4 | ″ |
| `--motion-spatial-fast` | `--mo-sys-motion-spring-fast-spatial` | S? | not found (package has easing and duration, no springs) | 1 | 38 | ″ |
| `--motion-spatial-fast-duration` | `--mo-sys-motion-spring-fast-spatial-duration` | S? | not found (package has easing and duration, no springs) | 1 | 6 | ″ |
| `--motion-spatial-slow` | `--mo-sys-motion-spring-slow-spatial` | S? | not found (package has easing and duration, no springs) | 1 | 5 | ″ |
| `--motion-spatial-slow-duration` | `--mo-sys-motion-spring-slow-spatial-duration` | S? | not found (package has easing and duration, no springs) | 1 | 1 | ″ |

### typescale (82)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--type-body-large-font` | `--mo-sys-typescale-body-large-font` | S | `--md-sys-typescale-body-large-font` | 1 | 1 | M3 md.sys.typescale.<role>-<size>; attributes size, line-height, weight, tracking, font |
| `--type-body-large-line-height` | `--mo-sys-typescale-body-large-line-height` | S | `--md-sys-typescale-body-large-line-height` | 1 | 20 | ″ |
| `--type-body-large-size` | `--mo-sys-typescale-body-large-size` | S | `--md-sys-typescale-body-large-size` | 1 | 23 | ″ |
| `--type-body-large-tracking` | `--mo-sys-typescale-body-large-tracking` | S | `--md-sys-typescale-body-large-tracking` | 1 | 20 | ″ |
| `--type-body-large-weight` | `--mo-sys-typescale-body-large-weight` | S | `--md-sys-typescale-body-large-weight` | 1 | 20 | ″ |
| `--type-body-medium-font` | `--mo-sys-typescale-body-medium-font` | S | `--md-sys-typescale-body-medium-font` | 1 | 1 | ″ |
| `--type-body-medium-line-height` | `--mo-sys-typescale-body-medium-line-height` | S | `--md-sys-typescale-body-medium-line-height` | 1 | 34 | ″ |
| `--type-body-medium-size` | `--mo-sys-typescale-body-medium-size` | S | `--md-sys-typescale-body-medium-size` | 1 | 41 | ″ |
| `--type-body-medium-tracking` | `--mo-sys-typescale-body-medium-tracking` | S | `--md-sys-typescale-body-medium-tracking` | 1 | 34 | ″ |
| `--type-body-medium-weight` | `--mo-sys-typescale-body-medium-weight` | S | `--md-sys-typescale-body-medium-weight` | 1 | 29 | ″ |
| `--type-body-small-font` | `--mo-sys-typescale-body-small-font` | S | `--md-sys-typescale-body-small-font` | 1 | 1 | ″ |
| `--type-body-small-line-height` | `--mo-sys-typescale-body-small-line-height` | S | `--md-sys-typescale-body-small-line-height` | 1 | 9 | ″ |
| `--type-body-small-size` | `--mo-sys-typescale-body-small-size` | S | `--md-sys-typescale-body-small-size` | 1 | 13 | ″ |
| `--type-body-small-tracking` | `--mo-sys-typescale-body-small-tracking` | S | `--md-sys-typescale-body-small-tracking` | 1 | 9 | ″ |
| `--type-body-small-weight` | `--mo-sys-typescale-body-small-weight` | S | `--md-sys-typescale-body-small-weight` | 1 | 9 | ″ |
| `--type-display-large-font` | `--mo-sys-typescale-display-large-font` | S | `--md-sys-typescale-display-large-font` | 1 | 1 | ″ |
| `--type-display-large-line-height` | `--mo-sys-typescale-display-large-line-height` | S | `--md-sys-typescale-display-large-line-height` | 1 | 5 | ″ |
| `--type-display-large-size` | `--mo-sys-typescale-display-large-size` | S | `--md-sys-typescale-display-large-size` | 1 | 8 | ″ |
| `--type-display-large-tracking` | `--mo-sys-typescale-display-large-tracking` | S | `--md-sys-typescale-display-large-tracking` | 1 | 5 | ″ |
| `--type-display-large-weight` | `--mo-sys-typescale-display-large-weight` | S | `--md-sys-typescale-display-large-weight` | 1 | 6 | ″ |
| `--type-display-medium-font` | `--mo-sys-typescale-display-medium-font` | S | `--md-sys-typescale-display-medium-font` | 1 | 1 | ″ |
| `--type-display-medium-line-height` | `--mo-sys-typescale-display-medium-line-height` | S | `--md-sys-typescale-display-medium-line-height` | 1 | 7 | ″ |
| `--type-display-medium-size` | `--mo-sys-typescale-display-medium-size` | S | `--md-sys-typescale-display-medium-size` | 1 | 7 | ″ |
| `--type-display-medium-tracking` | `--mo-sys-typescale-display-medium-tracking` | S | `--md-sys-typescale-display-medium-tracking` | 1 | 8 | ″ |
| `--type-display-medium-weight` | `--mo-sys-typescale-display-medium-weight` | S | `--md-sys-typescale-display-medium-weight` | 1 | 8 | ″ |
| `--type-display-small-font` | `--mo-sys-typescale-display-small-font` | S | `--md-sys-typescale-display-small-font` | 1 | 1 | ″ |
| `--type-display-small-line-height` | `--mo-sys-typescale-display-small-line-height` | S | `--md-sys-typescale-display-small-line-height` | 1 | 7 | ″ |
| `--type-display-small-size` | `--mo-sys-typescale-display-small-size` | S | `--md-sys-typescale-display-small-size` | 1 | 8 | ″ |
| `--type-display-small-tracking` | `--mo-sys-typescale-display-small-tracking` | S | `--md-sys-typescale-display-small-tracking` | 1 | 7 | ″ |
| `--type-display-small-weight` | `--mo-sys-typescale-display-small-weight` | S | `--md-sys-typescale-display-small-weight` | 1 | 7 | ″ |
| `--type-headline-large-font` | `--mo-sys-typescale-headline-large-font` | S | `--md-sys-typescale-headline-large-font` | 1 | 1 | ″ |
| `--type-headline-large-line-height` | `--mo-sys-typescale-headline-large-line-height` | S | `--md-sys-typescale-headline-large-line-height` | 1 | 7 | ″ |
| `--type-headline-large-size` | `--mo-sys-typescale-headline-large-size` | S | `--md-sys-typescale-headline-large-size` | 1 | 8 | ″ |
| `--type-headline-large-tracking` | `--mo-sys-typescale-headline-large-tracking` | S | `--md-sys-typescale-headline-large-tracking` | 1 | 8 | ″ |
| `--type-headline-large-weight` | `--mo-sys-typescale-headline-large-weight` | S | `--md-sys-typescale-headline-large-weight` | 1 | 8 | ″ |
| `--type-headline-medium-font` | `--mo-sys-typescale-headline-medium-font` | S | `--md-sys-typescale-headline-medium-font` | 1 | 1 | ″ |
| `--type-headline-medium-line-height` | `--mo-sys-typescale-headline-medium-line-height` | S | `--md-sys-typescale-headline-medium-line-height` | 1 | 7 | ″ |
| `--type-headline-medium-size` | `--mo-sys-typescale-headline-medium-size` | S | `--md-sys-typescale-headline-medium-size` | 1 | 7 | ″ |
| `--type-headline-medium-tracking` | `--mo-sys-typescale-headline-medium-tracking` | S | `--md-sys-typescale-headline-medium-tracking` | 1 | 6 | ″ |
| `--type-headline-medium-weight` | `--mo-sys-typescale-headline-medium-weight` | S | `--md-sys-typescale-headline-medium-weight` | 1 | 6 | ″ |
| `--type-headline-small-font` | `--mo-sys-typescale-headline-small-font` | S | `--md-sys-typescale-headline-small-font` | 1 | 1 | ″ |
| `--type-headline-small-line-height` | `--mo-sys-typescale-headline-small-line-height` | S | `--md-sys-typescale-headline-small-line-height` | 1 | 17 | ″ |
| `--type-headline-small-size` | `--mo-sys-typescale-headline-small-size` | S | `--md-sys-typescale-headline-small-size` | 1 | 19 | ″ |
| `--type-headline-small-tracking` | `--mo-sys-typescale-headline-small-tracking` | S | `--md-sys-typescale-headline-small-tracking` | 1 | 16 | ″ |
| `--type-headline-small-weight` | `--mo-sys-typescale-headline-small-weight` | S | `--md-sys-typescale-headline-small-weight` | 1 | 16 | ″ |
| `--type-label-large-font` | `--mo-sys-typescale-label-large-font` | S | `--md-sys-typescale-label-large-font` | 1 | 1 | ″ |
| `--type-label-large-line-height` | `--mo-sys-typescale-label-large-line-height` | S | `--md-sys-typescale-label-large-line-height` | 1 | 20 | ″ |
| `--type-label-large-prominent-weight` | `--mo-sys-typescale-label-large-prominent-weight` | S? | not found | 1 | 1 | ″ |
| `--type-label-large-size` | `--mo-sys-typescale-label-large-size` | S | `--md-sys-typescale-label-large-size` | 1 | 26 | ″ |
| `--type-label-large-tracking` | `--mo-sys-typescale-label-large-tracking` | S | `--md-sys-typescale-label-large-tracking` | 1 | 19 | ″ |
| `--type-label-large-weight` | `--mo-sys-typescale-label-large-weight` | S | `--md-sys-typescale-label-large-weight` | 1 | 20 | ″ |
| `--type-label-medium-font` | `--mo-sys-typescale-label-medium-font` | S | `--md-sys-typescale-label-medium-font` | 1 | 1 | ″ |
| `--type-label-medium-line-height` | `--mo-sys-typescale-label-medium-line-height` | S | `--md-sys-typescale-label-medium-line-height` | 1 | 16 | ″ |
| `--type-label-medium-prominent-weight` | `--mo-sys-typescale-label-medium-prominent-weight` | S? | not found | 1 | 1 | ″ |
| `--type-label-medium-size` | `--mo-sys-typescale-label-medium-size` | S | `--md-sys-typescale-label-medium-size` | 1 | 17 | ″ |
| `--type-label-medium-tracking` | `--mo-sys-typescale-label-medium-tracking` | S | `--md-sys-typescale-label-medium-tracking` | 1 | 14 | ″ |
| `--type-label-medium-weight` | `--mo-sys-typescale-label-medium-weight` | S | `--md-sys-typescale-label-medium-weight` | 1 | 15 | ″ |
| `--type-label-small-font` | `--mo-sys-typescale-label-small-font` | S | `--md-sys-typescale-label-small-font` | 1 | 1 | ″ |
| `--type-label-small-line-height` | `--mo-sys-typescale-label-small-line-height` | S | `--md-sys-typescale-label-small-line-height` | 1 | 7 | ″ |
| `--type-label-small-prominent-weight` | `--mo-sys-typescale-label-small-prominent-weight` | S? | not found | 1 | 1 | ″ |
| `--type-label-small-size` | `--mo-sys-typescale-label-small-size` | S | `--md-sys-typescale-label-small-size` | 1 | 8 | ″ |
| `--type-label-small-tracking` | `--mo-sys-typescale-label-small-tracking` | S | `--md-sys-typescale-label-small-tracking` | 1 | 8 | ″ |
| `--type-label-small-weight` | `--mo-sys-typescale-label-small-weight` | S | `--md-sys-typescale-label-small-weight` | 1 | 8 | ″ |
| `--type-lead-line-height` | `--mo-sys-typescale-lead-line-height` | S? | not found | 1 | 4 | ″ |
| `--type-lead-size` | `--mo-sys-typescale-lead-size` | S? | not found | 1 | 4 | ″ |
| `--type-lead-tracking` | `--mo-sys-typescale-lead-tracking` | S? | not found | 1 | 4 | ″ |
| `--type-lead-weight` | `--mo-sys-typescale-lead-weight` | S? | not found | 1 | 4 | ″ |
| `--type-title-large-font` | `--mo-sys-typescale-title-large-font` | S | `--md-sys-typescale-title-large-font` | 1 | 1 | ″ |
| `--type-title-large-line-height` | `--mo-sys-typescale-title-large-line-height` | S | `--md-sys-typescale-title-large-line-height` | 1 | 18 | ″ |
| `--type-title-large-size` | `--mo-sys-typescale-title-large-size` | S | `--md-sys-typescale-title-large-size` | 1 | 17 | ″ |
| `--type-title-large-tracking` | `--mo-sys-typescale-title-large-tracking` | S | `--md-sys-typescale-title-large-tracking` | 1 | 17 | ″ |
| `--type-title-large-weight` | `--mo-sys-typescale-title-large-weight` | S | `--md-sys-typescale-title-large-weight` | 1 | 17 | ″ |
| `--type-title-medium-font` | `--mo-sys-typescale-title-medium-font` | S | `--md-sys-typescale-title-medium-font` | 1 | 1 | ″ |
| `--type-title-medium-line-height` | `--mo-sys-typescale-title-medium-line-height` | S | `--md-sys-typescale-title-medium-line-height` | 1 | 14 | ″ |
| `--type-title-medium-size` | `--mo-sys-typescale-title-medium-size` | S | `--md-sys-typescale-title-medium-size` | 1 | 17 | ″ |
| `--type-title-medium-tracking` | `--mo-sys-typescale-title-medium-tracking` | S | `--md-sys-typescale-title-medium-tracking` | 1 | 16 | ″ |
| `--type-title-medium-weight` | `--mo-sys-typescale-title-medium-weight` | S | `--md-sys-typescale-title-medium-weight` | 1 | 16 | ″ |
| `--type-title-small-font` | `--mo-sys-typescale-title-small-font` | S | `--md-sys-typescale-title-small-font` | 1 | 1 | ″ |
| `--type-title-small-line-height` | `--mo-sys-typescale-title-small-line-height` | S | `--md-sys-typescale-title-small-line-height` | 1 | 7 | ″ |
| `--type-title-small-size` | `--mo-sys-typescale-title-small-size` | S | `--md-sys-typescale-title-small-size` | 1 | 8 | ″ |
| `--type-title-small-tracking` | `--mo-sys-typescale-title-small-tracking` | S | `--md-sys-typescale-title-small-tracking` | 1 | 8 | ″ |
| `--type-title-small-weight` | `--mo-sys-typescale-title-small-weight` | S | `--md-sys-typescale-title-small-weight` | 1 | 8 | ″ |

### space (18)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-space-0` | `--mo-ref-space-0` | O |  | 1 | 1 | M3 has a spacing page with space100 = 8dp but prints no token names |
| `--mo-space-100` | `--mo-ref-space-100` | O |  | 1 | 2 | ″ |
| `--mo-space-125` | `--mo-ref-space-125` | O |  | 1 | 1 | ″ |
| `--mo-space-150` | `--mo-ref-space-150` | O |  | 1 | 8 | ″ |
| `--mo-space-175` | `--mo-ref-space-175` | O |  | 1 | 1 | ″ |
| `--mo-space-200` | `--mo-ref-space-200` | O |  | 1 | 8 | ″ |
| `--mo-space-25` | `--mo-ref-space-25` | O |  | 1 | 1 | ″ |
| `--mo-space-250` | `--mo-ref-space-250` | O |  | 1 | 8 | ″ |
| `--mo-space-300` | `--mo-ref-space-300` | O |  | 1 | 9 | ″ |
| `--mo-space-400` | `--mo-ref-space-400` | O |  | 1 | 9 | ″ |
| `--mo-space-450` | `--mo-ref-space-450` | O |  | 1 | 1 | ″ |
| `--mo-space-50` | `--mo-ref-space-50` | O |  | 1 | 1 | ″ |
| `--mo-space-500` | `--mo-ref-space-500` | O |  | 1 | 6 | ″ |
| `--mo-space-600` | `--mo-ref-space-600` | O |  | 1 | 1 | ″ |
| `--mo-space-700` | `--mo-ref-space-700` | O |  | 1 | 1 | ″ |
| `--mo-space-75` | `--mo-ref-space-75` | O |  | 1 | 1 | ″ |
| `--mo-space-800` | `--mo-ref-space-800` | O |  | 1 | 1 | ″ |
| `--mo-space-900` | `--mo-ref-space-900` | O |  | 1 | 1 | ″ |

### density (6)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-density` | `--mo-sys-density` | O |  | 3 | 29 | M3 has no density tokens |
| `--mo-density-base` | `--mo-sys-density-base` | O |  | 2 | 17 | ″ |
| `--mo-density-focus` | `--mo-sys-density-focus` | O |  | 3 | 7 | ″ |
| `--mo-density-layout` | `--mo-sys-density-layout` | O |  | 3 | 66 | ″ |
| `--mo-density-step` | `--mo-sys-density-step` | O |  | 1 | 61 | ″ |
| `--mo-density-user` | `--mo-sys-density-user` | O |  | 5 | 18 | ″ |

### grid (3)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-grid-gutter` | `--mo-sys-grid-gutter` | O |  | 2 | 23 | M3 layout: margins, gutters, columns; no token names |
| `--mo-grid-layout-columns` | `--mo-sys-grid-layout-columns` | O |  | 3 | 7 | ″ |
| `--mo-grid-margin` | `--mo-sys-grid-margin` | O |  | 2 | 18 | ″ |

### size (1)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-target` | `--mo-sys-target-size` | O |  | 3 | 19 |  |

### block, section, page (61)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--block-accent` | `--mo-sys-block-accent` | O |  | 6 | 132 | ours: M3 has no name (block and section variables of the standard blocks) |
| `--block-accent-hover` | `--mo-sys-block-accent-hover` | O |  | 3 | 13 | ″ |
| `--block-control-radius` | `--mo-sys-block-control-radius` | O |  | 3 | 20 | ″ |
| `--block-ease` | `--mo-sys-block-ease` | O |  | 3 | 9 | ″ |
| `--block-ease-quick` | `--mo-sys-block-ease-quick` | O |  | 1 | 4 | ″ |
| `--block-gutter` | `--mo-sys-block-gutter` | O |  | 2 | 7 | ″ |
| `--block-hero-on-shade` | `--mo-sys-block-hero-on-shade` | O |  | 1 | 5 | ″ |
| `--block-hero-shade` | `--mo-sys-block-hero-shade` | O |  | 1 | 6 | ″ |
| `--block-line` | `--mo-sys-block-line` | O |  | 3 | 62 | ″ |
| `--block-list-column-min` | `--mo-sys-block-list-column-min` | O |  | 2 | 6 | ″ |
| `--block-list-layer-room` | `--mo-sys-block-list-layer-room` | O |  | 1 | 4 | ″ |
| `--block-list-measure-max` | `--mo-sys-block-list-measure-max` | O |  | 1 | 5 | ″ |
| `--block-muted` | `--mo-sys-block-muted` | O |  | 6 | 82 | ″ |
| `--block-on-accent` | `--mo-sys-block-on-accent` | O |  | 3 | 41 | ″ |
| `--block-on-primary` | `--mo-sys-block-on-primary` | O |  | 2 | 12 | ″ |
| `--block-on-secondary` | `--mo-sys-block-on-secondary` | O |  | 2 | 11 | ″ |
| `--block-on-tertiary` | `--mo-sys-block-on-tertiary` | O |  | 2 | 11 | ″ |
| `--block-page-width` | `--mo-sys-block-page-width` | O |  | 1 | 4 | ″ |
| `--block-primary` | `--mo-sys-block-primary` | O |  | 2 | 10 | ″ |
| `--block-radius` | `--mo-sys-block-radius` | O |  | 3 | 61 | ″ |
| `--block-radius-small` | `--mo-sys-block-radius-small` | O |  | 2 | 65 | ″ |
| `--block-secondary` | `--mo-sys-block-secondary` | O |  | 2 | 11 | ″ |
| `--block-section-margin` | `--mo-sys-block-section-margin` | O |  | 1 | 4 | ″ |
| `--block-section-padding` | `--mo-sys-block-section-padding` | O |  | 1 | 5 | ″ |
| `--block-shadow` | `--mo-sys-block-shadow` | O |  | 5 | 12 | ″ |
| `--block-step-gap` | `--mo-sys-block-step-gap` | O |  | 1 | 3 | ″ |
| `--block-stripe` | `--mo-sys-block-stripe` | O |  | 3 | 7 | ″ |
| `--block-surface` | `--mo-sys-block-surface` | O |  | 4 | 56 | ″ |
| `--block-tertiary` | `--mo-sys-block-tertiary` | O |  | 2 | 11 | ″ |
| `--block-text` | `--mo-sys-block-text` | O |  | 6 | 102 | ″ |
| `--block-text-measure-max` | `--mo-sys-block-text-measure-max` | O |  | 1 | 16 | ″ |
| `--block-text-measure-min` | `--mo-sys-block-text-measure-min` | O |  | 1 | 11 | ″ |
| `--block-tint` | `--mo-sys-block-tint` | O |  | 3 | 57 | ″ |
| `--column-end` | `--mo-sys-column-end` | O |  | 3 | 6 | ″ |
| `--column-start` | `--mo-sys-column-start` | O |  | 3 | 7 | ″ |
| `--column-width` | `--mo-sys-column-width` | O |  | 1 | 8 | ″ |
| `--default-transition-duration` | `--mo-sys-default-transition-duration` | O |  | 1 | 1 | ″ |
| `--default-transition-timing-function` | `--mo-sys-default-transition-timing-function` | O |  | 1 | 1 | ″ |
| `--ease` | `--mo-sys-ease` | O |  | 2 | 7 | ″ |
| `--mark-in` | `--mo-sys-mark-in` | O |  | 1 | 3 | ″ |
| `--panel-shadow` | `--mo-sys-panel-shadow` | O |  | 7 | 13 | ″ |
| `--prose-space` | `--mo-sys-prose-space` | O |  | 3 | 11 | ″ |
| `--radius` | `--mo-sys-radius` | O |  | 2 | 14 | ″ |
| `--radius-small` | `--mo-sys-radius-small` | O |  | 2 | 5 | ″ |
| `--section-accent` | `--mo-sys-section-accent` | O |  | 3 | 11 | ″ |
| `--section-container` | `--mo-sys-section-container` | O |  | 6 | 9 | ″ |
| `--section-fill` | `--mo-sys-section-fill` | O |  | 7 | 12 | ″ |
| `--section-inset` | `--mo-sys-section-inset` | O |  | 1 | 3 | ″ |
| `--section-on` | `--mo-sys-section-on` | O |  | 3 | 16 | ″ |
| `--section-on-accent` | `--mo-sys-section-on-accent` | O |  | 3 | 43 | ″ |
| `--section-on-container` | `--mo-sys-section-on-container` | O |  | 6 | 9 | ″ |
| `--section-on-fill` | `--mo-sys-section-on-fill` | O |  | 4 | 5 | ″ |
| `--section-pane-gap` | `--mo-sys-section-pane-gap` | O |  | 1 | 7 | ″ |
| `--section-pane-width` | `--mo-sys-section-pane-width` | O |  | 1 | 8 | ″ |
| `--section-picture-fill` | `--mo-sys-section-picture-fill` | O |  | 1 | 2 | ″ |
| `--section-picture-on-fill` | `--mo-sys-section-picture-on-fill` | O |  | 1 | 9 | ″ |
| `--section-shade` | `--mo-sys-section-shade` | O |  | 7 | 14 | ″ |
| `--section-surface` | `--mo-sys-section-surface` | O |  | 2 | 3 | ″ |
| `--section-text` | `--mo-sys-section-text` | O |  | 2 | 3 | ″ |
| `--tile-fill` | `--mo-sys-tile-fill` | O |  | 4 | 5 | ″ |
| `--tile-on` | `--mo-sys-tile-on` | O |  | 4 | 5 | ″ |

### component (424)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--badge-anchor-inset` | `--mo-comp-badge-anchor-inset` | O | not printed by M3 for this part | 1 | 5 |  |
| `--badge-major` | `--mo-comp-badge-major` | O | not printed by M3 for this part | 3 | 5 |  |
| `--badge-minor` | `--mo-comp-badge-minor` | O | not printed by M3 for this part | 3 | 5 |  |
| `--badge-ok` | `--mo-comp-badge-ok` | O | not printed by M3 for this part | 1 | 4 |  |
| `--badge-radius` | `--mo-comp-badge-shape` | S | `md.comp.badge.shape` (M3 specs page) | 1 | 3 |  |
| `--badge-surface` | `--mo-comp-badge-surface` | O | not printed by M3 for this part | 1 | 3 |  |
| `--badge-text` | `--mo-comp-badge-text` | O | not printed by M3 for this part | 1 | 3 |  |
| `--badge-unknown` | `--mo-comp-badge-unknown` | O | not printed by M3 for this part | 1 | 2 |  |
| `--bottom-sheet-handle` | `--mo-comp-sheet-bottom-docked-drag-handle-color` | S | `md.comp.sheet.bottom.docked.drag-handle.color` (M3 specs page) | 1 | 3 |  |
| `--bottom-sheet-line` | `--mo-comp-bottom-sheet-line` | O | not printed by M3 for this part | 1 | 4 |  |
| `--bottom-sheet-radius` | `--mo-comp-sheet-bottom-docked-container-shape` | S | `md.comp.sheet.bottom.docked.container.shape` (M3 specs page) | 1 | 6 |  |
| `--bottom-sheet-scrim` | `--mo-comp-bottom-sheet-scrim` | O | not printed by M3 for this part | 1 | 3 |  |
| `--button-box` | `--mo-comp-button-box` | O | not printed by M3 for this part | 5 | 12 |  |
| `--button-busy-after` | `--mo-comp-button-busy-after` | O | not printed by M3 for this part | 1 | 5 |  |
| `--button-busy-size` | `--mo-comp-button-busy-size` | O | not printed by M3 for this part | 2 | 5 |  |
| `--button-corners` | `--mo-comp-button-corners` | O | not printed by M3 for this part | 3 | 6 |  |
| `--button-elevated-text` | `--mo-comp-button-elevated-label-text-color` | S | `md.comp.button.elevated.label-text.color` (M3 specs page) | 1 | 2 |  |
| `--button-filled-hover` | `--mo-comp-button-filled-hover` | O | not printed by M3 for this part | 2 | 4 |  |
| `--button-filled-hover-shadow` | `--mo-comp-button-filled-hovered-container-elevation` | S | `md.comp.button.filled.hovered.container.elevation` (M3 specs page); ours is a shadow, M3 a level | 1 | 2 | ours is a shadow, M3 a level |
| `--button-filled-shadow` | `--mo-comp-button-filled-container-elevation` | S | `md.comp.button.filled.container.elevation` (M3 specs page); ours is a shadow, M3 a level | 1 | 5 | ″ |
| `--button-filled-surface` | `--mo-comp-button-filled-container-color` | S | `md.comp.button.filled.container.color` (M3 specs page) | 1 | 4 |  |
| `--button-filled-text` | `--mo-comp-button-filled-label-text-color` | S | `md.comp.button.filled.label-text.color` (M3 specs page) | 1 | 3 |  |
| `--button-font-size` | `--mo-comp-button-font-size` | O | not printed by M3 for this part | 1 | 4 |  |
| `--button-gap` | `--mo-comp-button-medium-icon-label-space` | S | `md.comp.button.medium.icon-label-space` (M3 specs page) | 1 | 3 |  |
| `--button-glyph` | `--mo-comp-button-glyph` | O | not printed by M3 for this part | 4 | 12 |  |
| `--button-group-connected-gap` | `--mo-comp-button-group-connected-gap` | O | not printed by M3 for this part | 1 | 3 |  |
| `--button-group-gap` | `--mo-comp-button-group-standard-medium-between-space` | S | `md.comp.button-group.standard.medium.between-space` (M3 specs page) | 1 | 3 |  |
| `--button-group-inner` | `--mo-comp-button-group-inner` | O | not printed by M3 for this part | 4 | 8 |  |
| `--button-group-inner-radius` | `--mo-comp-button-group-inner-radius` | O | not printed by M3 for this part | 1 | 3 |  |
| `--button-group-large-inner-radius` | `--mo-comp-button-group-large-inner-radius` | O | not printed by M3 for this part | 1 | 2 |  |
| `--button-group-selected-radius` | `--mo-comp-button-group-selected-radius` | O | not printed by M3 for this part | 1 | 3 |  |
| `--button-group-xlarge-inner-radius` | `--mo-comp-button-group-xlarge-inner-radius` | O | not printed by M3 for this part | 1 | 2 |  |
| `--button-group-xsmall-inner-radius` | `--mo-comp-button-group-xsmall-inner-radius` | O | not printed by M3 for this part | 1 | 3 |  |
| `--button-height` | `--mo-comp-button-medium-container-height` | S | `md.comp.button.medium.container.height` (M3 specs page) | 1 | 5 |  |
| `--button-icon-size` | `--mo-comp-button-medium-icon-size` | S | `md.comp.button.medium.icon.size` (M3 specs page) | 1 | 5 |  |
| `--button-inline` | `--mo-comp-button-inline` | O | not printed by M3 for this part | 5 | 11 |  |
| `--button-large-square-radius` | `--mo-comp-button-large-container-shape-square` | S | `md.comp.button.large.container.shape.square` (M3 specs page) | 1 | 3 |  |
| `--button-letter-spacing` | `--mo-comp-button-letter-spacing` | O | not printed by M3 for this part | 1 | 4 |  |
| `--button-outlined-hover-line` | `--mo-comp-button-outlined-hovered-outline-color` | S | `md.comp.button.outlined.hovered.outline.color` (M3 specs page) | 2 | 3 |  |
| `--button-outlined-hover-text` | `--mo-comp-button-outlined-hovered-label-text-color` | S | `md.comp.button.outlined.hovered.label-text.color` (M3 specs page) | 2 | 3 |  |
| `--button-outlined-line` | `--mo-comp-button-outlined-outline-color` | S | `md.comp.button.outlined.outline.color` (M3 specs page) | 2 | 5 |  |
| `--button-outlined-surface` | `--mo-comp-button-outlined-surface` | O | not printed by M3 for this part | 2 | 4 |  |
| `--button-outlined-text` | `--mo-comp-button-outlined-label-text-color` | S | `md.comp.button.outlined.label-text.color` (M3 specs page) | 2 | 3 |  |
| `--button-padding` | `--mo-comp-button-padding` | O | not printed by M3 for this part | 1 | 4 |  |
| `--button-pressed` | `--mo-comp-button-pressed` | O | not printed by M3 for this part | 5 | 7 |  |
| `--button-radius` | `--mo-comp-button-medium-container-shape-round` | S | `md.comp.button.medium.container.shape.round` (M3 specs page) | 1 | 5 |  |
| `--button-round` | `--mo-comp-button-round` | O | not printed by M3 for this part | 1 | 7 |  |
| `--button-small-height` | `--mo-comp-button-small-container-height` | S | `md.comp.button.small.container.height` (M3 specs page) | 1 | 3 |  |
| `--button-small-padding` | `--mo-comp-button-small-padding` | O | not printed by M3 for this part | 1 | 2 |  |
| `--button-small-square-radius` | `--mo-comp-button-small-container-shape-square` | S | `md.comp.button.small.container.shape.square` (M3 specs page) | 1 | 3 |  |
| `--button-square` | `--mo-comp-button-square` | O | not printed by M3 for this part | 5 | 7 |  |
| `--button-square-radius` | `--mo-comp-button-medium-container-shape-square` | S | `md.comp.button.medium.container.shape.square` (M3 specs page) | 1 | 4 |  |
| `--button-text-hover` | `--mo-comp-button-text-hover` | O | not printed by M3 for this part | 2 | 3 |  |
| `--button-text-padding` | `--mo-comp-button-text-padding` | O | not printed by M3 for this part | 1 | 7 |  |
| `--button-text-text` | `--mo-comp-button-text-label-text-color` | S | `md.comp.button.text.label-text.color` (M3 specs page) | 2 | 5 |  |
| `--button-toggle-hover` | `--mo-comp-button-toggle-hover` | O | not printed by M3 for this part | 1 | 3 |  |
| `--button-toggle-selected-hover` | `--mo-comp-button-toggle-selected-hover` | O | not printed by M3 for this part | 1 | 3 |  |
| `--button-toggle-selected-surface` | `--mo-comp-button-filled-selected-container-color` | S | `md.comp.button.filled.selected.container.color` (M3 specs page) | 1 | 4 |  |
| `--button-toggle-selected-text` | `--mo-comp-button-filled-selected-label-text-color` | S | `md.comp.button.filled.selected.label-text.color` (M3 specs page) | 1 | 3 |  |
| `--button-toggle-surface` | `--mo-comp-button-filled-unselected-container-color` | S | `md.comp.button.filled.unselected.container.color` (M3 specs page) | 1 | 4 |  |
| `--button-toggle-text` | `--mo-comp-button-filled-unselected-label-text-color` | S | `md.comp.button.filled.unselected.label-text.color` (M3 specs page) | 1 | 3 |  |
| `--button-tonal-hover` | `--mo-comp-button-tonal-hover` | O | not printed by M3 for this part | 1 | 2 |  |
| `--button-tonal-surface` | `--mo-comp-button-tonal-container-color` | S | `md.comp.button.tonal.container.color` (M3 specs page) | 1 | 3 |  |
| `--button-tonal-text` | `--mo-comp-button-tonal-label-text-color` | S | `md.comp.button.tonal.label-text.color` (M3 specs page) | 1 | 2 |  |
| `--button-weight` | `--mo-comp-button-weight` | O | not printed by M3 for this part | 1 | 4 |  |
| `--button-xlarge-square-radius` | `--mo-comp-button-xlarge-container-shape-square` | S | `md.comp.button.xlarge.container.shape.square` (M3 specs page) | 1 | 3 |  |
| `--button-xsmall-gap` | `--mo-comp-button-xsmall-icon-label-space` | S | `md.comp.button.xsmall.icon-label-space` (M3 specs page) | 1 | 3 |  |
| `--button-xsmall-height` | `--mo-comp-button-xsmall-container-height` | S | `md.comp.button.xsmall.container.height` (M3 specs page) | 2 | 4 |  |
| `--button-xsmall-padding` | `--mo-comp-button-xsmall-padding` | O | not printed by M3 for this part | 1 | 2 |  |
| `--button-xsmall-square-radius` | `--mo-comp-button-xsmall-container-shape-square` | S | `md.comp.button.xsmall.container.shape.square` (M3 specs page) | 1 | 3 |  |
| `--card-action-gap` | `--mo-comp-card-action-gap` | O | not printed by M3 for this part | 1 | 6 |  |
| `--card-elevated-hover-shadow` | `--mo-comp-elevated-card-hover-container-elevation` | S | `md.comp.elevated-card.hover.container.elevation` (M3 specs page); ours is a shadow, M3 a level | 1 | 3 | ″ |
| `--card-elevated-shadow` | `--mo-comp-elevated-card-container-elevation` | S | `md.comp.elevated-card.container.elevation` (M3 specs page); ours is a shadow, M3 a level | 1 | 8 | ″ |
| `--card-filled-line` | `--mo-comp-card-filled-line` | O | not printed by M3 for this part | 1 | 2 |  |
| `--card-filled-surface` | `--mo-comp-filled-card-container-color` | S | `md.comp.filled-card.container.color` (M3 specs page) | 6 | 11 |  |
| `--card-gap` | `--mo-comp-card-gap` | O | not printed by M3 for this part | 1 | 24 |  |
| `--card-media-gap` | `--mo-comp-card-media-gap` | O | not printed by M3 for this part | 1 | 4 |  |
| `--card-outlined-line` | `--mo-comp-outlined-card-outline-color` | S | `md.comp.outlined-card.outline.color` (M3 specs page) | 6 | 9 |  |
| `--card-outlined-surface` | `--mo-comp-outlined-card-container-color` | S | `md.comp.outlined-card.container.color` (M3 specs page) | 5 | 9 |  |
| `--card-padding` | `--mo-comp-card-padding` | O | not printed by M3 for this part | 8 | 24 |  |
| `--card-radius` | `--mo-comp-card-radius` | O | not printed by M3 for this part | 5 | 29 |  |
| `--card-shadow` | `--mo-comp-card-shadow` | O | not printed by M3 for this part | 9 | 17 |  |
| `--card-subhead-gap` | `--mo-comp-card-subhead-gap` | O | not printed by M3 for this part | 1 | 6 |  |
| `--card-text-gap` | `--mo-comp-card-text-gap` | O | not printed by M3 for this part | 1 | 4 |  |
| `--carousel-bleed` | `--mo-comp-carousel-bleed` | O | not printed by M3 for this part | 1 | 6 |  |
| `--carousel-dot-colour` | `--mo-comp-carousel-dot-colour` | O | not printed by M3 for this part | 1 | 3 |  |
| `--carousel-dot-selected-width` | `--mo-comp-carousel-dot-selected-width` | O | not printed by M3 for this part | 1 | 3 |  |
| `--carousel-full-screen-radius` | `--mo-comp-carousel-full-screen-radius` | O | not printed by M3 for this part | 1 | 3 |  |
| `--carousel-item-radius` | `--mo-comp-carousel-item-container-shape` | S | `md.comp.carousel-item.container.shape` (M3 specs page) | 1 | 5 |  |
| `--carousel-large-item-width` | `--mo-comp-carousel-large-item-width` | O | not printed by M3 for this part | 1 | 5 |  |
| `--carousel-small-item-max-width` | `--mo-comp-carousel-small-item-max-width` | O | not printed by M3 for this part | 1 | 4 |  |
| `--carousel-small-item-min-width` | `--mo-comp-carousel-small-item-min-width` | O | not printed by M3 for this part | 1 | 4 |  |
| `--checkbox-gap` | `--mo-comp-checkbox-gap` | O | not printed by M3 for this part | 3 | 5 |  |
| `--checkbox-offset` | `--mo-comp-checkbox-offset` | O | not printed by M3 for this part | 1 | 3 |  |
| `--checkbox-size` | `--mo-comp-checkbox-container-size` | S | `md.comp.checkbox.container.size` (M3 specs page) | 1 | 4 |  |
| `--chip-height` | `--mo-comp-filter-chip-container-height` | S | `md.comp.filter-chip.container.height` (M3 specs page) | 1 | 3 |  |
| `--chip-hover-line` | `--mo-comp-chip-hover-line` | O | not printed by M3 for this part | 1 | 3 |  |
| `--chip-hover-text` | `--mo-comp-chip-hover-text` | O | not printed by M3 for this part | 1 | 3 |  |
| `--chip-line` | `--mo-comp-filter-chip-flat-unselected-outline-color` | S | `md.comp.filter-chip.flat.unselected.outline.color` (M3 specs page) | 1 | 4 |  |
| `--chip-padding` | `--mo-comp-chip-padding` | O | not printed by M3 for this part | 1 | 3 |  |
| `--chip-padding-block` | `--mo-comp-chip-padding-block` | O | not printed by M3 for this part | 1 | 4 |  |
| `--chip-radius` | `--mo-comp-filter-chip-container-shape` | S | `md.comp.filter-chip.container.shape` (M3 specs page) | 1 | 5 |  |
| `--chip-selected-check` | `--mo-comp-chip-selected-check` | O | not printed by M3 for this part | 1 | 3 |  |
| `--chip-selected-hover` | `--mo-comp-chip-selected-hover` | O | not printed by M3 for this part | 1 | 3 |  |
| `--chip-selected-surface` | `--mo-comp-filter-chip-flat-selected-container-color` | S | `md.comp.filter-chip.flat.selected.container.color` (M3 specs page) | 1 | 4 |  |
| `--chip-selected-text` | `--mo-comp-filter-chip-selected-label-text-color` | S | `md.comp.filter-chip.selected.label-text.color` (M3 specs page) | 1 | 4 |  |
| `--chip-set-bleed` | `--mo-comp-chip-set-bleed` | O | not printed by M3 for this part | 3 | 7 |  |
| `--chip-surface` | `--mo-comp-chip-surface` | O | not printed by M3 for this part | 1 | 3 |  |
| `--chip-text` | `--mo-comp-filter-chip-unselected-label-text-color` | S | `md.comp.filter-chip.unselected.label-text.color` (M3 specs page) | 1 | 3 |  |
| `--circular-progress-indicator-gap` | `--mo-comp-circular-progress-indicator-gap` | O | not printed by M3 for this part | 1 | 2 |  |
| `--circular-progress-indicator-rest` | `--mo-comp-circular-progress-indicator-rest` | O | not printed by M3 for this part | 1 | 3 |  |
| `--circular-progress-indicator-shown-gap` | `--mo-comp-circular-progress-indicator-shown-gap` | O | not printed by M3 for this part | 1 | 3 |  |
| `--circular-progress-indicator-size` | `--mo-comp-circular-progress-indicator-size` | S | `md.comp.circular-progress-indicator.size` (M3 specs page) | 3 | 6 |  |
| `--circular-progress-indicator-thickness` | `--mo-comp-progress-indicator-circular-active-indicator-thickness` | S | `md.comp.progress-indicator.circular.active-indicator.thickness` (M3 specs page) | 1 | 3 |  |
| `--date-picker-day-hover` | `--mo-comp-date-picker-day-hover` | O | not printed by M3 for this part | 1 | 5 |  |
| `--date-picker-day-radius` | `--mo-comp-date-picker-day-radius` | O | not printed by M3 for this part | 1 | 4 |  |
| `--date-picker-docked-radius` | `--mo-comp-date-picker-docked-radius` | O | not printed by M3 for this part | 1 | 3 |  |
| `--date-picker-menu-button-text` | `--mo-comp-date-picker-menu-button-text` | O | not printed by M3 for this part | 1 | 3 |  |
| `--date-picker-range-surface` | `--mo-comp-date-picker-range-surface` | O | not printed by M3 for this part | 1 | 5 |  |
| `--date-picker-supporting-color` | `--mo-comp-date-picker-supporting-color` | O | not printed by M3 for this part | 1 | 3 |  |
| `--dialog-line` | `--mo-comp-dialog-line` | O | not printed by M3 for this part | 1 | 4 |  |
| `--dialog-radius` | `--mo-comp-dialog-container-shape` | S | `md.comp.dialog.container.shape` (M3 specs page) | 1 | 6 |  |
| `--dialog-scrim` | `--mo-comp-dialog-scrim` | O | not printed by M3 for this part | 1 | 8 |  |
| `--divider-color` | `--mo-comp-divider-color` | S | `md.comp.divider.color` (M3 specs page) | 1 | 4 |  |
| `--fab-hover-shadow` | `--mo-comp-fab-hover-shadow` | O | not printed by M3 for this part | 2 | 6 |  |
| `--fab-large-radius` | `--mo-comp-fab-large-container-shape` | S | `md.comp.fab.large.container.shape` (M3 specs page) | 1 | 2 |  |
| `--fab-medium-radius` | `--mo-comp-fab-medium-container-shape` | S | `md.comp.fab.medium.container.shape` (M3 specs page) | 1 | 2 |  |
| `--fab-menu-close-radius` | `--mo-comp-fab-menu-close-radius` | O | not printed by M3 for this part | 1 | 3 |  |
| `--fab-primary-container-hover` | `--mo-comp-fab-primary-container-hover` | O | not printed by M3 for this part | 1 | 3 |  |
| `--fab-primary-container-surface` | `--mo-comp-fab-primary-container-container-color` | S | `md.comp.fab.primary-container.container.color` (M3 specs page) | 1 | 2 |  |
| `--fab-primary-container-text` | `--mo-comp-fab-primary-container-icon-color` | S | `md.comp.fab.primary-container.icon.color` (M3 specs page) | 1 | 2 |  |
| `--fab-primary-hover` | `--mo-comp-fab-primary-hover` | O | not printed by M3 for this part | 1 | 5 |  |
| `--fab-radius` | `--mo-comp-fab-container-shape` | S | `md.comp.fab.container.shape` (M3 specs page) | 2 | 5 |  |
| `--fab-room` | `--mo-comp-fab-room` | O | not printed by M3 for this part | 1 | 3 |  |
| `--fab-secondary-container-hover` | `--mo-comp-fab-secondary-container-hover` | O | not printed by M3 for this part | 1 | 3 |  |
| `--fab-secondary-container-surface` | `--mo-comp-fab-secondary-container-surface` | O | not printed by M3 for this part | 1 | 2 |  |
| `--fab-secondary-container-text` | `--mo-comp-fab-secondary-container-text` | O | not printed by M3 for this part | 1 | 2 |  |
| `--fab-shadow` | `--mo-comp-fab-shadow` | O | not printed by M3 for this part | 2 | 10 |  |
| `--grid-columns` | `--mo-comp-grid-columns` | O | not printed by M3 for this part | 6 | 17 |  |
| `--icon-button-box` | `--mo-comp-icon-button-box` | O | not printed by M3 for this part | 5 | 9 |  |
| `--icon-button-corners` | `--mo-comp-icon-button-corners` | O | not printed by M3 for this part | 3 | 5 |  |
| `--icon-button-filled-hover` | `--mo-comp-icon-button-filled-hover` | O | not printed by M3 for this part | 1 | 2 |  |
| `--icon-button-filled-surface` | `--mo-comp-icon-button-filled-container-color` | S | `md.comp.icon-button.filled.container.color` (M3 specs page) | 1 | 2 |  |
| `--icon-button-filled-text` | `--mo-comp-icon-button-filled-icon-color` | S | `md.comp.icon-button.filled.icon.color` (M3 specs page) | 1 | 2 |  |
| `--icon-button-glyph` | `--mo-comp-icon-button-glyph` | O | not printed by M3 for this part | 5 | 8 |  |
| `--icon-button-icon-size` | `--mo-comp-icon-button-small-icon-size` | S | `md.comp.icon-button.small.icon.size` (M3 specs page) | 3 | 10 |  |
| `--icon-button-medium-square-radius` | `--mo-comp-icon-button-medium-container-shape-square` | S | `md.comp.icon-button.medium.container.shape.square` (M3 specs page) | 1 | 2 |  |
| `--icon-button-outlined-line` | `--mo-comp-icon-button-outlined-outline-color` | S | `md.comp.icon-button.outlined.outline.color` (M3 specs page) | 1 | 2 |  |
| `--icon-button-outlined-surface` | `--mo-comp-icon-button-outlined-surface` | O | not printed by M3 for this part | 1 | 2 |  |
| `--icon-button-outlined-text` | `--mo-comp-icon-button-outlined-icon-color` | S | `md.comp.icon-button.outlined.icon.color` (M3 specs page) | 1 | 2 |  |
| `--icon-button-pressed` | `--mo-comp-icon-button-pressed` | O | not printed by M3 for this part | 5 | 6 |  |
| `--icon-button-ratio` | `--mo-comp-icon-button-ratio` | O | not printed by M3 for this part | 3 | 4 |  |
| `--icon-button-round` | `--mo-comp-icon-button-round` | O | not printed by M3 for this part | 1 | 5 |  |
| `--icon-button-size` | `--mo-comp-icon-button-small-container-height` | S | `md.comp.icon-button.small.container.height` (M3 specs page); ours is the width and height | 4 | 14 | ours is the width and height |
| `--icon-button-square` | `--mo-comp-icon-button-square` | O | not printed by M3 for this part | 5 | 6 |  |
| `--icon-button-standard-line` | `--mo-comp-icon-button-standard-line` | O | not printed by M3 for this part | 3 | 4 |  |
| `--icon-button-standard-surface` | `--mo-comp-icon-button-standard-surface` | O | not printed by M3 for this part | 3 | 5 |  |
| `--icon-button-standard-text` | `--mo-comp-icon-button-standard-icon-color` | S | `md.comp.icon-button.standard.icon.color` (M3 specs page) | 4 | 8 |  |
| `--icon-button-tonal-surface` | `--mo-comp-icon-button-tonal-container-color` | S | `md.comp.icon-button.tonal.container.color` (M3 specs page) | 1 | 3 |  |
| `--icon-button-tonal-text` | `--mo-comp-icon-button-tonal-icon-color` | S | `md.comp.icon-button.tonal.icon.color` (M3 specs page) | 1 | 2 |  |
| `--icon-button-width` | `--mo-comp-icon-button-width` | O | not printed by M3 for this part | 1 | 5 |  |
| `--icon-color` | `--mo-comp-icon-color` | O | not printed by M3 for this part | 3 | 6 |  |
| `--lightbox-ink` | `--mo-comp-lightbox-ink` | O | not printed by M3 for this part | 1 | 3 |  |
| `--linear-progress-indicator-height` | `--mo-comp-progress-indicator-linear-active-indicator-thickness` | S | `md.comp.progress-indicator.linear.active-indicator.thickness` (M3 specs page) | 2 | 10 |  |
| `--linear-progress-indicator-radius` | `--mo-comp-linear-progress-indicator-radius` | O | not printed by M3 for this part | 1 | 3 |  |
| `--linear-progress-indicator-stop-size` | `--mo-comp-linear-progress-indicator-stop-size` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-divider` | `--mo-comp-list-divider-color` | S | `md.comp.list.divider.color` (M3 specs page) | 1 | 5 |  |
| `--list-expand-divider-width` | `--mo-comp-list-expand-divider-width` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-expand-gap` | `--mo-comp-list-expand-gap` | O | not printed by M3 for this part | 1 | 4 |  |
| `--list-expand-icon-open-surface` | `--mo-comp-list-expand-icon-open-surface` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-expand-item-radius` | `--mo-comp-list-expand-item-radius` | O | not printed by M3 for this part | 1 | 4 |  |
| `--list-expand-item-surface` | `--mo-comp-list-expand-item-surface` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-expand-open-radius` | `--mo-comp-list-expand-open-radius` | O | not printed by M3 for this part | 2 | 4 |  |
| `--list-expand-padding-block` | `--mo-comp-list-expand-padding-block` | O | not printed by M3 for this part | 1 | 4 |  |
| `--list-expand-padding-inline` | `--mo-comp-list-expand-padding-inline` | O | not printed by M3 for this part | 6 | 9 |  |
| `--list-expand-radius` | `--mo-comp-list-expand-container-shape` | S | `md.comp.list.expand.container.shape` (M3 specs page) | 2 | 10 |  |
| `--list-expand-shadow` | `--mo-comp-list-expand-shadow` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-expand-surface` | `--mo-comp-list-expand-surface` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-item-box` | `--mo-comp-list-item-box` | O | not printed by M3 for this part | 2 | 5 |  |
| `--list-item-density` | `--mo-comp-list-item-density` | O | not printed by M3 for this part | 1 | 4 |  |
| `--list-item-disabled-opacity` | `--mo-comp-list-item-disabled-opacity` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-item-first-lines` | `--mo-comp-list-item-first-lines` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-item-focus-indicator-color` | `--mo-comp-list-item-focus-indicator-color` | O | not printed by M3 for this part | 1 | 5 |  |
| `--list-item-focus-surface` | `--mo-comp-list-item-focus-surface` | O | not printed by M3 for this part | 1 | 9 |  |
| `--list-item-gap` | `--mo-comp-list-item-gap` | O | not printed by M3 for this part | 2 | 5 |  |
| `--list-item-headline-letter-spacing` | `--mo-comp-list-item-headline-letter-spacing` | O | not printed by M3 for this part | 1 | 4 |  |
| `--list-item-headline-line-height` | `--mo-comp-list-item-headline-line-height` | O | not printed by M3 for this part | 1 | 7 |  |
| `--list-item-headline-size` | `--mo-comp-list-item-headline-size` | O | not printed by M3 for this part | 1 | 4 |  |
| `--list-item-headline-weight` | `--mo-comp-list-item-headline-weight` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-item-hover-icon-color` | `--mo-comp-list-item-hover-icon-color` | O | not printed by M3 for this part | 1 | 4 |  |
| `--list-item-hover-radius` | `--mo-comp-list-item-hover-radius` | O | not printed by M3 for this part | 3 | 8 |  |
| `--list-item-hover-surface` | `--mo-comp-list-item-hover-surface` | O | not printed by M3 for this part | 2 | 18 |  |
| `--list-item-hover-text` | `--mo-comp-list-item-hover-text` | O | not printed by M3 for this part | 2 | 7 |  |
| `--list-item-hover-trailing-shift` | `--mo-comp-list-item-hover-trailing-shift` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-item-icon-size` | `--mo-comp-list-item-icon-size` | O | not printed by M3 for this part | 1 | 8 |  |
| `--list-item-image-radius` | `--mo-comp-list-item-image-radius` | O | not printed by M3 for this part | 2 | 5 |  |
| `--list-item-image-size` | `--mo-comp-list-item-image-size` | O | not printed by M3 for this part | 2 | 6 |  |
| `--list-item-leading-icon-color` | `--mo-comp-list-list-item-leading-icon-color` | S | `md.comp.list.list-item.leading-icon.color` (M3 specs page) | 4 | 6 |  |
| `--list-item-leading-icon-selected-color` | `--mo-comp-list-item-leading-icon-selected-color` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-item-leading-room` | `--mo-comp-list-item-leading-room` | O | not printed by M3 for this part | 2 | 3 |  |
| `--list-item-leading-size` | `--mo-comp-list-item-leading-size` | O | not printed by M3 for this part | 3 | 5 |  |
| `--list-item-min-height` | `--mo-comp-list-list-item-container-height` | S | `md.comp.list.list-item.container.height` (M3 specs page) | 3 | 10 |  |
| `--list-item-padding-block` | `--mo-comp-list-item-padding-block` | O | not printed by M3 for this part | 6 | 10 |  |
| `--list-item-padding-inline` | `--mo-comp-list-item-padding-inline` | O | not printed by M3 for this part | 9 | 13 |  |
| `--list-item-pressed-radius` | `--mo-comp-list-item-pressed-radius` | O | not printed by M3 for this part | 2 | 5 |  |
| `--list-item-pressed-surface` | `--mo-comp-list-item-pressed-surface` | O | not printed by M3 for this part | 2 | 13 |  |
| `--list-item-radius` | `--mo-comp-list-list-item-container-shape` | S | `md.comp.list.list-item.container.shape` (M3 specs page) | 3 | 14 |  |
| `--list-item-selected-radius` | `--mo-comp-list-item-selected-radius` | O | not printed by M3 for this part | 2 | 8 |  |
| `--list-item-selected-surface` | `--mo-comp-list-list-item-selected-container-color` | S | `md.comp.list.list-item.selected.container.color` (M3 specs page) | 1 | 7 |  |
| `--list-item-selected-text` | `--mo-comp-list-list-item-selected-label-text-color` | S | `md.comp.list.list-item.selected.label-text.color` (M3 specs page) | 1 | 5 |  |
| `--list-item-selected-weight` | `--mo-comp-list-item-selected-weight` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-item-shape` | `--mo-comp-list-item-shape` | O | not printed by M3 for this part | 16 | 24 |  |
| `--list-item-three-line-box` | `--mo-comp-list-item-three-line-box` | O | not printed by M3 for this part | 1 | 2 |  |
| `--list-item-three-line-min-height` | `--mo-comp-list-item-three-line-min-height` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-item-trailing-text` | `--mo-comp-list-item-trailing-text` | O | not printed by M3 for this part | 1 | 4 |  |
| `--list-item-two-line-box` | `--mo-comp-list-item-two-line-box` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-item-two-line-min-height` | `--mo-comp-list-item-two-line-min-height` | O | not printed by M3 for this part | 3 | 7 |  |
| `--list-segmented-disabled-surface` | `--mo-comp-list-segmented-disabled-surface` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-segmented-gap` | `--mo-comp-list-segmented-gap` | O | not printed by M3 for this part | 1 | 4 |  |
| `--list-segmented-hover-radius` | `--mo-comp-list-segmented-hover-radius` | O | not printed by M3 for this part | 1 | 4 |  |
| `--list-segmented-hover-surface` | `--mo-comp-list-segmented-hover-surface` | O | not printed by M3 for this part | 1 | 7 |  |
| `--list-segmented-inner-radius` | `--mo-comp-list-segmented-inner-radius` | O | not printed by M3 for this part | 1 | 5 |  |
| `--list-segmented-padding-inline` | `--mo-comp-list-segmented-padding-inline` | O | not printed by M3 for this part | 1 | 4 |  |
| `--list-segmented-pressed-radius` | `--mo-comp-list-segmented-pressed-radius` | O | not printed by M3 for this part | 1 | 3 |  |
| `--list-segmented-pressed-surface` | `--mo-comp-list-segmented-pressed-surface` | O | not printed by M3 for this part | 1 | 5 |  |
| `--list-segmented-radius` | `--mo-comp-list-segmented-radius` | O | not printed by M3 for this part | 1 | 8 |  |
| `--list-segmented-selected-radius` | `--mo-comp-list-segmented-selected-radius` | O | not printed by M3 for this part | 1 | 5 |  |
| `--list-segmented-surface` | `--mo-comp-list-list-item-segmented-container-color` | S | `md.comp.list.list-item.segmented.container.color` (M3 specs page) | 2 | 8 |  |
| `--loading-indicator-colour` | `--mo-comp-loading-indicator-active-indicator-color` | S | `md.comp.loading-indicator.active-indicator.color` (M3 specs page) | 1 | 5 |  |
| `--loading-indicator-shape-size` | `--mo-comp-loading-indicator-shape-size` | O | not printed by M3 for this part | 1 | 5 |  |
| `--loading-indicator-size` | `--mo-comp-loading-indicator-active-indicator-size` | S | `md.comp.loading-indicator.active-indicator.size` (M3 specs page) | 1 | 5 |  |
| `--menu-divider` | `--mo-comp-menu-divider-color` | S | `md.comp.menu.divider.color` (M3 specs page) | 1 | 4 |  |
| `--menu-group-inner-radius` | `--mo-comp-menu-group-inner-radius` | O | not printed by M3 for this part | 1 | 3 |  |
| `--menu-group-label-text` | `--mo-comp-menu-group-label-text` | O | not printed by M3 for this part | 1 | 3 |  |
| `--menu-item-edge-radius` | `--mo-comp-menu-item-edge-radius` | O | not printed by M3 for this part | 1 | 6 |  |
| `--menu-item-font-size` | `--mo-comp-menu-item-font-size` | O | not printed by M3 for this part | 1 | 5 |  |
| `--menu-item-height` | `--mo-comp-menu-list-item-container-height` | S | `md.comp.menu.list-item.container.height` (M3 specs page) | 1 | 4 |  |
| `--menu-item-hover-surface` | `--mo-comp-menu-item-hover-surface` | O | not printed by M3 for this part | 2 | 6 |  |
| `--menu-item-hover-text` | `--mo-comp-menu-item-hover-text` | O | not printed by M3 for this part | 2 | 5 |  |
| `--menu-item-icon-color` | `--mo-comp-menu-item-icon-color` | O | not printed by M3 for this part | 1 | 3 |  |
| `--menu-item-letter-spacing` | `--mo-comp-menu-item-letter-spacing` | O | not printed by M3 for this part | 1 | 5 |  |
| `--menu-item-padding` | `--mo-comp-menu-item-padding` | O | not printed by M3 for this part | 1 | 4 |  |
| `--menu-item-radius` | `--mo-comp-menu-item-radius` | O | not printed by M3 for this part | 1 | 6 |  |
| `--menu-item-selected-radius` | `--mo-comp-menu-item-selected-radius` | O | not printed by M3 for this part | 1 | 3 |  |
| `--menu-item-selected-surface` | `--mo-comp-menu-list-item-selected-container-color` | S | `md.comp.menu.list-item.selected.container.color` (M3 specs page) | 2 | 5 |  |
| `--menu-item-selected-text` | `--mo-comp-menu-list-item-selected-label-text-color` | S | `md.comp.menu.list-item.selected.label-text.color` (M3 specs page) | 2 | 5 |  |
| `--menu-item-selected-weight` | `--mo-comp-menu-item-selected-weight` | O | not printed by M3 for this part | 1 | 4 |  |
| `--menu-item-supporting-text` | `--mo-comp-menu-item-supporting-text` | O | not printed by M3 for this part | 1 | 4 |  |
| `--menu-item-text` | `--mo-comp-menu-list-item-label-text-color` | S | `md.comp.menu.list-item.label-text.color` (M3 specs page) | 2 | 6 |  |
| `--menu-item-weight` | `--mo-comp-menu-item-weight` | O | not printed by M3 for this part | 1 | 5 |  |
| `--menu-line` | `--mo-comp-menu-line` | O | not printed by M3 for this part | 2 | 6 |  |
| `--menu-max-height` | `--mo-comp-menu-max-height` | O | not printed by M3 for this part | 1 | 5 |  |
| `--menu-max-width` | `--mo-comp-menu-max-width` | O | not printed by M3 for this part | 1 | 3 |  |
| `--menu-min-width` | `--mo-comp-menu-min-width` | O | not printed by M3 for this part | 1 | 3 |  |
| `--menu-padding` | `--mo-comp-menu-padding` | O | not printed by M3 for this part | 1 | 5 |  |
| `--menu-radius` | `--mo-comp-menu-container-shape` | S | `md.comp.menu.container.shape` (M3 specs page) | 1 | 10 |  |
| `--menu-shadow` | `--mo-comp-menu-container-elevation` | S | `md.comp.menu.container.elevation` (M3 specs page); ours is a shadow, M3 a level | 2 | 10 | ″ |
| `--menu-surface` | `--mo-comp-menu-container-color` | S | `md.comp.menu.container.color` (M3 specs page) | 2 | 9 |  |
| `--menu-width` | `--mo-comp-menu-width` | O | not printed by M3 for this part | 1 | 5 |  |
| `--navigation-bar-height` | `--mo-comp-navigation-bar-container-height` | S | `md.comp.navigation-bar.container.height` (M3 specs page) | 1 | 3 |  |
| `--navigation-bar-indicator-hover` | `--mo-comp-navigation-bar-indicator-hover` | O | not printed by M3 for this part | 1 | 8 |  |
| `--navigation-bar-indicator-radius` | `--mo-comp-navigation-bar-active-indicator-shape` | S | `md.comp.navigation-bar.active-indicator.shape` (M3 specs page) | 1 | 5 |  |
| `--navigation-bar-indicator-surface` | `--mo-comp-navigation-bar-active-indicator-color` | S | `md.comp.navigation-bar.active-indicator.color` (M3 specs page) | 1 | 5 |  |
| `--navigation-bar-indicator-text` | `--mo-comp-navigation-bar-indicator-text` | O | not printed by M3 for this part | 1 | 5 |  |
| `--navigation-bar-indicator-width` | `--mo-comp-navigation-bar-active-indicator-width` | S | `md.comp.navigation-bar.active-indicator.width` (M3 specs page) | 1 | 3 |  |
| `--navigation-bar-item-selected-text` | `--mo-comp-navigation-bar-active-label-text-color` | S | `md.comp.navigation-bar.active.label-text.color` (M3 specs page) | 1 | 3 |  |
| `--navigation-bar-item-text` | `--mo-comp-navigation-bar-inactive-label-text-color` | S | `md.comp.navigation-bar.inactive.label-text.color` (M3 specs page) | 1 | 3 |  |
| `--navigation-bar-label-selected-weight` | `--mo-comp-navigation-bar-label-selected-weight` | O | not printed by M3 for this part | 1 | 3 |  |
| `--navigation-bar-line` | `--mo-comp-navigation-bar-line` | O | not printed by M3 for this part | 1 | 3 |  |
| `--navigation-bar-surface` | `--mo-comp-navigation-bar-container-color` | S | `md.comp.navigation-bar.container.color` (M3 specs page) | 1 | 4 |  |
| `--navigation-drawer-bleed-default` | `--mo-comp-navigation-drawer-bleed-default` | O | not printed by M3 for this part | 1 | 13 |  |
| `--navigation-drawer-inset` | `--mo-comp-navigation-drawer-inset` | O | not printed by M3 for this part | 1 | 10 |  |
| `--navigation-drawer-inset-default` | `--mo-comp-navigation-drawer-inset-default` | O | not printed by M3 for this part | 1 | 9 |  |
| `--navigation-drawer-row-gap` | `--mo-comp-navigation-drawer-row-gap` | O | not printed by M3 for this part | 1 | 3 |  |
| `--navigation-drawer-scrim` | `--mo-comp-navigation-drawer-scrim-color` | S | `md.comp.navigation-drawer.scrim.color` (M3 specs page) | 1 | 5 |  |
| `--navigation-drawer-toggle-hover` | `--mo-comp-navigation-drawer-toggle-hover` | O | not printed by M3 for this part | 1 | 3 |  |
| `--navigation-drawer-toggle-size` | `--mo-comp-navigation-drawer-toggle-size` | O | not printed by M3 for this part | 1 | 4 |  |
| `--navigation-drawer-width` | `--mo-comp-navigation-drawer-width` | O | not printed by M3 for this part | 1 | 14 |  |
| `--navigation-drawer-width-default` | `--mo-comp-navigation-drawer-container-width` | S | `md.comp.navigation-drawer.container.width` (M3 specs page) | 1 | 4 |  |
| `--navigation-drawer-width-min-default` | `--mo-comp-navigation-drawer-width-min-default` | O | not printed by M3 for this part | 1 | 5 |  |
| `--navigation-rail-expanded-width` | `--mo-comp-navigation-rail-expanded-width` | O | not printed by M3 for this part | 1 | 5 |  |
| `--navigation-rail-indicator-hover` | `--mo-comp-navigation-rail-indicator-hover` | O | not printed by M3 for this part | 1 | 4 |  |
| `--navigation-rail-indicator-radius` | `--mo-comp-navigation-rail-active-indicator-shape` | S | `md.comp.navigation-rail.active-indicator.shape` (M3 specs page) | 1 | 4 |  |
| `--navigation-rail-indicator-surface` | `--mo-comp-navigation-rail-active-indicator-color` | S | `md.comp.navigation-rail.active-indicator.color` (M3 specs page) | 1 | 4 |  |
| `--navigation-rail-indicator-text` | `--mo-comp-navigation-rail-indicator-text` | O | not printed by M3 for this part | 1 | 4 |  |
| `--navigation-rail-item-selected-text` | `--mo-comp-navigation-rail-active-label-text-color` | S | `md.comp.navigation-rail.active.label-text.color` (M3 specs page) | 1 | 3 |  |
| `--navigation-rail-item-text` | `--mo-comp-navigation-rail-inactive-label-text-color` | S | `md.comp.navigation-rail.inactive.label-text.color` (M3 specs page) | 1 | 4 |  |
| `--navigation-rail-label-selected-weight` | `--mo-comp-navigation-rail-label-selected-weight` | O | not printed by M3 for this part | 1 | 3 |  |
| `--navigation-rail-line` | `--mo-comp-navigation-rail-line` | O | not printed by M3 for this part | 1 | 4 |  |
| `--navigation-rail-modal-radius` | `--mo-comp-navigation-rail-modal-radius` | O | not printed by M3 for this part | 1 | 4 |  |
| `--navigation-rail-padding` | `--mo-comp-navigation-rail-padding` | O | not printed by M3 for this part | 2 | 4 |  |
| `--navigation-rail-surface` | `--mo-comp-navigation-rail-surface` | O | not printed by M3 for this part | 1 | 7 |  |
| `--navigation-rail-width` | `--mo-comp-navigation-rail-container-width` | S | `md.comp.navigation-rail.container.width` (M3 specs page) | 1 | 7 |  |
| `--radio-button-gap` | `--mo-comp-radio-button-gap` | O | not printed by M3 for this part | 2 | 4 |  |
| `--radio-button-offset` | `--mo-comp-radio-button-offset` | O | not printed by M3 for this part | 1 | 3 |  |
| `--radio-button-size` | `--mo-comp-radio-button-icon-size` | S | `md.comp.radio-button.icon.size` (M3 specs page) | 1 | 4 |  |
| `--radio-group-label-weight` | `--mo-comp-radio-group-label-weight` | O | not printed by M3 for this part | 1 | 3 |  |
| `--search-bar-gap` | `--mo-comp-search-bar-gap` | O | not printed by M3 for this part | 1 | 3 |  |
| `--search-bar-height` | `--mo-comp-search-bar-container-height` | S | `md.comp.search-bar.container.height` (M3 specs page) | 1 | 4 |  |
| `--search-bar-hover` | `--mo-comp-search-bar-hover` | O | not printed by M3 for this part | 1 | 3 |  |
| `--search-bar-line` | `--mo-comp-search-bar-line` | O | not printed by M3 for this part | 1 | 3 |  |
| `--search-bar-padding` | `--mo-comp-search-bar-padding` | O | not printed by M3 for this part | 1 | 3 |  |
| `--search-bar-placeholder` | `--mo-comp-search-bar-supporting-text-color` | S | `md.comp.search-bar.supporting-text.color` (M3 specs page) | 1 | 5 |  |
| `--search-bar-radius` | `--mo-comp-search-bar-container-shape` | S | `md.comp.search-bar.container.shape` (M3 specs page) | 1 | 5 |  |
| `--search-bar-surface` | `--mo-comp-search-bar-container-color` | S | `md.comp.search-bar.container.color` (M3 specs page) | 1 | 6 |  |
| `--search-view-docked-radius` | `--mo-comp-search-view-docked-container-shape` | S | `md.comp.search-view.docked.container.shape` (M3 specs page) | 1 | 4 |  |
| `--search-view-line` | `--mo-comp-search-view-line` | O | not printed by M3 for this part | 1 | 3 |  |
| `--search-view-option-surface` | `--mo-comp-search-view-option-surface` | O | not printed by M3 for this part | 1 | 4 |  |
| `--search-view-radius` | `--mo-comp-search-view-radius` | O | not printed by M3 for this part | 1 | 3 |  |
| `--search-view-results-padding` | `--mo-comp-search-view-results-padding` | O | not printed by M3 for this part | 1 | 4 |  |
| `--search-view-scrim` | `--mo-comp-search-view-scrim` | O | not printed by M3 for this part | 1 | 3 |  |
| `--segmented-button-line` | `--mo-comp-outlined-segmented-button-outline-color` | S | `md.comp.outlined-segmented-button.outline.color` (M3 specs page) | 1 | 3 |  |
| `--segmented-button-padding` | `--mo-comp-segmented-button-padding` | O | not printed by M3 for this part | 1 | 2 |  |
| `--segmented-button-radius` | `--mo-comp-segmented-button-radius` | O | not printed by M3 for this part | 1 | 2 |  |
| `--segmented-button-selected-hover` | `--mo-comp-segmented-button-selected-hover` | O | not printed by M3 for this part | 1 | 2 |  |
| `--segmented-button-selected-surface` | `--mo-comp-outlined-segmented-button-selected-container-color` | S | `md.comp.outlined-segmented-button.selected.container.color` (M3 specs page) | 1 | 3 |  |
| `--segmented-button-selected-text` | `--mo-comp-outlined-segmented-button-selected-label-text-color` | S | `md.comp.outlined-segmented-button.selected.label-text.color` (M3 specs page) | 1 | 2 |  |
| `--segmented-button-surface` | `--mo-comp-segmented-button-surface` | O | not printed by M3 for this part | 1 | 3 |  |
| `--setting-row-label-weight` | `--mo-comp-setting-row-label-weight` | O | not printed by M3 for this part | 1 | 3 |  |
| `--side-panel-width` | `--mo-comp-side-panel-width` | O | not printed by M3 for this part | 1 | 8 |  |
| `--side-sheet-icon-inset` | `--mo-comp-side-sheet-icon-inset` | O | not printed by M3 for this part | 2 | 8 |  |
| `--side-sheet-radius` | `--mo-comp-sheet-side-docked-container-shape` | S | `md.comp.sheet.side.docked.container.shape` (M3 specs page) | 1 | 7 |  |
| `--side-sheet-scrim` | `--mo-comp-side-sheet-scrim` | O | not printed by M3 for this part | 1 | 4 |  |
| `--slider-active-track` | `--mo-comp-slider-active-track` | O | not printed by M3 for this part | 1 | 3 |  |
| `--slider-along` | `--mo-comp-slider-along` | O | not printed by M3 for this part | 1 | 6 |  |
| `--slider-disabled-opacity` | `--mo-comp-slider-disabled-active-track-opacity` | S | `md.comp.slider.disabled.active.track.opacity` (M3 specs page) | 1 | 3 |  |
| `--slider-gap-end` | `--mo-comp-slider-gap-end` | O | not printed by M3 for this part | 2 | 4 |  |
| `--slider-gap-start` | `--mo-comp-slider-gap-start` | O | not printed by M3 for this part | 2 | 4 |  |
| `--slider-handle-height` | `--mo-comp-slider-handle-height` | S | `md.comp.slider.handle.height` (M3 specs page) | 1 | 4 |  |
| `--slider-handle-inset` | `--mo-comp-slider-handle-inset` | O | not printed by M3 for this part | 1 | 5 |  |
| `--slider-handle-length` | `--mo-comp-slider-handle-length` | O | not printed by M3 for this part | 2 | 7 |  |
| `--slider-handle-line-width` | `--mo-comp-slider-handle-line-width` | O | not printed by M3 for this part | 1 | 4 |  |
| `--slider-handle-pressed-width` | `--mo-comp-slider-pressed-handle-width` | S | `md.comp.slider.pressed.handle.width` (M3 specs page) | 1 | 4 |  |
| `--slider-handle-radius` | `--mo-comp-slider-handle-shape` | S | `md.comp.slider.handle.shape` (M3 specs page) | 1 | 4 |  |
| `--slider-handle-surface` | `--mo-comp-slider-handle-color` | S | `md.comp.slider.handle.color` (M3 specs page) | 1 | 4 |  |
| `--slider-handle-width` | `--mo-comp-slider-handle-width` | S | `md.comp.slider.handle.width` (M3 specs page) | 1 | 8 |  |
| `--slider-height` | `--mo-comp-slider-height` | O | not printed by M3 for this part | 1 | 4 |  |
| `--slider-icon-length` | `--mo-comp-slider-icon-length` | O | not printed by M3 for this part | 4 | 8 |  |
| `--slider-inactive-track` | `--mo-comp-slider-inactive-track` | O | not printed by M3 for this part | 1 | 4 |  |
| `--slider-large-track-radius` | `--mo-comp-slider-large-track-radius` | O | not printed by M3 for this part | 1 | 2 |  |
| `--slider-medium-track-radius` | `--mo-comp-slider-medium-track-radius` | O | not printed by M3 for this part | 1 | 2 |  |
| `--slider-reach` | `--mo-comp-slider-reach` | O | not printed by M3 for this part | 1 | 23 |  |
| `--slider-room` | `--mo-comp-slider-room` | O | not printed by M3 for this part | 2 | 8 |  |
| `--slider-stop-active-color` | `--mo-comp-slider-active-stop-indicator-container-color` | S | `md.comp.slider.active.stop-indicator.container.color` (M3 specs page) | 1 | 3 |  |
| `--slider-stop-color` | `--mo-comp-slider-inactive-stop-indicator-container-color` | S | `md.comp.slider.inactive.stop-indicator.container.color` (M3 specs page) | 1 | 3 |  |
| `--slider-track-corner` | `--mo-comp-slider-track-corner` | O | not printed by M3 for this part | 5 | 11 |  |
| `--slider-track-gap` | `--mo-comp-slider-track-gap` | O | not printed by M3 for this part | 1 | 10 |  |
| `--slider-track-height` | `--mo-comp-slider-active-track-height` | S | `md.comp.slider.active.track.height` (M3 specs page) | 1 | 3 |  |
| `--slider-track-inner-radius` | `--mo-comp-slider-active-track-inner-corner-corner-size` | S | `md.comp.slider.active.track.inner-corner.corner-size` (M3 specs page) | 1 | 11 |  |
| `--slider-track-radius` | `--mo-comp-slider-active-track-shape` | S | `md.comp.slider.active.track.shape` (M3 specs page) | 1 | 7 |  |
| `--slider-track-thickness` | `--mo-comp-slider-track-thickness` | O | not printed by M3 for this part | 5 | 10 |  |
| `--slider-value-radius` | `--mo-comp-slider-value-radius` | O | not printed by M3 for this part | 1 | 3 |  |
| `--slider-value-room` | `--mo-comp-slider-value-room` | O | not printed by M3 for this part | 1 | 4 |  |
| `--slider-value-surface` | `--mo-comp-slider-label-container-color` | S | `md.comp.slider.label.container.color` (M3 specs page) | 1 | 3 |  |
| `--slider-value-text` | `--mo-comp-slider-label-label-text-color` | S | `md.comp.slider.label.label-text.color` (M3 specs page) | 1 | 3 |  |
| `--slider-xlarge-track-radius` | `--mo-comp-slider-xlarge-track-radius` | O | not printed by M3 for this part | 1 | 2 |  |
| `--snackbar-action-hover` | `--mo-comp-snackbar-action-hover` | O | not printed by M3 for this part | 1 | 3 |  |
| `--snackbar-action-text` | `--mo-comp-snackbar-action-label-text-color` | S | `md.comp.snackbar.action.label-text.color` (M3 specs page) | 1 | 3 |  |
| `--snackbar-backdrop` | `--mo-comp-snackbar-backdrop` | O | not printed by M3 for this part | 1 | 4 |  |
| `--snackbar-padding-block` | `--mo-comp-snackbar-padding-block` | O | not printed by M3 for this part | 1 | 4 |  |
| `--snackbar-radius` | `--mo-comp-snackbar-container-shape` | S | `md.comp.snackbar.container.shape` (M3 specs page) | 1 | 4 |  |
| `--snackbar-surface` | `--mo-comp-snackbar-container-color` | S | `md.comp.snackbar.container.color` (M3 specs page) | 1 | 3 |  |
| `--snackbar-text` | `--mo-comp-snackbar-supporting-text-color` | S | `md.comp.snackbar.supporting-text.color` (M3 specs page) | 1 | 5 |  |
| `--split-button-inner` | `--mo-comp-split-button-inner` | O | not printed by M3 for this part | 3 | 7 |  |
| `--split-button-inner-radius` | `--mo-comp-split-button-medium-inner-corner-corner-size` | S | `md.comp.split-button.medium.inner-corner.corner-size` (M3 specs page) | 1 | 3 |  |
| `--split-button-large-inner-radius` | `--mo-comp-split-button-large-inner-corner-corner-size` | S | `md.comp.split-button.large.inner-corner.corner-size` (M3 specs page) | 1 | 3 |  |
| `--split-button-xlarge-inner-radius` | `--mo-comp-split-button-xlarge-inner-corner-corner-size` | S | `md.comp.split-button.xlarge.inner-corner.corner-size` (M3 specs page) | 1 | 3 |  |
| `--switch-disabled-opacity` | `--mo-comp-switch-disabled-opacity` | O | not printed by M3 for this part | 1 | 3 |  |
| `--switch-gap` | `--mo-comp-switch-gap` | O | not printed by M3 for this part | 1 | 3 |  |
| `--switch-handle-checked-size` | `--mo-comp-switch-selected-handle-width` | S | `md.comp.switch.selected.handle.width` (M3 specs page) | 1 | 6 |  |
| `--switch-handle-checked-surface` | `--mo-comp-switch-selected-handle-color` | S | `md.comp.switch.selected.handle.color` (M3 specs page) | 1 | 3 |  |
| `--switch-handle-icon-size` | `--mo-comp-switch-unselected-icon-size` | S | `md.comp.switch.unselected.icon.size` (M3 specs page) | 1 | 4 |  |
| `--switch-handle-pressed-size` | `--mo-comp-switch-pressed-handle-width` | S | `md.comp.switch.pressed.handle.width` (M3 specs page) | 1 | 4 |  |
| `--switch-handle-size` | `--mo-comp-switch-unselected-handle-width` | S | `md.comp.switch.unselected.handle.width` (M3 specs page) | 1 | 10 |  |
| `--switch-handle-surface` | `--mo-comp-switch-unselected-handle-color` | S | `md.comp.switch.unselected.handle.color` (M3 specs page) | 1 | 4 |  |
| `--switch-height` | `--mo-comp-switch-track-height` | S | `md.comp.switch.track.height` (M3 specs page) | 1 | 5 |  |
| `--switch-icon-checked-color` | `--mo-comp-switch-selected-icon-color` | S | `md.comp.switch.selected.icon.color` (M3 specs page) | 1 | 3 |  |
| `--switch-icon-color` | `--mo-comp-switch-unselected-icon-color` | S | `md.comp.switch.unselected.icon.color` (M3 specs page) | 1 | 3 |  |
| `--switch-track-line` | `--mo-comp-switch-unselected-track-outline-color` | S | `md.comp.switch.unselected.track.outline.color` (M3 specs page) | 1 | 3 |  |
| `--switch-track-line-width` | `--mo-comp-switch-track-outline-width` | S | `md.comp.switch.track.outline.width` (M3 specs page) | 1 | 3 |  |
| `--switch-track-surface` | `--mo-comp-switch-unselected-track-color` | S | `md.comp.switch.unselected.track.color` (M3 specs page) | 1 | 3 |  |
| `--switch-width` | `--mo-comp-switch-track-width` | S | `md.comp.switch.track.width` (M3 specs page) | 1 | 3 |  |
| `--text-field-box` | `--mo-comp-text-field-box` | O | not printed by M3 for this part | 1 | 11 |  |
| `--text-field-disabled-opacity` | `--mo-comp-text-field-disabled-opacity` | O | not printed by M3 for this part | 1 | 4 |  |
| `--text-field-error` | `--mo-comp-text-field-error` | O | not printed by M3 for this part | 1 | 12 |  |
| `--text-field-filled-focus-line` | `--mo-comp-text-field-filled-focus-line` | O | not printed by M3 for this part | 1 | 5 |  |
| `--text-field-filled-hover-line` | `--mo-comp-text-field-filled-hover-line` | O | not printed by M3 for this part | 1 | 3 |  |
| `--text-field-filled-line` | `--mo-comp-text-field-filled-line` | O | not printed by M3 for this part | 1 | 4 |  |
| `--text-field-filled-surface` | `--mo-comp-filled-text-field-container-color` | S | `md.comp.filled-text-field.container.color` (M3 specs page) | 1 | 2 |  |
| `--text-field-font-size` | `--mo-comp-text-field-font-size` | O | not printed by M3 for this part | 1 | 3 |  |
| `--text-field-height` | `--mo-comp-filled-text-field-container-height` | S | `md.comp.filled-text-field.container.height` (M3 specs page) | 2 | 15 |  |
| `--text-field-icon-gap` | `--mo-comp-text-field-icon-gap` | O | not printed by M3 for this part | 1 | 5 |  |
| `--text-field-icon-padding` | `--mo-comp-text-field-icon-padding` | O | not printed by M3 for this part | 1 | 5 |  |
| `--text-field-label-start` | `--mo-comp-text-field-label-start` | O | not printed by M3 for this part | 3 | 5 |  |
| `--text-field-label-surface` | `--mo-comp-text-field-label-surface` | O | not printed by M3 for this part | 2 | 5 |  |
| `--text-field-outlined-focus-line` | `--mo-comp-outlined-text-field-focus-outline-color` | S | `md.comp.outlined-text-field.focus.outline.color` (M3 specs page) | 1 | 5 |  |
| `--text-field-outlined-hover-line` | `--mo-comp-outlined-text-field-hover-outline-color` | S | `md.comp.outlined-text-field.hover.outline.color` (M3 specs page) | 1 | 3 |  |
| `--text-field-outlined-line` | `--mo-comp-outlined-text-field-outline-color` | S | `md.comp.outlined-text-field.outline.color` (M3 specs page) | 1 | 4 |  |
| `--text-field-outlined-surface` | `--mo-comp-text-field-outlined-surface` | O | not printed by M3 for this part | 1 | 3 |  |
| `--text-field-padding` | `--mo-comp-text-field-padding` | O | not printed by M3 for this part | 2 | 12 |  |
| `--text-field-radius` | `--mo-comp-text-field-radius` | O | not printed by M3 for this part | 1 | 5 |  |
| `--time-picker-box-radius` | `--mo-comp-time-picker-box-radius` | O | not printed by M3 for this part | 1 | 4 |  |
| `--time-picker-box-selected-surface` | `--mo-comp-time-picker-box-selected-surface` | O | not printed by M3 for this part | 1 | 3 |  |
| `--time-picker-box-selected-text` | `--mo-comp-time-picker-box-selected-text` | O | not printed by M3 for this part | 1 | 3 |  |
| `--time-picker-box-surface` | `--mo-comp-time-picker-box-surface` | O | not printed by M3 for this part | 1 | 4 |  |
| `--time-picker-dial-surface` | `--mo-comp-time-picker-dial-surface` | O | not printed by M3 for this part | 1 | 3 |  |
| `--time-picker-headline-color` | `--mo-comp-time-picker-headline-color` | O | not printed by M3 for this part | 1 | 3 |  |
| `--time-picker-ring` | `--mo-comp-time-picker-ring` | O | not printed by M3 for this part | 1 | 5 |  |
| `--toolbar-docked-backdrop` | `--mo-comp-toolbar-docked-backdrop` | O | not printed by M3 for this part | 2 | 4 |  |
| `--toolbar-docked-line` | `--mo-comp-toolbar-docked-line` | O | not printed by M3 for this part | 1 | 4 |  |
| `--toolbar-docked-line-width` | `--mo-comp-toolbar-docked-line-width` | O | not printed by M3 for this part | 2 | 6 |  |
| `--toolbar-floating-line` | `--mo-comp-toolbar-floating-line` | O | not printed by M3 for this part | 2 | 4 |  |
| `--toolbar-floating-radius` | `--mo-comp-toolbar-floating-container-shape` | S | `md.comp.toolbar.floating.container.shape` (M3 specs page) | 1 | 3 |  |
| `--toolbar-standard-surface` | `--mo-comp-toolbar-docked-container-color` | S | `md.comp.toolbar.docked.container.color` (M3 specs page) | 2 | 4 |  |
| `--tooltip-plain-radius` | `--mo-comp-plain-tooltip-container-shape` | S | `md.comp.plain-tooltip.container.shape` (M3 specs page) | 1 | 2 |  |
| `--tooltip-plain-surface` | `--mo-comp-plain-tooltip-container-color` | S | `md.comp.plain-tooltip.container.color` (M3 specs page) | 1 | 3 |  |
| `--tooltip-plain-text` | `--mo-comp-plain-tooltip-supporting-text-color` | S | `md.comp.plain-tooltip.supporting-text.color` (M3 specs page) | 1 | 2 |  |
| `--tooltip-rich-line` | `--mo-comp-tooltip-rich-line` | O | not printed by M3 for this part | 1 | 2 |  |
| `--tooltip-rich-radius` | `--mo-comp-rich-tooltip-container-shape` | S | `md.comp.rich-tooltip.container.shape` (M3 specs page) | 1 | 2 |  |
| `--tooltip-rich-subhead` | `--mo-comp-rich-tooltip-subhead-color` | S | `md.comp.rich-tooltip.subhead.color` (M3 specs page) | 1 | 2 |  |
| `--tooltip-rich-text` | `--mo-comp-rich-tooltip-supporting-text-color` | S | `md.comp.rich-tooltip.supporting-text.color` (M3 specs page) | 1 | 2 |  |
| `--top-app-bar-backdrop` | `--mo-comp-top-app-bar-backdrop` | O | not printed by M3 for this part | 1 | 3 |  |
| `--top-app-bar-line-width` | `--mo-comp-top-app-bar-line-width` | O | not printed by M3 for this part | 1 | 3 |  |
| `--top-app-bar-surface` | `--mo-comp-top-app-bar-surface` | O | not printed by M3 for this part | 1 | 4 |  |

### theme parts (25)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--theme-blog-first-space` | `--mo-comp-theme-blog-first-space` | O |  | 1 | 2 | ours: the standard theme's page parts (logo, post list, home first); owner decision 2: --mo-comp-<part>-* |
| `--theme-blog-first-space-large` | `--mo-comp-theme-blog-first-space-large` | O |  | 1 | 2 | ″ |
| `--theme-home-first-space` | `--mo-comp-theme-home-first-space` | O |  | 2 | 3 | ″ |
| `--theme-home-first-space-large` | `--mo-comp-theme-home-first-space-large` | O |  | 2 | 3 | ″ |
| `--theme-logo-mark` | `--mo-comp-theme-logo-mark` | O |  | 1 | 2 | ″ |
| `--theme-logo-mark-scale` | `--mo-comp-theme-logo-mark-scale` | O |  | 1 | 5 | ″ |
| `--theme-logo-name-size` | `--mo-comp-theme-logo-name-size` | O |  | 1 | 2 | ″ |
| `--theme-logo-name-weight` | `--mo-comp-theme-logo-name-weight` | O |  | 1 | 2 | ″ |
| `--theme-logo-role-display` | `--mo-comp-theme-logo-role-display` | O |  | 1 | 2 | ″ |
| `--theme-logo-role-display-large` | `--mo-comp-theme-logo-role-display-large` | O |  | 1 | 2 | ″ |
| `--theme-logo-tile` | `--mo-comp-theme-logo-tile` | O |  | 1 | 2 | ″ |
| `--theme-logo-tile-padding` | `--mo-comp-theme-logo-tile-padding` | O |  | 1 | 2 | ″ |
| `--theme-logo-tile-radius` | `--mo-comp-theme-logo-tile-radius` | O |  | 1 | 3 | ″ |
| `--theme-on-scrim-colour` | `--mo-comp-theme-on-scrim-colour` | O |  | 3 | 6 | ″ |
| `--theme-page-fade` | `--mo-comp-theme-page-fade` | O |  | 1 | 2 | ″ |
| `--theme-picture-radius` | `--mo-comp-theme-picture-radius` | O |  | 2 | 7 | ″ |
| `--theme-post-picture-radius` | `--mo-comp-theme-post-picture-radius` | O |  | 1 | 4 | ″ |
| `--theme-scrim-colour` | `--mo-comp-theme-scrim-colour` | O |  | 3 | 13 | ″ |
| `--theme-section-space` | `--mo-comp-theme-section-space` | O |  | 3 | 5 | ″ |
| `--theme-section-space-large` | `--mo-comp-theme-section-space-large` | O |  | 3 | 5 | ″ |
| `--theme-side-gap` | `--mo-comp-theme-side-gap` | O |  | 1 | 2 | ″ |
| `--theme-side-width` | `--mo-comp-theme-side-width` | O |  | 1 | 3 | ″ |
| `--theme-title-leading` | `--mo-comp-theme-title-leading` | O |  | 2 | 4 | ″ |
| `--theme-title-size` | `--mo-comp-theme-title-size` | O |  | 1 | 3 | ″ |
| `--theme-title-size-large` | `--mo-comp-theme-title-size-large` | O |  | 1 | 3 | ″ |

### editor and previews (39)

| Current | New | Kind | M3 | Declared | Reads | Note |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| `--editor-drawer-header-padding` | `--mo-comp-editor-drawer-header-padding` | O |  | 1 | 2 | ours: the editor's chrome and the Google result preview; owner decision 2: --mo-comp-<part>-* |
| `--editor-drawer-header-text` | `--mo-comp-editor-drawer-header-text` | O |  | 1 | 3 | ″ |
| `--editor-frame-line` | `--mo-comp-editor-frame-line` | O |  | 1 | 4 | ″ |
| `--editor-frame-outset` | `--mo-comp-editor-frame-outset` | O |  | 1 | 11 | ″ |
| `--editor-hint-color` | `--mo-comp-editor-hint-color` | O |  | 1 | 4 | ″ |
| `--editor-menu-shadow` | `--mo-comp-editor-menu-shadow` | O |  | 1 | 3 | ″ |
| `--editor-menu-surface` | `--mo-comp-editor-menu-surface` | O |  | 1 | 3 | ″ |
| `--editor-pad-x` | `--mo-comp-editor-pad-x` | O |  | 1 | 5 | ″ |
| `--editor-pad-y` | `--mo-comp-editor-pad-y` | O |  | 1 | 3 | ″ |
| `--editor-section-frame` | `--mo-comp-editor-section-frame` | O |  | 1 | 3 | ″ |
| `--editor-section-gap` | `--mo-comp-editor-section-gap` | O |  | 1 | 3 | ″ |
| `--editor-section-pad` | `--mo-comp-editor-section-pad` | O |  | 1 | 8 | ″ |
| `--editor-section-rhythm` | `--mo-comp-editor-section-rhythm` | O |  | 1 | 2 | ″ |
| `--editor-sheet-tall` | `--mo-comp-editor-sheet-tall` | O |  | 1 | 3 | ″ |
| `--editor-status-average` | `--mo-comp-editor-status-average` | O |  | 1 | 3 | ″ |
| `--editor-status-average-surface` | `--mo-comp-editor-status-average-surface` | O |  | 1 | 2 | ″ |
| `--editor-status-average-text` | `--mo-comp-editor-status-average-text` | O |  | 1 | 2 | ″ |
| `--editor-status-bad` | `--mo-comp-editor-status-bad` | O |  | 1 | 4 | ″ |
| `--editor-status-bad-surface` | `--mo-comp-editor-status-bad-surface` | O |  | 1 | 2 | ″ |
| `--editor-status-bad-text` | `--mo-comp-editor-status-bad-text` | O |  | 1 | 2 | ″ |
| `--editor-status-good` | `--mo-comp-editor-status-good` | O |  | 1 | 5 | ″ |
| `--editor-status-good-surface` | `--mo-comp-editor-status-good-surface` | O |  | 1 | 2 | ″ |
| `--editor-status-good-text` | `--mo-comp-editor-status-good-text` | O |  | 1 | 2 | ″ |
| `--google-background` | `--mo-comp-google-background` | O |  | 1 | 2 | ″ |
| `--google-date` | `--mo-comp-google-date` | O |  | 1 | 2 | ″ |
| `--google-icon-fill` | `--mo-comp-google-icon-fill` | O |  | 1 | 2 | ″ |
| `--google-icon-letter` | `--mo-comp-google-icon-letter` | O |  | 1 | 2 | ″ |
| `--google-icon-ring` | `--mo-comp-google-icon-ring` | O |  | 1 | 2 | ″ |
| `--google-separator` | `--mo-comp-google-separator` | O |  | 1 | 2 | ″ |
| `--google-site` | `--mo-comp-google-site` | O |  | 1 | 2 | ″ |
| `--google-text` | `--mo-comp-google-text` | O |  | 1 | 4 | ″ |
| `--google-title` | `--mo-comp-google-title` | O |  | 1 | 2 | ″ |
| `--google-title-phone` | `--mo-comp-google-title-phone` | O |  | 1 | 2 | ″ |
| `--page-on-primary-container` | `--mo-comp-page-on-primary-container` | O |  | 1 | 2 | ″ |
| `--page-on-secondary-container` | `--mo-comp-page-on-secondary-container` | O |  | 1 | 2 | ″ |
| `--page-on-tertiary-container` | `--mo-comp-page-on-tertiary-container` | O |  | 1 | 2 | ″ |
| `--page-primary-container` | `--mo-comp-page-primary-container` | O |  | 1 | 2 | ″ |
| `--page-secondary-container` | `--mo-comp-page-secondary-container` | O |  | 1 | 2 | ″ |
| `--page-tertiary-container` | `--mo-comp-page-tertiary-container` | O |  | 1 | 2 | ″ |

### Not renamed: Tailwind's (129)

`--tw-prose-body`, `--tw-prose-headings`, `--tw-prose-bold`, `--tw-prose-links`, `--tw-prose-bullets`, `--tw-prose-counters`, `--tw-prose-code`, `--tw-prose-quotes`, `--tw-prose-quote-borders`, `--tw-prose-captions`, `--tw-prose-hr`, `--tw-prose-lead`, `--tw-prose-th-borders`, `--tw-prose-td-borders`, `--font-sans`, `--color-primary`, `--color-on-primary`, `--color-primary-container`, `--color-on-primary-container`, `--color-secondary`, `--color-on-secondary`, `--color-secondary-container`, `--color-on-secondary-container`, `--color-tertiary`, `--color-on-tertiary`, `--color-tertiary-container`, `--color-on-tertiary-container`, `--color-error`, `--color-on-error`, `--color-error-container`, `--color-on-error-container`, `--color-primary-fixed`, `--color-primary-fixed-dim`, `--color-on-primary-fixed`, `--color-on-primary-fixed-variant`, `--color-secondary-fixed`, `--color-secondary-fixed-dim`, `--color-on-secondary-fixed`, `--color-on-secondary-fixed-variant`, `--color-tertiary-fixed`, `--color-tertiary-fixed-dim`, `--color-on-tertiary-fixed`, `--color-on-tertiary-fixed-variant`, `--color-surface-dim`, `--color-surface`, `--color-surface-bright`, `--color-surface-container-lowest`, `--color-surface-container-low`, `--color-surface-container`, `--color-surface-container-high`, `--color-surface-container-highest`, `--color-on-surface`, `--color-on-surface-variant`, `--color-outline`, `--color-outline-variant`, `--color-inverse-surface`, `--color-inverse-on-surface`, `--color-inverse-primary`, `--color-scrim`, `--color-shadow`, `--radius-panel`, `--radius-panel-small`, `--shadow-soft`, `--ease-soft`, `--text-display-large`, `--text-display-large--line-height`, `--text-display-large--letter-spacing`, `--text-display-large--font-weight`, `--text-display-medium`, `--text-display-medium--line-height`, `--text-display-medium--letter-spacing`, `--text-display-medium--font-weight`, `--text-display-small`, `--text-display-small--line-height`, `--text-display-small--letter-spacing`, `--text-display-small--font-weight`, `--text-headline-large`, `--text-headline-large--line-height`, `--text-headline-large--letter-spacing`, `--text-headline-large--font-weight`, `--text-headline-medium`, `--text-headline-medium--line-height`, `--text-headline-medium--letter-spacing`, `--text-headline-medium--font-weight`, `--text-headline-small`, `--text-headline-small--line-height`, `--text-headline-small--letter-spacing`, `--text-headline-small--font-weight`, `--text-title-large`, `--text-title-large--line-height`, `--text-title-large--letter-spacing`, `--text-title-large--font-weight`, `--text-title-medium`, `--text-title-medium--line-height`, `--text-title-medium--letter-spacing`, `--text-title-medium--font-weight`, `--text-title-small`, `--text-title-small--line-height`, `--text-title-small--letter-spacing`, `--text-title-small--font-weight`, `--text-body-large`, `--text-body-large--line-height`, `--text-body-large--letter-spacing`, `--text-body-large--font-weight`, `--text-body-medium`, `--text-body-medium--line-height`, `--text-body-medium--letter-spacing`, `--text-body-medium--font-weight`, `--text-body-small`, `--text-body-small--line-height`, `--text-body-small--letter-spacing`, `--text-body-small--font-weight`, `--text-label-large`, `--text-label-large--line-height`, `--text-label-large--letter-spacing`, `--text-label-large--font-weight`, `--text-label-medium`, `--text-label-medium--line-height`, `--text-label-medium--letter-spacing`, `--text-label-medium--font-weight`, `--text-label-small`, `--text-label-small--line-height`, `--text-label-small--letter-spacing`, `--text-label-small--font-weight`, `--breakpoint-*`, `--breakpoint-medium`, `--breakpoint-expanded`, `--breakpoint-large`, `--breakpoint-extra-large`
