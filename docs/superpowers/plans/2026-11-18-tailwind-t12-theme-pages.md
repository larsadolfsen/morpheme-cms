# Tailwind batch T12: `theme/layouts`, `theme/templates`, `defaults`, `site` and the editor preview (78 uses)

Spec for one build session and one pull request into `main`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: Tailwind ships as 0.18.2, with contract 7, patch changesets, into `main` after the owner releases 0.18.0.

| | |
| :-- | :-- |
| **When** | After the CSS split has finished, steps 1 to 5 of the cards-and-lists plan have merged, and T11 has merged. |
| **Must merge first** | the CSS split, cards and lists steps 1 to 5, T01, T04, T11 |
| **Others wait for it** | T16 |
| **Size** | medium |

## Goal

Replace the remaining utilities in the site's pages and the shared helpers.

## What to do

- `theme/templates/New.astro` 31, `Home.astro` 11, and `NotFound.astro` **2** (`mt-8 medium:mt-12` on its `Container`; the other 14 are the suggestion card's, step 4 of the cards-and-lists plan); `theme/layouts/Base.astro` 15, `PostLayout.astro` 11, `PageLayout.astro` 5; `defaults/popup.tsx` 2; `theme/editor/previews.tsx` 1; `site/sections.ts` 2 strings (`mt-10 medium:mt-14`, `mt-16 medium:mt-24`: a section's spacing; a token or a rule in `blocks.css`).
- `prose`, `not-prose`, the `max-w-[var(--mo-sys-block-text-measure-*)]` measure and the `[&>:not(.not-prose)]:…` selector variants in `PageLayout.astro` and `PostLayout.astro` become rules on a class the layout names (`.page-text`, `.post-text`) and keep `prose` as it is; the text measure tokens are unchanged.
- Rules go to the part's stylesheet.

## Files it touches

- `theme/templates/*`, `theme/layouts/*`, `defaults/popup.tsx`, `theme/editor/previews.tsx`, `site/sections.ts`, `theme/styles/{blocks,components}.css` or the part file

## Proof that the rendered result is identical

1. `compare-html --ignore-classes`: structure identical on the demo and the starter.
2. `compare-styles` on the demo and the starter (all pages, 4 widths, light and dark, every section colour): 0 differences.
3. `check:screens` in CI, `check:themes`, `check:demo`, `check:starter`.
4. `tailwind:inventory`: after this batch no utility is left in `theme/`, `defaults/`, `site/`, `pages/`, `starter/`, `demo/` (paste the output).

## Changeset

Empty (or `patch` if the PM asks).

## Checks

`npm run check`, `check:themes`, `check:demo`, `check:starter`.

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
