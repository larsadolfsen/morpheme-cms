# Tailwind batch T01: Proof tools, the progress meter and the ratchet check

Spec for one build session and one pull request into `main`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: Tailwind ships as 0.18.2, with contract 7, patch changesets, into `main` after the owner releases 0.18.0.

| | |
| :-- | :-- |
| **When** | Starts when the PM says (not before the owner releases 0.18.0). Touches no CSS, so it does not wait for the CSS split. |
| **Must merge first** | none |
| **Others wait for it** | every later batch (they claim "identical" with these tools) |
| **Size** | medium |

## Goal

Give the migration its instruments before anything is moved: a counter of what is left, a tool that proves a changed class name did not change the look, and a check that stops new Tailwind from coming in while the migration runs.

## What to do

- New `scripts/tailwind-inventory.mjs` and `scripts/tailwind-inventory.test.mjs`: scans `.tsx .astro .jsx .ts .mjs .js .md .css` in `theme/ src/ pages/ starter/ demo/ site/ lib/ defaults/ worker/ bin/` with Tailwind's own design system (`tailwindcss` is installed until T16), and prints what plan §1 prints: utility uses and distinct classes per folder, per file, per family and per variant; `theme()` uses; `@theme`, `@plugin`, `@source`, `@reference`, `@apply`; `--tw-` declarations; `prose` class attributes. `--json` and `--files` options. It must also find utilities in strings of `.ts` and `.mjs` (today: `site/sections.ts` 2 strings, `theme/components/headerParts.ts` 6) and in `class` attributes built by code.
- New `scripts/compare-styles.mjs`: opens two built sites (`<before>`, `<after>`), every page, at 375, 700, 900 and 1300 px, light and dark, on each section colour; freezes animations, `data-reveal`, `prefers-reduced-motion` and waits for fonts; for every element in document order compares `getComputedStyle` of about 60 properties (type, spacing, colour, border, display, position, size) and the bounding box; reports the first differing element, its selector path and the property, and exits 1. Structure must match (same tags in the same order); class attributes may differ.
- `scripts/compare-html.mjs`: option `--ignore-classes` (structure identical, the `class` attribute ignored). Everything else unchanged.
- New `scripts/screens/styles-snapshot.mjs`: for the **editor**, uses the exports of the `check:screens` harness to visit every screen unit at 375 and 1280, light and dark, density -1, 0 and 1, and writes one JSON snapshot of computed styles per unit; `compare-styles.mjs --snapshots <before> <after>` compares two folders of snapshots. It must not edit `scripts/editor-screens.mjs` (the CI session is splitting it into one file per area): if the harness lacks an export, ask the PM.
- New `scripts/check-tailwind.mjs`, `scripts/check-tailwind.test.mjs` and `scripts/tailwind-allowlist.json`: the **ratchet**. It counts per file the Tailwind utilities, `theme(--`, `@theme`, `@plugin`, `@source`, `@reference`, `@apply` and `--tw-`, and fails when a count is higher than listed or a file not listed has any; the message says how to lower a count. It runs in `npm run check` as `check:tailwind`. The initial allowlist is generated from the tree at the batch's base (plan §1 numbers: 2,559 uses, 72 `theme()`, 44 `--tw-prose`, 129 Tailwind names are `check:css-tokens`'s and are not counted here).
- `package.json`: the scripts `check:tailwind`, `tailwind:inventory`, `compare:styles`; `check` runs `check:tailwind`.
- `.claude/skills/checks/SKILL.md`: one row for `check:tailwind` and a paragraph on `compare-styles`.

## Files it touches

- `scripts/tailwind-inventory.mjs`, `scripts/tailwind-inventory.test.mjs`, `scripts/compare-styles.mjs`, `scripts/compare-html.mjs`, `scripts/screens/styles-snapshot.mjs`, `scripts/check-tailwind.mjs`, `scripts/check-tailwind.test.mjs`, `scripts/tailwind-allowlist.json`
- `package.json` (scripts only), `.claude/skills/checks/SKILL.md`

## Proof that the rendered result is identical

The tools prove themselves, in the PR text:
1. `tailwind:inventory` on the batch's base prints the numbers of plan §1 (2,559 uses, 566 classes, 72 `theme()` in 28 files, 44 `--tw-prose` lines); say any difference and why.
2. `compare-styles` of one build against itself: 0 differences. Of a build against a copy with one `padding` changed by 1 px in one rule: it reports exactly that element and property.
3. The editor snapshots of one build compared with a second run of the same build: 0 differences.
4. `check:tailwind` passes on the tree, fails when a test fixture adds one utility, and the message names the file and how to lower.

## Changeset

Empty (`---` / `---`): nothing a site sees.

## Checks

`npm run check` (it now includes `check:tailwind`), `node --test scripts/tailwind-inventory.test.mjs scripts/check-tailwind.test.mjs`.

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
