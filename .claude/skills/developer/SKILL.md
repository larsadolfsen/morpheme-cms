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

- If the component is missing, or deviates from Material 3, **do not build or fix it yourself.** Stop and tell the PM
  exactly what is missing and why: the screen, what you need, the closest existing component and the M3 page for it.
  Then wait. The PM asks the owner. Only after the owner's explicit yes does the PM tell you to build or fix it in the
  theme (`theme/ui` and its CSS), M3-conform after reading the real M3 pages with Playwright (`material-3`), shown in
  the theme's component gallery (the editor's *Developer › Parts › UI components*, `#developer/parts/ui`,
  `src/BlockParts.tsx`), and then used through `src/ui.tsx`.
- Never write your own classes, markup or CSS for a control or surface on one screen, never copy a component, and never
  add a screen-specific variant.
- Every pull request description has a **Components** line: each component the change uses, and for each whether it is
  *existing*, *fixed in the theme with owner approval* or *new in the theme with owner approval* (for the last two: who
  approved, the date, and the M3 pages read). The PM does not merge a pull request without that line, or with a
  screen-specific component (`pm` skill).

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
- **It adds no code-scanning alert** (owner, 21 Nov 2026: "we need to fix these as they occur"). CodeQL scans the pull request; an
  alert it finds in your change is fixed in the same pull request, by fixing the code, never by a dismissal or a comment that
  silences it. Only the owner dismisses an alert, in words. A GitHub ruleset on `main` and `feature/*` blocks the merge while a
  High or higher alert is open.
- You report the link and the head sha to the PM and leave the merge to it. Never merge your own pull request, and never
  ask the owner to merge it (`CLAUDE.md`, *Pull requests go to the PM*).
- Your PM is the PM of your own version: your pull request goes into that version's feature branch (or into `main` for its single
  fix), and you report to that PM only. A PM merges only within its own feature (owner, 20 Nov 2026: "Pms tend to merge future
  feature branches. They are only allowed to merge branches within their feature."), so never send your pull request to another
  version's PM; if no PM runs for your version, tell the owner.
- A change to the editor gets after screenshots of every changed screen in a comment on your own pull request: *Screenshots in
  the pull request* below says how. A change to the site only needs none: the owner opens its Preview, and the PM tests it there
  (owner, 21 Nov 2026). A change nobody sees needs none.
- A change to one component is checked on that component's demo page (`/blocks/<component>/`), not on all of them (`checks`).
- When `origin/<base>` moves, merge it into your branch (never a rebase, amend or force-push on a branch that is
  shared).
- **The version.** A feature's first pull request sets `version` in `package.json` to the number the feature is released as and runs `node scripts/starter.mjs` so `starter/package.json` pins it (CI's `static` fails without it); a single fix into `main` does it in its own pull request. A changeset's level does not move it, and no later pull request changes it (skill `changesets`, *The version is set when a feature starts*; CI's `static` checks it).
- You never release (`CLAUDE.md`, *Only the owner releases a new version*).
- You push your own branch only: never `main`, `0.18` or `0.19`, and never with force. A session whose push is denied tells the PM and does not work around it.
- A change that needs a new screens check adds its unit to its area's file, `scripts/screens/<area>.mjs` (skill `checks`), never to `scripts/editor-screens.mjs` (the runner) and never to `scripts/screens/order.txt`.

## 3b. Screenshots in the pull request

Moved here from the `pm` skill on 18 Nov 2026 (the sessions take them; the PM opens and reports them, `pm` skill section 4).
For a change to the editor only (owner, 21 Nov 2026: the owner cannot sign in to the editor on a Preview, so the images are how the
owner sees it; a site change is seen on its Preview instead, and the PM's own test on the Preview replaces the *before*). One comment
on the pull request, headed with what changed, for every screen the change touched: an *after* on a phone and a computer, in English,
light theme, at `deviceScaleFactor: 2`, in every state the change touched (open menu, error, empty, selected). Take them from the
built branch (`npm run build`; `openEditor` and `serveBuilt` in `scripts/built-site.mjs` open the editor without a login); no *before*
and no build of `main` for it. Put a short caption under each image. The images never go into the shipped
package or into the pull request's own diff.

**How the images get into the comment.** The GitHub tools cannot upload an image, so the images
travel in git:

1. Take the PNGs into a folder outside the repository checkout, for example the scratchpad.
2. Add them to the one shared orphan branch `screenshots`, in the folder `<pull request number>/`: `git fetch origin screenshots`,
   `git worktree add <scratchpad>/shots origin/screenshots` (the first session makes the branch with `git checkout --orphan`), copy
   the PNGs into `<number>/`, commit and `git push origin HEAD:screenshots`. If the push is refused because another session pushed
   first, `git pull --rebase origin screenshots` and push again; never force-push it and never touch another pull request's folder.
   The branch shares no history with `main`, so nothing reaches the package or the pull request's diff. Never make a branch for
   screenshots (owner, 21 Nov 2026: the repository has only `main`, feature branches and branches with an open pull request).
3. In the comment, link each image as
   `![caption](https://github.com/<owner>/<repo>/blob/screenshots/<number>/<file>.png?raw=true)`.
4. The branch and its folders stay, so the images in old pull requests keep showing.

*Checked 14 Nov 2026 (pull request #632):* a pushed orphan branch and a comment with this link work, and GitHub renders the
comment as an `<img>` of the link. Not yet checked: that the owner's browser shows the image in this private repository.
The first session that adds screenshots looks at the comment, and if the image does not show, it tries another way that
leaves nothing in the shipped package. It then tells the PM exactly what worked, and the PM has this section updated.

## 3a. Check in when ready to merge

Owner rule, 15 Nov 2026. When the change is finished and `npm run check` is green locally (which checks to run before a push: skill `checks`, *What to run before a push*), do not push, open a pull request
or re-run CI on your own. Send the PM one message, `ready: <branch>, <what changed>, local check green`, and wait. Only on
the PM's "your slot" do you push (or merge `origin/<base>` and push, or open the pull request); that message carries the owner's permission
(owner, 20 Nov 2026: "The pm has my permission to tell Dev sessions to push"), so you push without asking the owner again. Then report the link and
the head sha once `check` is green. While you wait you may merge the base locally and run `npm run check`; never the full `check:screens` (skill `checks`). The first push
of a new session follows the same rule: check in first. The PM keeps the order (`pm` skill, section 5, *Ready queue*, and section 6, *CI slots*).

## 3c. While you work: `npm run check:fast`

Run `npm run check:fast` while you build (after each step): it runs only the checks your changed files can break and prints what it skipped
(skill `checks`, *While you work*); it adds the screens core set to a change that reaches the build, so it can take longer than `npm run check` there: use `-- --screens none` for the quick mode. It is not the gate: `npm run check` is what you run before the push (section 3a), and CI runs the rest.

## 4. The owner's standing design rules

Short forms, for a developer to know before reading the specs. A rule changes only where it lives.

- **Dialog.** In a basic dialog no control has the focus when it opens; the main choice is a filled button and the other
  choices are outlined; the confirming button is the one closest to the edge (`src/ask.tsx` is the editor's one pattern;
  the owner's dialog rule is quoted in `docs/superpowers/specs/2026-11-14-one-save-while-writing-design.md`, 3.4).
- **Save on a phone.** Every `Save` goes in the bottom bar, and that bar is the standard bottom sheet, with no custom
  design (`docs/material-deviations.md`, *Editor-only bars*, item 3, and *A block's sheet on a phone*, B1).
- **Dialogs are only for short messages** (owner, 15 Nov): a dialog is a short message, a confirmation or a single short choice. Settings or a form with several controls are the theme's standard side sheet beside the page from 600 dp and a page below 600 dp (`docs/material-deviations.md`, B3).
- **Pages on a phone.** Below 600 dp no view is a full-screen dialog or a side sheet: each is a page with a back arrow in
  the top app bar, and Back with unsaved changes asks "Keep your changes?" (`docs/material-deviations.md`, B2). The
  computer keeps the side sheet.
- **Standard names.** Use the standard name of a field or a feature (Material 3's, the web's, the real product's),
  never a new one (`docs/superpowers/specs/2026-11-14-standard-names-audit.md`).
- **CSS custom properties** (owner, 16 Nov 2026; `docs/css-tokens.md`, `npm run check:css-tokens`). A shared value is a `--mo-…` token: the CMS owns
  the name, the theme sets its value once on `:root`, and a block, an app block or a section overrides it on its own root element. Never make a second
  name for a value that has a `--mo-` name (no `--venus-gap`, no theme or app prefix); if the CMS has no name for a value, add one to the CMS's list
  and document it. A token only one block uses is declared on that block, nothing unprefixed on `:root`, `html` or `body`, and an app or theme never
  redeclares a name the CMS declares.
- **Names and no Tailwind** (owner, 18 Nov 2026, contract 7; `docs/class-names.md`): every class and custom property starts with `mo-` and no utility class, `@apply`, `theme()` or `@theme` is written; `npm run check:mo-names` and `npm run check:tailwind` fail on any, with no allowlist, also on a site's themes and apps (`check:content`). A name that is not ours (a library's) is listed with its reason in `NOT_RENAMED` (`scripts/mo-names.mjs`), never let by otherwise.
- **Removing a block or a stored form keeps its migration** (CTO, 19 Nov 2026): sites skip versions (the editor's update goes straight to npm `latest`), so the migrate of each version takes any older supported content to its own form in one run; delete the block, view and theme part, keep the migrate-only code and its tests (`lib/migrate-hero.mjs` is the example).
- **Icons are Material Symbols**, drawn by name through the shared `Icon` (`CLAUDE.md`, *Icons are Material Symbols*).
- **A deviation from Material 3** is allowed only in the page and post editor's bar and menus or when the owner says so in words, and is
  recorded in `docs/material-deviations.md` in the same pull request (`material-3`).

## 4a. Modern Web Guidance

Chrome's Modern Web Guidance (a devDependency, never shipped in the package) holds guides on current web platform
practice. Before you write or change CSS, layout, forms, accessibility or performance code, search and retrieve the guides
for the topic through the npm script, and name the guides you read in the pull request description:

- `npm run audit:web -- search "<2–5 words>"`, then `npm run audit:web -- retrieve "<guide id>"`.
- `npm run audit:web -- legacy-scan <folder> --json` finds legacy patterns; use it for an audit, not for a feature. `npm run check:web` runs it in `npm run check` and fails on a new finding; a fix removes its line from `scripts/web-allowlist.json`.

Owner rule, 15 Nov: "We follow the best practices in modern web from Google." Where a guide covers behaviour, markup, accessibility or performance, we follow it; Material 3 still decides how things look and are named. A real conflict between the two goes to the PM, as below.

**Priority order** (owner, 15 Nov 2026; `pm` skill, section 1, *The order of priority*): 1 Modern web, 2 Material 3 Expressive, 3 Material 3, 4 Material 2 with Material 3 styling, 5 self-made; the lower number wins. Decide with it yourself. Stop and tell the PM only when the answer would be priority 5 (nothing from 1 to 4 covers it).

Order of authority: the owner's rules, Material 3 and the theme components through `ui.tsx` win over the guidance. When a
guide conflicts with one of them, you do not decide: stop, and send the PM the conflict (what the guide says, what our
rule says, which screen or file, the closest option). The PM brings it to the owner, and you wait. Nothing is changed
against an M3 rule or a theme component without the owner's yes. The audit is in
`docs/superpowers/specs/2026-11-15-modern-web-guidance-audit.md`.

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
| Grid (`.mo-staggered-grid`, `.mo-staggered-grid__span-full`; tokens `--mo-comp-grid-columns`, `--mo-sys-grid-gutter`, `--mo-sys-grid-margin`, `--mo-sys-grid-layout-columns`) | cards of different heights in columns, no holes; on any page of the editor and the site; `docs/theme-grid.md` | [grids](https://m3.material.io/foundations/layout/grids-spacing/grids) |
| `Carousel` (`ui.tsx` `ImageCarousel`) | a scrolling row of images or cards | [carousel](https://m3.material.io/components/carousel/overview) |
| `Divider` | separates content | [divider](https://m3.material.io/components/divider/overview) |
| `Avatar` (`SiteAvatar`) | a round mark with a letter or an image: a list item's leading avatar, a card's thumbnail; M3 has no page of its own (Lists, Specs, *Leading avatar*) | [lists](https://m3.material.io/components/lists/specs) |
| `Badge` | a count or dot on another part | [badges](https://m3.material.io/components/badges/overview) |
| `Dialog` (`ui.tsx` `Dialog`, `ask.tsx`) | a question or a task that interrupts | [dialogs](https://m3.material.io/components/dialogs/overview) |
| `BottomSheet` (`ui.tsx` `BottomSheet`, `ActionSheet`) | extra content or actions at the bottom on a phone, and the Save bar | [bottom-sheets](https://m3.material.io/components/bottom-sheets/overview) |
| `SideSheet` (`ui.tsx` `SideSheet`) | secondary content beside the page on a computer | [side-sheets](https://m3.material.io/components/side-sheets/overview) |
| `AppBar` / `TopAppBar` (`ui.tsx` `TopAppBar`) | the title, back arrow and actions at the top of a screen | [app-bars](https://m3.material.io/components/app-bars/overview) |
| `Toolbar` (`ui.tsx` `Toolbar`, `ToolbarButton`) | actions for the content in view | [toolbars](https://m3.material.io/components/toolbars/overview) |
| `NavigationBar`, `NavigationRail`, `NavigationDrawer` (`ui.tsx` `MainDrawer…`, `MainRail…`) | moving between the main places | [navigation-bar](https://m3.material.io/components/navigation-bar/overview), [navigation-rail](https://m3.material.io/components/navigation-rail/overview), [navigation-drawer](https://m3.material.io/components/navigation-drawer/overview) |
| `Tabs` (`ui.tsx` `TabRow`, `TabPanel`) | switching between views of the same content | [tabs](https://m3.material.io/components/tabs/overview) |
| `Search` (`SearchBar`, `SearchBarButton`, `SearchGroupLabel`, `SearchView`; `ui.tsx` `SearchBar`, `SearchBarButton`, `SearchRow`) | searching, with suggestions | [search](https://m3.material.io/components/search/overview) |
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
