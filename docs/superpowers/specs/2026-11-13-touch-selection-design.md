# Selecting things in the editor, on touch and with a mouse (design)

Status: ready for the owner's read. Design only, no code. Every question in section 7 is decided (by the owner or by what M3 prints); the one open choice that remains is #519's "Undo only", which belongs to that spec. Written for a phone: plain words, short.

Owner's ask: "How should we implement touch in the backend?" That is: how the editor (`/editor/`) lets people select items on
touch screens and with a mouse, following Material 3 Selection. Builds on the contextual toolbar spec (PR #519, "the one bar") and
the two audits (PR #515 "theme parts", PR #520 "Material conformance"). The text and block tools live in #519's one bar; the
selection bar on list screens is a different thing and **swaps the top bar** (owner decision, section 3.5).

Words: **selection mode** is the state where a tap on an item adds it to the selection instead of opening it. The **row** is the
editor's one toolbar (#519: main tools, a divider, a group of contextual tools that follows the selection, and a `⋮`; 44 dp buttons, 20 dp icons). The **selection bar** is the top app bar's title and
buttons swapped for the count, Close and the actions while a list is in selection mode. A **part** is a ready-made piece of the theme (`theme/ui/`).

## Short answer: where touch selection goes and what it does

Touch means: a long press (or a tap on the row's image or icon) starts selection; a tap adds more; the top bar swaps its title and buttons for the
count, Close and the actions; unselecting the last one, or Close, ends it. A selected list row shows a checked checkbox and the theme's selected surface (section 3.4, from what M3 prints). On a computer the checkbox shows on hover (on all rows once one is
selected); Escape ends it.

| Place | Touch | Computer | Recommendation |
| --- | --- | --- | --- |
| Pages and posts lists | Long press or tap the ring; tap adds; Delete | Hover checkbox; *Select* button | **Keep and improve** (exists today) |
| Notifications | Same; Delete | Hover checkbox | **Keep and improve** (exists today) |
| Files (images and other files) | Long press or tap the thumbnail; Delete (files in use are kept, named, and stay selected) | Hover mark (round, top-left of the tile, as in M3's photo-grid example) | **Build** (needs the image tile; the tile's mark, section 3.4) |
| Deleted files and pages | Same; Restore | Checkboxes always shown (primary, decided) | **Build** |
| Redirects, own-list entries | Same; Delete | Hover checkbox | **Build, later** |
| Apps, categories, tags, keywords | Nothing: each item is its own control | Nothing | **No selection** |
| Blocks of a page (page editor) | Long press anywhere but typed text, the drag handle, or *Select*; then tap adds; Move, Hide, Remove together (Duplicate with one) | Hover mark at the block's top-left; all blocks after one is selected | **Build, after the lists** (section 6; the page editor is the editor workspace) |
| Table cells and rows, List-block rows | One active cell or row, the bar's actions | Same | **No batch select** |
| Text | The OS handles and magnifier; the bar's text tools | Mouse select, double and triple click | **Not this model** |

## 1. What Material says (read 13 November 2026 with Playwright)

Pages read with Chromium (`goto` with `networkidle`, 4 s wait, `document.body.innerText`). Quotes are exact.

**Selection** — `https://m3.material.io/foundations/interaction/selection`
- "Selections are displayed using a check mark icon, a checkbox component, a change in surface color, or a combination."
- "On touch devices, select items using: Long press touch or two-finger touch; Selection shortcut, if available, such as tapping an avatar".
- "To select an item and enter selection mode, long press the item or use a shortcut, such as tapping the item’s avatar. To select additional items, tap each of them."
- "To exit a selection mode, tap each selected item until they’re unselected, or tap an action on the toolbar."
- "To select multiple items simultaneously, long press and drag across items. Don’t use this gesture combination if it is already in use to pick up and move items, like cards."
- "On desktop, checkboxes are always visible when selection is the primary activity. When selection is secondary, checkboxes (or other indicators) are displayed: As a single checkbox for that item on hover; For all items after one item is selected".
- "Selection can be performed via tap, cursor, keyboard, or voice."

**Gestures** — `https://m3.material.io/foundations/interaction/gestures`
- Long press: "People can access additional functionality by pressing on elements for an extended time." (example: "Long pressing a list item selects it").
- Pick up and move: "A long press and drag allows people to reorder content."
- Swipe: "Swiping a list item can reveal additional actions".

**Inputs** — `https://m3.material.io/foundations/interaction/inputs`
- "Primary click: Treat mouse clicks differently than touch events"; "Secondary click: Activate context menus"; "Hover: Change component states".
- Text: "Single click places the cursor; Double click selects a word; Triple click selects a paragraph". "When interacting using touch, always show touch controls, even if other inputs are connected. When using a mouse, trackpad, or stylus, show the I-beam and context menu, even if it's a touch device."
- "People typically expect the Escape key on a physical keyboard to dismiss elements, remove focus, or clear selections."
- "Tab focus ... must follow a logical order."

**Lists** — `https://m3.material.io/components/lists/guidelines`, `/specs`, `/accessibility`
- "The selected state applies to the entire list item. For example, when an item with a checkbox is selected, both the list item and the checkbox show a selected state." (guidelines, List selection modes)
- "Multi-select list items: Pair well with checkboxes and switches; Can’t have secondary nested actions; Shouldn’t use radio buttons". "Single-action list items ... Can’t be toggled into a persistent selected state." (guidelines)
- "A list can have only one selection mode at a time. For example, a single-action list can change to a multi-select list, but can’t be both at once." (specs)
- "When a list item is selected, the corner shape changes ... Unselected corner radius: 4dp inner, 16dp outer; Selected corner radius: 16dp" (specs, Shape morphing).
- "Target size must be at least 48x48dp." (specs)
- "To make selected items clear for everyone, don't rely on color as the only visual cue. ... Use two visual cues to show a list item is selected, like a leading checkmark and filled color" (accessibility).
- Keyboard: "The first element in a list should always receive focus, unless the list has a selected element"; arrow keys move; "All list items must be able to be activated using the Space or Enter key." (accessibility, Focus).
- "List items that can be swiped should include alternative ways to access hidden actions" (accessibility, Swipe).

**Checkbox** — `/components/checkbox/guidelines`, `/accessibility`
- "A parent checkbox allows for easy selection or deselection of all items." Parent: "If some, but not all, child checkboxes are checked, the parent checkbox becomes an indeterminate checkbox."
- "Users should be able to select either the text label or the checkbox to select an option."
- "Don't apply density to checkboxes by default — this lowers their targets below our best practice of 48x48 CSS pixels."

**Cards** — `/components/cards/guidelines`: "Cards can also include chips, sliders, checkboxes, and other selection controls." "By default, cards in a collection are coplanar. They share the same resting elevation unless they're picked up or dragged."

**Chips** — `/components/chips/guidelines`: filter chips: "Tap a chip to select it. Multiple chips can be selected or unselected." (filtering, not batch actions; not part of this spec).

**Icon buttons** — `/components/icon-buttons/guidelines`: "Toggle icon buttons allow a single choice to be selected or deselected ... selection is communicated through at least two properties, rather than just color."

**Toolbars** — `/components/toolbars/guidelines`: "All elements need a minimum 48x48dp target area to be accessible."

**Targets** — `https://m3.material.io/foundations/designing/structure`: "consider making touch targets at least 48 x 48dp"; "Consider making pointer targets minimums 44 x 44dp."

**What I could not read:**
- **Data tables.** `m3.material.io/components/data-tables/overview` and `/guidelines` return "This page cannot be found". M3 has no data table page; the table's selection is only what the Selection page shows ("Checkboxes are visible by default in this table because selection is a primary activity", a caption under an image). Material 2's data table was not read for this spec (the table spec of 13 November, `2026-11-13-table-md2-design.md`, did).
- **A contextual action bar.** The app bars and toolbars pages have no text about a bar that appears for a selection. The only wording is "tap an action on the toolbar" (Selection) and, for app bars, "The information and actions in the app bar should be contextual and specific to a page" (`/components/app-bars/guidelines`). So the swap of the top bar (count, close, actions) is the Android and Material 2 pattern, not something the M3 pages read say; it is our choice, decided by the owner ("I think swapping is the MD3 recommendation"), and section 4 marks it.
- The Selection page's animations and images (they are video and drawings). "Two-finger touch" is named by Material but has no description beyond that line.

## 2. What the editor has today

**Selection exists in two places, both built on one thing:** the theme's `ListItem` with `selectable` (`theme/ui/List.tsx`, `selectable`, `selecting`, `selected`, `onSelectedChange`) and the long press in `theme/ui/longPress.ts` (500 ms hold, at most 10 px of movement, touch or pen only, a mouse never; a short vibration; the click after the press is swallowed; while `selecting` a tap toggles instead of following the link; rules in `longPressRules.mjs`, tested). A selected row shows a tick (`CheckCircle`, in `ui.tsx` `ListItem`) in place of its leading icon and the theme's selected surface (`--list-item-selected-surface`, `-text`, `-radius`, `global.css` 215–226). For screen readers a row in selection mode is `role="checkbox"` with `aria-checked`, or `aria-pressed` on a button (`List.tsx` 282–300); `aria-selected` is not used, since it is for options and rows of a listbox or grid.

**Rows, one by one** (the question: what selection exists, what follows, does long press or drag move things there?)

| Where | Selection today | What follows | Long press or drag already used for moving? |
| --- | --- | --- | --- |
| Pages and posts lists (`Library.tsx` 1142–1160, 1390–1432, 1476–1520) | **Yes.** Long press on a row (phone), the top bar's *Select* button (`ListChecks`, computer), then tap to add. Escape exits. The top bar's title becomes "N selected", with *Close selection* and *Delete N selected*. Only lists with `deletable` Markdown (`canSelect`); not the tree view. | Delete several (one commit; restorable under Deleted). | No. Rows are links; the move of a page is by arrows. No drag. |
| Notifications (`Notifications.tsx`, `NotificationActions.tsx`) | **Yes.** Same long press and tap; the side sheet's actions change to *Delete N selected* and *Cancel*. | Delete several, clear all. | No. |
| Files / the image Library (`Media.tsx` 174–195: a grid of `<button class="aspect-square ...">`; `FileTile`; the file sheet 680–730) | **No.** A tap opens one file's sheet (rename, delete one, "in use" rule: a file in use cannot be deleted, 551). In the picker (`useMediaPicker`) a tap chooses one image. | Delete, rename, open — one at a time. | No. No `draggable` on the tiles (only `draggable={false}` on images in `Crop.tsx`, `sectionFrame.ts`). |
| Deleted files / Deleted pages (`Deleted.tsx`) | No. One row opens a sheet with *Restore*. | Restore one. | No. |
| Redirects (`Redirects.tsx` 333–360) | No. A row opens an edit sheet. | Edit, delete one (`deleteAsk`). | No. |
| Own lists (`OwnListPage.tsx`, list rows; `OwnListSheet.tsx`) and the entries of data lists | No. A row opens its form. | Edit, delete one, in the list's menu (`Edit list`, `Delete list`). Move: arrows (`MoveButtons.tsx`, `moveItem.mjs`; used by `LinkList.tsx`, `fields.tsx` 831–859). | No drag; arrows only. |
| Categories, tags, keywords (`MediaTags.tsx`, `Keywords.tsx`) | No. Chips with remove buttons (chip remove is its own 48 dp target in M3). | Add, remove one. | No. |
| Apps list (`AppList.tsx` 297, 360, 1013) | No. Each row is a link; the switch is its own control on the row. | Open, turn on/off, delete one from the site. | No. |
| Blocks of a page (`contextualMenu.ts`, `sectionFrame.ts`, `BlockParts.tsx`) | **One active block, not a selection.** A tap or focus makes a block (or a row in it) the active one; the bar shows its actions: Add above/below, Move up/down, Link, Settings, `⋮` (Hide, Move, Remove) (#519 section 6). `touchstart` on the bar's buttons is cancelled so the keyboard stays. | One block at a time. No *Duplicate* in the action lists of #519 section 6; I found none in the code I read. | Moving is by arrows (*Move up/down*); a drag handle is added in section 6. |
| Text selection (the ProseMirror editor, `MarkdownEditor.tsx`) | The browser's own (touch: the OS handles and magnifier; mouse: drag, double and triple click). `selecting` at 1711 is an editor plugin for the text caret, not a batch selection. | The row's text tools (#519). | The **OS owns long press here** (it starts the text selection). We never add our own long press inside text. |
| Table cells, rows, columns (`InlineTable.tsx` 67: `onFocus` sets `active: {row, col}`) | One active cell; row and column actions work on its row or column (#519: Row above/below, Column before/after, Delete row/column). | One row or column at a time. | No drag. |
| List rows of List blocks typed in place (`InlineList.tsx`, `InlineLiveList.tsx`, `InlineFieldsList.tsx`) | One active row, the same as a table (#519). | Add above/below, Move, Link, Settings, `⋮`. | No drag; Move up/down. |

**What this means for the batch gesture.** Corrected after reading the code again: **one screen already drags items, with a handle:** the start screen's dashboard in edit mode (`DashboardEdit.tsx`: each card has a `DotsSixVertical` drag handle in an `IconButton` with `touch-none`, pointer capture, an immediate press-and-drag with no long press, the card raised with the theme's elevation and following the pointer, dropped onto another card; keyboard and screen reader users use the card's menu: Move up, Move down). Those cards are not selectable, so nothing clashes there. Everywhere else reordering is an arrow button. So "long press and drag across items" does not clash with any selection list now. Places that must never get the batch drag: text (the OS long press) and any screen that picks items up with a drag handle (the dashboard today, the blocks of a page in section 6).

**What is already right:** the long press, the tap-to-toggle, the swallowed click, the tick plus surface colour (two cues), the keyboard Escape (Library and Notifications), `role=checkbox` on rows. **What is missing:** a visible checkbox (the M3 desktop rule: none appears on hover), the tap-the-icon shortcut, the Space key and range select, a "select all", focus rules, the shape change, hiding a row's own buttons while selecting (a page row's *Unfold* button, `UnfoldButton`, stays active today although M3 says multi-select items "can’t have secondary nested actions"), selection on Files, and one place for the toolbar.

### Do cards have a selected state?

**The Selection page says cards inherit selection; the card pages print no card-specific selected token or colour.** Read on 13 November 2026 with Playwright (the Selection and Lists pages read again live the same day):

- **Selection page** (`https://m3.material.io/foundations/interaction/selection`): "Selections are inherited by the following components: Cards, Checkboxes, Chips, Data tables, Icon buttons, List items, Menu items, Pickers, Radio buttons, Segmented buttons, Sliders, Switch", and "Selections are displayed using a check mark icon, a checkbox component, a change in surface color, or a combination." The owner's reading: this page tells it all.
- **Cards token tables** (`/components/cards/specs`): I opened the token-set menu and read "Card - Elevated", "Card - Filled" and "Card - Outlined" and searched each with the page's own search box. The state groups in every set are **Enabled, Disabled, Hovered, Focused, Pressed (ripple), Dragged**; a search for "select" (and "checked", "activated", "toggle") finds no token. As a control, "container" does find tokens (for example "Outlined card container color: #FEF7FF"). The Lists token tables, by contrast, have "Selected" groups with "List list item selected container color: #E8DEF8".
- **Cards pages** (`/specs`, `/guidelines`, `/accessibility`): the states listed are "Hovered, Focused, Pressed, Dragged, Disabled"; "A focus indicator appears around actionable elements when tabbing through cards"; "Cards can also include chips, sliders, checkboxes, and other selection controls."

**What the Selection page's photo-grid example prints (live page, 13 November 2026).** The example is the video under "Larger selections", "Do: Long press and drag can be used together to select items in batches". **Printed as text:** its caption, "Long press and drag can be used together to select items in batches", and the video's accessible label, "Long press and drag used to select multiple images in a photo feed." The text says nothing about where the mark sits, what it is, or what the count control looks like. **Read from the video's frames only** (I downloaded the example's video and read its frames; this is what I see, not what the page says):

- Each image tile gets a small **round mark at its top-left corner**, sitting on the corner: an **empty white circle** when the tile is not selected, a **filled circle with a white check** (in the accent colour, with a thin light ring) when it is selected. Once one tile is selected, **every** tile shows its empty circle; before that none do.
- A **count control "× 1", "× 2" … "× 5"** (a small pill with a close icon and the number) appears **under the search bar and above the grid** when the first tile is selected and fades out at the end.
- **No tint or inset of a selected tile is drawn:** its size, corners and surface look the same as an unselected one; the only change is the mark. (So no "selected surface" is printed for tiles in this example.)
- The mark is a **round check-mark icon, not the square M3 `Checkbox` component**. The Selection page lists both ("a check mark icon, a checkbox component, a change in surface color, or a combination"); this example uses the first, a check mark icon.
- No action buttons are visible in the frames, so where a tile selection's actions sit is **not printed**.

**So for a tile:** it follows this example: a **round check-mark mark at the tile's top-left corner** (empty circle when off, filled circle with a check when on, shown on every tile once one is selected) and a **"× N" count control above the grid**, with no change of the tile's surface. The card pages print no card-specific selected token or colour, and they call the outline ring the focus indicator, so the ring stays for focus (question 11).

## 3. The model

### 3.1 Which screens have a selection

Selection is for **lists of many like things where an action applies to several at once**. It is not for the page's blocks or text.

| Screen | Selection? | Actions after it | Selection is |
| --- | --- | --- | --- |
| Pages, posts, own-list entries | yes (exists for pages and posts) | Delete; later Hide/Show, Publish | **secondary** (opening is the main thing) |
| Files (images and other files) | yes, new | Delete (files in use are skipped, named, and stay selected); later Tag | **secondary** |
| Notifications | yes (exists) | Delete | secondary |
| Deleted files / pages | yes, new | Restore | **primary** (decided by the owner) |
| Redirects | yes, new, late | Delete | secondary |
| Apps, categories, tags, keywords | **no** — each item is its own control or a chip; nothing is done to many | — | — |
| Blocks of a page | **yes, section 6** (owner: "Add block selection"): Move as a group, Hide/Show, Remove; Duplicate only with one block selected | — | secondary; the mark on hover, all after one is selected |
| Table cells, rows; List-block rows | **no.** One active cell or row; actions on it (#519). A range of cells is a later question | — | — |
| Text | **not this model.** The OS or the browser selects; the bar's text tools act on it (#519, Inputs page) | — | — |

### 3.2 Touch (phone, or any touch or pen input — by pointer type, not screen width)

1. **Enter:** long press on a row or tile (500 ms, as now) or **tap its leading image, icon or avatar** (the shortcut). The shortcut exists only where a row has a leading image or icon: a page's ring, a notification's icon, a file's thumbnail. The shortcut's tap target is the leading slot, at least 48 × 48 dp, and it opens nothing else.
2. **Then:** every row shows its checkbox (section 3.4: M3's "With leading icon and trailing checkbox" for a row that has a leading icon, ring or image; "With leading checkbox" for one that has none). A tap anywhere on a row toggles it. A row's own trailing buttons (unfold, arrow, switch) are hidden or disabled while selecting.
3. **Exit (M3, Selection page):** "tap each selected item until they’re unselected, or tap an action on the toolbar." Escape also clears (Inputs page). The bar's Close button is **our addition** (not printed; it is the swapped bar's leading control and does what unselecting all does). **Back leaves selection mode first (owner's word, 13 November):** the Back gesture or button on a phone clears the selection and the screen stays; a second Back leaves the screen as before (`useSheetBack.ts` already does this for sheets). **M3 is silent here:** no page read says so (the Gestures page lists predictive back only for bottom sheet, navigation bar, navigation rail, search bar and side sheet), so this is the owner's decision, not Material's.
4. **Long press and drag across rows** (decided by the owner, "follow MD3"; M3: "To select multiple items simultaneously, long press and drag across items"), in **a later PR, not the first**, and **only on screens where the same gesture does not pick up and move items** (M3: "Don’t use this gesture combination if it is already in use to pick up and move items, like cards"). Today no editor screen moves items by drag, so every selection list qualifies. **Scrolling: M3 prints nothing about it**, so this is our engineering: the long press only fires when the finger has stayed within 10 px for 500 ms, so the browser has not started to scroll yet; from then on, a non-passive `touchmove` listener on the list calls `preventDefault` while the batch drag runs (changing `touch-action` after the touch has started does not work, so it is not used); a finger that moves before the 500 ms scrolls the page as normal and cancels the press (as today, `longPress.ts`); near the top or bottom edge of the list the list scrolls by itself while the finger is held there; moving the finger back over a row toggles it to the state of the first row. The check proves a drag of 10 px before the hold still scrolls, and a drag after the hold selects and does not scroll.
5. **Two-finger touch (decided by M3):** the Selection page prints "On touch devices, select items using: Long press touch or two-finger touch", so it is built: a second finger put down on a row while a first finger rests on it selects the row (enters selection mode), the same as a long press without the wait. M3 prints nothing more about it (timing, which fingers), so: both fingers on the same row, within the same 10 px of movement. It is made with pointer events (a non-primary touch pointer) in the same hook as the long press (`useLongPress`), and checked on a real phone, because the page's own pinch-zoom uses two fingers too.
6. **Reordering** stays with arrows (`MoveButtons`). M3 prints "Pick up and move: A long press and drag allows people to reorder content" (Gestures). If drag-to-reorder is ever added to a list, that gesture picks up the row, and the batch drag of 3.2 item 4 is off on that screen, as M3 says.

### 3.3 Mouse and keyboard (desktop, or any mouse, trackpad or stylus)

- **Primary or secondary (decided by the owner).** Pages, posts, files, notifications, redirects, entries: selection is **secondary**, so the checkbox (a tile: the round mark) shows **on hover or keyboard focus of that row** (in the slot it will have, so nothing moves). "When one item is selected the selection becomes the primary activity": **on every row and tile once one is selected**, and hover-only again when none is. **Deleted files and pages (decided by the owner): selection is primary there**, so checkboxes are always visible (M3: "checkboxes are always visible when selection is the primary activity").
- **Click on the checkbox** toggles; a click anywhere else on the row opens it, as now. Once one is selected, a click anywhere toggles (selection mode, as on touch).
- **Select button.** The top bar's *Select* (`ListChecks`) stays, for discoverability and for people who do not hover. It enters selection mode with nothing selected.
- **Keys:** Tab reaches the list; arrow keys move between rows (M3 lists accessibility); **Enter** opens a row (primary); **Space** toggles the focused row (enters selection mode if needed); **Shift+click** and **Shift+Arrow** select a range; **Ctrl/Cmd+A** selects all shown rows while in selection mode; **Escape** exits and clears (Inputs page: "clear selections"). Escape already unselects in the Library and in Notifications; it must do so on every selection screen.
- **Right click** is the browser's menu on a row; we do not take it. (M3 says a secondary click "should activate a context menu"; a row context menu is out of this spec.)
- **Hover** only where the device can hover (`@media (hover: hover)`), so a phone never gets a stuck hover checkbox.

### 3.4 Indicators (theme tokens only)

- **List rows (pages, posts, notifications, the files list): one checkbox, plus the theme's selected surface.** Only what M3 prints:
  - Selection controls go in a slot: "Leading slots can contain ... Selection controls: Checkbox, radio button, or switch"; "Trailing slots can contain ... Selection controls: Checkbox, radio button, or switch" (`/components/lists/specs`, Anatomy).
  - The printed variants: "With leading icon and trailing checkbox", "With leading video and trailing checkbox", "With text and trailing checkbox", "With leading checkbox", "With leading checkbox and trailing text" (lists/specs, examples; read with Playwright 13 November).
  - "For selection lists, use only one selection interaction per list item." (specs) and "The selected state applies to the entire list item. ... both the list item and the checkbox show a selected state." (guidelines).
  - Selected shape: "Unselected corner radius: 4dp inner, 16dp outer; Selected corner radius: 16dp" (specs, Shape morphing); the theme has `--list-item-selected-surface`, `-text`, `-radius` (`global.css` 215–226).
  - Two cues, never colour alone (lists accessibility): the checked checkbox and the selected surface and corner.
  **Which variant fits a row that already has a leading icon, ring or image?** M3's printed variant for that row is **"With leading icon" plus a trailing checkbox**. So the leading icon, ring or thumbnail **stays as it is** (it does not change to a filled icon), and the **checkbox is trailing**. That is the one selection interaction. A row with no leading visual (a text-only row) takes the **leading checkbox**. The pages, posts, notifications and files list all have a leading visual, so all four get the trailing checkbox.
  **Token tables, read after expanding them** (Playwright: the token-set menu "List - Common" and the `expand_all` buttons on `/components/lists/specs`; saved as text): "List list item selected container color: #E8DEF8" (baseline light), "selected label text color", "selected supporting text color", "selected leading icon color" and "selected trailing icon color" are all "#4A4458"; "List segment gap: 2dp"; "List list item selected hover state layer" and "focus state layer" tokens exist; a "List list item container selected expressive shape" token exists (its value is a shape drawn as an image, so only the text "Selected corner radius: 16dp" is readable). The tokens are hex values, not role names; the theme's `--list-item-selected-surface` and `-text` (secondary container and its on-colour) match them in the baseline scheme.
  **Where M3 is silent:** it prints **no** change of the leading icon when a row is selected: the selected leading icon has only a colour token (#4A4458), no fill or weight token. The only outlined-to-filled text is for toggle icon buttons (`/components/icon-buttons/guidelines`: "Toggle buttons should use an outlined icon when unselected, and a filled version of the icon when selected"), which is another component. It also does not name colour roles. So **this spec does not draw a custom mark** (no circle, no filled check, no icon swap); an owner who prefers the look of the screenshot of the Lists page (tinted rows, a filled leading icon) has chosen a variant the pages do not print, question 2 asks it.
  **How the trailing checkbox meets the row's other trailing parts:** while a list is selecting, the row's trailing count, arrow and buttons are hidden (guidelines: multi-select items "Can’t have secondary nested actions"), and the checkbox takes the slot. On desktop hover the checkbox shows in that slot, so a count or arrow there gives way to it while the pointer is on the row.
- **Tiles (the Files grid): the Selection page's photo-grid example** (section "Do cards have a selected state?"): a round check-mark mark at the tile's **top-left** corner, an empty circle when off and a filled circle with a check when on, on every tile once one is selected; a "× N" count control above the grid; **no change of the tile's surface**. That position and look are read from the example's video frames, not from page text, and the mark is a check-mark icon, not the `Checkbox` component. The ring stays the focus indicator. The mark's touch target is 48 × 48 dp around the drawn circle (M3 targets), our addition. The mark must stay readable over any image (a light ring, as in the example; checked by `check:contrast` on the tile). Needs the `ImageTile` part (audit #515, row 3), with the mark as its selected state.
- **Table rows** (not the Table block, which is not selected; a screen that becomes a real table with columns): the Selection page's own caption, "Checkboxes are visible by default in this table because selection is a primary activity", shows a checkbox column. M3 prints no data table page (404), so use that caption: a checkbox column with the parent checkbox in the header ("A parent checkbox allows for easy selection or deselection of all items"), and the same selected row surface. Question 12.
- Nothing is drawn in the editor's own CSS: no fixed colours (`check:editor-colors`), no literal values (`check:css-values`).

### 3.5 The selection toolbar

**Decided by the owner (question 1): the selection bar swaps the top bar's title and buttons**, as the Library does now. It is not the
one bar of #519. List screens have no such bar anyway: it belongs to the text editor.

```
PHONE 375 px                                COMPUTER 1280 px
+---------------------------+               +--------------------------------------------+
| [X]  3 selected  [☑][🗑]  |  <- top bar   | [X]  3 selected   [☐ All]      [Delete][⋮] |
|    swapped while selecting|               |                      swapped while selecting|
+---------------------------+               +--------------------------------------------+
| ☑ Pages row               |               | ☑ Pages row ...                            |
```

- It swaps in when selection mode starts and back when it ends. The count ("3 selected") is text in the bar, with `aria-live="polite"`, so a screen reader hears each change.
- Left: **Close** (an icon button, exits and clears). Next: the count (the title's place). Then **Select all** (the theme's `Checkbox`, indeterminate when some are selected: "A parent checkbox allows for easy selection or deselection of all items") on computer; on a phone, *Select all* is a button in the `⋮` menu to keep 48 dp targets. Then the actions of the screen (Delete; Restore), icon buttons with labels and tooltips; extra actions under `⋮`.
- **Who draws it:** one shared component, `SelectionBar`, that every list screen passes to the top bar (`Screen` `title` and `actions`), built from the theme's `IconButton` and `Checkbox`. Library and Notifications do this by hand today.
- This is the editor's own composition of theme parts (`Toolbar`, `IconButton`, `Checkbox`), not a new part.

### 3.6 Screen readers and focus

- Rows in selection mode keep `role="checkbox"` with `aria-checked`, or `aria-pressed` on a button (`List.tsx`). **`aria-selected` and `aria-multiselectable` are not used on these rows:** they belong to `listbox`, `grid`, `tree` and `tablist`, and our rows are links and buttons that act as checkboxes. If the Files grid becomes `role="grid"`, `aria-multiselectable="true"` goes on it and its cells use `aria-selected`; until then tiles are `role="checkbox"` buttons in selection mode. (Reasoning stated so a reviewer can disagree; the M3 pages do not say which ARIA to use.)
- The list gets `role="group"` with `aria-label` while selecting, and the live count in the bar tells the number.
- **Focus:** long press or the shortcut keeps focus on the row; the first toggle by keyboard keeps focus on that row; after **Delete** focus moves to the row that took its place, or to the list heading if none is left; after **Close** or Escape focus returns to the row last toggled (lists accessibility: focus to the selected item).
- **Voice** ("Selection can be performed via ... voice"): the row (`role="checkbox"`) has its headline as its accessible name, so "tap <name>" works.
- **Reduced motion:** the shape morph and the row's swap use the theme's `--motion-*` tokens, which already honour it.

### 3.7 Targets and density

- Touch: the checkbox, the leading shortcut slot (the icon, ring or image), the bar's close, select all and every action in the bar: **48 × 48 dp**. Rows 56 dp and up (M3 lists: "at least 48x48dp"). No density on checkboxes (checkbox accessibility).
- Pointer: 44 dp is the M3 minimum; our 48 satisfies both, so there is no separate pointer size. Hover and focus states use the theme's state layers (8%, 10%).
- Check at 375 and 1280 (section 5).

### 3.8 Parts: what exists and what is missing

| Need | Exists? |
| --- | --- |
| Top app bar that can swap its title and buttons | **Yes**: `Screen` `title` and `actions` (the Library does it) |
| Row that can be selected, with a selected surface and the tick | **Partly**: `ListItem` (`selectable`: a filled `CheckCircle` replaces the leading icon when selected, today; `control: {type: 'checkbox', at: 'leading' \| 'trailing'}`; `list-item-selected-*` tokens). The tick is not an M3 variant and is replaced by the checkbox |
| Long press that selects | **Yes**: `useLongPress` (`theme/ui/longPress.ts`) |
| Checkbox, with indeterminate | **Yes**: `Checkbox` |
| Icon buttons for close, delete | Yes |
| **A checkbox that is shown on hover and always once selecting, in the trailing slot for a row with a leading visual** (the M3 desktop rule and printed variants) | **Missing.** Today a checkbox control is always drawn. Needs a `ListItem` option (`selection: 'hover' \| 'always'`) and CSS with `@media (hover: hover)`; a part change in the theme, with tokens |
| **Tap the leading image or icon to select** (the shortcut) | **Missing.** A `ListItem` option (`selectOnLeading`) that gives the leading slot its own 48 dp target and a handler |
| **Hide the row's own trailing actions while selecting** | **Missing.** A `ListItem` rule when `selecting` is true |
| **Corner change when selected** (4 → 16 dp) | Token exists (`--list-item-selected-radius`); check each theme honours it on these rows |
| **A tile that can be selected** (Files grid) | **Missing**, and already decided in #515 row 3 (`ImageTile`, with a selected state). Selection is one more reason to build it first |
| Selection logic (set, range, select all, prune, keys, Escape) | **Missing** as shared code: written twice (Library `togglePath`, Notifications `pick`). One hook, `useSelection`, in `src/`, with the rules in a tested `.mjs` (as `longPressRules.mjs`) |
| `SelectionBar` (close, count, select all, actions) | **Missing**; an editor composition of the parts above, not a theme part |

Nothing custom is drawn. The three "missing" ListItem items go in the theme so a theme author can restyle them.

## 4. What is Material, what is our choice

Material says: the three entry gestures (long press, two-finger, shortcut), tap to add, the two exit routes, the batch drag with its exception, the desktop checkbox rules, two cues, 48/44 targets, the 16 dp selected corner, one selection mode per list, no nested actions. **Our choices**, marked so the owner can change them: the bar shows a count and a close button (not on the pages read; the swap itself is the owner's decision); checkboxes on every row during touch selection (Material shows indicators without saying a checkbox); *Select* button kept on desktop; the bar's Close button; Back leaving selection first (owner's word, M3 silent); Escape exits everywhere (printed on the Inputs page).

## 5. Order of pull requests, sizes and checks

Into `main`, each with a changeset. S = a day or less, M = a day or two, L = more.

1. **S — one `useSelection` hook, no look change.** Move Library and Notifications to it; add Space, Shift range, Ctrl/Cmd+A, Escape on both; Back leaves selection first (`useSheetBack`); focus rules; `aria-live` count; hide a row's trailing buttons while selecting. Patch changeset. *Unit tests* for the rules (`node --test`, like `longPressRules.test.mjs`).
2. **M — theme `ListItem`: trailing checkbox shown on hover and on all rows while selecting (leading for a text-only row); leading-slot shortcut; selected shape change; no filled-tick swap.** Pages and posts and notifications use it. Screens in `theme/ui` parts page. Patch (or minor, the owner decides) changeset.
3. **M — `SelectionBar`.** One shared component for the swapped top bar (count, Close, Select all with the indeterminate checkbox, actions), used by every list screen.
4. **M — Files.** `ImageTile` with a selected state (after #515 row 3's part), selection mode on the Library, delete several in one commit with the records of tags (as `fileRecords.mjs` does for one). **Files used on pages are skipped (decided by the owner):** the others are deleted, the message names which files were kept and how many, with where they are used (the file sheet already knows: `usedBy`, `Media.tsx` 645 and 709), and **the kept files stay selected**, the deleted ones leave the selection, and selection mode stays on while any remain. Release note.
5. **S each — Deleted files and pages (primary: checkboxes always visible, Restore), Redirects (secondary, Delete), own-list entries (secondary, Delete).**
6. **M — long press and drag across rows** (decided: follow M3), after PR 2 and 3, on every selection list (none of them moves items by drag); the touch-move scroll guard and the edge auto-scroll of 3.2 item 4.
7. **S — two-finger touch** in the same hook as the long press (3.2 item 5), together with PR 2 or on its own.
8. **M — the block drag handle** (section 6.2): a visible handle on every block, the dashboard's drag gesture reused to move a block, no selection yet; after #519's one-bar shell.
9. **M/L — selecting several blocks of a page** (section 6), after PRs 1 to 5 and PR 8.

**What the checks must prove** (`scripts/editor-screens.mjs`, run by `check:screens`; and `node --test`):
- **At 375 with touch emulation** (Playwright context `hasTouch`, `isMobile`; a long press made with real touch events through CDP `Input.dispatchTouchEvent`: touchStart, 600 ms, touchEnd): the row becomes selected (`aria-checked="true"`, selected surface), the top bar swaps to "1 selected", a tap on a second row toggles it **without opening it** (the URL hash is unchanged), a tap on the leading icon of a third row on a fresh list enters the mode, unselecting the last ends the mode and removes the bar, the close button ends it; a long press that moves more than 10 px does nothing; a mouse press of 600 ms does nothing.
- **At 1280 with a mouse and hover:** no checkbox before hover; hover shows exactly one; after one is selected all rows show theirs; click on the row opens it with nothing selected and toggles with one selected; Space toggles, Shift+Arrow selects a range, Ctrl+A selects all, Escape clears; Deleted screens show checkboxes from the start; a selected row has the theme's selected surface, a 16 dp corner and a checked checkbox (computed style); the leading icon, ring or image is unchanged.
- **Both:** every checkbox, the leading shortcut, and every button in the bar measure at least 48 × 48 CSS px; the swapped bar never overflows or scrolls sideways; `check:contrast` and `check:editor-colors` pass on the selected surface in each section colour; `check:css-values` finds no literal value in the new CSS; focus is on the row after entering and on the next row after Delete.
- **A text check that long press in the page text is not taken:** at 375, a 600 ms touch inside a text block does not toggle any selection and does not stop the browser's own text selection.
- **Files, delete several with some in use:** select 5 files of which 2 are used; Delete removes 3 (they are gone from the grid and from `.morpheme` records), the message names the 2 kept files and says "2 of 5", the 2 stay selected with the bar's count "2 selected", selection mode is still on; selecting only used files deletes nothing and says so; when none is left selected the mode ends (screens check at 375 and 1280, with the demo's used and unused files).
- **Back (phone):** in selection mode, a Back (history back) clears the selection and the address stays; with nothing selected, Back navigates as before; Escape and Close clear without a history step left behind.
- *Not covered:* the real OS long press and haptics on a phone, VoiceOver and TalkBack; both by hand, by the owner or the PM on a real phone.

**Release note:** yes, one **paragraph** when step 4 lands (Files can be cleared out in bulk and every list now selects the same way): for example "Select several at once" — "Press and hold a row or tap its image to select it, then tap more. On a computer a box appears when you point at a row." English and Danish with the `release-notes` skill. The existing pending note `bulk-delete-lists` (pages and posts) is a line-sized change on its own; this note replaces it when it goes into the same version, so only one paragraph is written.

## 6. Selecting several blocks of a page (page editor; decided by the owner)

The page editor is the **editor workspace**, where the owner allows deviations from M3. What follows is built from the real block UI
(`MarkdownEditor.tsx`, `blockCard` and `contextualMenu.ts`) and from the contextual toolbar spec (#519, read in full).

### 6.1 What a block is today

- A page's blocks are top-level `siteBlock` nodes of the text. Each is drawn by `blockCard` as a card, `contentEditable = false`.
- **A block that is not typed in place** (Image, Video, HTML, Notice and others): the card is a `<button class="site-block-card">`. A tap opens its sheet or side panel and a small menu (`.site-block-menu`: Edit, Show/Hide on page, Move up, Move down, Remove). A finger on the card also makes the text read-only for a moment (`pointerdown` lock) so the phone keeps its keyboard shut.
- **A block typed in place** (List, Cards, Steps, FAQ, Table and the rest): the card is a `role="group"` with the live rows inside; its menu is on a **handle**, and its contextual bar has the row actions (`contextualMenu.ts`). Text typed in place is text, so a long press **inside** it is the OS's (it starts the text selection).
- **Actions that exist for one block:** Edit, Show/Hide on page (`hidden` prop), Move up, Move down (`moves`), Remove, plus Add above/below, Link, Settings, Fill from a list (typed in place, #519 section 6). **Duplicate does not exist anywhere** in the editor; it is a new action.
- **Rules from the template** (`keeps()`: `rules`, `locked`, `stays`): a locked block cannot be moved or removed, and the last shown one of a block the page must have cannot be hidden or removed. Several-block actions obey the same rules.

### 6.2 How a person enters selection

- **Touch (owner: "Long press anywhere", then "Add a drag handle then").** A **long press (500 ms, as lists) on any part of a block that is not typed text selects it**: the card's background, a non-typed block's card, the block's handle. **In typed text a long press keeps the phone's own word selection** (the OS owns it; the owner's answer was to add a handle rather than take it away). The way in from typed text is therefore **the block's drag handle** (below) or the **Select** item of the block's menu (`.site-block-menu` and the bar's `⋮`; M3 is silent on a menu item, our addition like the Select button of lists).
- **The drag handle (decided by the owner).** Every block gets a **visible drag handle** on touch (and on hover or focus with a mouse). Today only the dashboard has one (see section 3's correction); typed-in-place blocks have a handle for their menu (`handle = bar.block`, `MarkdownEditor.tsx`), and other blocks have none. The handle is the dashboard's: an `IconButton` with the drag-handle glyph (Phosphor `DotsSixVertical`; Material's `drag_indicator` is the backup name in `icon.tsx`), through the theme's icon part, **at least 44 dp** (#519's size; 48 dp where the theme's icon button is 48), `touch-none`, never smaller. Gestures on it:
  - **Drag** (move more than 10 px) **moves the block**, at once, as the dashboard handle does: the block is raised with the theme's elevation and follows the finger, and drops where the finger lets go; keyboard and screen reader users use Move up and Move down. M3's generic pattern is "Pick up and move: A long press and drag allows people to reorder content" (Gestures page); the handle is a dedicated drag control, so it starts at once. That is a deviation inside the editor workspace, and it is the dashboard's behaviour today.
  - **Long press without moving** (500 ms, within 10 px) **selects the block**; if the finger moves after the hold nothing batch-selects: the Selection page says "Don’t use this gesture combination if it is already in use to pick up and move items, like cards", and here the handle's drag picks up and moves the block, so **long press and drag is never a batch gesture on blocks**.
  - **A tap** on the handle does what a tap on the card does today (activates the block); while blocks are selected it toggles the block.
  - **With two or more blocks selected the handles do not drag (decided by the owner: "If you select more than one you can't drag blocks")**; with one selected or none, a handle drags as usual (it moves the block whose handle is dragged). Move up and Move down in the bar move the whole selection. **The handles are shown disabled, not hidden.** M3 prints what a disabled part is: "A disabled state communicates when a component or element isn’t interactive. This state is visually communicated through color changes and reduced elevation." and "Disabled components can’t be focused, dragged, or pressed, and they don’t change state when tapped or hovered over." (`/foundations/interaction/states/applying-states`), and "There can be any number of disabled states in a layout." The disabled colours are the theme's (`--mo-*` disabled tokens, the icon button's disabled state; #520 row 14 notes the opacity is not yet M3's 38%). **What M3 does not print:** a way to explain why a part is disabled. The tooltip page says "To show a tooltip, hover on the parent element on desktop, or tap and hold the element on mobile" (`/components/tooltips/guidelines`), and a disabled part can't be pressed, so **on touch a disabled handle shows no reason by itself**. The reason ("Select blocks that are next to each other to move them" and, for the handle, "Drag is off while several blocks are selected") is the part's `aria-description` (screen readers) and its `title` (mouse hover); the count control's accessible name also says "3 blocks selected". A person on touch without a screen reader sees the disabled look and no text; M3 offers nothing more, so none is added.
- **Selection is the primary state once one block is selected (owner, 13 November):** from then on **every block shows its select mark, a plain tap on any block toggles it** (no long press, no handle), and selection ends by **unselecting all, the ✕ of the count control, Back, or Escape**. It is the Selection page's rule: "checkboxes are always visible when selection is the primary activity", "For all items after one item is selected".
- **Handle and mark together:** the mark (top-left) shows on every block once one is selected; the handle (top-right) stays visible, enabled with one selected, disabled with two or more.
- **The mark** is the one tiles use (section "Do cards have a selected state?", M3's photo-grid example): a round check-mark at the block's **top-left** corner, an empty circle when off, a filled circle with a check when on. **Placement of the handle (decided by the owner, "Top right"):** at the **end (top-right)** of the block, so the mark and the handle never share a corner.
- **Mouse.** The same rule as lists and tiles (owner decision): the mark shows **on hover** at the block's top-left corner; once one block is selected, **all blocks show theirs**; hover-only again when none is. A click on the mark toggles; a click on a block while selecting toggles it. The handle shows on hover and on focus.
- **Keyboard.** Cards are focusable (button or group). **Space** or the *Select* menu item starts and toggles; **Shift+Click** selects a range; **Shift+Arrow** extends from the focused card; **Escape** clears; **Back** (phone) clears first; **Ctrl/Cmd+A** selects all blocks while in selection.
- **Two-finger touch** works on a block's non-typed part (section 3.2 item 5), not inside typed text.

### 6.3 The text cursor, and tables and rows

- Entering selection **takes the text cursor out of the page** and makes the text read-only while selecting (the editor already does this for a finger on a card: the card menu code in `MarkdownEditor.tsx` sets `view.setProps({ editable: () => false })` on `pointerdown`); the phone's keyboard closes. Leaving selection gives the text back with the cursor where it was.
- **A Table's active cell and a list's active row are single**: while blocks are selected they are not active (their row actions are not offered); a Table or a List is a block like any other here (selected as a whole).

### 6.4 Actions for several blocks

Only actions that make sense for many are offered (the same blocks must all allow them):

| Action | For several | Rule |
| --- | --- | --- |
| **Move up / Move down** | yes, as a group | Offered when the selected blocks are next to each other; they move one place together, keeping their order, and not past a locked block. **Not next to each other (decided by the owner, "Yes, disable them"): both buttons are disabled** (the M3 disabled state, quoted in 6.2) with the reason as `aria-description` and `title`; on touch no reason shows by itself, as 6.2 says |
| **Duplicate** (new) | **only with exactly one block selected** (owner: "Only show Duplicate when one is selected. Insert the block right after.") | Hidden, not disabled, with two or more selected. The copy is inserted **right after that block**; the original stays selected. A block the template allows only once is not offered Duplicate |
| **Hide / Show on page** | yes | If any selected block is shown the action is *Hide on page* and hides all; if all are hidden it is *Show on page*. Blocks that `stays` shown are skipped and named (the same rule as files) |
| **Remove** | yes | A **dialog with the count** (the theme's Dialog: "Remove 3 blocks?", the block names listed if five or fewer, *Remove* and *Cancel*, destructive style). Locked and staying blocks are skipped, named, and stay selected; the text's Undo takes the removal back in one step |
| Edit (sheet or panel), Settings, Link, Fill from a list, Add above/below, row actions, the list page | **no** | They are about one block's own fields or one row |

### 6.5 Where the actions sit: the one bar of #519 (decided by the owner)

**Decided by the owner (question 15, "Yes, use the one toolbar"):** the multi-block actions are the **contextual group of #519's one bar**, not the swapped top bar of lists; Save and Preview stay visible in the page header. Read from #519's latest head (`290394a`): one `Toolbar` (docked, standard colour, `role="toolbar"`), **44 × 44 dp buttons, 20 dp icons**, never scrolls, contextual tools first, then a divider, then **Undo and Redo**, then `⋮` (a pop-up menu on a phone). The slots: `floor((width − 32 − divider) / 44)`, so **7 slots at 375 px** (and at 360). A slot is a tool, Undo, Redo or `⋮`.

**The group for several blocks, at 375 px (7 slots, 343 dp):**

```
[ ✕  3 ] [Move up] [Move down] ▏ [Undo] [Redo] [⋮]
   2 slots (88 dp)    1         1         divider  1     1    1   = 7 slots
⋮ : (one block selected) Duplicate, Hide / Show on page, Remove, divider, Select all
⋮ : (two or more)        Hide / Show on page, Remove, divider, Select all
```

- **Close and the count are one control** of two slots (88 dp, "✕" and the number, "3"): a tap clears the selection (the same as Escape); its accessible name and `aria-live` text say "3 blocks selected". Two slots because the count needs room; it is a deviation inside the editor workspace, so allowed.
- **On the bar:** Move up, Move down. Undo and Redo stay (the owner's decision in #519).
- **In `⋮` (a pop-up menu, #519's):** with **one** block selected: Duplicate, Hide / Show on page, Remove, a divider, Select all; with **two or more**: Hide / Show on page, Remove, a divider, Select all (Duplicate is hidden). `⋮` keeps #519's order of groups: the context's tools, then the page tools, then (blocks) Hide, Move, Remove; Select all is the group's first row.
- **If the owner chooses "Undo only"** (#519's open choice, which frees one slot): with one block selected **Duplicate** takes the freed slot, with two or more **Hide / Show** does, and Redo goes into `⋮`.
- **On a wide screen all tools show at once** (#519's rule): the count control, Move up, Move down, Duplicate (only with one block selected), Hide / Show, Remove, then the divider and the main tools; `⋮` holds only Select all.
- **Nothing selected, or a Table or List active:** the bar is #519's, unchanged. Selecting blocks replaces the contextual group in place with the theme's fade (`--motion-effects`); the bar's height never changes.
- **Focus and names:** Tab reaches the bar as one stop with arrow keys inside (the theme's `Toolbar`, as #519); Escape clears the selection and returns the focus to the last toggled block.
- **Dependency:** PR 8 (the handle) and PR 9 follow #519's step 1 (the one-bar shell) and the step that moves the block tools in; if #519's head changes, merge main and re-read it.

### 6.6 PR and checks

**PR 9 — M/L (selection), after PRs 1 to 5, PR 8 (the handle) and #519's one-bar shell:** the select mark on `blockCard`, the selection state of the page's blocks (one hook, `useSelection`, with the block's index as key), the group actions in the row, the Remove dialog, Duplicate (one block only), and the text read-only rule. Release note: part of the selection paragraph, or a line of its own.
Checks (`check:screens`, 375 with touch emulation and 1280, the demo's Blocks page):
- Long press (CDP touch events, 600 ms) on a non-typed block's card and on a typed-in-place block's handle selects it and shows "1" with "1 block selected" as its accessible name in the bar; a long press in typed-in-place text starts no selection and the browser's own text selection works; a tap on a second block toggles it **without opening its sheet**; the text cursor is gone and the keyboard is closed.
- **The handle (PR 8):** every block shows a drag handle on touch at least 44 × 44 dp; a drag of the handle moves the block (the saved Markdown shows the new order) and a locked block is not passed; a long press on the handle without moving, on a block's non-typed part, and the *Select* item all select; a long press in typed text starts the browser's own word selection and selects no block; once one is selected every block shows its mark, a tap toggles, and the handle's drag is off; ✕, unselecting all, Back and Escape each leave selection.
- 1280: no checkbox before hover; hover shows one; after one is selected all blocks show theirs; Shift+Click selects the range; Shift+Arrow extends; Escape clears; Back clears first.
- *Move down* moves two next-to-each-other blocks together (the saved Markdown shows the new order); not next to each other, the buttons are disabled; a locked block is not passed.
- *Duplicate* is in the bar with exactly one block selected and hidden with two or more; it inserts one copy right after that block and the original stays selected; *Hide on page* with a mix of shown and hidden blocks reads *Hide* and hides all, with every selected block hidden it reads *Show* and shows all, and a `stays` block is named and skipped; *Remove* shows the dialog with the count, removes, one *Undo* restores all, and a locked block stays selected with its name in the message.
- With two or more blocks selected every handle is disabled (`aria-disabled` or `disabled`, the disabled look, not focusable) and a drag does nothing; with one selected a handle drags; Move up and Move down are disabled when the selected blocks are not next to each other and each carries its reason as `aria-description`.
- The bar never overflows or scrolls at 375, the bar's group has exactly 7 slots (Close with count of 2, Move up, Move down, Undo, Redo, `⋮`), `⋮` lists, with one block selected, Duplicate, Hide / Show, Remove and Select all (Duplicate is absent with two or more), every button is 44 × 44 dp as #519 says (the block cards' checkboxes are 48 dp), contrast and colours pass (`check:contrast`, `check:editor-colors`).

## 7. Decisions (every question is answered; none is open)

1. ~~Where does the selection bar go?~~ **Decided by the owner:** it swaps the top bar's title and buttons (count, Close, actions), not the docked row of #519.
2. ~~How does selection look in a list?~~ **Decided by M3's printed text, as the owner's rule says ("We follow MD3")**: a trailing checkbox on rows that have a leading icon, ring or image (M3: "With leading icon and trailing checkbox"; all four list screens), a leading checkbox on text-only rows ("With leading checkbox"), plus the selected surface and the 16 dp corner; one selection interaction per row; the leading icon does not change. The tinted-row-and-filled-icon look of the Lists screenshot is not printed by M3 and is not used unless the owner says so in words.
3. ~~Computer: when is the checkbox shown?~~ **Decided by the owner:** on a computer a checkbox shows on hover (selection is secondary). "When one item is selected the selection becomes the primary activity": once one is selected, all rows and tiles show their checkbox (M3: "For all items after one item is selected"; "checkboxes are always visible when selection is the primary activity"), and it is hover-only again when nothing is selected.
4. ~~Long press and drag across rows to select a batch?~~ **Decided by the owner ("follow MD3")**: yes, in a later PR, only where the gesture does not move items; M3 prints nothing about scrolling, so the spec's guard is our engineering (3.2 item 4).
5. ~~Delete several files when some are in use?~~ **Decided by the owner:** skip the used ones and tell which they are; keep them selected. The message is short, in M3 word choice, for example "2 of 5 files are used on pages and were kept: a.jpg, b.png" (with the pages when known); the deleted files leave the selection; selection mode stays on while any remain.
6. ~~Select several blocks of a page?~~ **Decided by the owner:** "Add block selection"; section 6 and PRs 8 and 9. Tables and List-block rows stay on one row or cell.
7. ~~Two-finger touch~~ **Decided by M3**: the Selection page prints it as a way to select on touch, so it is built (3.2 item 5).
8. ~~Keep the *Select* button in the top bar on a computer?~~ **Decided by the owner ("Yes")**: keep it next to the hover checkboxes. M3 is silent: the Selection page prints hover checkboxes and says selection can be done by "tap, cursor, keyboard, or voice", but names no Select button.
9. ~~Back gesture~~ **Decided by the owner** ("Back should leave selection mode"): Back clears the selection and the screen stays; a second Back leaves the screen. M3 is silent on it.
10. ~~Cards: keep the outline ring for focus only?~~ **Settled from the pages** (section "Do cards have a selected state?"): the card pages call the ring the focus indicator and print no card-specific selected token; selection is shown with the Selection page's indicators.
11. ~~Files grid tiles~~ **Decided by M3's printed example** (the Selection page's photo grid, read from its video frames, stated as such): a round check-mark mark at the tile's **top-left** corner (empty circle off, filled circle with a check on, on every tile once one is selected), a "× N" count control above the grid, and **no surface change on the tile**. It changes only if the owner says so in words.
12. ~~Table rows~~ **Decided by M3's printed text:** the Selection page's table caption, "Checkboxes are visible by default in this table because selection is a primary activity", and the Checkbox page's "A parent checkbox allows for easy selection or deselection of all items" give a checkbox column with select-all in the header, plus the selected row surface, where a screen becomes a real table. Lists keep the list rule.
13. ~~Deleted files and pages on a computer~~ **Decided by the owner:** "On deleted selection is the primary": checkboxes are always visible there.
14. ~~Move up and Move down when the selected blocks are not next to each other?~~ **Decided by the owner ("Yes, disable them")**: disabled, with the reason as `aria-description` and `title`; on touch M3 prints no way to show a reason on a disabled part (section 6.2).
15. ~~Block selection: the #519 bar or the swapped top bar?~~ **Decided by the owner ("Yes, use the one toolbar")**: the contextual group of #519's one bar (section 6.5).
16. ~~Where does the drag handle sit on a block?~~ **Decided by the owner ("Top right")**: the drag handle is at the **end (top-right)** of the block; the select mark keeps the top-left (M3's photo-grid example).
17. ~~Duplicate~~ **Decided by the owner:** "Only show Duplicate when one is selected. Insert the block right after." Hidden with two or more selected; the copy goes right after the block.
18. ~~Hide with a mix of shown and hidden blocks~~ **Decided by the owner ("Yes, hide all of them")**: with a mix the button reads Hide and hides all; when every selected block is hidden it reads Show and shows all.
19. ~~Files screen: where do the count and the actions sit?~~ **Decided by the owner ("Yes, follow the example")**: tiles follow M3's photo-grid example. The "× N" control above the grid is the count and the way out, and Delete sits in the top bar's own buttons; lists keep the swapped top bar.
