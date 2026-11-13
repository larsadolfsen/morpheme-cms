# Command palette and context menus (design)

Status: proposal for the owner. Design only, no code. Written for a phone: plain words, short.

Owner's words (editor menus, 13 November): editor interfaces are content-first, so the UI around the content takes little room.
Do not stuff every feature into one scrolling drop-down or drawer. Three layers: (1) a **quick toolbar** with only the top actions
(the one bar of PR #519, not redone here); (2) **context menus** (right click, secondary click) with the actions where the user
works: text selected, only text actions; an image selected, crop and resize actions; (3) a **command palette** (Cmd/Ctrl+K, like
VS Code, Figma, Notion): a floating search bar where the user types the action. Icon-only buttons get tooltips with the keyboard
shortcut.

Words: the **bar** is the one toolbar of #519. An **action** is one thing the editor can do (Bold, Move up, Go to Files). The
**registry** is the one list of actions (section 3). The **palette** is the search over the registry. A **context menu** is a menu
on the thing you point at. A **part** is a ready-made piece of the theme (`theme/ui/`) that a theme can restyle.

## Short answer

- **One registry, four views.** Every action is defined once (`src/actions.ts`): its name, icon, shortcut, where it applies, when
  it can run, and what it does. The bar, its `⋮`, the context menus and the palette are four views of that list. A new tool is
  added in one place and shows up in all four, with the same name and shortcut.
- **Palette:** `Ctrl+K` (`⌘K` on a Mac) and a search icon in the top bar open it. It lists what you can do here first, then
  everything else, and runs the one you pick. It uses the theme's **Search** view (full screen on a phone, docked from medium),
  not a dialog.
- **Context menus:** a right click on a block, an image, a table cell, a list row or selected text opens a `Menu` with only that
  thing's actions. On a phone a long press opens it as a bottom sheet, but never inside text (the phone's own long press owns
  text) and never on a list screen (there it starts selection, #529).
- **Nothing new is drawn.** Menu and Search are theme parts. Two parts are missing and must be added to the theme: a menu that
  opens at a point (`Menu` with `at`), and a Search view that React can drive (the one today is only drawn in the editor).
- **M3 has no command palette page.** The nearest is *Search*. That is a deviation, listed in section 9.

## 1. What Material says (read 13 November 2026 with Playwright)

Pages read (`goto` with `networkidle`, 4 s wait, `document.body.innerText`): `m3.material.io/components/menus/` overview, specs,
guidelines, accessibility; `/components/search/` overview, guidelines, specs, accessibility; `/components/dialogs/` guidelines,
accessibility; `/components/bottom-sheets/guidelines`; `/components/tooltips/guidelines`; `/foundations/interaction/inputs` and
`/gestures`. Quotes are exact.

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
- The images, videos and token tables of every page above (script-drawn, no text); the side-sheet pages (not read; the palette
  does not use one); anything on keyboard shortcut labelling in tooltips (not found).

## 2. What the editor has today

- **Actions are spread over four places, each with its own list.** The text tools are `allTools` in `MarkdownEditor.tsx` (about
  2095–2120: Bold, Italic, Link, Main heading, Heading, Subheading, Body small, medium, large, Label, Quote, Bullet, Check and
  Numbered list, Alignment, Insert or Image, Undo, Redo, Section settings, Colour). The block row is `BarAction` in
  `contextualMenu.ts` (above, below, up, down, link, column before and after, delete row and column, align left, centre, right,
  auto). The block's card menu is `cardMenu` and `moves` (Edit, Hide, Move up and down, Remove). The screens add their own
  (`OwnListPage.tsx` has its own `rowActions`). #519 puts the first three in one bar; none of it shares a definition.
- **Navigation** is data already: `menuTree` (`lib/menu.mjs`) from the site's groups, drawn by `MainMenu.tsx`, and the screens in
  `App.tsx` (about 820–890: Home, Files, Redirects, SEO rating, Appearance and its Themes, Icon packs, Motion, Colours, Logo and icon,
  Block settings, Caching and builds, Assistants, Licences, Morpheme, Apps, App store, Status, Account, Notifications, the lists,
  `new/<list>` for a new page or post, `deleted/<list>`).
- **Page actions:** Save changes (`t.common.saveChanges`), Preview (`t.common.preview`), and the draft and publish actions of
  the drafts plan (`2026-11-11-drafts-and-publish-plan.md`) when built. I found no *Publish* text in `en-US` yet, so the registry
  step reads the real set from the code.
- **Shortcuts:** none of the editor's own. Grep finds no global key handler; only Escape in the Library, Notifications, menus and
  sheets. The text engine (Milkdown) has `Mod-b`, `Mod-i`, `Mod-z` and others (#519 section 8c lists them; not tested here, and none for Link).
- **Context menus:** none. `onContextMenu` appears only in `theme/ui/longPress.ts`, to keep the browser's menu away from a long press.
- **Search:** `SearchBar` and `SearchRow` (a field that narrows a list in place, `ui.tsx` 879–911). The theme's `Search` part
  (`theme/ui/Search.tsx`) has the search *view* (a `<dialog class="search-view">` with a combobox field, a `listbox` of options, a back
  and a clear button), but "in the editor only drawn": opening, narrowing and arrow keys are `search.script.ts`, for the site.
- **Menu:** the editor's `Menu` (`ui.tsx`) opens under a button (`anchor` is an element), is placed by the theme's
  `sitePlaceMenu`, closes on outside tap, Escape and scroll, and on a phone is a bottom sheet titled with its `label`. Its
  `MenuItem` has icon, `selected`, `disabled`, and a tap keeps the cursor in the text. The theme's `MenuItem`
  (`theme/ui/Menu.tsx`) also has `trailingSupporting` (a shortcut), `submenu`, `checked` and groups with a divider.
- **Tooltips:** `useTooltip` (`ui.tsx`): the name, after 500 ms under a mouse, at once on keyboard focus, not on touch. No shortcut in
  it and no `aria-keyshortcuts` (also #519 section 8c).
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
  where: {                         // which views show it, and in what order
    bar?: { context: Context; order: number; overflow?: string }   // #519's lists and their ⋮ groups
    menu?: { target: Target; order: number; section?: string }     // context menu of that target
    palette?: boolean | { rank?: number }                          // default true
  }
  state: (ctx: Ctx) => 'enabled' | 'disabled' | 'hidden'  // + `reason` for a disabled one
  pressed?: (ctx: Ctx) => boolean  // a toggle (Bold) or the current choice (Align centre)
  run: (ctx: Ctx, arg?) => void
}
```

- **Ctx** is where the user is now: the route, whether text, a block, an image, a table cell, a list row or a list selection is
  active (and which block type), the text's selection, whether there is something to undo or redo. The same Ctx drives the bar (#519's
  states), the menus and the palette, so *Move up* is disabled in all four at once.
- **Who registers.** A screen or editor registers its actions while it is mounted and gets back a dispose function.
  `App.tsx` registers navigation from `menuTree` (so every part, app and list in the menu is a "Go to" action by itself, and an
  installed app's pages appear with no work). `MarkdownEditor.tsx` registers the text and block actions with its `view` in hand (a
  text engine command needs it; it is the top scope while the text has the focus). `blocks.ts` gives one *Insert <block>* action per
  block (`SiteBlock.label`, grouped by `BlockGroup`). Lists give *New page* and *New post*. A **provider** (a function from the
  query to actions) gives the pages and posts by title from `files`, so they are not thousands of registered actions.
- **The bar becomes a view.** #519's `BarAction` and `allTools` collapse into registry entries with a `bar` place; #519's
  section 3 table (what is on the bar and what is in `⋮` at 375 px) is the `order` and `overflow` of those entries. **This spec does not
  change the bar's design;** it changes where its list comes from. Order: the registry lands first (steps 1 and 2) and feeds today's
  `contextualMenu.ts`; the bar moves over when #519 steps 1 and 2 land (section 8).
- **Shortcuts live in one place.** Keys for the text engine stay in its keymap (`handledBy: 'text'`: the registry only
  documents them in tooltips, menus and the palette). Global keys (only `Mod+K` here) are one `keydown` listener. A unit test fails
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

- **Empty query** (M3: "Show historical suggestions before typing", "Category labels, like Recent, ... Suggestions"): *Recent*
  (the last 5 actions you ran), then *Suggested* (the actions of the current context, in the bar's order, up to 6), nothing else.
- **With a query:** results in groups with a label each: the current context's actions first (*Text*, *Block*, *Image*, *Table*,
  *List* by what is active), then *Insert*, *Page*, *Go to*, *Pages and posts*, *Settings*, *Apps*. At most 30 results, scrolling.
  A group with no hit is not shown.
- **A row** is a theme `ListItem`: leading icon, the name as headline, the group or the path under it when it helps ("Settings ›
  Caching and builds"), the shortcut as trailing text (the same `trailingSupporting` that `MenuItem` has). A toggle shows its state
  (Bold: checked).
- **Actions that cannot run now.** Only the **current context's** actions that are unavailable are shown, disabled, with the reason
  under the name ("Nothing to redo", "Select text first"): M3 "disabled rather than removed". Actions of a context you are not in
  (table actions with the cursor in a paragraph) are not listed at all: they would be noise (deviation 3, section 9).
- **Empty result:** "Nothing found for “x”". The field stays focused.

### 4.2 Opening, closing, running

- **Open:** `Ctrl+K` (`⌘K`) from anywhere in the editor, also with the cursor in text (question 1), and a **search icon button** in the top
  app bar (M3: "Search icon button: Use when search is a secondary action"). The button is how a phone, a tablet and anyone who does not
  know the key finds it; its tooltip says "Search actions  Ctrl+K". The key calls `preventDefault`, so a browser that uses it for its
  own search (Chrome and Firefox on Windows and Linux use `Ctrl+K` for the address or search bar) does not take it; I did not
  test each browser.
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
| Go to | Home, every section and row of the main menu, Settings, Notifications, Account, Files, Redirects, SEO rating, Status, Apps, App store, Themes, Icon packs, Motion, Colours, Logo and icon, Block settings, Caching and builds, Assistants, Licences, Morpheme, Deleted pages and files | `menuTree`, `App.tsx` routes |
| Pages and posts | Open "<title>", New page, New post | `files`, `new/<list>` |
| Page | Save changes, Preview (draft and publish actions when the drafts plan lands) | `t.common.saveChanges`, `t.common.preview` |
| Text | Bold, Italic, Link, Main heading, Heading, Subheading, Body small, medium, large, Label, Quote, Bullet list, Check list, Numbered list, Align left, centre, right, Text colour, Undo, Redo | `allTools` |
| Insert | Insert image, one *Insert <block>* per block (Table, Cards, List, Steps, Buttons, Price cards, Video, Notice, Testimonials, Posts, HTML, …) | `blocks.ts`, `BlockGroup` |
| Section | Section settings, Section colour, Background image, Width | `t.text.section*` |
| Block | Add above, Add below, Move up, Move down, Link, Settings, Fill from a list, Hide, Show, Remove, Edit | `BarAction`, `cardMenu`, `moves` |
| Table | Row above, Row below, Column before, Column after, Delete row, Delete column, Align column left, centre, right, auto | `BarAction`, `gridActions` |
| Image | Change image, Crop, Alt text | #519 section 3 |
| List screens | Delete N selected, Restore N selected, Select all, Close selection (only while a selection exists) | #529 |

*Resize* for an image is **not** in the code: the editor has Crop (the zoom slider in `Crop.tsx`), no resize action. The owner's
example "crop/resize" therefore lists Crop only, and a resize is a new feature (question 8). The same goes for *Duplicate* (none in
the code, #529 says so too).

### 4.5 Phone

- **Full screen** on compact (M3: "Full-screen layout: Default for compact breakpoints"): the back arrow, the field, the clear button, then the
  results, each row 48 dp or more. The keyboard opens with the sheet; the results scroll above it.
- It is opened by the **top-bar search button** (no key on a phone). A text action from the palette on a phone works the same way (the
  selection is restored), though most phone users will use the bar; the palette still lists them (question 6).
- Closing: the back gesture closes the palette before it leaves the screen (`useSheetBack`).
- **From medium and wider:** docked at the top centre of the window under the top app bar, about 40 rem wide, with the scrim behind
  (M3 does not say where a docked view stands without a search bar, see "could not read").

### 4.6 Recent actions

- The last 8 ids (5 shown), and a small use count per id for the boost, in `localStorage` under `editor-recent-actions`, read and
  written in `try/catch` like `sidebar.ts`. It stays in the browser: never sent anywhere, not committed.
- An action with an argument stores its target (`go.page:/about`) and is dropped when the target no longer exists.
- It is cleared on sign-out (a shared computer) and by the action *Clear recent actions*.

### 4.7 Accessibility

- **Container:** the theme's search view, a modal `<dialog>` (inert page behind, scrim, focus trapped; `lib/focusTrap.mjs` exists),
  `aria-label` "Search actions". Escape closes. Not the *alert dialog* role of M3's dialog page: it is not a decision.
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

## 5. Context menus

### 5.1 What each target shows

One rule from the owner: **the menu shows only the actions of the thing you point at.** The registry's `menu.target` says which.

| Target (right click on …) | Menu items (groups in order, a divider between them) |
| --- | --- |
| **Selected text** (a selection, not just the caret) | Cut, Copy, Paste; Bold, Italic, Link; Text style ›, List ›, Alignment ›, Text colour ›; Undo, Redo. (Only text actions: no block or page action.) |
| **Image** (the image card or an image block) | Change image, Crop, Alt text; Settings; Add above, Add below, Move up, Move down; Hide, Remove |
| **Table cell** | Row above, Row below, Delete row; Column before, Column after, Delete column; Align column ›; Settings |
| **List-type block row** (List, Cards, Points, Steps, Checklist, Accordion, Price cards, Buttons) | Add above, Add below, Move up, Move down; Link, Settings, Fill from a list (where the block has them); Hide, Remove |
| **Any other block card** (Video, Notice, Testimonials, Posts, HTML, Banner) | Edit or Settings; Add above, Add below, Move up, Move down; Hide, Remove |
| **Empty line** | Insert › (the block groups: Cards, Lists, Banners, Buttons, Media, Content, from `blockGroups`, each a submenu of its blocks), Insert image, Paste |

- `›` is a submenu: on a computer next to the item (M3: "Submenus should open next to the parent menu item without overlapping
  it", "best used on large screens"); on a phone the same items are a **group with a title** in the bottom sheet (no submenu).
- **Toggles and choices** show their state (`checked`: Bold, the current alignment). An item that cannot run now is **disabled, not removed**
  (Move up on the first block, Redo with nothing to redo).
- **What does not open our menu (this version):** a right click on a **link** (a list row, a menu row, a link in the text) or on a
  **text field** keeps the browser's menu, which has "Open in new tab", "Copy link", spelling and paste that we cannot replace. This is
  also what #529 says of a list row ("Right click is the browser's menu on a row; we do not take it"), and the list screens
  keep their actions in the selection bar. A collapsed caret in text also keeps the browser's menu (spelling suggestions). Question 3.
- **Dashboard widgets and other screens** may get one later by registering `menu` places; no screen needs a new mechanism.

### 5.2 Keyboard and opening

- **Mouse and trackpad:** `contextmenu` event (right click, two-finger tap). The menu opens **at the pointer** and flips to stay in the
  window (M3: "reposition to appear to the left, right, or above"). It opens at once on a computer (M3: "menus can open instantly").
- **Keyboard:** `Shift+F10` and the Menu key open the menu for the focused target, at the target's box. Without it a keyboard user
  would have no way in; the same actions are on the bar and in the palette, so nothing is only in the context menu.
- **Focus:** the first item (M3 accessibility). Arrows, `Home`, `End`, letters (type-ahead: "Letters: Focus moves to the next menu item
  starting with letter"), Enter or Space run, `→` opens a submenu, `←` or Esc closes it, Esc closes the menu and the **focus and selection
  return to the target** (no scroll). A tap or click on an item never moves the text cursor (`MenuItem` already cancels the mouse down).
- **Names:** `role="menu"` with `aria-label` the target's name (the block's name, "Table", "Image", "Text"); items `role="menuitem"`,
  `menuitemcheckbox` for a toggle, `aria-disabled`, the shortcut as trailing text and `aria-keyshortcuts`; icons decorative.

### 5.3 Phone and touch

- **Long press opens the menu only where nothing else owns the long press:** on a block card and an image (the cards that are not typed in
  place) and on the empty line. The press is `useLongPress` (`theme/ui/longPress.ts`: 500 ms, 10 px, touch and pen only, a short
  vibration, the click after it swallowed), not the browser's `contextmenu` event, because I do not know that every phone fires one
  (not tested; Android Chrome does on a long press, iOS Safari I could not confirm).
- **Never inside text.** A long press there starts the phone's own text selection with its handles and magnifier (M3 Inputs: "When
  interacting using touch, always show touch controls"). The text tools are on the bar. So **text selected on a phone gets no context menu**.
- **Never on a list screen.** There a long press selects (M3 Gestures; #529).
- **A bottom sheet, not a popover** (M3: "Consider adapting menus into bottom sheets on small screens"). The editor's `Menu` already does this
  under `medium`. The sheet is titled with the target's name and capped at half the screen at first (M3: "can't exceed 50% of the screen
  height"), scrolls when long, and closes on a tap on an item, the scrim, a swipe down or the back gesture. Rows are 48 dp.
- The sheet is the same one as the bar's `⋮` on a phone (#519 question 2), and the phone palette is the same family: all open from the bottom or
  fill the screen, none shows two layers.

### 5.4 Tooltips with shortcuts (icon-only buttons)

`useTooltip` adds the shortcut after the name from the registry: "Bold  Ctrl+B" ("Bold  ⌘B" on a Mac). Only actions with a tested key
have one, and `aria-keyshortcuts` goes on the button. M3 has nothing on shortcuts in tooltips (not found), so this is an addition and not a
deviation; plain tooltips stay short ("Avoid wrapping text to multiple lines"). The format is one function (`formatShortcut`, tested), used by the
tooltip, the menu, the palette and the `Keyboard shortcuts` list.

## 6. Parts: what exists and what is missing

The editor draws only theme parts. Nothing here is custom.

| Need | Part | Exists? |
| --- | --- | --- |
| Context menu, bar `⋮` | `Menu`, `MenuItem`, `MenuGroup`, `MenuDivider` (`theme/ui/Menu.tsx`), editor wrapper `Menu` (`ui.tsx`) | **Yes**, with `trailingSupporting` (shortcut), `submenu`, `checked`, `disabled`, divider groups, bottom sheet on a phone |
| Menu **at a point** (the pointer, or a target's box) | `Menu` | **Missing.** The editor's `Menu` and the theme's `sitePlaceMenu` take an `anchor` element. Add `at={{x, y}}` (or a rect) to the placement and keep the flip logic. A zero-size fake element would work but is a hack a theme author cannot restyle or read |
| Type-ahead letters in a menu | `Menu` | **Missing in the editor's `moveInMenu`** (`ui.tsx`): the theme's `dropdownMenu.script.ts` has it; share it |
| Palette view | `Search` view (`theme/ui/Search.tsx`) | **Partly.** Drawn (field, listbox, back, clear, empty text) but script-driven; **missing: a controlled version** (`open`, `query`, `onQueryChange`, `activeId`, `onActivate`, a live count) with **grouped results** (a label per group, M3 "Category labels") and a trailing shortcut. Add it to `Search.tsx`, with the site script untouched |
| Group label in a list | `List` | The editor has `SheetGroupTitle` (an editor composition, `ui.tsx` 2123); the theme `List` has no group header. **Missing**, or reuse `SheetGroupTitle`'s look through the theme (decided in step 3) |
| Rows | `List`, `ListItem` (`role="option"`, trailing supporting text) | Yes |
| Field | The search view's own input (`search-view-input`) | Yes. **A `TextField` is not used:** M3's search has its own input inside the view, and the theme's `Search` already draws it |
| Dialog or SideSheet | `Dialog`, `SideSheet` | **Not used.** M3: dialogs are for "critical information"; a side sheet is a persistent pane, not a search |
| Tooltip with a shortcut | `Tooltip`, `useTooltip` | Yes (text only) |
| Search icon button | `IconButton` | Yes |
| Long press | `useLongPress` | Yes; one new use (blocks and images) |
| Divider | `Divider` | Yes |

## 7. Texts (English first; Danish in `src/i18n/da-DK/`)

New `t.actions` (every action's label: one place, replacing the labels now spread in `t.text`, `t.common` and the block lists; they keep their
words) and `t.palette`. Short, active, per M3 word choice (`site-editor-writing`): "Open", not "Go to open". Proposed:

| Key | English | Danish |
| --- | --- | --- |
| `palette.open` (tooltip) | Search actions | Søg i handlinger |
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

## 8. How it relates to #519 and #529

- **#519 (the one bar).** Untouched in design. The bar's tool lists and `⋮` groups become the `bar` place of registry entries, so the bar,
  `⋮`, the menus and the palette stay in step. #519 section 8d said a right-click menu "reuses `Menu`; it is not part of this spec" and a
  palette "as a later, separate spec": this is that spec. The `⋮` bottom sheet on a phone and the context menu's sheet are one component.
  #519's questions (what stays on a phone bar, sheet or popover, scrolling `⋮`) are not decided here and do not block the registry.
- **#529 (selection).** A long press on a list screen selects; this spec never takes it. A right click on a list row stays the browser's, as
  #529 section 3.3 says. While a list selection exists its actions (*Delete N selected*, *Restore*, *Select all*, *Close selection*) are
  registry entries with a `selection` context, so the palette offers them, and the selection bar (#529's docked row) is another view of
  the same entries. Text and block selection (#519) and list selection (#529) are different `Ctx` states, never both at once.
- **#515 and #520** (theme parts audit, Material conformance) are named in #529; I did not read them for this spec. The two missing parts
  above (menu at a point, controlled search view) belong in the same audit.
- **Density (#518).** Menu rows and palette rows use #518's step tokens, so they follow the owner's density setting; the 48 dp hit area stays
  (M3 density page, quoted in #519 section 8a).

## 9. Deviations from Material (entries for `docs/material-deviations.md`, added in the PR that builds each one)

Each: Material says / we do / why / date / PR (PR number filled in when built).

1. **A command palette is built from the Search view.**
   - **Material:** "Use search for products with many items to manage, such as files or messages." and "Search helps people find
     information quickly." M3 has no page for running actions from a search; I found no command palette page.
   - **We do:** the Search view lists and runs the editor's actions as well as finding content.
   - **Why:** the owner's request (the editor has dozens of functions); Search is the closest M3 part, and a dialog is the wrong one ("Dialogs
     are purposefully interruptive ... used sparingly"). **Date:** 2026-11-13. **PR:** step 4.
2. **The docked search view has no search bar behind it.**
   - **Material:** "Docked: opens a list below the search bar, with a scrim covering main content."
   - **We do:** a key (`Ctrl+K`) or the top bar's search icon button opens the view, docked at the top centre from medium, full screen on compact.
   - **Why:** a bar for actions would take room the content needs (the owner: content first). M3 says nothing for a view opened by a key.
     **Date:** 2026-11-13. **PR:** step 4.
3. **A context menu shows only the target's actions, not every action disabled.**
   - **Material:** "When a menu item can only be used under specific conditions, it should appear disabled rather than be removed."
   - **We do:** within the target's own actions that rule holds (Redo is disabled, not removed). Actions that belong to another target (table
     actions on a paragraph, block actions on selected text) are not in the menu or the palette's current-context list at all.
   - **Why:** the owner's rule that selected text shows only text actions; a menu of every action disabled would be the long list the owner
     does not want. **Date:** 2026-11-13. **PR:** steps 4 and 6.
4. **Our menu replaces the browser's on selected text only, and never on a link or field.**
   - **Material:** "A secondary click ... opens a context menu." and, for text, "When using a mouse, trackpad, or stylus, show the I-beam and context menu".
   - **We do:** only on selected text, blocks, images, table cells and the empty line. A link, a text field and a collapsed caret keep the
     browser's menu. **Why:** the browser's menu has "Open in new tab", spelling and paste we cannot replace. **Date:** 2026-11-13. **PR:** step 6 (depends on question 3).

Not deviations: a bottom sheet on a phone (M3: "Consider adapting menus into bottom sheets"), the long press (M3: "right-click or press-and-hold"; text left to
the OS, "always show touch controls"), a divider and no gaps on web, shortcuts as trailing text ("keyboard commands"), a search icon button
("Search icon button: ... secondary action"), `aria-disabled` focusable items.

## 10. Build plan (small PRs into `main`, each with a changeset)

S = a day or less, M = a day or two. All are patch or empty changesets until step 4 is visible.

1. **S, `lib/actionRules.mjs` and tests.** Folding, ranking, context filter, shortcut parse and format, conflict check. No UI. Empty changeset.
2. **S, `src/actions.ts` registry and the navigation provider.** Register, dispose, `Ctx`, "Go to" actions from `menuTree`, Insert actions from `blocks.ts`, pages and
   posts provider. No UI. Tests: a route in the menu is an action; an app's page appears.
3. **M, theme: a controlled Search view, grouped results, menu at a point (`at`).** In `theme/ui/` with the parts page (`#developer/parts`) updated, a
   `check:screens` entry, tokens only, and the shared type-ahead. Minor or patch (the owner decides).
4. **M, the palette.** `CommandPalette.tsx`, the top-bar search button, `Ctrl/⌘+K`, recent, navigation, page and settings actions, phone full screen, focus
   return, live region, the Danish texts. Deviation entries 1 and 2. **One release note paragraph** (it changes how the editor is used; `release-notes`
   skill, English and Danish): for example "Find anything with one key".
5. **M, text and block actions in the registry.** `MarkdownEditor.tsx` and `contextualMenu.ts` register their actions (the bar reads them; with #519 steps 1
   and 2 not yet landed this is an adapter, and the bar's order is today's). The palette lists them. Shortcuts in tooltips and `aria-keyshortcuts`.
6. **M, context menus.** Blocks, images, tables, list rows and the empty line: right click, `Shift+F10`, long press on blocks and images (phone
   bottom sheet). Deviation entries 3 and 4.
7. **S, selected text.** Our menu with Cut, Copy and Paste (the clipboard calls), only after question 3 is answered.
8. **S, polish.** Clear recent on sign-out, *Keyboard shortcuts* list, files as a provider (if the owner wants, question 2).

**What the checks must prove** (`scripts/editor-screens.mjs` through `check:screens`; `node --test`):
- **Unit tests:** every rule of section 4.3, the registry (context filter, a disabled action, dispose), the shortcut format on both platforms and the
  conflict check.
- **At 375 (touch emulation) and 1280:** the palette opens with the key and with the button; typing "bold" with the cursor in text puts Bold first; Enter runs it and
  the selected words are bold; Escape closes it and the focus is back in the text; `aria-activedescendant` follows the arrows; the live region reads the
  count; the empty query shows Recent and Suggested; no horizontal scroll; every row and button is at least 48 × 48 CSS px; the phone view is full
  screen and the desktop one docked.
- **Context menu:** a right click on an image block opens a menu whose items equal the registry's `image` entries; on selected text only text items; a
  right click on a link or a list row leaves the browser's menu (the event is not prevented); `Shift+F10` opens it; Escape returns the focus; at 375 a
  600 ms touch on an image opens the bottom sheet, a 600 ms touch in text does not, on a list screen it selects.
- `check:contrast`, `check:editor-colors` and `check:css-values` on the new CSS in each section colour; nothing drawn that is not a theme part.
- **Not covered by the scripts:** the real phone's long press and haptics, whether iOS fires `contextmenu`, `Ctrl+K` in each browser, VoiceOver and
  TalkBack. By hand, by the owner or the PM.

## 11. Open questions for the owner (the PM asks them one at a time)

1. **`Ctrl+K` / `⌘K` opens the palette, also when the cursor is in text?** Google Docs, Slack and Notion use it for *Link* there. Recommendation:
   **yes, the palette** (your words); *Link* keeps no key for now and stays on the bar and in the palette.
2. **What does the first palette search?** (a) actions only; (b) actions, navigation and page and post titles; (c) also files. Recommendation: **(b)**; files
   later (a provider, step 8).
3. **A right click in selected text: our menu or the browser's?** Ours loses the browser's spelling suggestions and its own Cut, Copy and Paste
   unless we add them (we would, with the clipboard calls; paste may ask permission and I have not tested each browser). Options: (a) ours on selected
   text only, the browser's on a collapsed caret; (b) always the browser's, text actions only on the bar and the palette; (c) (a), and Shift plus
   right click gives the browser's (I could not confirm every browser does that). Recommendation: **(a)**, built last (step 7) so the rest ships first.
4. **A right click on a list row or a link stays the browser's** (as #529 says), and the row's actions stay in the selection bar. Recommendation: **yes** for
   now; a row menu with Open, Select, Delete can come later.
5. **A search icon button in the top bar on every screen size?** Recommendation: **yes**: a phone has no key, and it shows the feature exists.
6. **On a phone, does the palette list the text actions?** Recommendation: **yes** (the selection is restored), so one list works everywhere.
7. **Recent actions** kept in the browser only, cleared on sign-out and by *Clear recent actions*? Recommendation: **yes**.
8. **Actions that do not exist yet:** Resize an image and Duplicate a block are in your examples and in neither the code nor #519 or #529. Recommendation: **not in
   this work**; Crop is listed. If you want them, each is its own small spec (resize needs a rule for how images are sized on the site).
9. **Other shortcuts** (Save `Ctrl+S`, New page, Go to page)? The editor autosaves and has none now. Recommendation: **none beyond `Ctrl+K`** until you ask;
   the registry and its conflict test make adding one a one-line change.
