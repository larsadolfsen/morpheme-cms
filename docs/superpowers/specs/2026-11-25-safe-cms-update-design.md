# A CMS update never stops a site's saves

CTO, 25 Nov 2026. Line: **0.19.8** (owner, 25 Nov 2026). Status: approved by the owner on 25 Nov 2026.

## The problem

Owner, 25 Nov 2026: "If a build fails eg. 19.6, a site cant save updates to a page, since the new build fails." The site keeps
showing its last good build, but every save after a bad update is committed to `main` and never goes live.

What happened on Sara's site (`saravafaiblom/Sarashjemmesidedata`, read from its `main`):

1. 20 Nov, 18:07: the nightly update committed 0.16.0 → 0.19.0. Her theme (Venus 1.3.0, a site copy) and four apps don't build on
   0.19, so the build failed. The update was never undone. Since then no build of `main` has passed, and the live site is still the
   0.16.0 build.
2. 21–25 Nov: each newer version (0.19.1 to 0.19.6) was committed and undone exactly 20 minutes later, by the timeout. The builds
   failed within a minute, but the watcher never saw it.
3. Each undo went back to 0.19.0, the version in `package.json` before the update, which was broken itself. So the site never got
   back to a version that builds.
4. Sara's saves of 25 Nov (pages, a price) are on `main`, but none is live.

## Why, in the code (`worker/cms-update.js`, `lib/cms-version.mjs`; the same in 0.16.0)

| Gap | Where |
| --- | --- |
| The update commits straight to `main`, so a version that doesn't build stops every later save. | `startUpdate` commits to `site.head` |
| The undo goes back to `update.from`, the version in `package.json`, not to the version the site runs (`RUNNING`). | `undoCommit` |
| An undo that times out counts as `undone`, even when it didn't build. | `watchStep`, state `undoing` |
| The watcher learns of a failed build only from GitHub's check runs. The site's token is set up with *Contents* only (`worker/publish.js`, `docs/editor.md` > Setup). So the check-runs request most likely gets 403, which sets `noChecks`, and the update is still made, can't be watched, and is undone by the timeout. | `checkOf`, `checkForUpdate` |
| A site's own theme or app folder is never asked about the contract: `heldByContract` skips what isn't from the store, so nothing caught that Venus 1.3.0 can't build on 0.19. | `heldByContract` |

Read-only facts behind the 403 row: Cloudflare's check run is on Sara's commits (`Workers Builds: saravafaiblom-dk`, app
`cloudflare-workers-and-pages`, conclusion `failure`, PR #22). So the run exists, and the watcher's filter matches it. What's left is
the token. A session confirms it before building (*Before building*, 1).

## The design

### 1. Try the update on a branch first

- The update is committed to a branch `cms-update/<version>`, cut from `main`'s head. `main` doesn't change.
- Cloudflare builds the branch as a preview. It's the same `morpheme ci-build` with the same checks, so a version that fails the
  checks or the build fails there.
- **How the Worker learns the result, without check runs.** Each build writes `editor/version.json` (the commit and `builtAt`). The
  editor already reads it to tell when a save is live (`src/deploy.ts`, `worker/push.js`). The Worker reads the same file from the
  branch's preview address.
  - If it names the branch commit, the build passed.
  - If nothing names it within the limit, the build failed.
  - Check runs are used too where the token may read them, because they report a failure sooner. They are no longer needed.
- **Green.** The Worker moves `main` to the branch commit (a fast-forward, never a force) and deletes the branch. The live build of
  `main` follows, and is watched as today.
- **`main` moved meanwhile** (the owner saved). The Worker writes the same update again on top of the new `main` head and commits it
  there. Only content moved, and the version is known to build.
- **Red, or no answer within the limit.** The Worker deletes the branch and notes the reason and the time. `main` was never touched,
  so saves keep going live. The version is tried again 24 hours later (3).

### 2. Go back to the version that runs

- The undo target is `RUNNING`: the version of the Worker that answers, which by definition was built and deployed. It is never the
  version in `package.json`.
- An undo that times out counts as `stuck`, not `undone`, and shows on the CMS page with the build's link.
- **Repair.** When builds of `main` keep failing and `package.json` names a version the Worker committed itself (its own update),
  the Worker commits `RUNNING` back, with any content backup, and all the saves since then go live. It never undoes a version
  change a person made (a pull request, a pin by hand). That case shows only as a failed build (5).

### 3. Every version goes through the branch, a new line too

Owner, 25 Nov 2026: a jump to a new line (0.16 → 0.19) is not held for the owner. It updates automatically, like a patch.

- Every version, a new line or a patch, is tried on the branch first. Only one that builds green reaches `main`.
- The branch build is what makes this safe. It also covers the site's own theme and app folders, which `heldByContract` can't judge.
- **A version that fails is tried again 24 hours later** (owner, 25 Nov 2026: "Why dont try 24h later?"), with the nightly check,
  on a new branch. A fix needn't be a new CMS version: a theme or an app updated from the store, or a change to the site, can make
  the same version build. A newer version on npm is tried instead, when there is one. A retry costs one preview build a day and never
  touches `main`, so there is no limit on retries.
- This replaces today's permanent skip (`cms:skip:<version>`): the record keeps the version, the time of the last try and the reason,
  for the CMS page. The owner can still press Update to try at once.
- `heldByContract` stays as it is. It holds a version whose contract a theme or app from the store doesn't support yet, because that
  site would build but lose the item's look.

### 4. Where the owner sees updates

The CMS page (the update screen) shows held, failed (with the next try) and stuck updates with their reason and the build's link. No banner (owner,
25 Nov 2026).

### 5. A save shows its progress until it is live

Owner, 25 Nov 2026: "I dont want a banner, but a progress indicator would be good."

- After a save, the editor shows a progress indicator until the site is built with it: *Saved* → *Publishing* → *Live*.
  `src/deploy.ts` (`waitForSite`) already knows each step. Today it only shows a message at the end.
- If the build fails, or doesn't include the save within the time `deploy.ts` already allows, the indicator ends as *Not live*. It
  says the save is safe, and that the site's build failed, with the build's link.
- It uses the theme's existing progress indicator (`theme/ui/ProgressIndicator.tsx`, M3 *Progress indicators*). Where it sits (the
  page and post editor's bar, or the start screen) is decided when building. The building session loads `material-3` and reads the
  real M3 pages (Overview, Specs, Guidelines, Accessibility) with Playwright, and the texts follow `site-editor-writing`.
- This covers every cause of a failed build, an update or a save.

## Before building

1. **Confirm why the watcher never saw a failed build.** Read Sara's KV `cms:checked` for `noChecks`, or the CMS page's status (it
   shows `checked`). If it isn't `noChecks`, find the real cause before building. Read-only. The owner said yes on 25 Nov 2026.
2. **Branch builds on a site.** The starter's `wrangler.jsonc` has `"previews": {}`, and Sara's PR branches build. Confirm that a new
   site's Cloudflare project builds non-`main` branches by default, and find the preview's address (to read its `version.json`). If
   previews need a setting, the starter's setup says so.
3. **The token.** Creating and deleting a branch, and moving `main`, need *Contents: Read and write*, which the token already has.
   Confirm that a fast-forward of `main` needs nothing more.

## Getting it to the sites

The new code protects a site only once the site runs it. Sara's site runs 0.16.0 and gets there through PR #22, by hand. Staging
proves it first: an update to a version that fails on purpose (a pre-release from a test branch, never `latest`) must leave
staging's `main` unchanged, and a later save must go live.
