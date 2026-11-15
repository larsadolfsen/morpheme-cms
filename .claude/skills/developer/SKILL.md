---
name: developer
description: Use first in every session that builds, fixes or documents something in morpheme-cms - "developer", "build session", "fix", "docs session", "pull request", "before you start". The entry point for every developer session: which rules and skills to read, what a pull request owes the PM, and the owner's standing design rules.
---

# Developer session

Announce "Using developer". Every session that builds, fixes or documents something in this repository starts here,
before it reads the task further. This skill only says what to read and what to do; each rule lives in one place, and
this skill points to it. Never work from memory of a skill: load it.

## The hard rule: no own components

Owner rule. **Developers do not invent their own components.** Every control and surface (button, chip, field, list
item, sheet, dialog, menu, card, bar, panel …) is the theme's existing component, used through `src/ui.tsx`
(`theme/ui`). Look in `theme/ui` and `src/ui.tsx` first, and in the list in section 5.

- If the component is missing, or deviates from Material 3, build or fix it **in the theme** (`theme/ui` and its CSS),
  M3-conform after reading the real M3 pages with Playwright (`material-3`), show it in the theme's component gallery
  (the editor's *Developer › Parts › UI components*, `#developer/parts/ui`, `src/BlockParts.tsx`), and then use it
  through `src/ui.tsx`.
- Never write your own classes, markup or CSS for a control or surface on one screen, never copy a component, and never
  add a screen-specific variant.
- Every pull request description has a **Components** line: each component the change uses, and for each whether it is
  *existing*, *fixed in the theme* or *new in the theme* (for the last two, the M3 pages read). The PM does not merge a
  pull request without that line, or with a screen-specific component (`pm` skill).

## 1. Read `CLAUDE.md`

All of it, before the first edit.

## 2. Load the skills the task needs

| Skill | Load it when |
| :--- | :--- |
| `material-3` | **Any design work, or any change a person sees** (the site, the theme, an editor screen). Owner rule: read the real m3.material.io pages with Playwright, never from memory, WebFetch or curl, for every component you build or edit. Say in the pull request which pages you read (the URLs) and that you loaded the skill. |
| `site-editor-writing` | a text of the editor changes (labels, buttons, hints, messages) |
| `release-notes` | a site owner sees the change |
| `changesets` | before you open the pull request |
| `checks` | before a push, or when a CI job fails |

## 3. The pull request

Every pull request, whatever the change:

- Its description has the **Components** line (the hard rule above).
- It has its changeset (`changesets`) and its `check` job is green on the current head.
- You report the link and the head sha to the PM and leave the merge to it. Never merge your own pull request, and never
  ask the owner to merge it (`CLAUDE.md`, *Pull requests go to the PM*).
- A change the owner can see (the editor or the site) gets before and after screenshots of every changed screen in a
  comment on your own pull request: the `pm` skill, *Screenshots in the pull request* says how. A change nobody sees
  needs none.
- When `origin/<base>` moves, merge it into your branch (never a rebase, amend or force-push on a branch that is
  shared).
- You never release (`CLAUDE.md`, *Only the owner releases a new version*).

## 4. The owner's standing design rules

Short forms, for a developer to know before reading the specs. A rule changes only where it lives.

- **Dialog.** In a basic dialog no control has the focus when it opens; the main choice is a filled button and the other
  choices are outlined; the confirming button is the one closest to the edge (`src/ask.tsx` is the editor's one pattern;
  the owner's dialog rule is quoted in `docs/superpowers/specs/2026-11-14-one-save-while-writing-design.md`, 3.4).
- **Save on a phone.** Every `Save` goes in the bottom bar, and that bar is the standard bottom sheet, with no custom
  design (`docs/material-deviations.md`, *Editor-only bars*, item 3, and *A block's sheet on a phone*, B1).
- **Pages on a phone.** Below 600 dp no view is a full-screen dialog or a side sheet: each is a page with a back arrow in
  the top app bar, and Back with unsaved changes asks "Keep your changes?" (`docs/material-deviations.md`, B2). The
  computer keeps the side sheet.
- **Standard names.** Use the standard name of a field or a feature (Material 3's, the web's, the real product's),
  never a new one (`docs/superpowers/specs/2026-11-14-standard-names-audit.md`).
- **Icons are Material Symbols**, drawn by name through the shared `Icon` (`CLAUDE.md`, *Icons are Material Symbols*).
- **A deviation from Material 3** is allowed only in the editor's own workspace or when the owner says so in words, and is
  recorded in `docs/material-deviations.md` in the same pull request (`material-3`).

## 5. The components

Built from the real exports of `src/themeUi.ts` (the theme's parts, `theme/ui`, named `Site…`) and `src/ui.tsx` (the
editor's parts, made of them), on 15 Nov 2026. Use the `ui.tsx` part where there is one; otherwise the `Site…` part from
`src/themeUi.ts`. To look a component up, read its M3 page with Playwright (`material-3`, *Reading the real pages*),
never WebFetch or curl, every tab: Overview, Specs, Guidelines and Accessibility. The link is the Overview; the others
are `…/specs`, `…/guidelines` and `…/accessibility` under the same address. Each is under
`https://m3.material.io/components/`.

### The theme's components (`theme/ui`, through `src/themeUi.ts`)

| Component (export) | For | M3 page |
| :--- | :--- | :--- |
| `Button` (`SiteButton`, `ui.tsx` `Button`, `LinkButton`) | an action: filled for the one thing to do, tonal, outlined, text | [buttons](https://m3.material.io/components/buttons/overview) |
| `ButtonGroup`, `SegmentedButton`, `ChoiceGroup` | connected choices that fit on one line (`ChoiceGroup` falls back to a radio list) | [button-groups](https://m3.material.io/components/button-groups/overview), [segmented-buttons](https://m3.material.io/components/segmented-buttons/overview) |
| `SplitButton` | a main action with a menu of related ones | [split-button](https://m3.material.io/components/split-button/overview) |
| `IconButton` (`ui.tsx` `IconButton`, `IconLink`) | one icon action, labelled | [icon-buttons](https://m3.material.io/components/icon-buttons/overview) |
| `Fab`, `ExtendedFab`, `FabMenu` (`ui.tsx` `FabMenu`) | the screen's main action, or a few related ones | [floating-action-button](https://m3.material.io/components/floating-action-button/overview), [extended-fab](https://m3.material.io/components/extended-fab/overview), [fab-menu](https://m3.material.io/components/fab-menu/overview) |
| `TextField`, `TextFieldButton` (`ui.tsx` `TextField`, `TextArea`) | a text to write | [text-fields](https://m3.material.io/components/text-fields/overview) |
| `TextFieldMenu`, `ExposedDropdownMenu` (`ui.tsx` `Select`) | a field that picks one value from a menu | [menus](https://m3.material.io/components/menus/overview) |
| `Menu`, `MenuItem`, `MenuDivider` (`ui.tsx` same names) | a list of actions or choices that opens from a button | [menus](https://m3.material.io/components/menus/overview) |
| `Checkbox` (`ui.tsx` `Checkbox`) | select none, one or several of a set | [checkbox](https://m3.material.io/components/checkbox/overview) |
| `RadioButton`, `RadioGroup` | pick one of a few options | [radio-button](https://m3.material.io/components/radio-button/overview) |
| `Switch`, `SettingRow` (`ui.tsx` `Switch`, `SwitchRow`) | a setting that is on or off | [switch](https://m3.material.io/components/switch/overview) |
| `Slider` (`ui.tsx` `Slider`) | a value in a range | [sliders](https://m3.material.io/components/sliders/overview) |
| `Chip`, `ChipSet` (`ui.tsx` `InputChip`, `FilterChip`, `ChipField`, `ChipSet`) | a filter, input or suggestion, in a row | [chips](https://m3.material.io/components/chips/overview) |
| `List`, `ListItem` (`ui.tsx` `ListItem`, `PickListItem`, `ChoiceListItem`) | rows of text, icons and actions | [lists](https://m3.material.io/components/lists/overview) |
| `Card`, `CardMedia` | a content container for one subject | [cards](https://m3.material.io/components/cards/overview) |
| `Carousel` (`ui.tsx` `ImageCarousel`) | a scrolling row of images or cards | [carousel](https://m3.material.io/components/carousel/overview) |
| `Divider` | separates content | [divider](https://m3.material.io/components/divider/overview) |
| `Badge` | a count or dot on another part | [badges](https://m3.material.io/components/badges/overview) |
| `Dialog` (`ui.tsx` `Dialog`, `ask.tsx`) | a question or a task that interrupts | [dialogs](https://m3.material.io/components/dialogs/overview) |
| `BottomSheet` (`ui.tsx` `BottomSheet`, `ActionSheet`) | extra content or actions at the bottom on a phone, and the Save bar | [bottom-sheets](https://m3.material.io/components/bottom-sheets/overview) |
| `SideSheet` (`ui.tsx` `SideSheet`) | secondary content beside the page on a computer | [side-sheets](https://m3.material.io/components/side-sheets/overview) |
| `AppBar` / `TopAppBar` (`ui.tsx` `TopAppBar`) | the title, back arrow and actions at the top of a screen | [app-bars](https://m3.material.io/components/app-bars/overview) |
| `Toolbar` (`ui.tsx` `Toolbar`, `ToolbarButton`) | actions for the content in view | [toolbars](https://m3.material.io/components/toolbars/overview) |
| `NavigationBar`, `NavigationRail`, `NavigationDrawer` (`ui.tsx` `MainDrawer…`, `MainRail…`) | moving between the main places | [navigation-bar](https://m3.material.io/components/navigation-bar/overview), [navigation-rail](https://m3.material.io/components/navigation-rail/overview), [navigation-drawer](https://m3.material.io/components/navigation-drawer/overview) |
| `Tabs` (`ui.tsx` `TabRow`, `TabPanel`) | switching between views of the same content | [tabs](https://m3.material.io/components/tabs/overview) |
| `Search` (`SearchBar`, `SearchView`; `ui.tsx` `SearchBar`, `SearchRow`) | searching, with suggestions | [search](https://m3.material.io/components/search/overview) |
| `DatePicker`, `TimePicker` (`ui.tsx` `DatePicker`, `TimePicker`, `DateTimeField`) | a date or a time | [date-pickers](https://m3.material.io/components/date-pickers/overview), [time-pickers](https://m3.material.io/components/time-pickers/overview) |
| `LoadingIndicator`, `ProgressIndicator` | waiting, and progress | [loading-indicator](https://m3.material.io/components/loading-indicator/overview), [progress-indicators](https://m3.material.io/components/progress-indicators/overview) |
| `Snackbar` | a short message about a process | [snackbar](https://m3.material.io/components/snackbar/overview) |
| `Tooltip` | a short label for an icon on hover or focus | [tooltips](https://m3.material.io/components/tooltips/overview) |
| `ImageTile`, `Lightbox` | an image in a grid, and its full view; M3 has no page for them (`docs/material-deviations.md`, Lightbox) | none |

### The editor's own parts (`src/ui.tsx`, shown under *Developer › Parts › Editor*, `src/Parts.tsx`)

These exist only in the editor and are built of the theme's components. Use them as they are; they are not a licence to
make another. M3 has no page for them unless it says so.

- **Fields and forms:** `FormField`, `FieldGroup`, `Label`, `SupportingText`, `ChoiceField`, `MultiChoice`, `ColorField`,
  `IconPicker`, `ImagePick`, `ShownValue`, `SlotButton`, `Choice`, `ChoiceRow`, `ChoiceTile`, `ChoiceCards`, `PhoneField`,
  `FormColumns`, `FormHeading`, `Group`, `GroupTitle`, `FoldSection`, `FoldList`, `FoldItem`.
- **Sheets and pages:** `SheetBody`, `SheetList`, `SheetGroupTitle`, `SheetLink`, `SheetActions`, `SheetTitle`,
  `SectionList`, `SectionPane`, `PageFrame`, `Preview`.
- **Notes and status:** `Notice`, `EmptyNote`, `ProblemNote`, `CloseButton`, `ArrowLink`, `ScoreRing`, `CheckList`,
  `SharePreview`, `Filters`.
- **Colour and icon displays:** `ColorWheel`, `ColorTiles`, `ColorSwatches`, `ColorsPreview`, `IconSwatches`, `LeadingIcon`,
  `LeadingImage`, `LeadingToken`.
- **Plain helpers:** `useAtLeast`, `useMenuLayout`, `useInView`, `useKept`, `usePickTools`, `startRipples`.

### Keeping the list current

A pull request that adds, renames or removes a component of the theme or an export of `src/ui.tsx` or `src/themeUi.ts`
updates this list in the same pull request, with its M3 page. Follow-up proposals, not built here: a `check:components`
that fails when an export of `src/themeUi.ts` or `src/ui.tsx` is missing from this list (the way `check:phosphor` reads
`src/` and keeps an allowlist with reasons), and a check that fails on a raw `<button`, `<input`, `<select` or `<dialog`
in `src/*.tsx` outside `ui.tsx` and `themeUi.ts` (today 9 `<button` in 5 files, so the allowlist is small); the natural
place for both is next to `scripts/check-phosphor.mjs` in `npm run check`.
