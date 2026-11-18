# Tailwind batch T03: The breakpoint table as plain tokens, and the width check

Spec for one build session and one pull request into `main`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: Tailwind ships as 0.18.2, with contract 7, patch changesets, into `main` after the owner releases 0.18.0.

| | |
| :-- | :-- |
| **When** | Starts when the PM says (after 0.18.0). Touches `theme/styles/tokens/base/ref.css`, not `ui.css` or `base.css`. |
| **Must merge first** | none |
| **Others wait for it** | T10 (`theme()` to literals needs the check to accept literals) |
| **Size** | small |

## Goal

Give the four breakpoints a home that is not Tailwind's, and make the width check accept the literals that equal the table.

## What to do

- `theme/styles/tokens/base/ref.css`: next to the `@theme static` block, four plain declarations `--mo-ref-breakpoint-medium: 37.5rem`, `-expanded: 52.5rem`, `-large: 75rem`, `-extra-large: 100rem` on `:root` (same values; not registered with `@property`, because a registered length is in `px`). Check the name against the rename table's pattern (`plans/2026-11-16-token-rename-table.md`); if the table has a better Material 3 name, use it and say so. `@theme static` stays until T16.
- `src/previewBreakpoints.ts` reads the new names; `lib/breakpoints.mjs` comment; `lib/breakpoints.test.mjs` asserts that the table, the four new tokens and the four `--breakpoint-*` are equal.
- `site/breakpoints.mjs` and its test: rule 1 is inverted. A width in `@media` or `@container` passes when it is one of `37.5rem`, `52.5rem`, `75rem`, `100rem` (also as `600px`, `840px`, `1200px`, `1600px`), in `>=`, `<`, `min-width` or `max-width` form; any other width fails with the message *use one of the table's four widths (docs/tailwind-migration.md)*. Named container queries (`@container name (…)`) are component sizes and stay free. An allowlist with a reason, in the module, for the three that exist today: `src/editor.css` `73.5rem` and `599.98px`, and `src/PreviewScreen.tsx` `min-[600px]` (it goes in T06).
- `scripts/css-tokens-allowlist.json` only if the new names need an entry.

## Files it touches

- `theme/styles/tokens/base/ref.css`, `src/previewBreakpoints.ts`, `lib/breakpoints.mjs`, `lib/breakpoints.test.mjs`, `site/breakpoints.mjs` (+ test)
- Not: `ui.css`, `base.css`.

## Proof that the rendered result is identical

1. The tests: table = four tokens = four `@theme` values.
2. Built CSS of the demo before and after: the only difference is the four added declarations (list them).
3. The Preview's widths: the `check:screens` Preview unit is green in CI (it reads the new names).
4. `check:css-tokens` and `check:token-names` green (the new names follow the rule).

## Changeset

Empty (or `patch` if the PM asks).

## Checks

`npm run check`, `node --test lib/breakpoints.test.mjs site/breakpoints.test.mjs`.

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
