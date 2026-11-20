# App page: Enabled switch and the app's version

Date: 2026-11-07. Status: approved by the owner in chat.

## Goal

The owner can deactivate an installed app without uninstalling it. A deactivated app keeps its folder, settings and
version, does nothing on the site or in the editor, and still gets store updates. The app page head shows the app's
version for every app that has one.

## Data model

`src/data/apps.json` (`config.apps.installed`) gets one optional list, `off`, with the same name as in the block
settings file:

```json
{ "installed": ["cms-version", "content-colors"], "off": ["content-colors"] }
```

| Rule | Detail |
|---|---|
| `off` is a subset of `installed` | A reader ignores an id in `off` that is not in `installed`. |
| No `off` key when it is empty | Files without deactivated apps stay byte-identical to today's files. |
| Both lists sorted, no duplicates | As `installed` is today. |
| Uninstall removes the id from both lists | Install again gives an active app. |
| The active apps | `installed` minus `off`. |

## Behaviour of a deactivated app

- Like an uninstalled app, for the site and the editor:
  - The build does not draw it in `AppSlot.astro` and does not run its build hooks or `build.mjs`.
  - `site/consent.ts` and `site/pageColors.ts` ignore it.
  - The editor does not offer its blocks, lists, kinds or list tabs for new content.
  - Content already made with it stays, as after an uninstall.
- Sandboxed:
  - The Worker answers 404 on `/api/<app>/…` and does not run its `scheduled` job.
  - The editor does not draw its own screens (`#apps/<id>/<key>`) or its `page` part.
  - It sends no notifications.
- Still updates: the editor finds, shows and applies its store updates as for an active app.
- Its app page stays: head, Settings tab (switch, settings form, Uninstall) and Information tab.

## UI

- Settings tab, first row: `SwitchRow` (`src/ui`) with the label "Enabled" (Danish label: Aktiveret) and the texts
  On / Off (`t.library.on`, `t.library.off`). A change saves at once, in one commit, as Uninstall does.
- The head status of a deactivated app is "Deactivated" (Danish label: Deaktiveret).
- The head shows the app's version: the store record's version, else `version` in the app's definition. No version,
  no line.

## Code

- New `lib/appsFile.mjs`: the pure functions that read and write `apps.json`. Every reader and writer uses it.
- `installedApps` stays for the places that mean "installed": the app list and its status, install, uninstall, store
  updates, `UpdatesNotice.tsx`, licences, `checkSite.ts`.
- New `activeApps` (in `lib/apps.mjs` and `src/apps.ts`) and `active` (in `site/apps.ts`) for the places that mean
  "running". `worker/index.js` filters `appWorkers` with the active apps.
- The two writers of `apps.json` (`appChanges` in `src/store.ts`, the site-local install in `src/AppList.tsx`) use
  `appsFileText`, so they keep `off`.

## Tests

- `lib/appsFile.test.mjs` (`node --test`) covers the functions of `lib/appsFile.mjs`. The plan lists the cases.
- Check by hand on the branch's demo Preview: turn an app off, see that its slot and its `/api/<app>/…` go away, see
  that an update is still offered, turn it on again.
