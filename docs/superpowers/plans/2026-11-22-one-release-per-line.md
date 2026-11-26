# One release per line (plan)

Status: **approved by the owner, 22 Nov 2026.** It replaces "a release per feature" (`plans/2026-11-18-release-per-feature.md`,
*From 0.19: a release per feature* in the roadmap) from 0.20 on. Written by the CTO.

## The decision

Owner, 22 Nov 2026: "Instead, I propose that we don't do minor versions, so we don't release 19.1, 19.2, etc. So even though we do
batches and we approve them on staging, we just open up the next batch to continue the work on the major release. So we only do 19, 20,
21, etc." The CTO proposed three points, and the owner answered "I agree" to all three:

1. An urgent fix stays possible as `0.N.1`, only when the owner calls it.
2. 0.19.5 is released as the last patch release, and 0.19.6 and 0.19.7 fold into 0.20. The owner then changed it: "Except I want a
   19.6, and that is a merge between 19.6 and 19.7 because there's a lot of small fixes I want to have done before 20." So 0.19.6 is one more release, holding both. On 25 Nov 2026 the owner split it again and then took the split back ("let's continue with 0.19.7 in 0.19.6, but not before the last is merged"): 0.19.8 is the last patch release (*The change over*).
3. The plan and the rule changes go as one docs pull request (this one).

## The rule

- **A line is released once, as `0.N.0`.** The roadmap's lines (0.20, 0.21 …) are the releases. Each item of a line is a **batch**,
  no longer a release. The numbers the roadmap gives the items (0.20.1, 0.21.2 …) only order the batches.
- **A batch goes the same way as a feature did.** It is a feature branch (`feature/<name>`) reviewed on the demo, merged into `main`,
  built as `next` and run on `morpheme-staging`, where the owner approves it. Then the next batch starts. One batch at a time into
  `main`, as before (skill `pm`, *One at a time*).
- **Only the whole line goes live.** When every batch of the line's plan is on staging and approved, the owner says `/release`. The
  Release PR, the release gate and the skill `release` work as today; they run once per line.
- **The version is the line's.** Every batch of a line sets `version` to `0.N.0`. The first batch's first pull request sets it, and
  `main` carries it from then on, so later batches find it already set (skill `changesets`). The version conflicts between features
  built side by side go away, because they share the number.
- **The notes are the line's.** Every batch adds its notes to `release-notes/i18n/*/0.N.0.json` (skill `release-notes`); the release
  shows them together.
- **One PM per line** (`/pm 0.20`), for all its batches (skill `pm`).
- **The urgent fix.** Only when the owner calls it in words, a fix for a bug that breaks a live site is released as `0.N.1` (then
  `0.N.2` …) without waiting for the next line. Its path is below. Nothing else is released between lines.

## The urgent-fix path

`main` holds the next line's unreleased batches, so a fix to the released line cannot be released from `main`.

1. The PM the owner names cuts `hotfix/0.N` from the last release tag of the line (`v0.N.0`, or the last `v0.N.x`).
2. The fix is one pull request into `hotfix/0.N`. It sets `version` to the next patch (`0.N.1`), with a `patch` changeset, its release
   note and `node scripts/starter.mjs`.
3. A merge into `hotfix/0.N` stages `0.N.1-fix-<time>` under the npm tag `fix` (`publish.yml`). The owner approves it on npm, and
   `morpheme-staging` is switched to the channel `fix` (its *CMS version* app), so staging runs it.
4. The Release PR for `hotfix/0.N` and the release gate check against `fix` instead of `next`. The owner says `/release`, as for a line.
5. The fix goes into `main` as an ordinary pull request, and staging goes back to the channel `next`.

Until the path is built (batch B below), an urgent fix waits, or the owner decides to release `main` early.

## The change over

- **0.19.5** is released as soon as the release gate allows it (`plans/2026-11-22-release-gate-unshipped-commits.md`).
- **0.19.6 was released on 25 Nov 2026; 0.19.7, 0.19.8 and 0.19.9 are the last patch releases (0.19.9, the Accessibility section: owner, 26 Nov 2026; `specs/2026-11-26-page-accessibility-design.md`)** (one PM, `/pm 0.19.6`, branch `feature/0.19.6-m3-names`, version
  `0.19.6`). Its batches:
  1. **Material 3 names**, contract 8, with the full-screen dialog back (moved from 0.20.0; owner, 22 Nov 2026: "Yes, move the names into 096. Also move phosphor icons as in a store icon into it, so Sarah can get it. And also the full screen dialog should be there.";
     `specs/2026-11-20-material-3-names-design.md`).
  2. **Phosphor in the store**, parts 1 and 2 (part 2 is #1211; `specs/2026-11-14-icon-packs-in-the-store-design.md`).
  3. **The Divider** (#1196) and the UI fixes already merged (A1 to A3, B4).
  4. Not in 0.19.6; they ship in 0.19.7 and 0.19.8 (owner, 25 Nov 2026: "everything we have started ships along saras fix as 0.19.7, and then the rest in 0.19.8"): **Cards** (`specs/2026-11-25-cards-multi-aspect-design.md`, then `specs/2026-11-25-cards-highlighted-design.md`),
     **the editor in Material 3** (`plans/2026-11-21-0-19-6-editor-in-material-3.md`, 8 batches) and **the UI fixes left**
     (`plans/2026-11-22-0-19-7-ui-fixes.md`: the demo-blocks rule of A, B5 to B18, C20).

  Owner, 25 Nov 2026, after 0.19.6 was released: "everything we have started ships along saras fix as 0.19.7, and then the rest in 0.19.8" (`plans/2026-11-22-0-19-7-ui-fixes.md`, *Release*). The Icons screens and the pack's own page are 0.31.0 (owner, 25 Nov 2026: "finish and keep it for 0.31").
- **0.20 keeps four items** (safe updates, store auto-updates, an app's Worker code in a sandbox, UI fixes) as its batches, released once
  as 0.20.0.
- **The PMs:** `/pm 0.19.6`, `/pm 0.19.7`, then the PM of 0.19.8, then `/pm 0.20`.

## Changed in this pull request

- `CLAUDE.md`: *The flow* and *Pull requests go to the PM* say one release per line, with the urgent-fix exception.
- The roadmap: *Releases at a glance* and the 0.19 and 0.20 sections.
- The skills `changesets`, `pm` and `release`: the version is the line's, `/pm 0.20`, a release is a whole line or an urgent fix.
- The 0.19.6 and 0.19.7 plans: a line at the top saying they are now the plans of 0.19.7 and 0.19.8.

## To build (two pull requests into `main`, for the 0.20 PM)

- **A. The version check.** `scripts/version-rule.mjs` (job `static`): into `main`, `version` is the next line's `0.N.0`, never a
  patch; into `hotfix/*`, it is exactly the next patch of that line. Tests in `scripts/version-rule.test.mjs` for both, and for a
  patch into `main` failing with "A line is released as 0.N.0; a patch is only an urgent fix on hotfix/0.N".
- **B. The urgent-fix path.**
  - `publish.yml`: a push to `hotfix/*` stages `-fix-` versions under the tag `fix`, and gets its own Release PR.
  - `scripts/release-gate.mjs`: it takes the tag (`next` or `fix`) from the branch.
  - The skill `release`: the hotfix case.
  - The staging app *CMS version* (`morpheme-staging`): it offers the channel `fix`.
  - Tests for each part.
