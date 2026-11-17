# 0.19 Cards and lists: plan

Status: written 17 November 2026 for the owner's approval. Design: `docs/superpowers/specs/2026-11-17-list-to-cards-design.md`
(every decision, the M3 values read, the sources). Roadmap: `plans/2026-11-14-roadmap-0-18-to-0-24.md`, *0.19 Cards and lists*.

Each step is its own pull request to the PM (skill `developer`): a changeset (`minor`), the **Components** line, before and
after screenshots for what a person sees, a release note where a site owner sees it (skill `release-notes`), and the M3 pages
read with Playwright named in the description (skill `material-3`). Every pull request follows the rules of the spec's section 1
(follow the M3 token, globals, `--mo-` and M3's names, component variables for the customizer) and writes no Tailwind.

## Branches (the PM, before step 0)

The `0.19` branch holds the old *Lists and data* work (202 commits ahead of `0.18` on 17 November, with the "0.19 edition"
release notes). It becomes the **0.20** line: a `0.20` branch at its head, its edition and notes renumbered to 0.20. A new
`0.19` is cut from `0.18`. The chain is then `0.18` → `0.19` → `0.20`, each merged forward after every merge (skill
`changesets`, which gets the new lines).

## Step 0. M3's names for the globals

- Every global in `theme/styles/` becomes `--mo-` and M3's system token name: colours `--mo-color-*`, shapes
  `--mo-shape-corner-*`, elevation `--mo-elevation-level*-*`; spacing keeps `--mo-space-*`. A clean break; every use in
  `theme/`, `src/`, `lib/`, `site/`, `defaults/`, `starter/`, `demo/`, `bin/`, `scripts/` moves with it.
- `THEME_API` and `APP_API` go up; the release note lists old and new names. `morpheme-apps`' Venus and
  `scripts/variable-names.test.mjs` follow in a pull request there, after the release.
- Checks: `npm run check`, `npm run build`, `check:screens`, `check:themes`, `npx morpheme check:demo`, and
  `npx morpheme compare-html <before>` (nothing may look different).

## Step 1. The shared globals

- Resting shadows on: `--mo-elevation-levelN-rest-shadow` is the level's shadow, at every level. Each part on level 1 or
  higher is checked against its own M3 token page (`/styles/elevation/tokens` lists the resting levels: elevated button,
  card and chip, modal bottom sheet, side sheet and drawer at 1; menu, navigation bar, rich tooltip, toolbar, scrolled app
  bar at 2; dialog, FAB, extended FAB, search, pickers at 3). The deviation "colour-only elevation" is not written.
- M3's state opacities as globals (`--mo-state-hover-state-layer-opacity` 0.08, focus 0.1, pressed 0.1, dragged 0.16,
  disabled 0.38); every written number in `theme/styles/` and `src/editor.css` reads them.
- One focus ring: `--mo-color-primary`, 3 dp, offset 2 dp, `border-radius: inherit`. A deviation in
  `docs/material-deviations.md`: M3's token is `secondary`; WCAG 2.2, 1.4.11 needs 3:1 and a site's Secondary can give 1.15:1
  (`specs/2026-11-13-custom-colors-design.md`, whose open question this closes). A component's own offset (the list's −3 dp)
  is its variable.
- Checks: as step 0, and `check:colors`.

## Step 2. Avatar

`theme/ui/Avatar.tsx`: a letter or an image, round, the list's tokens (40 dp, `primary-container`, `on-primary-container`).
`ListItem`'s leading avatar uses it. In the gallery (`#developer/parts/ui`), in `src/themeUi.ts`, and in the `developer`
skill's component list as "M3 has no page".

## Steps 3 and 4. Card, and every user of Card (released together)

- `theme/ui/Card.tsx` and its CSS to the spec's 5.1 and 5.2: the tokens per kind, disabled, the dragged layer, the outlined
  focus line; the props `headline`, `subhead`, `supporting`, `media`, `thumbnail`, `icon`, `actions`, `menu`, `menuAt`,
  `href` (never with `actions`), `selected`, `disabled`, `children`; M3's order; dividers by themselves; title-large,
  label-small, body-medium; the spacing steps; variables renamed to M3's names.
- Every user moves to the props in the same release: the blocks *Cards*, *Price cards*, *Notice*, *Table*, *Cookie list*,
  *Links* and the panels, *Image grid* (`ImageTile`), *Testimonials*; related posts; the 404 page; the editor's start-screen
  widgets, inline Cards, Price cards, Notice and Table, the media screen and the notices. The cards go onto the theme grid
  (deviation G1).
- `THEME_API` goes up (renamed card variables, the card's inside drawn by `Card`).
- Checks: all of step 0's, `check:editor-colors`, `check:phosphor`.

## Step 5. List and ListItem

- `theme/ui/List.tsx` and its CSS to the spec's 6.1: heights, spaces, the hover state layer, the selected colours, disabled,
  the Expressive shapes, the segmented surface and gap, the dragged state, the divider, the expand style.
- Removed: the hover shift, the selected weight, and `columns` (not in M3's anatomy; the screens that use it show their text
  under the headline). `truncate` stays: M3 prints that text "can wrap or be truncated".
- `subhead` replaces `overline` as the prop (drawn as the overline). The blog list's headline follows the token (body-large).
- Checks: as steps 3 and 4.

## Step 6. The collection

- `theme/ui/Collection.tsx`: a list of items (the card's props) drawn as `ListItem`s or `Card`s. Each collection has a form on
  phones and one on larger screens (List or Cards; *Cards* also Carousel on phones); default List on phones, Cards from 600 dp.
  The switch is a container query on the collection's width (37.5rem); both forms are drawn, one shown.
- A card in the list form: the mapping of the spec's 8.1. One action (a button or a link in the text) is a single-action
  item; several are an expanding item with each as a nested single-action item. A link in the text shows as plain text in the
  row. A card's inner dividers are not drawn.
- **Not every card becomes a list.** A collection whose cards have chips, a slider or other components (`children`) offers
  Cards only; the List choice is disabled with a short reason. *Price cards* and *Table* stay cards.
- A list item in the card form: trailing text goes at the end of the subhead line; the trailing icon is not drawn.
- What goes through it: every group of items on the site (*Blog posts*, related posts, *Cards*, *List*, *Points*,
  *Testimonials*, *Links*' pages) and the editor's lists of content (pages, posts, media, apps, themes). Not through it: single
  cards (*Notice*, *Table*, *Cookie list*, a panel, the 404 page), lists inside another component (search suggestions, the
  choice group, the accordion) and the editor's settings rows. All of them still use `Card` and `ListItem`.
- The looks: list standard (segmented a choice where a block offers it), the block's card kind (default outlined), the
  description on cards (M3: list items "reveal supporting text at expanded breakpoints"), 2 cards side by side from 600 dp and
  3 from 840 dp, each block's own image shape.

## Tailwind

From the first pull request on, no new Tailwind. Steps 3 to 6 write their CSS without it. The last pull request of 0.19
replaces `prose` with the theme's own text styles, rewrites what is left (about 1,700 uses), removes `tailwindcss`,
`@tailwindcss/vite`, `@tailwindcss/typography` and `prettier-plugin-tailwindcss`, and raises `THEME_API` and `APP_API`.

## Step 7. Viewports in the builder

A design, after Tailwind is gone: the Preview goes, and the builder shows the page at M3's window sizes (the spec's 8.2).

## Documents

The other documents that name versions 0.19 to 0.26 keep their numbers; the roadmap's note says to add one. A document is
renumbered when it is next changed. The skills `changesets`, `pm` and `checks` get the new lines in the branch pull request.
