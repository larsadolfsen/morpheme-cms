# Material 3 coverage scan: does the theme have every component and variant?

Date: 25 Nov 2026. Branch `docs-m3-coverage-scan` (docs only). Asked by the owner on 25 Nov 2026: scan Material 3 again,
including variants, because some were forgotten.

Method: every page of every component on https://m3.material.io/components was read with Playwright (skill `material-3`,
*Reading the real pages*): 37 components, four tabs each (Overview, Specs, Guidelines, Accessibility) = 148 pages, plus the
index and the *All buttons* overview. Variants and configurations are taken from what the Overview and Specs pages print
(the "Variants" and "Configurations" sections and their tables, "M3" and "M3 Expressive" columns). Ours is read from
`theme/ui/*.tsx` (props), `theme/styles/ui/*.css`, `theme/styles/tokens/`, and `docs/m3-tokens/`. Where M3 has an Expressive
variant, that is the one listed (skill rule 4); a baseline M3 variant that M3 itself marks "no longer recommended" is listed
as such.

## Summary

**37 components checked** (148 pages read), **90 variant rows**: **73 present**, **6 partly**, **7 missing**,
**2 not checked** in the code, **2 not applicable** (voice input; list reorder, which the Lists pages do not print).

The result is better than the rough pass suggested: **the tab bar variants are not forgotten** (`Tabs kind="primary" | "secondary"`,
fixed or scrollable, `theme/ui/Tabs.tsx`). Almost every variant M3 prints exists. What is missing is a short list:

1. The **Medium button size** (M3 prints five sizes XS, S, M, L, XL; `buttonSizes` has no `medium`; the split button and the
   button groups share it).
2. **Autocomplete** (M3 prints it inside Menus, *Filtering*: a menu with a text field that filters; token sets
   `md.comp.filled-autocomplete` and `md.comp.outlined-autocomplete` sit in `docs/m3-tokens/` with no user).
3. **Scroll fields** and the **scroll time picker** (new Expressive, Oct 2026; the time picker is being built by another session).
4. **Context menu** (right-click menu; Menus, *Context menus*).
5. **Swipe to reveal** on a list item (Lists, *List interactions*).
6. **Carousel layout "uncontained multi-aspect ratio"** (new, Nov 2025).
7. Smaller ones: the **docked toolbar with an embedded primary action**, **button group selection configurations**
   (single, multi, selection-required as a prop), and the **divided search style** (only reachable by tokens).

## Tables

Status: **present** (where), **partly** (what is missing), **missing**, **n/a** (why). "Gallery" means the editor's
*Developer › Parts › UI components* (`src/BlockParts.tsx`); this scan did not check which variants the gallery shows, only
that the component has the prop or the class.

### Actions

| Component | M3 variants printed | Ours | Status | File / where |
| :--- | :--- | :--- | :--- | :--- |
| Buttons | Kinds: elevated, filled, tonal, outlined, text | `kind` | present | `theme/ui/Button.tsx` |
| Buttons | Sizes: XS, S (default), M, L, XL | `xsmall`, `small` (default), `large`, `xlarge`; no `medium` (`buttonSizes`; no `.mo-is-medium` in `buttons.css`); token set `md.comp.button.medium` is in `docs/m3-tokens/` | partly (Medium missing) | `Button.tsx:21`, `theme/styles/ui/buttons.css` |
| Buttons | Shapes: round, square; shape morphs on press and on select | `shape`; selected turns square; pressed radius | present | `Button.tsx`, `buttons.css` |
| Buttons | Default and toggle (text button never toggles) | `selected` (aria-pressed) | present | `Button.tsx` |
| Buttons | Optional leading icon | `icon`, also `trailingIcon` | present | `Button.tsx` |
| Button groups | Standard (E) | `kind="standard"` | present | `theme/ui/ButtonGroup.tsx` |
| Button groups | Connected (E; replaces the segmented button) | `kind="connected"` | present | `ButtonGroup.tsx` |
| Button groups | Sizes XS to XL | follows the Button's sizes | partly (no M, as buttons) | `ButtonGroup.tsx` |
| Button groups | Round and square | follows the buttons' `shape` | present | `ButtonGroup.tsx` |
| Button groups | Single-select, multi-select, selection-required | `selected` on each button; the block's script decides; no group prop. `ChoiceGroup` is single-select | partly (no group-level selection mode) | `ButtonGroup.tsx`, `ChoiceGroup.tsx` |
| Button groups | Contains buttons and icon buttons | both | present | `ButtonGroup.tsx` |
| Segmented buttons | Single-select, multi-select (not recommended; use connected group) | `SegmentedButton`, `multiple` | present, to be removed (being renamed by another session) | `theme/ui/SegmentedButton.tsx` |
| Icon buttons | Colour: standard, filled, tonal, outlined | `kind` | present | `theme/ui/IconButton.tsx` |
| Icon buttons | Sizes XS, S (default), M, L, XL | `size` (all five) | present | `IconButton.tsx:21` |
| Icon buttons | Widths narrow, default, wide; shapes round, square | `width`, `shape` | present | `IconButton.tsx` |
| Icon buttons | Default and toggle | `selected` | present | `IconButton.tsx` |
| Split button | Colours elevated, filled, tonal, outlined (E) | `kind` | present | `theme/ui/SplitButton.tsx` |
| Split button | Sizes XS to XL | Button's `size` (no M) | partly (no M, as buttons) | `SplitButton.tsx` |
| Split button | Menu button spins and changes shape when open | round while `aria-expanded` | present | `SplitButton.tsx` |
| FAB | FAB, medium, large (E); small is no longer recommended | `size`: `fab`, `medium`, `large` | present | `theme/ui/Fab.tsx` |
| FAB | Colours: primary, secondary, tertiary (tone) and their containers (E); surface and branded are deprecated | six `kind`s | present; deprecated ones n/a (M3 deprecates them) | `Fab.tsx:16` |
| Extended FAB | Small, medium, large (E) | `extendedFabSizes` | present | `Fab.tsx:21` |
| Extended FAB | Collapse to icon only | `collapsed` | present | `Fab.tsx` |
| FAB menu | Primary, secondary, tertiary colour sets; 2 to 6 items; opens from any FAB size, not from an extended FAB | `kind`, `fabKind`, `size`, `items` | present | `theme/ui/FabMenu.tsx` |

### Containment

| Component | M3 variants printed | Ours | Status | File / where |
| :--- | :--- | :--- | :--- | :--- |
| Cards | Elevated, filled, outlined | `kind`; `dragged`; link or button card | present | `theme/ui/Card.tsx` |
| Carousel | Multi-browse | `layout="multi-browse"` | present | `theme/ui/Carousel.tsx` |
| Carousel | Uncontained | `layout="uncontained"` | present | `Carousel.tsx` |
| Carousel | Uncontained multi-aspect ratio (new Nov 2025) | no layout of that name | missing | `Carousel.tsx`, `carouselLayout.ts` |
| Carousel | Hero, centre-aligned hero | `layout="hero"`, `alignment` start or center | present | `Carousel.tsx` |
| Carousel | Full-screen | `layout="full-screen"` | present | `Carousel.tsx` |
| Dialogs | Basic; full-screen (compact only) | `kind` basic or full-screen | present | `theme/ui/Dialog.tsx` |
| Dialogs | Basic dialog with a custom position (page prints "Dialog custom positioned on the right side") | not checked | not checked | `Dialog.tsx` |
| Divider | Full-width, inset, middle inset | `kind` | present | `theme/ui/Divider.tsx` |
| Divider | Vertical | `vertical` | present | `Divider.tsx` |
| Lists | Expressive (segmented) and standard styles; baseline is not recommended | `kind="standard"` or `"segmented"` | present | `theme/ui/List.tsx` |
| Lists | One, two, three lines | `lines` | present | `List.tsx` |
| Lists | Leading: avatar, image, video, icon, text-only, checkbox, radio; trailing switch | `leadingAvatar`, `leadingImage`, `leadingVideo`, `leadingIcon`, `control` | present | `List.tsx` |
| Lists | Selection: single-select, multi-select, single-action and multi-action items | `selected`, `control`, `selectable`, `actions` | present | `List.tsx` |
| Lists | Expand and collapse | `expand` (native `<details>`) | present | `List.tsx`, `listExpand.test.mjs` |
| Lists | Swipe to reveal | none | missing | `List.tsx` |
| Lists | Reorder: the Lists pages print no reorder; token set `md.comp.list.reorder` exists, and the Cards and Chips guidelines print reorder by pick up and move | `dragged` state on a list item | n/a on the Lists pages; the token set has no clear M3 text | `docs/m3-tokens/md.comp.list.reorder.json` |
| Bottom sheets | Standard, modal | `kind` | present | `theme/ui/BottomSheet.tsx` |
| Side sheets | Standard, modal; optional back icon | `kind`, `onBack` | present | `theme/ui/SideSheet.tsx` |
| Side sheets | Right-to-left: sheet on the left edge | not checked (no RTL language on the product) | not checked | `SideSheet.tsx` |
| Badges | Small (dot), large (number, 4 characters max) | `count` or none, `max` | present | `theme/ui/Badge.tsx` |
| Chips | Assist, filter, input, suggestion; elevated; dragged | `kind`, `elevated`, `dragged` | present | `theme/ui/Chip.tsx` |
| Tooltips | Plain; rich (title, text, link or buttons) | `text`, or `subhead`, `supportingText`, `action` | present | `theme/ui/Tooltip.tsx` |
| Snackbar | One or two lines; action; close; longer action | all | present | `theme/ui/Snackbar.tsx` |

### Navigation

| Component | M3 variants printed | Ours | Status | File / where |
| :--- | :--- | :--- | :--- | :--- |
| App bars | Search app bar (E) | `kind="search"` | present | `theme/ui/TopAppBar.tsx`, `AppBar.tsx` |
| App bars | Small; text alignment centred (centre-aligned merged into small) | `small`, `align="center"` | present | `TopAppBar.tsx` |
| App bars | Medium flexible, large flexible (E); medium and large are no longer recommended | `medium-flexible`, `large-flexible`, `collapsed` | present | `TopAppBar.tsx` |
| App bars | Subtitle; surface container on scroll | `subtitle`; `data-stuck` | present | `TopAppBar.tsx` |
| Navigation bar | Flexible (E), vertical and horizontal items; badges | `iconPosition` top, start, auto | present | `theme/ui/NavigationBar.tsx` |
| Navigation drawer | Standard, modal (no longer recommended; use the expanded rail) | `variant` | present, deprecated by M3 | `theme/ui/NavigationDrawer.tsx` |
| Navigation rail | Collapsed, expanded (E) | `expanded` | present | `theme/ui/NavigationRail.tsx` |
| Navigation rail | Expanded: non-modal or modal; behaviour: collapse or hide | `modality`, `expandedBehavior` | present | `NavigationRail.tsx` |
| Navigation rail | Sections, FAB slot, badges, trailing text | `NavigationRailSection`, `fab`, `badge`, `trailingSupporting` | present | `NavigationRail.tsx` |
| Tabs | Primary, secondary | `kind` | present | `theme/ui/Tabs.tsx` |
| Tabs | Scrollable, fixed; badges | `scrollable`, `badge` | present | `Tabs.tsx` |
| Toolbars | Docked (E; replaces the bottom app bar) | `kind="docked"` | present | `theme/ui/Toolbar.tsx` |
| Toolbars | Floating (E), horizontal and vertical | `kind="floating"`, `vertical` | present | `Toolbar.tsx` |
| Toolbars | Standard and vibrant | `color` | present | `Toolbar.tsx` |
| Toolbars | Floating with a FAB | `fab`, `expanded` | present | `Toolbar.tsx` |
| Toolbars | Docked with an embedded primary action instead of a FAB (overview image caption) | `fab` is described for floating only; a button as a child may do it | partly (not verified) | `Toolbar.tsx` |
| Search | Contained style (E) with search bar and search view; full-screen and docked layouts | `Search`, `SearchView` | present | `theme/ui/Search.tsx`, `search.css` |
| Search | Divided style (baseline) | only by overriding two tokens (`search.css:201`) | partly | `theme/styles/ui/search.css` |
| Search | Results in groups, separated by gaps; filter chips | groups with labels, `filters` | present; gaps not checked | `Search.tsx` |
| Menus | Vertical menu, standard and vibrant colour (E); baseline still available | `color` | present | `theme/ui/Menu.tsx` |
| Menus | Grouped: gap or divider; submenus; selected items | `groups`, `submenu`, `selected` | present | `Menu.tsx` |
| Menus | Context menu (secondary click) | none | missing | none |
| Menus | Filtering (a text field in the menu that filters it, "also known as autocomplete") | none | missing | none |

### Selection

| Component | M3 variants printed | Ours | Status | File / where |
| :--- | :--- | :--- | :--- | :--- |
| Checkbox | Unselected, selected, indeterminate; error | `checked`, `indeterminate`, `error` | present | `theme/ui/Checkbox.tsx` |
| Radio button | Selected, unselected | `RadioButton`, `RadioGroup` | present | `theme/ui/RadioButton.tsx` |
| Switch | With and without icon in the handle | `icons` | present | `theme/ui/Switch.tsx` |
| Sliders | Standard, centred, range; stops | `centered`, `range`, `stops` | present | `theme/ui/Slider.tsx` |
| Sliders | Five sizes, horizontal and vertical, inset icon | `size`, `orientation`, `icon` | present | `Slider.tsx` |
| Date pickers | Docked; modal; modal input | `kind` docked or modal, with keyboard input mode | present | `DatePicker.tsx`, `DatePickerContainer.tsx` |
| Date pickers | Date range | `range` (modal) | present | `DatePicker.tsx` |
| Time pickers | Dial (E), vertical and horizontal; 12 and 24 hour | `orientation`, `timeFormat` | present | `TimePickerContainer.tsx` |
| Time pickers | Input (E) | input mode | present | `TimePickerContainer.tsx` |
| Time pickers | Scroll (new, Oct 2026) | none yet | missing (being built by another session) | none |
| Scroll fields | Scroll and input modes; small, medium, large; finite or looping; combinable | none | missing | none |

### Text input

| Component | M3 variants printed | Ours | Status | File / where |
| :--- | :--- | :--- | :--- | :--- |
| Text fields | Filled, outlined | `kind` | present | `theme/ui/TextField.tsx` |
| Text fields | Leading and trailing icon, prefix, suffix, supporting text, character counter, multi-line, error, read-only | all | present | `TextField.tsx` |
| Text fields | Dropdown (select) | `TextFieldMenu`, `ExposedDropdownMenu` | present | `TextFieldMenu.tsx` |
| Text fields | Autocomplete (token sets `md.comp.filled-autocomplete`, `md.comp.outlined-autocomplete`) | none | missing | none |
| Text fields | Voice input icon; image in the field (printed in the guidelines as optional elements) | not built | n/a for voice (needs speech input); image missing, low value | none |

### Loading and progress

| Component | M3 variants printed | Ours | Status | File / where |
| :--- | :--- | :--- | :--- | :--- |
| Progress indicators | Linear, circular; determinate, indeterminate | `LinearProgressIndicator`, `CircularProgressIndicator`, `value` | present | `theme/ui/ProgressIndicator.tsx` |
| Progress indicators | Shape flat or wavy (E); thickness default (4 dp) or variable | `shape`, `thick` | present | `ProgressIndicator.tsx` |
| Loading indicator | Uncontained, contained (E) | `contained` | present | `theme/ui/LoadingIndicator.tsx` |

## Gaps, ranked

Sizes are guesses. Roadmap lines come from `docs/superpowers/plans/2026-11-14-roadmap-0-18-to-0-24.md`; the owner and the
CTO decide, these are only where each one fits.

| # | Gap | Size | Could belong to |
| :-: | :--- | :--- | :--- |
| 1 | Button size Medium (`Button`, `SplitButton`, `ButtonGroup`); tokens exist | small | 0.19.6 (M3 names) if the owner wants it before 0.20, else 0.26.0 (rest of the M3 audit, "button sizes") |
| 2 | Scroll time picker (in progress elsewhere) and scroll fields | medium | 0.19.6 or 0.26.0; the time picker is already assigned |
| 3 | Autocomplete: filtering menu plus filled and outlined text field (the menu-with-text-field pattern; `Search` already has a combobox) | medium | 0.26.0 |
| 4 | Divided search style as a real kind (today two tokens) | small | 0.26.0 |
| 5 | Carousel "uncontained multi-aspect ratio" layout | medium | 0.23.x (cards and lists) or 0.26.0 |
| 6 | Docked toolbar with embedded primary action | small | 0.26.0 (verify first) |
| 7 | Button group selection modes (single, multi, selection-required) as a prop, not per block | medium | 0.26.0; also removes the need for `SegmentedButton`/`ChoiceGroup` logic per block |
| 8 | Swipe to reveal on list items | medium | 0.24 (Lists and data) or 0.26.0 |
| 9 | Context menu | medium | 0.26.0, only if a screen needs it; no screen asks for one today |
| 10 | Image in a text field | small | not worth a line yet |

Also settled by this scan: **the segmented button** stays until the other session finishes replacing it with the connected
button group; the **navigation drawer**, **FAB small, surface and branded**, **baseline medium and large app bars**, the
**bottom app bar** and the **divided/baseline list and menu** are marked "not recommended" or deprecated by M3 itself, so
their absence (or presence) is not a gap.

## Not checked, not printed, or not readable

- All 148 component pages and both index pages loaded; none failed to read.
- The Accessibility tabs were fetched but not read for variants (they print behaviour, not variants).
- Specs pages hold token tables and many numbers; this scan read their variant and configuration sections and headings,
  not every measurement. A variant that only appears in a measurement figure (image) cannot be seen in the text and was not
  screenshotted.
- Which variants the editor's component gallery shows was not checked, only the props and classes in `theme/ui` and the CSS.
- Dialog custom position and side sheet right-to-left placement: not checked in the code.
- `md.comp.list.reorder` (a token set in `docs/m3-tokens/`) has no matching text on the Lists pages: this is not explained
  by what the pages print.
- The scan does not check whether a present variant matches M3's measurements (that is the job of `check:m3-tokens`
  and `check:m3-render`).
- Lists of Expressive versus baseline status come from the "M3" and "M3 Expressive" columns on each Specs page; the
  platform availability tables (Flutter, Compose, Web) were not used.

## URLs read

Index: `https://m3.material.io/components`, `https://m3.material.io/components/all-buttons` (overview).

For each of these, `/overview`, `/specs`, `/guidelines` and `/accessibility` under `https://m3.material.io/components/`:
`app-bars`, `badges`, `buttons`, `button-groups`, `extended-fab`, `fab-menu`, `floating-action-button`, `icon-buttons`,
`segmented-buttons`, `split-button`, `cards`, `carousel`, `checkbox`, `chips`, `date-pickers`, `time-pickers`, `dialogs`,
`divider`, `lists`, `loading-indicator`, `progress-indicators`, `menus`, `navigation-bar`, `navigation-drawer`,
`navigation-rail`, `radio-button`, `scroll-fields`, `search`, `bottom-sheets`, `side-sheets`, `sliders`, `snackbar`,
`switch`, `tabs`, `text-fields`, `toolbars`, `tooltips`.
