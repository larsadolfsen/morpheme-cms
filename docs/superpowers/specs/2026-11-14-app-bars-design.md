# App bars on every screen (design and build plan, 0.20)

Status: design and build plan, no code. Written against `0.18` (`e89942f`) on 14 Nov 2026 in a brainstorm session. The owner was away and
asked that it be planned with the 0.18 PM. The owner decisions of 14 Nov below are settled. The proposals in section 11 are **proposed**:
the PM or the owner confirms them before the build starts.

**Owner decisions (14 Nov 2026), which this spec builds on and does not reopen** (roadmap `plans/2026-11-14-roadmap-0-18-to-0-24.md`, 0.20):

1. M3's app bars on every screen.
2. A **search app bar** on the start screen and the list screens ("Search pages"). The search field moves up from today's search row. The
   sort, filter and date buttons become a **row of chips** under the bar.
3. **Pages and Posts open with the search bar shown.**
4. A **small app bar** on the page being written: back, the title, the search icon and `Publish`. No overflow menu in the app bar; the
   writing tools stay in the toolbar.
5. A **medium flexible app bar** on settings sheets and detail screens.
6. The search icon of 0.18 (the command palette's) becomes the search app bar here.
7. The search-row rule in `morpheme-website`'s `CLAUDE.md` (*Søgeknapper*) changes with it.
8. Real names always: Material 3's and the web's standard names.

Builds on 0.18, not redesigned here: the page form's app bar with `Publish` and the palette's search icon
(`specs/2026-11-14-one-save-while-writing-design.md`, section 3), the command palette (`specs/2026-11-13-command-palette-and-context-menus-design.md`),
the choice group (`specs/2026-11-14-choice-group-design.md`, PR #641). Its sister specs for 0.20: `specs/2026-11-14-settings-sheets-design.md`
(the sheets) and `specs/2026-11-14-autosave-everywhere-design.md` (phase 2).

Read for this spec: `src/Screen.tsx`, `src/FormFrame.tsx`, `src/Library.tsx` (the start screen, `List`, `Blocks`), `src/ui.tsx` (`SearchBar`,
`SearchRow`, `Choice`, `Filters`, `InputChip`, `FilterChip`, `usePickTools`), `src/Media.tsx`, `src/Redirects.tsx`, `src/AppList.tsx`,
`src/ThemeStoreScreen.tsx`, `src/BlockSettings.tsx`, `src/Licenses.tsx`, `src/Consents.tsx`, `src/SeoScores.tsx`, `src/OwnList.tsx`,
`src/SelectionBar.tsx`, `src/MainMenu.tsx`, `src/App.tsx` (the routes), `theme/ui/TopAppBar.tsx`, `theme/ui/Search.tsx`, `theme/ui/Chip.tsx`,
`theme/ui/ChipSet.tsx`, `theme/styles/ui.css` (`.top-app-bar*`), `defaults/editor.ts` (the menu).

## 1. What Material 3 says (read 14 Nov 2026 with Playwright)

Pages read in full: App bars (overview, guidelines, specs, accessibility), Search (overview, guidelines, specs, accessibility), Chips
(overview, guidelines, specs, accessibility). Quoted as printed. **Not readable:** the token tables of the app bar specs (the folders
*Color*, *Spacing*, *Shape*, *Size* do not open from a script) and the measurement drawings, which are images. No height or padding of an
app bar is quoted here for that reason; the theme's `.top-app-bar-*` classes, built from an earlier reading, keep their values, and the PR
that touches them re-reads the specs page by hand.

**App bars.**

- Overview: "Focus on describing the current page and provide 1–2 essential actions." "Displays labels and page navigation controls at the
  top of the page. (Use a toolbar to display page actions)." "Four variants: Search app bar, small, medium flexible, large flexible." "On
  scroll, apply a fill color to separate from body content." "Can animate on and off screen with another bar of controls, like a row of
  chips." "Renamed component from top app bar to app bar." "Medium and large app bars are no longer recommended."
- Usage: "Use an app bar to provide content and actions related to the current page, such as page navigation actions, headlines, images, and
  1–2 essential actions." "The information and actions in the app bar should be contextual and specific to a page, but can also include
  global product controls, such as search or notifications." "App bars should only have one action, two if necessary." "The primary action
  should alter or exit the entire page, like Send, Save, or Edit." "If the product has many actions, place those in a toolbar. Avoid placing
  an overflow menu in the app bar when possible." "Avoid using multiple filled or tonal buttons."
- The variants: "Search app bar: Use on home pages when search is key to the product." "Small: Use in dense layouts or when a page is
  scrolled." "Medium flexible: Use to display a larger headline. It can collapse into a small app bar on scroll." "Large flexible: Use to
  emphasize the headline of the page."
- Search app bar: "Use a search app bar to provide an emphasized entry-point to open the search view." "Search app bars have a search field
  instead of heading text." "Search bars should always include the word Search." "Searching a specific area. Example: Search inbox."
  "Search [Product]. Example: Search Photos." "In addition to a trailing avatar, search app bars can have up to two trailing icons on
  mobile." "Trailing icons can be placed inside or outside the search bar." "The leading element of a search app bar can be used for a
  product's logo … can trigger an action like returning to the home screen." "Avoid using a logo to open an expanded navigation rail."
  "There should be up to four trailing icons on larger screens." "The search container of the search app bar should fill 100% of the space
  between leading and trailing app bar elements until it reaches 312dp. Then, it should only grow further to fill 50% of that space."
  "Selecting the search bar should open the search view component."
- Anatomy: "Container, Headline, Trailing icons, Subtitle, Leading button." "Always use the default height of the app bar, and make it span
  the full width of the window." "The leading button should be used for navigating the product. It typically is one of the following: A menu
  icon, which opens a modal expanded navigation rail; A back arrow, which returns to the previous screen."
- Headline: "In medium flexible and large flexible app bars, the headline can wrap to a second line. Don't truncate the headline text." "If
  headline text is long, use a medium flexible or large flexible app bar and wrap the headline to two lines maximum." "Don't wrap text in a
  small app bar." Typography: "Search: Body large; Small: Title large; Medium flexible: Headline medium; Large flexible: Display small."
  Subtitle: "Subtitles can add additional context to a page." "Small: Label medium; Medium flexible: Label large."
- Trailing icon buttons: "Up to two icon buttons can be placed after the headline, aligned to the trailing edge of the app bar. Place
  most-used actions closest to the leading edge." "Avoid using these buttons to open a menu with more actions." "If changing the icon button
  color style to filled or tonal, only use one icon button."
- Adaptive: "It should always span 100% of the window width." "Resizing may cause actions at the trailing edge of the app bar to collapse
  into an overflow menu at smaller breakpoints."
- Behavior: "App bars should initially be the same color as the background, then fill with a contrasting color on scroll." "The app bar can
  remain on a page at all times, or can hide and reappear when scrolling." "When scrolled, medium flexible and large flexible app bars can
  transform into small app bars. They should remain small until the page is scrolled back to the top. Don't transform app bars into a search
  app bar."
- Specs: "All app bars share the same color roles. On scroll, the container changes color to surface container." Search app bar roles:
  "Surface, On surface variant, … Surface container, Surface container highest". "The medium flexible and large flexible app bars hug the
  text contents, so they are taller when a subtitle is visible." "The app bar's trailing icon buttons can be replaced with a single, primary,
  or tonal filled icon button in default or wide sizes."
- Accessibility: "Focus should initially land on the leading button, since it's the first interactive element of the app bar." "Tab: Move
  focus to the next interactive element." "The accessibility label for a title should be the same as the content within the title." On search
  app bars, "Search container: surface container. Search label: on surface variant." "make sure search bars and their labels have at least
  3:1 contrast".

**Search.**

- "Search bar: Use to search contents in a specific view, like Search your messages." "Search app bar: Use this app bar variant when search
  is the primary, global function." "Search icon button: Use when search is a secondary action or not the main focus." "For global search,
  use a persistent search app bar, integrated into an app bar."
- "Search suggestions and results both appear in a list component by default." "Filter chips to narrow down results." "Search results can
  show as someone is typing or after a search is executed."
- Focused layouts: "Docked opens a list below the search bar, with a scrim covering main content." "Full-screen expands to fill the
  screen." "Docked layout: Best for medium and expanded windows. Full-screen layout: Default for compact breakpoints."
- "The back icon releases focus, dismisses any suggestions or results, and returns the search bar to its original state." "Depending on
  needs, a search bar can: Scroll away with content, then reappear when a person begins scrolling up; Remain fixed at the top of the screen."
- "Hinted search text: Provide a short description of the information people can search, like Search replies or Search your messages."
  "Focused search can show an optional clear icon to remove input text." "A search bar should have one or two trailing icons or icon
  buttons." Trailing actions can include "An overflow menu".
- Specs: container "Width Min: 360dp, max: 720dp", "Height 56dp".
- Accessibility: "When search suggestions and results appear, the screen reader must announce the change." "The hinted search text should be
  used as the accessibility label describing the search bar." Keys: "Tab or Shift + Tab: Navigate between interactive elements", "Arrows:
  Navigate between search result items".

**Chips.**

- "Filter chips use tags or descriptive words to filter content. They can be a good alternative to segmented buttons or checkboxes when
  viewing a list or search results." "Write filter chips with nouns that describe the category to include in the results."
- "Filter chips can be used with other components, such as search fields and sheets." "Filter chips can be shown underneath a search field."
- "On filter chips, it's optional, and can be used to open a menu or remove the chip." "When combined with a menu, the filter chip opens a
  list of selectable options." "In compact windows, make sure the whole chip opens the menu."
- "Alternatively, a single chip can be selected. This offers an alternative to segmented buttons, radio buttons, or single select menus.
  However, avoid mixing chip set behaviors."
- "Don't display a single chip by itself. Chips should appear in a set." "Filter chips should not present only a single option."
- "Chip label text should be 20 characters or fewer." "Keep an 8dp minimum space between chips. Chips must also have a minimum 48dp target
  size." Filter chip specs: "Container height 32dp", "Container shape 8dp corner radius", "Icon size 18dp".
- "Chips aren't buttons." "Avoid replacing major actions with chips."
- Accessibility: "When there are too many chips to fit on one row, provide a way to display them all at once and avoid scrolling." "Tab:
  Moves focus to enabled chip or chip group"; "Arrows: Moves focus between chips"; "Space or Enter: Activates, selects, or deselects the
  focused chip".

**Where M3 is silent:** a sort control (chips print filters, not an order); breadcrumbs (no M3 component); a search bar whose results are the
list already on the page instead of a search view (section 4.3); a labelled filled button in an app bar (the 0.18 deviation for `Publish`).

## 2. Today in code

- **One bar for every screen** (`Screen.tsx`, drawn into `topBarSlot.tsx`): the theme's `TopAppBar` **without a kind**, so none of
  Material's variants. Below expanded: menu button (compact, only without a back arrow), the back arrow, the title (`text-title-large`,
  truncated) with the status under it, the page actions, the actions, the bell; on the start screen the logo and the website link. From
  expanded the bar holds the logo, the site's name and the actions; the breadcrumbs (one level), the title and the status stand in a row
  under the bar.
- **The search row** (`SearchRow` in `ui.tsx`): the editor's `SearchBar` with, after it, in a fixed order, the icon buttons `sort`
  (`Choice`: a menu on a computer, a sheet on a phone), `filter` (`Filters`: a sheet of filter groups), `date`, `seo` (show the Google
  rating) and `view` (Pages: the menu's order or the list). The filters chosen are `InputChip`s under it. It stands at the top of the
  content, not in the bar. A list shows it only when it has more than 8 rows or can be sorted or filtered (`Library.tsx:1584`).
- **Screens with a search row** (the screen inventory, section 9): Pages, Posts, every folder list (tags, popups, testimonials, cookie list,
  an app's list), own lists, Files, Redirects (all, missing addresses), Block templates, Block settings, Apps (installed, connectors,
  plugins), App store, Theme store, Licenses, Consents, SEO rating; inside a form: Internal links (keywords).
- **The start screen**: logo, (compact) menu button, Edit dashboard, the bell, Open website. No search. 0.18 adds the palette's search icon
  on every screen (palette spec 4.8), which puts Home, Pages, Posts, Files and the lists over M3's two actions until 0.20 (deviation 3 of
  the palette spec, approved as temporary).
- **Selection** (`SelectionBar.tsx`): while rows are selected, the selection's actions replace everything at the end of the bar.
- **Forms** (`FormFrame.tsx`): the bar of `Screen`, plus a floating Save bar at the bottom while dirty. The page form loses its floating bar
  in 0.18 (`Publish` in the app bar).

## 3. Which app bar each screen gets

| Kind of screen | App bar | Screens |
| :--- | :--- | :--- |
| **Home** | **Search app bar**, opens the command palette as the search view | the start screen (also while the notifications sheet is open) |
| **Lists** | **Search app bar**, its text narrows the list, chips under it | Pages, Posts, folder lists, own lists, Files, Deleted (pages, posts, files), Redirects (all, missing addresses), Block templates, Block settings, Apps, Connectors, Plugins, App store, Theme store, Licenses, Consents, SEO rating |
| **The page being written** | **Small app bar** | a page or post (`EntryForm`), a new page or post |
| **Everything else** | **Medium flexible app bar**, collapses to small on scroll | Settings and its screens, Business, Colours, Appearance and its screens, Privacy, Account, an app's page and screens, a theme's page, a store app's and developer's page, Components, CMS version, Status, a licence, Not found |
| **Settings forms** | **a subpage with a back arrow** on compact, **a side sheet** from medium (`settings-sheets-design.md`) | Business › Contact and the other forms of that spec's section 4 (which ones: its open question O1) |
| **While rows are selected** | today's contextual bar (section 4.6) | every list with selection |

The list of screens is the inventory of 14 Nov (section 9). A screen added later picks its row by its kind: `Screen` takes the kind from
what it is given (a `search` gives the search app bar, the page form asks for `small`, the rest is medium flexible), so no screen draws its
own bar.

**The settings forms** of `settings-sheets-design.md` are a subpage on compact (the detail-screen app bar with the back arrow and the headline only; `Save` in the bottom bar the page form uses) and a side sheet from medium (headline, close icon, `Save` and `Cancel` as bottom actions); that spec says how. Owner decision, 14 Nov: not a
full-screen sheet.

## 4. The search app bar

### 4.1 Its parts

```
Phone, 375 px (Pages)
┌───────────────────────────────────────────┐
│ ←  ┌ 🔍 Search pages ─────────────── ✕ ┐  🕓 │   back · search bar (clear icon once typed) · Deleted pages
│    └───────────────────────────────────┘     │
│ [Newest ▾] [Status ▾] [In menu ▾] [Ratings]  │   the chip row (wraps; section 4.4)
├───────────────────────────────────────────┤
│ About us                          Published  │
│ …                                             │

Computer, 1280 px (Pages, beside the rail and the drawer)
┌──────────────────────────────────────────────────────────────────────────────┐
│ ←  ┌ 🔍 Search pages ─────────────────────────────────┐            🕓   🔔     │
│    └──────────────────────────────────────────────────┘                        │
│ [Newest ▾] [Status ▾] [In menu ▾] [Ratings] [Menu order]                       │
```

- **Leading:** on the start screen the menu button below medium (it opens the main drawer, as today; M3: "A menu icon, which opens a
  modal expanded navigation rail"), the logo from medium (the rail is there; M3: "The leading element can be a product logo", "can
  trigger an action like returning to the home screen"). On every list screen the back arrow, at every width (section 5.2).
- **The search bar:** the theme's `Search` (`theme/ui/Search.tsx`) in the bar's `search` slot (`TopAppBar kind="search"`), its hinted
  text the screen's: `Search pages`, `Search posts`, `Search the files` … (today's `searchIn` texts and the screens' own, unchanged), and on
  the start screen `Search {site name}` (M3: "Search [Product]"; section 11, P2). Width: M3's rule (100% up to 312 dp, then half the rest),
  which the theme's `.top-app-bar-search-bar` follows.
- **Trailing, outside the bar,** at most two on a phone and four from expanded (M3): the screen's own actions first (`Deleted pages`, the
  CSV download of Consents), then the bell. The palette's 0.18 search icon is not drawn where the search app bar is (owner decision 6).
- **Trailing, inside the bar:** the clear icon once something is typed (M3: "an optional clear icon to remove input text"), and, on a list
  with only one tool (section 4.4), that tool.
- Colours: the bar and the search container take M3's roles through the theme (`surface`; the container `surface-container`, its text
  `on-surface-variant`), so `check:contrast` holds the 3:1 M3 asks for.

### 4.2 Home: the command palette is its search view

On the start screen the search bar is the entry to the command palette of 0.18 (it searches actions, the menu's places, and pages and posts by
title). Selecting it opens the palette as M3's search view: **full screen below medium, docked from medium** (M3: "Docked layout: Best for
medium and expanded windows. Full-screen layout: Default for compact breakpoints"). `Ctrl+K` / `⌘K` opens the same view on every screen,
as in 0.18. The palette's results, keys and announcements stay as its spec says; only its entry point changes.

### 4.3 Lists: the bar narrows the list

On a list screen the text typed in the search bar narrows the list below it while typing, as `SearchRow` does today, and the chips under
the bar narrow it further. There is no separate search view: the list is the result. The back arrow of the search bar is not drawn (it is
the app bar's leading back arrow, which leaves the screen); `Esc` and the clear icon empty the field.

M3 prints "Selecting the search bar should open the search view component" and a search bar that searches "contents in a specific view"
placed under a title. The owner chose the search app bar for the lists ("Search pages"), and the list is already the list of results M3
would show in a search view; opening a second list over the first would show the same rows twice. **Deviation D1** (section 8), proposed
in section 11, P1.

`Ctrl+K` still opens the palette on a list screen; it is the only way there from a list, since the palette's icon is not drawn (P1 names
the other choice).

### 4.4 The chip row: sort, filter, date, rating, menu order

The icon buttons of today's search row become **filter chips** in one row under the bar, in the fixed order of today's rule: sort, the
filters (one chip per filter group), date, rating, menu order.

| Today | Chip | What it does |
| :--- | :--- | :--- |
| `sort` (`Choice`: menu or sheet) | **Sort chip**, a filter chip with a trailing `arrow_drop_down`, its label the chosen order (`Newest`, `A–Z`) | opens a menu of the orders (the editor's `Menu`: a menu from medium, a bottom sheet on a phone, as `Choice` today); always shown as chosen |
| `filter` (`Filters` sheet with groups; `InputChip`s for the choices) | **One filter chip per group** with a trailing `arrow_drop_down`: `Status`, `In menu`, `Kind`, `Tag`, `Category`, `State` … | opens a menu of that group's choices; when one is chosen the chip is selected and its label is the choice (`Draft`); `All` takes it back. The `Filters` sheet and the `InputChip`s under the row are no longer needed |
| `date` (Files) | **Date chip**, label `Date` or the chosen range | opens today's date choice |
| `seo` (Pages, Posts: show the Google rating) | **Rating chip**, a filter chip that toggles (selected: the rating shows on each row) | today's `pickSeo` |
| `view` (Pages: the menu's order) | **Menu order chip**, a toggle | today's `pickView` |

- **One row, wrapping.** The row wraps when it does not fit (M3: "Filter chips can wrap to a new row"); with at most six chips it is never
  more than two rows at 375 px, so it never scrolls sideways (M3 accessibility: "provide a way to display them all at once and avoid
  scrolling"). It stands under the bar and moves with it (M3: "Can animate on and off screen with another bar of controls, like a row of
  chips").
- **Never a single chip** (M3: "Don't display a single chip by itself"). A list with only one tool (a lone sort: Licenses has none, Consents
  and Missing addresses have only sort) shows it as an icon button inside the search bar instead (M3: a search bar's trailing actions can
  include "An overflow menu"), opening the same menu. A list with none has no row.
- **A chip that cannot be used stays in its place, disabled** (today's rule: sort is greyed out while Pages shows the menu's order, so the
  chips do not move).
- **Labels** are nouns of 20 characters or fewer (M3), in sentence case; a chosen value that is longer is shortened with an ellipsis and has
  its full text as its accessible name.
- One behaviour for all chip rows: every chip opens a menu or toggles, none removes itself (M3: "avoid mixing chip set behaviors").
- The chip with a menu is the theme's `Chip kind="filter"` with its `trailingIcon` and the menu (`aria-haspopup="menu"`,
  `aria-expanded`), the whole chip its target (M3, compact). A part the theme lacks is made in the theme (`theme/ui/`), shown on the
  Components screen, and used through `ui.tsx` (morpheme-website's rule).

### 4.5 When the search app bar is shown

- **Pages and Posts** always open with it (owner decision 3), even when short.
- **Every other list** has it when today's search row would show (more than 8 rows, or a sort or filter to offer). A short list without
  tools (three popups) gets the **medium flexible** app bar with its title, the palette's search icon and its actions, as every other screen.
  (P3 in section 11 asks whether every list should always have it instead.)
- The search app bar **stays at the top** while the list scrolls (M3: a search bar can "Remain fixed at the top of the screen"); the chip
  row scrolls away with the content and comes back on scrolling up (M3: the app bar "can hide and reappear when scrolling"). The bar takes
  `surface-container` once content is under it (M3: "On scroll, the container changes color to surface container"), as the theme's
  `data-stuck` already does.

### 4.6 Selection

While rows are selected the app bar is today's contextual bar: the selection's count and actions (`SelectionBar.tsx`), nothing else at its end.
M3's app bars pages print no contextual variant; the nearest is the small app bar (its headline the count, its leading button `Close`
selection). Unchanged from today, so no new deviation.

## 5. The small and medium flexible app bars

### 5.1 The page being written: small

As 0.18 leaves it (one-save spec, 3.1 to 3.4): back, the title (`Title large`, one line, truncated: M3 "Don't wrap text in a small app
bar"), the status as its subtitle (`Label medium`, a polite live region), the palette's search icon, `Publish` (and `Save` in 0.18's cases).
0.20 only moves it onto the theme's `TopAppBar kind="small"` and settles the bell (5.3). No overflow menu.

### 5.2 Every other screen: medium flexible

```
Phone, 375 px (Business › Contact), at the top             … and scrolled
┌──────────────────────────────────────┐                 ┌──────────────────────────────────────┐
│ ←                          🔍   [Save] │                 │ ←  Contact                 🔍   [Save] │
│ Contact                                │                 ├──────────────────────────────────────┤
│ Saved                                  │   subtitle      │ …                                     │
├──────────────────────────────────────┤
```

- **Leading:** the back arrow, **at every width** (today it is hidden from expanded, where the breadcrumbs take its place). The menu button
  below medium on a screen without a way back (none today but the start screen).
- **Headline:** the screen's title, `Headline medium`, wrapping to two lines at most, never truncated (M3). It collapses into a small app bar
  (title in the bar, one line) once the screen is scrolled, and stays small until it is back at the top (M3), through the theme's
  `collapsed` (`data-collapsed`).
- **Subtitle:** the screen's `status` (`Saved`, `3 redirects`, `Changed 2 hours ago`), `Label large`. A status that announces changes is a
  polite live region, as the page form's in 0.18.
- **Trailing:** the palette's search icon (0.18), then the screen's one action: a form's `Save` (a filled button, the same deviation as
  `Publish`, section 8 D3), or an icon button (`Versions`, `Edit dashboard` …). At most two (M3: "one action, two if necessary"); a screen
  that has more today keeps the extra in its content (section 9 lists the two that do).
- **The breadcrumbs go.** M3 prints no breadcrumbs; the back arrow names the screen it goes to (`title` and `aria-label`: `Back to
  Settings`, as today). From expanded the rail and the drawer show where the screen is. (P4.)
- **The row under the bar goes** with them: the title, the status and the page actions are in the app bar at every width, so the screen is the
  same at every width but for the rail and the drawer.

### 5.3 The bell and the website link

The bell is a "global product control" M3 allows beside the one action. It stays **on the start screen and on the list screens** (search app
bars, which have room: up to two trailing icons on a phone, four from expanded). On the **small and medium flexible** app bars it is not drawn
(the page being written, settings, forms, detail screens): there the search icon and the screen's action already make two (0.18 already lets it
leave the page form first on a phone). Notifications stay one tap away from the start screen, and in the palette (`Notifications`). (P5.)

**Open website** stays on the start screen (third trailing icon from expanded; below expanded the bell and Open website are the two, and
`Edit dashboard` moves to the end of the dashboard, P6).

## 6. Keyboard and screen readers

- Every app bar is a `<header>` with its parts in reading order: leading, headline (or search), subtitle, trailing. `Tab` reaches them in that
  order (M3: focus "should initially land on the leading button").
- The headline is the screen's `<h1>`, its accessible name its text (M3: "The accessibility label for a title should be the same as the
  content within the title"). In a search app bar, which has no headline, the `<h1>` is the screen's name, visually hidden, so every screen
  keeps one `<h1>` (`Pages`), and the search field's label is its hinted text (M3: "The hinted search text should be used as the
  accessibility label").
- The list narrowed by the search or a chip announces its count in a polite live region (`12 pages`), once typing pauses (M3: "When search
  suggestions and results appear, the screen reader must announce the change"). Today's list already has a count text; it gets the role.
- The chip row is a `role="group"` named after the list (`Filter pages`, the theme's `ChipSet` `label`). Each chip with a menu is a button with
  `aria-haspopup="menu"` and `aria-expanded`; a toggle chip has `aria-pressed`. `Tab` reaches the row, the arrow keys move between chips (M3),
  `Space` or `Enter` opens or toggles.
- `Ctrl+K` / `⌘K` opens the palette everywhere (0.18). `/` focuses the list's search bar when focus is not in a field (Gmail's and GitHub's
  key; M3 silent on keys). (P7.)

## 7. Texts (en-US first, da-DK)

New keys only; existing texts are reused (`common.searchIn`, the screens' search labels, `library.sort`, the sort and filter choices, the
filter groups' titles, `library.showSeo`, `library.showAsMenu`). The `site-editor-writing` skill and M3's word choice apply when they are
written; the build PR checks the Danish words against `src/i18n/da-DK/`.

| Key (proposed) | en-US | da-DK |
| :--- | :--- | :--- |
| `common.searchSite(site)` | `Search ${site}` | `Søg i ${site}` |
| `library.filterOf(list)` (the chip row's name) | `Filter ${list}` | `Filtrér ${list}` |
| `library.ratingChip` | `Rating` | `Vurdering` |
| `library.menuOrderChip` | `Menu order` | `Menuens rækkefølge` |
| `library.dateChip` | `Date` | `Dato` |
| `library.count(n, list)` (live region) | `${n} ${list}` | `${n} ${list}` |

The filter groups' chip labels are their group titles today (`Status`, `In menu` …). `t.library.showSeo` and `showAsMenu` stay as the chips'
tooltips. `library.hideSeo` and `showAsList` go in the last PR when nothing reads them.

## 8. Deviations (to `docs/material-deviations.md` in the PR that builds each)

- **D1. A list's search app bar narrows the list in place** instead of opening a search view. Material: "Selecting the search bar should open
  the search view component"; "Search bar: Use to search contents in a specific view". We do: the bar narrows the list under it; no search view.
  Why: the owner chose the search app bar for lists, and the list is the result list a search view would show. Needs the owner's approval (P1).
- **D2. A sort chip.** Material prints filter chips for filters, not for an order. We do: the first chip of the row is the sort, a filter chip
  with a menu, always selected. Why: the owner's row of chips holds sort, filter and date. M3 silent; nearest pattern named. (P1 covers it.)
- **D3. A labelled `Save` in the medium flexible app bar.** The same as 0.18's `Publish` (M3 prints icon buttons, "a single, primary, or
  tonal filled icon button"); the entry of 0.18 is widened to `Save`. Owner approval needed (P8; the 0.18 approval named `Publish`).
- Everything else follows what M3 prints: the variants and where each is used, no overflow menu, at most two trailing icons on a phone and four
  from expanded, the headline wrapping in medium flexible and not in small, the collapse on scroll, filter chips under a search field, never a
  single chip.

## 9. The screens, one by one

From the inventory of 14 Nov (routes in `src/App.tsx:833-956`). "Trailing" lists the outside trailing icons left to right.

| Screen | App bar | Leading | Search text | Chips | Trailing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Start | search | menu (compact), logo (medium+) | `Search {site}` | — | bell, Open website (+ Edit dashboard from expanded, P6) |
| Pages | search | back | `Search pages` | Sort, Status, In menu, Rating, Menu order | Deleted pages, bell |
| Posts | search | back | `Search posts` | Sort, Status, Rating | Deleted posts, bell |
| Folder lists (tags, popups, testimonials, cookie list, app lists) | search when 8+ rows or tools (4.5) | back | `Search {list}` | its sort and filters | Deleted, bell |
| Own lists | search (as folder lists) | back | `Search {list}` | its sort and filters | the list's menu (today a page action), bell |
| Files | search | back | `Search the files` | Sort, Use, Kind, Tag, Date | Deleted files, bell |
| Deleted (pages, posts, files) | search (as folder lists) | back | `Search deleted {list}` | — | bell |
| Redirects › All | search | back | `Search the redirects` | Sort, Page | bell |
| Redirects › Missing addresses | search | back | `Search the addresses` | sort inside the bar | bell |
| Block templates | search | back | `Search block templates` | Sort, its filter | bell |
| Block settings | search | back | `Search block settings` | Sort, its filter | bell |
| Apps, Connectors, Plugins | search | back | `Search apps` … | sort inside the bar | bell |
| App store | search | back | `Search for apps` | Sort, Category, State | bell |
| Theme store | search | back | `Search for themes` | Sort, Installed | bell |
| Licenses | search | back | `Search licenses` | — | bell |
| Consents | search | back | `Search by consent ID` | sort inside the bar | Download CSV, bell |
| SEO rating | search | back | `Search the pages and blog posts` | Sort, its filter | bell |
| A page or post, new page or post | small | back | — | — | search icon, (`Save`,) `Publish` |
| A settings form that becomes a subpage or side sheet (`settings-sheets-design.md`, section 4: Business forms, Logo and icon, Header, Footer, Privacy forms, Default pages, a block template, app settings, entries without a text body) | the subpage's app bar on compact, the side sheet's header from medium | back arrow (subpage) / close icon (side sheet) | — | — | `Save` in the bottom bar (subpage); `Save` and `Cancel` as bottom actions (side sheet) |
| A form that stays a screen (Colours; an entry with a text body) | medium flexible (Colours), small (an entry with a text body, as a page being written) | back | — | — | search icon, `Save` (D3; when and how it shows: autosave spec) |
| An entry with Versions that stays a screen (`DataForm`) | small | back | — | — | Versions, `Save` (the search icon leaves for Versions: two actions) |
| Settings, Appearance, Business, Privacy, Components and their screens; Themes, Icon packs, Motion, Side column, Caching and builds, Assistants, Account, CMS version, Status, a licence, an app's page and screens, a theme's page, a store app's and developer's page, Not found | medium flexible | back | — | — | search icon (+ one action where the screen has one) |
| Internal links (keywords inside a form) | medium flexible | back | — | its search row stays in the form (it searches a field, not the screen) | search icon, `Save` |

Two screens have more than two actions today: the start screen (P6) and a list item with Versions (above).

## 10. Build plan (small PRs into the 0.20 line)

Each PR is mergeable on its own, has a changeset (`minor` when visible, empty otherwise) and passes `check`; visible PRs also `npm run build`,
`npm run check:screens` (both widths), `check:themes` when the theme changes, and carry the `pm` skill's before and after screenshots of every
changed screen in a comment. The first visible PR writes the release note (one `paragraph`, mark `improvement`); later PRs update it.

| PR | What | Level | Depends on |
| :--- | :--- | :--- | :--- |
| 1 | **Theme: the filter chip with a menu** (trailing `arrow_drop_down`, `aria-haspopup`, the whole chip the target, a label that shortens) and the chip row (`ChipSet` wrap) as M3 prints them; on the Components screen. Re-read the chips and app bar specs pages by hand for the token values the script could not open. | `minor` (theme part) | — |
| 2 | **`Screen` draws M3's kinds.** `TopAppBar kind`: medium flexible by default (back at every width, headline wrapping, subtitle = status, collapse on scroll), `small` for the page form; breadcrumbs and the row under the bar go; the bell only on the start screen and search app bars (P5). Every screen gets its bar from one place; no screen code changes but the page form's `bar="small"`. | `minor` | — |
| 3 | **The search app bar for lists**, `Screen`'s `search` and `chips` props: the bar narrows the list (D1), the chip row with sort, filter, date, rating and menu order (D2); `SearchRow`, `Filters` and the `InputChip`s under it removed from every list screen of section 9; the count as a live region; `/` focuses the bar. The deviations D1, D2 to `docs/material-deviations.md`. | `minor` | 1, 2 |
| 4 | **Home: the search app bar opens the palette** as the search view (full screen below medium, docked from medium); the palette's search icon not drawn where a search app bar is; ends the palette spec's deviation 3 (remove its entry). | `minor` | 2, the palette (0.18) |
| 5 | **`Save` in the app bar of every form that stays a screen** (Colours, entries with a text body; the forms that become sheets get their `Save` from the sheets spec); FormFrame's floating Save bar no longer drawn on them (the page form lost it in 0.18). D3 to `docs/material-deviations.md`. Coordinated with the autosave spec's PR that shows `Saving…` / `Saved` as the subtitle. | `minor` | 2 |
| 6 | **Rules and clean-up.** `morpheme-website`'s `CLAUDE.md` *Søgeknapper* (text below), this repo's docs that name `SearchRow`; unused texts and the `SearchRow` export removed; `check:screens` assertions settled; this spec marked built. | empty | 3–5 |

The new rule for `morpheme-website/CLAUDE.md` (Danish, as that file is), replacing *Søgeknapper*:

> - **Søgning i appbjælken:** startskærmen og listeskærmene har M3's *search app bar* (`Screen` med `search`; "Search pages"); sortér, filtre,
>   dato, Google og menuens rækkefølge er filterchips i fast rækkefølge i én række under bjælken (`chips`); en chip, der ikke kan bruges, er
>   `disabled` og bliver stående; aldrig én chip alene (så står den i søgefeltet). Andre skærme: *medium flexible*, siden der skrives: *small*.

**New `check:screens` assertions** (`scripts/editor-screens.mjs`), both widths unless named:

- Every screen's app bar has one of the four kinds' classes (`.top-app-bar-search`, `-small`, `-medium-flexible`); no screen has a bar without
  a kind; no screen has breadcrumbs or a title row under the bar.
- Start, Pages, Posts, Files: a search app bar whose field's accessible name starts with `Search`; Pages and Posts with 1 page still show it.
- At 375 px no app bar has more than two trailing buttons outside its search bar (plus the filled action on small and medium flexible); at
  1280 px no more than four. No app bar has a menu button that opens more actions (no overflow menu).
- A list's chip row never holds exactly one chip; every chip is at least 48 dp high as a target; typing in the search bar narrows the rows and
  updates the live count.
- The medium flexible headline is not truncated (`scrollWidth <= clientWidth`) at 375 px for the longest title in English and Danish; after a
  scroll it has `data-collapsed`.
- Unit tests: the bar kind of a screen (`barKind(props)`), the chip row's order and the one-chip rule (`chipRow(tools)`), the trailing-count
  rule.

## 11. Proposed decisions (for the PM or the owner; recommendation first)

- **P1. Lists: the search bar narrows the list in place** (D1, D2), and the palette is reached from a list only by `Ctrl+K`. *Alternative:*
  selecting a list's search bar opens the palette's search view scoped to that list (M3's search view; the list stays behind it): one search
  component everywhere, but typing no longer narrows the list on the page.
- **P2. The start screen's hinted text is `Search {site name}`** (M3: "Search [Product]"), falling back to `Search` without a name.
  *Alternative:* `Search pages, posts and settings` (longer than the bar on a phone).
- **P3. A short list without tools keeps the medium flexible app bar** (4.5); only Pages and Posts always have the search app bar. *Alternative:*
  every list has the search app bar always (simpler rule; a search bar over three rows).
- **P4. The breadcrumbs go** (M3 has none); the back arrow at every width names the screen above.
- **P5. The bell only on the start screen and the lists' search app bars**, not on the small and medium flexible bars (two actions there
  already). *Alternative:* the bell everywhere, three actions on the forms (over M3's "two if necessary").
- **P6. `Edit dashboard` leaves the start screen's app bar below expanded** and stands at the end of the dashboard as a text button
  (`Edit dashboard`); from expanded it is the third trailing icon.
- **P7. `/` focuses the list's search bar** (the web's common key).
- **P8. `Save` is a filled labelled button in the medium flexible app bar** (D3), as `Publish` is in the small one.

No contract raise: additive, optional keys, a theme without the new part falls back (themeProblems does not require it).
DataTable and SettingsSheet are not on the public import list until a theme or app asks.
