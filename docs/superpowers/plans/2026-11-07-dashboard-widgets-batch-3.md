# Dashboard widgets, batch 3: edit mode

Status: not started. Checked against the code on 2026-11-10.

Master plan: `2026-11-07-dashboard-widgets.md`. Needs batch 2.

Before the tasks: read the Material 3 pages for cards, menus, lists and the top app bar on m3.material.io.
Write the chosen patterns into this file. Do not invent a pattern.

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
