# Command palette, one action registry, and no custom context menu (design)

Status: **ready to build in 0.18** (roadmap `docs/superpowers/plans/2026-11-14-roadmap-0-18-to-0-24.md`, *0.18 The editor*). Postponed past 0.17 on 13 November; the owner's
decisions of 14 November are folded in below. **One owner question is open** (section 11, question 3). Design only, no code. Written for a phone: plain words, short.

**Decided by the owner (14 November):**
5. **What the palette searches** (question 1): **(b)** the editor's actions, the places in the main menu (navigation), and pages and posts by title. Files later (section 10,
   step 6).
6. **How it opens** (question 2): **no FAB and no button per block.** The palette lists the selected block's actions first (section 4.1). In 0.18 it opens from `Ctrl+K` /
   `⌘K` and a **plain search icon button in today's top bar, on every screen** (section 4.8 lists the screens where that bar then has more than two actions). The M3
   *search app bar* (a search field in the app bar, as in Gmail) comes in **0.20** with the redesign of all screens' app bars, and the icon becomes that search app bar
   then. This spec does not design it.
7. **Two new kinds of action the registry carries once they exist** (decided the same day; their own spec is written by another session, so this spec only names
   them): **`Change to…`** (turn a repeating block into another: List, Steps, Segmented list, FAQ, Cards, Table) and **the image tools in the bar** (`Change image`,
   `Crop`, `Alt text`, `Remove`; on a video `Change address`). The registry lists them once their feature registers them; the palette lists only actions that exist
   (section 4.4).
8. **The block action row** above the active block (#625, `src/blockRow.ts`) is a place of actions of its own: the registry has four places, the **bar**, its **`⋮`**,
   the **row** and the **palette** (section 3).

**Decided by the owner (13 November):**
1. `Ctrl+K` / `⌘K` always opens the palette, also while typing text. *Link* gets no key.
2. **No custom right-click (context) menu anywhere in the editor:** "So we keep the no right click menu." The browser's or the operating system's own menu
   stays in text, on blocks, images, table cells, rows, files and links. (The owner first said "Right click opens the contextual menu", asked about Cut, Copy
   and Paste, and then reversed it after hearing that the browser and the phone already do those. Only the last word stands.) Section 5.
3. **Tools that do not exist in the editor today (Resize image, Duplicate block, and any other) are postponed past 0.17, each with a separate spec.** Owner: write specs for the missing
   things, but do not build them in 0.17 and do not extend 0.17. The palette lists **only actions that exist today** (an action is registered only when its feature exists, section 3).
4. **The whole command palette, and with it the shared action registry, was postponed past 0.17.** It is now in 0.18 (see the status line). D1 and D2 stand.

## What exists today, and what the palette builds on (checked on `0.18`, 14 November)

The palette and the registry are new in 0.18. What they build on is built and does **not** depend on them:

- **The one bar (#519)** and its `⋮`: `MarkdownEditor.tsx` with `src/textBar.mjs` (`planBar`: which tools stand on the bar and which go into its `⋮`, by the bar's width),
  and `src/blockBar.ts` (the active block's tools, read by the bar). Section 2 has the details.
- **The block action row (#625)** above the active block: `src/blockRow.ts`, fed by `blockBar`'s `row` (Move up, Move down, Hide or Show, Settings, then the drag handle).
- **Selection (#529):** `SelectionBar.tsx` swaps the top bar's actions on list screens; block selection puts the count in the bar's contextual group.
- **`Ctrl/⌘+K` is not used** by the editor today; the key stays the browser's until step 4 of section 10.

None of these uses a registry. When it is built (section 10, step 5), the bar's tool lists, `blockBar`'s actions, menu and row move into it once, through an adapter first, so
the bar, its `⋮` and the row look the same.

Owner's words (editor menus, 13 November): editor interfaces are content-first, so the UI around the content takes little room.
Do not stuff every feature into one scrolling drop-down or drawer. Three layers: (1) a **quick toolbar** with only the top actions
(the one bar of PR #519, not redone here); (2) **context menus** (right click, secondary click) with the actions where the user
works: text selected, only text actions; an image selected, crop and resize actions (**the menu was decided against**, see above and section 5; resize has its own spec, `2026-11-13-resize-image-design.md`); (3) a **command palette** (Cmd/Ctrl+K, like
VS Code, Figma, Notion): a floating search bar where the user types the action. Icon-only buttons get tooltips with the keyboard
shortcut.

Words: the **bar** is the one toolbar of #519. An **action** is one thing the editor can do (Bold, Move up, Go to Files). The
**registry** is the one list of actions (section 3). The **palette** is the search over the registry. A **part** is a ready-made piece of the theme (`theme/ui/`) that a theme can restyle.

## Short answer

- **One registry, four places.** Every action is defined once (`src/actions.ts`): its name, icon, shortcut, where it applies, when
  it can run, and what it does. The bar, its `⋮`, the block action row and the palette are four views of that list. A new tool is
  added in one place and shows up in each place it names, with the same name and shortcut.
- **Palette:** `Ctrl+K` (`⌘K` on a Mac) and a plain search icon button in today's top bar, on every screen, open it (in 0.20 the icon
  becomes the M3 search app bar). It lists the selected block's actions (or the text's) first, then everything else, and runs the one you
  pick. It searches actions, the places in the main menu and pages and posts by title. It uses the theme's **Search** view (full screen
  on a phone, docked from medium), not a dialog. No FAB and no button per block.
- **No custom context menu.** The browser's or the OS's menu stays everywhere (owner). The actions of text, an image, a table cell or a block are
  on the bar, in its `⋮` and in the palette (section 5). This spec adds **no long press** either, so it cannot clash with #529.
- **Nothing new is drawn.** Search is a theme part and one is missing: a Search view that React can drive (the one today is only drawn in the editor).
  A menu that opens at a point is **not** needed any more (only right click and a long press menu needed it).
- **M3 has no command palette page.** The palette is the owner's request (their words are quoted above), so it is built from what M3
  does print: the Search view, a List, a top app bar icon button, tooltips. Everything the pages do not print is marked **M3 silent**
  in section 1b, with the nearest M3 pattern, and is not presented as M3.
- **The owner's rule (PM, 13 November): M3 everywhere except the editor's own workspace.** The workspace is the bar, its `⋮`, and the
  text and block menus: there, and only there, a deviation is allowed, listed in section 9 with the M3 quote. The palette, the top-bar
  button, the Search view, the lists in it and every theme part are **outside** the workspace: they follow what M3 prints.

## 1. What Material says (read 13 November 2026 with Playwright)

Pages read (`goto` with `networkidle`, 3 to 4 s wait, `document.body.innerText`): `m3.material.io/components/menus/` guidelines, specs,
accessibility; `/components/search/` overview, guidelines, specs, accessibility; `/components/lists/` guidelines, specs,
accessibility; `/components/top-app-bar/guidelines`; `/components/icon-buttons/accessibility`; `/components/dialogs/` guidelines,
accessibility; `/components/bottom-sheets/` guidelines, accessibility; `/components/tooltips/` guidelines, accessibility;
`/foundations/interaction/inputs` and `/gestures`. Quotes are exact.

**Menus** (guidelines)
- "Use a menu to show a temporary set of actions. To show actions on screen at all times, use a toolbar instead."
- "A menu should open when a person: Selects an element, such as an icon, button, or text field; Performs a specific action to
  trigger the menu, like right-click or press-and-hold". Uses: "Overflow menus, Text field dropdown menus, Select menus, Context menus".
- "A secondary click, like a right-click on a mouse or a two-finger tap on a trackpad, opens a context menu." It "can reveal key
  actions related to the associated content."
- "When a menu item can only be used under specific conditions, it should appear disabled rather than be removed." (example: "The
  Redo action is disabled when that action isn't available".)
- "Menu items can include label text, leading icons, trailing icons, and keyboard commands." (so a shortcut is trailing text.)
- "If a menu is in a position to be cut off, it should automatically reposition to appear to the left, right, or above the element
  that generates it." A menu "can appear in context, like next to highlighted text or a selected image".
- "Consider adapting menus into bottom sheets on small screens." "On medium and expanded windows, menus are most effective as they
  appear in context with the content. ... can use submenus".
- "Use a divider for: Scrollable menus". "On web, use a divider to separate menu items." "Don't use gaps in scrollable menus." Gaps
  are "not currently available on web".
- "Menus can scroll when all menu items can't display at once. In this state, menus show a persistent scrollbar."
- "In dense products, such as on desktop, menus can open instantly to reduce motion."
- "Don't add buttons, switches, or other direct actions into the menu item." "Targets should be 48x48dp or larger."
- "A menu can include a text field to filter options. This pattern is also known as autocomplete." (for a long list of options.)

**Menus** (accessibility)
- "When a menu opens, focus should be placed on the first menu item." Exit by "Selecting an option; Tapping Escape or outside of the
  menu; Using the system back button". "Where focus is placed after closing the menu depends on the app."
- Keys: "Space or Enter: ... Selects a menu item; Up and Down arrows: Moves focus to the next item; Left and Right arrows: Opens or
  closes a submenu; Letters: Focus moves to the next menu item starting with letter; Escape: Closes menu".
- "Disabled menu items can receive focus but aren't selectable. Dividers and gaps can't receive focus."
- "The accessibility label should be the same as the menu item text." Role on web: menu item. An icon beside text "is marked as
  decorative".

**Search** (guidelines, accessibility)
- "Use search for products with many items to manage, such as files or messages." "Search helps people find information quickly."
- Focused search is "Docked: opens a list below the search bar, with a scrim covering main content" or "Full-screen"; "Docked
  layout: Best for medium and expanded windows; Full-screen layout: Default for compact breakpoints".
- "Search suggestions can appear before text is entered" ("Show historical suggestions before typing"). Results show "in a list";
  "consider adding ... Leading icons ...; Category labels, like Recent, Contacts, or Suggestions". "Use gaps to separate a list of
  suggestions or results into groups."
- "A search bar should have one or two trailing icons"; "Search icon button: Use when search is a secondary action or not the
  main focus." "The back icon releases focus, dismisses any suggestions or results, and returns the search bar to its original state."
- "To execute a search, a person can: Type a query and press Enter; Select a suggestion or result".
- Accessibility: "When search suggestions and results appear, the screen reader must announce the change." "Initial focus lands on
  the first interactive element ... If there's no leading icon, focus lands on the text field." Keys: "Arrows: Navigate between
  search result items". The hint text is the accessibility label; results are a list.

**App bars** (guidelines; the page was *Top app bar*, now `m3.material.io/components/app-bars/guidelines`; re-read 14 November with Playwright, quotes exact):
- "Use an app bar to provide content and actions related to the current page, such as page navigation actions, headlines, images, and 1–2 essential actions."
- "The information and actions in the app bar should be contextual and specific to a page, but can also include global product controls, such as search or
  notifications."
- "App bars should only have one action, two if necessary." "If the product has many actions, place those in a toolbar. Avoid placing an overflow menu in the app
  bar when possible."
- Trailing icon buttons: "Up to two icon buttons can be placed after the headline, aligned to the trailing edge of the app bar. Place most-used actions closest to
  the leading edge." "Avoid using these buttons to open a menu with more actions."
- Adaptive: "Resizing may cause actions at the trailing edge of the app bar to collapse into an overflow menu at smaller breakpoints. These actions become visible
  again at larger sizes."
- Search app bar (for 0.20, not designed here): "Use on home pages when search is key to the product." "Use a search app bar to provide an emphasized entry-point to
  open the search view." "Search app bars have a search field instead of heading text"; "search app bars can have up to two trailing icons on mobile"; "There should
  be up to four trailing icons on larger screens." "Selecting the search bar should open the search view component."

**Search** (guidelines, re-read 14 November): "Search app bar: Use this app bar variant when search is the primary, global function"; "Search icon button: Use when
search is a secondary action or not the main focus"; "For global search, use a persistent search app bar, integrated into an app bar". "Search suggestions or results
should swap from full-screen in compact windows to docked in larger breakpoints." The overview's availability list still says Web: "Unavailable".

**Icon buttons** (accessibility): "On web, icon buttons should display a tooltip with an accessibility label." "The target size of each
icon button should be at least 48dp". "Don't apply density to icon buttons by default."

**Lists** (guidelines, accessibility): list items can have "Label text", "Supporting text", "Trailing text", "Leading icon"; "A leading icon
should provide a quick visual cue that relates to the item's label text". "The first element in a list should always receive focus, unless
the list has a selected element"; "navigate within the list using arrow keys"; "All list items must be able to be activated using the Space
or Enter key." Lists specs: "Target size must be at least 48x48dp."

**Dialogs** (guidelines)
- "Dialogs are purposefully interruptive, so they should be used sparingly. A less disruptive alternative is to use a dropdown
  menu." "Use dialogs for prompts that block an app's normal operation, and for critical information that requires a specific
  user task, decision, or acknowledgement." So a palette is not a dialog.

**Bottom sheets** (guidelines): "Use a modal bottom sheet as an alternative to inline menus or simple dialogs on mobile, especially
when offering a long list of action items". "The initial vertical position of modal bottom sheets can't exceed 50% of the screen
height." Dismissed by "Tapping a menu item", "Tapping the scrim", "Swiping the sheet down".

**Tooltips**: plain tooltips are "best used for labelling UI elements with no text, like icon-only buttons"; "Avoid wrapping text
to multiple lines or including many pieces of information"; they "disappear 1.5 seconds after navigating away".

**Inputs and gestures**
- "Secondary click: Activate context menus"; "The context menu shows additional options for the object that's clicked."
- "When interacting using touch, always show touch controls, even if other inputs are connected. When using a mouse, trackpad, or
  stylus, show the I-beam and context menu, even if it's a touch device." (text.)
- Gestures: "Long press: People can access additional functionality by pressing on elements for an extended time." (example:
  "Long pressing a list item selects it").

**What I could not read, and say plainly:**
- **No page for a command palette** exists in the pages I read (menus, search, dialogs, bottom sheets). I did not find one in the
  Components or Foundations menus either; nothing here says "command palette" or "Cmd+K". Search is the nearest.
- **Where a docked search view stands when there is no search bar** (our case: a key opens it). The text says docked "opens a list
  below the search bar"; it says nothing for a view opened by a key or an icon button. I wrote none.
- The menus **web** status: the Search page says Web is "Unavailable" and the Menus page says gaps are not on web; the theme's parts
  are our own build of the design.
- **The Search specs' measurements and tokens** (docked width and height, margins other than the two the guidelines print: "Unfocused:
  24dp, Focused: 12dp"): the token tables are collapsed script modules and I did not expand them. I wrote **no size** for the palette;
  it takes the theme's own Search view sizes (`--search-*`).
- The images, videos and token tables of every page above (script-drawn, no text); the side-sheet pages (not read; the palette
  does not use one); anything on keyboard shortcuts (opening search, labelling them in tooltips: not found); web ARIA roles for search
  (the page names Android and iOS roles only); the dialogs specs and top app bar accessibility pages (fetched, not relied on).

### 1b. What is M3 and what is ours (M3 silent)

So nothing of ours is read as M3. "Nearest M3" is the pattern I used where the pages say nothing.

| Piece of the palette | M3 prints | Where M3 is silent: ours, and the nearest M3 pattern |
| --- | --- | --- |
| A palette that runs actions | Search "helps people find information quickly" in "products with many items to manage" | **No M3 page for running actions from a search.** Owner's request. Nearest: Search (focused search, results in a list) |
| Entry | "Search icon button: Use when search is a secondary action"; the app bar "can also include global product controls, such as search" | The key `Ctrl+K`: **M3 silent** on shortcuts for search. Nearest: none; owner's words. The app bar "should only have one action, two if necessary": on most screens the icon makes two; where it makes more, section 4.8 and deviation 3 (section 9). A search icon button that opens actions as well as content: owner's words (deviation 1) |
| Layout | Full-screen is the default for compact; docked "best for medium and expanded" and it "opens a list below the search bar" | Docked **without a bar**: M3 silent. Nearest: the theme's Search view as it is (it docks where the bar is); where that is for a button, not a bar, is default 3 in section 11 |
| Before typing | "Show historical suggestions before typing"; "Category labels, like Recent, ... or Suggestions" | How many (our 5 and 6), and which stored: ours |
| Results | A list, "Leading icons", "Category labels", "Use gaps to separate a list of suggestions or results into groups", a clear icon, back icon; trailing text on a list item | The ranking, the 30 cap, folding `æøå`, the fuzzy rule and every score in 4.3: **ours**, tuning values for step 1, not M3 |
| Keys | Arrows between results; Tab; Space or Enter activate (Search, Lists accessibility); Escape "dismiss elements" (Inputs) | `aria-activedescendant`, `Home`/`End`, `Enter` runs: ours, WAI-ARIA practice. M3 gives no web role for search |
| Announcement | "the screen reader must announce the change" | The wording of the live region: ours |

## 2. What the editor has today

- **The one bar, its `⋮` and the block action row (read on `0.18` at `ece1b62`, 14 November).** One bar sits at the top of the text's box
  (`MarkdownEditor.tsx`, the `Toolbar` with `editor-tools`). Its places, each with its own list today:
  - **Bar, contextual group:** the text's tools (`bold`, `italic`, `style`, `list`, `align`, `link`, `color`) or, while a block is active, the
    block's tools in `BLOCK_TOOL_ORDER` (`blockBar.ts`: Add below and above, the Table's column actions, the gear, Link, the dynamic `Rows from`
    shortcut, Move up and down of a row, delete row and column, the column's alignment), each a `BarAction` (`contextualMenu.ts`); while
    blocks are selected, the count with its cross first.
  - **Bar, fixed group:** Undo, Redo and Insert block, always at the right end.
  - **`⋮`:** what does not fit (`planBar` in `textBar.mjs` fills the bar by width; the first tool that does not fit and every one after it go
    into the `⋮`), then *Section settings* while it applies, then, after a divider, the active block's own menu (`BlockBarState.menu`): the
    list page link of a block that reads a list, *Select block*, *Remove*.
  - **Block action row (#625, `blockRow.ts`):** right above the active block's top item, Move up, Move down, Hide or Show, and Settings
    (only when the block has settings), then the drag handle. `splitRow` (`blockBar.ts`) splits a block's items between the row and the `⋮`:
    "Each action is in one place only." A card that is not typed in place (`cardBar`) uses the same split.
  - **Other screens:** `OwnListPage.tsx` keeps its floating `contextualMenu` with its own row actions; list screens have `SelectionBar.tsx`.
  None of it shares one definition: the text tools are built in `toolOf` and `moreRows` (`MarkdownEditor.tsx`), the block's in `blockBar`.
- **Navigation** is data already: `menuTree` (`lib/menu.mjs`) from the site's groups, drawn by `MainMenu.tsx`, and the screens in
  `App.tsx` (about 820–890: Home, Files, Redirects, SEO rating, Appearance and its Themes, Icon packs, Motion, Colours, Logo and icon,
  Block settings, Caching and builds, Assistants, Licences, Morpheme, Apps, App store, Status, Account, Notifications, the lists,
  `new/<list>` for a new page or post, `deleted/<list>`).
- **Page actions:** Save changes (`t.common.saveChanges`), Preview (`t.common.preview`), and the draft and publish actions of
  the drafts plan (`2026-11-11-drafts-and-publish-plan.md`) when built. I found no *Publish* text in `en-US` yet, so the registry
  step reads the real set from the code.
- **Shortcuts:** none of the editor's own. Grep finds no global key handler; only Escape in the Library, Notifications, menus and
  sheets. The text engine (Milkdown) has `Mod-b`, `Mod-i`, `Mod-z` and others (#519 section 8 lists them; not tested here, and none for Link).
- **The top bar** (`Screen.tsx`, drawn into `topBarSlot.tsx`): at its end the screen's page actions (below expanded), its `actions`, then
  `NotificationsButton` on every screen, the website link on the start screen, and the drawer button where there is one. While rows are selected,
  the `SelectionBar` takes that end alone. Section 4.8 counts what each screen has there today.
- **Context menus:** none. `onContextMenu` appears only in `theme/ui/longPress.ts`, to keep the browser's menu away from a long press.
- **Search:** `SearchBar` and `SearchRow` (a field that narrows a list in place, `ui.tsx` 879–911). The theme's `Search` part
  (`theme/ui/Search.tsx`) has the search *view* (a `<dialog class="search-view">` with a combobox field, a `listbox` of options, a back
  and a clear button), but "in the editor only drawn": opening, narrowing and arrow keys are `search.script.ts`, for the site.
- **Menu:** the editor's `Menu` (`ui.tsx`) opens under a button (`anchor` is an element), is placed by the theme's
  `sitePlaceMenu`, closes on outside tap, Escape and scroll, and on a phone is a bottom sheet titled with its `label`. Its
  `MenuItem` has icon, `selected`, `disabled`, and a tap keeps the cursor in the text. The theme's `MenuItem`
  (`theme/ui/Menu.tsx`) also has `trailingSupporting` (a shortcut), `submenu`, `checked` and groups with a divider.
- **Tooltips:** `useTooltip` (`ui.tsx`): the name, after 500 ms under a mouse, at once on keyboard focus, not on touch. No shortcut in
  it and no `aria-keyshortcuts` (also #519 section 8).
- **Recent things:** `useKept` keeps a list's search in memory only. `sidebar.ts` shows the pattern for a value kept in
  `localStorage` with `try/catch`.

## 3. One registry

**The type** (`src/actions.ts`, no UI; the rules are pure functions in `lib/actionRules.mjs`, tested with `node --test`):

```
type EditorAction = {
  id: string                       // 'text.bold', 'block.move-up', 'go.files': stable, stored in recent
  label: string                    // t.actions.* (English first, Danish in da-DK); the same text on every surface
  icon?: Icon
  group: 'go' | 'page' | 'text' | 'insert' | 'block' | 'image' | 'table' | 'list' | 'setting' | 'app'
  words?: string[]                 // other names to search (English and Danish): 'bold' → 'strong', 'fed'
  shortcut?: { key: string }       // 'Mod+K': Mod is ⌘ on a Mac, Ctrl elsewhere; shown, and set as aria-keyshortcuts
  handledBy?: 'registry' | 'text'  // who listens to the key: 'text' = the text engine's keymap (it stays there)
  where: {                         // which places show it, and in what order; bar, more and row: at most one of them
    bar?: { context: Context; order: number }   // the one bar; planBar moves it into the ⋮ when the bar is too narrow
    more?: { context: Context; order: number }  // always in the bar's ⋮ (Section settings, Select block, Remove)
    row?: { order: number }                     // the block action row above the active block (blockRow.ts: up, down, visibility, settings)
    palette?: boolean | { rank?: number }       // default true
  }
  state: (ctx: Ctx) => 'enabled' | 'disabled' | 'hidden'  // + `reason` for a disabled one
  pressed?: (ctx: Ctx) => boolean  // a toggle (Bold) or the current choice (Align centre)
  run: (ctx: Ctx, arg?) => void
}
```

- **Ctx** is where the user is now: the route, whether text, a block, an image, a table cell, a list row or a list selection is
  active (and which block type), the text's selection, whether there is something to undo or redo. The same Ctx drives the bar (#519's
  states), its `⋮` and the palette, so *Move up* is disabled in all three at once.
- **Who registers.** A screen or editor registers its actions while it is mounted and gets back a dispose function.
  `App.tsx` registers navigation from `menuTree` (so every part, app and list in the menu is a "Go to" action by itself, and an
  installed app's pages appear with no work). `MarkdownEditor.tsx` registers the text and block actions with its `view` in hand (a
  text engine command needs it; it is the top scope while the text has the focus). `blocks.ts` gives one *Insert <block>* action per
  block (`SiteBlock.label`, grouped by `BlockGroup`). Lists give *New page* and *New post*. A **provider** (a function from the
  query to actions) gives the pages and posts by title from `files`, so they are not thousands of registered actions.
- **Four places, one list.** The bar's text tools (`toolOf`), `blockBar`'s `actions`, its `menu` and its `row` collapse into registry entries
  with a `bar`, `more` or `row` place. `planBar` keeps deciding by width which `bar` entries go into the `⋮`; `splitRow`'s rule ("Each action is
  in one place only") becomes the rule that an entry has at most one of `bar`, `more` and `row`. Every entry is in the palette unless it says
  `palette: false`. **This spec does not change the design of the bar, the `⋮` or the row;** it changes where their lists come from, through an
  adapter first (section 10, step 5), so nothing looks different.
- **Actions that come later register themselves.** Two are decided (owner, 14 November) and have their own spec, written by another session:
  **`Change to…`** (turn a repeating block into another: List, Steps, Segmented list, FAQ, Cards, Table; a `block` action, one entry per target
  block, listed in the palette as "Change to Steps") and **the image tools in the bar** (`Change image`, `Crop`, `Alt text`, `Remove`; on a video
  `Change address`; `image` actions with a `bar` place). Their places on the bar, in the `⋮` or in the row are decided by that spec, not here.
  They are registered when their feature lands, and not before: the palette never lists an action that does not exist.
- **Shortcuts live in one place.** Keys for the text engine stay in its keymap (`handledBy: 'text'`: the registry only
  documents them in tooltips, the `⋮` and the palette). Global keys (only `Mod+K` here) are one `keydown` listener. A unit test fails
  on two actions with the same key in overlapping scopes and on a key the browser keeps (`Ctrl+T`, `Ctrl+W`, `Ctrl+L`, `Ctrl+N`, `Ctrl+R`,
  `Ctrl+Tab`, `F5` and similar).
- **A tool is defined once, so the owner sees the same word everywhere**, and the `check:language` rule (no Danish outside
  `da-DK`) holds: labels are in `t.actions`.

## 4. The command palette

### 4.1 What it shows

```
PHONE 375 px (full screen)               COMPUTER 1280 px (docked, scrim behind)
+-----------------------------+          +--------------------------------------------+
| [←]  Search actions…    [x] |          |        +------------------------------+    |
+-----------------------------+          |        | [←]  Search actions…    [x]  |    |
| Recent                      |          |        +------------------------------+    |
|  ⏱ Bold                     |          |        | Suggested                    |    |
|  ⏱ Go to Files              |          |        |  B  Bold                ⌘B   |    |
| Suggested                   |          |        |  I  Italic              ⌘I   |    |
|  B  Bold                    |          |        |  🔗 Link                     |    |
|  …                          |          |        | Go to                        |    |
| Go to                       |          |        |  ⚙  Appearance               |    |
|  …                          |          |        +------------------------------+    |
+-----------------------------+          +--------------------------------------------+
```

- **Empty query** (M3: "Show historical suggestions before typing", "Category labels, like Recent, ... Suggestions"): while a block
  is selected or active, *Suggested* comes first with **that block's actions** (row, bar, then `⋮` order, up to 6): this is how a block's actions are
  reached without a button per block (owner, 14 November). Then *Recent* (the last 5 actions you ran). With no block, *Recent* first, then
  *Suggested* (the text's or the screen's actions, up to 6). Nothing else.
- **With a query:** results in groups with a label each: the current context's actions first (*Text*, *Block*, *Image*, *Table*,
  *List* by what is active), then *Insert*, *Page*, *Go to*, *Pages and posts*, *Settings*, *Apps*. At most 30 results, scrolling.
  A group with no hit is not shown.
- **A row** is a theme `ListItem`: leading icon, the name as headline, the group or the path under it when it helps ("Settings ›
  Caching and builds"), the shortcut as trailing text (the same `trailingSupporting` that `MenuItem` has). A toggle shows its state
  (Bold: checked).
- **Actions that cannot run now.** Only the **current context's** actions that are unavailable are shown, disabled, with the reason
  under the name ("Nothing to redo", "Select text first"): M3 "disabled rather than removed". Actions of a context you are not in
  (table actions with the cursor in a paragraph) are not listed at all: they would be noise. M3 prints nothing on this for a search (**M3 silent**, 1b);
  its "disabled rather than removed" is a menu rule.
- **Empty result:** "Nothing found for “x”". The field stays focused.

### 4.2 Opening, closing, running

- **Open:** `Ctrl+K` (`⌘K`) from anywhere in the editor, also with the cursor in text (decided, D1 in section 11), and a **plain search icon button in
  today's top bar, on every screen** (D6; M3: "Search icon button: Use when search is a secondary action or not the main focus"). It is the theme's
  `IconButton` with the Material Symbols `search` icon (`Icon`, `src/icon.tsx`), the first of the bar's trailing actions, before the screen's own
  actions and `Notifications` (`Screen.tsx`; M3: "Place most-used actions closest to the leading edge"). The button is how a phone, a tablet and
  anyone who does not know the key finds it; its tooltip says "Search  Ctrl+K". While a `SelectionBar` takes the bar's end (rows selected), the
  icon is not drawn, as the screen's other actions are not; `Ctrl+K` still opens the palette. The key calls `preventDefault`, so a browser that
  uses it for its own search (Chrome and Firefox on Windows and Linux use `Ctrl+K` for the address or search bar) does not take it; I did not
  test each browser.
- **No FAB and no button per block** (D6). In **0.20** the icon becomes the M3 search app bar, with the redesign of all screens' app bars; this
  spec does not design it.
- **Close:** Escape, the back arrow ("The back icon releases focus, dismisses any suggestions or results"), a tap on the scrim, the
  phone's back gesture (`useSheetBack`). The clear button empties the field and keeps it open.
- **Run:** Enter on the highlighted result, or a click or tap. It runs the action and closes, and the **focus goes back to where it was**:
  in text, the selection is saved when the palette opens and restored before the action runs, so *Bold* bolds the words that were
  selected (the same problem as #519 risk 3: opening a dialog blurs the text). A "Go to" action moves to its screen and the focus goes
  to that screen's heading.
- **Arguments:** an action that needs a choice (*Align*, *Text colour*, *Text style*) is listed as its choices ("Align centre"), so it
  runs in one step. No second palette page.

### 4.3 Search and ranking (pure, `lib/actionRules.mjs`, no library)

1. **Fold** both the query and the texts: lower case, accents off, `æ` `ø` `å` also match `ae` `o` `a` (Danish users type both).
2. **Split** the query on spaces; **every word must match** something in the action (its label, its `words`, its group, its path).
3. **Score** per action, best match of its fields: whole label equal (100) > label starts with the query (80) > a word of the label
   starts with it (60) > all query words start words of the label (50) > the letters in order inside the label ("bld" finds "Bold", only
   from 3 letters, 20) > match in `words` or the path (30). Add 15 if the action is in the current context, 10 for each of the last 5 you ran
   (most recent highest, shown first when the query is empty), and up to 5 for how often you ran it. Ties keep the registry order (stable).
4. **Search the language you use and English**, so "fed" and "bold" both find Bold in a Danish editor (`words` hold both).
5. **Pages and posts** match on title and address; they rank under actions on a tie.

Unit tests (`node --test`) cover each rule: exact before prefix, prefix before fuzzy, a word match in the middle of a label, Danish
folding, the context boost, recent ordering, the 30 cap and the stable order.

### 4.4 Which actions (real ones, from the code)

| Group | Actions | Source |
| --- | --- | --- |
| Go to | Home, every section and row of the main menu, Settings, Notifications, Account, Files, Redirects, SEO rating, Status, Apps, App store, Themes, Icon packs, Motion, Colours, Logo and icon, Block settings, Caching and builds, Assistants, Licences, Morpheme, Deleted pages and files | `menuTree`, `App.tsx` routes (the places in the menu: D5) |
| Pages and posts | Open "<title>", New page, New post | `files`, `new/<list>` |
| Page | Save changes, Preview (draft and publish actions when the drafts plan lands) | `t.common.saveChanges`, `t.common.preview` |
| Text | Bold, Italic, Link, Main heading, Heading, Subheading, Body large, medium, small, Label, Quote, Bullet list, Check list, Numbered list, Align left, centre, right, Text colour, Undo, Redo | `toolOf`, `moreRows` and the style, list, align and colour menus (`MarkdownEditor.tsx`) |
| Insert | Insert image, one *Insert <block>* per block (Table, Cards, List, Steps, Buttons, Price cards, Video, Notice, Testimonials, Posts, HTML, …) | `blocks.ts`, `BlockGroup` |
| Section | Section settings, Section colour, Background image, Width | `t.text.section*` |
| Block (row) | Move up, Move down, Hide or Show, Block settings | `blockBar` `row`, `splitRow`, `moves` (`MarkdownEditor.tsx`) |
| Block (bar and `⋮`) | Add above, Add below, Move a row up and down, Link, Edit (gear), Rows from (dynamic), the list page link, Select block, Remove | `BarAction` (`contextualMenu.ts`), `blockBar` `actions` and `menu` |
| Table | Row above, Row below, Column before, Column after, Delete row, Delete column, Align column left, centre, right, auto | `BarAction`, `gridActions` |
| Image | Edit (opens the image sheet: image, alt text, format and Crop) today. *Change image*, *Crop*, *Alt text*, *Remove*, and on a video *Change address*, once their own spec's work lands (D7) | `imageView` in `MarkdownEditor.tsx` (`describe`); the image tools' spec |
| Change to | *Change to List*, *Steps*, *Segmented list*, *FAQ*, *Cards*, *Table*, for a repeating block, once its own spec's work lands (D7); not the block's own type | the `Change to…` spec |
| List screens | Delete N selected, Close selection, and the `SelectionBar`'s other actions (only while a selection exists) | `SelectionBar.tsx`, `Library.tsx`, `Notifications.tsx` |

**Only actions that exist (D3, D7).** *Resize image* (`2026-11-13-resize-image-design.md`), *Duplicate block*, `Change to…` and the image tools have their own specs.
Each is registered when its feature lands, and the palette lists it then, not before. The registry makes this free: an action appears in the palette only when its
feature registers it.

### 4.5 Phone

- **Full screen** on compact (M3: "Full-screen layout: Default for compact breakpoints"): the back arrow, the field, the clear button, then the
  results, each row 48 dp or more. The keyboard opens with the sheet; the results scroll above it.
- It is opened by the **top-bar search button** (no key on a phone). A text action from the palette on a phone works the same way (the
  selection is restored), though most phone users will use the bar; the palette still lists them. This is the recommendation of the **one
  open owner question** (section 11, question 3); step 5 builds it so, and leaving them out on a phone is a filter in the same step.
- Closing: the back gesture closes the palette before it leaves the screen (`useSheetBack`).
- **From medium and wider:** the theme's Search view in its **docked** layout, with its own sizes and scrim, unchanged (M3: "Docked layout:
  Best for medium and expanded windows"). Where it stands when a button and not a search bar opens it is **M3 silent** (1b); I give no
  position or width (default 3 in section 11).

### 4.6 Recent actions

- The last 8 ids (5 shown), and a small use count per id for the boost, in `localStorage` under `editor-recent-actions`, read and
  written in `try/catch` like `sidebar.ts`. It stays in the browser: never sent anywhere, not committed.
- An action with an argument stores its target (`go.page:/about`) and is dropped when the target no longer exists.
- It is cleared on sign-out (a shared computer) and by the action *Clear recent actions*.

### 4.7 Accessibility

- **Container:** the theme's search view, a modal `<dialog>` (inert page behind, scrim, focus trapped; `lib/focusTrap.mjs` exists),
  `aria-label` "Search actions". Escape closes (Inputs page: "People typically expect the Escape key ... to dismiss elements"). M3's
  *alert dialog* role is for its basic dialog ("critical information"), which this is not. M3 names no web role for search (Android and iOS
  only), so the roles below are the ones the theme's `Search` view already draws plus WAI-ARIA practice: **ours, not M3**.
- **Field:** `role="combobox"`, `aria-expanded="true"`, `aria-controls` the list, `aria-autocomplete="list"`, **`aria-activedescendant`** the
  highlighted option (the focus stays in the field while arrows move through the list: M3 "Arrows: Navigate between search result
  items"). Initial focus on the field.
- **List:** `role="listbox"`, groups as `role="group"` with `aria-labelledby` their label, rows `role="option"`, `aria-selected` on the
  highlighted one, `aria-disabled` on a disabled one (it can be highlighted but not run, as M3 says of a menu), shortcut as
  `aria-keyshortcuts`. The icon is `aria-hidden`.
- **Live region (`aria-live="polite"`):** "5 results" or "Nothing found", on each change of the query (M3: "the screen reader must announce
  the change").
- **Keys:** `↑` `↓` move, `Home` `End` first and last, `Enter` runs, `Esc` closes, `Tab` stays inside (to the back and clear buttons).
- **Targets 48 dp, contrast and motion** from the theme tokens (`--search-*`, `--motion-*`, which honour reduced motion).

### 4.8 The search icon in each top bar (checked 14 November)

Measured with Playwright on the built demo (`npm run build`, the editor served as `check:screens` serves it), 33 screens at 375 × 812 (touch) and
1280 × 900, counting the buttons and links at the end of the top bar (the menu button, the back arrow and the logo at its start are not actions).
M3: "App bars should only have one action, two if necessary"; "Up to two icon buttons can be placed after the headline".

| Screen | Actions at the end today (375 / 1280) | With the search icon | Fits? |
| --- | --- | --- | --- |
| Every other screen (Lists, SEO, Redirects, SEO rating, Business, Colours, Logo and icon, Appearance, Themes, Icon packs, Motion, Block templates, Block settings, Header, Footer, Settings, Caching and builds, Assistants, Licences, Morpheme, Status, Apps, App store, Account, Deleted files, Components) | Notifications (1 / 1) | 2 / 2 | **Yes** |
| A page or post being edited (About, a blog post) | Preview, View on the website, Notifications (3 / 1; from expanded the first two are in the row under the bar) | 4 / 2 | **No below expanded**; yes from expanded |
| A new page or post | Preview, Notifications (2 / 1) | 3 / 2 | **No below expanded**; yes from expanded |
| Pages, Blog posts, every list with deleted items, Files | Deleted pages (or posts, files), Notifications (2 / 2) | 3 / 3 | **No** |
| Start screen (Home) | Edit dashboard, Notifications, Open website (3 / 3) | 4 / 4 | **No** (it is over the rule already today) |

**Where it goes there.** The owner's decision is the top bar on every screen (D6), so the icon stands in the same place on these screens too: the first
trailing action. They then have three or four actions, which is more than M3's "two if necessary". That is recorded as deviation 3 (section 9),
on the owner's words, and it ends in **0.20**, when the redesign of all app bars brings the search app bar: there the search is the field, not
an icon, and M3 allows "up to two trailing icons on mobile" and "up to four trailing icons on larger screens". The palette PR moves nothing else
out of these bars. The other M3 answer, "actions at the trailing edge ... collapse into an overflow menu at smaller breakpoints", is not
recommended for 0.18: M3 also says "Avoid placing an overflow menu in the app bar when possible", and the 0.20 redesign rebuilds these bars anyway.

## 5. No custom context menu (owner decision)

### 5.1 The decision

Owner, 13 November: "So we keep the no right click menu." The browser's or the operating system's own menu stays **everywhere**: in text, on blocks, images,
table cells, rows, files and links. Reasons given to the owner and accepted: the system menu does Cut, Copy and Paste best (the keyboard, the phone's
selection bubble and the desktop right-click menu already work), the browser's spell-check suggestions and "Open link in new tab" stay, and the tools are
already on the bar, its `⋮` and the palette.

What is **not** built, so it is not in the build plan: a `contextmenu` handler (the editor has none today: `onContextMenu` is only in `theme/ui/longPress.ts`,
to keep the browser's menu away from a long press that selects a list row), Cut, Copy and Paste items, *Paste as plain text*, a `Shift+F10` or Menu key
handler, a long press menu, and the theme part "a menu that opens at a point". Nothing of the earlier right-click proposal is kept. (The clipboard calls were tested in
Chromium with the real Milkdown editor before the decision; nothing is built on them and the test is not kept.)

M3 prints the opposite, so this is a deviation on the owner's words (entry 2, section 9).

### 5.2 Where each target's actions are instead

The same registry entries, shown by the one bar (its contextual group, then `⋮`), the block action row (#625) and the palette. Checked against today's code
(section 2):

| Target | On the bar and in `⋮` | In the block action row (#625) | In the palette (group) |
| --- | --- | --- | --- |
| Text | Bold, Italic, Text style, Lists, Alignment, Link, Colour (what does not fit in `⋮`); Section settings in `⋮` | none | Text |
| Image (a card not typed in place) | `⋮`: Select block, Remove. The image tools Change image, Crop, Alt text, Remove (video: Change address) when their spec lands (D7) | Move up, Move down, Hide or Show, Settings (the image sheet) | Image, Block |
| Table cell | Row above and below, Column before and after, Delete row, Delete column, column alignment, the gear; `⋮`: Select block, Remove | Move up, Move down, Hide or Show, Settings | Table, Block |
| Row of a List, Cards, Points, Steps, Checklist, Accordion, Price cards, Buttons | Add below and above, Move the row up and down, Link, the gear, Rows from; `⋮`: the list page link, Select block, Remove. `Change to…` when its spec lands (D7) | Move up, Move down, Hide or Show, Settings | List, Block |
| Other block (Video, Notice, Testimonials, Posts, HTML, Banner) | `⋮`: Select block, Remove, the list page link where it reads one | Move up, Move down, Hide or Show, Settings (when it has any) | Block |
| Empty line | Insert block (fixed group) | none | Insert (one entry per block) |

### 5.3 Phone and touch

- This spec adds **no long press**. In text the long press is the phone's own (M3 Inputs: "When interacting using touch, always show touch controls").
  On a list screen it selects (#529; M3 Gestures: "Long pressing a list item selects it"). **#529 now also selects blocks** (its section 6, owner decisions): a long press on a block's part
  that is not typed text selects the block, and in typed text the phone's own selection stays. That is #529's, built in 0.17, and this spec neither uses nor changes it.
- **Nothing in this spec contradicts #529 on long press.** Because there is no custom context menu, no long press opens a menu anywhere. My earlier idea of a bottom sheet on a long press on blocks and images is
  removed (it would have clashed with #529's block selection).
- `useLongPress` (`theme/ui/longPress.ts`) stays as #529 uses it; no new use here.

### 5.4 Tooltips with shortcuts (icon-only buttons)

**#519 specified it** (in the tooltip code, no registry). In 0.18 the registry becomes the one source of the key strings (section 10, step 5).
`useTooltip` adds the shortcut after the name: "Bold  Ctrl+B" ("Bold  ⌘B" on a Mac). Only actions with a tested key
have one, and `aria-keyshortcuts` goes on the button. M3 has nothing on shortcuts in tooltips (not found), so this is an addition and not a
deviation; plain tooltips stay short ("Avoid wrapping text to multiple lines"). The format is one function (`formatShortcut`, tested), used by the
tooltip, a `⋮` menu item (M3: "Menu items can include ... keyboard commands"), the palette and the `Keyboard shortcuts` list.

## 6. Parts: what exists and what is missing

The editor draws only theme parts. Nothing here is custom.

| Need | Part | Exists? |
| --- | --- | --- |
| Bar `⋮` | `Menu`, `MenuItem`, `MenuGroup`, `MenuDivider` (`theme/ui/Menu.tsx`), editor wrapper `Menu` (`ui.tsx`) | **Yes**, with `trailingSupporting` (shortcut), `submenu`, `checked`, `disabled`, divider groups, bottom sheet on a phone |
| Menu **at a point** | `Menu` | **Not needed any more.** Only a right click or a long press menu would have used it, and both are dropped (section 5). The `⋮` stays under its button |
| Type-ahead letters in the `⋮` menu | `Menu` | **Missing in the editor's `moveInMenu`** (`ui.tsx`): the theme's `dropdownMenu.script.ts` has it; share it (M3 menus accessibility: "Letters: Focus moves to the next menu item starting with letter") |
| Palette view | `Search` view (`theme/ui/Search.tsx`) | **Partly.** Drawn (field, listbox, back, clear, empty text) but script-driven; **missing: a controlled version** (`open`, `query`, `onQueryChange`, `activeId`, `onActivate`, a live count) with **grouped results** (a label per group, M3 "Category labels") and a trailing shortcut. Add it to `Search.tsx`, with the site script untouched |
| Group label in a list | `List` | The editor has `SheetGroupTitle` (an editor composition, `ui.tsx` 2123); the theme `List` has no group header. **Missing**, or reuse `SheetGroupTitle`'s look through the theme (decided in step 3) |
| Rows | `List`, `ListItem` (`role="option"`, trailing supporting text) | Yes |
| Field | The search view's own input (`search-view-input`) | Yes. **A `TextField` is not used:** M3's search has its own input inside the view, and the theme's `Search` already draws it |
| Dialog or SideSheet | `Dialog`, `SideSheet` | **Not used.** M3: dialogs are for "critical information"; a side sheet is a persistent pane, not a search |
| Tooltip with a shortcut | `Tooltip`, `useTooltip` | Yes (text only) |
| Search icon button | `IconButton` | Yes |
| Long press | `useLongPress` | Yes; no new use here |
| Divider | `Divider` | Yes |

## 7. Texts (English first; Danish in `src/i18n/da-DK/`)

New `t.actions` (every action's label: one place, replacing the labels now spread in `t.text`, `t.common` and the block lists; they keep their
words) and `t.palette`. Short, active, per M3 word choice (`site-editor-writing`): "Open", not "Go to open". Proposed:

| Key | English | Danish |
| --- | --- | --- |
| `palette.open` (the top-bar icon's tooltip and label) | Search | Søg |
| `palette.label`, placeholder | Search actions and pages | Søg i handlinger og sider |
| `palette.back` | Close search | Luk søgning |
| `palette.clear` | Clear | Ryd |
| `palette.recent` | Recent | Seneste |
| `palette.suggested` | Suggested | Foreslået |
| `palette.empty(q)` | Nothing found for “q” | Ingen resultater for “q” |
| `palette.count(n)` | 1 result · n results | 1 resultat · n resultater |
| `palette.clearRecent` | Clear recent actions | Ryd seneste handlinger |
| `palette.noText` | Select text first | Markér tekst først |
| `palette.nothingToUndo`, `nothingToRedo` | Nothing to undo · Nothing to redo | Intet at fortryde · Intet at gentage |
| group titles | Go to · Pages and posts · Page · Text · Insert · Section · Block · Table · Image · List · Settings · Apps | Gå til · Sider og indlæg · Side · Tekst · Indsæt · Sektion · Blok · Tabel · Billede · Liste · Indstillinger · Apps |
| `shortcuts.title` | Keyboard shortcuts | Tastaturgenveje |

Action labels keep today's words (`Bold` = `Fed`, `Undo` = `Fortryd`, `Redo` = `Gentag`, `Move up` = `Flyt op`, from `da-DK`). The Danish above
is a proposal for the owner to read; the build PR writes it in `da-DK/` and `check:language` keeps it out of everything else. The word **image** is
`image` in English texts (owner rule, 12 November).

## 8. How it relates to #519, #529, #625 and the 0.18 specs

- **#519 (the one bar).** Untouched in design, and not dependent on this spec (see "What exists today"). In step 5 the bar's tool lists and `⋮` groups become the `bar` and `more` places of registry entries, so the bar,
  `⋮` and the palette stay in step. #519 section 8 said a right-click menu "reuses `Menu`; it is not part of this spec" and a
  palette "as a later, separate spec": this is that spec, and the owner has since ruled out the right-click menu (section 5).
- **#625 (the block action row).** Untouched in design. Its items (`blockBar` `row`, split by `splitRow`) become the `row` place of registry entries in step 5,
  and the palette lists them first while their block is active (section 4.1).
- **`Change to…` and the image tools** (owner, 14 November; their own spec, another session). This spec only says the registry carries them once they exist
  (section 3). Their spec decides their places on the bar, in the `⋮` or in the row; they register through the registry if it has landed by then, and through
  `blockBar` (which the adapter of step 5 reads) if not.
- **0.20 (the app bars' redesign).** The top-bar search icon of step 4 becomes the M3 search app bar there; deviation 3 ends with it.
- **#529 (selection).** A long press on a list screen selects, and now a long press on a block selects it (#529 section 6); this spec adds no long press and never takes either. A right click on a list row stays the
  browser's, as #529 section 3.3 says, and now everywhere else too. #529's `SelectionBar` swaps the top bar on list screens (and hides the search icon there, section 4.2); its block actions sit in the one bar. In step 5
  they are registry entries with a `selection` context, so the palette offers them (the `SelectionBar`'s actions as they are in the code then; a single-block *Duplicate* only once it exists). List and
  block selection are different `Ctx` states, never both at once.
- **#515 and #520** (theme parts audit, Material conformance) are named in #529; I did not read them for this spec. The one missing part
  above (a controlled search view) belongs in the same audit.
- **Density.** The palette is outside the editor workspace, so its rows are at least 48 dp (M3 Lists specs: "Target size must be at least 48x48dp."). The bar's 44 dp buttons are #519's own decision and deviation.

## 9. Deviations from Material (entries for `docs/material-deviations.md`, added with the palette PR, step 4, in 0.18)

Each: Material says / we do / why / date / PR (PR number filled in when built). The PM's rule: a deviation is allowed only in the editor
workspace (the bar, its `⋮`, the text and block menus), or when the owner says so in words. All three entries rest on the owner's words. What the pages are silent on is **not**
a deviation: it is listed in 1b and in section 11.

1. **A command palette is built from the Search view** (outside the workspace; owner's words).
   - **Owner:** "a command palette: if the editor has dozens of functions, a floating search bar (Cmd/Ctrl+K, like VS Code, Figma, Notion) where the
     user types the action" (13 November).
   - **Material:** "Use search for products with many items to manage, such as files or messages." and "Search helps people find
     information quickly." M3 has no page for running actions from a search; I found no command palette page.
   - **We do:** the Search view lists and runs the editor's actions as well as finding content; every other part is M3's (a List, an icon
     button with a tooltip, menus).
   - **Why:** the owner's request (the editor has dozens of functions); Search is the closest M3 part, and a dialog is the wrong one ("Dialogs
     are purposefully interruptive ... used sparingly"). **Date:** 2026-11-13. **PR:** step 4.
2. **No custom context menu: the browser's or the OS's menu stays** (editor workspace; owner's words).
   - **Owner:** "So we keep the no right click menu." (13 November)
   - **Material:** "A secondary click (whether using a single button or two fingers on a trackpad) should activate a context menu. The context menu shows
     additional options for the object that's clicked." (Inputs); "When using a mouse, trackpad, or stylus to select text, use the right-click context menu"
     (Inputs, text selection); "A secondary click, like a right-click on a mouse or a two-finger tap on a trackpad, opens a context menu." (Menus).
   - **We do:** a right click opens the browser's own menu everywhere in the editor. The editor draws no context menu.
   - **Why:** the system menu does Cut, Copy and Paste, spell-check and link items better than we can; the tools are on the bar, its `⋮` and the palette. The browser's
     menu is itself a context menu, so this may not be a deviation in a strict reading; it is listed because the PM asked for it. **Date:** 2026-11-13. **PR:** none yet. The editor has no context menu today, so this entry can go in now as a docs-only change (the PM decides);
     otherwise it goes in with the palette PR.
3. **More than two actions in the top bar on some screens until 0.20** (outside the workspace; owner's words).
   - **Owner:** the palette opens from "a plain search icon button in today's top bar, on every screen"; the M3 search app bar comes in 0.20 with the redesign of all
     screens' app bars (14 November).
   - **Material:** "App bars should only have one action, two if necessary." "Up to two icon buttons can be placed after the headline" (App bars guidelines).
   - **We do:** the search icon is the first trailing action on every screen. On the start screen (4 actions), Pages, Blog posts, every list with deleted items and
     Files (3), and, below expanded, a page or post being edited (4) or a new one (3), the bar then has more than two (section 4.8). Nothing else moves.
   - **Why:** the owner's decision for 0.18; the 0.20 redesign gives these bars the search app bar ("up to two trailing icons on mobile", "up to four trailing
     icons on larger screens") and ends this entry. **Date:** 2026-11-14. **PR:** step 4.

## 10. Build plan (0.18)

All steps are small pull requests **into the `0.18` branch** (skill `changesets`: `minor`, `patch` or empty there). S = a day or less, M = a day or two. A step a site
owner sees has a `minor` changeset (and, for step 4, a release note); the others `patch` or empty. Each PR reports its link and head sha to the 0.18 PM.

1. **S, `lib/actionRules.mjs` and tests.** Folding, ranking, context filter, shortcut parse and format, conflict check. No UI. **Empty** changeset.
2. **S, `src/actions.ts` registry and the navigation provider.** Register, dispose, `Ctx`, the four places (`bar`, `more`, `row`, `palette`), "Go to" actions from
   `menuTree`, Insert actions from `blocks.ts`, the pages and posts provider (by title, D5). No UI. Tests: a route in the menu is an action; an app's page
   appears; an entry with two of `bar`, `more`, `row` fails. **Empty** changeset.
3. **M, theme: a controlled Search view with grouped results** (and the shared type-ahead for the `⋮` menu, if it is still missing). In `theme/ui/` with the parts
   page (`#developer/parts`) updated, a `check:screens` entry and tokens only. **Patch** (nothing on a site changes; the site's search script is untouched).
4. **M, the palette.** `CommandPalette.tsx`, the plain search icon button in the top bar on every screen (`Screen.tsx`, D6), `Ctrl/⌘+K`, recent, navigation,
   page and settings actions, phone full screen, focus return, live region, the Danish texts. Deviation entries 1, 2 and 3. **Minor** changeset and **one
   release note paragraph** (it changes how the editor is used; `release-notes` skill, English and Danish): for example "Find anything with one key".
5. **M, text and block actions in the registry.** `MarkdownEditor.tsx`, `blockBar.ts`, `blockRow.ts` and `contextualMenu.ts` register their actions through an
   adapter: the bar, its `⋮` and the block action row read them, in today's order and places. The palette lists them, the active block's first (4.1), and the text
   actions on a phone as question 3 recommends. Shortcuts in tooltips and `aria-keyshortcuts`. **Minor** (the palette offers new actions; a release note line).
6. **S, polish.** Clear recent on sign-out, *Keyboard shortcuts* list. **Patch.** Files as a provider are **not** in 0.18 (D5: later).

Later, not in this plan: `Change to…` and the image tools register in their own PRs (their spec, D7), each listed in the palette from that PR on. The search app
bar is 0.20's.

**What the checks must prove** (`scripts/editor-screens.mjs` through `check:screens`; `node --test`):
- **Unit tests:** every rule of section 4.3, the registry (context filter, a disabled action, dispose), the shortcut format on both platforms and the
  conflict check.
- **The search icon** is in the top bar of every screen of section 4.8, at 375 and 1280, as the first trailing action, and not while a `SelectionBar` is shown.
- **The active block first:** with a block active and the query empty, the palette's first group is that block's actions (row, bar, then `⋮` order).
- **At 375 (touch emulation) and 1280:** the palette opens with the key and with the button; typing "bold" with the cursor in text puts Bold first; Enter runs it and
  the selected words are bold; Escape closes it and the focus is back in the text; `aria-activedescendant` follows the arrows; the live region reads the
  count; the empty query shows Recent and Suggested; no horizontal scroll; every row and button is at least 48 × 48 CSS px; the phone view is full
  screen and the desktop one docked.
- **No custom context menu:** a right click (`contextmenu` event) in text, on a block, an image and a table cell is **not** prevented, so the browser's menu opens.
- `check:contrast`, `check:editor-colors` and `check:css-values` on the new CSS in each section colour; nothing drawn that is not a theme part.
- **Not covered by the scripts:** `Ctrl+K` in each browser, VoiceOver and TalkBack. By hand, by the owner or the PM.

## 11. Decisions and the one open question

**Decided:** (D1) `Ctrl+K` / `⌘K` always opens the palette, also in text; *Link* keeps no key. (D2) No custom right-click menu anywhere; the browser's or the OS's stays.
(D3) Resize image, Duplicate block and any other tool that does not exist yet: specs are written separately, and the palette lists only what exists.
(D4) The command palette and the shared action registry were postponed past 0.17; they are in 0.18.
(D5, 14 November; was question 1) The palette searches **(b)**: actions, the places in the main menu, and pages and posts by title. Files later.
(D6, 14 November; was question 2) No FAB and no button per block; the palette lists the selected block's actions first. In 0.18 it opens from `Ctrl+K` / `⌘K` and a
plain search icon button in today's top bar, on every screen (section 4.8, deviation 3). In 0.20 the icon becomes the M3 search app bar, with the redesign of all app bars.
(D7, 14 November) The registry carries `Change to…` and the image tools (`Change image`, `Crop`, `Alt text`, `Remove`; video `Change address`) once they exist; their own spec.
(D8, 14 November) The block action row (#625) is a place of actions: the registry's places are `bar`, `⋮` (`more`), `row` and the palette.

**Open owner question (one):**

3. **On a phone, does the palette list the text actions?** Recommendation: **yes** (the selection is restored), so one list works everywhere. Other choice: leave them
   out on a phone, where the bar has them. Not yet asked; step 5 builds the recommendation, and the other choice is a filter in the same step.

**Defaults, no owner decision needed unless you want one:**
- (1) **Recent actions** kept in this browser only, cleared at sign-out and by *Clear recent actions*.
- (2) **No other shortcuts** beyond `Ctrl+K` (Save, New page, Go to page): the editor autosaves and has none now; the registry and its conflict test make adding one a one-line change.
- (3) **Where the docked palette stands on a computer:** the theme's Search view as it is built now (M3 prints only that a docked view "opens a list below the search bar" and is silent for
  a button or a key; the size tokens could not be read). If it looks wrong in the screens, full screen on every size instead.

**Moot after the decision:** a right click on a list row or link (the browser's menu stays), a long press in text on a phone (the phone's own stays), *Paste as plain text*, and the
Cut, Copy and Paste wiring.
