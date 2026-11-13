# Selecting things in the editor, on touch and with a mouse (design)

Status: proposal for the owner. Design only, no code. Written for a phone: plain words, short.

Owner's ask: "How should we implement touch in the backend?" That is: how the editor (`/editor/`) lets people select items on
touch screens and with a mouse, following Material 3 Selection. Builds on the contextual toolbar spec (PR #519, "the row") and
the two audits (PR #515 "theme parts", PR #520 "Material conformance"). The text and block tools live in #519's docked row; the
selection bar on list screens is a different thing and **swaps the top bar** (owner decision, section 3.5).

Words: **selection mode** is the state where a tap on an item adds it to the selection instead of opening it. The **row** is the
docked contextual toolbar under the main toolbar in the text editor (#519). The **selection bar** is the top app bar's title and
buttons swapped for the count, Close and the actions while a list is in selection mode. A **part** is a ready-made piece of the theme (`theme/ui/`).

## Short answer: where touch selection goes and what it does

Touch means: a long press (or a tap on the row's image or icon) starts selection; a tap adds more; the top bar swaps its title and buttons for the
count, Close and the actions; unselecting the last one, or Close, ends it. A selected list row shows a checked checkbox and the theme's selected surface (section 3.4, from what M3 prints). On a computer the checkbox shows on hover (on all rows once one is
selected); Escape ends it.

| Place | Touch | Computer | Recommendation |
| --- | --- | --- | --- |
| Pages and posts lists | Long press or tap the ring; tap adds; Delete | Hover checkbox; *Select* button | **Keep and improve** (exists today) |
| Notifications | Same; Delete | Hover checkbox | **Keep and improve** (exists today) |
| Files (images and other files) | Long press or tap the thumbnail; Delete (files in use are kept, named, and stay selected) | Hover checkbox | **Build** (needs the image tile; a checkbox on the tile, section 3.4) |
| Deleted files and pages | Same; Restore | Checkboxes always shown (primary, decided) | **Build** |
| Redirects, own-list entries | Same; Delete | Hover checkbox | **Build, later** |
| Apps, categories, tags, keywords | Nothing: each item is its own control | Nothing | **No selection** |
| Blocks of a page | One active block, the row shows its actions | Same | **No batch select** (long press is the OS's in text) |
| Table cells and rows, List-block rows | One active cell or row, the row's actions | Same | **No batch select** |
| Text | The OS handles and magnifier; the row's text tools | Mouse select, double and triple click | **Not this model** |

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
| Blocks of a page (`contextualMenu.ts`, `sectionFrame.ts`, `BlockParts.tsx`) | **One active block, not a selection.** A tap or focus makes a block (or a row in it) the active one; the bar shows its actions: Add above/below, Move up/down, Link, Settings, `⋮` (Hide, Move, Remove) (#519 section 6). `touchstart` on the bar's buttons is cancelled so the keyboard stays. | One block at a time. No *Duplicate* in the action lists of #519 section 6; I found none in the code I read. | Moving is by arrows (*Move up/down*), no drag. |
| Text selection (the ProseMirror editor, `MarkdownEditor.tsx`) | The browser's own (touch: the OS handles and magnifier; mouse: drag, double and triple click). `selecting` at 1711 is an editor plugin for the text caret, not a batch selection. | The row's text tools (#519). | The **OS owns long press here** (it starts the text selection). We never add our own long press inside text. |
| Table cells, rows, columns (`InlineTable.tsx` 67: `onFocus` sets `active: {row, col}`) | One active cell; row and column actions work on its row or column (#519: Row above/below, Column before/after, Delete row/column). | One row or column at a time. | No drag. |
| List rows of List blocks typed in place (`InlineList.tsx`, `InlineLiveList.tsx`, `InlineFieldsList.tsx`) | One active row, the same as a table (#519). | Add above/below, Move, Link, Settings, `⋮`. | No drag; Move up/down. |

**What this means for the batch gesture.** Today **no screen in the editor picks up and moves items by long press or drag** — reordering is always an arrow button. So "long press and drag across items" does not clash with anything now. Two places must never get it: text (the OS long press) and any screen that later adds drag-to-reorder (then reorder uses an explicit drag handle, section 3, and the batch drag is off there).

**What is already right:** the long press, the tap-to-toggle, the swallowed click, the tick plus surface colour (two cues), the keyboard Escape (Library and Notifications), `role=checkbox` on rows. **What is missing:** a visible checkbox (the M3 desktop rule: none appears on hover), the tap-the-icon shortcut, the Space key and range select, a "select all", focus rules, the shape change, hiding a row's own buttons while selecting (a page row's *Unfold* button, `UnfoldButton`, stays active today although M3 says multi-select items "can’t have secondary nested actions"), selection on Files, and one place for the toolbar.

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
| Blocks of a page | **no batch selection in this spec.** One active block with the row (#519). Open question 6 | — | — |
| Table cells, rows; List-block rows | **no.** One active cell or row; actions on it (#519). A range of cells is a later question | — | — |
| Text | **not this model.** The OS or the browser selects; the row's text tools act on it (#519, Inputs page) | — | — |

### 3.2 Touch (phone, or any touch or pen input — by pointer type, not screen width)

1. **Enter:** long press on a row or tile (500 ms, as now) or **tap its leading image, icon or avatar** (the shortcut). The shortcut exists only where a row has a leading image or icon: a page's ring, a notification's icon, a file's thumbnail. The shortcut's tap target is the leading slot, at least 48 × 48 dp, and it opens nothing else.
2. **Then:** every row shows its checkbox (section 3.4: M3's "With leading icon and trailing checkbox" for a row that has a leading icon, ring or image; "With leading checkbox" for one that has none). A tap anywhere on a row toggles it. A row's own trailing buttons (unfold, arrow, switch) are hidden or disabled while selecting.
3. **Exit (M3, Selection page):** "tap each selected item until they’re unselected, or tap an action on the toolbar." Escape also clears (Inputs page). The bar's Close button is **our addition** (not printed; it is the swapped bar's leading control and does what unselecting all does). **The device's Back gesture is not used to leave selection:** no M3 page read says so (the Gestures page lists predictive back only for bottom sheet, navigation bar, navigation rail, search bar and side sheet), so Back works as it does everywhere else in the editor.
4. **Long press and drag across rows** (decided by the owner, "follow MD3"; M3: "To select multiple items simultaneously, long press and drag across items"), in **a later PR, not the first**, and **only on screens where the same gesture does not pick up and move items** (M3: "Don’t use this gesture combination if it is already in use to pick up and move items, like cards"). Today no editor screen moves items by drag, so every selection list qualifies. **Scrolling: M3 prints nothing about it**, so this is our engineering: the long press only fires when the finger has stayed within 10 px for 500 ms, so the browser has not started to scroll yet; from then on, a non-passive `touchmove` listener on the list calls `preventDefault` while the batch drag runs (changing `touch-action` after the touch has started does not work, so it is not used); a finger that moves before the 500 ms scrolls the page as normal and cancels the press (as today, `longPress.ts`); near the top or bottom edge of the list the list scrolls by itself while the finger is held there; moving the finger back over a row toggles it to the state of the first row. The check proves a drag of 10 px before the hold still scrolls, and a drag after the hold selects and does not scroll.
5. **Two-finger touch (decided by M3):** the Selection page prints "On touch devices, select items using: Long press touch or two-finger touch", so it is built: a second finger put down on a row while a first finger rests on it selects the row (enters selection mode), the same as a long press without the wait. M3 prints nothing more about it (timing, which fingers), so: both fingers on the same row, within the same 10 px of movement. It is made with pointer events (a non-primary touch pointer) in the same hook as the long press (`useLongPress`), and checked on a real phone, because the page's own pinch-zoom uses two fingers too.
6. **Reordering** stays with arrows (`MoveButtons`). M3 prints "Pick up and move: A long press and drag allows people to reorder content" (Gestures). If drag-to-reorder is ever added to a list, that gesture picks up the row, and the batch drag of 3.2 item 4 is off on that screen, as M3 says.

### 3.3 Mouse and keyboard (desktop, or any mouse, trackpad or stylus)

- **Primary or secondary (decided by the owner).** Pages, posts, files, notifications, redirects, entries: selection is **secondary**, so the checkbox shows **on hover or keyboard focus of that row** (in the slot it will have, so nothing moves). "When one item is selected the selection becomes the primary activity": **on every row and tile once one is selected**, and hover-only again when none is. **Deleted files and pages (decided by the owner): selection is primary there**, so checkboxes are always visible (M3: "checkboxes are always visible when selection is the primary activity").
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
- **Tiles (the Files grid): a checkbox on the card, plus a selected surface.** M3 cards: "Cards can also include chips, sliders, checkboxes, and other selection controls." (`/components/cards/guidelines`, Actions). Cards have **no selected state**: `/components/cards/specs` lists the outlined card's states as Hovered, Focused, Pressed, Dragged, Disabled, and the cards accessibility page calls the ring "A focus indicator ... around actionable elements when tabbing". So the **outline ring stays focus only**, and the selected look is the Selection page's "a change in surface color" (the theme's selected surface on the tile) with the checkbox as the second cue. **Where M3 is silent:** where the checkbox sits on a card and how it stays readable over an image. The recommendation: top-left corner, the theme's `Checkbox` on its own contained surface so contrast holds over any image (checked by `check:contrast` on the tile). Needs the `ImageTile` part (audit #515, row 3).
- **Table rows** (not the Table block, which is not selected; a screen that becomes a real table with columns): the Selection page's own caption, "Checkboxes are visible by default in this table because selection is a primary activity", shows a checkbox column. M3 prints no data table page (404), so use that caption: a checkbox column with the parent checkbox in the header ("A parent checkbox allows for easy selection or deselection of all items"), and the same selected row surface. Question 12.
- Nothing is drawn in the editor's own CSS: no fixed colours (`check:editor-colors`), no literal values (`check:css-values`).

### 3.5 The selection toolbar

**Decided by the owner (question 1): the selection bar swaps the top bar's title and buttons**, as the Library does now. It is not the
docked contextual row of #519. List screens have no docked tool row anyway: that row belongs to the text editor.

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
- The list gets `role="group"` with `aria-label` while selecting, and the live count in the row tells the number.
- **Focus:** long press or the shortcut keeps focus on the row; the first toggle by keyboard keeps focus on that row; after **Delete** focus moves to the row that took its place, or to the list heading if none is left; after **Close** or Escape focus returns to the row last toggled (lists accessibility: focus to the selected item).
- **Voice** ("Selection can be performed via ... voice"): the row (`role="checkbox"`) has its headline as its accessible name, so "tap <name>" works.
- **Reduced motion:** the shape morph and the row's swap use the theme's `--motion-*` tokens, which already honour it.

### 3.7 Targets and density

- Touch: the checkbox, the leading shortcut slot (the icon, ring or image), the row's close, select all and every action in the row: **48 × 48 dp**. Rows 56 dp and up (M3 lists: "at least 48x48dp"). No density on checkboxes (checkbox accessibility).
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

Material says: the three entry gestures (long press, two-finger, shortcut), tap to add, the two exit routes, the batch drag with its exception, the desktop checkbox rules, two cues, 48/44 targets, the 16 dp selected corner, one selection mode per list, no nested actions. **Our choices**, marked so the owner can change them: the bar shows a count and a close button (not on the pages read; the swap itself is the owner's decision); checkboxes on every row during touch selection (Material shows indicators without saying a checkbox); *Select* button kept on desktop; the bar's Close button; Escape exits everywhere (printed on the Inputs page).

## 5. Order of pull requests, sizes and checks

Into `main`, each with a changeset. S = a day or less, M = a day or two, L = more.

1. **S — one `useSelection` hook, no look change.** Move Library and Notifications to it; add Space, Shift range, Ctrl/Cmd+A, Escape on both; focus rules; `aria-live` count; hide a row's trailing buttons while selecting. Patch changeset. *Unit tests* for the rules (`node --test`, like `longPressRules.test.mjs`).
2. **M — theme `ListItem`: trailing checkbox shown on hover and on all rows while selecting (leading for a text-only row); leading-slot shortcut; selected shape change; no filled-tick swap.** Pages and posts and notifications use it. Screens in `theme/ui` parts page. Patch (or minor, the owner decides) changeset.
3. **M — `SelectionBar`.** One shared component for the swapped top bar (count, Close, Select all with the indeterminate checkbox, actions), used by every list screen.
4. **M — Files.** `ImageTile` with a selected state (after #515 row 3's part), selection mode on the Library, delete several in one commit with the records of tags (as `fileRecords.mjs` does for one). **Files used on pages are skipped (decided by the owner):** the others are deleted, the message names which files were kept and how many, with where they are used (the file sheet already knows: `usedBy`, `Media.tsx` 645 and 709), and **the kept files stay selected**, the deleted ones leave the selection, and selection mode stays on while any remain. Release note.
5. **S each — Deleted files and pages (primary: checkboxes always visible, Restore), Redirects (secondary, Delete), own-list entries (secondary, Delete).**
6. **M — long press and drag across rows** (decided: follow M3), after PR 2 and 3, on every selection list (none of them moves items by drag); the touch-move scroll guard and the edge auto-scroll of 3.2 item 4.
7. **S — two-finger touch** in the same hook as the long press (3.2 item 5), together with PR 2 or on its own.

**What the checks must prove** (`scripts/editor-screens.mjs`, run by `check:screens`; and `node --test`):
- **At 375 with touch emulation** (Playwright context `hasTouch`, `isMobile`; a long press made with real touch events through CDP `Input.dispatchTouchEvent`: touchStart, 600 ms, touchEnd): the row becomes selected (`aria-checked="true"`, selected surface), the top bar swaps to "1 selected", a tap on a second row toggles it **without opening it** (the URL hash is unchanged), a tap on the leading icon of a third row on a fresh list enters the mode, unselecting the last ends the mode and removes the bar, the close button ends it; a long press that moves more than 10 px does nothing; a mouse press of 600 ms does nothing.
- **At 1280 with a mouse and hover:** no checkbox before hover; hover shows exactly one; after one is selected all rows show theirs; click on the row opens it with nothing selected and toggles with one selected; Space toggles, Shift+Arrow selects a range, Ctrl+A selects all, Escape clears; Deleted screens show checkboxes from the start; a selected row has the theme's selected surface, a 16 dp corner and a checked checkbox (computed style); the leading icon, ring or image is unchanged.
- **Both:** every checkbox, the leading shortcut, and every button in the bar measure at least 48 × 48 CSS px; the swapped bar never overflows or scrolls sideways; `check:contrast` and `check:editor-colors` pass on the selected surface in each section colour; `check:css-values` finds no literal value in the new CSS; focus is on the row after entering and on the next row after Delete.
- **A text check that long press in the page text is not taken:** at 375, a 600 ms touch inside a text block does not toggle any selection and does not stop the browser's own text selection.
- **Files, delete several with some in use:** select 5 files of which 2 are used; Delete removes 3 (they are gone from the grid and from `.morpheme` records), the message names the 2 kept files and says "2 of 5", the 2 stay selected with the bar's count "2 selected", selection mode is still on; selecting only used files deletes nothing and says so; when none is left selected the mode ends (screens check at 375 and 1280, with the demo's used and unused files).
- *Not covered:* the real OS long press and haptics on a phone, VoiceOver and TalkBack; both by hand, by the owner or the PM on a real phone.

**Release note:** yes, one **paragraph** when step 4 lands (Files can be cleared out in bulk and every list now selects the same way): for example "Select several at once" — "Press and hold a row or tap its image to select it, then tap more. On a computer a box appears when you point at a row." English and Danish with the `release-notes` skill. The existing pending note `bulk-delete-lists` (pages and posts) is a line-sized change on its own; this note replaces it when it goes into the same version, so only one paragraph is written.

## 6. Questions for the owner (the PM asks them one at a time)

1. ~~Where does the selection bar go?~~ **Decided by the owner:** it swaps the top bar's title and buttons (count, Close, actions), not the docked row of #519.
2. **How does selection look in a list?** M3 prints the variants "With leading icon and trailing checkbox" and "With leading checkbox", the selected surface and the 16 dp corner, and one selection interaction per row. Recommendation: **a trailing checkbox on rows that have a leading icon, ring or image (all four list screens), a leading checkbox on text-only rows, plus the selected surface; the leading icon does not change.** Alternative, not printed by M3: a filled leading icon and a tinted row with no checkbox (the Lists screenshot); I do not recommend it, because the pages do not describe it and a screen reader and a mouse user have no control to find.
3. ~~Computer: when is the checkbox shown?~~ **Decided by the owner:** on a computer a checkbox shows on hover (selection is secondary). "When one item is selected the selection becomes the primary activity": once one is selected, all rows and tiles show their checkbox (M3: "For all items after one item is selected"; "checkboxes are always visible when selection is the primary activity"), and it is hover-only again when nothing is selected.
4. ~~Long press and drag across rows to select a batch?~~ **Decided by the owner ("follow MD3")**: yes, in a later PR, only where the gesture does not move items; M3 prints nothing about scrolling, so the spec's guard is our engineering (3.2 item 4).
5. ~~Delete several files when some are in use?~~ **Decided by the owner:** skip the used ones and tell which they are; keep them selected. The message is short, in M3 word choice, for example "2 of 5 files are used on pages and were kept: a.jpg, b.png" (with the pages when known); the deleted files leave the selection; selection mode stays on while any remain.
6. **Select several blocks of a page (move, delete, duplicate together)?** Blocks and text are typed in place, where a long press is the OS's. Recommendation: **no**: one active block with the row; revisit with *Duplicate* if owners ask. Tables and List-block rows likewise stay on one row or cell.
7. ~~Two-finger touch~~ **Decided by M3**: the Selection page prints it as a way to select on touch, so it is built (3.2 item 5).
8. **Keep the *Select* button in the top bar on a computer next to the hover checkboxes?** M3 is silent: the Selection page prints hover checkboxes and says selection can be done by "tap, cursor, keyboard, or voice", but names no Select button. The button exists today (Library). Recommendation: **keep it**, as the way to start selecting from the keyboard and for people who do not hover; the nearest M3 pattern is the hover checkbox, which stays.
9. ~~Back gesture~~ **Decided by M3's silence**: no page read says Back leaves selection; it is not used (3.2 item 3). Escape clears selection (Inputs page).
10. **Cards: keep the outline ring for focus only?** M3's cards list no selected state (Hovered, Focused, Pressed, Dragged, Disabled). Recommendation: **yes**. A selected card is the theme's selected surface plus a checkbox on the card.
11. **Files grid tiles:** a checkbox on the tile (M3: "Cards can also include ... checkboxes"), top-left on its own contained surface, plus the selected surface? Recommendation: **yes**; M3 is silent on where it sits, so this is our choice.
12. **Table rows:** a checkbox column with select-all in the header, only where a screen becomes a real table (Material's own table caption shows one)? Recommendation: **yes**.
13. ~~Deleted files and pages on a computer~~ **Decided by the owner:** "On deleted selection is the primary": checkboxes are always visible there.
