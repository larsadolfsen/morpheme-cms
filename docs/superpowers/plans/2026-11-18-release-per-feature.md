# A release per feature, inside version lines (plan)

Status: **approved by the owner, 18 November 2026** ("yes"), revised with the owner the same day. It replaces the version of this plan the owner approved earlier the
same day ("Approve"), which had no version lines and a test version on npm per feature. **Takes effect with 0.19**: 0.18.0 (released) and
0.18.1 (fixes, from `main`) finish as planned; Tailwind (contract 7) is the first feature of the 0.19 line, 0.19.0, followed by accessibility and the
small UI fixes (owner, 19 November 2026; Tailwind was 0.18.2); the pre-built editor is a feature of 0.21 Build speed (it was 0.18.3). The demo editor (below) can start at once.

The owner's words, 18 November:

- "I still want major releases such as 0.18, but I want the feature releases into it one at a time."
- "We don't have to merge them to npm" (no test version on npm per feature).
- "I want fast turnarounds and releases." Then "Approve" for a release per feature inside its line.
- "So I can review on demo": the demo's editor without sign-in, guarded by four points ("1-4 then").

## The flow

1. **A line is an area of the roadmap** (0.19 Tailwind and UI fixes, 0.20 maturity, 0.21 build speed …). Its first feature is released as `0.19.0`, each
   next feature as `0.19.1`, `0.19.2` … The line changes when the roadmap moves to its next area. A feature that raises the contract
   for themes or apps (`THEME_API`, `APP_API`) starts the next line.
2. **A feature** is a branch from `main`, `feature/<name>`, with its pull requests merged into it (skill `pm`, section 2). A single fix
   is one pull request into `main` and is released the same way. There are no line branches.
3. **The owner reviews the feature on the demo.** Cloudflare builds a Preview of the demo for the feature branch. The PM sends the owner
   its link; the owner opens the site and the editor there (the demo editor, below) and says yes. That yes approves the feature (skill
   `pm`, section 4). Every feature is also reviewed on its demo Preview, whatever it changes.
4. **The merge into `main` stages a test version.** The PM merges the feature (full check green). The publish workflow stages a test
   version under the npm tag `next`; the owner approves it on npmjs.com; `morpheme-staging` (channel `next`) builds on it.
5. **Only after staging's build succeeds is the release staged.** The PM checks that the newest `morpheme-staging` build succeeded on
   exactly the `-next-` build of the merge commit (owner rule, 18 November: "Never release a product that hasn't been seen on staging").
   Only then does the publish workflow make the version from the changesets, commit it and `CHANGELOG.md` to `main`, and stage it on
   npm as `latest`, and only then does the PM ask the owner "Release X.Y.Z to every site?". Nothing reaches a site until the owner
   approves the staged version on npmjs.com with 2FA, as today. The sites' update check then takes it, at night (`worker/cms-update.js`).
6. **One at a time.** The PM merges the next feature into `main` only after the owner has approved (or rejected) the staged version,
   and says so in its report. So there is never more than one version waiting.

**A release is one bite** (owner, 19 November 2026: "split releases up in bites that make sense"). A release is one thing a site's
owner, a theme or app author, or the owner can notice and check on one Preview, and it works and is worth having without the next
one. A feature with parts that can each be released alone is split into them; parts that only make sense together (a check and the
fixes that make it pass, a test and the migrations it shows are missing) stay one release; a part with nothing a site gets (a
refactor, CI, docs, deleted branches) has no version of its own and goes with the release that uses it, or beside the line. Every
design ends with its releases, cut this way, and the roadmap lists them.

**A line that changes the UI ends with a fix release** (owner, 19 November 2026: "Everything that changes ui, must end with a fix
release"). The last release of such a line, `X.Y.N` *UI fixes*, holds only fixes (`patch` changesets): what the owner and the checks
found in the line's screens, sheets, blocks and pages on the demo and on staging, and the owner's list of small fixes. Nothing new goes
into it. The next line starts only after it. A line that changes nothing a person sees (for example Build speed) has none.

The demo's production branch (Workers > `morpheme-demo` > Settings > Build > Branch control) is the feature being built, which the owner sets; the demo never shows the live site (owner, 19 November 2026: "It is used to show the current dev. Main is pushed to NPM as next and is shown on staging"). In short: branch → feature → `next` → live.

Why (owner and CTO, 18 November): the big releases stay as the roadmap's areas, a finished feature reaches the sites in days, the owner
reviews every feature where it can be seen (site and editor) before its merge, every version is seen on staging before a release is asked,
and the owner approves every release on npm before the sites get it.

## The demo editor without sign-in

On the demo and on every Preview of it, `/editor/` opens without signing in. It reads the demo's made-up content from the built site, as
`scripts/editor-screens.mjs` does with Playwright today; a save works and stays in the browser; a reset brings back the demo's content.
Nothing is written to GitHub. Guarded by four points (owner, "1-4 then"):

1. **Not in the package.** Only the demo's build (`scripts/demo-build.mjs`, not in the package) adds it, for example as a service worker
   that answers the editor's calls to the Worker (session, files, saves) from the built site's files and keeps saves in the browser
   (IndexedDB). The package has no code path that skips sign-in and no setting that turns one on.
2. **A check stops it.** `check:starter` fails when the editor of a site built from the starter opens without sign-in.
3. **The demo has nothing to lose.** Made-up content, no keys, saves in the browser only. The GitHub sign-in key that the Worker
   `morpheme-demo` has today (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: it sends a visitor to GitHub, which then refuses the demo's
   address) is removed in Cloudflare's dashboard.
4. **Only the owner gets in.** Cloudflare Access in front of `morpheme-demo`'s `workers.dev` address and its Preview addresses, allowing
   the owner's email only (Workers › `morpheme-demo` › Settings › Domains & Routes). A job that ever reads the deployed demo uses an
   Access service token; today's checks run on a local build and need none.

## What stays

- **Never release a product that hasn't been seen on staging** (owner, 18 November): the `next` test version is approved by the owner and
  built on `morpheme-staging` before `latest` is staged and the release question is asked.
- **Only the owner releases** (`CLAUDE.md`): the releasing step is the owner's approval on npm. No agent approves, publishes, re-tags or
  rejects a version on npmjs.com.
- The changesets and the release notes per change (skills `changesets`, `release-notes`); a release's notes are those of its feature.
- The full check on everything into `main` (skill `checks`).

## The pull requests

1. **The demo editor** (can start now, a feature into `0.18`): points 1 and 2 above, PR 1 a proof that the editor opens and saves on a
   Preview. Points 3 and 4 are the owner's, in the dashboard; the PM tells the owner when the editor is merged.
2. **The release on merge** (after 0.19.0 is released). On a push to `main`, the job `release` no longer opens a Release PR: it first
   stages the test version `next` (the owner approves it; staging builds on it), and runs `release:version` only after staging's build
   of that `-next-` version has succeeded: it commits the version and `CHANGELOG.md` to `main` as the workflow's bot ("Version X.Y.Z")
   and stages `latest`; the job `latest` then makes the tag and the GitHub release as today. A push that is the workflow's own version
   commit stages nothing. A merge with no changeset (docs only, an empty changeset) makes no version.
3. **The skills and `CLAUDE.md`.** `CLAUDE.md`: *Only the owner releases a new version* (the steps, not the rule: no Release PR; a merge
   into `main` stages a release; the owner approves on npm) and *Reports to the owner are short* (the PM sends the Preview link of every
   feature, also for the editor, once the demo editor is merged); `pm` (a feature is approved on its Preview before its merge; one
   merge into `main` at a time, each a release); `changesets` (the first feature of a line `minor`, every other feature and fix
   `patch`; never `major` below 1.0); `release` (the owner's approval on npm and the checks after it; no Release PR phase); `checks`
   (the levels without line branches).
4. **The roadmap and the branches.** The roadmap's sections from 0.19 on are the lines, each an ordered list of features; the `0.19`
   branch's open work (owner, 17 November: merge it first if possible) is merged into `main` or moved onto feature branches; the line
   branches are deleted when empty.

## Open points for the PRs

- **A rejected version:** when the owner rejects a staged version on npm, the next merge makes the next version number; the rejected one
  is never published (npm versions are never reused). The rejected feature is fixed on its branch and reviewed again.
- **The sites** take the CMS's newest `latest` by themselves, once a night (`worker/cms-update.js`); nothing changes there. Themes and
  apps follow `specs/2026-11-14-store-auto-updates-design.md`.
