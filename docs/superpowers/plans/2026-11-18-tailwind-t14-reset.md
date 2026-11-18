# Tailwind batch T14: Our own reset (Tailwind's preflight)

Spec for one build session and one pull request into `main`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: Tailwind ships as 0.18.2, with contract 7, patch changesets, into `main` after the owner releases 0.18.0.

| | |
| :-- | :-- |
| **When** | After the CSS split has finished (it adds a file to `base.css`) and steps 1 to 5 of the cards-and-lists plan have merged. |
| **Must merge first** | the CSS split, cards and lists steps 1 to 5, T01 |
| **Others wait for it** | T16 |
| **Size** | medium |

## Goal

Write the reset that Tailwind's preflight gives us today, and prove the site does not need Tailwind's.

## What to do

- New `theme/styles/reset.css`, imported from `base.css` in `@layer base`, with the 35 rule blocks of Tailwind's `preflight.css` (4.3.5; the file is in `node_modules/tailwindcss/preflight.css`): `box-sizing` and `margin`/`padding`/`border` reset on `*`, `html` text-size and font, `hr`, `abbr`, headings, `a`, `b, strong`, `code, kbd, samp, pre`, `small`, `sub, sup`, `table`, `:-moz-focusring`, `progress`, `summary`, lists, `img, svg, video, canvas, audio, iframe, embed, object` (`display: block`) and `img, video` (`max-width: 100%; height: auto`), form controls and `::file-selector-button`, `[hidden]`. Values as they are; only the selector layout changes where nothing depends on it.
- A proof build that **does not load Tailwind's preflight**: `@import 'tailwindcss/theme.css' layer(theme); @import 'tailwindcss/utilities.css' layer(utilities);` in place of `@import 'tailwindcss'`, in a scratch copy, not committed.

## Files it touches

- New `theme/styles/reset.css`; `theme/styles/base.css` (one import), the tests that list `base.css`'s imports (`files.test.mjs` if `files.mjs` needs the file)

## Proof that the rendered result is identical

1. `compare-styles`: (a) the committed tree before vs after (reset added next to Tailwind's, duplicates are harmless): 0 differences; (b) the proof build without Tailwind's preflight vs the committed tree: **0 differences** on the demo and the starter, every page, 4 widths, light and dark. Any difference is a missing rule: fix the reset, not the test.
2. The editor: `styles-snapshot` of all units against a proof build without preflight: 0 differences.
3. `check:screens` in CI.

## Changeset

Empty (or `patch` if the PM asks).

## Checks

`npm run check`, `check:screens` (CI).

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
