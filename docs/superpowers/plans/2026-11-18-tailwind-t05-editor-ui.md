# Tailwind batch T05: Editor, part 1: `src/ui.tsx`

Spec for one build session and one pull request into `main`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: Tailwind ships as 0.18.2, with contract 7, patch changesets, into `main` after the owner releases 0.18.0.

| | |
| :-- | :-- |
| **When** | Can start once T01 and T04 are merged. Touches only `src/`, so it does not wait for the CSS split. |
| **Must merge first** | T01, T04 |
| **Others wait for it** | T16 |
| **Size** | large |

## Goal

Replace the 617 utility uses of 1 editor file(s) with the vocabulary of T04 or a named rule in the area's own CSS file, with the same look.

## What to do

- The files (uses): `src/ui.tsx` (617).
- A new `src/editor-ui.css` for the rules this slice needs, imported by one line at the end of the import block of `src/editor.css` (alphabetical; this line is the only shared edit, resolve a conflict there by keeping both). Logical properties, `gap`, `--mo-ref-space-*`, `--mo-sys-color-*`, `--mo-sys-shape-*`, `--mo-sys-typescale-*`; no fixed colour (`check:editor-colors`).
- Each utility becomes: a vocabulary class (`mo-row`, `mo-stack`, `mo-fill`, `mo-keep` …); a rule named after what the element is, in the area's CSS file; or a state selector (`hover:`/`focus-visible:`/`group-*:`/`has-*:`/`data-*:`/`aria-*:` become `:hover`, `:focus-visible`, `:has()`, `[data-…]`); `medium:`, `expanded:`, `large:`, `min-[600px]:` become `@media (width >= 37.5rem|52.5rem|75rem)` (T03's check accepts these); arbitrary `[--mo-comp-…:…]` become the property on the part's rule; `text-<role>`/`font-*` become the `mo-type-*` class or the part's `font` from `--mo-sys-typescale-*`; colours become `var(--mo-sys-color-*)`.
- **Surfaces and controls:** where a cluster draws a background with a radius or a border, or is a pointer target, keep its look in a named part rule, do not invent a component, and list each under **Surfaces** in the PR (file, line, what it is, the closest theme component). About 24 static class attributes in the editor do this today; the PM asks the owner.
- Dynamic class strings (`className={…}` built from state, 361 in `src/`): keep the logic, change only the class names.
- **Flow into 0.19, the same day:** when this PR is merged into `main`, the 0.19 PM merges `main` into `0.19` (a merge commit, never a rebase), resolves conflicts in the files above and the import block of `src/editor.css`, runs `npm run check` on `0.19` and pushes on its own slot. **Freeze window:** from this batch's `ready:` until that merge, no PR into `0.19` or `main` touches the files listed above; the PM announces it, and a PR that must touch one waits or is rebased onto the merged slice by merging `main` into it.


## Files it touches

- `src/ui.tsx`
- Not: anything in `theme/`, other `src/` files, `scripts/editor-screens.mjs`.

## Proof that the rendered result is identical

1. `check:screens` (every shard, in CI): green.
2. `scripts/screens/styles-snapshot.mjs` before and after, every screen unit that shows these files, 375 and 1280, light and dark, density -1, 0, 1: `compare-styles --snapshots` reports 0 differences (paste the unit list and the result). Where a unit never shows a file (a dialog behind a condition), say how it was opened.
3. `check:tailwind`: the allowlist is lowered by exactly the removed uses (paste the numbers).

## Changeset

Empty (or `patch` if the PM asks).

## Checks

`npm run check` (`check:editor-colors`, `check:density`, `check:web`, `check:css-values`, `check:css-tokens`, `check:tailwind`); the PM runs `check:screens` in CI.

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
