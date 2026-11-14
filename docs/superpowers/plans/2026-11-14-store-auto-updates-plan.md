# Plan: theme and app updates without anyone signed in

Spec: `docs/superpowers/specs/2026-11-14-store-auto-updates-design.md`. Build only after the owner has answered its open
decisions; the plan marks where an answer changes a PR. Each PR has one changeset (skill `changesets`); a change a site
owner sees also gets a release note in English and Danish (skill `release-notes`). Changes the editor shows run
`npm run check:screens`.

Order: PR 1 first. PR 2 and PR 4 can run in parallel after it. PR 3 needs PR 2. PR 5 and PR 6 are independent.

## PR 1 · morpheme-cms · One implementation of the update code (no behaviour change)

- Move `newer`, `breaking`, `notesSince`, `recordIn`, `changedFiles`, `themeChanges`, `appChanges` and the cookie-list
  changes (`cookieChanges`, `inCookieList` from `src/cookieList.ts`) into `lib/storeUpdate.mjs` with folder and file
  names passed in (no `@site/config`, no i18n, no React). `src/store.ts` and `src/cookieList.ts` re-export them.
- Tests in `lib/` run the same input through the old export and the new module and compare the changes.
- Changeset: empty. Done when `npm run check` is green and the editor's own update, install and uninstall are untouched.

## PR 2 · morpheme-cms · The Worker takes store updates

- New `worker/store-update.js`, same shape as `worker/cms-update.js` (I/O injected as `deps`, state in KV `PUSH`, no pending
  promise in module memory): `checkStoreUpdates` (hourly, from `scheduled` in `worker/index.js`), `watchStoreUpdate` (each
  minute, shares `watchStep` and `checkOf`; one slot with the CMS update), `undoStoreUpdate`, the log `store:log`.
- Uses `storeKey`, `GITHUB_PUBLISH_TOKEN`, `readFolder`/`readFiles`, `commitFiles`, `blobId`, `lib/storeUpdate.mjs`.
  Fetches only files whose blob id differs. Catalog with `If-None-Match`; `ETag` kept in KV.
- Decides per item: apply, `held` (changed files, wider permission, soak time of a major), `waiting for CMS` (from the store's
  `unavailable`), `failed` (not retried until a newer version). `widened(old, new)` lives in `lib/appPermissions.mjs`,
  with tests for each kind of wider and for the same-or-less case; the Worker holds by decision 1.
- Verify in this PR and say so in its description: how many subrequests Venus costs; that an update keeps new blocks off;
  the site's build runs the content checks (so a removed block fails the build and is undone).
- `GET /api/store/updates` (log, behind the login check), `POST /api/store/updates/check` (Check now), `POST
  /api/store/updates/revert` (Go back: restores the folder from the commit's parent).
- Tests: node tests with fake deps, one per row of the table in spec section 2, plus the undo, the key refused, the
  branch moved, and a rerun that does nothing. `node --test scripts/pending-shared.test.mjs` stays green.
- Changeset: `minor`. Release note: a theme or app update now reaches a site without anyone signing in (English and Danish).

## PR 3 · morpheme-cms · The editor shows it

- On open, read `/api/store/updates` and raise one notice for each update since the owner last looked (`kind: 'updates'`,
  a major says so, a held or undone one says why). A *Review and update* link for a held app.
- A history on the theme's and app's page, with *Go back* and *Check now*, from existing parts (`Group`, `ListItem`,
  `Button`); no new component type. A line that says what to add when the site has no token or KV binding.
- Remove `autoUpdate` on open (`src/AppList.tsx`, `src/App.tsx`) where the Worker is active; keep it as the fallback
  without. `breaking()` stays as a label, its comment is rewritten. The existing `t.apps.breakingFound` copy is reused for
  held majors if decision 2 says so.
- Screens: add the new states to `check:screens` (notice, history, held app). Texts: English first, Danish in
  `defaults/i18n/da-DK/`; word choice per Material 3's *Word choice* and skill `site-editor-writing`.
- Changeset: `minor`. Release note with an image if the history screen is visible on the start of the update.

## PR 4 · morpheme-appstore · What the Worker needs from the store

Read `docs/superpowers/specs/2026-11-04-store-connection-design.md` there first; this repository's spec could not.

- `GET /store/catalog`: `ETag` and `304`; an `unavailable` list (`id`, `version`, `needs` contract) for versions the
  requested `app=` / `theme=` cannot run; withdrawn versions left out.
- A batch endpoint for files by blob id, one answer for many (skip if it exists).
- Immutability: refuse to release an existing `id@version` with other content (409). A `withdrawn` mark on a version.
- Tests for each. No change to keys or tokens.

## PR 5 · morpheme-apps · The release script

- `npm run store:release -- <id>` refuses without a release note for the new version; refuses a major whose note does not
  say what changes; refuses the same `id@version` with other content; prints what the version asks for more
  (`widened()` against the last release) so the publisher sees the consequence.
- Adds to the check `releaseProblems`: a contract change without a note.

## PR 6 · morpheme-website · The rules

- Rewrite *Appbutikken* in `docs/rules.md`: sites take every version; a major is labelled and applied after its soak time
  (decision 2); a wider permission is held (decision 1); the contract rule keeps its meaning. Docs only; the site's own check passes.

## Release rule (skill `release` in morpheme-cms)

- Before a CMS that raises `THEME_API` or `APP_API` goes to `latest`: the store must have a version of each store theme and app
  written to the new contract. Written as a step of the release skill's checks.

## Roadmap

- Recommended: PR 1 to 5 in 0.18 (the `0.18` branch, `minor`), because Sara's site is blocked now; `widened()` shown before
  install, withdrawn-version handling in the store's UI and the history's polish in 0.22.
- If the owner keeps all of it in 0.22: nothing above changes except where the branch is cut.
- 0.23: when *storage for apps* and *apps that provide to apps* add `needs` keys, `widened()` learns them (one test each).
