# Tailwind batch T15: The last Tailwind-named reads, repointed

Spec for one build session and one pull request into `main`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: Tailwind ships as 0.18.2, with contract 7, patch changesets, into `main` after the owner releases 0.18.0.

| | |
| :-- | :-- |
| **When** | After the CSS split has finished, steps 1 to 5 of the cards-and-lists plan have merged, and T05 (`src/ui.tsx`) has merged. |
| **Must merge first** | the CSS split, cards and lists steps 1 to 5, T01, T05 |
| **Others wait for it** | T16 |
| **Size** | small |

## Goal

Point every read of a Tailwind-named property at the `--mo-` name it aliases, so T16 only deletes dead lines.

## What to do

- `var(--font-sans)` (17 reads) → a `--mo-ref-…` font family token (the Tokens session's name; if none exists, add `--mo-ref-typeface-plain` or the rename table's pattern, and say so); declared once in `tokens/base/ref.css` (it is today's `@theme inline` value) and in `tokens/material/ref.css` for Material's value.
- `var(--radius-panel)` (6 reads, `src/editor.css` and others) → the `--mo-sys-…` name it aliases (`--radius`'s successor); `var(--color-…)` (4 reads: `src/ui.tsx`, three lines) → `var(--mo-sys-color-…)`; the 17 `text-<role>` utility uses that still exist (none after T05–T09; verify) → `mo-type-<role>`.
- Record every rename in `scripts/renamed-tokens.json` (`check:token-names`).
- `--breakpoint-*`: no reader is left after T03 and T10: say so (paste `git grep`).

## Files it touches

- `theme/styles/tokens/base/ref.css`, `tokens/material/ref.css`, `theme/styles/base.css`, `src/editor.css`, `src/ui.tsx`, `scripts/renamed-tokens.json`

## Proof that the rendered result is identical

1. After this batch `git grep -n -E 'var\(--(color-|text-|radius-panel|font-sans|breakpoint-|shadow-soft|ease-soft)' -- theme src lib pages defaults` is empty (paste it).
2. The computed value of every custom property on every element of the demo, light and dark, before and after: identical (the Tokens session's proof, in `docs/theme-token-files.md`).
3. `compare-styles` demo and starter: 0 differences; `check:token-names`, `check:css-tokens`.

## Changeset

Empty (or `patch` if the PM asks).

## Checks

`npm run check`.

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
