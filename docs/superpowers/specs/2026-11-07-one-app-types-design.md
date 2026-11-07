# One active app per type

Date: 2026-11-07. Status: approved design.

## Goal

More apps can do the same job. The CMS sets per app type whether one app or many apps can be active. Activating a
second app of a one-app type shows a warning and deactivates the first app. No data is lost.

## Decisions

| # | Decision |
|---|---|
| 1 | The app type (`category` in `defineApp` and in the store catalog) sets the rule. The CMS owns the rule. The owner and the app cannot change it. |
| 2 | A type allows one active app only when two apps of that type collide in code or data (the same file, the same Worker route, the same data). All other types allow many active apps. |
| 3 | The current types (`booking`, `newsletter`, `payment`, `analytics`, `content`, `design`) do not collide. They allow many active apps. |
| 4 | A new type `redirects` allows one active app. Two redirect apps write the same redirect rules. |
| 4a | A new type `links` allows one active app. Two internal-links apps link the same keywords twice and mix the link counts. The internal-links app (`2026-11-07-internal-links-app-design.md`) uses it. |
| 5 | Activation is install or the Enabled switch (Danish label: Aktiveret). Both paths show the warning. |
| 6 | The owner confirms the warning. The new app becomes active and the other app becomes deactivated, in one commit. |
| 7 | Cancel changes nothing. |
| 8 | Deactivation uses the existing `off` list in `src/data/apps.json`. The deactivated app stays installed with its folder, settings and data. |
| 9 | Reactivating the deactivated app is the same flow in the other direction. |
| 10 | Uninstall and update do not check the rule. An update keeps a deactivated app deactivated, as today. |

## What the owner sees

- An app page with Install or the Enabled switch, for an app of a one-app type, while another app of that type is active.
- Install or the switch opens the editor's dialog (`ask`, `src/ask.tsx`):
  - en: "Only one Redirects app can be active. Activating {new} deactivates {old}. Its settings and data stay, and you can activate it again."
  - da: "Kun én app af typen Videresendelser kan være aktiv. Når du aktiverer {new}, deaktiveres {old}. Dens indstillinger og data bliver, og du kan aktivere den igen."
  - Button: en "Activate", da "Aktivér". Plus the dialog's own Cancel.
- After the save, the old app shows "Deactivated" in the app list, as a switched-off app does today.
- The store filter gets the type Redirects (Danish label: Videresendelser).

## Design

### The rule: `lib/appTypes.mjs` (new, pure, tested)

| Export | Shape | Meaning |
|---|---|---|
| `ONE_APP_TYPES` | `readonly string[]` = `['redirects', 'links']` | The types that allow one active app. |
| `rivalsOf(app, apps, active)` | `({ id, category? }, { id, category? }[], string[]) => string[]` | The ids of active apps (`active`) of the same one-app type as `app`, without `app.id`. Sorted. Empty when `app` has no category or a many-app type. |
| `withRivalsOff(state, rivals)` | `(AppsState, string[]) => AppsState` | The state with each rival in `off` (`withOff` from `lib/appsFile.mjs`). |

### Where the rule runs: `src/AppList.tsx`

| Path | Today | Change |
|---|---|---|
| Install of a site's own app | `install(true)` in `AppContent` | Before the save: `rivalsOf`. With rivals: `ask`. On yes: write `apps.json` with `withRivalsOff` applied. |
| Install from the store | `useStoreActions().install` → `appChanges` | Before `change()`: `rivalsOf`, then `ask`. On yes: give `appChanges` the apps file with the rivals already off, the same `oid`. |
| Enabled switch on | `turn(true)` in `AppContent` | Before the save: `rivalsOf`, then `ask`. On yes: `withOff(…, false)` for the app, `withRivalsOff` for the rivals, one commit. |
| Enabled switch off, uninstall, update | as today | No change. |

- `apps` for `rivalsOf`: the site's apps (`apps` in `src/apps.ts`) with their `category`. `active`: `activeApps(files)`.
- The app being installed from the store takes its `category` from the catalog (`ShownApp.category`).

### Other changes

- `src/store.ts`: `redirects` and `links` in `appCategories`. Labels: en "Links", da "Links".
- `src/i18n/en-US/apps.ts`, `src/i18n/da-DK/apps.ts`: the type label, the warning text, the button text. Present tense.
- `docs/app-contract.md`: a section on app types with one active app. No `APP_API` change: the change adds a type and breaks no app.
- A changeset (`.changeset/`), patch.

## Tests

- `lib/appTypes.test.mjs` covers `rivalsOf` and `withRivalsOff` (cases in the plan).
- The `AppList.tsx` wiring is thin UI. The logic is in `lib/appTypes.mjs`. Checked by hand: see the plan.

## Out of scope

- A redirects app. The core redirects (`src/data/redirects.json`, `Redirects.tsx`) stay as they are.
- Sites that already have two active apps of a one-app type. No such site exists: no app has the type `redirects` or `links` yet.
- More than one type per app.
- Hiding store filter types that have no apps.
