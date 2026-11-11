# Drafts and Publish: plan of sub-steps (batch 12, 0.17)

Source: batch 12 and questions 1, 2 and 5 of `2026-11-11-intuitive-editor-design.md`; spike S1 (an early exit of `ci-build`
does not skip the deploy). Every pull request goes into `0.17`, has a `minor` changeset and, when the owner sees a change,
a release note (`release-notes` skill, English and `da-DK`). Data model and Worker come first, UI after.

## Decisions this plan rests on

- The waiting version is a file in git, in a folder of its own: `src/drafts/<collection>/<slug>.md`. It is outside
  `CONTENT_PATHS` and outside everything the site builds from, so saving a draft changes no site file. Workers Builds
  **watch paths** exclude `src/drafts/`; `ci-build` keeps no early exit. As a fallback for a site without the watch path,
  a diff holding only `src/drafts/` takes the existing content lane.
- Two statuses: `Published` and `Draft`. `status: draft` stays in the file; published is no `status`.
  Stored `unlisted` becomes published + `noindex: true`; stored `scheduled` becomes a waiting version with a publish time.
- The version list is a list from the start: each version has `id`, `state` (`live`, `waiting`) and an optional `publishAt`.
  The core writes and reads at most two.
- `publish`, `schedule`, `unpublish` and `discard` are plain functions in `lib/versions.mjs` (no browser, no React), so the
  editor, the Worker and an app call the same code.
- A scheduled publish is run by the Worker's hourly job (`worker/publish.js`), not by the browser.
- With `Faster editor` off there is no autosave: `Save` commits the draft file and the status shows `Not saved` until then
  (spec, question 2). Autosave to R2 is batch 13, not here.
- New pages and posts start as Draft.
- Batch 1 (plain words, PR #279) changes the status words only: this work reads the words from the same i18n keys and
  does not rename them.

## Pull requests

1. **Plan and the `unlisted` removal** (PR #290, merged): `lib/status.mjs` (`hiddenFromSearch`, `migrateStatus`).
2. **Versions and the Worker** (no UI). The editor already commits through `/api/github/commit` (several files, deletes
   included), so Save, Publish changes, Unpublish, Discard and Schedule need no Worker endpoint: they are the pure functions
   of `lib/versions.mjs` (spike S4: each takes a version id, default `waiting`; the draft path comes from the id), and the
   editor commits their changes. The Worker's part is the hourly publish (`worker/publish.js`): it looks in `src/drafts/` for
   due `publishAt` across the whole version list, one commit with the pages still on the stored status `scheduled`. A drafts-only
   diff takes `ci-build`'s content lane (`src/drafts/` joins `CONTENT_PATHS`), with no early exit. `check:worker` covers it.
3. **Editor store** (no new buttons). The editor loads `src/drafts/` (`folders.drafts`) and `src/pageVersions.mjs` gives a page's
   versions and turns the changes of `lib/versions.mjs` into the editor's own (`{ path, content, oid }`, deletes with the blob
   id). New pages and posts start as Draft (`status: "draft"` in the new file). `Save` still writes the page file: switching a
   published page's `Save` to the waiting version needs `Publish changes` on screen, so that switch is made in step 4 with the
   buttons. A stored `scheduled` is migrated in step 4 too, with the Schedule picker that replaces its status.
4. **Editor UI**, in three pull requests:
   - **4a, the buttons and states** (this one): `Save` on a published page keeps a waiting version (`src/drafts/`, no build, no wait
     for the site); `Publish` on a draft; `Publish changes`, `Unpublish` and `Discard changes` (with their confirmations); the
     status line under the title (`Draft`, `Unpublished changes`, `Published · Changed …`); the `Status` menu is gone from Page
     settings; a new address cannot be set while changes wait. Before and after screenshots in `2026-11-11-drafts-screens/`. A
     stored `scheduled` still reads as a draft that `Publish` publishes at once, until 4b.
   - **4b, Schedule** (built): the `Schedule` row (and `Cancel schedule`) opens a date and time dialog; the changes, and a new page,
     are saved as a waiting version with `publishAt`, and the line under the title says `Scheduled · <time>`. The Worker moves a
     page on the stored `scheduled` status that is not due to a draft with a waiting version that has its time (`migrateScheduled`,
     one commit, once), and publishes one that is due as before; the editor does the same for a page it schedules again. The
     `Scheduled` option and the `Time` field are gone from the collections; the lists show a draft with a waiting time as Scheduled.
     `Schedule` is a row for now; a split button beside `Publish` is a later polish.
   - **4c-1, small things** (built): the dismissible hint "Skip builds for waiting versions" in Settings › Developer › Caching and
     builds (spike S1b: the lane is the default, the watch path an optional speed-up; shown once a waiting version exists, closed
     for good in this browser), `CLAUDE.md` section 6 (`Draft`, `Published`; `Schedule` is a date). `Hide from search engines` is
     already the label and sits in the SEO section (batch 1).
   - **4c-2, the version switch:** the `Live` / `Scheduled` switch (editing the live page or the waiting version) as the named slot
     `versionSwitch` (`AppDefinition.slots`, props `entry`, `versions`, the four functions, `editing`); the core draws it when no
     app registers one; `@morphemecms/cms/lib/versions` joins the imports an app may use.

Each pull request must pass `npm run check`, `check:screens`, `check:demo` and `check:themes`.

## Owner decision (settled, 11 November)

`unlisted` is removed with its behaviour. A stored `unlisted` is read as `published` plus the SEO setting `Hide from search engines`
(stored `noindex: true`), and nothing more: no rule keeps `noindex` entries out of the site's own lists, the blog, the sitemap
or what apps read. A migrated hidden post therefore now shows on the blog and in lists. Pull request 1 removes the
`unlisted`-only paths and keeps only the migration of stored values (read as above; the editor writes the migrated form
on the next save).

## Autosave, part A (Worker and client logic, batch 13)

Done without a screen: `worker/autosave.js` (`/api/autosave`, `/api/autosave/flush`, the hourly `sweepAutosaves`), `lib/autosave.mjs`
(key, limits, sweep rule) and `src/autosave.mjs` (`createAutosave`, `autosaveClient`, `watchLeaving`). It only works with `Faster editor` on
(the `FILES` binding); without it every call answers 409 `off` and the client state is `notSaved`.

- R2 key `<owner>/<repo>/autosave/<page file>/<version id>`, value `{ text, savedAt }`, at most 1 MiB (413 above). Signed-in with push access only.
- Moved to git (`saveDraft`, the person's own commit `Draft: <page>`) on `POST /api/autosave/flush`; the autosave is deleted. The hourly job moves
  what has been idle for a day (Worker token) and deletes what is 30 days old and could not move.
- Client: `autosave(path, text, id?)` sends after 1.5 s without a change, flushes after 5 minutes idle and on `leave()`, retries 1, 2, 4, 8, 16 s,
  then `notSaved` until `retry()` or the next change. `leave()` sends the unsent text with the flush in one request (`keepalive`).

What part B (the form and the status) needs:

1. Create one `autosaveClient()` per editor, call `autosave(entry.path, text, versionId)` on every change of a version, and
   `watchLeaving(client)` once. Show `client.subscribe` as `Saving…` / `Saved` / `Not saved` (new i18n keys in `en-US` and `da-DK`).
2. Only when `Faster editor` is on (`r2CachingOn`); with it off, do not call `autosave` and show `Not saved` until `Save`.
3. Call `client.forget(path, id)` and `DELETE /api/autosave?path=…&id=…` after `Save`, `Publish`, `Discard` (they commit the same text or drop it).
4. On opening a page, `GET /api/autosave?path=…&id=…`: when it exists and is newer than the waiting version in git, load it as the draft
   (`savedAt` against the commit time), and say so. `GET /api/autosave` lists all of them (a banner on the start screen).
5. Do not touch `versionSwitch` or the Schedule buttons; the autosaved text is a waiting version's text, so `schedule`/`publish` still read git.
6. Open question for the owner: a flush commits to `main` as a `src/drafts/` change, which takes `ci-build`'s content lane. If idle flushes are
   too many commits, raise `IDLE_MS` in `src/autosave.mjs` (the client) rather than flushing more often.
