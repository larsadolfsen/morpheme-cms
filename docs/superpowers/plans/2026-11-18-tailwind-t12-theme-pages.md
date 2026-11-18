# Tailwind batch T12: `theme/layouts`, `theme/templates`, `defaults`, `site` and the editor preview (92 uses)

Spec for one build session and one pull request into `0.18`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: "Remove Tailwind", on the 0.18 line, inside contract 6.

| | |
| :-- | :-- |
| **When** | After the CSS split has finished and T11 has merged. |
| **Must merge first** | the CSS split, T01, T04, T11 |
| **Others wait for it** | T16 |
| **Size** | medium |

## Goal

Replace the remaining utilities in the site's pages and the shared helpers.

## What to do

- `theme/templates/New.astro` 31, `NotFound.astro` 16, `Home.astro` 11; `theme/layouts/Base.astro` 15, `PostLayout.astro` 11, `PageLayout.astro` 5; `defaults/popup.tsx` 2; `theme/editor/previews.tsx` 1; `site/sections.ts` 2 strings (`mt-10 medium:mt-14`, `mt-16 medium:mt-24`: a section's spacing; a token or a rule in `blocks.css`).
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

Empty.

## Checks

`npm run check`, `check:themes`, `check:demo`, `check:starter`.

## Rules for every batch

- Start with the `developer` skill, read `CLAUDE.md`, load `checks`. A brainstorm is over for this work: the owner said "Remove Tailwind" (18 Nov); this batch is built, as specified here and nothing else.
- **One pull request into `0.18`**, one logical change, the rendered result identical. Check in with the PM first (`ready: <branch>, <what changed>, local check green`) and push only on "your slot" (`developer` §3a). Never merge your own pull request. At most two Tailwind batches are in CI at once; the PM keeps the order (`2026-11-18-tailwind-batches.md`).
- **Components line:** *existing; moved as they were; Material 3 pages not read, a pure migration changes no design.* A batch that adds layout helpers (T04) says: *none: layout helpers, not components.* No new component, no screen-specific variant (`developer` hard rule). A cluster of utilities that draws a surface or a control is not turned into a new component: it keeps its look in a named part rule, and the PR lists it under **Surfaces** for the PM (the owner decides later whether it becomes a theme component).
- Name the Modern Web Guidance guides you read in the PR text (`css-layout`, `css`, `responsive-design` for a batch that writes CSS). Logical properties (`inline-size`, `margin-inline`, `padding-block`) and `gap`, as the guide says; a physical property only where the old utility was physical on purpose.
- After T01 exists: lower `scripts/tailwind-allowlist.json` in the same PR by exactly the uses the batch removed, and say the numbers in the PR text.
- A token the batch adds follows `docs/css-tokens.md`: `--mo-ref-*`, `--mo-sys-*` or `--mo-comp-<component>-*`, a token one place reads is declared there, nothing unprefixed on `:root`.
- English only (replies, PR text, commits). Short report to the PM: link and head sha.
- **Do not touch `theme/styles/ui.css`, `base.css`, `blocks.css`, `components.css` or `global.css` while the CSS split is moving them** unless the batch says "after the split". The PM tells the batch session when the split has finished.
