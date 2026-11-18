# Tailwind batch T05: Editor, part 1: `src/ui.tsx`

Spec for one build session and one pull request into `0.18`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: "Remove Tailwind", on the 0.18 line, inside contract 6.

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


## Files it touches

- `src/ui.tsx`
- Not: anything in `theme/`, other `src/` files, `scripts/editor-screens.mjs`.

## Proof that the rendered result is identical

1. `check:screens` (every shard, in CI): green.
2. `scripts/screens/styles-snapshot.mjs` before and after, every screen unit that shows these files, 375 and 1280, light and dark, density -1, 0, 1: `compare-styles --snapshots` reports 0 differences (paste the unit list and the result). Where a unit never shows a file (a dialog behind a condition), say how it was opened.
3. `check:tailwind`: the allowlist is lowered by exactly the removed uses (paste the numbers).

## Changeset

Empty.

## Checks

`npm run check` (`check:editor-colors`, `check:density`, `check:web`, `check:css-values`, `check:css-tokens`, `check:tailwind`); the PM runs `check:screens` in CI.

## Rules for every batch

- Start with the `developer` skill, read `CLAUDE.md`, load `checks`. A brainstorm is over for this work: the owner said "Remove Tailwind" (18 Nov); this batch is built, as specified here and nothing else.
- **One pull request into `0.18`**, one logical change, the rendered result identical. Check in with the PM first (`ready: <branch>, <what changed>, local check green`) and push only on "your slot" (`developer` §3a). Never merge your own pull request. At most two Tailwind batches are in CI at once; the PM keeps the order (`2026-11-18-tailwind-batches.md`).
- **Components line:** *existing; moved as they were; Material 3 pages not read, a pure migration changes no design.* A batch that adds layout helpers (T04) says: *none: layout helpers, not components.* No new component, no screen-specific variant (`developer` hard rule). A cluster of utilities that draws a surface or a control is not turned into a new component: it keeps its look in a named part rule, and the PR lists it under **Surfaces** for the PM (the owner decides later whether it becomes a theme component).
- Name the Modern Web Guidance guides you read in the PR text (`css-layout`, `css`, `responsive-design` for a batch that writes CSS). Logical properties (`inline-size`, `margin-inline`, `padding-block`) and `gap`, as the guide says; a physical property only where the old utility was physical on purpose.
- After T01 exists: lower `scripts/tailwind-allowlist.json` in the same PR by exactly the uses the batch removed, and say the numbers in the PR text.
- A token the batch adds follows `docs/css-tokens.md`: `--mo-ref-*`, `--mo-sys-*` or `--mo-comp-<component>-*`, a token one place reads is declared there, nothing unprefixed on `:root`.
- English only (replies, PR text, commits). Short report to the PM: link and head sha.
- **Do not touch `theme/styles/ui.css`, `base.css`, `blocks.css`, `components.css` or `global.css` while the CSS split is moving them** unless the batch says "after the split". The PM tells the batch session when the split has finished.
