# Dashboard widgets, batch 3: edit mode

Status: done (PR against main, 2026-11-10). Differences from the plan are listed below; the two-browser and second-person acceptance check is left for the owner (the signed-in editor cannot be reached from the build session). The Settings sheet is covered by unit tests only: no CMS widget has `settings` until batch 4 (Blog rhythm).

Master plan: `2026-11-07-dashboard-widgets.md`. Needs batch 2.

Before the tasks: read the Material 3 pages for cards, menus, lists and the top app bar on m3.material.io.
Write the chosen patterns into this file. Do not invent a pattern.

## Differences from the plan (names checked against the code)

- The grid is `src/DashboardGrid.tsx` (component `Dashboard`), not `src/Dashboard.tsx` (batch 2 renamed it: a `Dashboard.tsx` beside `dashboard.mjs` fails the build's case-insensitive name check). The start screen is `Start` in `src/Library.tsx`.
- `appSettingsPart(app)` takes a `SiteApp` and makes a part that saves to a file in the repo (`file`, `commit`, `back`). A widget's settings are not an app, so `WidgetSettings.tsx` builds a `Part` of the same shape with the widget's `settings.fields` and `settings.values` and no `file`, and draws it with `PartFields` and `PartFormProviders`. `usePartForm` commits to the repo, so it is not used: the settings keep their values in local state and `setSettings` writes them into the dashboard.
- `src/dashboardMoves.mjs` (pure move and drop-target logic) and `src/widgetValues.mjs` (the settings form's values and the changed values) hold the pure parts; they are not named `dashboardEdit.mjs` or `widgetSettings.mjs` because the build's case-insensitive name check rejects them beside `DashboardEdit.tsx` and `WidgetSettings.tsx`.
- `/api/dashboard` answers `503 no-storage` without a `DASHBOARD` binding: `saveDashboard` throws `DashboardSaveError` (`no-storage`), Done keeps edit mode and shows a `role="alert"` notice. `openEditor` in `scripts/built-site.mjs` fakes `/api/dashboard` (GET, PUT, and a failing PUT) so `check:screens` covers edit, remove, add, save and a failed save.
- `src/dashboardStore.ts` only loads; batch 3 adds `saveDashboard` there.
- The start screen's `Screen` takes the top bar buttons as `actions`, so edit state lives in `Start`, which owns the `Screen`.

## Chosen patterns (Material 3, read on m3.material.io on 2026-11-10)

- **Top app bar** (app bars, "Usage"): "App bars should only have one action, two if necessary. The primary action should alter or exit the entire page, like Send, Save, or Edit." and "To boost visibility of a primary action, change the style of the icon button to filled or tonal". So the bar gets one added action: an icon button "Edit dashboard" (pencil); in edit mode it is replaced by a tonal "Done" button (one tonal button, never more).
- **Cards** (cards, "Cards in a collection", "Overflow menu", "Pick up & move"): the cards stay a coplanar grid. "Overflow menus ... are typically placed in the upper-right or lower-right corner of a card": in edit mode each card gets an overflow (more) icon button in its top end corner, and a drag handle in its top start corner. "The pick-up-and-move gesture allows users to move and reorder cards in a collection. When moving a card, increase its elevation. Don't let cards bump other elements out of the way": a dragged card is raised (the theme's elevation token) and the other cards do not move until it is dropped.
- **Menus** (menus, "Overflow menus", "Compact breakpoints"): the card's menu is a temporary set of actions: Move up, Move down, Settings (only with `settings`), Remove, with a divider before Remove. The editor's `Menu`/`MenuItem` (`ui.tsx`) already follows the guidance: a menu from medium, "adapting menus into bottom sheets on small screens" on compact. Keyboard and screen reader users reach reorder through Move up and Move down (the drag is a pointer extra, never the only way). Move up on the first and Move down on the last card are disabled. After a move the card's menu button keeps the focus, and a live region says "Moved to position 2 of 4".
- **Lists** (lists, "Usage": "Use lists for communicating or selecting discrete items"): "Add widget" is a list of discrete choices, so each widget is a list item with its icon (leading), label (headline) and hint (supporting text); the primary text and icons are in the same place in each row. It opens in the editor's `BottomSheet` (a sheet from the bottom on compact, a dialog in the middle from medium). CMS widgets come first, then a group per app (a group title is the app's name). A tap adds the widget and closes the list.
- **Dialogs** (dialogs: "a modal window ... Dialogs are purposefully interruptive, so they should be used sparingly"): widget settings are a task that needs a decision, so they open in the same `BottomSheet` (the editor's choice for modal forms, as the Menu's sheet), with the settings as `PartFields` and the actions Cancel and Save; Save writes the values into the draft. Errors of a failed save are not a dialog (low priority: "Don't use dialogs for low- or medium-priority information"): they are a `Notice` (`role="alert"`) over the grid, and edit mode stays.
- **Not found on m3.material.io:** a rule for a drag handle's shape or for a reorder with the keyboard. The handle is the Phosphor `DotsSixVertical` icon (added to the three icon packs in `site/icons.mjs` and `icons/`), and the keyboard way is the menu.
- No new CSS values: the editor uses only the site theme's tokens and the `ui.tsx` / `themeUi` components.

## Task 3.1: edit mode and card controls

Files: `src/DashboardEdit.tsx`, `src/Dashboard.tsx`, `src/Library.tsx`, i18n files. Worker: Sonnet agent.

1. Add an "Edit dashboard" icon button to the start screen's top app bar.
2. In edit mode, render every placed widget with `editing: true`.
3. Give each card a drag handle and a menu: "Move up", "Move down", "Settings" (only with `settings`), "Remove".
4. Use `moveWidget` and `removeWidget` from `src/dashboard.mjs`. Keep the edits local until "Done".
5. "Done" saves with `PUT /api/dashboard`. A failed save keeps edit mode and shows the error.

## Task 3.2: add widget

Files: `src/AddWidget.tsx`, i18n files. Worker: Haiku agent.

1. Add an "Add widget" button in edit mode.
2. Show all widgets from `allWidgets`: CMS first, then by app. Show label, icon and hint.
3. Add the picked widget with `addWidget`. A widget can be added more than once.

## Task 3.3: widget settings

Files: `src/WidgetSettings.tsx`, i18n files. Worker: Sonnet agent.

1. Draw the widget's `settings` with the same Part fields as app settings (`appSettingsPart`, `PartFields`).
2. Save the changed values with `setSettings`. Do not write them to the repo.

Test cases (pure parts in `src/dashboard.mjs`, from batch 1): move, remove, add twice, set settings.

Acceptance: `npm run check` and `npm run check:screens` pass. Edit on one browser; open the editor in a second browser
as the same person; the same dashboard shows. Sign in as a second person; that person sees the default set.
Send the owner screenshots of edit mode and the "Add widget" list.
