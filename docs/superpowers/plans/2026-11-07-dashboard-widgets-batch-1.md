# Dashboard widgets, batch 1: data and storage

Master plan: `2026-11-07-dashboard-widgets.md`. Design: `../specs/2026-11-07-dashboard-widgets-design.md`.

## Task 1.1: dashboard data functions

Files: `src/dashboard.mjs`, `src/dashboard.test.mjs`. Worker: Haiku agent.

Interface:

```js
export const DASHBOARD_VERSION = 1;
export const MAX_WIDGETS = 50;
export function validDashboard(value)            // StoredDashboard | null; null for any other shape or version
export function defaultDashboard(newId)          // the four CMS widgets, in design order
export function addWidget(dash, widget, newId)   // appends a placement with empty settings
export function removeWidget(dash, id)
export function moveWidget(dash, id, toIndex)
export function setSettings(dash, id, settings)
export function withoutMissing(dash, knownIds)   // drops placements whose widget is not in knownIds
```

All functions are pure. They return a new object. `newId` is a function, so tests give fixed ids.

Test cases:

| Case | Expected |
|---|---|
| `validDashboard(null)`, `validDashboard({ version: 2, widgets: [] })` | `null` |
| A placement without `id`, or with a `widget` without `:` | `null` |
| Two placements with the same `id` | `null` |
| 51 placements | `null` |
| `defaultDashboard` | `cms:continue`, `cms:unfinished`, `cms:blog-rhythm`, `cms:status` |
| `addWidget` twice with the same widget | two placements, two ids |
| `moveWidget` to index 0, to the last index, to an index out of range | moved; moved; clamped |
| `removeWidget` with an unknown id | the same widgets |
| `withoutMissing` with an uninstalled app's widget | that placement gone, the order of the others kept |

Acceptance: `npm test` passes. `npx prettier --check src/dashboard.mjs src/dashboard.test.mjs` gives no warnings.

## Task 1.2: Worker route and KV binding

Files: `worker/dashboard.js`, `worker/dashboard.test.mjs`, `worker/index.js`, `starter/wrangler.jsonc`, the demo's Worker config.
Worker: Sonnet agent (Worker and session rules).

1. Add `handleDashboard(request, env, ask = fetch)` in `worker/dashboard.js`.
2. Use `sessionToken` and `access` from `worker/session.js`. Answer `401` or `403` as the other routes do.
3. Get the user id from GitHub `GET /user` with the token. Use the numeric `id`.
4. `GET`: read `dashboard:<id>` from `env.DASHBOARD`. Answer `{ dashboard }` (null when there is none).
5. `PUT`: refuse a body over 16 KB with `413`. Refuse a body that `validDashboard` rejects with `400`. Else store it, answer `204`.
6. Add the route line `/api/dashboard` in `worker/index.js`, next to the other `/api/` routes.
7. Add `{ "binding": "DASHBOARD" }` to `kv_namespaces` in `starter/wrangler.jsonc` and in the demo's config.
8. Add the file header. Update the route list in the `worker/index.js` header.

Test cases (fake KV and fake `ask`):

| Case | Expected |
|---|---|
| No session cookie | `401` |
| Session without repo access | `403` |
| `GET` with no stored record | `200 { dashboard: null }` |
| `PUT` valid, then `GET` | the same record |
| `PUT` with `version: 2` | `400` |
| `PUT` with 17 KB | `413` |
| Two users | two keys; neither sees the other's record |

Acceptance: `npm run check` passes.
