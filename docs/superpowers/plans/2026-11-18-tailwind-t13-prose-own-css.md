# Tailwind batch T13: `prose` in our own CSS

Spec for one build session and one pull request into `0.18`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: "Remove Tailwind", on the 0.18 line, inside contract 6.

| | |
| :-- | :-- |
| **When** | After the CSS split has finished (it edits `base.css`, `blocks.css`, `global.css`). |
| **Must merge first** | the CSS split, T01 |
| **Others wait for it** | T14, T16 |
| **Size** | medium |

## Goal

Write the rules the typography plugin gives `.prose` as our own CSS, with the same values, and stop loading the plugin.

## What to do

- New `theme/styles/prose.css`, imported from `base.css`, with the 87 rules of the plugin that we depend on, grouped as plan §1.6 lists them (root, `p` and `lead`, links and `strong`, lists with `type=` variants, `hr`, `blockquote` with its quote marks, `h1`-`h4` and the `+ *` margins, media and `figure`, `kbd`/`code`/`pre`, tables, `dl`, `:first-child`/`:last-child`). Values are the plugin's, converted to `rem`/`em` as they compile today, **not** M3-tuned (that is a later, visible change). `pre` and `kbd` keep the plugin's grey `oklch` colours. `:where(.prose) :where(h2)` for zero specificity and `:where(.not-prose, .not-prose *)` once, instead of the plugin's chain.
- The layer: today the plugin's rules sit in `@layer utilities`, and `base.css`'s rules in `@layer fallback` override them; the batch finds the layer position that reproduces every win and loss (against `fallback` and against utilities on the same element) by comparison, not by reasoning, and records it in a comment.
- `--tw-prose-*` (14 names, 44 lines in `base.css`, `blocks.css`, `src/editor.css`) become `--mo-comp-prose-*`, declared in the token file for `prose` (`tokens/base/comp/prose.css`); `--mo-sys-prose-space` stays.
- Remove `@plugin '@tailwindcss/typography'` from `base.css`, `@tailwindcss/typography` and its `overrides` entry from `package.json`, and the expectation in `scripts/peer-ranges.test.mjs`; `docs/type-classes.md` (lists are `prose` rules: now ours).
- The class names `prose`, `not-prose`, `lead`, `post-lead` do not change.

## Files it touches

- New `theme/styles/prose.css`, `theme/styles/tokens/base/comp/prose.css`; `theme/styles/{base,blocks,global}.css`, `src/editor.css`, `package.json`, `package-lock.json`, `scripts/peer-ranges.test.mjs`, `docs/type-classes.md`

## Proof that the rendered result is identical

1. `compare-html` (markup unchanged) on the demo and the starter: 0 differences.
2. `compare-styles` on **a prose fixture page** (new `demo/src/content/pages/prose-fixture.md`, `noindex` and kept out of lists like the test page: h1-h4, p with lead, `ol type=A|a|I|i|1`, nested lists, a check list, `dl`, `blockquote`, `pre`, inline `code`, `kbd`, a table with `tfoot`, `figure` with `figcaption`, `hr`, an image and a wrapper image, `video`, a `not-prose` block inside text) and on every page of the demo and the starter, 4 widths, light, dark, every section colour: 0 differences. The fixture is added in a first commit and its "before" build is made from the base.
3. The editor's text field: `styles-snapshot` of the text screens (`.editor-text.prose`) and the Preview: 0 differences.
4. `check:screens` in CI, `check:colors`, spacing check, `check:css-tokens`.

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
