# Tailwind batch T10: `theme()` to literal widths

Spec for one build session and one pull request into `main`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: Tailwind ships as 0.18.2, with contract 7, patch changesets, into `main` after the owner releases 0.18.0.

| | |
| :-- | :-- |
| **When** | After the CSS split has finished (it edits `ui.css`, `base.css`, `blocks.css`, `components.css`, `global.css` and the part files) and after steps 1 to 5 of the cards-and-lists plan have merged (they rewrite the card and list CSS without `theme()`). The part for finished files could start earlier if the PM allows. |
| **Must merge first** | the CSS split, cards and lists steps 1 to 5, T03 (the check accepts the literals) |
| **Others wait for it** | T11, T12 |
| **Size** | medium |

## Goal

Replace the 72 `theme(--…)` calls with the values they already compile to.

## What to do

- A one-off script (not committed) replaces `theme(--breakpoint-medium)` with `37.5rem`, `-expanded` with `52.5rem`, `-large` with `75rem` (63, 4, 4 uses) and `theme(--container-3xl)` (1 use, `src/editor.css`) with `48rem`, in the files that hold one when the batch starts (`git grep -l 'theme(--' -- theme src`: 28 files on 18 Nov, **minus the card and list files** that steps 1 to 5 rewrite: `cards.css` 6, `lists.css` 2, the `tokens/*/comp/card.css` and `comp/list.css` files, the cards' and lists' token files and the card and list rules of `blocks.css` and `global.css`; the script skips them, and the batch reports any that still hold a `theme()` after step 5). Re-run it after a conflict; do not merge by hand.
- The two off-table literals of `src/editor.css` (`73.5rem`, `599.98px`): `599.98px` becomes `(width < 37.5rem)`; `73.5rem` is the column's own width plus the button (a layout value, not a window class): give it a reason in the allowlist of `site/breakpoints.mjs` or a token.
- `@reference '../theme/styles/base.css'` in `src/editor.css` stays (T16 removes it).

## Files it touches

- `src/editor.css` and the 27 files of `theme/styles/` with a `theme()` (14 token files under `tokens/`, `cards.css`, `components.css`, `global.css`, `blocks.css`, `bottom-sheet.css`, `lists.css`, `lightbox.css`, `snackbar.css`, `menus.css`, `base.css`, `ui.css` and the part files that replace it: `git grep -l 'theme(--' -- theme src` gives the list at the time)

## Proof that the rendered result is identical

Tailwind already compiled every `theme()` to its literal, so the built CSS must be **identical**:
1. Build the demo and the starter before and after; diff the built stylesheets (`dist/_astro/*.css`) after whitespace normalising: 0 differences. Paste the command and the result.
2. `git grep -n 'theme(--' -- theme src` is empty after.
3. `check:tailwind`: the `theme()` count goes from 72 to 0.

## Changeset

Empty (or `patch` if the PM asks).

## Checks

`npm run check`, `check:themes` (`node ../../../bin/morpheme.mjs check:themes` in `.morpheme/demo/site/`).

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
