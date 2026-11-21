# 0.19.5 Material 3 tokens (plan)

Status: **20 November 2026.** The owner put this release before the UI fixes, which became 0.19.6 (owner: "Agree"), and then set the
goal: "I want us to match md both in appearance and in naming". 0.19.5 makes the appearance match; the names follow in a contract raise
(*Names*, below). Roadmap:
`plans/2026-11-14-roadmap-0-18-to-0-24.md`, item 0.19.5.

## What 0.19.5 is

A check that compares the theme's tokens with Material 3's own tokens, run in CI and failing on a difference that is not on its
allowlist, released together with the fixes that make it pass (a check and its fixes are one bite, `plans/2026-11-18-release-per-feature.md`).
One feature, `feature/0.19.5-m3-tokens`, cut from `feature/0.19.4-screen-readers`, not from `main` (owner, 21 November 2026: 0.19.5 is built
alongside 0.19.4). After every merge into `feature/0.19.4-screen-readers`, 0.19.4 is merged forward into this branch (never a rebase). It goes into `main`,
and so onto `next`, only after the owner has approved or rejected the staged 0.19.4. Two specs ride in it:

- `specs/2026-11-20-elevation-design.md`: the surface and elevated kinds, the classes, the check on hand-written shadows, the current parts;
- `specs/2026-11-20-section-colours-design.md`: the two colours of a coloured section and `check:color-roles`.

**Match, not deviate.** Every value the site and the theme's parts show is M3's (the Expressive one where a set has both). No new
deviation is added to keep one of ours. Two owner rules still stand: the editor's own workspace (its bar, overflow menu, text and block
menus) is outside Material 3 (13 Nov 2026), and where M3 and WCAG 2.2 AA differ, WCAG wins (19 Nov 2026).

Not in 0.19.5: behaviour, layout, motion and word choice (the open PRs of the M3 audit stay in 0.26.0; M3's motion tokens are empty in its
data), and the names (below).

## Names

The CMS's names become M3's: every token is `--mo-` plus M3's own token name (`md.comp.search-bar.container.color` →
`--mo-comp-search-bar-container-color`), every part and size has M3's name (our *medium* button is M3 Expressive's *small*), and a value
M3 has no token for gets a name in M3's pattern, listed as ours. Renaming breaks themes and apps that use the old names, so it raises
`THEME_API` and `APP_API`, with a rename map and an update that rewrites a site's content and its own themes and apps (contracts 6 and
7 rewrote nothing; `specs/2026-11-20-material-3-names-design.md`). A contract raise starts a new line (`plans/2026-11-18-release-per-feature.md`), so the names are **0.20.0 Material 3
names** (owner, 20 November 2026: "Yes, put it in the roadmap"), with scoped app CSS in the same contract. `check:m3-tokens --report` (below) lists every name that will change.

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
- **The allowlist** (`scripts/m3-tokens.allow.mjs`): each entry names the token and a reason: "to fix in batch N", the editor's workspace,
  or a WCAG criterion. At release only the last two are left.
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
- **Sizes:** the switch's unselected icon 24 dp (M3 16) and the circular progress indicator's thickness. Others are measured against
  M3's Expressive sets in batch 1: the navigation bar 64 dp and the rail 96 dp match the Expressive flexible bar and the collapsed rail,
  where the baseline sets say 80 dp; button sizes and icon-label gaps (our *medium* button is 40 dp, M3 Expressive's *small*: the size
  matches, the name follows in *Names*).
- **Shapes:** the menu (large, M3 extra-small or the Expressive menu's value), the docked search view (medium, M3 extra-large), the docked
  side sheet (large, M3 none), the slider's active track (small, M3 full), list items.
- **Type:** tracking values, and display and headline sizes on the plain typeface where M3 names the brand one.

Batch 1 makes the comparison exact and turns this into the real baseline.

## Batches (pull requests into `feature/0.19.5-m3-tokens`)

1. **The version, the copy and the check.** Sets the version to 0.19.5 (`plans/2026-11-19-version-at-feature-start.md`), adds
   `scripts/m3-tokens.mjs`, `docs/m3-tokens/`, `check:m3-tokens` in CI and its allowlist with exactly the baseline found, each entry sorted
   as a recorded deviation or "to fix". `.claude/skills/checks/SKILL.md` says when to run it (a change to `theme/styles/tokens/`).
2. **The UI components page** (owner, 21 November 2026, "Yes and yes"). A page `/ui/` on the demo and on `morpheme-staging` that shows the theme's UI
   components as a visitor sees them, with the site's own theme and CSS, so the owner sees each token batch's before and after on one Preview page.
   - *Shared gallery:* it draws the same gallery as the editor's *Developer › Parts › UI components* (`#developer/parts/ui`, `ComponentParts` in
     `src/BlockParts.tsx`), so the two never differ.
   - *Layout:* one heading per group (Buttons, Icon buttons, FABs, Chips, Text fields …) and a subheading per size or kind (Small, Medium, Large;
     Filled, Tonal, Outlined …). The editor's gallery gets the same headings and subheadings.
   - *Visibility:* hidden from search engines and not in the menu. The CMS package provides the page and a site turns it on, so only the demo and
     `morpheme-staging` show it, never a customer's site. Staging needs its own pull request in that repository.
   - *Design first:* a short design, for the setting's name, goes before the build.
3. **Elevation, the classes and the shadow check** (elevation spec, batches 1 and 2).
4. **The section colours check and swap** (section colours spec, batches 1 and 2).
5. **The current parts' elevation** (elevation spec, batch 3), with its test against the copy.
6. **Colour roles of parts.** Every "to fix" colour entry fixed to M3's role. `check:contrast` and `check:screens` on every section colour,
   light and dark.
7. **Sizes, shapes and type.** Every "to fix" size, shape and type entry fixed to M3's value.
8. **The rest of the colour allowlist** (section colours spec, batch 3).
9. **The recorded deviations.** Every entry of `docs/material-deviations.md` outside the editor's workspace is sorted: it matches M3
   Expressive after all (the entry goes, as with the 16 dp menu corner and the 56 dp hero buttons), WCAG requires it (it stays, naming the
   criterion), or it is made to match M3 and the entry goes (for example G1, the 16 and 24 px gap between cards where M3 prints 8 dp max).
10. **Density follows M3** (owner, 21 November 2026; a new session builds it). Large goes and Medium becomes 0; every part that M3 gives a density supports 0 to
    -3 in the theme's styling; the editor keeps Medium and Small; accounts on Large move to Medium. Removes density deviations 12 to 15 and adds a release note line.
    Batches 9 and earlier do not touch the density CSS.

11. **The theme's accessibility statement: file and checks.** `theme/accessibility.json` (Material's own file), and `check:contrast`, `check:screens`, `check:a11y`
    and `check:announce` let a failure through only if it is named there (spec on #1071). Batch 9 lands after it.
12. **The accessibility statement in the editor.** The editor's theme page row and its texts.

Batch 1 goes first; 2 (the page) follows it, because every token batch after it is reviewed on that page; 3 and 4 can run side by side; 5 follows 3; 6 follows 4 (both change colours of parts); 7 and 9 can run beside 5 and
6; 8 goes last. Every batch removes the allowlist entries it fixes, keeps `check:screens`, `check:themes`, `check:contrast` and `check:a11y` green, and
Venus is checked on the demo. Parts change their look (tonal buttons, the navigation indicators, the bars losing their shadow), so batches 5
to 7 and 9 each add a release note line (skill `release-notes`).

## Scope change (owner, 21 November 2026)

Owner: "we will no longer follow our FRONTEND deviations, instead we will follow md3". Material, the default theme, follows M3 exactly on the site; every
deviation outside the editor's own workspace is removed and the part takes M3's value, **including the three accessibility ones**: the 60 % placeholder
and the control edges (deviation 4), the outlined card's edge in `outline-variant` (O1) and the section's edges (O2). Their values change in batches 4, 6 and 8, and
`docs/material-deviations.md` no longer lists them. In their place a theme's accessibility statement comes (`specs/2026-11-21-theme-accessibility-statement-design.md`):
`theme/accessibility.json` names the shortfalls from WCAG 2.2 AA by criterion and part, and `check:contrast`, `check:screens`, `check:a11y` and `check:announce` let a
failure through only if it is named there (batches 11 and 12 below); this pull request lands after batch 11. The site's focus ring is M3's focus indicator;
`check:contrast` measures it at 3:1 and it is named in the statement only if it falls under. The editor's workspace keeps its exceptions. Coloured sections stay, on M3's
nearest container roles (batch 4). `scripts/m3-tokens.allow.mjs` ends with the editor's workspace entries. Material later becomes a theme like Venus; no base theme work
is in 0.19.5.

Every frontend deviation, by name, and the batch that removes it (the sorting is `plans/2026-11-21-0-19-5-deviations-sorted.md`):

| Deviation (`docs/material-deviations.md`) | Removed by |
| :-- | :-- |
| Section colours 1 (inverted theme), 2 (veils), 3 (quieter text) | batch 4 |
| Section colours 4 (placeholders, icons), O1 (outlined card edge), O2 (edges in a coloured section) | removed, covered by the accessibility statement (batch 11); the values change in batches 4, 6 and 8 |
| Colour sweep 1 (status badges), 6 (video still), 7 to 9 (masks, `#000`, scrim) | batch 8 (or recorded as M3's own value) |
| Colour sweep 11 (`--block-*` aliases) | 0.20.0 names |
| Colour sweep 12 (elevation and panel shadows) | batches 3 and 5 |
| CSS sweep 4 (icon button 48 dp), Buttons B1 (text button padding), CSS sweep 9 (type sizes) | batch 7 |
| CSS sweep 1 to 3, 6 to 8 (dialog and menu corners, 56 dp buttons, list rows, checkbox ring, slider and code corners, spacing) | batch 9: they match M3 |
| Image tiles 17, G1 (card gap 8 dp), Lightbox 19 | batch 9 |
| Choice group D2 and D3, Palette P1, C2, F1 (FAB), B3 (sheet padding), T1 (text measure), Cards CM1 to CM3 | batch 9 |
| Search view SV1 to SV5, SV7 (scrim), SV8 to SV13, SV12 (list rows on Surface), button group `aria-pressed` | batch 9 |
| Navigation rail N1, N2, N7 | batch 9 |
| CSS sweep 5 and FR1 (focus ring), A1 (search field ring) | batch 9: the site takes M3's focus indicator (`secondary`, 3 dp, 2 dp); the editor keeps `primary`. Only if `check:contrast` or `check:keyboard` fails on it does it join the accessibility allowlist |
| E1 (error text without `role="alert"`), N5 (native dialog, no swipe) | stays: Modern Web Guidance outranks M3 (priority 1), guides named in each entry |
| Choice group D1 (radio-list fallback) | → 0.20.0: follows M3's button group (one line, smaller buttons, then an overflow menu) |
| N3 (site menu: icons on rail items) | → 0.20.0: M3's navigation drawer built on the rail code with the rail off; the editor keeps the rail |
| N4 (`menuSide`, menu on the end edge) | not a deviation: customization (owner, 21 Nov 2026); removed from `docs/material-deviations.md`, not on the 0.20.0 list |
| The Dialog's full-screen kind | → 0.20.0: the theme's Dialog gets the kind back for compact windows; the editor keeps its pages for now |
| Density Large (+1) (12) and density 13 to 15 (horizontal padding, list row never below the target, invisible target area) | batch 10 |

## Done when

`check:m3-tokens` runs in CI, its allowlist holds only the editor's workspace entries, no frontend deviation is left, the elevation and section colours specs are done, the owner has
reviewed the feature on the demo in light and dark, and 0.19.5 has run on staging before the owner releases it.
