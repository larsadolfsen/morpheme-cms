# Tailwind batch T04: The layout vocabulary (`mo-row`, `mo-stack` …)

Spec for one build session and one pull request into `main`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: Tailwind ships as 0.18.2, with contract 7, patch changesets, into `main` after the owner releases 0.18.0.

| | |
| :-- | :-- |
| **When** | Starts when the PM says (after 0.18.0): new files only, plus one import line in `src/editor.css`. It does not import into `base.css` (T11 does that after the split). |
| **Must merge first** | none |
| **Others wait for it** | T05 to T09 (the editor slices use it), T11, T12 |
| **Size** | small |

## Goal

Add the small set of layout classes of plan §3.2, unused, so every later batch can use them.

## What to do

- New `theme/styles/layout.css`, in `@layer utilities`, importing its own token file (the rule of `docs/theme-token-files.md`: each stylesheet imports its tokens). Classes, each a few declarations with logical properties and tokens, no colour, shape, type or state:
  `mo-row` (+ `mo-row-wrap`, `mo-row-start`, `mo-row-end`, `mo-row-between`), `mo-stack`, `mo-grid` (+ `mo-grid-2`, `-3`, `-4`: columns set per breakpoint with the table's literals, through `--mo-comp-grid-columns`, which the card and block grids already set), `mo-fill` (`flex: 1 1 0; min-inline-size: 0`), `mo-keep` (`flex-shrink: 0`), `mo-truncate`, `mo-clamp-2`, `mo-center` (`margin-inline: auto`, measure from a token), `mo-cover`, `mo-visually-hidden`, `mo-hidden`, `mo-contents`.
- New `theme/styles/tokens/layout/` (follow `docs/theme-token-files.md`): `--mo-comp-row-gap`, `--mo-comp-stack-gap`, `--mo-comp-grid-gap` with defaults from `--mo-ref-space-*`, on `:root`; they are lengths, so `scripts/gen-token-registry.mjs` registers them. An element needing another gap sets the token on itself.
- `src/editor.css`: one line `@import '../theme/styles/layout.css';` until T11 imports it from `base.css` (T11 removes this line). Do not add the file to `theme/styles/files.mjs` or import it from `base.css`: `files.test.mjs` would fail and the split is moving `base.css`.
- New `theme/styles/layout.test.mjs`: every class sets exactly its declarations, only `inline`/`block`/logical properties and `--mo-*` tokens, no colour or `font-*`, every name starts `mo-`.
- New `docs/theme-layout-classes.md`: the reference (names, declarations, tokens, when to use a part rule instead).

## Files it touches

- New: `theme/styles/layout.css`, `theme/styles/tokens/layout/**`, `theme/styles/layout.test.mjs`, `docs/theme-layout-classes.md`
- `src/editor.css` (one import line), `theme/styles/tokens/layout/registry.css` (generated)
- Not: `ui.css`, `base.css`, `files.mjs`.

## Proof that the rendered result is identical

Nothing uses a `mo-row`/`mo-stack`/… class yet, so the rendered result is identical by construction:
1. `git grep -E 'mo-(row|stack|grid|fill|keep|truncate|clamp|center|cover|visually-hidden|hidden|contents)' -- '*.tsx' '*.astro' '*.ts'` is empty before and after (paste the output).
2. Built CSS of the demo and the editor before and after: the only difference is the new rules and tokens (list them).
3. `layout.test.mjs`.

## Changeset

Empty (or `patch` if the PM asks).

## Checks

`npm run check` (`check:css-tokens`, `check:density`, `check:web`, `check:css-values`, `check:colors`, the tests of `theme/styles/`). `check:screens` runs in CI only (`checks` skill).

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
