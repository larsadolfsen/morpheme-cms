# Plan: sites do not update themselves (needs-npm), and a safe way to fix it

Written 18 Nov 2026 from the CTO's finding. Three pull requests into `0.18`, one after the other (each opens only after the
previous is merged by the PM). Status of each fact is marked **confirmed** or **not confirmed** by the build session.

## Cause (CTO, verified; checked by the build session where marked)

- Since 0.16 (#707) the peer is `postcss-selector-parser: ^6.1.5 || ^7.2.0` (`package.json`, `peerDependencies`; **confirmed**, it
  is still that on `0.18`). Sara's site and `morpheme-website` have 7.1.6 in their lockfiles (**not confirmed**: those lockfiles
  are not in this repository). 7.1.6 does not satisfy `^7.2.0`, and `lib/range.mjs` / `peerProblem` in `lib/lockfile.mjs` then throw
  `NeedsNpm` (**confirmed by reading the code**: `addToLock` returns `NeedsNpm` on any peer the lock does not satisfy).
- The nightly check (`worker/cms-update.js`, `checkForUpdate`) catches `NeedsNpm` and records `{ kind: 'needs-npm' }`, commits
  nothing. It shows only on the CMS page, not on the start screen.
- `scripts/peer-ranges.test.mjs` checks the ranges in `package.json` against one old starter's `package.json`, not the installed
  version in a lockfile, so it missed this.

## Why the order is hold, screen, peers

Lowering the peer floor first would let Sara's site take 0.18.0 that night. Her theme Venus 1.3.0 is written to an older contract
(the token names changed with contract 6), so the site would lose its colours while the build stays green, with no undo. So:

1. **PR 1, the contract hold** (this PR): the Worker does not take a version whose contracts an installed store theme or app is not
   written to.
2. **PR 2, the start screen**: a blocked update is shown where the owner looks.
3. **PR 3, peers and the test**: only now lower the floor and make the test run the real `addToLock`.

## PR 1: contract hold (`worker/cms-update.js`)

- `lib/contractHold.mjs` (`parseContracts`, `contractHold`, tested in `lib/contractHold.test.mjs`) and `readStoreItems` in
  `worker/github.js`.
- Before `startUpdate`, the Worker reads `lib/contracts.mjs` from the version's npm tarball (`THEME_API`, `APP_APIS`, or `APP_API`
  in an older one) and the apps' and themes' folders on the site (only `store.json` and `app.json` / `theme.json`). A version the
  contracts of an installed store theme or app do not accept is not taken: `cms:checked` gets
  `{ kind: 'contract', detail: '<theme|app> <id>[: not in the store | : could not confirm]', item, id, why, needs, has? }`. A site's own app (no `store.json`, for example
  Sara's `sara`) is never held. A version whose contracts cannot be read, or a site whose folders cannot be read, is not taken
  either (`unreachable`, tried again the next night): never on a guess.
- The silent returns are recorded (decision 8 of the store auto-updates design): no `GITHUB_PUBLISH_TOKEN` gives
  `{ kind: 'no-token' }`. With no KV binding nothing can be kept, and `cmsStatus` already says `kv: false` to the page.
- Tests: `scripts/check-cms-update.mjs` (run by `npm run check:worker`, cases 13 and 14) with fixture store records.

### The theme's contract is not recorded on the site (CTO ruling, 18 Nov; PM, same day)

`store.json` has `version`, `ref` and `files` only, and `theme.json` has no `api`. So the Worker does not assume a contract. The store
records every release's contract (`releases.api` in `morpheme-appstore`). Its catalog is **not** used: `storeCatalog` returns only the
newest release per item, so a site one version behind would be held for ever. Instead, for each theme and app installed from the store
(its `store.json`: the folder's id and `version`), the Worker asks `GET <store>/store/releases/<id>/<version>` (site key, as
`worker/store.js` does for the editor; answers `200 { id, version, api }` or `404`) and compares `api` with the next version's
`THEME_API` / `APP_APIS` for its kind.

| The store says | The Worker |
| :--- | :--- |
| 200, `api` in the next version's contracts for its kind | takes the version (also when the release is one behind the newest) |
| 200, any other `api` | holds: `contract`, `theme venus` |
| 404 (the release is not in the store) | holds: `contract`, `theme venus: not in the store` |
| no key, 5xx, offline, a body without an `api` | holds: `contract`, `theme venus: could not confirm` |

A site's own app has no `store.json` and is never held. The store is asked only for items that came from the store.

**Dependency:** the endpoint `GET /store/releases/<id>/<version>` is a separate small PR in `morpheme-appstore` and is merged first. Until
it is, a site's Worker gets a 404 and holds every version for a site with store items (safe, not useful), so this PR is not merged before it.

**Later, a separate PR (not here):** write the release's `api` into `store.json` on install (`src/store.ts`), so the Worker can compare it
without asking the store.

## PR 2: start screen

A blocked update (`needs-npm`, `contract`, `cannot-write`, a missing token or KV) shows as a notice on the start screen
(`src/cmsNotice.mjs`, `src/UpdatesNotice.tsx`, the start screen's widgets), not only on the CMS page. English first, then `da-DK`
(`src/i18n/`, skill `site-editor-writing`), parts from `src/ui.tsx` only (the `Notice`), release note (skill `release-notes`),
`check:screens` unit in its area's file. `cmsView.mjs` today lists only `unreachable`, `cannot-write` and `not-managed` as problems;
`needs-npm` and `contract` are added.

## PR 3: peers and the test (built)

- **The floor:** `postcss-selector-parser` is `^6.1.5 || ^7.1.0` in `peerDependencies` (and in the lock's root entry); `devDependencies` and the
  `overrides` keep `^7.2.0` (the version this repository develops on). The tests ran on 7.1.6, 7.1.0 and 6.1.5: the whole unit suite
  (2675 tests) and the demo's build on 7.1.6, the `site/` tests (156) on each of the three. The other peer ranges are not lowered: nothing
  shows that a site has a version under them, and the new test reads every peer against the lockfiles.
- **The test** (`scripts/peer-ranges.test.mjs`): the real `addToLock` on every lockfile in `scripts/fixtures/locks/`, which are cut to versions
  only (`scripts/lock-versions.mjs`: the CMS and its peers, `version` and nothing else). Today: the real lockfiles `npm install` makes from the
  0.14.2 starter (CMS 0.16.0) and the 0.17.0 starter, and the 0.17.0 one with `postcss-selector-parser` at 7.1.6, the state the CTO found in
  Sara's site and `morpheme-website`. It fails on any `NeedsNpm` (shown: with the old floor it fails with "needs postcss-selector-parser
  ^6.1.5 || ^7.2.0; the site has 7.1.6"). A negative control runs the released manifests of 0.16.0, 0.17.0 and 0.18.0 (`scripts/fixtures/manifests/`) on
  the 7.1.6 lockfile and expects `NeedsNpm`: that is the cause, kept as a test that the test can fail.
- **Not done, needs the owner or the CTO:** the lockfiles of Sara's site and `morpheme-website` themselves. They are not in this repository.
  Cut each with `node scripts/lock-versions.mjs <package-lock.json> > scripts/fixtures/locks/<name>.json` and add the file: the test reads
  every file in the folder. The 7.1.6 lockfile here is the starter's lock with that one version set, not a real site's.
- **What this does not fix:** sites already on 0.16.0 to 0.18.0 still have `^7.2.0` in the version they run, and the released 0.16.0 to 0.18.0 manifests still
  say `^7.2.0`. A site with 7.1.6 can take the next release (which has the new floor) by the nightly check, but not 0.17.0 or 0.18.0:
  those need `npm install` once. The CTO decides whether to release a patch of the lower line.

## Open

- **Sizes:** PR 1 about 150 lines of code and test; PR 2 one notice and its texts; PR 3 a package change and fixtures.
- **The endpoint's address and answer are as the PM described them** (`/store/releases/<id>/<version>`, `{ id, version, api }`); the build session
  could not read `morpheme-appstore`. The site's folder name is taken to be the store's id (`src/store.ts` installs by `id`). Not run against the real store.
- **Only the newest version is looked at.** If `latest` is held, an older compatible version is not taken instead. Not changed here.
- **The Update button** (`POST /api/cms/update`) is the owner's own action and is not held by the contract rule.
- **Real lockfiles for PR 3:** the lockfiles of Sara's site and `morpheme-website` are not in this repository; the owner or the CTO
  has to provide versions-only copies.
- A version held for a contract stays held until the theme or app has a version for the new contract (the store offers it) and the
  site has it; this plan does not add a way to tell the owner what to do (PR 2 shows the notice).
