# Storage for apps (0.23, spec 2)

> **Status:** draft, revised to the owner's decisions of 15 November 2026 and spec 1 (a planning session: nothing is
> built). Release plan and decisions: `docs/superpowers/plans/2026-11-15-app-platform-0-23.md` (cited as **D1** to
> **D35**). It builds on spec 1, `2026-11-15-app-worker-sandbox-design.md`. Its twin is spec 3,
> `2026-11-12-apps-provide-to-apps-design.md`. A claim about Cloudflare that is not yet proven on this account is marked
> **verify**.

The first user is Forms (spec 4, a core feature, D6): its answers. Later users: a page-view counter, search suggestions,
comments.

## Goal

An app, or a core feature, can keep data that does not belong in Git (visitor answers, counters, logs) in a database on
the owner's own Cloudflare account. The owner sees it in the editor, can delete and export it, and personal data deletes
itself.

## What exists today

- The Worker has one D1 database, the binding `CONSENT` (`starter/wrangler.jsonc`), created by `wrangler deploy` the first
  time from a binding without an id. The core keeps its own tables in it (consents, MCP sign-in, the store key,
  image-provider keys, and spec 1's `app_failures`). D1 has no migrations on deploy, so each file makes its tables with
  `CREATE TABLE IF NOT EXISTS` and remembers it only after the create has finished (`worker/consent.js`,
  `worker/mcp-store.js`).
- `consent.js` is the pattern for a list of personal data: only someone who can save the site reads or deletes it, rows are
  deleted after a time, the editor lists, deletes and exports as CSV, and without the binding nothing is kept and the editor
  says so.
- The Worker takes new CMS versions by itself (`worker/cms-update.js`): it commits the new version in `package.json`, and
  undoes a version that did not build.
- Spec 1 runs a store app's server code in a sandbox and hands it scoped stubs; `tools.storage` is one of them, given only
  when `app.json` asks. A site's own apps run unsandboxed (D16).
- Apps are in Git: lists are files (`src/data/<folder>/`). Nothing in the app contract gives an app a database.

## Decisions

| #   | Decision |
| --- | -------- |
| 1   | App and core data go in **their own D1 database, `APP_DATA`**, not in `CONSENT` (**D7**). Visitors' answers never sit beside sealed sign-in tokens. The core's existing tables stay in `CONSENT`. |
| 2   | An app **declares its tables as data** in `app.json` (`storage`, contract 7, **D5**). It never writes SQL and never names a table of another app. The core makes, changes and reads the tables. |
| 3   | Code gets a small API, not a database handle: `insert`, `get`, `list`, `count`, `update`, `remove`, `removeWhere`. A store app reaches it as the scoped stub **`tools.storage`** (spec 1); a site's own app gets the same API built directly over `APP_DATA` (D16); the core uses the same layer for its own tables. One layer, one set of tests. |
| 4   | A table has typed columns (`string`, `text`, `number`, `boolean`, `date`, `json`, `email`) and the system columns `id` and `at`. Schema changes are **additive only**: a new column is allowed, a removed or retyped one is refused. A version is for ever, and so is the data. |
| 5   | A table that holds personal data says so with `personal` (below). Rows are kept **365 days by default, at most 730** (**D9**). The core deletes older rows each hour, in the Worker's existing `scheduled`. The owner can only shorten it, never lengthen it. |
| 6   | **Quotas** (**D9**): 50 000 rows and 256 KB per row in each table, 1 000 000 rows in the whole of `APP_DATA`. A write over a quota is refused. |
| 7   | **A refused write is a problem, not a crash.** Over a quota, or refused by D1 (the Free plan's daily write limit, the database's size): the call fails with a reason, and the problem shows on the app's page (`AppProblems`), or on the core feature's screen (the Forms screen). No warning ahead of time (**D9**). |
| 8   | A refused write **counts towards spec 1's escalation only when the app's own code made it** (kind `storage`, D21, D34). A refusal of a core write (a form's answer) never pauses an app. |
| 9   | **Every site has `APP_DATA` from the 0.23 update** (**D29**, replacing the old per-app ask, D8). The starter has the binding; the update adds it to an existing site's Worker settings. No `src/appStorageSetup.ts`, no ask at install. |
| 10  | Without the binding (a branch Preview, a deploy where Cloudflare could not create it) the API is absent. An app that needs it cannot be turned on and says why; Forms says so on its screen. |
| 11  | **Personal data is found by address.** A personal table names the `email` columns that say who a row is about. The layer keeps an index of those addresses, so the owner deletes everything about one address in one step (**D33**). |
| 12  | **AI assistants never read app data that is personal** (**D30**, generalised). The site's MCP server (`worker/mcp.js`, `lib/mcpTools.mjs`) is never given `APP_DATA` or the layer; in 0.23 it reads no table at all. |
| 13  | The editor reads an app's table through the Worker: `GET/DELETE /api/app-data/<app>/<table>`, permission `mayEdit`. Lists in the editor can be backed by a table (`source: "storage"` in `lists`). Delete and CSV export are generic. |
| 14  | **Uninstall asks** whether to keep or delete the data. Turning an app off, or its server part pausing (D17, D27, D34), keeps it, like the app's other data. |
| 15  | The site's personal tables, with what each holds and how long it is kept, are shown under _Privacy_ beside the consent log, so the owner can answer "what do you store about visitors". |

## User stories

App author

1. As an app author, I declare a table with typed columns in `app.json`, so my app has somewhere to keep data without writing SQL.
2. As an app author, I add a column in a new version and old rows get an empty value, so an update never loses data.
3. As an app author, I call `tools.storage` on my tables only, sandboxed or not, so my app cannot read another app's data.
4. As an app author, I mark a table personal and name its address column, so the platform keeps retention and erasure for me.

Site owner

5. As a site owner, my site has app storage after the 0.23 update, and the update said so before it was applied.
6. As a site owner, installing an app that stores data tells me what it keeps and for how long before I confirm.
7. As a site owner, I see what an app stored in a list with the standard screens (search, sort, delete), so I need nothing new.
8. As a site owner, I delete one row, a selection, or everything.
9. As a site owner, I enter a visitor's address and delete everything the site holds about it, in one step.
10. As a site owner, I export a table as CSV, so I can keep or move it.
11. As a site owner, old personal data deletes itself after the days I choose, and I can only make that shorter.
12. As a site owner, a write the database refused shows on the app's page with what to do, not as a silent loss.
13. As a site owner, uninstalling an app asks whether to keep or delete what it stored, so I decide, not the app.
14. As a site owner, I see under _Privacy_ every table that holds personal data and its retention, so I can answer for it.

Visitor

15. As a visitor, nothing about me is stored beyond what I sent, an AI assistant never reads it, and it is removed on the date the site states or when I ask.

## What the owner sees

- The 0.23 update's notes to come (`UpdatesNotice.tsx`) carry a fixed line: en "This update adds a database for form answers and app data to your site's Cloudflare settings." (the Danish text in `da-DK`).
- The install dialog adds, per table: en "Stores {what} on your site for {days} days." (the table's `label` and `hint`).
- A table's list is an ordinary editor list. Its row menu has Delete, its toolbar has Export CSV and bulk delete (`src/bulkDelete.mjs`).
- A refused write on the app's page: en "{table} is full. Delete old rows to keep storing." or en "Cloudflare refused a write today. It works again after midnight UTC, or with the Workers Paid plan."
- Uninstall: en "Keep the data this app stored, or delete it?" with Keep and Delete.
- _Privacy_ gets a row "Stored visitor data" with the tables, their rows and retention, and the action _Delete by email address_ (the same as on the Forms screen, D33).
- No new component. The standard parts only.

## Design

### The declaration (`lib/appStorage.mjs`, new, pure, tested)

```json
"storage": {
  "tables": {
    "signups": {
      "label": "Sign-ups",
      "hint": "Who signed up for an event.",
      "personal": ["email"],
      "retentionDays": 180,
      "columns": { "event": "string", "email": "email", "name": "string", "values": "json" },
      "index": ["event"]
    }
  }
}
```

| Rule |
| ---- |
| Table and column names match `^[a-z][a-z0-9_]{0,31}$` and are not `id`, `at` or an SQL keyword. |
| At most 8 tables per app, 24 columns per table, 4 indexes per table. |
| `personal` is absent (not personal) or a list of the table's `email` columns that say who a row is about. `[]` is allowed for personal data with no address (an IP log): it is kept and deleted by retention, but erasure by address cannot reach it, and the install dialog says so. |
| `retentionDays` is between 1 and 730; a personal table without it keeps rows 365 days. A table that is not personal may omit it and keeps rows until deleted. |
| An `email` column holds one address or a list of up to 8; the layer trims and lowercases them on write and refuses one without `@`. It is not in `index`: the address index (below) finds it. |
| `json` and `text` columns are not indexed. `values` as `json`: forms vary, so one column holds them. |
| `storage` requires a `worker.js`: only server code writes. For a store app that means Workers Paid (D1); its tables stay readable in the editor while its server part is paused. |
| `diffStorage(before, after)` lists the changes between two versions: added columns and tables are allowed, any other change is a problem the build and the store refuse. |

`storageProblems(storage)` returns one English sentence per problem; `manifestProblems` calls it for `storage` in
contract 7 (`KEYS_7`, with spec 1's `worker` and spec 3's `provides` / `uses` / `needs`). Contracts before 7 refuse the key.

### The tables (`worker/app-data.js`, new)

- Name in D1: `a_<app id>__<table>` for an app, `c_<feature>__<table>` for the core (Forms: `c_forms__answers`), always
  quoted. App ids are folder names (`app_5c4b6ba067ef127f`, `cookiescanner`); the two prefixes never meet.
- The core declares its tables in the same format, in code (`lib/coreTables.mjs`), checked by the same `storageProblems`.
  Core tables have the same quotas, retention and erasure; they never appear in an app's route.
- The tables are made lazily, like `consent.js`: `CREATE TABLE IF NOT EXISTS`, then `ALTER TABLE … ADD COLUMN` for a column
  the declaration has and the table lacks. The isolate remembers it per database only after the statements finished
  (the `WeakSet` pattern of `mcp-store.js`; never a pending promise in module memory, `scripts/pending-shared.test.mjs`).
- A system table `data_tables (owner, tbl, version, rows, bytes)` holds the schema version and the counts the quotas and
  the _Privacy_ row need (`owner` is `a:<app>` or `c:<feature>`).
- **The address index** `data_people (email, tbl, row, PRIMARY KEY (email, tbl, row))`: each write to a personal table
  writes the addresses of its `personal` columns here in the same `batch`, and each delete (by the owner, by retention,
  by uninstall) removes them in the same `batch`. No full scan is ever needed to erase.
- The layer is the only code that builds SQL. Column and table names come from the declaration, values only through bound
  parameters.

### The API

```js
const t = tools.storage.table('signups');
await t.insert({ event: 'open-day', email: 'a@example.com', values }); // { id }
await t.list({ where: { event: 'open-day' }, limit: 50, before: id }); // { rows, next }
await t.get(id);
await t.update(id, { name: 'Ann' });
await t.remove(id);
await t.removeWhere({ event: 'cancelled' });
await t.count({ where: { event: 'open-day' } });
```

- `storageFor(env, owner)` builds it over `env.APP_DATA` for one owner (`{ app }` or `{ core: 'forms' }`). Own apps get
  it as `tools.storage` from `worker/index.js`; the core calls it directly.
- **A store app** gets it through spec 1's stub `AppStorage`, a `WorkerEntrypoint` of the site's Worker
  (`ctx.exports.AppStorage({ props: { app } })`), only when its `app.json` has `storage`. The shim builds
  `tools.storage.table(name)` over the stub, so the app's code is the same sandboxed or not. The app cannot set `props`, so
  it cannot name another app's table; the stub serves only the tables its declaration lists.
- `where` takes equality on indexed columns only. `tools.storage` is `undefined` when the binding is missing (decision 10).
- **A refused call** rejects with `StorageError { reason }`: `quota`, `schema` (unknown column, wrong type),
  `d1-limit` (the Free plan's daily writes), `d1-size` (the database is full), `unavailable`. The layer records it for
  the owner (decision 7). When the caller is an app's code, the stub also reports it to spec 1's `app_failures` as kind
  `storage`, so it follows the spell rules (15 minutes, 3 failures, D34). A core caller reports to its own screen.
- **Erasure** `eraseByEmail(env, address)` (core only, never on `tools.storage`): finds the rows in `data_people`,
  deletes them from every personal table, app and core, in batches, and returns the count per table. The Forms screen
  and _Privacy_ call it through `POST /api/app-data/erase` (`mayEdit`); the editor shows the counts first and deletes
  after the owner's yes.
- The core's `scheduled` deletes personal rows past their days, with their index rows, and records the count.

### The editor's route (`/api/app-data/<app>/<table>`)

| Method                | Does |
| --------------------- | ---- |
| `GET ?q&cursor&limit` | Rows, newest first, with a search over the declared string columns. |
| `GET ?format=csv`     | All rows as a file to save. |
| `DELETE`              | `{ ids }` deletes rows, `{ all: true }` empties the table. |
| `DELETE /<app>`       | Drops the app's tables and their index rows (uninstall, "Delete"). |
| `POST /erase`         | `{ email, dryRun }`: the counts per table, then the erasure (decision 11). |

Only someone who can save the site (`mayEdit`) may use any of them. The app is in the path, so one app's request never
names another app's table, and the Worker checks that the app is installed. Core tables have their own routes (the
Forms screen, spec 4) over the same layer.

### The binding (D29)

- `starter/wrangler.jsonc`: `"d1_databases": [{ "binding": "CONSENT" }, { "binding": "APP_DATA" }]`. `wrangler deploy`
  creates it from a binding without an id (automatic provisioning, Wrangler 4.45 and later; the starter has 4.160 and
  already relies on it for `CONSENT`, `NOT_FOUND` and `PUSH`).
- **Existing sites:** the 0.23 version carries a site change, applied by the Worker's update (`worker/cms-update.js`) in
  the same commit as `package.json`: a pure text edit (`lib/wranglerEdit.mjs`, the approach of `src/r2Caching.ts`) adds
  `APP_DATA` to `d1_databases` and keeps the comments. If the file cannot be edited safely, the update stops and says so
  on the update notice. A deploy that fails is undone by the update's existing watch.
- **verify** on `morpheme-staging`: Cloudflare's docs say a deploy from Git (Workers Builds) creates a resource for a
  binding without an id, and that later deploys keep it linked. Not yet seen here: that a binding **added** to a Worker
  that is already deployed is created on the next build, and that the build's token may create a D1 database. The
  update must not ship before both are seen.
- `scripts/check-worker.mjs` expects the binding in the starter.

### Lists backed by a table

`OwnedList` gets `source: "storage"` with `table`, and `columns` to show. The editor's list screen reads the route above
instead of Git files. The list has no create button (rows come from visitors), a Delete row menu, bulk delete and Export CSV.

## Tests

- `lib/appStorage.test.mjs`: names, limits, `personal` (only `email` columns, `[]`), retention default and ceiling, `email` lists, `storage` without `worker.js`, `diffStorage`.
- `worker/app-data.test.mjs` with a fake D1: tables made lazily and once, the two prefixes, an app cannot name another app's table, values only as parameters, quotas, each `StorageError` reason, the address index kept in step on insert, update, delete, retention and uninstall, erasure across app and core tables, CSV, `mayEdit` required, an app that is not installed refused.
- `worker/sandbox.test.mjs` (spec 1's fake): `tools.storage` given only with `storage`; a refusal from app code is kind `storage`, from the core it is not.
- `worker/mcp.test.mjs`: the MCP tools have no path to `APP_DATA`.
- `lib/wranglerEdit.test.mjs`: the binding is added as text, comments survive, a file it cannot read safely is refused.
- `scripts/pending-shared.test.mjs` passes on the new file.
- The first real user is Forms (spec 4); until then a fixture app with one table, own and store.

## Out of scope

- The Forms feature, its spam limits (Turnstile, rate limits, D11), its receivers and the visitor's consent text (spec 4).
- Moving the core's own tables out of `CONSENT`.
- Backups of D1 beyond Cloudflare's own (Time Travel) and the CSV export.
- An MCP tool that reads a table that is not personal (a counter): a later version.
- Anything outside D1 (R2 files for uploads in forms, D18; KV, spec 1's `env.KV`).

## Open questions

None. Answered by the owner on 15 November 2026 (release plan D40 to D42):

1. **Erasure** covers all personal data: every table that marks an `email` column as personal, apps' tables too. The
   owner sees the counts per table before deleting (D40).
2. **Size:** no cap of our own; a refused write for size is a problem, as above. The owner is warned in good time: at
   80 % and at 95 % of D1's database size limit (500 MB on the Free plan), a notification and a line on the Forms
   screen and the apps' pages with what each app uses and the advice to upgrade to Workers Paid (10 GB) or delete old
   data (D41). **Verify** the current D1 limits per plan.
3. **A database more:** `APP_DATA` makes two D1 databases per site. Cloudflare's Free plan allows 10 per account, so a
   Free account holds five sites; the release note says so.
4. **The 0.23 update applies automatically**, as every CMS update; its release note says what it changes in the
   Worker's settings, and the update is undone if the build fails (D42).

## Batches

Spec 1's batch 1 (contract 7 in `appManifest`) comes first; spec 1's batch 2 (the stubs) before batch 3 here.

1. The rule: `lib/appStorage.mjs`, `lib/coreTables.mjs`, the `storage` key in contract 7, tests, `docs/app-contract.md`.
2. The binding: the staging **verify**, the starter, `lib/wranglerEdit.mjs`, the update's site change and its notice.
3. The Worker: `worker/app-data.js`, the layer, the address index, erasure, retention, the route, `tools.storage` for own
   apps and the `AppStorage` stub for store apps, the `storage` failure kind, `check-worker`, tests.
4. The editor: the install dialog, lists backed by a table, refused-write problems, uninstall, _Privacy_ row and erasure,
   texts in both languages. Forms (spec 4) builds on 1 to 3.

The changeset level depends on the base branch (skill `changesets`).
