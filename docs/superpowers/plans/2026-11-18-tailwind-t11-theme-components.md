# Tailwind batch T11: `theme/components/` (266 uses) and the import of the vocabulary

Spec for one build session and one pull request into `main`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: Tailwind ships as 0.18.1, with contract 7, patch changesets, into `main` after the owner releases 0.18.0.

| | |
| :-- | :-- |
| **When** | After the CSS split has finished and T10 has merged. |
| **Must merge first** | the CSS split, T01, T04, T10 |
| **Others wait for it** | T12, `morpheme-apps` migration (they need the vocabulary in a build) |
| **Size** | large |

## Goal

Replace the utilities in the site's components, and make `layout.css` part of every theme's base.

## What to do

- `theme/styles/base.css`: `@import './layout.css';` in the import list, and the file added to `OTHER_BASE_FILES` in `theme/styles/files.mjs` (`files.test.mjs` requires both together). `src/editor.css`: remove the import line T04 added.
- The 28 files of `theme/components/` that use utilities (266 uses): `Header.astro` 32, `CookieConsent.astro` 30, `BlogPosts.tsx` 27, `Footer.astro` 18, `BlogIndex.astro` 16, `PopupView.tsx` 16, `PostHeader.astro` 15, `MobileMenu.tsx` 13, `PostAuthor.astro` 12, `PostMeta.tsx` 10, `Logo.astro` 7, `PageHeader.astro` 7, `PageHeading.astro` 7, `PostCard.tsx` 7, `PostList.tsx` 6, `RelatedPosts.astro` 6, `LogoMark.astro` 5, `PopupButton.tsx` 5, `Section.astro` 5, `Container.astro` 4, `PageSection.astro` 4, `BlogPosts.astro` 3, `ShareRow.astro` 3, `EndBlock.astro` 2, `Markdown.astro` 2, `home/Text.astro` 2, `SectionHeading.tsx` 1, `TextSection.astro` 1, and the 6 utility strings of `theme/components/headerParts.ts`.
- The rules a cluster needs go in the part's own stylesheet (`components.css`, `blocks.css` or the part file that holds that part): `Header.astro` → the header's rules, `CookieConsent.astro` → its own, and so on.
- The page gutter: `Container.astro`'s `px-4` becomes one token that `--mo-comp-carousel-bleed` and `--mo-comp-chip-set-bleed` read (they are `1rem` because of `px-4` today; find their current names with `git grep -n 'bleed' -- theme/styles/tokens`).
- `medium:mo-type-*` in `BlogPosts.tsx`, `PageHeader.astro`, `PageSection.astro`, `SectionHeading.tsx` becomes an `@media (width >= 37.5rem)` rule in the part's CSS (the Tailwind-written spellings in `theme/styles/type.css` last rules go with them: remove the ones no markup uses).
- Do not rename `prose`/`not-prose` (T13).

## Files it touches

- `theme/components/**` (28 files), `theme/styles/{base,files.mjs,components,blocks}.css` and the part files the clusters belong to, `src/editor.css` (one line)

## Proof that the rendered result is identical

1. `compare-html --ignore-classes <before>` on the demo and the starter: structure identical.
2. `compare-styles <before> <after>` on the demo and the starter: every page, 375, 700, 900, 1300 px, light and dark, every section colour: **0 differences**. Paste the page count and the result.
3. `check:screens` in CI (the Blocks page spacing check measures the 4 dp grid), `check:themes`, `check:demo`, `check:starter`, `check:density`, `check:css-values`, `check:css-tokens`.
4. `check:tailwind`: uses in `theme/components` and `headerParts.ts` go to 0.

## Changeset

Empty (or `patch` if the PM asks).

## Checks

`npm run check`, `check:themes`, `check:demo`, `check:starter`; CI runs `check:screens`.

## Rules for every batch

- Start with the `developer` skill, read `CLAUDE.md`, load `checks`. A brainstorm is over for this work: the owner said Tailwind ships as 0.18.1 (18 Nov); this batch is built, as specified here and nothing else, **when the PM says**: no build session starts before the owner has released 0.18.0.
- **One pull request into `main`** (the 0.18.1 work goes into `main` after the owner releases 0.18.0), one logical change, the rendered result identical. Check in with the PM first (`ready: <branch>, <what changed>, local check green`) and push only on "your slot" (`developer` §3a). Never merge your own pull request. At most two Tailwind batches are in CI at once; the PM keeps the order (`2026-11-18-tailwind-batches.md`). Changeset level: **`patch` or empty, never `minor` or `major`** (the release is 0.18.1).
- **A merge into `main` is also flowed into `0.19`** (the 0.19 PM merges `main` into `0.19`, a merge commit, never a rebase, the same day) for every batch that touches `src/` or `theme/`; the batch says its freeze window.
- **Components line:** *existing; moved as they were; Material 3 pages not read, a pure migration changes no design.* A batch that adds layout helpers (T04) says: *none: layout helpers, not components.* No new component, no screen-specific variant (`developer` hard rule). A cluster of utilities that draws a surface or a control is not turned into a new component: it keeps its look in a named part rule, and the PR lists it under **Surfaces** for the PM (the owner decides later whether it becomes a theme component).
- Name the Modern Web Guidance guides you read in the PR text (`css-layout`, `css`, `responsive-design` for a batch that writes CSS). Logical properties (`inline-size`, `margin-inline`, `padding-block`) and `gap`, as the guide says; a physical property only where the old utility was physical on purpose.
- After T01 exists: lower `scripts/tailwind-allowlist.json` in the same PR by exactly the uses the batch removed, and say the numbers in the PR text.
- A token the batch adds follows `docs/css-tokens.md`: `--mo-ref-*`, `--mo-sys-*` or `--mo-comp-<component>-*`, a token one place reads is declared there, nothing unprefixed on `:root`.
- English only (replies, PR text, commits). Short report to the PM: link and head sha.
- **Do not touch `theme/styles/ui.css`, `base.css`, `blocks.css`, `components.css` or `global.css` while the CSS split is moving them** unless the batch says "after the split". The PM tells the batch session when the split has finished.
