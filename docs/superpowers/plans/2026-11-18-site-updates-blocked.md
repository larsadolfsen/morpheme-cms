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
  `{ kind: 'contract', detail: '<theme|app> <id>', item, id, has, needs }`. A site's own app (no `store.json`, for example
  Sara's `sara`) is never held. A version whose contracts cannot be read, or a site whose folders cannot be read, is not taken
  either (`unreachable`, tried again the next night): never on a guess.
- The silent returns are recorded (decision 8 of the store auto-updates design): no `GITHUB_PUBLISH_TOKEN` gives
  `{ kind: 'no-token' }`. With no KV binding nothing can be kept, and `cmsStatus` already says `kv: false` to the page.
- Tests: `scripts/check-cms-update.mjs` (run by `npm run check:worker`, cases 13 and 14) with fixture store records.

### What the build session found that the task did not say (changes PR 1)

**The contract of an installed theme is not written on the site.** `store.json` has `version`, `ref` and `files` only
(`StoreRecord` in `src/store.ts`), and `theme.json` has no `api`. An app's `app.json` has `api` (contract 4 and later). So the Worker
cannot read "the contract of a theme" from its store record. What PR 1 does instead: an installed store theme (or an app with no
`api`) is taken to be written to the contract of the CMS the site runs now, because the store offers only what the running CMS
reads. The hold then fires when the version's contract differs from the running one. This holds Sara's site (running 0.16, theme
contract 5, 0.18.0 is 6) and is stricter than needed for a theme that was already re-released.

## PR 2: start screen

A blocked update (`needs-npm`, `contract`, `cannot-write`, a missing token or KV) shows as a notice on the start screen
(`src/cmsNotice.mjs`, `src/UpdatesNotice.tsx`, the start screen's widgets), not only on the CMS page. English first, then `da-DK`
(`src/i18n/`, skill `site-editor-writing`), parts from `src/ui.tsx` only (the `Notice`), release note (skill `release-notes`),
`check:screens` unit in its area's file. `cmsView.mjs` today lists only `unreachable`, `cannot-write` and `not-managed` as problems;
`needs-npm` and `contract` are added.

## PR 3: peers and the test

- Lower each peer floor to the lowest version the CMS needs: `^6.1.5 || ^7.1.0` for `postcss-selector-parser` if the tests pass
  on 7.1.6 (the build session shows the run).
- `scripts/peer-ranges.test.mjs` runs the real `addToLock` on fixture lockfiles (versions only: no content, no customer's name)
  from the previous release's starter and from real sites, and fails on any `NeedsNpm`. Lands after PR 1 is merged.

## Open

- **Sizes:** PR 1 about 150 lines of code and test; PR 2 one notice and its texts; PR 3 a package change and fixtures.
- **A theme's contract is not recorded** (above). A lasting fix is for the installer to write `api` into `store.json`
  (`src/store.ts`, the store's catalog already has it); then the hold can compare the real number. Not in these three PRs; the CTO
  decides.
- **Only the newest version is looked at.** If `latest` is held, an older compatible version is not taken instead. Not changed here.
- **The Update button** (`POST /api/cms/update`) is the owner's own action and is not held by the contract rule.
- **Real lockfiles for PR 3:** the lockfiles of Sara's site and `morpheme-website` are not in this repository; the owner or the CTO
  has to provide versions-only copies.
- A version held for a contract stays held until the theme or app has a version for the new contract (the store offers it) and the
  site has it; this plan does not add a way to tell the owner what to do (PR 2 shows the notice).
