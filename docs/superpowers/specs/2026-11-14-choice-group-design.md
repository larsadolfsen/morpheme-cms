# Choice group: one theme part that never squeezes (0.18)

Status: spec and build plan, no source code. Owner decisions of 14 Nov 2026 (below). For the 0.18 PM.

## 1. The problem

The theme's segmented button (`theme/ui/SegmentedButton.tsx`, used through `SegmentedButton` in `src/ui.tsx` and the `segments: true`
select fields drawn by `src/fields.tsx`) picks a style in many places and fails when it gets too wide. The owner's example: the Buttons
block › `Button settings` › `Style` (Filled, Tonal, Elevated, Outlined, Text) in a side sheet about 440 px wide: the chosen segment's
check mark pushes `Elevated` into `Outlined`, and the labels touch and overlap. The segments never wrap and never shrink their labels,
so any long label, a fourth or fifth choice, a narrow sheet or Danish breaks it.

## 2. Owner decisions (14 Nov 2026, quoted from the brief)

One theme part that chooses its own form by measuring, so it can never squeeze:

1. **When the choices fit on one line** at the width they get (typically two or three short choices, such as Left, Centre, Right): M3's
   **connected button group**, the replacement for segmented buttons.
2. **Otherwise** (more choices, long labels, a narrow sheet, any language): a **list of radio buttons**, one choice per row, the whole
   row the tap target, at least 48 dp high.
3. **Where a choice is a look** (the button style is the example), each radio row shows **a small live sample on its right**: here a
   small button in that style with the block's own label, shortened. Owner's sketch:
   ```
   Style
   ( ) Filled       [■ Book ]
   ( ) Tonal        [▒ Book ]
   (•) Elevated     [  Book ]  ← with shadow
   ( ) Outlined     [▢ Book ]
   ( ) Text            Book
   ```
4. It is decided by measuring, so it works at phone and computer width and in Danish as in English; it never wraps a group and never
   overlaps.

## 3. What Material 3 prints (read 14 Nov 2026 with Playwright)

Pages read in full, collapsed sections opened: segmented buttons (overview, guidelines), button groups (overview, guidelines, specs,
accessibility), radio button (overview, guidelines, specs, accessibility), lists (guidelines, specs). The token tables' values are only
partly in the page text (button group: only `xsmall container height 32dp`, `between space 18dp` were printed); where a number below is
not quoted, it is not printed in text and is taken from the theme's existing part, not from memory.

### Segmented buttons (`/components/segmented-buttons/overview`, `/guidelines`)

- "Segmented buttons are no longer recommended in the Material 3 expressive update. For those who have updated, use the connected button
  group instead, which has mostly the same functionality but with an updated visual design."
- "Segmented buttons can have 2-5 segments." "Don't use more than five segments in a single segmented button. Choices should be scoped.
  If you have more than five choices, consider using another component, such as chips."
- "Labels should be short and succinct. If a label is too long to fit within its segment, consider using an icon alone."
  "Don't allow segments to wrap onto a new line." "Avoid mixing icon-only labels with text labels."

### Button groups (`/components/button-groups/…`)

- Guidelines: "Connected button groups help people select options, switch views, or sort elements in a page." "Connected groups should
  replace the baseline segmented button, which is no longer recommended." "Connected button groups should be used for single or
  multi-select patterns that use toggle buttons." "Avoid mixing color styles in connected button groups."
- "The connected button group should span the width of the page or surface it's placed on, increasing the button widths inside. In
  larger windows, consider adding a maximum width to the connected group to avoid it growing too wide."
- Resizing: "Button groups should move through layouts together in a single line. They shouldn't wrap to a second line." "In compact
  windows, consider using smaller, narrower buttons so all buttons in the button group can fit."
- Presentation: "Buttons at the trailing edge of the button group can be customized to collapse into an overflow menu at smaller
  breakpoints, and become visible again at larger sizes."
- Behavior: "In a connected button group, only the shape of the pressed button changes." "A selected button should change shape from
  round to square, or square to round."
- Specs: "For all connected button groups, use 2dp padding." Inner corners "XS: 4dp, S: 8dp, M: 8dp, L: 16dp, XL: 20dp". "Extra small and
  small connected button groups have 48dp target areas and a minimum width of 48dp." "Button groups adapt to density of the buttons
  inside." Colour: "They can use the default button or toggle button color styles, like filled, tonal, and outlined."
- Accessibility: "Each button in a group should have a minimum 48x48dp target." "The button group container is not a focusable element.
  Initial focus should land on the first button in the group and then move to each button." "Use Tab to navigate to a button group, the
  arrow keys to navigate between each item in the group, and Space or Enter to select a focused button." "The button group container
  doesn't need to be labeled. Label each button according to the button and icon button accessibility guidance."

### Radio button (`/components/radio-button/…`)

- Guidelines: "Radio buttons are the recommended way to allow users to make a single selection from a list of options." "Use radio
  buttons to: Select a single option from a set; Expose all available options." "Use radio buttons when there are five or fewer
  options." "Consider using a drop-down menu instead of radio buttons when it's important to save space on a screen."
- "Always pair radio buttons with an adjacent label describing what the radio button selects." "Radio buttons should be vertically
  listed and have one option always selected." "Avoid using horizontal radio button lists." "A radio button is successfully selected
  when a person clicks or taps either the radio button icon or the label." "Radio buttons should take effect immediately, unless they're
  in a dialog or page that needs to be saved."
- Specs: colour roles "Primary, On surface variant"; "Use the color role on surface for adjacent text labels. This remains the same even
  if interacting with the label or component." Measurements: "Icon size 20dp, State layer size 40dp, Target size 48dp".
- Accessibility: "People should be able to select either the text label or the radio button to select an option." "Don't apply density
  to radio buttons by default. This lowers their targets below Material's recommendation of 48x48 CSS pixels." Keyboard: "Tab — Moves
  focus into the group to the selected radio button, or the first if none are selected"; "Arrows — Moves focus and selects the previous
  or next radio button. Wraps focus and selection between the first and last radio buttons."; "Space — Selects a focused radio button."
  "The accessibility label for a group of radio buttons is typically the same as its title. The role is Radio group."

### Lists (`/components/lists/guidelines`, `/specs`)

- Anatomy: "Trailing selection control - checkbox, radio button, switch". "Selection controls display list item actions. Position
  controls at the leading or trailing end of a list item … Use radio buttons to select a single item."
- "Lists can feature a single-selection component such as a radio button. Single-select list items: Don't support multi-actions …"
- Specs: "Target size must be at least 48x48dp". Slots: leading "Selection controls: Checkbox, radio button, or switch"; trailing "Action
  elements or text: Icon, icon button, or trailing text" and "Selection controls". "For selection lists, use only one selection
  interaction per list item." "Label left padding 16dp", "Leading element left padding 16dp", trailing element "Center" aligned.
- Lists print **no "sample" or "preview" trailing slot**: the trailing slot holds an icon, icon button, trailing text or a selection
  control. A list item may lead with "Leading media - image or video".

### Where M3 is silent

- M3 never says to switch between a connected button group and a radio list by measured width. It says "shouldn't wrap" and "consider
  smaller, narrower buttons" or "collapse into an overflow menu". The switch is **our rule**: a deviation, entry D1 below.
- M3 has no trailing "live sample" in a list item. The nearest printed slot is the trailing slot ("Action elements or text") or leading
  media. A small drawing of the look is **our rule**: a deviation, entry D2 below.
- Radio guidelines say five or fewer options and "consider using a drop-down menu" when space is tight. The owner chose a radio list,
  not a menu, for every count we have (at most five today, section 4). Not a deviation while a place has five or fewer.

## 4. Today: every place that uses the segmented button

26 places on `0.18` (ece1b62). Labels read from `src/i18n/en-US/`, `src/i18n/da-DK/` and `defaults/i18n/`. Widths are **estimates**
from the theme's CSS (`theme/styles/ui.css`, `.segmented-button`): each segment is a `1fr` grid column (equal while there is room, never
narrower than its content, so the frame overflows when the contents don't fit; labels never wrap or clip); 16 px padding each side, 8 px
gap, 18 px check or icon; a segment is about `32 + 7.5 px × characters`, plus 26 px when chosen or with an icon. Below 600 px the frame
takes the whole width, from 600 px it is as wide as its choices.

**The widths it really gets** (smaller than the brief's 400 px): a block's fields open in a side sheet 360 px wide (`--side-sheet-width:
22.5rem`) with 24 px padding, **312 px** of content from 840 px up, and a modal side sheet on a phone, **271 px** at 375 px. Section and row
settings: a bottom sheet on a phone (**335 px**), the side sheet from 840 px. Full pages: **343 px** at 375 px.

Fit columns: 271 (block sheet, phone) · 312 (side sheet, computer) · 335 (bottom sheet, phone) · 343 (page, phone). **=** fits with equal
segments, **~** one line but unequal, **X** overflows. en/da where they differ.

| # | Place (file) | Where the owner sees it | n | en-US / da-DK | Icons | Fits | A look? |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | `src/PreviewScreen.tsx:105` | Preview › window size | 5 | Compact 390 … Extra-large 1600 / Kompakt … Ekstra stor 1600 | – | X on a phone (its row scrolls sideways today) | no |
| 2 | `src/Library.tsx:890` | Account › Appearance | 3 | Light, Auto, Dark / Lys, Auto, Mørk | yes | page: = | no |
| 3 | `src/Library.tsx:913` | Account › Density | 3 | Large, Medium, Small / Stor, Mellem, Lille | yes | page: = | no |
| 4 | `src/LinkSheet.tsx:98` | Link sheet › The link goes to | 2 | Page, Other address / Side, Anden adresse | – | 335: = | no |
| 5 | `src/Colors.tsx:493` | Colors › generator › Contrast | 3 | Standard, Medium, High / Standard, Mellem, Høj | – | 343: ~ | no |
| 6 | `src/VersionSwitch.tsx:36` | Page or post › version to edit | 2 | Published, Scheduled (Draft) / Udgivet, Planlagt (Kladde) | – | = | no |
| 7 | `src/StoreSections.tsx:20` | Settings › Appstore | 3 | Themes, Connectors, Plugins / Temaer, Forbindelser, Udvidelser | – | 343: ~ (da: 7 px to spare) | no |
| 8 | `src/SectionSettings.tsx:20` | Section settings › Width | 2 | Like the text, Full width / Som teksten, Hele bredden | yes | 335 =, 312 ~/= | no |
| 9 | `src/standard/hero/index.tsx:36` | Banner › Placement | 2 | Beside, Behind the text / Ved siden af, Bag teksten | yes | 271 X/X, 312 ~/= | no |
| 10 | `src/standard/hero/index.tsx:48` | Banner › Width | 2 | Full width, Like the text / Hele bredden, Som teksten | yes | 271 X/X, 312 = | no |
| 11 | `src/standard/posts/index.tsx:71` | Blog posts › Design | 2 | List, Newest large / Liste, Det nyeste stort | yes | 271 ~/X, 312 =/~ | yes |
| 12 | `src/standard/testimonials/index.tsx:56` | Testimonials › Layout | 2 | Cards, List / Kort, Liste | yes | = | yes (icons enough) |
| 13 | `src/standard/cards/index.tsx:48` | Cards › Design | 3 | Outlined, Filled, Elevated / Med kant, Udfyldt, Hævet | yes | 271 X, 312 X, 343 ~ | **yes** |
| 14 | `src/standard/cards/index.tsx:61` | Cards › On phones | 2 | Stacked, Carousel / Stablet, Karrusel | – | = | no |
| 15 | `src/standard/cards/index.tsx:73` | Cards › Color (with Filled) | 4 | Surface, Primary, Secondary, Tertiary / Overflade, Primær, Sekundær, Tertiær | – | **X everywhere** | **yes** |
| 16 | `src/standard/cards/index.tsx:87` | Cards › Media | 4 | None, Icon, Image, Video / Intet, Ikon, Billede, Video | yes | **X everywhere** | no (icons) |
| 17 | `src/standard/buttons/fields.ts:67` | Button settings › Style (Buttons, Shared buttons, Price cards, a card's buttons) | 5 | Filled, Tonal, Elevated, Outlined, Text / Fyldt, Tonet, Hævet, Med ramme, Tekst | – | **X everywhere** but the computer dialog (~600 px) | **yes, the owner's case** |
| 18 | `src/standard/imagegrid/index.tsx:31` | Image grid › Images | 2 | All images with tags, Picked images / Alle billeder med tags, Valgte billeder | – | 271 X, 312 X, 343 ~/X | no |
| 19 | `src/standard/imagegrid/index.tsx:99` | Image grid › Card style | 3 | Filled, Elevated, Outlined / Fyldt, Hævet, Med kant | – | 271 X/~, 312 ~ | **yes** |
| 20 | `src/standard/imagegrid/index.tsx:111` | Image grid › Columns | 4 | Auto, 2, 3, 4 / Automatisk, 2, 3, 4 | – | 271 ~/X, 312 ~ | no |
| 21 | `src/standard/segmented/index.tsx:86` | Segmented list › Rows | 2 | Fold out, Always open / Fold ud, Altid åbne | yes | 271 ~/=, 312 = | no |
| 22 | `src/iconColor.ts:27` | a row's settings › Icon color (List, Segmented list, Cards) | 4 | Text, Primary, Secondary, Tertiary (`dots`: names for screen readers only) | swatches | = | already the colour |
| 23 | `src/Parts.tsx:920` | Developer › Parts › Editor › sample field | 3 | Light, Auto, Dark / Lys, Auto, Mørk | yes | = | no |
| 24 | `src/cmsWidgets.ts:36` | Edit dashboard › Blog rhythm › Post every | 3 | Week, Two weeks, Month / Uge, Anden uge, Måned | – | 335: ~ | no |
| 25 | `defaults/collections.ts:710` | Promotion › Action bar › item › Type | 2 | Button, Text / Knap, Tekst | – | = | no |
| 26 | `defaults/collections.ts:897` | Header button › Menu button position | 2 | Left, Right / Venstre, Højre | – | = | no |

Notes:

- Rows 1–7 call `SegmentedButton` directly; rows 8–26 are `select` fields with `segments: true` drawn by `src/fields.tsx:436`.
- **Apps** can declare `segments` and `dots` on any field (the shared `Field` type, `src/schema.ts`); `docs/app-contract.md` neither names
  nor limits it. No app in this repository uses it. So `segments: true` must keep working for apps (section 7).
- **The site** draws no segmented button: nothing in `theme/`, `pages/`, `site/`, `starter/` or `demo/` renders `segmentedButtonClass`
  (only `theme/ui/ripple.script.ts` and `site/themeParts.mjs` name it). The theme parts page (`src/ActionParts.tsx:115`) draws three demos,
  one multi-select (weekdays).
- Row 17 overflows since the pending note `buttons-style-segments` put its five styles side by side (0.18); this spec replaces that look
  before 0.18 is released, so that note must be rewritten or dropped in PR 2 (Q6).
- `src/BlockParts.tsx:68` (`versionsOf`) already draws a block once per option of its first `segments` field: the same data a sample needs.
- Estimates only: the `choice-group` screens unit of PR 2 measures the real widths.

## 5. The part: `ChoiceGroup`

### Name

`ChoiceGroup` (`theme/ui/ChoiceGroup.tsx`, `.choice-group` in `theme/styles/ui.css`), part id `ChoiceGroup` in `site/themeParts.mjs`
(prefixes `choice-group`). M3 has no single name for "a connected button group or a radio group, whichever fits"; the two forms it draws
keep their M3 names and classes: the button form **is** the theme's `ButtonGroup kind="connected"` with toggle `Button`s
(`.button-group-connected`, `.button[aria-pressed]`), and the list form **is** the theme's `List` with `RadioButton` controls
(`.list`, `.list-item-with-control`, `.radio-button`). `ChoiceGroup` only adds the wrapper, the measuring and the sample slot. So a theme
that styles button groups, lists and radio buttons already styles both forms; it never has to style a new look.

In the editor `src/ui.tsx` exports `ChoiceGroup` (same props as today's `SegmentedButton` plus the new ones) and `SegmentedButton` becomes
an alias of it for one version line, so nothing that calls it breaks; the build plan moves every caller and then removes the alias.

### API (theme part)

```ts
type Choice = {
  value: string;
  label: string;
  icon?: IconRef;          // only the button form shows it (before the label); the list form shows the sample instead, if any
  swatch?: string;         // a CSS colour: drawn as a filled circle (button form: in the check's place; list form: the sample)
  sample?: ReactNode;      // a live drawing of the look, in the list form's trailing slot (section 6)
  disabled?: boolean;
};

ChoiceGroup({
  label,                   // the choice's name: the group's accessible name and the list form's heading (legend)
  name,                    // the radio inputs' shared name (default: a useId())
  choices,                 // Choice[]
  value,                   // the chosen value (single-select only, see "Multi-select")
  onChange,                // (value) => void
  form,                    // 'auto' (default) | 'buttons' | 'list': forcing exists for the theme's own parts page and tests only
  dots,                    // as today: button form shows only the swatches, each named for screen readers
  disabled,
  className, ...rest       // data-… on the wrapper
})
```

`segmentedButtonClass` and the `SegmentedButton` theme file stay in the theme (unchanged) for themes and apps that import them (section 9).

### Which form, by measuring

Rule: **buttons when every button fits its label on one line at an equal share of the width; otherwise the list.** Precisely: the group
gets its container's width `W`. With `n` choices and the connected gap `g` (2 dp), each button gets `(W − (n − 1)·g) / n`. The button form
is used when, for every choice, *button padding + check (the selected state's, so the chosen one never grows) + gap + its label's natural
width* ≤ that share. One label too long, and the whole group is the list. Never more than five buttons (M3's cap): six or more is always
the list.

How it measures without a layout jump:

1. **Both forms are in the DOM from the start.** The wrapper (`.choice-group`) holds a hidden measuring row (`.choice-group-measure`: the
   button form with `visibility: hidden; position: absolute; inset-inline: 0; pointer-events: none`, `aria-hidden`, `inert`) and the
   visible form. The measuring row is laid out with the real theme classes, so fonts, density and the theme's own padding count.
2. **The first paint is decided before it is drawn.** The visible form is set by `data-form="buttons" | "list"` on the wrapper; CSS shows
   one and hides the other by that attribute. The measuring runs in `useLayoutEffect`, which runs after layout and before the browser
   paints, so the first frame the person sees already has the right form. Markup rendered without the effect (server, or before
   hydration) carries `data-form="list"`: the form that can never overlap.
3. **`ResizeObserver` on the measuring row and the wrapper** re-runs the comparison (the widest button of the measuring row × n + gaps
   against the wrapper's width) and updates `data-form`. A resize, a sheet opening wider, a density change and a language change all
   re-run it, because they change the observed sizes.
4. **Font load.** `document.fonts.ready` and `document.fonts.onloadingdone` re-measure once (Roboto Flex loads after first paint on a cold
   cache).
5. **Hysteresis.** Switching back from the list to buttons needs 8 dp more than the switch to the list, so a width at the edge never
   flips back and forth while a sheet animates.
6. **No jump inside a sheet's open animation:** the choice is made from the final size (the observer fires on the settled size; a sheet
   animates `transform`, not width).

Equal widths: the rule compares the **widest** button against the equal share, because the connected group gives every button the same
width (M3: "increasing the button widths inside").

### The button form

Exactly the theme's connected button group: `ButtonGroup kind="connected"` with one `Button kind="outlined"` toggle per choice
(`aria-pressed`), size small (40 dp high container, 48 dp target), round shape; the selected one changes shape (M3: "A selected button
should change shape") and colour by the theme's existing toggle tokens (`--button-toggle-*`, `--button-outlined-selected-*`). The check
mark is the theme's existing selected icon, shown in the icon's place (M3 segmented guidelines: "the icon label is replaced by the
checkmark icon when the segment is selected"; for the connected group M3 prints no check, so the check is kept only because the measuring
already reserves its width: open question Q3). Width: the whole width of its container (M3: "should span the width of the page or
surface"), at most `--choice-group-max-width` (default `30rem`) from the medium window up (M3: "consider adding a maximum width").
Equal widths (M3: "increasing the button widths inside").

### The list form

The theme's `List` (standard kind, dividers none) inside a `RadioGroup` fieldset, its legend the group's `label`. Each choice is a
`ListItem` with `control={{ type: 'radio-button', at: 'leading', name, value, checked }}`: the whole row is the `<label>`, so a tap
anywhere chooses (M3: "select either the text label or the radio button"). One line, at least 48 dp high (M3 lists: "Target size must be
at least 48x48dp"; radio: "Target size 48dp"), the theme's list item padding (16 dp before the control, M3's "Leading element left
padding 16dp"). Colours from the theme's tokens only: radio `--mo-primary` / `--mo-on-surface-variant`, label `--mo-on-surface` (M3:
"Use the color role on surface for adjacent text labels"), state layers the list's. A chosen row is not filled (M3 draws a radio list
plain; the segmented list's selected surface is for navigation), so the dot is the only selected mark.

The trailing slot holds the sample, if any (section 6), vertically centred (M3: trailing element "Center"). A disabled choice is
greyed and skipped by the arrow keys (native radios do that).

### Keyboard and screen readers

- **List form:** native radio buttons in one `<fieldset>` with its `<legend>`: role radiogroup, named by the legend. Tab moves into the
  group to the chosen radio and out again; arrow keys move and choose, wrapping; Space chooses. All of this is the browser's, exactly as
  M3's table prints it.
- **Button form:** one `role="group"` named by `label` (M3 says the container needs no label; we keep it because a screen reader then
  says what the choice is about, as today), each button a toggle (`aria-pressed`). Keyboard as M3's accessibility page prints it for
  button groups: Tab lands on the first button (we land on the chosen one: roving `tabindex`, so Tab moves past the group in one step),
  arrow keys move between buttons, Space or Enter selects. This is a roving-tabindex script in the part (no library).
- Only the visible form is in the accessibility tree; the measuring row is `aria-hidden` and `inert`. When the form switches while a
  choice has focus, focus moves to the same value in the other form.
- A sample is `aria-hidden`: the label names the choice; the sample is decoration.

### Density, motion, tokens

- Density: the button form follows the buttons' density (M3: "Button groups adapt to density of the buttons inside"); the list rows
  follow the list's density but never below 48 dp (M3 radio: "Don't apply density to radio buttons by default"). `check:density` gets the
  part's heights in its list.
- Motion: the selected button's shape change uses the theme's `--motion-spatial-fast` (as the button group does today); the radio dot
  `--motion-effects-fast`. The switch between forms is **not animated** (it happens on resize; an animation would read as a jump). All
  of it off under `prefers-reduced-motion`, as the theme does everywhere.
- New tokens (only what the part adds; the forms' looks are the button group's, the list's and the radio button's tokens):
  `--choice-group-max-width`, `--choice-group-gap` (between the legend and the list), `--choice-group-sample-max-width` (default `7rem`),
  `--choice-group-sample-gap`.

### Multi-select

Today one place uses a multi-select segmented button: the theme parts page's weekday demo (`src/ActionParts.tsx`), no field. `ChoiceGroup`
is single-select only. Multi-select keeps the connected button group with toggles (or checkboxes in a list): out of scope here.

## 6. Samples

A caller passes `sample` per choice (a React node), or, for a schema field, one new key on the select field:
`sample?: 'button' | 'card' | 'list' | 'color' | 'swatch'` (`src/schema.ts`). An app can use it too (it is data). `src/fields.tsx` maps the key to a small renderer
(`src/choiceSamples.tsx`) that draws the theme's own part in each choice's look, with the entry's own values where they make sense:

| Key | Draws | From the entry | Size |
| :--- | :--- | :--- | :--- |
| `button` | the theme's `Button` in the choice's kind (`filled`, `tonal`, `elevated`, `outlined`, `text`), size extra small | the button's own label (`textOf`), cut to 8 characters with `…`; empty: the editor text `Button` (da-DK `Knap`) | ≤ 7rem wide |
| `card` | a tiny `Card` in the choice's design (outlined, filled, elevated), with two short lines in its text colour | none | 56 × 40 dp |
| `list` | a tiny drawing of the layout (a list, or the newest post large; cards or a list) | none | 56 × 40 dp |
| `color` | a 40 × 24 dp rounded tile in the colour role (surface, primary, secondary, tertiary container) with a line of its on-colour | none | 40 × 24 dp |
| `swatch` | the option's `swatch` as a filled circle (today's dots) | none | 20 dp |

The sample is drawn with the theme's live classes, so it follows the theme, the density and light/dark mode; it is never an image.
It is inert (`inert`, `aria-hidden`, `pointer-events: none`), so a tap on it chooses the row. It is shown only in the list form.
In the button form, `icon` and `swatch` show as today; `sample` does not.

Which places get a sample (the owner decides; Q1):

- **Button style** (row 17, `button`): yes, decided by the owner.
- Recommended, flagged for the owner: **Cards › Design** (row 13) and **Image grid › Card style** (row 19), `card`; **Cards › Color**
  (row 15), `color`. Each is a look judged by eye, its names (Filled, Elevated, Tertiary …) mean little to most site owners, and all three
  overflow today, so they will show as the list.
- Possible, not recommended now: **Blog posts › Design** (row 11) and **Testimonials › Layout** (row 12), `list`: two choices with icons
  that mostly fit as buttons, where a sample never shows.
- No sample: everything else (widths, placement, columns, media, rows, settings of the editor itself): not a look, or icons say it.
  Icon color (row 22) keeps its swatches.

## 7. Theme rules

- The part is the theme's: `theme/ui/ChoiceGroup.tsx` + its section in `theme/styles/ui.css` with the header comment the other parts have
  (classes and tokens), shown on the theme parts page (`#udseende/dele/ui`, `src/ActionParts.tsx`) in place of the segmented button's demo:
  one group of three short choices (buttons) and the same group forced to the list (`form="list"`) with button samples, plus a narrow
  frame (320 px) where the auto form is the list.
- `site/themeParts.mjs` gets `{ id: 'ChoiceGroup', group: 'ui', prefixes: ['choice-group'] }`. `SegmentedButton` stays listed while its
  file stays.
- An installed theme overrides a UI part per file (`@theme/ui/…`, `themePlugin`): a theme without `ChoiceGroup.tsx` gets the default
  theme's, which draws with the classes the theme already styles (`button-group`, `list`, `radio-button`). Nothing a theme or an app has
  stops working: **no `THEME_API` or `APP_API` change**. `SegmentedButton` stays exported from the theme and `src/themeUi.ts`
  (apps may draw it, contract 4/5); it is removed only with a `THEME_API` raise, not in 0.18 (Q4).
- The editor has no style of its own for it: everything from the theme's tokens (`CLAUDE.md`, *One theme*).

## 8. Texts, release note, deviations

- **Texts.** No new label: every place keeps its own label and choice names. One new editor text for the button sample's fallback,
  en-US `Button`, da-DK `Knap` (`src/i18n/*/blocks.ts`). The theme parts page gets its demo's words in both languages (en-US first).
  Danish labels are checked for fit by the same measuring, no special case.
- **Release note** (PR 2, the first that changes what an owner sees), a `paragraph`, mark `improvement`:
  - en-US, title *Style choices*: "Choices like a button's style no longer squeeze together in a narrow sheet. When they don't fit on one
    line, they show as a list, one per row, and the button style shows a small sample of each. Short choices stay side by side."
  - da-DK, title *Valg af stil*: "Valg som en knaps stil bliver ikke længere klemt sammen i et smalt ark. Når de ikke kan være på én
    linje, vises de som en liste med ét valg pr. række, og knapstilen viser et lille eksempel på hver. Korte valg står stadig side om side."
- **Deviations** for `docs/material-deviations.md`, added in PR 1 (section *Choice group*):
  - **D1. One part switches between a connected button group and a radio list by measured width.** Material: "Button groups should move
    through layouts together in a single line. They shouldn't wrap to a second line." "In compact windows, consider using smaller,
    narrower buttons" and trailing buttons may "collapse into an overflow menu". We do: when the buttons' labels do not fit at an equal
    share of the width, the same choice is drawn as a vertical list of radio buttons instead. Why: owner, 14 Nov 2026: "One theme part
    that chooses its own form by measuring, so it can never squeeze … it never wraps a group and never overlaps." Smaller buttons still
    clip long or Danish labels, and an overflow menu hides choices the owner compares. Date 2026-11-14, PR: PR 1.
  - **D2. A radio row shows a small live sample of the look in its trailing slot.** Material: a list item's trailing slot holds "Action
    elements or text: Icon, icon button, or trailing text" or a selection control. We do: a choice that is a look (a button style, a card's
    design or colour) shows a small, inert drawing of that look there. Why: owner, 14 Nov 2026: "Where a choice is a
    look … each radio row shows a small live sample on its right." Date 2026-11-14, PR: PR 1.
  - (The radio guidelines' "five or fewer options" holds for every place today; no entry.)

## 9. Checks

- `npm run check` on every PR.
- `npm run check:screens` (after `npm run build`): a new unit **`choice-group`** in `scripts/editor-screens.mjs` that opens every place of
  section 4 at **375 px and 1280 px** wide (so in the 271 px modal sheet and the 312 px side sheet) and asserts: no two choices' boxes overlap; no label is clipped (`scrollWidth ≤ clientWidth`);
  the form is `buttons` only if all fit; every list row is ≥ 48 px high; every button target ≥ 48 px; the group's name is read
  (`role=group` or `fieldset > legend`); in the list form arrow keys change the value. The same in Danish (`da-DK`), at both widths.
  The owner's case (Buttons › Button settings › Style in the side sheet) is a named assertion: at 375 px and at 1280 px it is the list
  with five samples.
- `node ../../../bin/morpheme.mjs check:themes` in `.morpheme/demo/site/`: the part draws with each installed theme (falling back to the
  default file).
- `npm run check:demo`, `npm run check:editor-colors` (the samples are in `src/` but use the theme's classes; no fixed colour),
  `npm run check:density` (the new heights), `npm run check:language` (new texts).
- `npm run check:contrast` by hand on PR 1 and PR 2: the radio, its label and the samples on every section colour, light and dark.

## 10. Build plan (PRs into `0.18`, mergeable one by one)

Every PR: base `0.18`, one changeset (skill `changesets`; `minor` for a visible change, empty for none), `check` green, link and head sha
to the PM. **Every visible PR follows this rule: "When a change the owner can see (the editor or the site) is done and `check` is green,
add before and after screenshots of every changed screen to a comment on your own pull request, as the `pm` skill's *Screenshots in the
pull request* says, and tell the PM with the link and head sha. A change nobody sees needs none."**

1. **PR 1, the part** (`minor`, visible on the theme parts page; screenshots of `#udseende/dele/ui`). `theme/ui/ChoiceGroup.tsx`, its
   CSS and header comment in `theme/styles/ui.css`, measuring (section 5) as a small hook in the theme file, the roving-tabindex keyboard
   for the button form, `site/themeParts.mjs`, `src/themeUi.ts` export, the theme parts page demo, unit tests for the fit rule (pure
   function `fitsAsButtons(widths, W, gap)` with hysteresis, in `theme/ui/choiceGroupFit.mjs` + `.test.mjs`), the `check:density` list
   entry, the two deviation entries (D1, D2). No place changes yet. The `choice-group` screens unit for the parts page.
2. **PR 2, the fields** (`minor`; release note of section 8). `ChoiceGroup` in `src/ui.tsx`; `fields.tsx` draws every `segments: true`
   field with it; the `sample` key in `src/schema.ts` and `src/choiceSamples.tsx` with `button` only; the Buttons block's `kind` field
   gets `sample: 'button'`; the pending note `buttons-style-segments` is dropped (Q6). The screens unit covers every field place of section 4 (en-US and da-DK, 375 and 1280). Screenshots: Button
   settings before/after at both widths, plus each changed field place.
3. **PR 3, the editor's own places** (`minor`): the direct `SegmentedButton` callers of section 4 (rows 2–7; row 1 only if the owner
   says so, Q7) move to `ChoiceGroup`; the alias in `src/ui.tsx` stays only while row 1 uses it. Screenshots of each.
4. **PR 4, more samples** (`minor`, only for what the owner says yes to in Q1): the `card` and `color` renderers (and `list` if wanted)
   and the fields that get them (rows 13, 15, 19). Screenshots of each.
5. **PR 5, rename the field key** (empty changeset if nothing visible): `segments: true` keeps working; the docs and the schema comment
   call it the choice group (`choices: 'auto'` as an alias only if the owner wants the new name in app.json, Q4). Optional.

PR 1 must merge before 2; 3 and 4 after 2, in any order.

## 11. Open questions for the owner (each with a recommendation)

- **Q1. Samples beyond the button style.** Cards › Design, Image grid › Card style and Cards › Color are looks too. *Recommendation: yes
  for these three (PR 4); not for Blog posts › Design and Testimonials › Layout, which fit as buttons with icons.*
- **Q6. The pending note `buttons-style-segments`** says the five styles show side by side. *Recommendation: PR 2 drops it, and the
  *Style choices* note of section 8 covers the change.*
- **Q7. Preview window size (row 1)** has five long choices that scroll sideways on a phone today. With the part they become a list of
  five rows in the Preview's top area. *Recommendation: keep it out of this work (PR 3 leaves it) and give the Preview its own look later,
  since the list would push the preview down.*
- **Q2. A chosen radio row: plain or filled?** M3 draws a radio list plain; a filled row (secondary container) is easier to spot in a long
  sheet. *Recommendation: plain, as M3 prints it; the dot and, where there is one, the sample are enough.*
- **Q3. The check mark in the button form.** M3 prints a check for segmented buttons, not for the connected button group (it changes shape
  and colour). *Recommendation: drop the check: the buttons get more room for labels, and the group matches M3's connected group exactly.*
- **Q4. Keep `SegmentedButton` for themes and apps.** *Recommendation: keep the theme file and its export through 0.18 (apps may draw it),
  remove it with the next `THEME_API` raise; inside the CMS no caller is left after PR 3.*
- **Q5. Maximum width of the button form on a computer.** M3: "consider adding a maximum width". *Recommendation: 30rem (480 dp), so three
  choices in a wide dialog don't stretch across it.*
