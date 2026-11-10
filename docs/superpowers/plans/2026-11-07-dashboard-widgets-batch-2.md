# Dashboard widgets, batch 2: contract and grid

Status: done (PR against main, 2026-11-10). Differences from this plan: `APP_API` is not raised (`widgets` is an optional field; an app without it works as before); the component file is `src/DashboardGrid.tsx` (a `Dashboard.tsx` beside `dashboard.mjs` fails the build's case-insensitive name check); `cmsWidgets` lives in `src/cmsWidgets.ts` and `Start` gives the widgets their data through `src/startData.ts`; a Worker without the `DASHBOARD` binding (503 `no-storage`) shows the default dashboard.

Master plan: `2026-11-07-dashboard-widgets.md`. Needs batch 1.

## Task 2.1: widget contract

Files: `src/widgets.ts`, `src/apps.ts`, `lib/contracts.mjs`, `docs/app-contract.md`, `src/store.ts`, `src/checkSite.ts`.
Worker: Sonnet agent (store versions, contract rules).

1. Add `WidgetDefinition` and `WidgetProps` in `src/widgets.ts`, as in the design.
2. Add `widgets?: Record<string, WidgetDefinition>` to `AppDefinition`, with a doc comment.
3. Add `allWidgets(apps)` in `src/widgets.ts`. It returns a map of full id to definition: CMS widgets, then each installed app's.
4. Raise `APP_API` in `lib/contracts.mjs` as `docs/app-contract.md` says. Describe widgets in `docs/app-contract.md`.
5. Teach `needsOf` and `src/checkSite.ts` about `widgets`, like `page`, `screens` and `tabs`.

Test cases:

| Case | Expected |
|---|---|
| `allWidgets` with no apps | only `cms:` ids |
| An app `booking` with widget `today` | the id `booking:today` is in the map |
| `checkSite` with a widget without `component` | an error that names the app and the key |

## Task 2.2: Continue as a widget

Files: `src/widgets/continue.tsx`, `src/ContinueCard.tsx`. Worker: Haiku agent.

1. Make `cms:continue` from `ContinueCard`. Keep its behaviour. Use `WidgetProps`.
2. Delete `src/ContinueCard.tsx` when nothing imports it. Update the file map in AGENTS.md.

## Task 2.3: grid on the start screen

Files: `src/Dashboard.tsx`, `src/dashboardStore.ts`, `src/Library.tsx` (`Start`), i18n files. Worker: Sonnet agent (ui.tsx rules).

1. Load the dashboard from `GET /api/dashboard` in `src/dashboardStore.ts`. Use `defaultDashboard` for `null`.
2. Skip placements whose widget is not in `allWidgets`.
3. Show the widgets in a grid: one column on compact, two from medium, three from expanded.
4. Replace `<ContinueCard … />` in `Start` with `<Dashboard … />`. Keep `UpdatesNotice` and `StartFab`.
5. Show a loading state and an error state. Texts in present tense, en and da.

Acceptance: `npm run check` passes. `npm run check:screens` passes. Send the owner a screenshot of the start screen at compact and expanded width.
