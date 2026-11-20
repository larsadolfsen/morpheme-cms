# Tailwind batch T13: `prose` in our own CSS

Spec for one build session and one pull request into `main`. Part of `2026-11-16-move-away-from-tailwind.md` (the plan) and
`2026-11-18-tailwind-batches.md` (the order). Owner, 18 Nov: Tailwind ships as 0.18.2, with contract 7, patch changesets, into `main` after the owner releases 0.18.0.

| | |
| :-- | :-- |
| **When** | After the CSS split has finished (it edits `base.css`, `blocks.css`, `global.css`) and steps 1 to 5 of the cards-and-lists plan have merged (they rewrite the card and list rules of `blocks.css` and `global.css`; this batch touches the `prose` rules only). |
| **Must merge first** | the CSS split, cards and lists steps 1 to 5, T01 |
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

Empty (or `patch` if the PM asks).

## Checks

`npm run check`, `check:screens` (CI).

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
