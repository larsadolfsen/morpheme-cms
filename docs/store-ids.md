# Where a site stores an item id

This file lists where a site repo keeps an app or theme id, and which checks in this repo reject a permanent id.
The legacy move in `src/store.ts` uses it to find every value to rewrite when an old id (for example `mailchimp`) becomes a permanent id (`app_` or `theme_` plus 16 lowercase hex characters).
Paths are relative to the repo root. Line numbers were checked on branch `task/si-1.1-inventory`.

## Table 1: Stored values that name an item

| File pattern in a site | Field | Example | Legacy move rewrites it? | Read by (file:line in this repo) |
| --- | --- | --- | --- | --- |
| `src/data/apps.json` | `installed` (array of ids) | `["mailchimp"]` becomes `["app_5c4b6ba067ef127f"]` | yes: the id in the list changes | `site/apps.ts:8`; `lib/apps.mjs:34`; `worker/index.js:55`; `site/siteCsp.mjs:28`; `defaults/sitedata.ts:112`; written by `src/store.ts:463` and `src/AppList.tsx:1024` |
| `src/apps/<id>/` (folder) | folder name | `src/apps/mailchimp/` becomes `src/apps/app_5c4b6ba067ef127f/` | yes: the folder moves | `lib/apps.mjs:23-29`; `lib/apps.mjs:45`; `site/theme.mjs:533`; `site/siteCsp.mjs:17`; `site/appCookies.mjs:67`; `src/store.ts:192` (`appFolder`) |
| `src/data/apps/<id>.json` | file name (the app's settings) | `src/data/apps/mailchimp.json` becomes `src/data/apps/app_5c4b6ba067ef127f.json` | yes: the file is renamed, its content kept | `site/apps.ts:11-15`; `src/apps.ts:259` (`settingsFile`); `defaults/sitedata.ts:109-110` |
| `worker/apps.js` (generated, in each site) | import names and keys of `appWorkers` and `appTexts` | `import mailchimp from '../src/apps/mailchimp/worker.js';` | yes: regenerate it with `npx morpheme app-workers`; do not edit it by hand | `lib/apps.mjs:44-60`; `scripts/app-workers.mjs` |
| `src/themes/<id>/` (folder) | folder name | `src/themes/venus/` becomes `src/themes/theme_fa395ad84690acbd/` | yes: the folder moves | `site/theme.mjs:55-60` (`installedThemes`); `site/theme.mjs:35`; `site/icons.mjs:30-33`; `src/store.ts:194` (`themeFolder`); `lib/licenses.mjs:464` |
| `src/data/theme.json` | `theme` | `{ "theme": "venus" }` becomes `{ "theme": "theme_fa395ad84690acbd" }` | yes: the value changes | `site/theme.mjs:457-459` (`activeTheme`); `src/ThemeStore.tsx:84`; written by `src/Library.tsx:451` |
| `src/data/icons.json` | `pack`, as `<theme>/<pack>` | `{ "pack": "venus/<pack>" }` becomes `{ "pack": "theme_fa395ad84690acbd/<pack>" }` | yes: the theme id before the `/` changes; a system pack (no `/`) stays | `site/iconPacks.mjs:37-42` (`packInUse`); `site/theme.mjs:127-133`; `src/ThemeStore.tsx:95`; written by `src/Library.tsx:315` |
| `src/data/block-settings.json` | `off` (array of block types and of kinds) | `"popups/mailchimp"` becomes `"popups/app_5c4b6ba067ef127f"` | yes, for kinds: the part after `/` is the app id. Block types with no app id stay | `src/registry.tsx:75`; `src/BlockSettings.tsx:138` (`kindKey`); `src/apps.ts:246`; read and written by `src/BlockSettings.tsx:164` and `:171` |
| `src/data/popups/*.json` | `type` (an app's kind of pop-up) | `"type": "mailchimp"` becomes `"type": "app_5c4b6ba067ef127f"` | yes: the value is the app id | `site/popups.ts:15`; `site/popups.ts:64`; `src/apps.ts:246` (a kind's option value is compared with the app id) |
| `src/data/cookie-list/*.json` | `app` (the app that added the cookie) | `"app": "mailchimp"` becomes `"app": "app_5c4b6ba067ef127f"` | yes: the value is the app id; cookie names stay | `src/cookieList.ts:50` (`cookieChanges`); `src/standard/cookies/list.ts:22`; written by `src/cookieList.ts:65` |
| `src/data/side.json` | `block` (a block type) | `{ "block": "<block type>" }` | no: block types carry no app id. The app id comes from the folder at build time (`src/registry.tsx:65`) | `site/side.ts:3`; `src/SideColumn.tsx:32` |
| `src/apps/<id>/store.json`, `src/themes/<id>/store.json` | `version`, `ref`, `files` | no id inside | no: the note holds no id, and it moves with its folder | `lib/storeEntries.mjs:25` (`RECORD`); `src/store.ts:181` (`StoreRecord`) |
| `src/movedRoutes.mjs` (CMS code, not a site file) | old routes such as `promovering/calendly` | `'promovering/calendly': 'apps/calendly'` | no: CMS code, not site data. It maps old bookmarks; after the move each target must use the new id, a decision for the owner | `src/movedRoutes.mjs:21-22`; `src/App.tsx` (routeOf) |

Not in a site repo, so the move does not touch them:

- The editor's notification choices and kept notifications (`src/notificationData.ts:25`, `:14-16`): kept in the browser's `localStorage`, keyed by `<app>/<type>`.
- Licence owner ids such as `app/<id>` and `tema/<id>` (`lib/licenses.mjs:241`, `:415`, `:462-468`): built at build time, not stored.

## Table 2: Checks that reject a permanent id

| File:line | Check (the regex or code) | What it guards | Rejects app_/theme_ ids? (yes/no and why) |
| --- | --- | --- | --- |
| `lib/storeEntries.mjs:19` | `ITEM_ID = /^[a-z0-9][a-z0-9-]*$/` | The id of a catalog app or theme, in `validApp` (line 37) and `validTheme` (line 56) | yes: `_` is not in `[a-z0-9-]`, so `app_5c4b6ba067ef127f` and `theme_fa395ad84690acbd` fail at the `_`. The store's catalog would drop them |
| `lib/storeEntries.mjs:21` | `REFUSED_APPS = ['butik', 'udvikler']` | App ids that would clash with the store's address `apps/butik` and a developer's page `apps/udvikler` (`validApp`, line 38) | no: it lists two names; permanent ids are not in it |
| `lib/storeEntries.mjs:57` | `x.id !== STANDARD` (`STANDARD = 'saturn'`, line 23) | A theme may not take the standard theme's id (`validTheme`) | no: it refuses only `saturn` |
| `lib/storeEntries.mjs:17` | `isPath`: each part of a file path is not empty, `.` or `..` | File paths in the store catalog (`isGoodFile`, line 28) | no: `app_...` and `theme_...` are plain text parts |
| `site/theme.mjs:458` | `activeTheme`: `!/^[a-z0-9-]+$/.test(theme)` | The theme named in `src/data/theme.json`; it throws "not installed" when the check fails | yes: a `theme_` id fails at the `_`, so the build stops with an error for a site on a permanent theme id |
| `site/theme.mjs:59` | `existsSync(src/themes/<name>/theme.json)` (no regex) | A folder counts as an installed theme (`installedThemes`) | no: it accepts any folder name that has a `theme.json` |
| `lib/apps.mjs:48` | `key`: `/^[A-Za-z_$][\w$]*$/` (JS identifier) | Whether an app id is written bare or quoted in `worker/apps.js` | no: `_` is allowed, so `app_...` is written bare as a valid identifier |
| `worker/index.js:81` | `/^\/api\/([\w-]+)(?:\/|$)/` | The first segment of an app's Worker address `/api/<app id>/` | no: `\w` includes `_`, so `app_...` is accepted |
| `worker/push.js:214` | `isRoute`: a regex of word characters, `-`, `/` and the Danish letters, 1 to 200 long | A notification's `to` route, such as `apps/<id>` | no: `\w` includes `_` |
| `src/App.tsx:770` | `/^apps\/[^/]+$/` | The app page route `apps/<id>` | no: any text without `/` is accepted |
| `src/App.tsx:748` | `/^udseende\/temaer\/[^/]+$/` | The store's theme page route `udseende/temaer/<theme id>` | no: any text without `/` is accepted |
| `lib/appRoute.mjs:17` | `parts[1] !== id` (no regex) | Whether a route is the page of app `id` (`appRouteOf`) | no: string equality |
| `src/apps.ts:256` | `appIdOf`: `path.split('/apps/')[1].split('/')[0]` (no regex) | Reads an app id from a file path under `apps/` | no: it splits text and does not check the id |

Checks not listed, because they test icon names, not item ids: `site/icons.mjs:517` (`/^[a-z0-9-]+$/`), `site/theme.mjs:244`, `lib/materialIcon.mjs:9`, and `worker/r2-status.js:18` (R2 bucket names).
