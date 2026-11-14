# The List block in one card (design, 0.19)

Status: spec for the 0.19 PM, no code in this pull request. Owner decisions of 14 Nov 2026, as relayed by the 0.19 PM (section 1).
Builds on 0.18's Paste and Change to (`2026-11-14-paste-and-change-to-design.md`, #635), the block row outline (#640), the
choice group (`2026-11-14-choice-group-design.md`, #641) and the Cards' aspect ratio (`2026-11-14-image-tools-design.md`, #636), and
contradicts none of them.

## 1. Owner decisions (14 Nov 2026)

1. The List block gets a **card layout**: a design of the List block itself, **not** a list inside a Cards block. It uses the Card
   part's own look and styles (Outlined, Filled, Elevated). Use case: a services page of several lists under H2 headings, made of the
   default blocks only.
2. The setting **Card** has two values: **None** (the default, today's look, so no existing site changes) and **One card** (the whole
   list inside one card). With One card, a second setting, **Card style** (Outlined, Filled, Elevated), shows.
3. **One card per item is dropped** (it was option B of the sketch): that is what the Cards block draws, and Change to turns a List
   into Cards. The setting's hint says so.
4. The setting is drawn by the new theme part `ChoiceGroup` (#641), never by `SegmentedButton`.

## 2. What Material 3 prints

Read 14 Nov 2026 with Playwright (pages rendered, token tables opened): Cards overview, specs (with tokens), guidelines,
accessibility; Lists overview, specs (with tokens), guidelines, accessibility.

**Cards may hold a list.**
- Cards overview: "Use cards to contain related elements". "Contents can include anything from images to headlines, supporting text,
  buttons, and lists". "Can also contain other components". "Cards have flexible layouts and dimensions based on their contents".
- Cards guidelines: "Use a card to display content and actions on a single topic." (one list about one subject, under its heading,
  is one topic). "Don't force content into cards when spacing, headlines, or dividers would create a simpler visual hierarchy" (why
  None stays the default).
- Cards guidelines, *Cards in a collection*: "Multiple cards can be grouped together into collections displayed in a grid, list, or
  carousel." "Cards can be displayed together in a vertical list." That is the Cards block (decision 3), not this setting.

**Card measurements and tokens** (Cards specs):
- "Shape 12dp corner radius", "Left/right padding 16dp", "Padding between cards 8dp max", "Label text alignment Start-aligned".
- Shape: `md.comp.elevated-card.container.shape`, `md.comp.filled-card.container.shape`, `md.comp.outlined-card.container.shape` →
  `md.sys.shape.corner.medium` (12dp).
- Elevated: container colour role "Surface container low", `md.comp.elevated-card.container.elevation` → `md.sys.elevation.level1`
  (1dp); hover level2.
- Filled: "Surface container highest", `md.comp.filled-card.container.elevation` → `md.sys.elevation.level0`.
- Outlined: "Surface", "Outline variant"; `md.comp.outlined-card.outline.width` 1dp, `md.comp.outlined-card.container.elevation` →
  level0.
- The hover, focus, pressed and dragged tokens are for an actionable card. This card is not one (accessibility, below).

**Lists inside a container** (Lists guidelines, *Gaps & dividers*): "Use gaps for contained lists. Gaps leverage expressive shape
and containment tactics." "Limit dividers to uncontained or complex lists, only when a stronger visual separation is necessary."
"Caution: Limit the use of dividers to uncontained lists". Cards guidelines, *Dividers*: "Use inset dividers, which don't run the full
width of a card, to separate related content".

**List tokens** (Lists specs): `md.comp.list.list-item.leading-space` 16dp, `trailing-space` 16dp, `top-space` 10dp, `bottom-space`
10dp, `between-space` 12dp; `md.comp.list.divider.leading-space` 16dp, `trailing-space` 16dp; `md.comp.list.list-item.container.shape`
→ `corner.none`; hovered expressive shape → `corner.medium` (12dp); `md.comp.list.list-item.container.color` → `md.sys.color.surface`.

**Swap** (Lists guidelines): "Lists are just a compact composition of images, text, and actions. Other components, like cards and
carousels, use the same elements but take up more space." "Information displayed in list items on mobile can change to cards on
tablet and desktop" (the Cards block, through Change to).

**Accessibility.** Cards: "A card can be a non-actionable container that holds actions like buttons and links, or it can be directly
actionable without any buttons or links. This is to avoid stacking actionable elements. An action shouldn't be placed on an
actionable surface." "For non-actionable cards, the card itself is not a tab stop. However, every actionable element in the card is a
tab stop". "Non-actionable cards are purely containers, so they don't need a role." Lists: "Tab key navigates to the list. Space or
Enter keys activate items." "All list items must be able to be activated using the Space or Enter key."

**Where M3 is silent.** M3 prints the card's left and right padding only, not its top and bottom padding, and no example of a
list's items inside a card's padding. We use the nearest printed values (section 4): the items' own 16dp leading and trailing space
make the card's 16dp left/right padding, and an 8dp top and bottom padding (the theme's `--card-gap` step, the 8dp grid). No
deviation: nothing contradicts a printed rule. Nothing goes in `docs/material-deviations.md`.

## 3. The settings

Two new fields of the List block (`src/standard/list/index.tsx`), block-level (not inside `items`), after `rowsFromFields` and before
`items`, **without `only: typed`**: they apply to typed rows and to rows from a list alike. They are in the block's settings sheet
(`⋮` › Block settings), as Cards' `design` is. The List's `inline` gets `blockSettings: true`, as Cards has, keeping whatever 0.18's
Paste and Change to build adds to `inline`.

| Key | Label en-US / da-DK | Type | Values (en-US / da-DK) | Default | Shown |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `card` | `Card` / `Kort` | `select`, `segments: true` (drawn as `ChoiceGroup`) | `''` None / Ingen · `'one'` One card / Ét kort | `''` (None) | always |
| `design` | `Card style` / `Kortets stil` | `select`, `segments: true`, `sample: 'card'` | `''` Outlined / Med kant · `'filled'` Filled / Udfyldt · `'elevated'` Elevated / Hævet | `''` (Outlined) | `only: { field: 'card', is: ['one'] }` |

- **Hint of `card`:** en-US `Puts the whole list inside one card. For a card for each item, use Change to › Cards.` da-DK `Lægger hele
  listen i ét kort. Vil du have et kort til hvert punkt, så brug Skift til › Kort.`
- **The key `design` and its values are Cards' own** (`''` outlined, `filled`, `elevated`, in Cards' order), so Change to carries the
  style between the two blocks with the same meaning (section 8). The option texts reuse `t.blocks.cards.designOutlined`,
  `designFilled`, `designElevated` (no new strings); the label reuses Image grid's `Card style` / `Kortets stil` wording as a new key
  `t.blocks.list.cardStyle` (one text per block, as the repository keeps them).
- **New texts** in `src/i18n/en-US/blocks.ts` and `src/i18n/da-DK/blocks.ts`, under `list`: `card`, `cardNone`, `cardOne`, `cardHint`,
  `cardStyle`. `check:language` passes: no Danish outside the language files.
- **`ChoiceGroup`** (#641): two short choices fit on one line in every width the choice-group spec measured (271, 312, 335, 343 px), so
  `Card` shows as a connected button group; `Card style` with its `card` sample shows as the list form with samples, exactly as Cards ›
  Design does after #641's PR 4. If #641's PR 4 (the `card` sample) is not in `0.19` when this is built, `design` is built without
  `sample` and gets `sample: 'card'` in PR 4, with Cards › Design.
- **Saved form.** A List without the keys is None. `card: 'one'` with no `design` is Outlined. An unknown `design` value is read as
  Outlined, as Cards reads it (`cardKinds.find(...) ?? 'outlined'`).

### `FORMER` must keep `design`

`FORMER.list` in `lib/blocks.mjs` runs on every read of a List and today drops `design` ("loses the design it never had"); it turns
`design: 'segmented'` into a Segmented list. It changes to: `design: 'segmented'` still becomes a Segmented list; **any other
`design` is kept**. An old List that carried some other `design` has no `card`, so it is None and looks as before: no site changes. A
test in `lib/blocks.test.mjs` (or the file that tests `FORMER`): a List with `{ card: 'one', design: 'filled' }` reads back unchanged;
a List with `design: 'segmented'` is still a Segmented list.

## 4. How the site draws it

`theme/blocks/list/View.tsx`, with the view's two new fields (`ListView` in `src/standard/list/view.ts` gets `card?: 'one'` and
`design?: CardKind`; `listOf` passes them through; `load.ts` unchanged apart from that):

- **None:** exactly today's markup and look. No wrapper. This is checked (section 10).
- **One card:** the theme's `Card` part (`theme/ui/Card.tsx`, `as="div"`, no `href`) with `kind` from `design`, and the class
  `block-list-card` plus the block's in-text classes (`useInText()`, moved from the list to the card). Inside it, `Rows.tsx` unchanged
  (the `<ul class="list not-prose block-list">`).
  ```
  <div class="card card-outlined block-list-card block-in-text …">
    <ul class="list not-prose block-list"> <li>…row…</li> … </ul>
  </div>
  ```
- **No empty card.** On the site a List with no rows is not drawn (`load.ts` returns null for rows from a list that gives none; a
  typed List has rows). So there is never an empty card.

### CSS (`theme/styles/blocks.css` for the layout, `theme/styles/global.css` for Material's values; no new colour)

- `.block-list-card { padding: var(--list-card-padding-block, 0.5rem) 0; }`: the card's left/right padding is 0, because the items'
  own `--list-item-padding-inline` (16dp, M3's leading and trailing space) puts the text 16dp in from the card's edge, which is M3's
  card padding. Top and bottom 8dp (section 2, *silent*). Same rule as `.block-panel > .list` (a list in a panel reaches its sides).
- Corners, surface, line and shadow are the Card part's (`.card`, `.card-<kind>` in `ui.css`): `--card-radius` (12dp,
  `--mo-shape-medium`), `--card-outlined-surface` / `--card-outlined-line`, `--card-elevated-surface` with level 1, the filled card
  on `--card-filled-surface`. In `global.css` the rule that gives the Cards block's filled card the surface container
  (`.block-card { --card-filled-surface: var(--mo-surface-container); }`) gets `.block-list-card` too, so a List's filled card and a
  Cards card on the same page are the same colour.
- The card is not a link: it never lifts, tints or shows a state layer. The rows inside keep theirs (the list item's hover, pressed
  and focus states, 12dp shape on hover).
- **New theme variable:** `--list-card-padding-block` (default `0.5rem`), documented in the `ui.css` / `blocks.css` comment with the
  others. A theme can set it; nothing else is new.

### Phone and computer

- **Phone (below 600 px):** the card is as wide as the text column (the block's in-text margins, as the list is today), corners 12dp,
  rows full width inside it. The services-page use: an H2, then a card; an H2, then a card; the space between a card and the next
  heading is the block's in-text spacing, unchanged.
- **Computer:** the same, in the text column (never two columns: a list is one column; side by side is the Cards block, M3's "swap"
  above). The card never grows wider than the text column.
- Density (`--mo-density`) changes the rows' heights as today; the card's padding does not change with density.

### Dividers inside the card

The rows' dividers stay the theme's list dividers (`--list-divider`), unchanged: in Material they are none (`--list-divider:
transparent`), which is what M3 asks ("Use gaps for contained lists", "Limit dividers to uncontained lists"). A theme that draws
dividers keeps them between the rows inside the card, never above the first or below the last row (the existing `.list > li + li`
rule), and the line runs from the card's edge to the card's edge because the card has no inline padding. No new setting.

### Section colours

A section on a colour (the `.text-section-*` classes of a colour or a background image) swaps the `--mo-*` roles once (`global.css`), and the
Card part reads only those roles, so the card follows by itself, as Cards' cards do: outlined on the section's surface with the
swapped outline variant (35% of the on-colour); filled on the swapped surface container (10% of the on-colour); elevated on the
swapped container low, its shadow as Cards'. The rows' text, supporting text, icons and arrow keep their `.block-list` tokens
(`--block-text`, `--block-muted`, `--list-item-leading-icon-color`), which the section swaps too. A row icon with its own colour
(`iconColor`) keeps it, as today.

## 5. How the editor draws it while typing in place

- `src/InlineList.tsx`: `wrap` puts the same theme `Card` (through `src/themeUi.ts`, as `SiteList` is; export `SiteCard` if it is not
  there) around `SiteList` when the block's `card` is `one`, with the same `kind` and `block-list-card` class, so the editor draws
  exactly the site's card. `InlineList` gets the block's props it needs (`card`, `design`) from the inline view (`src/inlineViews.tsx`,
  as 0.18's build passes block props).
- `RowsFromList` (rows from a list) draws the same card around its `SiteList`. The lines above it (which list, Undo, Edit list, the
  fields' buttons) stay outside the card, above it.
- The faded empty row of a List with no rows is drawn inside the card, so the owner sees where the rows will go; the `Add list row`
  text button stays **under the card, outside it** (the site has no such button, so the card holds only what the site shows).
- The block's dotted outline (#640: a Card's radius and padding, the action row inside it) is around the whole block, so it is around
  the card: the card's corners sit 16dp inside the outline's. Nothing in #640 changes.
- `src/editor.css`: no new colour. If a rule is needed at all (for example the empty row's fade inside the card), it uses only
  `--mo-*` roles, `currentColor` and `color-mix` of them, so it follows every section colour (`[data-section-color]` swaps the roles
  once). `npm run check:editor-colors` passes with no allowlist entry.
- Changing `Card` or `Card style` in the settings sheet redraws the block at once (a `setNodeMarkup`, one undo step, as every block
  setting).

## 6. Typed rows and rows from a list

The card is drawn by the List's view around `Rows.tsx`, whatever gave the rows: typed `items`, or `withRows` from a list (`from`).
The two fields are the List's own, not part of `rowsFromFields`. When a later 0.19 spec moves `Rows from` out of the core into an
app, the app gives rows and the List still draws them in its card; nothing in this spec depends on `from`, `tags`, `howMany` or `map`.

## 7. Accessibility

- The card is a non-actionable container: a `<div>` with no role, no `tabindex`, no label (M3: "Non-actionable cards are purely
  containers, so they don't need a role"). The list inside stays a `<ul>` of `<li>`, so a screen reader still says "list, 4 items".
- Each row with a page is its own link and tab stop, as today; Enter follows it. The card never is a link, so there is no link inside
  a link (M3: "An action shouldn't be placed on an actionable surface").
- The focus ring is the list item's (inside the row), unchanged; the card does not clip it (`overflow` stays visible on
  `.block-list-card`).
- The heading of the list is the text's H2 above the block (`lib/remark-list-head.mjs`), outside the card, so the heading order is
  unchanged.
- Contrast: the rows' text on each card surface and section colour at least 4.5:1, the icons and the outlined card's line are
  decorative (the rows are identified by their text) but the line is checked to be visible (section 10).

## 8. Change to between List and Cards

0.18's rule (#635, section 3): every prop of A stays in B's props, B uses those it knows with the same meaning, B's own props that A
did not have are absent (defaults). So, with no extra code:

- **List → Cards:** `design` stays and Cards reads it with the same meaning: a List in a filled card becomes filled cards. `card` stays
  in the props, unseen by Cards. A List with None has a `design` only if it had one before; otherwise Cards is Outlined, its default.
- **Cards → List:** `design` (and `color`, `phone`, `media`) stay; `card` is absent, so the List is **None** and looks as a List does
  today. When the owner then picks One card, the style is already the cards' style. Back to Cards brings everything back.
- **List → Segmented list, Steps, FAQ list, Table and back:** `card` and `design` stay unseen and return with the List.
- `Change to` never turns `card` on by itself (owner question 1).

## 9. Release note

A `paragraph`, mark `feature` (a new setting the owner sees), id = this build's changeset name, in both languages
(skill `release-notes`):

- en-US: title `Lists in a card`; text `A list can now stand in one card, so a page of services can be built from lists under
  headings with the default blocks. Open the list's settings and choose Card › One card, then Outlined, Filled or Elevated. For a card
  for each item, use Change to › Cards.`
- da-DK: title `Lister i et kort`; text `En liste kan nu stå i ét kort, så en side med ydelser kan bygges af lister under overskrifter
  med de faste blokke. Åbn listens indstillinger, og vælg Kort › Ét kort og derefter Med kant, Udfyldt eller Hævet. Vil du have et
  kort til hvert punkt, så brug Skift til › Kort.`

## 10. Checks

- **`check:screens`, `inlineBlocks`** (`scripts/editor-screens.mjs`): a new entry for the List in a card, e.g. `{ name: 'list',
  variant: 'card', props: { card: 'one', design: '' }, hint: 'Rows with icon, heading and text.', add: 'Add list row', surface: true
  }`, and the same for `filled` and `elevated` (or one entry run over the three designs). The check inserts the List, sets the props
  through the block's settings (or writes them, as the harness does for other variants), and runs the existing per-section-colour
  checks of `checkInlineBlock` (text, placeholder, slot icons, outline) on every section colour, at 375 and 1280. Extra asserts: the
  card is drawn (`.block-list-card.card-<kind>`), the `Add list row` button is outside it, the faded empty row is inside it, and the
  plain List entry still has **no** `.block-list-card`.
- **Fields:** the `Card` field shows as a button group, `Card style` is hidden with None and shows (list form with samples once #641
  PR 4 is in) with One card, in en-US and da-DK, at 375 and 1280.
- **Contrast** (`npm run check:contrast`, and the theme contrast report): row headline, supporting text, icon and arrow on the three
  card surfaces, light and dark, on the page and on each section colour; the outlined line visible (at least the outline variant's
  own contrast) on each.
- **Site:** `npm run check:demo` with a demo page that has two Lists in One card under H2s (outlined and filled) and one List with
  None, so the site's drawing is built and checked; the plain List's HTML is byte-identical to before (no wrapper).
- `node --test` for `FORMER` (section 3) and for `listOf` passing `card` and `design` through.
- `npm run check` (with `check:language`, `check:editor-colors`, `check:release-notes`) and, after `npm run build`, `npm run
  check:screens`.
- Screenshots in the build pull request: the services page on a phone and a computer, each style, light and dark, and on a section
  colour.

## 11. Build plan

One pull request into `0.19`, after #641's PR 2 (`ChoiceGroup` drawing `segments: true` fields) is in `0.19`; it can go before #641's
PR 4 (then `sample: 'card'` is added with PR 4). Changeset `minor` (a new setting; skill `changesets` decides the level for `0.19`).
Files: `src/standard/list/{index.tsx,view.ts}`, `theme/blocks/list/View.tsx`, `theme/styles/{blocks.css,global.css}`, `lib/blocks.mjs`
(+ test), `src/InlineList.tsx`, `src/inlineViews.tsx`, `src/themeUi.ts` if `SiteCard` is missing, `src/i18n/{en-US,da-DK}/blocks.ts`,
`scripts/editor-screens.mjs`, the demo page, the release note in both languages.

## 12. Owner questions

1. **Should `Change to` › List from Cards turn on One card?** Today's rule (#635) leaves it None, so the cards become a plain list.
   **Recommendation: keep the rule** (None): 0.18 decided "B's own props get B's defaults", and one tap on One card gives the card in
   the cards' style, which `design` already carries.
2. **Should a filled List card offer Cards' container colours** (Surface, Primary, Secondary, Tertiary)? **Recommendation: not now.**
   The owner asked for the three styles; the colour can follow later as Cards' `color` with the same key, so Change to would carry it.
3. **Should the demo get a services page** made of Lists in cards under H2s (used by `check:demo` and the theme's screenshots)?
   **Recommendation: yes**, a short one, since it is the use case and gives the checks a real page.
