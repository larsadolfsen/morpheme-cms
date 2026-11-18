# Tailwind batch T14: Our own reset (Tailwind's preflight)

Spec for one build session and one pull request into `0.18`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: "Remove Tailwind", on the 0.18 line, inside contract 6.

| | |
| :-- | :-- |
| **When** | After the CSS split has finished (it adds a file to `base.css`). |
| **Must merge first** | the CSS split, T01 |
| **Others wait for it** | T16 |
| **Size** | medium |

## Goal

Write the reset that Tailwind's preflight gives us today, and prove the site does not need Tailwind's.

## What to do

- New `theme/styles/reset.css`, imported from `base.css` in `@layer base`, with the 35 rule blocks of Tailwind's `preflight.css` (4.3.5; the file is in `node_modules/tailwindcss/preflight.css`): `box-sizing` and `margin`/`padding`/`border` reset on `*`, `html` text-size and font, `hr`, `abbr`, headings, `a`, `b, strong`, `code, kbd, samp, pre`, `small`, `sub, sup`, `table`, `:-moz-focusring`, `progress`, `summary`, lists, `img, svg, video, canvas, audio, iframe, embed, object` (`display: block`) and `img, video` (`max-width: 100%; height: auto`), form controls and `::file-selector-button`, `[hidden]`. Values as they are; only the selector layout changes where nothing depends on it.
- A proof build that **does not load Tailwind's preflight**: `@import 'tailwindcss/theme.css' layer(theme); @import 'tailwindcss/utilities.css' layer(utilities);` in place of `@import 'tailwindcss'`, in a scratch copy, not committed.

## Files it touches

- New `theme/styles/reset.css`; `theme/styles/base.css` (one import), the tests that list `base.css`'s imports (`files.test.mjs` if `files.mjs` needs the file)

## Proof that the rendered result is identical

1. `compare-styles`: (a) the committed tree before vs after (reset added next to Tailwind's, duplicates are harmless): 0 differences; (b) the proof build without Tailwind's preflight vs the committed tree: **0 differences** on the demo and the starter, every page, 4 widths, light and dark. Any difference is a missing rule: fix the reset, not the test.
2. The editor: `styles-snapshot` of all units against a proof build without preflight: 0 differences.
3. `check:screens` in CI.

## Changeset

Empty.

## Checks

`npm run check`, `check:screens` (CI).

## Rules for every batch

- Start with the `developer` skill, read `CLAUDE.md`, load `checks`. A brainstorm is over for this work: the owner said "Remove Tailwind" (18 Nov); this batch is built, as specified here and nothing else.
- **One pull request into `0.18`**, one logical change, the rendered result identical. Check in with the PM first (`ready: <branch>, <what changed>, local check green`) and push only on "your slot" (`developer` §3a). Never merge your own pull request. At most two Tailwind batches are in CI at once; the PM keeps the order (`2026-11-18-tailwind-batches.md`).
- **Components line:** *existing; moved as they were; Material 3 pages not read, a pure migration changes no design.* A batch that adds layout helpers (T04) says: *none: layout helpers, not components.* No new component, no screen-specific variant (`developer` hard rule). A cluster of utilities that draws a surface or a control is not turned into a new component: it keeps its look in a named part rule, and the PR lists it under **Surfaces** for the PM (the owner decides later whether it becomes a theme component).
- Name the Modern Web Guidance guides you read in the PR text (`css-layout`, `css`, `responsive-design` for a batch that writes CSS). Logical properties (`inline-size`, `margin-inline`, `padding-block`) and `gap`, as the guide says; a physical property only where the old utility was physical on purpose.
- After T01 exists: lower `scripts/tailwind-allowlist.json` in the same PR by exactly the uses the batch removed, and say the numbers in the PR text.
- A token the batch adds follows `docs/css-tokens.md`: `--mo-ref-*`, `--mo-sys-*` or `--mo-comp-<component>-*`, a token one place reads is declared there, nothing unprefixed on `:root`.
- English only (replies, PR text, commits). Short report to the PM: link and head sha.
- **Do not touch `theme/styles/ui.css`, `base.css`, `blocks.css`, `components.css` or `global.css` while the CSS split is moving them** unless the batch says "after the split". The PM tells the batch session when the split has finished.
