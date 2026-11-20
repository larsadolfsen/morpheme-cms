# Tailwind batch T16: Remove Tailwind and raise the contract to 7

Spec for one build session and one pull request into `main`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: Tailwind ships as 0.18.2, with contract 7, patch changesets, into `main` after the owner releases 0.18.0.

| | |
| :-- | :-- |
| **When** | After every other batch has merged and `check:tailwind` counts are zero except the wiring. |
| **Must merge first** | T05 to T09, T11 to T15, M2 to M6 (`2026-11-18-mo-names-contract-7.md`; the changeset and note also name the renamed classes and properties) |
| **Others wait for it** | T17 |
| **Size** | large (wide, shallow) |

## Goal

Remove the packages and the wiring, and raise `THEME_API` and `APP_API` from 6 to 7, with `APP_APIS = [7]` (as the token rename did with `[6]`).

## What to do

- `theme/styles/base.css`: `@import 'tailwindcss'`; `@source` lines (they will be in `base.css` after the split); `src/editor.css`: `@reference`; the `@theme inline` and `@theme static` blocks (`tokens/base/ref.css`, `tokens/material/ref.css`); `@layer theme, base, components, utilities, fallback;` becomes the explicit order without `theme` if nothing uses it (decide by `compare-styles`).
- `astro.mjs`: the import and `tailwindcss()`. `package.json`: `tailwindcss`, `@tailwindcss/vite` (peer and dev), `prettier-plugin-tailwindcss`, and `package-lock.json`. `starter/package.json` and both `.prettierrc.json` (`plugins`, `tailwindStylesheet`). `scripts/fixtures/starter-0.14.2.package.json` stays (an upgrade fixture).
- `lib/licenses.mjs` (3 mentions: preflight and typography licences), `README.md:48`, `lib/colors.ts` comment, `lib/breakpoints.mjs` and `site/breakpoints.mjs` comments, `scripts/check-css-values.mjs` (off-scale class rule), `scripts/check-colors.mjs` (palette-class rule), `scripts/spacing-grid.allow.mjs`, `scripts/color-names.test.mjs`.
- `scripts/css-tokens-allowlist.json` and `docs/css-tokens.md`: the Tailwind entries and the `@theme` namespaces; `scripts/check-css-tokens.mjs` and its test: no exemption for `--tw-*` or `@theme`; the registry (`scripts/gen-token-registry.mjs`) regenerated.
- `lib/contracts.mjs`: `THEME_API = 7`, `APP_API = 7`, `APP_APIS = Object.freeze([7])`, and the comments: *7 ends Tailwind: a theme or an app written to 6 that uses a utility class, `theme()`, `@theme` or `@apply` does not work, and the store offers only contract 7*. Every test that names the contract (`git grep -n 'APP_API\|THEME_API\|APP_APIS' -- '*.test.*' scripts src lib site`) is updated; `docs/app-contract.md` gets *Contract 7* (the paragraph T02 wrote), and the starter's and demo's `app.json`/`theme.json` contract numbers move to 7 (`git grep -n '"contract"\|"api"'`).
- The store side (`morpheme-appstore`, not this repository) must accept and offer contract 7: the PM asks for a matching PR there; this batch lists the files that name 6 (`git grep` here) so the store's session can mirror it.
-  `.claude/skills/checks/SKILL.md` and the `developer` skill (the Tailwind lines).
- A changeset `minor` (see below) and, per the `release-notes` skill, a note for theme and app authors if the skill says so (a site owner sees nothing).

## Files it touches

- the files above; many are one line

## Proof that the rendered result is identical

1. `compare-styles` demo and starter, all pages, 4 widths, light and dark, every section colour, **before the batch (Tailwind installed) vs after (Tailwind removed)**: 0 differences.
2. `styles-snapshot` of every editor unit before vs after: 0 differences.
3. `npm run check:starter` (it packs the package and builds the starter with the new `package.json`) and `check:demo` green; the `peer-ranges` and the starter-0.14.2 upgrade fixture tests green.
4. `git grep -i tailwind -- . ':!package-lock.json' ':!CHANGELOG.md' ':!release-notes' ':!docs' ':!scripts/fixtures'` lists only comments that say what Tailwind was (paste it; each is justified or removed).
5. `node --test` of the contract tests with the new numbers; `check:starter` shows the starter installs and builds with `THEME_API` 7.

## Changeset

`patch` (never `minor`): *Contract 7: themes and apps use plain CSS (`mo-` layout classes, literal breakpoints); utility classes, `theme()` and `@theme` no longer work, and the store offers only themes and apps written to 7. See docs/tailwind-migration.md.*

## Checks

`npm run check`, `check:starter`, `check:demo`, `check:themes`; CI runs `check:screens`.

## Rules for every batch

- Start with the `developer` skill, read `CLAUDE.md`, load `checks`. A brainstorm is over for this work: the owner said Tailwind ships as 0.18.2 (18 Nov); this batch is built, as specified here and nothing else, **when the PM says**: no build session starts before the owner has released 0.18.0.
- **One pull request into `main`** (the 0.18.2 work goes into `main` after the owner releases 0.18.0), one logical change, the rendered result identical. Check in with the PM first (`ready: <branch>, <what changed>, local check green`) and push only on "your slot" (`developer` §3a). Never merge your own pull request. At most two Tailwind batches are in CI at once; the PM keeps the order (`2026-11-18-tailwind-batches.md`). Changeset level: **`patch` or empty, never `minor` or `major`** (the release is 0.18.2).
- **A merge into `main` is also flowed into `0.19`** (the 0.19 PM merges `main` into `0.19`, a merge commit, never a rebase, the same day) for every batch that touches `src/` or `theme/`; the batch says its freeze window.
- **Components line:** *existing; moved as they were; Material 3 pages not read, a pure migration changes no design.* A batch that adds layout helpers (T04) says: *none: layout helpers, not components.* No new component, no screen-specific variant (`developer` hard rule). A cluster of utilities that draws a surface or a control is not turned into a new component: it keeps its look in a named part rule, and the PR lists it under **Surfaces** for the PM (the owner decides later whether it becomes a theme component).
- Name the Modern Web Guidance guides you read in the PR text (`css-layout`, `css`, `responsive-design` for a batch that writes CSS). Logical properties (`inline-size`, `margin-inline`, `padding-block`) and `gap`, as the guide says; a physical property only where the old utility was physical on purpose.
- After T01 exists: lower `scripts/tailwind-allowlist.json` in the same PR by exactly the uses the batch removed, and say the numbers in the PR text.
- A token the batch adds follows `docs/css-tokens.md`: `--mo-ref-*`, `--mo-sys-*` or `--mo-comp-<component>-*`, a token one place reads is declared there, nothing unprefixed on `:root`.
- English only (replies, PR text, commits). Short report to the PM: link and head sha.
- **The card and list files are not a Tailwind batch's work** (owner, 18 Nov: cards and lists, steps 1 to 5 of `2026-11-17-cards-and-lists-0-19.md`, go into 0.18.0 in plain CSS; the PM took them out of these batches): `theme/ui/Card.tsx`, `List.tsx`, `ImageTile.tsx`, `Avatar.tsx`; the site's cards (`theme/blocks/cards/LinkCards.tsx` and `View.tsx`, `pricecards/View.tsx`, `notice/View.tsx`, `table/View.tsx`, `cookies/View.tsx`, `Panel.tsx`, `imagegrid/View.tsx`, `testimonials/Testimonial.tsx`, `theme/components/PostCard.tsx`, the card in `theme/templates/NotFound.astro`) and lists (`list/Rows.tsx`, `points/PointList.tsx`, `checklist/Checks.tsx`, `links/LinkGroups.tsx`, `testimonials/List.tsx` and `View.tsx`, `accordion/Accordion.tsx`, `theme/components/PostList.tsx`); `theme/styles/cards.css`, `lists.css`, `avatar.css`, the card and list rules in `blocks.css` (or their files under `theme/styles/blocks/`) and in `global.css`, and the token files `theme/styles/tokens/*/comp/card.css` and `comp/list.css` (with the cards' and lists' own token files). **Do not edit them.** If one still holds a Tailwind class or a `theme()` when the batch starts, the batch reports it to the PM instead of fixing it. Still the batches' work: `ChoiceGroup`, `Search`, `ActionBar`, `defaults/popup.tsx` and all of `src/`.
- **Do not touch `theme/styles/ui.css`, `base.css`, `blocks.css`, `components.css` or `global.css` while the CSS split is moving them** unless the batch says "after the split". The PM tells the batch session when the split has finished.
