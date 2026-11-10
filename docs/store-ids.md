# Where a site stores an item id

This file lists where a site repo keeps an app or theme id, and which checks in this repo reject a permanent id.
The editor does not move old ids. When a site changes an old id (for example `mailchimp`) to a permanent id (`app_` or `theme_` plus 16 lowercase hex characters), the owner renames every value in the table by hand.
Paths are relative to the repo root. Line numbers were checked on branch `task/si-1.1-inventory`.

## Table 1: Stored values that name an item

| File pattern in a site | Field | Example | Renamed by hand when a site moved? | Read by (file:line in this repo) |
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
| `src/movedRoutes.mjs` (CMS code, not a site file) | old routes such as `promovering/calendly`; also the old store address `apps/butik` and its themes page `apps/butik/temaer` | `'promovering/calendly': 'apps/app_a030dfba69793996'` | no: CMS code, not site data. It maps old bookmarks to the current routes, and the targets already use the permanent ids | `src/movedRoutes.mjs` (`MOVED`, `RENAMED`); `src/App.tsx` (`routeOf`) <!-- language-ok: the old addresses are the keys --> |

Not in a site repo, so the move does not touch them:

- The editor's notification choices and kept notifications (`src/notificationData.ts:25`, `:14-16`): kept in the browser's `localStorage`, keyed by `<app>/<type>`.
- Licence owner ids such as `app/<id>` and `theme/<id>` (`ownerId` in `lib/licenses.mjs`): built at build time, not stored.

## Table 2: Checks that reject a permanent id

| File:line | Check (the regex or code) | What it guards | Rejects app_/theme_ ids? (yes/no and why) |
| --- | --- | --- | --- |
| `lib/storeEntries.mjs` (`ITEM_ID`, `hasId`) | `ITEM_ID = /^(app|theme)_[0-9a-f]{16}$/`, and the id starts with the item's own kind | The id of a catalog app or theme, in `validApp` and `validTheme` | no: this is the permanent id. It refuses every other id, so an old id such as `mailchimp`, a name such as `store` or `developer`, and an app id used as a theme id all fail. There is no list of refused names: a name cannot clash with the store's address `settings/appstore` or a developer's page, because it is not `app_<hex>` |
| `lib/storeEntries.mjs` (`strayStoreId`) | `/^(app|theme)_/` and not a valid id of that kind | A site's own folder under `src/apps/` or `src/themes/` that looks like a store id but is not one | no: a valid permanent id passes |
| `lib/storeEntries.mjs:17` | `isPath`: each part of a file path is not empty, `.` or `..` | File paths in the store catalog (`isGoodFile`, line 28) | no: `app_...` and `theme_...` are plain text parts |
| `site/theme.mjs` (`activeTheme`) | `/^([a-z0-9-]+|theme_[0-9a-f]{16})$/` | The theme named in `src/data/theme.json`; it throws "not installed" when the check or the folder fails | no: a name such as `venus` or a permanent `theme_` id passes |
| `site/theme.mjs:59` | `existsSync(src/themes/<name>/theme.json)` (no regex) | A folder counts as an installed theme (`installedThemes`) | no: it accepts any folder name that has a `theme.json` |
| `lib/apps.mjs:48` | `key`: `/^[A-Za-z_$][\w$]*$/` (JS identifier) | Whether an app id is written bare or quoted in `worker/apps.js` | no: `_` is allowed, so `app_...` is written bare as a valid identifier |
| `worker/index.js:81` | `/^\/api\/([\w-]+)(?:\/|$)/` | The first segment of an app's Worker address `/api/<app id>/` | no: `\w` includes `_`, so `app_...` is accepted |
| `worker/push.js:214` | `isRoute`: a regex of word characters, `-`, `/` and the Danish letters, 1 to 200 long | A notification's `to` route, such as `apps/<id>` | no: `\w` includes `_` |
| `src/App.tsx` (`/^apps\/[^/]+$/`) | `/^apps\/[^/]+$/` | The app page route `apps/<id>` | no: any text without `/` is accepted |
| `src/App.tsx` (`/^appearance\/themes\/[^/]+$/`) | `/^appearance\/themes\/[^/]+$/` | The store's theme page route `appearance/themes/<theme id>` | no: any text without `/` is accepted |
| `lib/appRoute.mjs:17` | `parts[1] !== id` (no regex) | Whether a route is the page of app `id` (`appRouteOf`) | no: string equality |
| `src/apps.ts:256` | `appIdOf`: `path.split('/apps/')[1].split('/')[0]` (no regex) | Reads an app id from a file path under `apps/` | no: it splits text and does not check the id |

Checks not listed, because they test icon names, not item ids: `site/icons.mjs:517` (`/^[a-z0-9-]+$/`), `site/theme.mjs:244`, `lib/materialIcon.mjs:9`, and `worker/r2-status.js:18` (R2 bucket names).
