# App Worker sandbox (0.23, spec 1)

> **Status:** design for the owner's review, 15 November 2026 (a planning session: nothing is built). Release plan and
> the owner's decisions: `docs/superpowers/plans/2026-11-15-app-platform-0-23.md` (decisions are cited as **D1** to
> **D35**). Prototype it builds on: `2026-11-11-plugin-worker-isolation.md`. Each claim about Cloudflare that is not in
> the prototype is marked **verify** and is checked on `morpheme-staging` before its batch is built.

## Goal

A store app's server code (`worker.js`) runs in a sandbox the CMS controls: it reaches only the hosts its `app.json`
lists, only the site's services the CMS hands it, scoped to the app, and within CPU and request limits. A failure is
shown, escalated and, if nobody acts, paused, without the site losing a basic function.

## What exists today

- `worker/index.js` imports every app's `worker.js` through the generated `worker/apps.js` (`appWorkers`, written by
  `npx morpheme app-workers`, `lib/apps.mjs`) and calls `fetch(request, env, ctx, tools)` at `/api/<app>/…` and
  `scheduled` each hour. The app gets the Worker's whole `env` and `tools` (`mayEdit`, `json`, `github.read/commit`,
  `mcp.call`, `notify`). `lib/appPlaces.mjs` marks this place `full`.
- Only Cookiescanner has a `worker.js` (`morpheme-apps/apps/cookiescanner/worker.js`). It uses `env.COOKIE_SCAN` (its
  own KV namespace), `env.BROWSER` (Browser Rendering), `env.ASSETS` (its file in `dist/_apps/cookiescanner/`),
  `env.PUBLIC_HOST` and `env.EDITOR_HOST`, imports `../../site/config.ts` and two pure CMS modules, and uses every tool.
- Build hooks and `after-build.ts` already run sandboxed in QuickJS (`lib/sandbox/`, contract 4). This spec does not
  change them.
- The prototype showed, on this account: Worker Loader with `globalOutbound: null` blocks `fetch`; a scoped
  `WorkerEntrypoint` stub with `props` works and the app cannot set its `props`; `limits: { cpuMs, subRequests }` stop
  a loop and too many binding calls (binding calls count as subrequests).

## Who is sandboxed

| App                                                                                            | Server code runs                     | Plan            |
| ---------------------------------------------------------------------------------------------- | ------------------------------------ | --------------- |
| **Store app**: its folder has the store's record `store.json` (`RECORD`, `lib/storeEntries.mjs`) | in the sandbox (D2), Morpheme's too  | Workers Paid (D1) |
| **Site's own app**: no `store.json` (Sara's app)                                                 | directly in the site's Worker (D16) | every plan      |

`placesOf` (`lib/appPlaces.mjs`) gets the record: `worker` is `sandboxed` for a store app and `full` for an own app, and
the app's page (`src/AppPlaces.tsx`) says which. A folder that the owner changed after installing (the store's
`changed` check) stays a store app: changing its files never lifts it out of the sandbox.

**A store app's `worker.js` is never imported into the site's Worker.** An import runs the module's top-level code in
the host, so `worker/apps.js` imports own apps' `worker.js` only and lists store apps by id and bundle path (below).
`check:content` fails on a store app's `worker.js` imported by `worker/apps.js`.

## The CMS's sandbox interface (D1)

One small module, `worker/sandbox.js`, is the only place that knows the platform:

```js
// sandboxOf(env) → { available: 'yes' | 'needs-paid' | 'no-bundle', run(app, entry, input) }
// entry: 'fetch' | 'scheduled' | 'provide'; input: { request } | { cron } | { contract, method, args }
// run resolves { ok: true, value } or { ok: false, kind, message }; it never throws.
```

- **`worker/sandbox-cloudflare.js`** implements it with Worker Loader (`env.LOADER`). It is the only file that calls
  `env.LOADER.get`.
- **A fake** in `worker/fixtures/` implements it in Node for the tests (`node --test`), so every caller is tested
  without Cloudflare.
- Another hosting platform later writes its own implementation of the same three members. Nothing else in the CMS
  changes.

`kind` is one of `error` (the app threw), `cpu`, `subrequests`, `outbound` (a host it may not reach), `storage` (a
write of the app's own code refused, spec 2), `unavailable` (no Worker Loader: the Free plan, D17), `contract` (an app
before contract 7, D27) and `timeout`.

## How the code gets in

1. **Build:** for each active store app with `worker.js`, the build bundles it with `bundleEntry`
   (`lib/sandbox/bundle.mjs`) into one ESM file, `dist/_apps/<app>/worker.mjs`, served to no one (as the app's other
   build files). The worker bundle has its own allow-list of CMS modules, `WORKER_CORE`: pure modules only (no
   `node:*`, no `@site/*`). Cookiescanner's two (`cookieCategories.mjs`, `cspSources.mjs`) are on it. An import outside
   it is a build problem on the app's page.
2. **The site's config is not imported.** The app gets the public parts as `tools.site` (`domain`, `name`,
   `language`, `publicHost`), so `../../site/config.ts` and `env.PUBLIC_HOST` / `env.EDITOR_HOST` are no longer read
   by store apps.
3. **Load:** `sandbox-cloudflare.js` calls `env.LOADER.get(\`${app}@${version}#${buildId}\`, loader)`. The `loader`
   callback (run only when the isolate is not warm) reads the bundle from `env.ASSETS` and returns
   `{ compatibilityDate, compatibilityFlags, mainModule: 'shim.js', modules: { 'shim.js', 'app.js' }, env, globalOutbound, limits }`.
   The id changes with each build, so an updated app never runs old code. No promise is kept in module memory
   (`scripts/pending-shared.test.mjs`).
4. **The shim** (`worker/sandbox-shim.js`, the CMS's, loaded as the main module) is a `WorkerEntrypoint` with
   `fetch`, `scheduled` and `provide`. It builds `tools` inside the sandbox from the stubs in `env` and calls the app's
   default export with the same signature as today: `fetch(request, env, ctx, tools)`, `scheduled(controller, env, ctx,
   tools)`, and `provides[contract][method](args, tools)` (spec 3). So an app's `worker.js` keeps its shape; what
   changes is what `env` and `tools` hold.

## What the app gets (scoped stubs)

Each stub is a `WorkerEntrypoint` on the site's Worker (`ctx.exports.<Name>({ props: { app } })`); the app cannot set
`props`, so it cannot name another app. The app's `env` holds only the stubs its `app.json` asks for:

| `env` / `tools`              | Asked for by                    | What it does                                                                                                                                                                 |
| ---------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `env.KV`                     | `"worker": { "kv": true }`      | `get`, `put`, `delete`, `list` on one shared namespace `APP_KV`, every key prefixed `app:<id>:`. Replaces an app's own namespace (Cookiescanner's `COOKIE_SCAN`).                   |
| `env.ASSETS`                 | always                          | `fetch` of the built site, read only, `GET` only. Pages and the app's own `/_apps/<id>/`; another app's `/_apps/…` answers 404.                                                |
| `env.BROWSER`                | `"worker": { "browser": true }` | The site's Browser Rendering binding, forwarded as it is (**verify** on staging that `@cloudflare/playwright` launches through a forwarding stub, WebSocket upgrade included). |
| `tools.storage`              | `storage` (spec 2)              | The table API of spec 2, scoped to the app's tables.                                                                                                                          |
| `tools.providers`            | `uses` (spec 3)                 | `call(contract, method, args)`: only contracts the app `uses`.                                                                                                                |
| `tools.github.read/commit`   | `"worker": { "github": true }`  | As today. A commit in a visitor's name is decided by the host (below).                                                                                                        |
| `tools.notify`               | always                          | As today; the type is prefixed with the app's id by the host.                                                                                                                 |
| `tools.mcp.call`             | `mcp`                           | As today; credentials stay in D1.                                                                                                                                             |
| `tools.mayEdit`, `tools.json`, `tools.site` | always           | `mayEdit` answers from the host's check of the request (below); `json` is pure; `site` as above.                                                                              |

**The request reaches the app without the sign-in.** The host checks the session first (`access`, `mayEdit` in
`worker/session.js`), removes `Cookie` and `Authorization`, and passes the result in `props` as `{ canEdit, call }`,
where `call` is an id the host keeps for that request only. `tools.mayEdit()` returns `canEdit`; `github.commit(…, as)`
with `as` set sends `call` back, and the host commits in the signed-in person's name only while that request runs. The
app never sees a cookie, a GitHub token or a key.

## The outbound gateway (D20)

`globalOutbound` is a `WorkerEntrypoint` of the host, `AppOutbound`, with `props { app, hosts }` (**verify** that
`globalOutbound` takes an entrypoint stub; the prototype used `null`). For every `fetch` of the app it:

- allows `https:` to a host on the app's server list only (exact names, no wildcard, no port, no IP address, the
  rule `mediaProviders` hosts follow), and never the site's own hosts or `*.workers.dev`;
- follows no redirect by itself: a `3xx` goes back to the app, and its next `fetch` is checked again;
- ends a call after 10 s or over 5 MB (as `worker/media-providers.js`), and a refused host is a failure of kind
  `outbound` with the host named.

**Contract 7's `worker` key** (D5, D20):

```json
"worker": { "hosts": ["api.mailchimp.com"], "kv": true, "browser": false, "github": false }
```

`hosts` is separate from `csp` (what visitors' browsers may load): a host listed for the server is never added to the
pages' CSP, and the reverse. `manifestProblems` checks it; the store refuses a release whose `worker.js` exists and
whose `worker` key is missing.

**A data provider has `worker.hosts` without `worker.js`** (spec 3): the site's Worker makes its declared request, so
the hosts it may reach are server hosts too. Only `hosts` is allowed then (`kv`, `browser` and `github` need code). On
contract 7 this replaces the `csp` hosts that contract 5's `mediaProviders` use; a contract-5 app keeps its `csp`
hosts until its next version.

**TCP is not offered in 0.23.** Whether `connect()` passes through `globalOutbound` is **verify**; until it is known,
`connect` is refused, so an SMTP connector waits and email suppliers are reached over their HTTP APIs (D15).

## Limits (D13)

`limits: { cpuMs, subRequests }` per call, one pair for `fetch` and `provide`, one for `scheduled`. The numbers are
measured, not guessed: batch 4 runs Cookiescanner's hourly scan and its `fetch` routes, Mailchimp as a data provider
and a fixture form receiver with code on `morpheme-staging`, records CPU and subrequests per call over a week, and
proposes twice the highest seen. The owner approves them there. Until then the spec holds no number.

## When it fails (D21, D34, D35)

The host classifies every `{ ok: false }` by `kind` and records it in a core table in `CONSENT` (the core's own
database; `APP_DATA` is for apps, D7):

```sql
app_failures (app TEXT, kind TEXT, message TEXT, version TEXT, first_at INTEGER, last_at INTEGER, count INTEGER,
              notified_at INTEGER, emailed_at INTEGER, paused_at INTEGER, PRIMARY KEY (app))
```

- **A spell** starts with a failure and ends with the app's next success, or when the owner turns it back on. It
  counts as failing when it has lasted 15 minutes with at least 3 failures, so one bad call does not alarm anyone.
- **Day 0:** the app's page shows the problem (kind, the last message, since when; `src/AppProblems.tsx` reads the
  build's and the runtime's problems, `worker/app-problems.js` gets a `GET /api/apps/failures`) and the owner gets a
  notification (`notifyAll`, type `apps/failing`, opens the app's page).
- **After 24 hours** still failing: an email to the owner with the same text, through the built-in email sending of
  spec 4 (D10). A site without an owner's address gets a second notification instead.
- **After 7 days** still failing: the app's server part pauses (`paused_at`), the built-in takes over (D14), and the
  owner is told by notification and email. The pause is a row, not a commit: nothing is built and nothing is deleted.
  _Turn on_ on the app's page clears the row and starts a new spell.
- **What pauses:** the app's `fetch`, `scheduled` and `provide`. For a data provider (no code), its declared requests
  stop. A spell made only of `storage` failures for a full table (`quota`) is shown and notified but never paused:
  pausing frees no space; the owner deletes rows or the app's data.
- **Work that must not be lost** is saved by the caller before the app runs: a form's answer is in storage before a
  receiver is called (spec 4).
- **The publisher hears counts** (D35): with the hourly store poll (`2026-11-14-store-auto-updates-design.md`), the
  site sends `POST /store/failures` with its store key: `[{ item, version, kind, count }]` since the last report, never
  a message, an address or visitor data. The store keeps daily totals per item, version and kind and the number of
  distinct sites (counted by a hash of the site key, never stored with a name), and shows them to the publisher.

## The Free plan and older apps (D17, D27)

- `sandboxOf(env).available` is `needs-paid` when `env.LOADER` is missing. Then every store app's server part is
  paused for that reason: its addresses answer `503 { error: 'needs-paid' }`, `scheduled` skips it, and its page says
  _Needs the Workers Paid plan on Cloudflare_ with a link to Cloudflare's plan page. The rest of the app (blocks,
  editor screens, build hooks, lists) works. Nothing is deleted; upgrading turns it on with the next build.
- **verify:** whether a Free account can deploy a Worker with a `worker_loaders` binding. If it can, the starter has
  the binding and the check above is enough. If it cannot, the starter leaves it out, and the editor adds it when the
  account has Workers Paid (`worker/plan-status.js` already answers that), by editing `wrangler.jsonc` as
  `src/r2Caching.ts` does, in one commit after the owner's yes.
- A store app on contract 6 or older with a `worker.js` has no `worker` key: its server part pauses with kind
  `contract` and the page says _Needs a new version of this app_. Morpheme releases Cookiescanner on contract 7 with
  0.23 (batch 3), so sites get it through the automatic updates before they notice.

## Cookiescanner on contract 7 (batch 3)

`"worker": { "hosts": [], "kv": true, "browser": true, "github": true }`; `env.COOKIE_SCAN` becomes `env.KV` (the last
scan is not moved: the next hourly run scans again); `config` and `PUBLIC_HOST` become `tools.site`. The site no longer
needs the `COOKIE_SCAN` namespace; the update leaves it, and the release note says it can be deleted.

## Tests

- `lib/appPlaces.test.mjs`: store app `sandboxed`, own app `full`, changed store app still `sandboxed`.
- `lib/appManifest` tests: the `worker` key (hosts rule, booleans, missing key with `worker.js` on contract 7).
- `worker/sandbox.test.mjs` with the fake: kinds, never throws, Free plan, contract pause, stubs given only when asked.
- `worker/app-outbound.test.mjs`: listed host, unlisted host, port, IP, redirect, size, timeout, the site's own host.
- `worker/app-failures.test.mjs`: spell rules, 15 minutes and 3 failures, 24 hours, 7 days, success and _Turn on_
  reset, the report to the store holds no message.
- `check:content`: a store app's `worker.js` imported by `worker/apps.js` fails.
- Staging (batch 4): the prototype's four cases from the real `worker/index.js`, plus Cookiescanner's scan.

## Out of scope

- TCP (`connect`) and SMTP over TCP; a later spec when it is verified.
- Durable Objects, queues or cron of an app's own (it gets the site's hourly `scheduled`).
- Isolating build hooks differently: they stay in QuickJS.
- Sandboxing own apps (D16) and the store's paid pause (0.25).

## Verify before building

1. `globalOutbound` accepts a `WorkerEntrypoint` stub, and `fetch` through it counts against `subRequests`.
2. Browser Rendering through a forwarding stub (Playwright's WebSocket).
3. A Free account and a `worker_loaders` binding at deploy.
4. Whether `connect()` passes `globalOutbound`.
5. Worker Loader is out of beta, or the owner accepts building on the beta.
6. The cold start of a loaded app (prototype: about 450 ms for the first call) is acceptable for `/api/<app>/` routes.

## Batches

| Batch | Repo                | What                                                                                                                         |
| ----- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1     | `morpheme-cms`      | `placesOf` and the `worker` key (contract 7), the bundle and `WORKER_CORE`, `worker/apps.js` split, `check:content` rule.      |
| 2     | `morpheme-cms`      | `worker/sandbox.js`, the Cloudflare implementation, the shim, the stubs, `AppOutbound`, the request without sign-in.          |
| 3     | `morpheme-apps`     | Cookiescanner on contract 7; release after the owner's yes.                                                                  |
| 4     | `morpheme-staging`  | The verify list, then the measurements and the owner's limits.                                                              |
| 5     | `morpheme-cms`, `morpheme-appstore` | `app_failures`, escalation, the app's page, `POST /store/failures` and the publisher's counts.                  |

Batch 4's verify items 1 to 4 run first, before batch 2 is built, so a wrong assumption costs a spec change, not code.
