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
| `main` | `patch` or empty (never `major`); the number is the one the feature set, not the level (above); `feature/tailwind` sets 0.19.0 (owner, 19 Nov 2026) | the next release | — |
| `0.17` | — | there is no `0.17` branch: the 0.17 work merges into `main` | — |
| `0.18` | — | finished (owner, 19 Nov 2026): 0.18.1 is released and nothing goes into `0.18` any more | — |
| `0.19` | — | there is no `0.19` branch: from 0.19 a feature is `feature/<name>` from `main` (`docs/superpowers/plans/2026-11-18-release-per-feature.md`) | — |
| `feature/<name>` | `patch` or empty, plus the one `minor` of a line's first feature, added just before the feature goes into `main` | the pieces of one feature | `main` after each merge into `main` and after each release |

**The version is set when a feature starts** (owner, 19 Nov 2026; `docs/superpowers/plans/2026-11-19-version-at-feature-start.md`). A feature's first pull request
sets `version` in `package.json` to the number the feature is released as, and runs `node scripts/starter.mjs` so `starter/package.json` pins the same number (`static` runs `node scripts/starter.mjs --check` at every level): the next patch above npm's `latest`, or the next minor `.0` when it starts a line
(roadmap). A single fix straight into `main` sets its version in its own pull request the same way. **A changeset's level (`patch`, `minor`) no longer moves
the version**: Changesets collects the notes and keeps the Release PR, and the release takes the number `package.json` says. No pull request after the
feature's first changes it (the PM's move on a conflict, skill `pm`, is the exception), and `CHANGELOG.md` is still written only by the release.

**The check** (`scripts/version-rule.mjs`, job `static`, tested in `scripts/version-rule.test.mjs`; it replaces the old series check `release-line.mjs` and
`release-lines.json`): on a pull request into `main` and on a feature's first pull request (into `feature/*`, `version` differs from the base's), `version`
is exactly one step above npm's `latest` (next patch or next minor `.0`) and not published; below `latest` fails. A `version` equal to `latest` with a
non-empty changeset fails ("Set the feature's version") once `latest` is 0.19.0 or later; until then (`latest` 0.18.x, before `feature/tailwind` sets 0.19.0)
it passes and Changesets still computes the number, so a fix with a patch or empty changeset keeps working. The level a changeset may have is only the
note's: never `major`; `minor` for a feature that adds something, `patch` for a fix; empty for no release note.

A feature branch is never merged into another feature branch; it goes into `main` once (the `pm` skill, *The way of a change*). Only `main` has a Release PR and builds `latest`; every merge to `main` stages a `next` build, which the owner approves on npmjs.com and `morpheme-staging` builds. A merge into a feature branch stages nothing (`publish.yml`).

## What happens to the changesets

Each merge to `main` stages a test version under npm's `next` tag for `morpheme-staging`; a merge into a line stages nothing. The *Release* pull request,
merged only when the owner says go (skill `release`), turns the changesets into `CHANGELOG.md` and stages `latest`. A
staged version is on npm only once the owner approves it with 2FA
(`docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md`). Never edit `CHANGELOG.md` by hand. The
`version` in `package.json` is set once, by the first pull request of a feature or fix, to the version it will be released as; a
changeset's level no longer moves it once the build of `docs/superpowers/plans/2026-11-19-version-at-feature-start.md` is merged.
