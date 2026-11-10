# Dashboard widgets: master plan

Status: batches 1-4 done (data functions, Worker route, KV binding; widget contract, grid, Continue; edit mode; the other three CMS widgets). Checked against the code on 2026-11-10.

Design: `docs/superpowers/specs/2026-11-07-dashboard-widgets-design.md`. Read it first.

## Goal

The start screen shows a dashboard of widgets. Each person edits their own dashboard. Apps can add widgets.

## Architecture

The CMS owns the dashboard host, the widget contract and the storage. A Worker route keeps each dashboard in KV.
Widgets come from `src/widgets/` and from `AppDefinition.widgets`. Logic stays in pure, tested `.mjs` functions.

## File structure

| Path | Batch | What |
|---|---|---|
| `src/dashboard.mjs`, `src/dashboard.test.mjs` | 1 | Pure functions for `StoredDashboard`: validate, default, add, remove, move, set settings, drop missing |
| `worker/dashboard.js`, `scripts/check-dashboard.mjs` | 1 | `GET`/`PUT /api/dashboard`, KV `DASHBOARD`, GitHub user id |
| `worker/index.js` | 1 | One route line |
| `starter/wrangler.jsonc`, `demo` config | 1 | KV binding `DASHBOARD` |
| `src/widgets.ts` | 2 | `WidgetDefinition`, `WidgetProps`, the registry of all widgets (CMS + installed apps) |
| `src/apps.ts`, `lib/contracts.mjs`, `docs/app-contract.md` | 2 | `widgets` field; `APP_API` up; contract doc |
| `src/store.ts`, `src/checkSite.ts` | 2 | Needs and checks know `widgets` |
| `src/widgets/continue.tsx` | 2 | `cms:continue` from `ContinueCard.tsx` |
| `src/Dashboard.tsx`, `src/WidgetCard.tsx` (or in `ui.tsx`) | 2 | The grid on the start screen |
| `src/dashboardStore.ts` | 2 | Load and save through the Worker |
| `src/DashboardEdit*.tsx` | 3 | Edit mode: edit button, card controls, "Add widget" list, settings dialog |
| `src/widgets/unfinished.tsx`, `blogRhythm.tsx` (+ `.mjs` logic), `status.tsx` | 4 | The other three CMS widgets |
| `src/i18n/en-US/*.ts`, `src/i18n/da-DK/*.ts` | 2–4 | Texts, present tense |

## Batches

| Batch | File | Visible result |
|---|---|---|
| 1 (done) | `2026-11-07-dashboard-widgets-batch-1.md` | `npm test` passes the new data tests; `check:worker` passes the Worker route checks |
| 2 (done) | `2026-11-07-dashboard-widgets-batch-2.md` | The start screen is a grid with the Continue widget, loaded from the Worker |
| 3 (done) | `2026-11-07-dashboard-widgets-batch-3.md` | Edit mode: add, remove, reorder, settings; saved per person |
| 4 (done) | `2026-11-07-dashboard-widgets-batch-4.md` | Unfinished work, Blog rhythm and Site status on the dashboard |

## Constraints

- Follow `AGENTS.md`. Every PR has a changeset. Run `npm run check` before every push.
- Editor texts are present tense, in `en-US` and `da-DK`. No Danish outside `i18n/da-DK/`.
- UI follows Material 3. Check the m3.material.io page before you decide a pattern.
- Reuse the code in the design's "Reuse" table. Do not build a second settings form.
- Frontmatter access for widgets: coordinate with the internal-links work before batch 4. Build it once.
- New KV binding: no key or secret is made. Ask the owner before any write to a live KV namespace.
- Merges into main go to the PR review session.
