# A release per feature (plan)

Status: approved by the owner on 18 November 2026 ("Approve"), proposed by the owner ("all feature branches when merged into main is
sent to npm") with the CTO's recommendation. **Takes effect after 0.18.2**: 0.18.0, 0.18.1 and 0.18.2 finish as planned.

## The flow

1. **A feature** is a branch from `main`, `feature/<name>`, with its pull requests merged into it (skill `pm`, section 2). A single fix
   is one pull request into `main`.
2. **A test version per feature.** Each push to a feature branch stages a test version on npm, tag `next-<feature>` (the mechanism of the
   CI plan's A6 for version lines, `scripts/publish-next.mjs`). The owner tries it on `morpheme-staging` and says yes; for a change the
   owner can see, that yes is the approval of the whole feature (skill `pm`, section 4).
3. **The merge into `main` is the release.** The PM merges the feature (full check green). The publish workflow then makes the version
   from the feature's changesets (a feature `minor`, a fix `patch`; never `major` below 1.0), commits the version and the changelog to
   `main`, and stages it on npm as `latest`.
4. **The owner releases.** Nothing reaches a site until the owner approves the staged version on npmjs.com with 2FA, as today. Then the
   workflow (or the PM, per the `release` skill) checks that `latest` is the version, and the sites' update check takes it.
5. **No version lines and no Release PR** after 0.18.2. The roadmap becomes an ordered list of features.

Why (owner and CTO, 18 November): small releases that are easy to trace; a finished feature reaches the sites in days instead of when a
whole line is done; no line branches to merge forward; the owner keeps the final say twice, on staging before the merge and on npm
before the sites.

## What stays

- **Only the owner releases** (`CLAUDE.md`): the releasing step is the owner's approval on npm. No agent approves, publishes, re-tags or
  rejects a version on npmjs.com.
- The changesets and the release notes per change (skills `changesets`, `release-notes`); a release's notes are those of its feature.
- The full check on everything into `main` (skill `checks`).

## The pull requests (after 0.18.2 is released)

1. **Test versions from feature branches.** `publish.yml` stages `next-<feature>` on a push to `feature/**` (the job of A6, with the
   feature's name as the tag; a name npm does not accept is made safe and the mapping is tested). The staging site can be pointed at a
   feature's version.
2. **The release on merge.** On a push to `main`, the job `release` no longer opens a Release PR: it runs `release:version`, commits
   the version and `CHANGELOG.md` to `main` as the workflow's bot ("Version X.Y.Z"), and stages `latest`; the job `latest` then makes the
   tag and the GitHub release as today. A push that is the workflow's own version commit stages nothing. A merge with no changeset
   (docs only, an empty changeset) makes no version.
3. **The skills and `CLAUDE.md`.** `CLAUDE.md`, *Only the owner releases a new version* (the steps, not the rule: no Release PR; a merge
   into `main` stages a release; the owner approves on npm); `pm` (no version lines; a feature is approved on its test version before its
   merge; one merge into `main` at a time, each a release); `changesets` (no line table; a feature `minor`, a fix `patch`); `release`
   (the owner's approval on npm and the checks after it; no Release PR phase); `checks` (the levels without lines).
4. **The roadmap and the lines.** The roadmap's lines after 0.18.2 become an ordered list of features; the `0.19` branch's open work
   (owner, 17 November: merge it first if possible) is merged into `main` or moved onto feature branches; the line branches are deleted
   when empty.

## Open points for the PRs

- **Two releases at once:** if two features merge in a row before the owner approves the first, two versions are staged. The PM merges
  the next feature into `main` only after the owner has approved (or rejected) the staged version, and says so in its report.
- **A rejected version:** when the owner rejects a staged version on npm, the next merge makes the next version number; the rejected one
  is never published (npm versions are never reused).
- **Sara's site and the other sites** take `latest` by their update check; nothing changes there.
