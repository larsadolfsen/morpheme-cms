# Cards and lists (0.18) and the collection (0.19): plan

Status: **approved by the owner, 18 November 2026** ("Yes and send it to the pm"). Design:
`docs/superpowers/specs/2026-11-17-list-to-cards-design.md` (every decision, the M3 values read, the sources). Roadmap:
`plans/2026-11-14-roadmap-0-18-to-0-24.md`.

Each step is its own pull request to the PM (skill `developer`): a changeset, the **Components** line, before and after
screenshots for what a person sees, a release note where a site owner sees it (skill `release-notes`), and the M3 pages read
with Playwright named in the description (skill `material-3`).

## The releases (owner, 18 November)

| Release | What |
| :--- | :--- |
| **0.18** | Steps 1 to 5: the shared globals, `Avatar`, `Card`, `List` and `ListItem`, and the site's cards and lists moved to them. It rides on 0.18's contract raise to 6 (the token rename): no extra raise. |
| **0.18.2** | Away from Tailwind (`plans/2026-11-16-move-away-from-tailwind.md`, batches T01–T17 in `plans/2026-11-18-tailwind-batches.md`; contract 7, patch changesets, into `main` after the owner releases 0.18.0), **without** the card and list files below: 0.18 has already written them in plain CSS. |
| **0.19** | Step 6, the collection (lists and cards turn into each other), and step 7, viewports in the builder. |

## What 0.18 already has

The token rename to `--mo-ref-*`, `--mo-sys-*`, `--mo-comp-*` (contract 6, `plans/2026-11-16-token-rename-table.md`); the CSS
split, one file per component (`cards.css` #862, `lists.css` #856; `plans/2026-11-16-css-split.md`); the lists' *Design*
(plain, segmented), *Columns* and List - Expand (#845, #856, #877, #884).

## The rules for every pull request

- **Follow the M3 token.** No invented tokens: a part reads `--mo-sys-*`. If something does not fit, the owner is asked.
- A component's own values are `--mo-comp-<component>-*` (for the customizer): M3's component token name where a specs page
  prints one, ours under the same prefix where M3 is silent, each falling back to a `--mo-sys-*` global.
- One file per component; a part two components share has its own file (`avatar.css`).
- **No Tailwind** in any file a step touches: it is removed there and the CSS goes into the component's or block's file.
- **Nothing loses a function it has today** (owner). The look of a list item stays the same where the owner has not decided
  otherwise.
- M3 Expressive where a component has it (Lists), baseline otherwise (Cards).

## Step 1. The shared globals

- **Resting shadows on:** `--mo-sys-elevation-levelN-rest-shadow` is `--mo-sys-elevation-levelN-shadow` at every level. Each
  part on level 1 or higher is checked against its M3 token page (`/styles/elevation/tokens`).
- **M3's state opacities:** `--mo-sys-state-hover-state-layer-opacity` 0.08, `-focus-` 0.1, `-pressed-` 0.1, `-dragged-` 0.16,
  `--mo-sys-state-disabled-state-layer-opacity` 0.38; the layer colours (`--mo-sys-state-mo-hover-layer` …) are made from them,
  and every written number in the component files reads them.
- **One focus ring:** `--mo-sys-color-primary`, 3 dp, offset 2 dp, `border-radius: inherit`; a deviation (M3: `secondary`; WCAG
  2.2, 1.4.11 needs 3:1). It closes the open question of `specs/2026-11-13-custom-colors-design.md`.

## Step 2. Avatar

`theme/ui/Avatar.tsx` and `avatar.css`: a letter or an image, round, the list's leading avatar tokens. `ListItem`'s leading avatar
and the card's thumbnail use it. In the gallery, `src/themeUi.ts` and the `developer` skill's list ("M3 has no page"). It can start
at once.

## Step 3. Card

- **Today's functions, all kept:** the kinds, media at the top, `href`, `as` (the element: set by the block in code, never an
  editor setting; `button` for a tappable card), `selected` with its check mark, `dragged`, `children`, `className`.
- **The M3 MVP props:** `media` (image, video, icon), `headline`, `subhead`, `supporting`, `actions` (the action area's buttons;
  never with `href`). Drawn in M3's order; headline title-large, subhead label-small, supporting text body-medium; gaps from the
  `--mo-ref-space-*` steps through `--mo-comp-card-*`.
- **M3's tokens per kind:** filled `surface-container-highest`; elevated at rest on level 1 with its shadow; hover, focus,
  pressed, dragged from step 1; outlined focus line `on-surface`.
- Later (a special type or 0.19, not built now): thumbnail on a card, icon buttons, the overflow menu, checkbox, radio, switch,
  chips, sliders, linked text, disabled.

## Step 4. The site's cards

*Cards*, *Price cards*, *Notice*, *Table*, *Cookie list*, *Links* and the panels, *Image grid* (`ImageTile`), *Testimonials*,
related posts (`PostCard.tsx`), the 404 page: on the props, without Tailwind, onto the theme grid (G1). The editor's cards keep
their content as `children` and change nothing but their look; they move to the props with the special type.

## Step 5. List, ListItem and the site's lists

- `List.tsx` and `lists.css` to M3's Expressive tokens (the spec's 6.1, measured again on 0.18): heights 56 / 72 / 88 dp, spaces
  16 / 10 / 12 dp, the hover state layer, the selected colours, disabled 0.38, the Expressive shapes, the segmented surface and
  2 dp gap, the dragged state, the divider. Density stays on top.
- **The MVP:** leading icon, image or avatar; `headline`, `subhead` (drawn as the overline; it replaces the prop `overline`),
  `supporting`; trailing text; the whole row a link; expand. Every other function of today stays.
- **`columns`** stays: its two columns are M3's content slot (Lists, Specs, *Flexibility & slots*), standardized in
  `lists.css` with `--mo-comp-list-*` tokens; the item looks the same.
- The hover shift and the selected weight go (not in the tokens). The blog list's headline follows the token (body-large).
- The site's lists move with it, without Tailwind: *List*, *Points*, *Checklist*, *Links*, *Testimonials* (list layout), the FAQ,
  the blog list (`PostList.tsx`). The editor's lists change only their look.

## The card and list files (taken out of the Tailwind batches)

Steps 1 to 5 rewrite these files in plain CSS; T11 and the block batches drop them. Counted on `origin/0.18`, 18 November.

- **Components:** `theme/ui/Card.tsx`, `theme/ui/List.tsx`, `theme/ui/ImageTile.tsx`, `theme/ui/Avatar.tsx` (new).
- **The site's cards:** `theme/blocks/cards/LinkCards.tsx` (and the block's `View.tsx`), `theme/blocks/pricecards/View.tsx`,
  `theme/blocks/notice/View.tsx`, `theme/blocks/table/View.tsx`, `theme/blocks/cookies/View.tsx`, `theme/blocks/Panel.tsx`,
  `theme/blocks/imagegrid/View.tsx`, `theme/blocks/testimonials/Testimonial.tsx`, `theme/components/PostCard.tsx`,
  `theme/templates/NotFound.astro` (its card only).
- **The site's lists:** `theme/blocks/list/Rows.tsx`, `theme/blocks/points/PointList.tsx`, `theme/blocks/checklist/Checks.tsx`,
  `theme/blocks/links/LinkGroups.tsx`, `theme/blocks/testimonials/List.tsx` and `View.tsx`, `theme/blocks/accordion/Accordion.tsx`,
  `theme/components/PostList.tsx`.
- **CSS:** `theme/styles/cards.css`, `theme/styles/lists.css`, `theme/styles/ui/avatar.css` (new), the card and list rules in
  `blocks.css` (or their files under `theme/styles/blocks/` once the split has moved them) and in `global.css` (the Material look
  of card, panel, notice, testimonial and accordion), and the token files `theme/styles/tokens/*/comp/card.css` and
  `tokens/*/comp/list.css`.
- **Not in steps 1 to 5** (they keep their Tailwind for the batches): the lists inside other components (`theme/ui/ChoiceGroup.tsx`,
  `theme/ui/Search.tsx`, `theme/components/ActionBar.astro`, `defaults/popup.tsx`) and every editor file (`src/`).

## Step 6 (0.19). The collection

As the spec's 8.1 and section 9: a form on phones and one on larger screens (List or Cards); a container query; a card with one
action is a link row, with several an expanding row; cards with chips, sliders, a checkbox, radio or switch, selected, or other
components offer Cards only; a list item as a card puts its trailing text in the subhead line. Up to two trailing actions and a ⋮
overflow menu on a list item (owner). It takes over *Dynamic cards* and the List block in one card (#697).

## Step 7 (0.19). Viewports in the builder

A design: the Preview goes and the builder shows the page at M3's window sizes (spec 8.2).

## Branches and order (the PM)

- Steps 1 to 5 are one feature: their pull requests go into `feature/cards-lists`, cut from `0.18`, and the feature goes into
  `0.18` as one pull request when it is done (skill `pm`, *Feature branches and the way to `main`*). Step 2 can start at once.
- The Tailwind session's plans (T11 and the block batches) drop the card and list files, and its release is 0.18.2.
- The old `0.19` work: merge its open pull requests (#704, #818, #819) and `0.19` into `main` after `0.18` if possible, then cut
  a new `0.19` for steps 6 and 7 (owner, 17 November).

## Documents to rewrite

The unbuilt specs and plans that overlap (audit of 17 November): the grid audit, the editor-parts audit (rows 5, 6, 9, 11, 12),
the site spacing audit (step 12), the intuitive editor (findings 15 and 17), custom colours (focus ring closed), the M3 audit (Q2,
rows 8–17), the modern-web audit (C4, A1), the table spec, app bars, settings sheets, icon packs, forms, app storage, the
dynamic-list plan, and the `docs/material-deviations.md` entries each step changes (SV12, A1, G1, CM1, the Preview lines, density,
T1). A session does them with step 1.
