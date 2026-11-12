# Foundation B: storage for apps

Date: 2026-11-12. Status: draft for the owner's review. Nothing here is built or decided.

Part of the launch plan "match WordPress without e-commerce". Its twin is `2026-11-12-apps-provide-to-apps-design.md`
(Foundation A). The first user is the Forms feature (submissions). Later users: a basic page-view counter, search
suggestions, comments.

## Goal

An app can keep data that does not belong in Git (visitor answers, counters, logs) in a database on the owner's own
Cloudflare account. The owner sees it in the editor, can delete and export it, and personal data deletes itself.

## What exists today

- The Worker has one D1 database, the binding `CONSENT` (`starter/wrangler.jsonc`), created by `wrangler deploy` the first
  time. The core keeps its own tables in it (consents, MCP sign-in, the store key, image-provider keys). D1 has no
  migrations on deploy, so each file makes its tables with `CREATE TABLE IF NOT EXISTS` and remembers it only after the
  create has finished (`worker/consent.js`, `worker/mcp-store.js`).
- `consent.js` is the pattern for a list of personal data: only someone who can save the site reads or deletes it, rows are
  deleted after a time, the editor lists, deletes and exports as CSV, and without the binding nothing is kept and the editor says so.
- The editor already edits the Worker's settings as text to turn R2 caching on and off (`src/r2Caching.ts`).
- Plugin Worker isolation (`2026-11-11-plugin-worker-isolation.md`) proved that a plugin can be given one scoped binding
  stub and no network.
- Apps are in Git: lists are files (`src/data/<folder>/`). Nothing in the app contract gives an app a database.

## Decisions

| #   | Decision                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | App data goes in a **new D1 binding `APP_DATA`**, not in `CONSENT`. Visitors' answers do not sit beside sealed sign-in tokens, and the whole database can be exported or deleted on its own. The core's tables stay where they are.     |
| 2   | An app **declares its tables as data** in `app.json` (`storage`). It never writes SQL and never names a table of another app. The core makes, changes and reads the tables.                                                           |
| 3   | The app's code gets a small API, not a database handle: `insert`, `get`, `list`, `count`, `update`, `remove`, `removeWhere`. The shape can be handed over as a scoped stub later, as the isolation prototype did.                       |
| 4   | A table has typed columns (`string`, `text`, `number`, `boolean`, `date`, `json`) and the system columns `id` and `at`. Schema changes are **additive only**: a new column is allowed, a removed or retyped one is refused. A version is for ever, and so is the data. |
| 5   | A table that holds personal data says `personal: true`. It must give `retentionDays` (at most 730, the consent log's limit). The core deletes older rows each hour, in the Worker's existing `scheduled`. The owner may shorten it in the app's settings, never lengthen it. |
| 6   | The editor reads a table through the Worker: `GET/DELETE /api/app-data/<app>/<table>`, the same permission as the consent log (`mayEdit`). Lists in the editor can be backed by a table (`source: "storage"` in `lists`). Delete and CSV export are generic. |
| 7   | **Uninstall asks** whether to keep or delete the data. Turning an app off keeps it, like the app's other data.                                                                                                                          |
| 8   | The binding is on **by default in the starter**. An existing site turns it on in the editor, which commits the line to the Worker's settings as text, as R2 caching does. The editor does this when an app that uses `storage` is installed, after asking. |
| 9   | Without the binding (a branch preview, a site that has not turned it on) the API is absent. An app that needs it cannot be turned on, and says why. An app that merely can use it works without it.                                    |
| 10  | A table has a quota (rows and bytes). An insert over the quota fails and is shown as a problem on the app's page (`AppProblems`). The numbers are in the open questions.                                                               |
| 11  | The table list of the site, with what each holds and how long it is kept, is shown under *Privacy* beside the consent log, so the owner can answer "what do you store about visitors".                                                  |
| 12  | `storage` is a key of contract 6, with Foundation A's keys. If A ships first, B adds its key to 6 only while 6 is unreleased; otherwise B is contract 7. The PM decides when the plans are made.                                       |

## User stories

App author

1. As an app author, I declare a table with typed columns in `app.json`, so my app has somewhere to keep data without writing SQL.
2. As an app author, I add a column in a new version and old rows get an empty value, so an update never loses data.
3. As an app author, I call `insert`, `list` and `remove` on my tables only, so my app cannot read another app's data.
4. As an app author, I mark a table personal and set how long rows are kept, so the platform enforces retention for me.

Site owner

5. As a site owner, installing an app that stores data tells me what it keeps and for how long before I confirm.
6. As a site owner on a site without storage, I turn it on from the same dialog, so I never edit a config file.
7. As a site owner, I see what an app stored in a list with the standard screens (search, sort, delete), so I need nothing new.
8. As a site owner, I delete one row, a selection, or everything, so I can answer a visitor who asks to be forgotten.
9. As a site owner, I export a table as CSV, so I can keep or move it.
10. As a site owner, old personal data deletes itself after the days I choose, and I can only make that shorter.
11. As a site owner, uninstalling an app asks whether to keep or delete what it stored, so I decide, not the app.
12. As a site owner, I see under *Privacy* every table that holds personal data and its retention, so I can answer for it.

Visitor

13. As a visitor, nothing about me is stored beyond what the form I filled in says, and it is removed on the date the site states.

## What the owner sees

- The install dialog adds, per table: en "Stores {what} on your site for {days} days." (the app's `label` and `hint` for the table; the Danish text in `da-DK`).
- No storage on the site: en "Your site has no app storage yet. Turn it on to use this app." with the button Turn on. It commits the change and continues the install in the same save.
- A table's list is an ordinary editor list. Its row menu has Delete, its toolbar has Export CSV and bulk delete (`src/bulkDelete.mjs`).
- Uninstall: en "Keep the data this app stored, or delete it?" with Keep and Delete.
- *Privacy* gets a row "Stored visitor data" with the tables, the number of rows and the retention.
- No new component. The standard parts only.

## Design

### The declaration (`lib/appStorage.mjs`, new, pure, tested)

```json
"storage": {
  "tables": {
    "submissions": {
      "label": "Form submissions",
      "hint": "What visitors sent through your forms.",
      "personal": true,
      "retentionDays": 365,
      "columns": {
        "form": "string",
        "values": "json",
        "status": "string",
        "ip": "string"
      },
      "index": ["form", "status"]
    }
  }
}
```

| Rule                                                                                                           |
| -------------------------------------------------------------------------------------------------------------- |
| Table and column names match `^[a-z][a-z0-9_]{0,31}$` and are not `id`, `at` or an SQL keyword.                  |
| At most 8 tables per app, 24 columns per table, 4 indexes per table.                                           |
| `personal: true` requires `retentionDays` between 1 and 730. A table that is not personal may omit it.         |
| `json` and `text` columns are not indexed. `values` is a `json` column: forms vary, so one column holds them.  |
| `diffStorage(before, after)` lists the changes between two versions: added columns and tables are allowed, any other change is a problem the build and the store refuse. |

### The tables (`worker/app-data.js`, new)

- Name in D1: `a_<app id>__<table>`, quoted. Ids are folder names (`app_5c4b6ba067ef127f`, `cookiescanner`), already safe.
- The tables are made lazily, like `consent.js`: `CREATE TABLE IF NOT EXISTS`, then `ALTER TABLE … ADD COLUMN` for a column the declaration has and the table lacks. The isolate remembers it per database only after the statements finished (the `WeakSet` pattern of `mcp-store.js`; never a pending promise in module memory, `scripts/pending-shared.test.mjs`).
- A system table `app_data_tables (app, table, version, rows, bytes)` holds the schema version and the counts the quota and the *Privacy* row need.
- The generated API is the only code that builds SQL. Column names and the table name come from the declaration, values only through bound parameters.

### The API an app's Worker part gets

```js
const t = ctx.storage.table('submissions');
await t.insert({ form: 'contact', values, status: 'new' }); // { id }
await t.list({ where: { status: 'new' }, limit: 50, before: id }); // { rows, next }
await t.get(id);
await t.update(id, { status: 'done' });
await t.remove(id);
await t.removeWhere({ status: 'spam' });
await t.count({ where: { status: 'new' } });
```

`where` takes equality on indexed columns only. `ctx.storage` is `undefined` when the binding is missing (decision 9). The
core's `scheduled` deletes personal rows past `retentionDays` and records the count.

### The editor's route (`/api/app-data/<app>/<table>`)

| Method                  | Does                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `GET ?q&cursor&limit`   | Rows, newest first, with a search over the declared string columns.                          |
| `GET ?format=csv`       | All rows as a file to save.                                                                  |
| `DELETE`                | `{ ids }` deletes rows, `{ all: true }` empties the table.                                   |
| `DELETE /<app>`         | Drops the app's tables (uninstall, "Delete").                                                |

Only someone who can save the site (`mayEdit`) may use any of them. The app is in the path, so one app's request never
names another app's table, and the Worker checks that the app is installed.

### The binding

- `starter/wrangler.jsonc`: `"d1_databases": [{ "binding": "CONSENT" }, { "binding": "APP_DATA" }]`. `wrangler deploy` creates it.
- Existing sites: `src/appStorageSetup.ts`, like `src/r2Caching.ts`, reads and changes that line as text and keeps the comments. It can be turned on only when the Worker says Cloudflare can create the database (`/api/app-data/status`, like `/api/r2`).
- `scripts/check-worker.mjs` expects the binding in the starter.

### Lists backed by a table

`OwnedList` gets `source: "storage"` with `table`, and `columns` to show. The editor's list screen reads the route above
instead of Git files. The list has no create button (rows come from visitors), a Delete row menu, bulk delete and Export CSV.

## Tests

- `lib/appStorage.test.mjs`: names, limits, `personal` and retention, `diffStorage` (added column ok, removed or retyped refused).
- `worker/app-data.test.mjs`: a fake D1: tables made lazily and once, an app cannot name another app's table, values only as parameters, quota, retention deletes only personal rows past their days, CSV, sign-in and `mayEdit` required, the route refuses an app that is not installed.
- `scripts/pending-shared.test.mjs` passes on the new file.
- `src/appStorageSetup.test.mjs`: the line is switched on and off as text and comments survive.
- The first real test is Forms; until then a fixture app with one table.

## Out of scope

- Spam and abuse limits on a public write route (rate limiting, Turnstile): the Forms spec.
- The Forms feature, the receivers, the visitor-side consent text.
- Moving the core's own tables out of `CONSENT`.
- Backups of D1 beyond Cloudflare's own and the CSV export.
- Giving a third-party plugin storage: it follows plugin Worker isolation (the API shape is meant for it).
- Anything outside D1 (R2 files for uploads in forms, KV).

## Open questions

1. **Quota numbers.** I propose 50 000 rows and 256 KB per row for each table, and 1 000 000 rows in the whole database, all below D1's limits. Right?
2. **Retention default.** 365 days for personal tables unless the app says otherwise, with 730 as the ceiling. Right?
3. **Binding name.** `APP_DATA` is mine. Any reason to keep one database and prefix tables in `CONSENT` instead? It would need no change for existing sites, but personal data would sit beside sealed tokens.
4. **Existing sites.** Turning storage on commits a change to the site's Worker settings. Is that acceptable for sites the owner does not run, or does it need the owner's confirmation inside the editor (my design: it asks)?
5. **Free plan.** D1 is on the Free plan, with limits on daily writes. Forms on a busy site may hit them. Should the editor warn?

## Batches

1. The rule: `lib/appStorage.mjs`, manifest key, tests, `docs/app-contract.md`.
2. The Worker: `worker/app-data.js`, the API, the route, retention, `check-worker`, tests.
3. The binding: starter, `appStorageSetup.ts`, the status route.
4. The editor: the install dialog, lists backed by a table, uninstall, *Privacy* row, texts in both languages.

The changeset level depends on the branch the work goes into (`CLAUDE.md`, "Merging").
