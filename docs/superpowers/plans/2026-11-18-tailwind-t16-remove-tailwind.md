# Tailwind batch T16: Remove Tailwind (inside contract 6)

Spec for one build session and one pull request into `0.18`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: "Remove Tailwind", on the 0.18 line, inside contract 6.

| | |
| :-- | :-- |
| **When** | After every other batch has merged and `check:tailwind` counts are zero except the wiring. |
| **Must merge first** | T05 to T09, T11 to T15 |
| **Others wait for it** | T17 |
| **Size** | large (wide, shallow) |

## Goal

Remove the packages and the wiring. Contract 6 is unchanged in number and in `APP_APIS = [6]`: it now also means no Tailwind.

## What to do

- `theme/styles/base.css`: `@import 'tailwindcss'`; `@source` lines (they will be in `base.css` after the split); `src/editor.css`: `@reference`; the `@theme inline` and `@theme static` blocks (`tokens/base/ref.css`, `tokens/material/ref.css`); `@layer theme, base, components, utilities, fallback;` becomes the explicit order without `theme` if nothing uses it (decide by `compare-styles`).
- `astro.mjs`: the import and `tailwindcss()`. `package.json`: `tailwindcss`, `@tailwindcss/vite` (peer and dev), `prettier-plugin-tailwindcss`, and `package-lock.json`. `starter/package.json` and both `.prettierrc.json` (`plugins`, `tailwindStylesheet`). `scripts/fixtures/starter-0.14.2.package.json` stays (an upgrade fixture).
- `lib/licenses.mjs` (3 mentions: preflight and typography licences), `README.md:48`, `lib/colors.ts` comment, `lib/breakpoints.mjs` and `site/breakpoints.mjs` comments, `scripts/check-css-values.mjs` (off-scale class rule), `scripts/check-colors.mjs` (palette-class rule), `scripts/spacing-grid.allow.mjs`, `scripts/color-names.test.mjs`.
- `scripts/css-tokens-allowlist.json` and `docs/css-tokens.md`: the Tailwind entries and the `@theme` namespaces; `scripts/check-css-tokens.mjs` and its test: no exemption for `--tw-*` or `@theme`; the registry (`scripts/gen-token-registry.mjs`) regenerated.
- `lib/contracts.mjs`: only the comment of contract 6 (no number): *6 also ends Tailwind: a theme or an app that uses a utility class, `theme()`, `@theme` or `@apply` does not work*. `docs/app-contract.md`, *Contract 6* (the paragraph T02 wrote is now true), `.claude/skills/checks/SKILL.md` and the `developer` skill (the Tailwind lines).
- A changeset `minor` (see below) and, per the `release-notes` skill, a note for theme and app authors if the skill says so (a site owner sees nothing).

## Files it touches

- the files above; many are one line

## Proof that the rendered result is identical

1. `compare-styles` demo and starter, all pages, 4 widths, light and dark, every section colour, **before the batch (Tailwind installed) vs after (Tailwind removed)**: 0 differences.
2. `styles-snapshot` of every editor unit before vs after: 0 differences.
3. `npm run check:starter` (it packs the package and builds the starter with the new `package.json`) and `check:demo` green; the `peer-ranges` and the starter-0.14.2 upgrade fixture tests green.
4. `git grep -i tailwind -- . ':!package-lock.json' ':!CHANGELOG.md' ':!release-notes' ':!docs' ':!scripts/fixtures'` lists only comments that say what Tailwind was (paste it; each is justified or removed).

## Changeset

`minor`: *Contract 6 also ends Tailwind: themes and apps use plain CSS (`mo-` layout classes, literal breakpoints); utility classes, `theme()` and `@theme` no longer work. See docs/tailwind-migration.md.* (The same release as the token rename: no second contract bump.)

## Checks

`npm run check`, `check:starter`, `check:demo`, `check:themes`; CI runs `check:screens`.

## Rules for every batch

- Start with the `developer` skill, read `CLAUDE.md`, load `checks`. A brainstorm is over for this work: the owner said "Remove Tailwind" (18 Nov); this batch is built, as specified here and nothing else.
- **One pull request into `0.18`**, one logical change, the rendered result identical. Check in with the PM first (`ready: <branch>, <what changed>, local check green`) and push only on "your slot" (`developer` §3a). Never merge your own pull request. At most two Tailwind batches are in CI at once; the PM keeps the order (`2026-11-18-tailwind-batches.md`).
- **Components line:** *existing; moved as they were; Material 3 pages not read, a pure migration changes no design.* A batch that adds layout helpers (T04) says: *none: layout helpers, not components.* No new component, no screen-specific variant (`developer` hard rule). A cluster of utilities that draws a surface or a control is not turned into a new component: it keeps its look in a named part rule, and the PR lists it under **Surfaces** for the PM (the owner decides later whether it becomes a theme component).
- Name the Modern Web Guidance guides you read in the PR text (`css-layout`, `css`, `responsive-design` for a batch that writes CSS). Logical properties (`inline-size`, `margin-inline`, `padding-block`) and `gap`, as the guide says; a physical property only where the old utility was physical on purpose.
- After T01 exists: lower `scripts/tailwind-allowlist.json` in the same PR by exactly the uses the batch removed, and say the numbers in the PR text.
- A token the batch adds follows `docs/css-tokens.md`: `--mo-ref-*`, `--mo-sys-*` or `--mo-comp-<component>-*`, a token one place reads is declared there, nothing unprefixed on `:root`.
- English only (replies, PR text, commits). Short report to the PM: link and head sha.
- **Do not touch `theme/styles/ui.css`, `base.css`, `blocks.css`, `components.css` or `global.css` while the CSS split is moving them** unless the batch says "after the split". The PM tells the batch session when the split has finished.
