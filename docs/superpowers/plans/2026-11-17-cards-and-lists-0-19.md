# 0.19 Cards and lists: plan

Status: rewritten 18 November 2026 against `origin/0.18`, for the owner's approval. Design:
`docs/superpowers/specs/2026-11-17-list-to-cards-design.md` (the decisions, the M3 values read, the sources). Roadmap:
`plans/2026-11-14-roadmap-0-18-to-0-24.md`, *0.19 Cards and lists*.

Each step is its own pull request to the PM (skill `developer`): a changeset (`minor`), the **Components** line, before and
after screenshots for what a person sees, a release note where a site owner sees it (skill `release-notes`), and the M3 pages
read with Playwright named in the description (skill `material-3`).

## What 0.19 builds on (done before it starts)

| In | What | Source |
| :--- | :--- | :--- |
| 0.18 | Every token renamed to M3's three tiers: `--mo-ref-*`, `--mo-sys-*`, `--mo-comp-<component>-*`; `THEME_API` and `APP_API` 6 | `plans/2026-11-16-token-rename-table.md` (on `0.18`) |
| 0.18 | The CSS split: one file per component (`cards.css`, `lists.css`, `chips.css` …) and the token files `theme/styles/tokens/<origin>/` | `plans/2026-11-16-css-split.md`, `docs/theme-css-split.md` (on `0.18`) |
| 0.18 | Lists: the *Design* setting (plain, segmented), the *Columns* setting (rows in up to three columns, deviation T1), List - Expand for the FAQ, leading avatars and images | #845, #856, #877, #884 |
| 0.18.1 | Away from Tailwind: no utilities, no `prose` (our own text styles), the breakpoints as `--mo-` tokens, the packages removed | `plans/2026-11-16-move-away-from-tailwind.md` (on `0.18`; its version lines change to 0.18.1) |

So 0.19 writes plain CSS in the component files, reads only `--mo-` tokens, and may use container queries.

## The rules for every pull request

- Follow the M3 token: where a token prints a value, that value.
- No invented tokens: a part reads the globals (`--mo-sys-*`). If something does not fit, the owner is asked.
- A component's own values are `--mo-comp-<component>-*` (the customizer changes them one component at a time): M3's
  component token name where a specs page prints one (`--mo-comp-filled-card-container-color`), ours under the same prefix
  where M3 is silent (as the token-rename plan's kind **O**), each falling back to a `--mo-sys-*` global.
- One file per component; a part shared by two components has its own file (`avatar.css`, `collection.css`).
- M3 Expressive where a component has it (Lists), baseline otherwise (Cards).

## Branches

Owner, 17 November: merge the `0.19` branch first if possible. The PM, with the owner's go: the open pull requests into `0.19`
(#704, #818, #819), then `0.19` into `main` after `0.18` (#888), then a new `0.19` cut from `main` for this plan. The unbuilt
*Lists and data* items stay in 0.20. If the merge is not possible, the `0.19` branch becomes `0.20` and a new `0.19` is cut
from `0.18`.

## Step 1. The shared globals

- **Resting shadows on.** `--mo-sys-elevation-levelN-rest-shadow` is `--mo-sys-elevation-levelN-shadow` at every level. Each
  part on level 1 or higher is checked against its M3 token page (`/styles/elevation/tokens`: level 1 elevated button, card
  and chip, modal bottom sheet, side sheet, drawer; 2 menu, navigation bar, rich tooltip, toolbar, scrolled app bar; 3
  dialog, FAB, extended FAB, search, pickers). It replaces the decision of 13 November (colour-only elevation at rest).
- **M3's state opacities as globals:** `--mo-sys-state-hover-state-layer-opacity` 0.08, `-focus-` 0.1, `-pressed-` 0.1,
  `-dragged-` 0.16, `--mo-sys-state-disabled-state-layer-opacity` 0.38 (M3's names, *State opacities*). Every written number in
  the component files reads them. Today's layer colours (`--mo-sys-state-mo-hover-layer`, `-pressed-`) are made from them.
- **One focus ring:** `--mo-sys-color-primary`, 3 dp, offset 2 dp, `border-radius: inherit`. A deviation: M3's token is
  `secondary`; WCAG 2.2, 1.4.11 needs 3:1 and a site's Secondary can give 1.15:1 (`specs/2026-11-13-custom-colors-design.md`,
  whose open question this closes). A component's own offset (the list's −3 dp) is its `--mo-comp-` token.
- Checks: `npm run check`, `npm run build`, `check:screens`, `check:themes`, `npx morpheme check:demo`, `check:colors`.

## Step 2. Avatar

`theme/ui/Avatar.tsx` and `avatar.css`: a letter or an image, round, with the list's leading avatar tokens (40 dp,
`--mo-sys-color-primary-container`, `--mo-sys-color-on-primary-container`, label 16 pt / 0.15). `ListItem`'s leading avatar and
`Card`'s thumbnail use it. In the gallery (`#developer/parts/ui`), `src/themeUi.ts`, and the `developer` skill's component list
as "M3 has no page".

## Steps 3 and 4. Card, and every user of Card (released together)

- `Card.tsx` and `cards.css` to the spec's 5.1 and 5.2: the tokens per kind (filled `surface-container-highest`; elevated at rest
  on level 1 with its shadow; disabled; the dragged layer; the outlined focus line `on-surface`); the props `headline`,
  `subhead`, `supporting`, `media`, `thumbnail`, `icon`, `actions`, `menu`, `menuAt`, `href` (never with `actions`),
  `selected`, `disabled`, `children`; M3's order; dividers by themselves; title-large, label-small, body-medium; the gaps from
  `--mo-sys` spacing steps through `--mo-comp-card-*` tokens.
- Every user moves to the props in the same release: *Cards*, *Price cards*, *Notice*, *Table*, *Cookie list*, *Links* and
  the panels, *Image grid* (`ImageTile`), *Testimonials*, related posts, the 404 page; the editor's start-screen widgets, the
  inline Cards, Price cards, Notice and Table, the media screen and the notices. The cards go onto the theme grid (G1).
- `THEME_API` goes up (the card's inside is drawn by `Card`).

## Step 5. List and ListItem

- `List.tsx` and `lists.css` to the spec's 6.1, measured again on 0.18 in the pull request: heights 56 / 72 / 88 dp, spaces
  16 / 10 / 12 dp, the hover state layer, the selected colours, disabled 0.38, the Expressive shapes, the segmented surface and
  2 dp gap, the dragged state, the divider.
- Removed from `ListItem`: the hover shift, the selected weight and the `columns` prop (headline and text side by side; not
  in M3's anatomy). The *Columns* setting of the list blocks (0.18, rows in columns) stays. `truncate` stays.
- `subhead` replaces `overline` as the prop (drawn as the overline). The blog list's headline follows the token (body-large).
- Density (0.18, `--mo-comp-list-item-density`) stays on top of the M3 heights.

## Step 6. The collection

- `theme/ui/Collection.tsx` and `collection.css`: items (the card's props) drawn as `ListItem`s or `Card`s. A form on phones
  and one on larger screens (List or Cards; *Cards* also Carousel on phones); default List on phones, Cards from 600 dp; a
  container query on the collection's width; both forms drawn, one shown. `collection.css` only arranges and switches; it
  styles neither a card nor a list item.
- A card as a list item: the spec's 8.1. One action (a button or a link in the text) is a single-action item; several are an
  expanding item with each as a nested single-action item; a link in the text shows as plain text in the row; inner dividers
  are not drawn.
- Not every card converts: a collection whose cards have chips, a slider or other components offers Cards only, the List
  choice disabled with a short reason (*Price cards*, *Table*).
- A list item as a card: trailing text at the end of the subhead line; the trailing icon is not drawn.
- Through it: every group of items on the site (*Blog posts*, related posts, *Cards*, *List*, *Points*, *Testimonials*,
  *Links*' pages) and the editor's lists of content (pages, posts, media, apps, themes). It takes over *Dynamic cards* and the
  List block in one card (#697, built on the old `0.19`). Not through it, but on `Card` and `ListItem`: single cards, lists
  inside another component (search suggestions, the choice group, the FAQ's List - Expand), the editor's settings rows.
- The looks: the list's *Design* setting (plain default, segmented); the block's card kind, default outlined; the description
  on cards; 2 cards side by side from 600 dp, 3 from 840 dp; each block's own image shape.

## Step 7. Viewports in the builder

A design: the Preview goes and the builder shows the page at M3's window sizes (spec 8.2). Possible because 0.18.1 removed
Tailwind's window-width utilities.

## Documents to rewrite with this plan

The unbuilt specs and plans that overlap (the audit of 17 November): the grid audit (its step 4 → step 6; "3 from 840" against
the grid), the editor-parts audit (rows 5, 6, 9, 11, 12), the site spacing audit (step 12 → steps 3 and 4), the intuitive
editor (finding 15 → step 7, 17 → step 6), custom colours (the focus-ring question closed), the M3 audit (Q2 and rows 8–17
moved), the modern-web audit (C4 decided for components, A1 → step 1), the table spec (the new `Card` props), app bars (the
scrolled bar at level 2 with its shadow), settings sheets (side sheet shadow, `ListItem`), icon packs, forms and app storage
(through `Collection`), the dynamic-list plan (its fields as the item props), and each `docs/material-deviations.md` entry in
its step's pull request (SV12, A1, G1, CM1, the Preview lines, density, T1).
