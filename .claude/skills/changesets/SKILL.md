---
name: changesets
description: Use when a session opens or fixes a pull request in morpheme-cms, or a PM checks one before merging - "changeset", "patch", "minor", "major", "npx changeset", "which branch", "0.17", "0.18", "0.19", "version line". Says which changeset a pull request needs, which level its base branch allows, and how the version lines are merged forward.
---

# Changesets and version lines

Announce "Using changesets". Every pull request into `main` or a version line's branch has exactly one changeset in
`.changeset/`. CI (`.github/workflows/check.yml`) fails without one (`npx changeset status --since=origin/<base>`); the
Release PR (`changeset-release/main`) is the only exception.

## Writing the changeset

- `npx changeset`: one file that says whether the change is a `patch`, `minor` or `major` change of `@morphemecms/cms`,
  and one line of release note, in English, for a site's owner.
- `major` only when something a site has stops working as before (the rules of *Appbutikken* in `morpheme-website`'s
  `CLAUDE.md`). A new feature is `minor`, a fix or small tweak `patch`.
- A pull request that changes nothing a site gets (docs, CI, tests only) adds `npx changeset --empty`.
- A change a site owner sees also gets a release note in English and Danish: load the skill `release-notes`. The note's
  `id` is the changeset's file name without `.md`.

## The level the base branch allows

The owner decided that `@morphemecms/cms` stays below `1.0.0`: **never `major`**, on any branch. A pull request with a
level its base branch does not allow is not merged; fix the changeset.

| Base branch | Allowed | What it collects | Merged into it |
| :--- | :--- | :--- | :--- |
| `main` | `patch` or empty until 0.18.1 is released; then the merge of `feature/tailwind` adds one `minor` (it is 0.19.0, owner, 19 Nov 2026), and from 0.19 the first feature of a line `minor`, every other feature and fix `patch` (`docs/superpowers/plans/2026-11-18-release-per-feature.md`) | the next release | — |
| `0.17` | — | there is no `0.17` branch: the 0.17 work merges into `main` | — |
| `0.18` | — | finished (owner, 19 Nov 2026): 0.18.1 is released and nothing goes into `0.18` any more | — |
| `0.19` | — | there is no `0.19` branch: from 0.19 a feature is `feature/<name>` from `main` (`docs/superpowers/plans/2026-11-18-release-per-feature.md`) | — |
| `feature/<name>` | `patch` or empty, plus the one `minor` of a line's first feature, added just before the feature goes into `main` | the pieces of one feature | `main` after each merge into `main` and after each release |

**A line's level is kept by a check, not by care.** `scripts/release-lines.json` is the one place that says which lines have a fixed next release and the highest level
each allows (`allow`) and the version series its releases stay in (`series`); a new line is one edit there, and this table is updated with it. A line whose
next version is to stay a patch release allows only `patch`. `scripts/release-line.mjs` (job `static`, tested in `scripts/release-line.test.mjs`) fails
(a) a pull request into such a line's branch that adds or changes a changeset above `allow` (it compares the pull request's own diff with the base, so files it does not touch
are not checked; the message names the file and the allowed level), and (b) a carry into `main` (`merge-<line>-into-main-<N>`) whose changesets compute a version outside the line's
series (for `0.18`: `0.18.x`, never `0.19.0`). Raising a line's level is the owner's decision and an edit of `release-lines.json`.

A feature branch is never merged into another feature branch; it goes into `main` once (the `pm` skill, *The way of a change*). Only `main` has a Release PR and builds `latest`; every merge to `main` stages a `next` build, which the owner approves on npmjs.com and `morpheme-staging` builds. A merge into a feature branch stages nothing (`publish.yml`).

## What happens to the changesets

Each merge to `main` stages a test version under npm's `next` tag for `morpheme-staging`; a merge into a line stages nothing. The *Release* pull request,
merged only when the owner says go (skill `release`), turns the changesets into `CHANGELOG.md` and stages `latest`. A
staged version is on npm only once the owner approves it with 2FA
(`docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md`). Never edit `CHANGELOG.md` or the
`version` in `package.json` by hand.
