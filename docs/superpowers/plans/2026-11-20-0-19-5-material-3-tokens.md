# 0.19.5 Material 3 tokens (plan)

Status: **20 November 2026.** The owner put this release before the UI fixes, which became 0.19.6 (owner: "Agree"). Roadmap:
`plans/2026-11-14-roadmap-0-18-to-0-24.md`, item 0.19.5.

## What 0.19.5 is

A check that compares the theme's tokens with Material 3's own tokens, run in CI and failing on a difference that is not on its
allowlist, released together with the fixes that make it pass (a check and its fixes are one bite, `plans/2026-11-18-release-per-feature.md`).
One feature, `feature/0.19.5-m3-tokens`, cut from `main` by PM 0.19.5 once 0.19.4 is released. Two specs ride in it:

- `specs/2026-11-20-elevation-design.md`: the surface and elevated kinds, the classes, the check on hand-written shadows, the current parts;
- `specs/2026-11-20-section-colours-design.md`: the two colours of a coloured section and `check:color-roles`.

Not in 0.19.5: behaviour, layout, motion and word choice (the open PRs of the M3 audit stay in 0.26.0; M3's motion tokens are empty in its
data), and renaming the CMS's tokens to M3's names (a contract change, for 0.22's steps table).

## The token copy

Owner, 20 November 2026: "only the tokens … go ahead". The CTO made a tokens-only copy of m3.material.io on 20 November 2026 (content version
`2026-11-19_06-20-01`): 184 token sets and 6,463 tokens, with no page text, images or the names of the people who edited them. Each token has
its reference (`md.sys.color.secondary-container`) and its value in light and dark.

- `scripts/m3-tokens.mjs` (Node, no dependency) makes it, run by hand when M3 changes, never in CI.
- `docs/m3-tokens/` holds it, one JSON per set, with each token's reference and its public M3 value (audience 3P), light and dark, and the
  group it belongs to (Expressive or baseline). The other contexts are left out, so the copy stays small.
- Where a set has an Expressive and a baseline value, the Expressive one counts (skill `material-3`).

## The check

`npm run check:m3-tokens` (`scripts/check-m3-tokens.mjs`), in `check:source` (no browser, a few seconds).

- **What it compares:** every `--mo-sys-*` and `--mo-comp-*` token the Material theme declares on `:root` whose name maps to an M3 token
  (`--mo-comp-search-bar-container-color` ↔ `md.comp.search-bar.container.color`). Both sides are resolved: a reference must name the same
  role or step (`var(--mo-sys-color-secondary-container)`), and a measure must be the same size (dp ÷ 16 = rem). The section swap and other
  scoped rules are not compared (`check:color-roles` covers them).
- **What fails:** a difference not on the allowlist, and an allowlist entry that no longer differs, so the list only shrinks.
- **The allowlist** (`scripts/m3-tokens.allow.mjs`): each entry names the token and a reason, which is a numbered entry of
  `docs/material-deviations.md` (for example 9, the 44 dp rows of the bar and its menus) or "to fix in batch N". At release only the
  deviations are left.
- **A report** (`--report`, never failing) lists M3 tokens a part has no `--mo-` name for, as input for 0.22's steps table.

### The first pass

The CTO ran a rough comparison on `main` (20 November 2026): of the theme's 682 tokens, 268 carry an M3 name; 107 match and 161 differ. The
rough pass did not resolve references or pick the Expressive group, and it read the section swap too, so many of the 161 are false (the
24 colour roles the swap re-declares; type weights written as numbers). What looks real:

- **Colour roles of parts:** tonal buttons and tonal icon buttons, the FAB, the selected segmented button and the navigation bar's and rail's
  active indicator on `surface-container-high` with `on-surface`, where M3 has `secondary-container` (FAB: `primary-container`) with its
  on-colour; outlined buttons and icon buttons on `outline` where M3 has `outline-variant`, with `primary` text where M3 has
  `on-surface-variant`; the menu on `elevation-level1-color` where M3 has `surface-container`; the selected menu item on tertiary where M3
  has secondary; slider stop indicators and label, the switch's selected icon, the rich tooltip's subhead.
- **Sizes:** the switch's unselected icon 24 dp (M3 16) and the circular progress indicator's thickness. Others need sorting against
  M3's Expressive sets before they count: the navigation bar 64 dp and the rail 96 dp match the Expressive flexible bar and the collapsed
  rail, where the baseline sets say 80 dp; button sizes and icon-label gaps (our *medium* button is 40 dp, M3 Expressive's *small*).
- **Shapes:** the menu (large, M3 extra-small or the Expressive menu's value), the docked search view (medium, M3 extra-large), the docked
  side sheet (large, M3 none), the slider's active track (small, M3 full), list items.
- **Type:** tracking values, and display and headline sizes on the plain typeface where M3 names the brand one.

Batch 1 makes the comparison exact and turns this into the real baseline.

## Batches (pull requests into `feature/0.19.5-m3-tokens`)

1. **The version, the copy and the check.** Sets the version to 0.19.5 (`plans/2026-11-19-version-at-feature-start.md`), adds
   `scripts/m3-tokens.mjs`, `docs/m3-tokens/`, `check:m3-tokens` in CI and its allowlist with exactly the baseline found, each entry sorted
   as a recorded deviation or "to fix". `.claude/skills/checks/SKILL.md` says when to run it (a change to `theme/styles/tokens/`).
2. **Elevation, the classes and the shadow check** (elevation spec, batches 1 and 2).
3. **The section colours check and swap** (section colours spec, batches 1 and 2).
4. **The current parts' elevation** (elevation spec, batch 3), with its test against the copy.
5. **Colour roles of parts.** Every "to fix" colour entry fixed to M3's role. `check:contrast` and `check:screens` on every section colour,
   light and dark.
6. **Sizes, shapes and type.** Every "to fix" size, shape and type entry fixed. Where the owner wants to keep our value, the entry becomes a
   deviation with the owner's words, never a silent allowlist entry.
7. **The rest of the colour allowlist** (section colours spec, batch 3).

Batch 1 goes first; 2 and 3 can run side by side; 4 follows 2; 5 follows 3 (both change colours of parts); 6 can run beside 4 and 5; 7 goes
last. Every batch removes the allowlist entries it fixes, keeps `check:screens`, `check:themes`, `check:contrast` and `check:a11y` green, and
Venus is checked on the demo. Parts change their look (tonal buttons, the navigation indicators, the bars losing their shadow), so batches 4
to 6 each add a release note line (skill `release-notes`).

## Done when

`check:m3-tokens` runs in CI, its allowlist holds only recorded deviations, the elevation and section colours specs are done, the owner has
reviewed the feature on the demo in light and dark, and 0.19.5 has run on staging before the owner releases it.
