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

**What the pages do not print as text:** the literal strings for colour roles (`md.sys.color.primary`), shape (`md.sys.shape.corner.large`), elevation (`md.sys.elevation.level1`), state (`md.sys.state.hover…`), the spring composites, and every component token table (none of them is in the page text my Playwright reader extracted, including text inside shadow roots; I did not check the images). Those names follow the printed rule (`md` + class + descriptive words) and Material's own token naming; each is marked **S** below, and should be confirmed against the token modules before PR 3. Where M3 has no token (space, density, grid, block, section, editor) the name is ours (**O**) in the same pattern.

CSS custom properties cannot contain dots, so `md.sys.color.primary` becomes `--mo-sys-color-primary` (Material's own web tokens do the same: `--md-sys-color-primary`).

## Scope

- 746 names are renamed; 129 are Tailwind's and stay (`--tw-*`, and everything declared in an `@theme` block: `--color-*`, `--text-*`, `--font-sans`, `--breakpoint-*`, `--radius-panel*`, `--shadow-soft`, `--ease-soft`, `--default-transition-*`). Their right-hand sides are repointed to the new names.
- The roles in `defaults/colors.ts` (`colorRoles`) are written as `--mo-<name>` into `<head>` by `colorsCss` and are declared nowhere in CSS: the rename changes that writer as well. `src/data/colors.json` keys are the role names without the prefix and do not change.
- Table counts: **S** = a name by M3's pattern, **O** = ours. The "reads" column counts the places a name is written in the repository's tracked files (CSS, TSX class strings, scripts, docs), excluding `docs/superpowers/`, release notes and changesets.

## Open questions for the owner

1. **Component attribute words (424 names).** M3's component tokens are `md.comp.<component>.<part>.<attribute>` with words such as `container.color`, `label-text.color`, `outline.width`, `container.shadow-color`. Ours are shorter (`--button-filled-surface`, `-text`, `-line`, `-hover`). The table does the mechanical step only: `--button-filled-surface` → `--mo-comp-button-filled-surface`. Following M3's words as well means a per-token mapping from about 40 component spec pages, and a second break for every theme. Recommendation: mechanical now, M3's attribute words only where a spec page prints a name and the token is a one-to-one match, as a separate PR.
2. **Standard theme parts and the editor** (`--theme-*`, `--editor-*`, `--google-*`, `--page-*`): M3 has no components for them. Proposed `--mo-comp-<part>-*`. The editor's own tokens (`--editor-*`, 23) are not a contract with any theme and could stay private to the editor instead.
3. **Space, density, grid, block, section** are ours: `--mo-ref-space-*` (the scale), `--mo-sys-density-*`, `--mo-sys-grid-*`, `--mo-sys-block-*`, `--mo-sys-section-*`.
4. **Contract numbers.** Old names stop working with no alias, so a theme or an app that sets or reads `--mo-primary`, `--button-*` and so on breaks. By the repository's rule (`lib/contracts.mjs`: raised when a theme written to the one before no longer works) `THEME_API` goes from 5 to 6, and `APP_API` from 5 to 6 (an app's CSS reads the roles); `APP_APIS` (now 4 and 5) then lists only 6, or the editor keeps running apps written to 4 and 5 that now draw without colours. The owner decides. The store (morpheme-appstore) offers only the contracts the editor reads.
5. **Readers outside this repository** (morpheme-apps themes and apps, morpheme-website, Sarashjemmesidedata): the PM checks them from this table; the count is not known here.

## How PR 3 will be proved

The computed-value script of PR 1 and PR 2 runs on the built demo before and after with this table as a map: every old name's computed value on every distinct element of every page must equal the new name's value (light and dark, three widths), the computed values of all other CSS properties must be identical, and no old name may remain in the repository (a check that fails on any name in the table's left column, except in release notes and the changelog, which are history).

## The table

Kind S = by M3's pattern, O = ours. Reads are counted in tracked files.

### color (47)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-error` | `--mo-sys-color-error` | S | 0 | 6 | M3 colour roles (roles page), md.sys.color.<role> |
| `--mo-error-container` | `--mo-sys-color-error-container` | S | 0 | 1 | ″ |
| `--mo-inverse-on-surface` | `--mo-sys-color-inverse-on-surface` | S | 0 | 12 | ″ |
| `--mo-inverse-primary` | `--mo-sys-color-inverse-primary` | S | 0 | 5 | ″ |
| `--mo-inverse-surface` | `--mo-sys-color-inverse-surface` | S | 0 | 8 | ″ |
| `--mo-on-error` | `--mo-sys-color-on-error` | S | 0 | 2 | ″ |
| `--mo-on-error-container` | `--mo-sys-color-on-error-container` | S | 0 | 1 | ″ |
| `--mo-on-primary` | `--mo-sys-color-on-primary` | S | 1 | 21 | ″ |
| `--mo-on-primary-container` | `--mo-sys-color-on-primary-container` | S | 1 | 17 | ″ |
| `--mo-on-primary-fixed` | `--mo-sys-color-on-primary-fixed` | S | 0 | 2 | ″ |
| `--mo-on-primary-fixed-variant` | `--mo-sys-color-on-primary-fixed-variant` | S | 0 | 2 | ″ |
| `--mo-on-secondary` | `--mo-sys-color-on-secondary` | S | 1 | 13 | ″ |
| `--mo-on-secondary-container` | `--mo-sys-color-on-secondary-container` | S | 1 | 29 | ″ |
| `--mo-on-secondary-fixed` | `--mo-sys-color-on-secondary-fixed` | S | 0 | 1 | ″ |
| `--mo-on-secondary-fixed-variant` | `--mo-sys-color-on-secondary-fixed-variant` | S | 0 | 1 | ″ |
| `--mo-on-surface` | `--mo-sys-color-on-surface` | S | 4 | 71 | ″ |
| `--mo-on-surface-variant` | `--mo-sys-color-on-surface-variant` | S | 4 | 59 | ″ |
| `--mo-on-tertiary` | `--mo-sys-color-on-tertiary` | S | 1 | 11 | ″ |
| `--mo-on-tertiary-container` | `--mo-sys-color-on-tertiary-container` | S | 1 | 15 | ″ |
| `--mo-on-tertiary-fixed` | `--mo-sys-color-on-tertiary-fixed` | S | 0 | 1 | ″ |
| `--mo-on-tertiary-fixed-variant` | `--mo-sys-color-on-tertiary-fixed-variant` | S | 0 | 1 | ″ |
| `--mo-outline` | `--mo-sys-color-outline` | S | 1 | 14 | ″ |
| `--mo-outline-variant` | `--mo-sys-color-outline-variant` | S | 1 | 16 | ″ |
| `--mo-primary` | `--mo-sys-color-primary` | S | 4 | 91 | ″ |
| `--mo-primary-container` | `--mo-sys-color-primary-container` | S | 1 | 10 | ″ |
| `--mo-primary-fixed` | `--mo-sys-color-primary-fixed` | S | 0 | 2 | ″ |
| `--mo-primary-fixed-dim` | `--mo-sys-color-primary-fixed-dim` | S | 0 | 2 | ″ |
| `--mo-primary-hover` | `--mo-sys-color-primary-hover` | O | 1 | 6 | ours: a state colour |
| `--mo-scrim` | `--mo-sys-color-scrim` | S | 0 | 3 | ″ |
| `--mo-scrim-overlay` | `--mo-sys-color-scrim-overlay` | O | 1 | 7 | ours: the scrim as drawn over the page |
| `--mo-secondary` | `--mo-sys-color-secondary` | S | 1 | 20 | ″ |
| `--mo-secondary-container` | `--mo-sys-color-secondary-container` | S | 1 | 27 | ″ |
| `--mo-secondary-fixed` | `--mo-sys-color-secondary-fixed` | S | 0 | 1 | ″ |
| `--mo-secondary-fixed-dim` | `--mo-sys-color-secondary-fixed-dim` | S | 0 | 1 | ″ |
| `--mo-shadow` | `--mo-sys-color-shadow` | S | 0 | 53 | ″ |
| `--mo-surface` | `--mo-sys-color-surface` | S | 1 | 33 | ″ |
| `--mo-surface-bright` | `--mo-sys-color-surface-bright` | S | 1 | 3 | ″ |
| `--mo-surface-container` | `--mo-sys-color-surface-container` | S | 1 | 19 | ″ |
| `--mo-surface-container-high` | `--mo-sys-color-surface-container-high` | S | 1 | 41 | ″ |
| `--mo-surface-container-highest` | `--mo-sys-color-surface-container-highest` | S | 1 | 17 | ″ |
| `--mo-surface-container-low` | `--mo-sys-color-surface-container-low` | S | 1 | 11 | ″ |
| `--mo-surface-container-lowest` | `--mo-sys-color-surface-container-lowest` | S | 1 | 8 | ″ |
| `--mo-surface-dim` | `--mo-sys-color-surface-dim` | S | 1 | 3 | ″ |
| `--mo-tertiary` | `--mo-sys-color-tertiary` | S | 1 | 15 | ″ |
| `--mo-tertiary-container` | `--mo-sys-color-tertiary-container` | S | 1 | 9 | ″ |
| `--mo-tertiary-fixed` | `--mo-sys-color-tertiary-fixed` | S | 0 | 1 | ″ |
| `--mo-tertiary-fixed-dim` | `--mo-sys-color-tertiary-fixed-dim` | S | 0 | 1 | ″ |

### shape (10)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-shape-extra-extra-large` | `--mo-sys-shape-corner-extra-extra-large` | S | 1 | 1 | M3 corner scale step names (corner-radius-scale page: extra small … extra extra large, full, none) |
| `--mo-shape-extra-large` | `--mo-sys-shape-corner-extra-large` | S | 1 | 15 | ″ |
| `--mo-shape-extra-large-increased` | `--mo-sys-shape-corner-extra-large-increased` | S | 1 | 1 | ″ |
| `--mo-shape-extra-small` | `--mo-sys-shape-corner-extra-small` | S | 1 | 16 | ″ |
| `--mo-shape-full` | `--mo-sys-shape-corner-full` | S | 2 | 80 | ″ |
| `--mo-shape-large` | `--mo-sys-shape-corner-large` | S | 1 | 25 | ″ |
| `--mo-shape-large-increased` | `--mo-sys-shape-corner-large-increased` | S | 1 | 3 | ″ |
| `--mo-shape-medium` | `--mo-sys-shape-corner-medium` | S | 1 | 23 | ″ |
| `--mo-shape-none` | `--mo-sys-shape-corner-none` | S | 1 | 8 | ″ |
| `--mo-shape-small` | `--mo-sys-shape-corner-small` | S | 1 | 14 | ″ |

### elevation (17)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-elevation-0-color` | `--mo-sys-elevation-level0-color` | O | 2 | 13 | M3 has levels 0 to 5 (token md.sys.elevation.levelN is a distance); our level has a colour and two shadows |
| `--mo-elevation-0-shadow` | `--mo-sys-elevation-level0-shadow` | O | 2 | 35 | ″ |
| `--mo-elevation-1-color` | `--mo-sys-elevation-level1-color` | O | 2 | 17 | ″ |
| `--mo-elevation-1-rest-shadow` | `--mo-sys-elevation-level1-rest-shadow` | O | 2 | 30 | ″ |
| `--mo-elevation-1-shadow` | `--mo-sys-elevation-level1-shadow` | O | 4 | 26 | ″ |
| `--mo-elevation-2-color` | `--mo-sys-elevation-level2-color` | O | 2 | 18 | ″ |
| `--mo-elevation-2-rest-shadow` | `--mo-sys-elevation-level2-rest-shadow` | O | 2 | 13 | ″ |
| `--mo-elevation-2-shadow` | `--mo-sys-elevation-level2-shadow` | O | 4 | 23 | ″ |
| `--mo-elevation-3-color` | `--mo-sys-elevation-level3-color` | O | 2 | 9 | ″ |
| `--mo-elevation-3-rest-shadow` | `--mo-sys-elevation-level3-rest-shadow` | O | 2 | 18 | ″ |
| `--mo-elevation-3-shadow` | `--mo-sys-elevation-level3-shadow` | O | 4 | 18 | ″ |
| `--mo-elevation-4-color` | `--mo-sys-elevation-level4-color` | O | 2 | 3 | ″ |
| `--mo-elevation-4-rest-shadow` | `--mo-sys-elevation-level4-rest-shadow` | O | 2 | 3 | ″ |
| `--mo-elevation-4-shadow` | `--mo-sys-elevation-level4-shadow` | O | 4 | 17 | ″ |
| `--mo-elevation-5-color` | `--mo-sys-elevation-level5-color` | O | 2 | 4 | ″ |
| `--mo-elevation-5-rest-shadow` | `--mo-sys-elevation-level5-rest-shadow` | O | 2 | 3 | ″ |
| `--mo-elevation-5-shadow` | `--mo-sys-elevation-level5-shadow` | O | 4 | 7 | ″ |

### state (2)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-hover` | `--mo-sys-state-mo-hover-layer` | O | 1 | 23 | M3 state tokens are opacities (hover 8%, pressed 10%); ours are the layer colour |
| `--mo-pressed` | `--mo-sys-state-mo-pressed-layer` | O | 1 | 13 | ″ |

### motion (12)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--motion-effects` | `--mo-sys-motion-spring-default-effects` | S | 1 | 97 | M3 spring composite tokens (md.sys.motion.spring.<speed>.<spatial|effects>); the -duration part is ours |
| `--motion-effects-duration` | `--mo-sys-motion-spring-default-effects-duration` | S | 1 | 3 | ″ |
| `--motion-effects-fast` | `--mo-sys-motion-spring-fast-effects` | S | 1 | 17 | ″ |
| `--motion-effects-fast-duration` | `--mo-sys-motion-spring-fast-effects-duration` | S | 1 | 1 | ″ |
| `--motion-effects-slow` | `--mo-sys-motion-spring-slow-effects` | S | 1 | 5 | ″ |
| `--motion-effects-slow-duration` | `--mo-sys-motion-spring-slow-effects-duration` | S | 1 | 2 | ″ |
| `--motion-spatial` | `--mo-sys-motion-spring-default-spatial` | S | 1 | 43 | ″ |
| `--motion-spatial-duration` | `--mo-sys-motion-spring-default-spatial-duration` | S | 1 | 4 | ″ |
| `--motion-spatial-fast` | `--mo-sys-motion-spring-fast-spatial` | S | 1 | 38 | ″ |
| `--motion-spatial-fast-duration` | `--mo-sys-motion-spring-fast-spatial-duration` | S | 1 | 6 | ″ |
| `--motion-spatial-slow` | `--mo-sys-motion-spring-slow-spatial` | S | 1 | 5 | ″ |
| `--motion-spatial-slow-duration` | `--mo-sys-motion-spring-slow-spatial-duration` | S | 1 | 1 | ″ |

### typescale (82)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--type-body-large-font` | `--mo-sys-typescale-body-large-font` | S | 1 | 1 | M3 md.sys.typescale.<role>-<size>; attributes size, line-height, weight, tracking, font |
| `--type-body-large-line-height` | `--mo-sys-typescale-body-large-line-height` | S | 1 | 19 | ″ |
| `--type-body-large-size` | `--mo-sys-typescale-body-large-size` | S | 1 | 22 | ″ |
| `--type-body-large-tracking` | `--mo-sys-typescale-body-large-tracking` | S | 1 | 19 | ″ |
| `--type-body-large-weight` | `--mo-sys-typescale-body-large-weight` | S | 1 | 19 | ″ |
| `--type-body-medium-font` | `--mo-sys-typescale-body-medium-font` | S | 1 | 1 | ″ |
| `--type-body-medium-line-height` | `--mo-sys-typescale-body-medium-line-height` | S | 1 | 33 | ″ |
| `--type-body-medium-size` | `--mo-sys-typescale-body-medium-size` | S | 1 | 40 | ″ |
| `--type-body-medium-tracking` | `--mo-sys-typescale-body-medium-tracking` | S | 1 | 34 | ″ |
| `--type-body-medium-weight` | `--mo-sys-typescale-body-medium-weight` | S | 1 | 28 | ″ |
| `--type-body-small-font` | `--mo-sys-typescale-body-small-font` | S | 1 | 1 | ″ |
| `--type-body-small-line-height` | `--mo-sys-typescale-body-small-line-height` | S | 1 | 9 | ″ |
| `--type-body-small-size` | `--mo-sys-typescale-body-small-size` | S | 1 | 13 | ″ |
| `--type-body-small-tracking` | `--mo-sys-typescale-body-small-tracking` | S | 1 | 9 | ″ |
| `--type-body-small-weight` | `--mo-sys-typescale-body-small-weight` | S | 1 | 9 | ″ |
| `--type-display-large-font` | `--mo-sys-typescale-display-large-font` | S | 1 | 1 | ″ |
| `--type-display-large-line-height` | `--mo-sys-typescale-display-large-line-height` | S | 1 | 5 | ″ |
| `--type-display-large-size` | `--mo-sys-typescale-display-large-size` | S | 1 | 8 | ″ |
| `--type-display-large-tracking` | `--mo-sys-typescale-display-large-tracking` | S | 1 | 5 | ″ |
| `--type-display-large-weight` | `--mo-sys-typescale-display-large-weight` | S | 1 | 6 | ″ |
| `--type-display-medium-font` | `--mo-sys-typescale-display-medium-font` | S | 1 | 1 | ″ |
| `--type-display-medium-line-height` | `--mo-sys-typescale-display-medium-line-height` | S | 1 | 6 | ″ |
| `--type-display-medium-size` | `--mo-sys-typescale-display-medium-size` | S | 1 | 6 | ″ |
| `--type-display-medium-tracking` | `--mo-sys-typescale-display-medium-tracking` | S | 1 | 7 | ″ |
| `--type-display-medium-weight` | `--mo-sys-typescale-display-medium-weight` | S | 1 | 7 | ″ |
| `--type-display-small-font` | `--mo-sys-typescale-display-small-font` | S | 1 | 1 | ″ |
| `--type-display-small-line-height` | `--mo-sys-typescale-display-small-line-height` | S | 1 | 5 | ″ |
| `--type-display-small-size` | `--mo-sys-typescale-display-small-size` | S | 1 | 6 | ″ |
| `--type-display-small-tracking` | `--mo-sys-typescale-display-small-tracking` | S | 1 | 5 | ″ |
| `--type-display-small-weight` | `--mo-sys-typescale-display-small-weight` | S | 1 | 5 | ″ |
| `--type-headline-large-font` | `--mo-sys-typescale-headline-large-font` | S | 1 | 1 | ″ |
| `--type-headline-large-line-height` | `--mo-sys-typescale-headline-large-line-height` | S | 1 | 6 | ″ |
| `--type-headline-large-size` | `--mo-sys-typescale-headline-large-size` | S | 1 | 7 | ″ |
| `--type-headline-large-tracking` | `--mo-sys-typescale-headline-large-tracking` | S | 1 | 7 | ″ |
| `--type-headline-large-weight` | `--mo-sys-typescale-headline-large-weight` | S | 1 | 7 | ″ |
| `--type-headline-medium-font` | `--mo-sys-typescale-headline-medium-font` | S | 1 | 1 | ″ |
| `--type-headline-medium-line-height` | `--mo-sys-typescale-headline-medium-line-height` | S | 1 | 7 | ″ |
| `--type-headline-medium-size` | `--mo-sys-typescale-headline-medium-size` | S | 1 | 7 | ″ |
| `--type-headline-medium-tracking` | `--mo-sys-typescale-headline-medium-tracking` | S | 1 | 6 | ″ |
| `--type-headline-medium-weight` | `--mo-sys-typescale-headline-medium-weight` | S | 1 | 6 | ″ |
| `--type-headline-small-font` | `--mo-sys-typescale-headline-small-font` | S | 1 | 1 | ″ |
| `--type-headline-small-line-height` | `--mo-sys-typescale-headline-small-line-height` | S | 1 | 17 | ″ |
| `--type-headline-small-size` | `--mo-sys-typescale-headline-small-size` | S | 1 | 19 | ″ |
| `--type-headline-small-tracking` | `--mo-sys-typescale-headline-small-tracking` | S | 1 | 16 | ″ |
| `--type-headline-small-weight` | `--mo-sys-typescale-headline-small-weight` | S | 1 | 16 | ″ |
| `--type-label-large-font` | `--mo-sys-typescale-label-large-font` | S | 1 | 1 | ″ |
| `--type-label-large-line-height` | `--mo-sys-typescale-label-large-line-height` | S | 1 | 20 | ″ |
| `--type-label-large-prominent-weight` | `--mo-sys-typescale-label-large-prominent-weight` | S | 1 | 1 | ″ |
| `--type-label-large-size` | `--mo-sys-typescale-label-large-size` | S | 1 | 26 | ″ |
| `--type-label-large-tracking` | `--mo-sys-typescale-label-large-tracking` | S | 1 | 19 | ″ |
| `--type-label-large-weight` | `--mo-sys-typescale-label-large-weight` | S | 1 | 20 | ″ |
| `--type-label-medium-font` | `--mo-sys-typescale-label-medium-font` | S | 1 | 1 | ″ |
| `--type-label-medium-line-height` | `--mo-sys-typescale-label-medium-line-height` | S | 1 | 15 | ″ |
| `--type-label-medium-prominent-weight` | `--mo-sys-typescale-label-medium-prominent-weight` | S | 1 | 1 | ″ |
| `--type-label-medium-size` | `--mo-sys-typescale-label-medium-size` | S | 1 | 16 | ″ |
| `--type-label-medium-tracking` | `--mo-sys-typescale-label-medium-tracking` | S | 1 | 13 | ″ |
| `--type-label-medium-weight` | `--mo-sys-typescale-label-medium-weight` | S | 1 | 14 | ″ |
| `--type-label-small-font` | `--mo-sys-typescale-label-small-font` | S | 1 | 1 | ″ |
| `--type-label-small-line-height` | `--mo-sys-typescale-label-small-line-height` | S | 1 | 7 | ″ |
| `--type-label-small-prominent-weight` | `--mo-sys-typescale-label-small-prominent-weight` | S | 1 | 1 | ″ |
| `--type-label-small-size` | `--mo-sys-typescale-label-small-size` | S | 1 | 8 | ″ |
| `--type-label-small-tracking` | `--mo-sys-typescale-label-small-tracking` | S | 1 | 8 | ″ |
| `--type-label-small-weight` | `--mo-sys-typescale-label-small-weight` | S | 1 | 8 | ″ |
| `--type-lead-line-height` | `--mo-sys-typescale-lead-line-height` | S | 1 | 3 | ″ |
| `--type-lead-size` | `--mo-sys-typescale-lead-size` | S | 1 | 3 | ″ |
| `--type-lead-tracking` | `--mo-sys-typescale-lead-tracking` | S | 1 | 3 | ″ |
| `--type-lead-weight` | `--mo-sys-typescale-lead-weight` | S | 1 | 3 | ″ |
| `--type-title-large-font` | `--mo-sys-typescale-title-large-font` | S | 1 | 1 | ″ |
| `--type-title-large-line-height` | `--mo-sys-typescale-title-large-line-height` | S | 1 | 17 | ″ |
| `--type-title-large-size` | `--mo-sys-typescale-title-large-size` | S | 1 | 16 | ″ |
| `--type-title-large-tracking` | `--mo-sys-typescale-title-large-tracking` | S | 1 | 16 | ″ |
| `--type-title-large-weight` | `--mo-sys-typescale-title-large-weight` | S | 1 | 16 | ″ |
| `--type-title-medium-font` | `--mo-sys-typescale-title-medium-font` | S | 1 | 1 | ″ |
| `--type-title-medium-line-height` | `--mo-sys-typescale-title-medium-line-height` | S | 1 | 14 | ″ |
| `--type-title-medium-size` | `--mo-sys-typescale-title-medium-size` | S | 1 | 17 | ″ |
| `--type-title-medium-tracking` | `--mo-sys-typescale-title-medium-tracking` | S | 1 | 16 | ″ |
| `--type-title-medium-weight` | `--mo-sys-typescale-title-medium-weight` | S | 1 | 16 | ″ |
| `--type-title-small-font` | `--mo-sys-typescale-title-small-font` | S | 1 | 1 | ″ |
| `--type-title-small-line-height` | `--mo-sys-typescale-title-small-line-height` | S | 1 | 6 | ″ |
| `--type-title-small-size` | `--mo-sys-typescale-title-small-size` | S | 1 | 7 | ″ |
| `--type-title-small-tracking` | `--mo-sys-typescale-title-small-tracking` | S | 1 | 7 | ″ |
| `--type-title-small-weight` | `--mo-sys-typescale-title-small-weight` | S | 1 | 7 | ″ |

### space (18)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-space-0` | `--mo-ref-space-0` | O | 1 | 1 | M3 has a spacing page with space100 = 8dp but prints no token names |
| `--mo-space-100` | `--mo-ref-space-100` | O | 1 | 2 | ″ |
| `--mo-space-125` | `--mo-ref-space-125` | O | 1 | 1 | ″ |
| `--mo-space-150` | `--mo-ref-space-150` | O | 1 | 8 | ″ |
| `--mo-space-175` | `--mo-ref-space-175` | O | 1 | 1 | ″ |
| `--mo-space-200` | `--mo-ref-space-200` | O | 1 | 8 | ″ |
| `--mo-space-25` | `--mo-ref-space-25` | O | 1 | 1 | ″ |
| `--mo-space-250` | `--mo-ref-space-250` | O | 1 | 8 | ″ |
| `--mo-space-300` | `--mo-ref-space-300` | O | 1 | 9 | ″ |
| `--mo-space-400` | `--mo-ref-space-400` | O | 1 | 9 | ″ |
| `--mo-space-450` | `--mo-ref-space-450` | O | 1 | 1 | ″ |
| `--mo-space-50` | `--mo-ref-space-50` | O | 1 | 1 | ″ |
| `--mo-space-500` | `--mo-ref-space-500` | O | 1 | 6 | ″ |
| `--mo-space-600` | `--mo-ref-space-600` | O | 1 | 1 | ″ |
| `--mo-space-700` | `--mo-ref-space-700` | O | 1 | 1 | ″ |
| `--mo-space-75` | `--mo-ref-space-75` | O | 1 | 1 | ″ |
| `--mo-space-800` | `--mo-ref-space-800` | O | 1 | 1 | ″ |
| `--mo-space-900` | `--mo-ref-space-900` | O | 1 | 1 | ″ |

### density (6)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-density` | `--mo-sys-density` | O | 3 | 29 | M3 has no density tokens |
| `--mo-density-base` | `--mo-sys-density-base` | O | 2 | 17 | ″ |
| `--mo-density-focus` | `--mo-sys-density-focus` | O | 3 | 7 | ″ |
| `--mo-density-layout` | `--mo-sys-density-layout` | O | 3 | 66 | ″ |
| `--mo-density-step` | `--mo-sys-density-step` | O | 1 | 61 | ″ |
| `--mo-density-user` | `--mo-sys-density-user` | O | 5 | 18 | ″ |

### grid (3)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-grid-gutter` | `--mo-sys-grid-gutter` | O | 2 | 23 | M3 layout: margins, gutters, columns; no token names |
| `--mo-grid-layout-columns` | `--mo-sys-grid-layout-columns` | O | 3 | 7 | ″ |
| `--mo-grid-margin` | `--mo-sys-grid-margin` | O | 2 | 18 | ″ |

### size (1)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--mo-target` | `--mo-sys-target-size` | O | 3 | 19 |  |

### block, section, page (60)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--block-accent` | `--mo-sys-block-accent` | O | 6 | 132 | ours: M3 has no name (block and section variables of the standard blocks) |
| `--block-accent-hover` | `--mo-sys-block-accent-hover` | O | 3 | 13 | ″ |
| `--block-control-radius` | `--mo-sys-block-control-radius` | O | 3 | 20 | ″ |
| `--block-ease` | `--mo-sys-block-ease` | O | 3 | 9 | ″ |
| `--block-ease-quick` | `--mo-sys-block-ease-quick` | O | 1 | 4 | ″ |
| `--block-gutter` | `--mo-sys-block-gutter` | O | 2 | 7 | ″ |
| `--block-hero-on-shade` | `--mo-sys-block-hero-on-shade` | O | 1 | 5 | ″ |
| `--block-hero-shade` | `--mo-sys-block-hero-shade` | O | 1 | 6 | ″ |
| `--block-line` | `--mo-sys-block-line` | O | 3 | 62 | ″ |
| `--block-list-column-min` | `--mo-sys-block-list-column-min` | O | 2 | 6 | ″ |
| `--block-list-measure-max` | `--mo-sys-block-list-measure-max` | O | 1 | 5 | ″ |
| `--block-muted` | `--mo-sys-block-muted` | O | 6 | 82 | ″ |
| `--block-on-accent` | `--mo-sys-block-on-accent` | O | 3 | 41 | ″ |
| `--block-on-primary` | `--mo-sys-block-on-primary` | O | 2 | 12 | ″ |
| `--block-on-secondary` | `--mo-sys-block-on-secondary` | O | 2 | 11 | ″ |
| `--block-on-tertiary` | `--mo-sys-block-on-tertiary` | O | 2 | 11 | ″ |
| `--block-page-width` | `--mo-sys-block-page-width` | O | 1 | 4 | ″ |
| `--block-primary` | `--mo-sys-block-primary` | O | 2 | 10 | ″ |
| `--block-radius` | `--mo-sys-block-radius` | O | 3 | 57 | ″ |
| `--block-radius-small` | `--mo-sys-block-radius-small` | O | 2 | 65 | ″ |
| `--block-secondary` | `--mo-sys-block-secondary` | O | 2 | 11 | ″ |
| `--block-section-margin` | `--mo-sys-block-section-margin` | O | 1 | 4 | ″ |
| `--block-section-padding` | `--mo-sys-block-section-padding` | O | 1 | 5 | ″ |
| `--block-shadow` | `--mo-sys-block-shadow` | O | 5 | 12 | ″ |
| `--block-step-gap` | `--mo-sys-block-step-gap` | O | 1 | 3 | ″ |
| `--block-stripe` | `--mo-sys-block-stripe` | O | 3 | 7 | ″ |
| `--block-surface` | `--mo-sys-block-surface` | O | 4 | 56 | ″ |
| `--block-tertiary` | `--mo-sys-block-tertiary` | O | 2 | 11 | ″ |
| `--block-text` | `--mo-sys-block-text` | O | 6 | 102 | ″ |
| `--block-text-measure-max` | `--mo-sys-block-text-measure-max` | O | 1 | 16 | ″ |
| `--block-text-measure-min` | `--mo-sys-block-text-measure-min` | O | 1 | 11 | ″ |
| `--block-tint` | `--mo-sys-block-tint` | O | 3 | 57 | ″ |
| `--column-end` | `--mo-sys-column-end` | O | 3 | 6 | ″ |
| `--column-start` | `--mo-sys-column-start` | O | 3 | 7 | ″ |
| `--column-width` | `--mo-sys-column-width` | O | 1 | 8 | ″ |
| `--default-transition-duration` | `--mo-sys-default-transition-duration` | O | 1 | 1 | ″ |
| `--default-transition-timing-function` | `--mo-sys-default-transition-timing-function` | O | 1 | 1 | ″ |
| `--ease` | `--mo-sys-ease` | O | 2 | 7 | ″ |
| `--mark-in` | `--mo-sys-mark-in` | O | 1 | 3 | ″ |
| `--panel-shadow` | `--mo-sys-panel-shadow` | O | 7 | 13 | ″ |
| `--prose-space` | `--mo-sys-prose-space` | O | 2 | 4 | ″ |
| `--radius` | `--mo-sys-radius` | O | 2 | 14 | ″ |
| `--radius-small` | `--mo-sys-radius-small` | O | 2 | 5 | ″ |
| `--section-accent` | `--mo-sys-section-accent` | O | 3 | 11 | ″ |
| `--section-container` | `--mo-sys-section-container` | O | 6 | 9 | ″ |
| `--section-fill` | `--mo-sys-section-fill` | O | 7 | 12 | ″ |
| `--section-inset` | `--mo-sys-section-inset` | O | 1 | 3 | ″ |
| `--section-on` | `--mo-sys-section-on` | O | 3 | 16 | ″ |
| `--section-on-accent` | `--mo-sys-section-on-accent` | O | 3 | 43 | ″ |
| `--section-on-container` | `--mo-sys-section-on-container` | O | 6 | 9 | ″ |
| `--section-on-fill` | `--mo-sys-section-on-fill` | O | 4 | 5 | ″ |
| `--section-pane-gap` | `--mo-sys-section-pane-gap` | O | 1 | 7 | ″ |
| `--section-pane-width` | `--mo-sys-section-pane-width` | O | 1 | 8 | ″ |
| `--section-picture-fill` | `--mo-sys-section-picture-fill` | O | 1 | 2 | ″ |
| `--section-picture-on-fill` | `--mo-sys-section-picture-on-fill` | O | 1 | 9 | ″ |
| `--section-shade` | `--mo-sys-section-shade` | O | 7 | 14 | ″ |
| `--section-surface` | `--mo-sys-section-surface` | O | 2 | 3 | ″ |
| `--section-text` | `--mo-sys-section-text` | O | 2 | 3 | ″ |
| `--tile-fill` | `--mo-sys-tile-fill` | O | 4 | 5 | ″ |
| `--tile-on` | `--mo-sys-tile-on` | O | 4 | 5 | ″ |

### component (424)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--badge-anchor-inset` | `--mo-comp-badge-anchor-inset` | S | 1 | 5 | M3 md.comp.<component>.<part>.<attribute>; the part and attribute words are ours (surface, text, line …), see the open question |
| `--badge-major` | `--mo-comp-badge-major` | S | 3 | 5 | ″ |
| `--badge-minor` | `--mo-comp-badge-minor` | S | 3 | 5 | ″ |
| `--badge-ok` | `--mo-comp-badge-ok` | S | 1 | 4 | ″ |
| `--badge-radius` | `--mo-comp-badge-radius` | S | 1 | 3 | ″ |
| `--badge-surface` | `--mo-comp-badge-surface` | S | 1 | 3 | ″ |
| `--badge-text` | `--mo-comp-badge-text` | S | 1 | 3 | ″ |
| `--badge-unknown` | `--mo-comp-badge-unknown` | S | 1 | 2 | ″ |
| `--bottom-sheet-handle` | `--mo-comp-bottom-sheet-handle` | S | 1 | 3 | ″ |
| `--bottom-sheet-line` | `--mo-comp-bottom-sheet-line` | S | 1 | 4 | ″ |
| `--bottom-sheet-radius` | `--mo-comp-bottom-sheet-radius` | S | 1 | 6 | ″ |
| `--bottom-sheet-scrim` | `--mo-comp-bottom-sheet-scrim` | S | 1 | 3 | ″ |
| `--button-box` | `--mo-comp-button-box` | S | 5 | 12 | ″ |
| `--button-busy-after` | `--mo-comp-button-busy-after` | S | 1 | 5 | ″ |
| `--button-busy-size` | `--mo-comp-button-busy-size` | S | 2 | 5 | ″ |
| `--button-corners` | `--mo-comp-button-corners` | S | 3 | 6 | ″ |
| `--button-elevated-text` | `--mo-comp-button-elevated-text` | S | 1 | 2 | ″ |
| `--button-filled-hover` | `--mo-comp-button-filled-hover` | S | 2 | 4 | ″ |
| `--button-filled-hover-shadow` | `--mo-comp-button-filled-hover-shadow` | S | 1 | 2 | ″ |
| `--button-filled-shadow` | `--mo-comp-button-filled-shadow` | S | 1 | 5 | ″ |
| `--button-filled-surface` | `--mo-comp-button-filled-surface` | S | 1 | 4 | ″ |
| `--button-filled-text` | `--mo-comp-button-filled-text` | S | 1 | 3 | ″ |
| `--button-font-size` | `--mo-comp-button-font-size` | S | 1 | 4 | ″ |
| `--button-gap` | `--mo-comp-button-gap` | S | 1 | 3 | ″ |
| `--button-glyph` | `--mo-comp-button-glyph` | S | 4 | 12 | ″ |
| `--button-group-connected-gap` | `--mo-comp-button-group-connected-gap` | S | 1 | 3 | ″ |
| `--button-group-gap` | `--mo-comp-button-group-gap` | S | 1 | 3 | ″ |
| `--button-group-inner` | `--mo-comp-button-group-inner` | S | 4 | 8 | ″ |
| `--button-group-inner-radius` | `--mo-comp-button-group-inner-radius` | S | 1 | 3 | ″ |
| `--button-group-large-inner-radius` | `--mo-comp-button-group-large-inner-radius` | S | 1 | 2 | ″ |
| `--button-group-selected-radius` | `--mo-comp-button-group-selected-radius` | S | 1 | 3 | ″ |
| `--button-group-xlarge-inner-radius` | `--mo-comp-button-group-xlarge-inner-radius` | S | 1 | 2 | ″ |
| `--button-group-xsmall-inner-radius` | `--mo-comp-button-group-xsmall-inner-radius` | S | 1 | 3 | ″ |
| `--button-height` | `--mo-comp-button-height` | S | 1 | 5 | ″ |
| `--button-icon-size` | `--mo-comp-button-icon-size` | S | 1 | 5 | ″ |
| `--button-inline` | `--mo-comp-button-inline` | S | 5 | 11 | ″ |
| `--button-large-square-radius` | `--mo-comp-button-large-square-radius` | S | 1 | 3 | ″ |
| `--button-letter-spacing` | `--mo-comp-button-letter-spacing` | S | 1 | 4 | ″ |
| `--button-outlined-hover-line` | `--mo-comp-button-outlined-hover-line` | S | 2 | 3 | ″ |
| `--button-outlined-hover-text` | `--mo-comp-button-outlined-hover-text` | S | 2 | 3 | ″ |
| `--button-outlined-line` | `--mo-comp-button-outlined-line` | S | 2 | 5 | ″ |
| `--button-outlined-surface` | `--mo-comp-button-outlined-surface` | S | 2 | 4 | ″ |
| `--button-outlined-text` | `--mo-comp-button-outlined-text` | S | 2 | 3 | ″ |
| `--button-padding` | `--mo-comp-button-padding` | S | 1 | 4 | ″ |
| `--button-pressed` | `--mo-comp-button-pressed` | S | 5 | 7 | ″ |
| `--button-radius` | `--mo-comp-button-radius` | S | 1 | 5 | ″ |
| `--button-round` | `--mo-comp-button-round` | S | 1 | 7 | ″ |
| `--button-small-height` | `--mo-comp-button-small-height` | S | 1 | 3 | ″ |
| `--button-small-padding` | `--mo-comp-button-small-padding` | S | 1 | 2 | ″ |
| `--button-small-square-radius` | `--mo-comp-button-small-square-radius` | S | 1 | 3 | ″ |
| `--button-square` | `--mo-comp-button-square` | S | 5 | 7 | ″ |
| `--button-square-radius` | `--mo-comp-button-square-radius` | S | 1 | 4 | ″ |
| `--button-text-hover` | `--mo-comp-button-text-hover` | S | 2 | 3 | ″ |
| `--button-text-padding` | `--mo-comp-button-text-padding` | S | 1 | 7 | ″ |
| `--button-text-text` | `--mo-comp-button-text-text` | S | 2 | 5 | ″ |
| `--button-toggle-hover` | `--mo-comp-button-toggle-hover` | S | 1 | 3 | ″ |
| `--button-toggle-selected-hover` | `--mo-comp-button-toggle-selected-hover` | S | 1 | 3 | ″ |
| `--button-toggle-selected-surface` | `--mo-comp-button-toggle-selected-surface` | S | 1 | 4 | ″ |
| `--button-toggle-selected-text` | `--mo-comp-button-toggle-selected-text` | S | 1 | 3 | ″ |
| `--button-toggle-surface` | `--mo-comp-button-toggle-surface` | S | 1 | 4 | ″ |
| `--button-toggle-text` | `--mo-comp-button-toggle-text` | S | 1 | 3 | ″ |
| `--button-tonal-hover` | `--mo-comp-button-tonal-hover` | S | 1 | 2 | ″ |
| `--button-tonal-surface` | `--mo-comp-button-tonal-surface` | S | 1 | 3 | ″ |
| `--button-tonal-text` | `--mo-comp-button-tonal-text` | S | 1 | 2 | ″ |
| `--button-weight` | `--mo-comp-button-weight` | S | 1 | 4 | ″ |
| `--button-xlarge-square-radius` | `--mo-comp-button-xlarge-square-radius` | S | 1 | 3 | ″ |
| `--button-xsmall-gap` | `--mo-comp-button-xsmall-gap` | S | 1 | 3 | ″ |
| `--button-xsmall-height` | `--mo-comp-button-xsmall-height` | S | 2 | 4 | ″ |
| `--button-xsmall-padding` | `--mo-comp-button-xsmall-padding` | S | 1 | 2 | ″ |
| `--button-xsmall-square-radius` | `--mo-comp-button-xsmall-square-radius` | S | 1 | 3 | ″ |
| `--card-action-gap` | `--mo-comp-card-action-gap` | S | 1 | 6 | ″ |
| `--card-elevated-hover-shadow` | `--mo-comp-card-elevated-hover-shadow` | S | 1 | 3 | ″ |
| `--card-elevated-shadow` | `--mo-comp-card-elevated-shadow` | S | 1 | 8 | ″ |
| `--card-filled-line` | `--mo-comp-card-filled-line` | S | 1 | 2 | ″ |
| `--card-filled-surface` | `--mo-comp-card-filled-surface` | S | 6 | 11 | ″ |
| `--card-gap` | `--mo-comp-card-gap` | S | 1 | 24 | ″ |
| `--card-media-gap` | `--mo-comp-card-media-gap` | S | 1 | 4 | ″ |
| `--card-outlined-line` | `--mo-comp-card-outlined-line` | S | 6 | 9 | ″ |
| `--card-outlined-surface` | `--mo-comp-card-outlined-surface` | S | 5 | 9 | ″ |
| `--card-padding` | `--mo-comp-card-padding` | S | 8 | 24 | ″ |
| `--card-radius` | `--mo-comp-card-radius` | S | 5 | 24 | ″ |
| `--card-shadow` | `--mo-comp-card-shadow` | S | 9 | 17 | ″ |
| `--card-subhead-gap` | `--mo-comp-card-subhead-gap` | S | 1 | 6 | ″ |
| `--card-text-gap` | `--mo-comp-card-text-gap` | S | 1 | 4 | ″ |
| `--carousel-bleed` | `--mo-comp-carousel-bleed` | S | 1 | 6 | ″ |
| `--carousel-dot-colour` | `--mo-comp-carousel-dot-colour` | S | 1 | 3 | ″ |
| `--carousel-dot-selected-width` | `--mo-comp-carousel-dot-selected-width` | S | 1 | 3 | ″ |
| `--carousel-full-screen-radius` | `--mo-comp-carousel-full-screen-radius` | S | 1 | 3 | ″ |
| `--carousel-item-radius` | `--mo-comp-carousel-item-radius` | S | 1 | 5 | ″ |
| `--carousel-large-item-width` | `--mo-comp-carousel-large-item-width` | S | 1 | 5 | ″ |
| `--carousel-small-item-max-width` | `--mo-comp-carousel-small-item-max-width` | S | 1 | 4 | ″ |
| `--carousel-small-item-min-width` | `--mo-comp-carousel-small-item-min-width` | S | 1 | 4 | ″ |
| `--checkbox-gap` | `--mo-comp-checkbox-gap` | S | 3 | 5 | ″ |
| `--checkbox-offset` | `--mo-comp-checkbox-offset` | S | 1 | 3 | ″ |
| `--checkbox-size` | `--mo-comp-checkbox-size` | S | 1 | 4 | ″ |
| `--chip-height` | `--mo-comp-chip-height` | S | 1 | 3 | ″ |
| `--chip-hover-line` | `--mo-comp-chip-hover-line` | S | 1 | 3 | ″ |
| `--chip-hover-text` | `--mo-comp-chip-hover-text` | S | 1 | 3 | ″ |
| `--chip-line` | `--mo-comp-chip-line` | S | 1 | 4 | ″ |
| `--chip-padding` | `--mo-comp-chip-padding` | S | 1 | 3 | ″ |
| `--chip-padding-block` | `--mo-comp-chip-padding-block` | S | 1 | 4 | ″ |
| `--chip-radius` | `--mo-comp-chip-radius` | S | 1 | 5 | ″ |
| `--chip-selected-check` | `--mo-comp-chip-selected-check` | S | 1 | 3 | ″ |
| `--chip-selected-hover` | `--mo-comp-chip-selected-hover` | S | 1 | 3 | ″ |
| `--chip-selected-surface` | `--mo-comp-chip-selected-surface` | S | 1 | 4 | ″ |
| `--chip-selected-text` | `--mo-comp-chip-selected-text` | S | 1 | 4 | ″ |
| `--chip-set-bleed` | `--mo-comp-chip-set-bleed` | S | 3 | 7 | ″ |
| `--chip-surface` | `--mo-comp-chip-surface` | S | 1 | 3 | ″ |
| `--chip-text` | `--mo-comp-chip-text` | S | 1 | 3 | ″ |
| `--circular-progress-indicator-gap` | `--mo-comp-circular-progress-indicator-gap` | S | 1 | 2 | ″ |
| `--circular-progress-indicator-rest` | `--mo-comp-circular-progress-indicator-rest` | S | 1 | 3 | ″ |
| `--circular-progress-indicator-shown-gap` | `--mo-comp-circular-progress-indicator-shown-gap` | S | 1 | 3 | ″ |
| `--circular-progress-indicator-size` | `--mo-comp-circular-progress-indicator-size` | S | 3 | 6 | ″ |
| `--circular-progress-indicator-thickness` | `--mo-comp-circular-progress-indicator-thickness` | S | 1 | 3 | ″ |
| `--date-picker-day-hover` | `--mo-comp-date-picker-day-hover` | S | 1 | 5 | ″ |
| `--date-picker-day-radius` | `--mo-comp-date-picker-day-radius` | S | 1 | 4 | ″ |
| `--date-picker-docked-radius` | `--mo-comp-date-picker-docked-radius` | S | 1 | 3 | ″ |
| `--date-picker-menu-button-text` | `--mo-comp-date-picker-menu-button-text` | S | 1 | 3 | ″ |
| `--date-picker-range-surface` | `--mo-comp-date-picker-range-surface` | S | 1 | 5 | ″ |
| `--date-picker-supporting-color` | `--mo-comp-date-picker-supporting-color` | S | 1 | 3 | ″ |
| `--dialog-line` | `--mo-comp-dialog-line` | S | 1 | 4 | ″ |
| `--dialog-radius` | `--mo-comp-dialog-radius` | S | 1 | 6 | ″ |
| `--dialog-scrim` | `--mo-comp-dialog-scrim` | S | 1 | 8 | ″ |
| `--divider-color` | `--mo-comp-divider-color` | S | 1 | 4 | ″ |
| `--fab-hover-shadow` | `--mo-comp-fab-hover-shadow` | S | 2 | 6 | ″ |
| `--fab-large-radius` | `--mo-comp-fab-large-radius` | S | 1 | 2 | ″ |
| `--fab-medium-radius` | `--mo-comp-fab-medium-radius` | S | 1 | 2 | ″ |
| `--fab-menu-close-radius` | `--mo-comp-fab-menu-close-radius` | S | 1 | 3 | ″ |
| `--fab-primary-container-hover` | `--mo-comp-fab-primary-container-hover` | S | 1 | 3 | ″ |
| `--fab-primary-container-surface` | `--mo-comp-fab-primary-container-surface` | S | 1 | 2 | ″ |
| `--fab-primary-container-text` | `--mo-comp-fab-primary-container-text` | S | 1 | 2 | ″ |
| `--fab-primary-hover` | `--mo-comp-fab-primary-hover` | S | 1 | 5 | ″ |
| `--fab-radius` | `--mo-comp-fab-radius` | S | 2 | 5 | ″ |
| `--fab-room` | `--mo-comp-fab-room` | S | 1 | 3 | ″ |
| `--fab-secondary-container-hover` | `--mo-comp-fab-secondary-container-hover` | S | 1 | 3 | ″ |
| `--fab-secondary-container-surface` | `--mo-comp-fab-secondary-container-surface` | S | 1 | 2 | ″ |
| `--fab-secondary-container-text` | `--mo-comp-fab-secondary-container-text` | S | 1 | 2 | ″ |
| `--fab-shadow` | `--mo-comp-fab-shadow` | S | 2 | 10 | ″ |
| `--grid-columns` | `--mo-comp-grid-columns` | S | 6 | 17 | ″ |
| `--icon-button-box` | `--mo-comp-icon-button-box` | S | 5 | 9 | ″ |
| `--icon-button-corners` | `--mo-comp-icon-button-corners` | S | 3 | 5 | ″ |
| `--icon-button-filled-hover` | `--mo-comp-icon-button-filled-hover` | S | 1 | 2 | ″ |
| `--icon-button-filled-surface` | `--mo-comp-icon-button-filled-surface` | S | 1 | 2 | ″ |
| `--icon-button-filled-text` | `--mo-comp-icon-button-filled-text` | S | 1 | 2 | ″ |
| `--icon-button-glyph` | `--mo-comp-icon-button-glyph` | S | 5 | 8 | ″ |
| `--icon-button-icon-size` | `--mo-comp-icon-button-icon-size` | S | 3 | 10 | ″ |
| `--icon-button-medium-square-radius` | `--mo-comp-icon-button-medium-square-radius` | S | 1 | 2 | ″ |
| `--icon-button-outlined-line` | `--mo-comp-icon-button-outlined-line` | S | 1 | 2 | ″ |
| `--icon-button-outlined-surface` | `--mo-comp-icon-button-outlined-surface` | S | 1 | 2 | ″ |
| `--icon-button-outlined-text` | `--mo-comp-icon-button-outlined-text` | S | 1 | 2 | ″ |
| `--icon-button-pressed` | `--mo-comp-icon-button-pressed` | S | 5 | 6 | ″ |
| `--icon-button-ratio` | `--mo-comp-icon-button-ratio` | S | 3 | 4 | ″ |
| `--icon-button-round` | `--mo-comp-icon-button-round` | S | 1 | 5 | ″ |
| `--icon-button-size` | `--mo-comp-icon-button-size` | S | 4 | 14 | ″ |
| `--icon-button-square` | `--mo-comp-icon-button-square` | S | 5 | 6 | ″ |
| `--icon-button-standard-line` | `--mo-comp-icon-button-standard-line` | S | 3 | 4 | ″ |
| `--icon-button-standard-surface` | `--mo-comp-icon-button-standard-surface` | S | 3 | 5 | ″ |
| `--icon-button-standard-text` | `--mo-comp-icon-button-standard-text` | S | 4 | 8 | ″ |
| `--icon-button-tonal-surface` | `--mo-comp-icon-button-tonal-surface` | S | 1 | 3 | ″ |
| `--icon-button-tonal-text` | `--mo-comp-icon-button-tonal-text` | S | 1 | 2 | ″ |
| `--icon-button-width` | `--mo-comp-icon-button-width` | S | 1 | 5 | ″ |
| `--icon-color` | `--mo-comp-icon-color` | S | 3 | 6 | ″ |
| `--lightbox-ink` | `--mo-comp-lightbox-ink` | S | 1 | 3 | ″ |
| `--linear-progress-indicator-height` | `--mo-comp-linear-progress-indicator-height` | S | 2 | 10 | ″ |
| `--linear-progress-indicator-radius` | `--mo-comp-linear-progress-indicator-radius` | S | 1 | 3 | ″ |
| `--linear-progress-indicator-stop-size` | `--mo-comp-linear-progress-indicator-stop-size` | S | 1 | 3 | ″ |
| `--list-divider` | `--mo-comp-list-divider` | S | 1 | 5 | ″ |
| `--list-expand-divider-width` | `--mo-comp-list-expand-divider-width` | S | 1 | 3 | ″ |
| `--list-expand-gap` | `--mo-comp-list-expand-gap` | S | 1 | 4 | ″ |
| `--list-expand-icon-open-surface` | `--mo-comp-list-expand-icon-open-surface` | S | 1 | 3 | ″ |
| `--list-expand-item-radius` | `--mo-comp-list-expand-item-radius` | S | 1 | 4 | ″ |
| `--list-expand-item-surface` | `--mo-comp-list-expand-item-surface` | S | 1 | 3 | ″ |
| `--list-expand-open-radius` | `--mo-comp-list-expand-open-radius` | S | 1 | 3 | ″ |
| `--list-expand-padding-block` | `--mo-comp-list-expand-padding-block` | S | 1 | 4 | ″ |
| `--list-expand-padding-inline` | `--mo-comp-list-expand-padding-inline` | S | 3 | 6 | ″ |
| `--list-expand-radius` | `--mo-comp-list-expand-radius` | S | 1 | 9 | ″ |
| `--list-expand-shadow` | `--mo-comp-list-expand-shadow` | S | 1 | 3 | ″ |
| `--list-expand-surface` | `--mo-comp-list-expand-surface` | S | 1 | 3 | ″ |
| `--list-item-box` | `--mo-comp-list-item-box` | S | 2 | 5 | ″ |
| `--list-item-density` | `--mo-comp-list-item-density` | S | 1 | 4 | ″ |
| `--list-item-disabled-opacity` | `--mo-comp-list-item-disabled-opacity` | S | 1 | 3 | ″ |
| `--list-item-first-lines` | `--mo-comp-list-item-first-lines` | S | 1 | 3 | ″ |
| `--list-item-focus-indicator-color` | `--mo-comp-list-item-focus-indicator-color` | S | 1 | 5 | ″ |
| `--list-item-focus-surface` | `--mo-comp-list-item-focus-surface` | S | 1 | 9 | ″ |
| `--list-item-gap` | `--mo-comp-list-item-gap` | S | 2 | 5 | ″ |
| `--list-item-headline-letter-spacing` | `--mo-comp-list-item-headline-letter-spacing` | S | 1 | 4 | ″ |
| `--list-item-headline-line-height` | `--mo-comp-list-item-headline-line-height` | S | 1 | 7 | ″ |
| `--list-item-headline-size` | `--mo-comp-list-item-headline-size` | S | 1 | 4 | ″ |
| `--list-item-headline-weight` | `--mo-comp-list-item-headline-weight` | S | 1 | 3 | ″ |
| `--list-item-hover-icon-color` | `--mo-comp-list-item-hover-icon-color` | S | 1 | 4 | ″ |
| `--list-item-hover-radius` | `--mo-comp-list-item-hover-radius` | S | 2 | 7 | ″ |
| `--list-item-hover-surface` | `--mo-comp-list-item-hover-surface` | S | 2 | 18 | ″ |
| `--list-item-hover-text` | `--mo-comp-list-item-hover-text` | S | 2 | 7 | ″ |
| `--list-item-hover-trailing-shift` | `--mo-comp-list-item-hover-trailing-shift` | S | 1 | 3 | ″ |
| `--list-item-icon-size` | `--mo-comp-list-item-icon-size` | S | 1 | 8 | ″ |
| `--list-item-image-radius` | `--mo-comp-list-item-image-radius` | S | 1 | 4 | ″ |
| `--list-item-image-size` | `--mo-comp-list-item-image-size` | S | 2 | 6 | ″ |
| `--list-item-leading-icon-color` | `--mo-comp-list-item-leading-icon-color` | S | 4 | 6 | ″ |
| `--list-item-leading-icon-selected-color` | `--mo-comp-list-item-leading-icon-selected-color` | S | 1 | 3 | ″ |
| `--list-item-leading-room` | `--mo-comp-list-item-leading-room` | S | 2 | 3 | ″ |
| `--list-item-leading-size` | `--mo-comp-list-item-leading-size` | S | 3 | 5 | ″ |
| `--list-item-min-height` | `--mo-comp-list-item-min-height` | S | 3 | 10 | ″ |
| `--list-item-padding-block` | `--mo-comp-list-item-padding-block` | S | 6 | 10 | ″ |
| `--list-item-padding-inline` | `--mo-comp-list-item-padding-inline` | S | 8 | 12 | ″ |
| `--list-item-pressed-radius` | `--mo-comp-list-item-pressed-radius` | S | 1 | 4 | ″ |
| `--list-item-pressed-surface` | `--mo-comp-list-item-pressed-surface` | S | 2 | 13 | ″ |
| `--list-item-radius` | `--mo-comp-list-item-radius` | S | 2 | 13 | ″ |
| `--list-item-selected-radius` | `--mo-comp-list-item-selected-radius` | S | 1 | 7 | ″ |
| `--list-item-selected-surface` | `--mo-comp-list-item-selected-surface` | S | 1 | 7 | ″ |
| `--list-item-selected-text` | `--mo-comp-list-item-selected-text` | S | 1 | 5 | ″ |
| `--list-item-selected-weight` | `--mo-comp-list-item-selected-weight` | S | 1 | 3 | ″ |
| `--list-item-shape` | `--mo-comp-list-item-shape` | S | 16 | 24 | ″ |
| `--list-item-three-line-box` | `--mo-comp-list-item-three-line-box` | S | 1 | 2 | ″ |
| `--list-item-three-line-min-height` | `--mo-comp-list-item-three-line-min-height` | S | 1 | 3 | ″ |
| `--list-item-trailing-text` | `--mo-comp-list-item-trailing-text` | S | 1 | 4 | ″ |
| `--list-item-two-line-box` | `--mo-comp-list-item-two-line-box` | S | 1 | 3 | ″ |
| `--list-item-two-line-min-height` | `--mo-comp-list-item-two-line-min-height` | S | 3 | 7 | ″ |
| `--list-segmented-disabled-surface` | `--mo-comp-list-segmented-disabled-surface` | S | 1 | 3 | ″ |
| `--list-segmented-gap` | `--mo-comp-list-segmented-gap` | S | 1 | 4 | ″ |
| `--list-segmented-hover-radius` | `--mo-comp-list-segmented-hover-radius` | S | 1 | 4 | ″ |
| `--list-segmented-hover-surface` | `--mo-comp-list-segmented-hover-surface` | S | 1 | 7 | ″ |
| `--list-segmented-inner-radius` | `--mo-comp-list-segmented-inner-radius` | S | 1 | 5 | ″ |
| `--list-segmented-padding-inline` | `--mo-comp-list-segmented-padding-inline` | S | 1 | 4 | ″ |
| `--list-segmented-pressed-radius` | `--mo-comp-list-segmented-pressed-radius` | S | 1 | 3 | ″ |
| `--list-segmented-pressed-surface` | `--mo-comp-list-segmented-pressed-surface` | S | 1 | 5 | ″ |
| `--list-segmented-radius` | `--mo-comp-list-segmented-radius` | S | 1 | 8 | ″ |
| `--list-segmented-selected-radius` | `--mo-comp-list-segmented-selected-radius` | S | 1 | 5 | ″ |
| `--list-segmented-surface` | `--mo-comp-list-segmented-surface` | S | 2 | 8 | ″ |
| `--loading-indicator-colour` | `--mo-comp-loading-indicator-colour` | S | 1 | 5 | ″ |
| `--loading-indicator-shape-size` | `--mo-comp-loading-indicator-shape-size` | S | 1 | 5 | ″ |
| `--loading-indicator-size` | `--mo-comp-loading-indicator-size` | S | 1 | 5 | ″ |
| `--menu-divider` | `--mo-comp-menu-divider` | S | 1 | 4 | ″ |
| `--menu-group-inner-radius` | `--mo-comp-menu-group-inner-radius` | S | 1 | 3 | ″ |
| `--menu-group-label-text` | `--mo-comp-menu-group-label-text` | S | 1 | 3 | ″ |
| `--menu-item-edge-radius` | `--mo-comp-menu-item-edge-radius` | S | 1 | 6 | ″ |
| `--menu-item-font-size` | `--mo-comp-menu-item-font-size` | S | 1 | 5 | ″ |
| `--menu-item-height` | `--mo-comp-menu-item-height` | S | 1 | 4 | ″ |
| `--menu-item-hover-surface` | `--mo-comp-menu-item-hover-surface` | S | 2 | 6 | ″ |
| `--menu-item-hover-text` | `--mo-comp-menu-item-hover-text` | S | 2 | 5 | ″ |
| `--menu-item-icon-color` | `--mo-comp-menu-item-icon-color` | S | 1 | 3 | ″ |
| `--menu-item-letter-spacing` | `--mo-comp-menu-item-letter-spacing` | S | 1 | 5 | ″ |
| `--menu-item-padding` | `--mo-comp-menu-item-padding` | S | 1 | 4 | ″ |
| `--menu-item-radius` | `--mo-comp-menu-item-radius` | S | 1 | 6 | ″ |
| `--menu-item-selected-radius` | `--mo-comp-menu-item-selected-radius` | S | 1 | 3 | ″ |
| `--menu-item-selected-surface` | `--mo-comp-menu-item-selected-surface` | S | 2 | 5 | ″ |
| `--menu-item-selected-text` | `--mo-comp-menu-item-selected-text` | S | 2 | 5 | ″ |
| `--menu-item-selected-weight` | `--mo-comp-menu-item-selected-weight` | S | 1 | 4 | ″ |
| `--menu-item-supporting-text` | `--mo-comp-menu-item-supporting-text` | S | 1 | 4 | ″ |
| `--menu-item-text` | `--mo-comp-menu-item-text` | S | 2 | 6 | ″ |
| `--menu-item-weight` | `--mo-comp-menu-item-weight` | S | 1 | 5 | ″ |
| `--menu-line` | `--mo-comp-menu-line` | S | 2 | 6 | ″ |
| `--menu-max-height` | `--mo-comp-menu-max-height` | S | 1 | 5 | ″ |
| `--menu-max-width` | `--mo-comp-menu-max-width` | S | 1 | 3 | ″ |
| `--menu-min-width` | `--mo-comp-menu-min-width` | S | 1 | 3 | ″ |
| `--menu-padding` | `--mo-comp-menu-padding` | S | 1 | 5 | ″ |
| `--menu-radius` | `--mo-comp-menu-radius` | S | 1 | 10 | ″ |
| `--menu-shadow` | `--mo-comp-menu-shadow` | S | 2 | 10 | ″ |
| `--menu-surface` | `--mo-comp-menu-surface` | S | 2 | 9 | ″ |
| `--menu-width` | `--mo-comp-menu-width` | S | 1 | 5 | ″ |
| `--navigation-bar-height` | `--mo-comp-navigation-bar-height` | S | 1 | 3 | ″ |
| `--navigation-bar-indicator-hover` | `--mo-comp-navigation-bar-indicator-hover` | S | 1 | 8 | ″ |
| `--navigation-bar-indicator-radius` | `--mo-comp-navigation-bar-indicator-radius` | S | 1 | 5 | ″ |
| `--navigation-bar-indicator-surface` | `--mo-comp-navigation-bar-indicator-surface` | S | 1 | 5 | ″ |
| `--navigation-bar-indicator-text` | `--mo-comp-navigation-bar-indicator-text` | S | 1 | 5 | ″ |
| `--navigation-bar-indicator-width` | `--mo-comp-navigation-bar-indicator-width` | S | 1 | 3 | ″ |
| `--navigation-bar-item-selected-text` | `--mo-comp-navigation-bar-item-selected-text` | S | 1 | 3 | ″ |
| `--navigation-bar-item-text` | `--mo-comp-navigation-bar-item-text` | S | 1 | 3 | ″ |
| `--navigation-bar-label-selected-weight` | `--mo-comp-navigation-bar-label-selected-weight` | S | 1 | 3 | ″ |
| `--navigation-bar-line` | `--mo-comp-navigation-bar-line` | S | 1 | 3 | ″ |
| `--navigation-bar-surface` | `--mo-comp-navigation-bar-surface` | S | 1 | 4 | ″ |
| `--navigation-drawer-bleed-default` | `--mo-comp-navigation-drawer-bleed-default` | S | 1 | 13 | ″ |
| `--navigation-drawer-inset` | `--mo-comp-navigation-drawer-inset` | S | 1 | 10 | ″ |
| `--navigation-drawer-inset-default` | `--mo-comp-navigation-drawer-inset-default` | S | 1 | 9 | ″ |
| `--navigation-drawer-row-gap` | `--mo-comp-navigation-drawer-row-gap` | S | 1 | 3 | ″ |
| `--navigation-drawer-scrim` | `--mo-comp-navigation-drawer-scrim` | S | 1 | 5 | ″ |
| `--navigation-drawer-toggle-hover` | `--mo-comp-navigation-drawer-toggle-hover` | S | 1 | 3 | ″ |
| `--navigation-drawer-toggle-size` | `--mo-comp-navigation-drawer-toggle-size` | S | 1 | 4 | ″ |
| `--navigation-drawer-width` | `--mo-comp-navigation-drawer-width` | S | 1 | 14 | ″ |
| `--navigation-drawer-width-default` | `--mo-comp-navigation-drawer-width-default` | S | 1 | 4 | ″ |
| `--navigation-drawer-width-min-default` | `--mo-comp-navigation-drawer-width-min-default` | S | 1 | 5 | ″ |
| `--navigation-rail-expanded-width` | `--mo-comp-navigation-rail-expanded-width` | S | 1 | 5 | ″ |
| `--navigation-rail-indicator-hover` | `--mo-comp-navigation-rail-indicator-hover` | S | 1 | 4 | ″ |
| `--navigation-rail-indicator-radius` | `--mo-comp-navigation-rail-indicator-radius` | S | 1 | 4 | ″ |
| `--navigation-rail-indicator-surface` | `--mo-comp-navigation-rail-indicator-surface` | S | 1 | 4 | ″ |
| `--navigation-rail-indicator-text` | `--mo-comp-navigation-rail-indicator-text` | S | 1 | 4 | ″ |
| `--navigation-rail-item-selected-text` | `--mo-comp-navigation-rail-item-selected-text` | S | 1 | 3 | ″ |
| `--navigation-rail-item-text` | `--mo-comp-navigation-rail-item-text` | S | 1 | 4 | ″ |
| `--navigation-rail-label-selected-weight` | `--mo-comp-navigation-rail-label-selected-weight` | S | 1 | 3 | ″ |
| `--navigation-rail-line` | `--mo-comp-navigation-rail-line` | S | 1 | 4 | ″ |
| `--navigation-rail-modal-radius` | `--mo-comp-navigation-rail-modal-radius` | S | 1 | 4 | ″ |
| `--navigation-rail-padding` | `--mo-comp-navigation-rail-padding` | S | 2 | 4 | ″ |
| `--navigation-rail-surface` | `--mo-comp-navigation-rail-surface` | S | 1 | 7 | ″ |
| `--navigation-rail-width` | `--mo-comp-navigation-rail-width` | S | 1 | 7 | ″ |
| `--radio-button-gap` | `--mo-comp-radio-button-gap` | S | 2 | 4 | ″ |
| `--radio-button-offset` | `--mo-comp-radio-button-offset` | S | 1 | 3 | ″ |
| `--radio-button-size` | `--mo-comp-radio-button-size` | S | 1 | 4 | ″ |
| `--radio-group-label-weight` | `--mo-comp-radio-group-label-weight` | S | 1 | 3 | ″ |
| `--search-bar-gap` | `--mo-comp-search-bar-gap` | S | 1 | 3 | ″ |
| `--search-bar-height` | `--mo-comp-search-bar-height` | S | 1 | 4 | ″ |
| `--search-bar-hover` | `--mo-comp-search-bar-hover` | S | 1 | 3 | ″ |
| `--search-bar-line` | `--mo-comp-search-bar-line` | S | 1 | 3 | ″ |
| `--search-bar-padding` | `--mo-comp-search-bar-padding` | S | 1 | 3 | ″ |
| `--search-bar-placeholder` | `--mo-comp-search-bar-placeholder` | S | 1 | 5 | ″ |
| `--search-bar-radius` | `--mo-comp-search-bar-radius` | S | 1 | 5 | ″ |
| `--search-bar-surface` | `--mo-comp-search-bar-surface` | S | 1 | 6 | ″ |
| `--search-view-docked-radius` | `--mo-comp-search-view-docked-radius` | S | 1 | 4 | ″ |
| `--search-view-line` | `--mo-comp-search-view-line` | S | 1 | 3 | ″ |
| `--search-view-option-surface` | `--mo-comp-search-view-option-surface` | S | 1 | 4 | ″ |
| `--search-view-radius` | `--mo-comp-search-view-radius` | S | 1 | 3 | ″ |
| `--search-view-results-padding` | `--mo-comp-search-view-results-padding` | S | 1 | 4 | ″ |
| `--search-view-scrim` | `--mo-comp-search-view-scrim` | S | 1 | 3 | ″ |
| `--segmented-button-line` | `--mo-comp-segmented-button-line` | S | 1 | 3 | ″ |
| `--segmented-button-padding` | `--mo-comp-segmented-button-padding` | S | 1 | 2 | ″ |
| `--segmented-button-radius` | `--mo-comp-segmented-button-radius` | S | 1 | 2 | ″ |
| `--segmented-button-selected-hover` | `--mo-comp-segmented-button-selected-hover` | S | 1 | 2 | ″ |
| `--segmented-button-selected-surface` | `--mo-comp-segmented-button-selected-surface` | S | 1 | 3 | ″ |
| `--segmented-button-selected-text` | `--mo-comp-segmented-button-selected-text` | S | 1 | 2 | ″ |
| `--segmented-button-surface` | `--mo-comp-segmented-button-surface` | S | 1 | 3 | ″ |
| `--setting-row-label-weight` | `--mo-comp-setting-row-label-weight` | S | 1 | 3 | ″ |
| `--side-panel-width` | `--mo-comp-side-panel-width` | S | 1 | 8 | ″ |
| `--side-sheet-icon-inset` | `--mo-comp-side-sheet-icon-inset` | S | 2 | 8 | ″ |
| `--side-sheet-radius` | `--mo-comp-side-sheet-radius` | S | 1 | 7 | ″ |
| `--side-sheet-scrim` | `--mo-comp-side-sheet-scrim` | S | 1 | 4 | ″ |
| `--slider-active-track` | `--mo-comp-slider-active-track` | S | 1 | 3 | ″ |
| `--slider-along` | `--mo-comp-slider-along` | S | 1 | 6 | ″ |
| `--slider-disabled-opacity` | `--mo-comp-slider-disabled-opacity` | S | 1 | 3 | ″ |
| `--slider-gap-end` | `--mo-comp-slider-gap-end` | S | 2 | 4 | ″ |
| `--slider-gap-start` | `--mo-comp-slider-gap-start` | S | 2 | 4 | ″ |
| `--slider-handle-height` | `--mo-comp-slider-handle-height` | S | 1 | 4 | ″ |
| `--slider-handle-inset` | `--mo-comp-slider-handle-inset` | S | 1 | 5 | ″ |
| `--slider-handle-length` | `--mo-comp-slider-handle-length` | S | 2 | 7 | ″ |
| `--slider-handle-line-width` | `--mo-comp-slider-handle-line-width` | S | 1 | 4 | ″ |
| `--slider-handle-pressed-width` | `--mo-comp-slider-handle-pressed-width` | S | 1 | 4 | ″ |
| `--slider-handle-radius` | `--mo-comp-slider-handle-radius` | S | 1 | 4 | ″ |
| `--slider-handle-surface` | `--mo-comp-slider-handle-surface` | S | 1 | 4 | ″ |
| `--slider-handle-width` | `--mo-comp-slider-handle-width` | S | 1 | 8 | ″ |
| `--slider-height` | `--mo-comp-slider-height` | S | 1 | 4 | ″ |
| `--slider-icon-length` | `--mo-comp-slider-icon-length` | S | 4 | 8 | ″ |
| `--slider-inactive-track` | `--mo-comp-slider-inactive-track` | S | 1 | 4 | ″ |
| `--slider-large-track-radius` | `--mo-comp-slider-large-track-radius` | S | 1 | 2 | ″ |
| `--slider-medium-track-radius` | `--mo-comp-slider-medium-track-radius` | S | 1 | 2 | ″ |
| `--slider-reach` | `--mo-comp-slider-reach` | S | 1 | 23 | ″ |
| `--slider-room` | `--mo-comp-slider-room` | S | 2 | 8 | ″ |
| `--slider-stop-active-color` | `--mo-comp-slider-stop-active-color` | S | 1 | 3 | ″ |
| `--slider-stop-color` | `--mo-comp-slider-stop-color` | S | 1 | 3 | ″ |
| `--slider-track-corner` | `--mo-comp-slider-track-corner` | S | 5 | 11 | ″ |
| `--slider-track-gap` | `--mo-comp-slider-track-gap` | S | 1 | 10 | ″ |
| `--slider-track-height` | `--mo-comp-slider-track-height` | S | 1 | 3 | ″ |
| `--slider-track-inner-radius` | `--mo-comp-slider-track-inner-radius` | S | 1 | 11 | ″ |
| `--slider-track-radius` | `--mo-comp-slider-track-radius` | S | 1 | 7 | ″ |
| `--slider-track-thickness` | `--mo-comp-slider-track-thickness` | S | 5 | 10 | ″ |
| `--slider-value-radius` | `--mo-comp-slider-value-radius` | S | 1 | 3 | ″ |
| `--slider-value-room` | `--mo-comp-slider-value-room` | S | 1 | 4 | ″ |
| `--slider-value-surface` | `--mo-comp-slider-value-surface` | S | 1 | 3 | ″ |
| `--slider-value-text` | `--mo-comp-slider-value-text` | S | 1 | 3 | ″ |
| `--slider-xlarge-track-radius` | `--mo-comp-slider-xlarge-track-radius` | S | 1 | 2 | ″ |
| `--snackbar-action-hover` | `--mo-comp-snackbar-action-hover` | S | 1 | 3 | ″ |
| `--snackbar-action-text` | `--mo-comp-snackbar-action-text` | S | 1 | 3 | ″ |
| `--snackbar-backdrop` | `--mo-comp-snackbar-backdrop` | S | 1 | 4 | ″ |
| `--snackbar-padding-block` | `--mo-comp-snackbar-padding-block` | S | 1 | 4 | ″ |
| `--snackbar-radius` | `--mo-comp-snackbar-radius` | S | 1 | 4 | ″ |
| `--snackbar-surface` | `--mo-comp-snackbar-surface` | S | 1 | 3 | ″ |
| `--snackbar-text` | `--mo-comp-snackbar-text` | S | 1 | 5 | ″ |
| `--split-button-inner` | `--mo-comp-split-button-inner` | S | 3 | 7 | ″ |
| `--split-button-inner-radius` | `--mo-comp-split-button-inner-radius` | S | 1 | 3 | ″ |
| `--split-button-large-inner-radius` | `--mo-comp-split-button-large-inner-radius` | S | 1 | 3 | ″ |
| `--split-button-xlarge-inner-radius` | `--mo-comp-split-button-xlarge-inner-radius` | S | 1 | 3 | ″ |
| `--switch-disabled-opacity` | `--mo-comp-switch-disabled-opacity` | S | 1 | 3 | ″ |
| `--switch-gap` | `--mo-comp-switch-gap` | S | 1 | 3 | ″ |
| `--switch-handle-checked-size` | `--mo-comp-switch-handle-checked-size` | S | 1 | 6 | ″ |
| `--switch-handle-checked-surface` | `--mo-comp-switch-handle-checked-surface` | S | 1 | 3 | ″ |
| `--switch-handle-icon-size` | `--mo-comp-switch-handle-icon-size` | S | 1 | 4 | ″ |
| `--switch-handle-pressed-size` | `--mo-comp-switch-handle-pressed-size` | S | 1 | 4 | ″ |
| `--switch-handle-size` | `--mo-comp-switch-handle-size` | S | 1 | 10 | ″ |
| `--switch-handle-surface` | `--mo-comp-switch-handle-surface` | S | 1 | 4 | ″ |
| `--switch-height` | `--mo-comp-switch-height` | S | 1 | 5 | ″ |
| `--switch-icon-checked-color` | `--mo-comp-switch-icon-checked-color` | S | 1 | 3 | ″ |
| `--switch-icon-color` | `--mo-comp-switch-icon-color` | S | 1 | 3 | ″ |
| `--switch-track-line` | `--mo-comp-switch-track-line` | S | 1 | 3 | ″ |
| `--switch-track-line-width` | `--mo-comp-switch-track-line-width` | S | 1 | 3 | ″ |
| `--switch-track-surface` | `--mo-comp-switch-track-surface` | S | 1 | 3 | ″ |
| `--switch-width` | `--mo-comp-switch-width` | S | 1 | 3 | ″ |
| `--text-field-box` | `--mo-comp-text-field-box` | S | 1 | 11 | ″ |
| `--text-field-disabled-opacity` | `--mo-comp-text-field-disabled-opacity` | S | 1 | 4 | ″ |
| `--text-field-error` | `--mo-comp-text-field-error` | S | 1 | 12 | ″ |
| `--text-field-filled-focus-line` | `--mo-comp-text-field-filled-focus-line` | S | 1 | 5 | ″ |
| `--text-field-filled-hover-line` | `--mo-comp-text-field-filled-hover-line` | S | 1 | 3 | ″ |
| `--text-field-filled-line` | `--mo-comp-text-field-filled-line` | S | 1 | 4 | ″ |
| `--text-field-filled-surface` | `--mo-comp-text-field-filled-surface` | S | 1 | 2 | ″ |
| `--text-field-font-size` | `--mo-comp-text-field-font-size` | S | 1 | 3 | ″ |
| `--text-field-height` | `--mo-comp-text-field-height` | S | 2 | 15 | ″ |
| `--text-field-icon-gap` | `--mo-comp-text-field-icon-gap` | S | 1 | 5 | ″ |
| `--text-field-icon-padding` | `--mo-comp-text-field-icon-padding` | S | 1 | 5 | ″ |
| `--text-field-label-start` | `--mo-comp-text-field-label-start` | S | 3 | 5 | ″ |
| `--text-field-label-surface` | `--mo-comp-text-field-label-surface` | S | 2 | 5 | ″ |
| `--text-field-outlined-focus-line` | `--mo-comp-text-field-outlined-focus-line` | S | 1 | 5 | ″ |
| `--text-field-outlined-hover-line` | `--mo-comp-text-field-outlined-hover-line` | S | 1 | 3 | ″ |
| `--text-field-outlined-line` | `--mo-comp-text-field-outlined-line` | S | 1 | 4 | ″ |
| `--text-field-outlined-surface` | `--mo-comp-text-field-outlined-surface` | S | 1 | 3 | ″ |
| `--text-field-padding` | `--mo-comp-text-field-padding` | S | 2 | 12 | ″ |
| `--text-field-radius` | `--mo-comp-text-field-radius` | S | 1 | 5 | ″ |
| `--time-picker-box-radius` | `--mo-comp-time-picker-box-radius` | S | 1 | 4 | ″ |
| `--time-picker-box-selected-surface` | `--mo-comp-time-picker-box-selected-surface` | S | 1 | 3 | ″ |
| `--time-picker-box-selected-text` | `--mo-comp-time-picker-box-selected-text` | S | 1 | 3 | ″ |
| `--time-picker-box-surface` | `--mo-comp-time-picker-box-surface` | S | 1 | 4 | ″ |
| `--time-picker-dial-surface` | `--mo-comp-time-picker-dial-surface` | S | 1 | 3 | ″ |
| `--time-picker-headline-color` | `--mo-comp-time-picker-headline-color` | S | 1 | 3 | ″ |
| `--time-picker-ring` | `--mo-comp-time-picker-ring` | S | 1 | 5 | ″ |
| `--toolbar-docked-backdrop` | `--mo-comp-toolbar-docked-backdrop` | S | 2 | 4 | ″ |
| `--toolbar-docked-line` | `--mo-comp-toolbar-docked-line` | S | 1 | 4 | ″ |
| `--toolbar-docked-line-width` | `--mo-comp-toolbar-docked-line-width` | S | 2 | 6 | ″ |
| `--toolbar-floating-line` | `--mo-comp-toolbar-floating-line` | S | 2 | 4 | ″ |
| `--toolbar-floating-radius` | `--mo-comp-toolbar-floating-radius` | S | 1 | 3 | ″ |
| `--toolbar-standard-surface` | `--mo-comp-toolbar-standard-surface` | S | 2 | 4 | ″ |
| `--tooltip-plain-radius` | `--mo-comp-tooltip-plain-radius` | S | 1 | 2 | ″ |
| `--tooltip-plain-surface` | `--mo-comp-tooltip-plain-surface` | S | 1 | 3 | ″ |
| `--tooltip-plain-text` | `--mo-comp-tooltip-plain-text` | S | 1 | 2 | ″ |
| `--tooltip-rich-line` | `--mo-comp-tooltip-rich-line` | S | 1 | 2 | ″ |
| `--tooltip-rich-radius` | `--mo-comp-tooltip-rich-radius` | S | 1 | 2 | ″ |
| `--tooltip-rich-subhead` | `--mo-comp-tooltip-rich-subhead` | S | 1 | 2 | ″ |
| `--tooltip-rich-text` | `--mo-comp-tooltip-rich-text` | S | 1 | 2 | ″ |
| `--top-app-bar-backdrop` | `--mo-comp-top-app-bar-backdrop` | S | 1 | 3 | ″ |
| `--top-app-bar-line-width` | `--mo-comp-top-app-bar-line-width` | S | 1 | 3 | ″ |
| `--top-app-bar-surface` | `--mo-comp-top-app-bar-surface` | S | 1 | 4 | ″ |

### theme parts (25)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--theme-blog-first-space` | `--mo-comp-theme-blog-first-space` | O | 1 | 2 | ours: the standard theme's page parts (logo, post list, home first); decision needed |
| `--theme-blog-first-space-large` | `--mo-comp-theme-blog-first-space-large` | O | 1 | 2 | ″ |
| `--theme-home-first-space` | `--mo-comp-theme-home-first-space` | O | 2 | 3 | ″ |
| `--theme-home-first-space-large` | `--mo-comp-theme-home-first-space-large` | O | 2 | 3 | ″ |
| `--theme-logo-mark` | `--mo-comp-theme-logo-mark` | O | 1 | 2 | ″ |
| `--theme-logo-mark-scale` | `--mo-comp-theme-logo-mark-scale` | O | 1 | 5 | ″ |
| `--theme-logo-name-size` | `--mo-comp-theme-logo-name-size` | O | 1 | 2 | ″ |
| `--theme-logo-name-weight` | `--mo-comp-theme-logo-name-weight` | O | 1 | 2 | ″ |
| `--theme-logo-role-display` | `--mo-comp-theme-logo-role-display` | O | 1 | 2 | ″ |
| `--theme-logo-role-display-large` | `--mo-comp-theme-logo-role-display-large` | O | 1 | 2 | ″ |
| `--theme-logo-tile` | `--mo-comp-theme-logo-tile` | O | 1 | 2 | ″ |
| `--theme-logo-tile-padding` | `--mo-comp-theme-logo-tile-padding` | O | 1 | 2 | ″ |
| `--theme-logo-tile-radius` | `--mo-comp-theme-logo-tile-radius` | O | 1 | 3 | ″ |
| `--theme-on-scrim-colour` | `--mo-comp-theme-on-scrim-colour` | O | 3 | 6 | ″ |
| `--theme-page-fade` | `--mo-comp-theme-page-fade` | O | 1 | 2 | ″ |
| `--theme-picture-radius` | `--mo-comp-theme-picture-radius` | O | 2 | 7 | ″ |
| `--theme-post-picture-radius` | `--mo-comp-theme-post-picture-radius` | O | 1 | 4 | ″ |
| `--theme-scrim-colour` | `--mo-comp-theme-scrim-colour` | O | 3 | 13 | ″ |
| `--theme-section-space` | `--mo-comp-theme-section-space` | O | 3 | 5 | ″ |
| `--theme-section-space-large` | `--mo-comp-theme-section-space-large` | O | 3 | 5 | ″ |
| `--theme-side-gap` | `--mo-comp-theme-side-gap` | O | 1 | 2 | ″ |
| `--theme-side-width` | `--mo-comp-theme-side-width` | O | 1 | 3 | ″ |
| `--theme-title-leading` | `--mo-comp-theme-title-leading` | O | 2 | 4 | ″ |
| `--theme-title-size` | `--mo-comp-theme-title-size` | O | 1 | 3 | ″ |
| `--theme-title-size-large` | `--mo-comp-theme-title-size-large` | O | 1 | 3 | ″ |

### editor and previews (39)

| Current | New | Kind | Declared | Reads | Note |
| :--- | :--- | :--- | ---: | ---: | :--- |
| `--editor-drawer-header-padding` | `--mo-comp-editor-drawer-header-padding` | O | 1 | 2 | ours: the editor's chrome and the Google result preview; decision needed |
| `--editor-drawer-header-text` | `--mo-comp-editor-drawer-header-text` | O | 1 | 3 | ″ |
| `--editor-frame-line` | `--mo-comp-editor-frame-line` | O | 1 | 4 | ″ |
| `--editor-frame-outset` | `--mo-comp-editor-frame-outset` | O | 1 | 11 | ″ |
| `--editor-hint-color` | `--mo-comp-editor-hint-color` | O | 1 | 4 | ″ |
| `--editor-menu-shadow` | `--mo-comp-editor-menu-shadow` | O | 1 | 3 | ″ |
| `--editor-menu-surface` | `--mo-comp-editor-menu-surface` | O | 1 | 3 | ″ |
| `--editor-pad-x` | `--mo-comp-editor-pad-x` | O | 1 | 5 | ″ |
| `--editor-pad-y` | `--mo-comp-editor-pad-y` | O | 1 | 3 | ″ |
| `--editor-section-frame` | `--mo-comp-editor-section-frame` | O | 1 | 3 | ″ |
| `--editor-section-gap` | `--mo-comp-editor-section-gap` | O | 1 | 3 | ″ |
| `--editor-section-pad` | `--mo-comp-editor-section-pad` | O | 1 | 8 | ″ |
| `--editor-section-rhythm` | `--mo-comp-editor-section-rhythm` | O | 1 | 2 | ″ |
| `--editor-sheet-tall` | `--mo-comp-editor-sheet-tall` | O | 1 | 3 | ″ |
| `--editor-status-average` | `--mo-comp-editor-status-average` | O | 1 | 3 | ″ |
| `--editor-status-average-surface` | `--mo-comp-editor-status-average-surface` | O | 1 | 2 | ″ |
| `--editor-status-average-text` | `--mo-comp-editor-status-average-text` | O | 1 | 2 | ″ |
| `--editor-status-bad` | `--mo-comp-editor-status-bad` | O | 1 | 4 | ″ |
| `--editor-status-bad-surface` | `--mo-comp-editor-status-bad-surface` | O | 1 | 2 | ″ |
| `--editor-status-bad-text` | `--mo-comp-editor-status-bad-text` | O | 1 | 2 | ″ |
| `--editor-status-good` | `--mo-comp-editor-status-good` | O | 1 | 5 | ″ |
| `--editor-status-good-surface` | `--mo-comp-editor-status-good-surface` | O | 1 | 2 | ″ |
| `--editor-status-good-text` | `--mo-comp-editor-status-good-text` | O | 1 | 2 | ″ |
| `--google-background` | `--mo-comp-google-background` | O | 1 | 2 | ″ |
| `--google-date` | `--mo-comp-google-date` | O | 1 | 2 | ″ |
| `--google-icon-fill` | `--mo-comp-google-icon-fill` | O | 1 | 2 | ″ |
| `--google-icon-letter` | `--mo-comp-google-icon-letter` | O | 1 | 2 | ″ |
| `--google-icon-ring` | `--mo-comp-google-icon-ring` | O | 1 | 2 | ″ |
| `--google-separator` | `--mo-comp-google-separator` | O | 1 | 2 | ″ |
| `--google-site` | `--mo-comp-google-site` | O | 1 | 2 | ″ |
| `--google-text` | `--mo-comp-google-text` | O | 1 | 4 | ″ |
| `--google-title` | `--mo-comp-google-title` | O | 1 | 2 | ″ |
| `--google-title-phone` | `--mo-comp-google-title-phone` | O | 1 | 2 | ″ |
| `--page-on-primary-container` | `--mo-comp-page-on-primary-container` | O | 1 | 2 | ″ |
| `--page-on-secondary-container` | `--mo-comp-page-on-secondary-container` | O | 1 | 2 | ″ |
| `--page-on-tertiary-container` | `--mo-comp-page-on-tertiary-container` | O | 1 | 2 | ″ |
| `--page-primary-container` | `--mo-comp-page-primary-container` | O | 1 | 2 | ″ |
| `--page-secondary-container` | `--mo-comp-page-secondary-container` | O | 1 | 2 | ″ |
| `--page-tertiary-container` | `--mo-comp-page-tertiary-container` | O | 1 | 2 | ″ |

### Not renamed: Tailwind's (129)

`--tw-prose-body`, `--tw-prose-headings`, `--tw-prose-bold`, `--tw-prose-links`, `--tw-prose-bullets`, `--tw-prose-counters`, `--tw-prose-code`, `--tw-prose-quotes`, `--tw-prose-quote-borders`, `--tw-prose-captions`, `--tw-prose-hr`, `--tw-prose-lead`, `--tw-prose-th-borders`, `--tw-prose-td-borders`, `--font-sans`, `--color-primary`, `--color-on-primary`, `--color-primary-container`, `--color-on-primary-container`, `--color-secondary`, `--color-on-secondary`, `--color-secondary-container`, `--color-on-secondary-container`, `--color-tertiary`, `--color-on-tertiary`, `--color-tertiary-container`, `--color-on-tertiary-container`, `--color-error`, `--color-on-error`, `--color-error-container`, `--color-on-error-container`, `--color-primary-fixed`, `--color-primary-fixed-dim`, `--color-on-primary-fixed`, `--color-on-primary-fixed-variant`, `--color-secondary-fixed`, `--color-secondary-fixed-dim`, `--color-on-secondary-fixed`, `--color-on-secondary-fixed-variant`, `--color-tertiary-fixed`, `--color-tertiary-fixed-dim`, `--color-on-tertiary-fixed`, `--color-on-tertiary-fixed-variant`, `--color-surface-dim`, `--color-surface`, `--color-surface-bright`, `--color-surface-container-lowest`, `--color-surface-container-low`, `--color-surface-container`, `--color-surface-container-high`, `--color-surface-container-highest`, `--color-on-surface`, `--color-on-surface-variant`, `--color-outline`, `--color-outline-variant`, `--color-inverse-surface`, `--color-inverse-on-surface`, `--color-inverse-primary`, `--color-scrim`, `--color-shadow`, `--radius-panel`, `--radius-panel-small`, `--shadow-soft`, `--ease-soft`, `--text-display-large`, `--text-display-large--line-height`, `--text-display-large--letter-spacing`, `--text-display-large--font-weight`, `--text-display-medium`, `--text-display-medium--line-height`, `--text-display-medium--letter-spacing`, `--text-display-medium--font-weight`, `--text-display-small`, `--text-display-small--line-height`, `--text-display-small--letter-spacing`, `--text-display-small--font-weight`, `--text-headline-large`, `--text-headline-large--line-height`, `--text-headline-large--letter-spacing`, `--text-headline-large--font-weight`, `--text-headline-medium`, `--text-headline-medium--line-height`, `--text-headline-medium--letter-spacing`, `--text-headline-medium--font-weight`, `--text-headline-small`, `--text-headline-small--line-height`, `--text-headline-small--letter-spacing`, `--text-headline-small--font-weight`, `--text-title-large`, `--text-title-large--line-height`, `--text-title-large--letter-spacing`, `--text-title-large--font-weight`, `--text-title-medium`, `--text-title-medium--line-height`, `--text-title-medium--letter-spacing`, `--text-title-medium--font-weight`, `--text-title-small`, `--text-title-small--line-height`, `--text-title-small--letter-spacing`, `--text-title-small--font-weight`, `--text-body-large`, `--text-body-large--line-height`, `--text-body-large--letter-spacing`, `--text-body-large--font-weight`, `--text-body-medium`, `--text-body-medium--line-height`, `--text-body-medium--letter-spacing`, `--text-body-medium--font-weight`, `--text-body-small`, `--text-body-small--line-height`, `--text-body-small--letter-spacing`, `--text-body-small--font-weight`, `--text-label-large`, `--text-label-large--line-height`, `--text-label-large--letter-spacing`, `--text-label-large--font-weight`, `--text-label-medium`, `--text-label-medium--line-height`, `--text-label-medium--letter-spacing`, `--text-label-medium--font-weight`, `--text-label-small`, `--text-label-small--line-height`, `--text-label-small--letter-spacing`, `--text-label-small--font-weight`, `--breakpoint-*`, `--breakpoint-medium`, `--breakpoint-expanded`, `--breakpoint-large`, `--breakpoint-extra-large`
