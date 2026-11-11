---
name: release
description: Use when the owner wants to release @morphemecms/cms to the sites - "/release", "release the CMS", "publish to latest", "udgiv CMS'et". Checks the Release PR and staging, asks once, merges the Release PR and verifies npm, the tag and the GitHub release.
---

# Releasing @morphemecms/cms

Announce "Using release". A release reaches every site (the editor updates itself to a new minor or patch), so each
phase is a gate: a failure stops here and is reported with its output verbatim. Never `npm publish` by hand, never
bump a version by hand, never merge anything but the Release PR, never retry a failed publish. Design:
`docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md` (section 4).

Every command shown to the owner starts with `cd C:/Users/adolf/Documents/Interstellar/morpheme-cms && `.

## Phase 1 - Take stock (read-only)

```
gh pr list -R larsadolfsen/morpheme-cms --head changeset-release/main --state open --json number,title,url
gh api repos/larsadolfsen/morpheme-cms/pulls/<n>/files --jq '.[] | select(.filename == "CHANGELOG.md" or .filename == "package.json") | .patch'
npm view @morphemecms/cms dist-tags --json
```

- No open Release PR: stop - "Nothing to release: no changes are waiting (no changesets merged since the last
  release)."
- The Release PR's version: `version` in its `package.json` diff. Its notes: the lines it adds to `CHANGELOG.md`.
- Owner-visible changes: the Release PR must contain `release-notes/i18n/*/<version>.json` for them, and for cards the screenshots in `release-notes/i18n/*/<version>/`; if it does not, say so in the question below.
- Staging: the newest build of the Worker `morpheme-staging` (Cloudflare connector, read-only - list builds). Stop if it
  failed ("Staging's newest build failed: <link>; fix main first"). If it is older than the newest `next` publish, or
  none is found, say so in the question below instead of stopping.
- Staging's channel, set by staging's app CMS-version (the same rule as `scripts/cms-channel.mjs` there): read
  `gh api repos/larsadolfsen/morpheme-staging/contents/src/data/apps.json -H "Accept: application/vnd.github.raw"`.
  If its `installed` list has `cms-version`, the channel is `channel` in `src/data/apps/cms-version.json` (same call);
  else, or if that file is missing or has no `channel`, it is `next`.
  If it is `released`, staging shows the released version, not this one: say so in the question below
  ("Staging shows the released version, so X.Y.Z is not tried there").

- Can sites update themselves? A site's Worker takes a new minor or patch by editing `package.json` and
  `package-lock.json` only (`worker/cms-update.js`, `addToLock` in `lib/lockfile.mjs`); when the lockfile does not already satisfy
  the new version's `peerDependencies`, it stops with `needs-npm` and commits nothing, so the site stays on its old
  version. This happened with 0.15.0 (11 Nov 2026): it raised the minimum of about ten peers (astro, react, vite,
  wrangler, ...) and added `quickjs-emscripten`, and `getmorpheme.com` stayed on 0.12.0. Compare the Release PR's
  `package.json` with the version now on `latest`:
  `npm view @morphemecms/cms@<latest> peerDependencies --json` against the `peerDependencies` in the PR's diff. Any peer
  that is new, or whose lowest allowed version rose, is a **peer bump**. List them in the question below, and say that
  sites with an older lockfile need `npm install` (`morpheme-website` and `morpheme-staging` among them); then, in
  Phase 6, open the update pull request for each of those that stays behind. Prefer not to raise a peer's minimum
  without a reason a site needs: a raise is what blocks the automatic update.

## Phase 2 - Ask

Question box, one question: "Release X.Y.Z to every site?" with the notes and the staging line in the question text.
Options: "Release X.Y.Z", "Not now". Asked every time, also when a standing go-ahead to merge exists. Skipped or
"Not now": stop, change nothing.

## Phase 3 - Merge

The Release PR is opened by Actions' token, so GitHub holds its `Check` run until someone approves it
(`action_required`). `check.yml` skips the changeset step on `changeset-release/main`, so the run can pass.

```
gh run list -R larsadolfsen/morpheme-cms -w Check -b changeset-release/main -L 1 --json databaseId,headSha,conclusion
gh api -X POST repos/larsadolfsen/morpheme-cms/actions/runs/<id>/approve
gh run watch <id> -R larsadolfsen/morpheme-cms --exit-status
gh pr merge <n> -R larsadolfsen/morpheme-cms --merge
```

The run must be on the Release PR's newest commit (`headSha`). Approve it only when its conclusion is
`action_required`. A failed run stops here: report its output.

## Phase 4 - The owner approves on npm

```
gh run list -R larsadolfsen/morpheme-cms -w Publish -L 1 --json databaseId,headSha,status
```

The run must be on the merge commit (`headSha`). When its `release` job has staged X.Y.Z (its *stage* step
succeeded), tell the owner, in the question box: "X.Y.Z is staged. Approve it with 2FA on npmjs.com (the package's
*Staged Packages* tab) or with `npm stage approve <stage-id>` (`npm stage list @morphemecms/cms` shows the id)."
Options: "Approved", "Reject it". Never approve or reject it yourself: npm requires the owner's 2FA, and the approval
is the release. "Reject it": the owner rejects it on npmjs.com; stop and report that nothing was released.

## Phase 5 - Verify

```
gh run watch <id> -R larsadolfsen/morpheme-cms --exit-status
npm view @morphemecms/cms dist-tags.latest
gh release view vX.Y.Z -R larsadolfsen/morpheme-cms --json tagName,url
```

The run's `latest` job (it waits for the approval) must succeed, `latest` must print X.Y.Z (npm can lag a minute:
check up to three times, a minute apart, with a Monitor until-loop), and the release must exist. Anything else: stop
and report.

## Phase 6 - Sites on the new version

If Phase 1 found a peer bump, do this before the report; otherwise skip it. Wait for the sites' hourly check (about an
hour), then look at each pinned site we own (`larsadolfsen/morpheme-website` and `larsadolfsen/morpheme-staging`: the
exact `@morphemecms/cms` in `package.json` on `main`). A site that has not committed *Update Morpheme to X.Y.Z* needs
`npm install` of the bumped peers and `@morphemecms/cms@X.Y.Z`, then its own `npm run check`: open that as a pull request
in the site's repository and give the owner its link; never merge it for the owner. The site's Worker records why in KV
(`cms:checked`, `needs-npm`); the Morpheme page shows it.

## Phase 7 - Report

Version, the release notes, and the links: `https://www.npmjs.com/package/@morphemecms/cms/v/X.Y.Z` and the GitHub
release's URL. Sites get it at their editor's next update check. If the version has release notes, getmorpheme.com's
Worker posts them on its blog within a minute (`https://getmorpheme.com/morpheme-X-Y-Z/` once the site has built;
`worker/release-post.js`).
