# Tailwind batch T02: The migration guide for theme and app authors

Spec for one build session and one pull request into `main`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: Tailwind ships as 0.18.2, with contract 7, patch changesets, into `main` after the owner releases 0.18.0.

| | |
| :-- | :-- |
| **When** | Starts when the PM says, in any free slot. Docs only: CI skips the heavy jobs. |
| **Must merge first** | none (the names of T04 are fixed in plan §3.2; if T04 changes one, T04 updates this guide) |
| **Others wait for it** | nothing |
| **Size** | small |

## Goal

Write the table authors will use, before the break, so `morpheme-apps` (`venus`, the apps) can start migrating in parallel (it ships with the break, in 0.18.2).

## What to do

- New `docs/tailwind-migration.md`: why (one dependency less, one naming system), what stops working (a utility class, `medium:`-style variants, `theme()`, `@theme`, `@apply`, `@source`, `--tw-*`, the typography plugin's classes other than `prose` and `not-prose`), what to write instead, by family (plan §3.3), the vocabulary (`mo-row`, `mo-stack`, `mo-grid`, `mo-fill`, `mo-keep`, `mo-truncate`, `mo-clamp-2`, `mo-center`, `mo-cover`, `mo-visually-hidden`, `mo-hidden`, `mo-contents` and their modifiers; plan §3.2), the breakpoint table (`37.5rem` medium, `52.5rem` expanded, `75rem` large, `100rem` extra large, written as `@media (width >= 37.5rem)`; dp, rem and the Material 3 window class), the state variants as CSS (`:hover`, `:focus-visible`, `:has()`, `[data-open]`), and how to check (`check:themes`, `check:tailwind` in this repository, the same counts in an app repository with `tailwind:inventory`).
- New `docs/tailwind-migration-classes.md`: Appendix A of the plan, every class with its CSS and its replacement (the 578 rows), as a table to search.
- `docs/app-contract.md`: a section *Contract 7* (written now as the announcement, effective when T16 merges): no utility, `theme()` or `@theme` in a theme or an app written to 7; contract 7 replaces 6 in `APP_APIS`; the migration is `docs/tailwind-migration.md`.

## Files it touches

- `docs/tailwind-migration.md`, `docs/tailwind-migration-classes.md`, `docs/app-contract.md`

## Proof that the rendered result is identical

Docs only: no proof of a rendered result. Each family rule is checked against the real mapping: five classes per family, written in the guide, are taken at random and shown to give the same declarations as Tailwind (the inventory's `--css` option, or the plan's Appendix A).

## Changeset

Empty (or `patch` if the PM asks).

## Checks

`npm run check` (Prettier, `check:language`: no Danish text, the word *image*).

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
