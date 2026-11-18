# Tailwind batch T04: The layout vocabulary (`mo-row`, `mo-stack` …)

Spec for one build session and one pull request into `0.18`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: "Remove Tailwind", on the 0.18 line, inside contract 6.

| | |
| :-- | :-- |
| **When** | Can start now: new files only, plus one import line in `src/editor.css`. It does not import into `base.css` (T11 does that after the split). |
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

Empty.

## Checks

`npm run check` (`check:css-tokens`, `check:density`, `check:web`, `check:css-values`, `check:colors`, the tests of `theme/styles/`). `check:screens` runs in CI only (`checks` skill).

## Rules for every batch

- Start with the `developer` skill, read `CLAUDE.md`, load `checks`. A brainstorm is over for this work: the owner said "Remove Tailwind" (18 Nov); this batch is built, as specified here and nothing else.
- **One pull request into `0.18`**, one logical change, the rendered result identical. Check in with the PM first (`ready: <branch>, <what changed>, local check green`) and push only on "your slot" (`developer` §3a). Never merge your own pull request. At most two Tailwind batches are in CI at once; the PM keeps the order (`2026-11-18-tailwind-batches.md`).
- **Components line:** *existing; moved as they were; Material 3 pages not read, a pure migration changes no design.* A batch that adds layout helpers (T04) says: *none: layout helpers, not components.* No new component, no screen-specific variant (`developer` hard rule). A cluster of utilities that draws a surface or a control is not turned into a new component: it keeps its look in a named part rule, and the PR lists it under **Surfaces** for the PM (the owner decides later whether it becomes a theme component).
- Name the Modern Web Guidance guides you read in the PR text (`css-layout`, `css`, `responsive-design` for a batch that writes CSS). Logical properties (`inline-size`, `margin-inline`, `padding-block`) and `gap`, as the guide says; a physical property only where the old utility was physical on purpose.
- After T01 exists: lower `scripts/tailwind-allowlist.json` in the same PR by exactly the uses the batch removed, and say the numbers in the PR text.
- A token the batch adds follows `docs/css-tokens.md`: `--mo-ref-*`, `--mo-sys-*` or `--mo-comp-<component>-*`, a token one place reads is declared there, nothing unprefixed on `:root`.
- English only (replies, PR text, commits). Short report to the PM: link and head sha.
- **Do not touch `theme/styles/ui.css`, `base.css`, `blocks.css`, `components.css` or `global.css` while the CSS split is moving them** unless the batch says "after the split". The PM tells the batch session when the split has finished.
