# Batch 2: the Worker

Master plan: `2026-11-03-cms-update-check.md`. Needs Batch 1 merged (`lib/lockfile.mjs`, `lib/cms-version.mjs`,
`lib/changelog.mjs`, `t.cms`). Repo `morpheme-website`, paths relative to `packages/editor/`. Task 2.1 first (one
line), then 2.2.

**Batch check:** `npm run check` (it runs `check:worker`) from `morpheme-website`'s root.

---

### Task 2.1: `commitFiles` returns the new commit's id — orchestrator (one-line fix)

**Files:** Modify `worker/github.js` (`commitFiles`, line ~24) and its header.

- Today it discards what `files.save` returns (`{ commit, blobs }`). It returns `commit` (the new commit's oid) instead:
  `commitFiles(env, head, headline, changes, ctx, token?) -> Promise<string>`.
- `worker/publish.js` and every other caller ignore the value; nothing else changes.
- Check: `npm run check:worker`. Commit: `Return the commit's id from commitFiles`.

---

### Task 2.2: `worker/cms-update.js` and its check — Sonnet agent

**Files:**
- Create: `worker/cms-update.js`
- Create: `scripts/check-cms-update.mjs`; modify `bin/morpheme.mjs` (`'check:worker'` runs it after
  `check-consent`)
- Modify: `worker/index.js` (import, the route, the two crons)

**Interfaces consumed:** `readFiles`, `commitFiles` (`worker/github.js`; the latter now returns the commit id),
`GitHubError` (`worker/files.js`, `.status`), `mayEdit` (`worker/session.js`), `json` (`worker/not-found.js`),
`notifyAll(env, { type, id, text, error }, texts)` (`worker/push.js`), `addToLock` and `NeedsNpm`
(`lib/lockfile.mjs`), `managedVersion`, `nextVersion`, `watchStep`, `PACKAGE` (`lib/cms-version.mjs`), `gunzip`,
`fileFromTar`, `sectionsBetween` (`lib/changelog.mjs`), `cms` texts (`src/i18n/en-US/cms.ts`, `src/i18n/da-DK/cms.ts`),
the site's repo and language (`@site/config`, as `files.js` and `siteT` find them).

**Interfaces produced (exports of `worker/cms-update.js`):**
- `RUNNING`: the running Worker's own version, `version` of the package's `package.json` imported at build time.
- `checkForUpdate(env, deps?, now?) -> Promise<void>` — the hourly step.
- `startUpdate(env, version, deps?, now?) -> Promise<Update>` — writes `package.json` and `package-lock.json` for
  `version` (its manifest from npm through `addToLock`), commits *`commitUpdate(version)`* in the site's language,
  puts `cms:update = { commit, from, to, at, state: 'waiting' }`. Throws `NeedsNpm`, or a `GitHubError`.
- `watchUpdate(env, deps?, now?) -> Promise<void>` — the minute step: one KV read when nothing is waiting.
- `cmsStatus(env) -> Promise<Status>`: `{ running, token: boolean, kv: boolean, checked: cms:checked | null,
  update: cms:update | null, skipped: string[], notes: { version, text }[] }` (notes from `running` up to
  `checked.latest`, newest first).
- `handleCms(request, env, ctx, deps?) -> Promise<Response | null>` — `GET /api/cms` → `Status`;
  `POST /api/cms/update` with `{ version }`. `null` for other paths.
- `deps` defaults to `{ readFiles, commitFiles, fetch, notify: notifyAll, mayEdit }`; the check passes fakes.

**KV (binding `PUSH`)** — as the spec's *Data* table, plus decision 1 of the master plan:
`cms:update` `{ commit, from, to, at, state: 'waiting' | 'undoing' | 'done' | 'undone' | 'stuck', undoCommit?, undoAt? }`;
`cms:skip:<version>` `{ version, commit, at }`; `cms:notes:<version>` `{ version, text }`;
`cms:checked` `{ at, latest, problem? }` with `problem` one of `{ kind: 'not-managed', detail: <managedVersion reason> }`,
`{ kind: 'unreachable' }`, `{ kind: 'major' }`, `{ kind: 'skipped' }`, `{ kind: 'needs-npm', detail: <message> }`,
`{ kind: 'cannot-write' }`, and `noChecks: true` when the token could not read check runs.

**Behaviour:**
- **Hourly** (`checkForUpdate`): no `GITHUB_PUBLISH_TOKEN` or no `PUSH` → return without a request. `cms:update` is
  `waiting` or `undoing` → return. Read `package.json` and `package-lock.json` (`readFiles`); not managed → put
  `cms:checked` with `not-managed` and return. `latest` from `https://registry.npmjs.org/-/package/@morphemecms%2fcms/dist-tags`
  (fails → `unreachable`). Skipped = the versions under `cms:skip:`. `nextVersion(current, latest, skipped)`. When
  `cms:notes:<latest>` is missing: the manifest (`https://registry.npmjs.org/@morphemecms%2fcms/<latest>`), its
  `dist.tarball`, `gunzip`, `fileFromTar(…, 'package/CHANGELOG.md')`, `sectionsBetween(…, current, latest)`, each
  section to `cms:notes:<version>`. When `auto`: `startUpdate`. Put `cms:checked = { at, latest, problem? }`.
- **Forbidden:** a `GitHubError` with `status` 403, or whose message says the resource is not accessible / forbidden
  (GraphQL answers a read-only token with HTTP 200 and an error), is `cannot-write`. Nothing is committed or kept.
- **Writing the files:** `JSON.stringify(x, null, 2)` plus the file's own line ending at the end, as npm writes them.
- **Minute** (`watchUpdate`): read `cms:update`; unless `waiting` or `undoing`, return. The watched commit is `commit`
  (waiting) or `undoCommit` (undoing). Its check runs:
  `GET https://api.github.com/repos/{owner}/{repo}/commits/{sha}/check-runs` with the token; the newest run whose
  `app.slug` is `cloudflare-workers-and-pages`; its `conclusion` (`'success'`, `'failure'`, else `null`). A 403 gives
  `null` and sets `cms:checked.noChecks`. Then `watchStep(update, RUNNING, check, now)`:
  `'done'` → `state: 'done'`, notify `notifyDone(to)`;
  `'undo'` → read the newest head, write `from` back (`addToLock` with `from`'s manifest), commit
  *`commitUndo(to)`*, put `cms:skip:<to> = { version: to, commit, at }`, `state: 'undoing'`, `undoCommit`, `undoAt`;
  if that commit throws → `state: 'stuck'`, notify `notifyStuck(to)` with `error: true`;
  `'undone'` → `state: 'undone'`, notify `notifyUndone(to)` with `error: true`;
  `'stuck'` → `state: 'stuck'`, notify `notifyStuck(to)` with `error: true`.
- **Notifications:** `notify(env, { type: 'updates', id: 'cms', text, error }, texts)` where `text` is the English
  sentence and `texts` maps `'en-US'` and `'da-DK'` to `{ [text]: <that locale's sentence> }`.
- **`handleCms`:** both paths need `mayEdit` (403 `{ error: 'forbidden' }`). No token or no `PUSH` → 503
  `{ error: 'not-set-up' }`. `POST`: `version` must equal `cms:checked.latest` (400 `{ error: 'version' }`); an update
  `waiting` or `undoing` → 409 `{ error: 'waiting' }`; deletes `cms:skip:<version>` (*Prøv igen*), then `startUpdate`;
  `NeedsNpm` → 422 `{ error: 'needs-npm', detail }`; forbidden → 502 `{ error: 'cannot-write' }`; else 200
  `{ update }`.
- **`worker/index.js`:** route `/^\/api\/cms(\/update)?\/?$/` → `handleCms(request, env, ctx)`, after the push route
  and before the apps' routes. `scheduled`: the minute cron also runs `watchUpdate(env)`; the hourly one also runs
  `checkForUpdate(env)`.

**Test cases (`scripts/check-cms-update.mjs`, problems collected and printed as `check-worker.mjs` does; the module
bundled with `workerModules('cms-update.js')`; a fake KV with `get(key, 'json')`, `put`, `delete`, `list({ prefix })`;
fake `readFiles`/`commitFiles` over an in-memory `package.json` + lock (lockfileVersion 3, with
`node_modules/@morphemecms/cms`); `fetch` faking the registry (dist-tags, manifests with `dist.tarball`/`integrity`,
a gzipped tar with `package/CHANGELOG.md`) and the check-runs API; `notify` recording):**
1. Exact `0.1.0`, latest `0.1.1` → one commit with the site language's `commitUpdate('0.1.1')`, `package.json` says
   `"0.1.1"`, the lock entry has `0.1.1`'s `resolved` and `integrity`; `cms:update.state` `waiting`; `cms:notes:0.1.1`
   kept.
2. The hourly step again while waiting → no commit.
3. Minute step, the update's check run `failure` → an undo commit writing `0.1.0` back, `cms:skip:0.1.1`,
   `state: 'undoing'`; then the undo's check run `success` → `undone` and one notification with `error: true`.
4. Minute step with `RUNNING` equal to `to` → `done` and one notification. (Run the fake with a `to` equal to the
   package's own version.)
5. `"*"`, `"^0.1.0"` and `"next"` → no commit; `cms:checked.problem.kind` `not-managed`.
6. `0.1.0` → latest `1.0.0` → no commit; problem `major`. Latest in `cms:skip:` → no commit; problem `skipped`.
7. `commitFiles` throwing a `GitHubError` with status 403, and one with status 200 and *"Resource not accessible by
   personal access token"* → no `cms:update`; problem `cannot-write`.
8. No `GITHUB_PUBLISH_TOKEN` → the fake `fetch` was never called and KV is unchanged.
9. Check runs answering 403 → `noChecks: true`; 19 minutes → still waiting; 21 minutes → undone as in 3.
10. The undo's commit throwing → `stuck`, one notification with `error: true`; the next minute does nothing.
11. Nothing waiting → the minute step makes one KV read and no request.
12. `handleCms`: `GET` without `mayEdit` → 403; with it → the `Status` shape; `POST` a version that is not
    `cms:checked.latest` → 400; while waiting → 409; a skipped version → its `cms:skip:` key is gone and a commit is
    made; `NeedsNpm` (a manifest with `dependencies`) → 422.

**Steps:** write the check, see it fail on the missing module, write `worker/cms-update.js`, wire `worker/index.js`
and `bin/morpheme.mjs`, `npm run check:worker` green, `npm run check` green. Commits (one PR):
`Take the CMS's new versions by itself in the Worker` (module + check + `bin`), then
`Run the CMS's update check in the Worker's crons and at /api/cms` (`worker/index.js`).
