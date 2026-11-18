# Tailwind batch T02: The migration guide for theme and app authors

Spec for one build session and one pull request into `0.18`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: "Remove Tailwind", on the 0.18 line, inside contract 6.

| | |
| :-- | :-- |
| **When** | Can start now, in any free slot. Docs only: CI skips the heavy jobs. |
| **Must merge first** | none (the names of T04 are fixed in plan §3.2; if T04 changes one, T04 updates this guide) |
| **Others wait for it** | nothing |
| **Size** | small |

## Goal

Write the table authors will use, before the break, so `morpheme-apps` (`venus`, the apps) can start migrating in parallel.

## What to do

- New `docs/tailwind-migration.md`: why (one dependency less, one naming system), what stops working (a utility class, `medium:`-style variants, `theme()`, `@theme`, `@apply`, `@source`, `--tw-*`, the typography plugin's classes other than `prose` and `not-prose`), what to write instead, by family (plan §3.3), the vocabulary (`mo-row`, `mo-stack`, `mo-grid`, `mo-fill`, `mo-keep`, `mo-truncate`, `mo-clamp-2`, `mo-center`, `mo-cover`, `mo-visually-hidden`, `mo-hidden`, `mo-contents` and their modifiers; plan §3.2), the breakpoint table (`37.5rem` medium, `52.5rem` expanded, `75rem` large, `100rem` extra large, written as `@media (width >= 37.5rem)`; dp, rem and the Material 3 window class), the state variants as CSS (`:hover`, `:focus-visible`, `:has()`, `[data-open]`), and how to check (`check:themes`, `check:tailwind` in this repository, the same counts in an app repository with `tailwind:inventory`).
- New `docs/tailwind-migration-classes.md`: Appendix A of the plan, every class with its CSS and its replacement (the 578 rows), as a table to search.
- `docs/app-contract.md`, section *Contract 6*: one paragraph: contract 6 also ends Tailwind (no utility, `theme()` or `@theme` in a theme or an app), no second bump.

## Files it touches

- `docs/tailwind-migration.md`, `docs/tailwind-migration-classes.md`, `docs/app-contract.md`

## Proof that the rendered result is identical

Docs only: no proof of a rendered result. Each family rule is checked against the real mapping: five classes per family, written in the guide, are taken at random and shown to give the same declarations as Tailwind (the inventory's `--css` option, or the plan's Appendix A).

## Changeset

Empty.

## Checks

`npm run check` (Prettier, `check:language`: no Danish text, the word *image*).

## Rules for every batch

- Start with the `developer` skill, read `CLAUDE.md`, load `checks`. A brainstorm is over for this work: the owner said "Remove Tailwind" (18 Nov); this batch is built, as specified here and nothing else.
- **One pull request into `0.18`**, one logical change, the rendered result identical. Check in with the PM first (`ready: <branch>, <what changed>, local check green`) and push only on "your slot" (`developer` §3a). Never merge your own pull request. At most two Tailwind batches are in CI at once; the PM keeps the order (`2026-11-18-tailwind-batches.md`).
- **Components line:** *existing; moved as they were; Material 3 pages not read, a pure migration changes no design.* A batch that adds layout helpers (T04) says: *none: layout helpers, not components.* No new component, no screen-specific variant (`developer` hard rule). A cluster of utilities that draws a surface or a control is not turned into a new component: it keeps its look in a named part rule, and the PR lists it under **Surfaces** for the PM (the owner decides later whether it becomes a theme component).
- Name the Modern Web Guidance guides you read in the PR text (`css-layout`, `css`, `responsive-design` for a batch that writes CSS). Logical properties (`inline-size`, `margin-inline`, `padding-block`) and `gap`, as the guide says; a physical property only where the old utility was physical on purpose.
- After T01 exists: lower `scripts/tailwind-allowlist.json` in the same PR by exactly the uses the batch removed, and say the numbers in the PR text.
- A token the batch adds follows `docs/css-tokens.md`: `--mo-ref-*`, `--mo-sys-*` or `--mo-comp-<component>-*`, a token one place reads is declared there, nothing unprefixed on `:root`.
- English only (replies, PR text, commits). Short report to the PM: link and head sha.
- **Do not touch `theme/styles/ui.css`, `base.css`, `blocks.css`, `components.css` or `global.css` while the CSS split is moving them** unless the batch says "after the split". The PM tells the batch session when the split has finished.
