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
| `main` | `minor`, `patch` or empty for the 0.17 work, until `0.17.0` (Release PR #340) is released; after that the owner decides again | the current release (0.17) | — |
| `0.17` | — | there is no `0.17` branch: the 0.17 work merges into `main` | — |
| `0.18` | `minor`, `patch` or empty | the 0.18 work, the editor (`docs/superpowers/plans/2026-11-14-roadmap-0-18-to-0-24.md`) | `main` after each merge into `main` until 0.17 is released; then `main` after each release |
| `0.19` and later | — | 0.19 and later lines follow the roadmap and are cut from `main` when their work starts | — |

A version line's branch is never merged back the other way except as its release (the `pm` skill, *Two version lines at
the same time*). Only `main` has a Release PR and builds `next` and `latest`; every merge to `main` stages a `next` build
that only the owner approves on npmjs.com.

## What happens to the changesets

Each merge to `main` stages a test version under npm's `next` tag for `morpheme-staging`. The *Release* pull request,
merged only when the owner says go (skill `release`), turns the changesets into `CHANGELOG.md` and stages `latest`. A
staged version is on npm only once the owner approves it with 2FA
(`docs/superpowers/specs/2026-11-03-development-flow-and-releases-design.md`). Never edit `CHANGELOG.md` or the
`version` in `package.json` by hand.
