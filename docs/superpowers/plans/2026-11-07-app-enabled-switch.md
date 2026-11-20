# Plan: app Enabled switch and the app's version

Status: done (PR #150 and PR #155). Checked against the code on 2026-11-10.

Spec: `docs/superpowers/specs/2026-11-07-app-enabled-switch-design.md`. Session branch: `app-enabled-switch`.

## Goal

An installed app gets an Enabled switch. A deactivated app stays installed but does nothing and cannot be reached. The
app page head shows the app's version.

## Tasks

| Task | Worker | Depends on | Branch |
|---|---|---|---|
| T1: `lib/appsFile.mjs` and its tests | Ollama runner | none | `app-enabled-switch-t1` |
| T2: readers, writers, Worker, UI, version, changeset | Sonnet agent | T1 merged into the session branch | `app-enabled-switch-t2` |

## T1: `lib/appsFile.mjs`

Create `lib/appsFile.mjs` and `lib/appsFile.test.mjs`. Plain ES module, JSDoc types, no imports. Start the file with a
2–3 line header comment: what it does, what it exposes, what depends on it.

Interface:

```js
/** @typedef {{ installed: string[], off: string[] }} AppsState */

/** Reads the text of src/data/apps.json. Bad JSON, a missing file (undefined) or wrong types give empty lists.
 * Keeps only string ids. Sorts and removes duplicates. Drops ids in `off` that are not in `installed`. */
export function readAppsFile(text) // (text: string | undefined) => AppsState

/** The active apps: `installed` minus `off`, sorted. */
export function activeOf(state) // (state: AppsState) => string[]

/** The file text: JSON with 2-space indentation and a final newline. Sorted lists, no duplicates.
 * `off` keeps only ids in `installed`. No `off` key when `off` is empty. */
export function appsFileText(state) // (state: AppsState) => string

/** The state with `id` installed (`yes` true) or uninstalled (`yes` false). Uninstall also removes `id` from `off`. */
export function withInstalled(state, id, yes) // (state: AppsState, id: string, yes: boolean) => AppsState

/** The state with `id` deactivated (`off` true) or active (`off` false). No change when `id` is not installed. */
export function withOff(state, id, off) // (state: AppsState, id: string, off: boolean) => AppsState
```

The functions do not change their input. They return new objects.

Test cases (`node:test`, `node:assert/strict`):

| Function | Input | Result |
|---|---|---|
| `readAppsFile` | `undefined` | `{ installed: [], off: [] }` |
| `readAppsFile` | `'not json'` | `{ installed: [], off: [] }` |
| `readAppsFile` | `'{"installed":["b","a","a"]}'` | `{ installed: ['a', 'b'], off: [] }` |
| `readAppsFile` | `'{"installed":["a","b"],"off":["b","x"]}'` | `{ installed: ['a', 'b'], off: ['b'] }` |
| `readAppsFile` | `'{"installed":"a","off":3}'` | `{ installed: [], off: [] }` |
| `activeOf` | `{ installed: ['a', 'b', 'c'], off: ['b'] }` | `['a', 'c']` |
| `appsFileText` | `{ installed: ['b', 'a'], off: [] }` | `'{\n  "installed": [\n    "a",\n    "b"\n  ]\n}\n'` |
| `appsFileText` | `{ installed: ['a', 'b'], off: ['b', 'x'] }` | `'{\n  "installed": [\n    "a",\n    "b"\n  ],\n  "off": [\n    "b"\n  ]\n}\n'` |
| `withInstalled` | `{ installed: ['a'], off: [] }`, `'b'`, `true` | `{ installed: ['a', 'b'], off: [] }` |
| `withInstalled` | `{ installed: ['a', 'b'], off: ['b'] }`, `'b'`, `false` | `{ installed: ['a'], off: [] }` |
| `withOff` | `{ installed: ['a', 'b'], off: [] }`, `'b'`, `true` | `{ installed: ['a', 'b'], off: ['b'] }` |
| `withOff` | `{ installed: ['a', 'b'], off: ['b'] }`, `'b'`, `false` | `{ installed: ['a', 'b'], off: [] }` |
| `withOff` | `{ installed: ['a'], off: [] }`, `'x'`, `true` | `{ installed: ['a'], off: [] }` |
| round trip | `appsFileText(readAppsFile(t))` for `t` = the second `appsFileText` result | `t` |
| no mutation | call `withOff` on a frozen state (`Object.freeze` on the object and both arrays) | no throw |

Acceptance check:

```powershell
node --test lib/appsFile.test.mjs; npx prettier --check lib/appsFile.mjs lib/appsFile.test.mjs
```

## T2: wire it in

Do these as separate commits. Update the header comment of every file you touch. Follow `AGENTS.md`.

1. Readers. Add `activeApps(root)` to `lib/apps.mjs` and `activeApps(files)` to `src/apps.ts`. Add `export const
   active` to `site/apps.ts`. Use `readAppsFile` and `activeOf`. Make `installedApps` use `readAppsFile`.
2. Sort the readers. Use the active apps where the code means "running": `site/consent.ts`, `site/pageColors.ts`,
   `theme/components/AppSlot.astro`, `lib/apps.mjs` build hooks (line 102), `src/App.tsx` (notifications, the app's own
   screens), `src/BlockSettings.tsx`, `src/Colors.tsx`, `src/Library.tsx`, `src/menuChildren.ts`, `src/registry.tsx`,
   `src/SideColumn.tsx`, `src/site.ts`. Keep `installedApps` in `src/AppList.tsx`, `src/UpdatesNotice.tsx`,
   `src/checkSite.ts` and `lib/licenses.mjs`. Read each call before you change it. Report each choice.
3. Worker. In `worker/index.js`, filter `appWorkers` with `activeOf(readAppsFile(...))` or the same rule on the
   imported `apps` object. A deactivated app answers 404 and has no `scheduled` run.
4. Writers. Make `appChanges` in `src/store.ts` and the site-local install in `src/AppList.tsx` (near line 876) write
   with `readAppsFile`, `withInstalled` and `appsFileText`. Add tests for `appChanges`: an update keeps `off`; an
   uninstall removes the id from `off`.
5. Switch. In `src/AppSettingsTab.tsx`, add a `SwitchRow` as the first row: label `t.apps.enabled`, texts
   `[t.library.on, t.library.off]`. It saves `withOff` through the same commit path as Uninstall, with the busy state.
   Do not draw `app.page` while the app is off. In `src/AppList.tsx`, the head status of an installed app that is off
   is `t.apps.deactivated`. Add `enabled` ("Enabled", da-DK "Aktiveret") and `deactivated` ("Deactivated", da-DK
   "Deaktiveret") to `src/i18n/en-US/apps.ts` and `src/i18n/da-DK/apps.ts`.
6. Version. In `src/AppList.tsx` `AppContent`, pass `version={versionOf(app) || app.version}` to `AppHead` and to the
   licences part. Update the doc comment of `version` in `src/apps.ts`: a site-local app can set it too.
7. Changeset: `npx changeset`, minor, "Apps can be turned off without uninstalling them; the app page shows the app's
   version."

Acceptance check: `npm run check` passes. `npm run check:screens` passes after `npm run build`.

## Manual check (orchestrator, on the branch's demo Preview)

- Turn an installed app off. Its `AppSlot` output is gone after the build. `/api/<app>/…` answers 404.
- Its page shows "Deactivated" and the switch. Its update is still offered.
- Turn it on again. All comes back.
