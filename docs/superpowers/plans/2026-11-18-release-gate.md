# The release gate: nothing is staged for `latest` until staging runs it (plan)

Status: **ordered by the owner, 18 November 2026**. Owner's words: "the pm keep asking me to release a version that hasnt been tested on staging", "we released 0.18 which wasnt done because of this", "it cant happen again". Written by the CTO for the PM.

## Why a check, not only a rule

The release skill already said to check staging. A session skipped it, because Phase 1 allowed it to "say so in the question" instead of stopping. A rule in a skill can be skipped, so the gate goes into `publish.yml`, the one file npm trusts to stage a version. The skills get the same rule as a hard stop (the docs PR the 0.18 PM has open), but the workflow is what makes it impossible.

## What is built (one pull request into `0.18`)

1. **Staging says which CMS it runs.** `morpheme-staging`'s Worker answers `GET /__staging/version` with the exact version of `@morphemecms/cms` it was built with (`RUNNING`), and `200` only when its own home page and `/editor/` render. This is in the staging site's own Worker (`src/site/worker.js` there), not in the package: other sites do not publish their version. (A pull request in `morpheme-staging`, merged first.)
2. **`publish.yml`, job `release`, step `stage`, before `npm stage publish --tag latest`:** a new `scripts/release-gate.mjs` stops with exit 1, stages nothing, and prints why, unless **all** of these hold:
   - `npm view @morphemecms/cms@next gitHead` is the first parent of the Release PR's merge commit, so the `next` test version is built from exactly the code being released (the Release PR adds only the version and the changelog);
   - `GET https://<staging>/__staging/version` answers `200` with that `next` version, so staging built it, deployed it and renders it.
   The message names the missing step: "next is not built from this code: merge main and approve the new next first", or "staging does not run <version> yet".
3. **The same gate as a check on the Release PR.** `check.yml` runs `release-gate.mjs --check` on `changeset-release/main`, as a job the `check` job waits for. So the Release PR is red until staging runs its code, and nobody can be asked to merge it while it is red.
4. **Tests:** `scripts/release-gate.test.mjs` covers each condition failing and all passing, with `fetch` and `npm view` injected.
5. **The skills** (`release` Phase 1, `pm` section 7): the PM asks the release question only when the gate check is green on the Release PR, and the question gives the staging address and version. It also lists anything the line's plan still has open; with open items, the PM does not ask, it reports them.

## The order of a release, after this

Merge into `main` → `next` test version staged → the owner approves it on npm → staging builds on it → the gate check goes green on the Release PR → the PM asks the release question → the owner says yes, the Release PR merges → the gate passes again → `latest` is staged → the owner approves it on npm.

The release-per-feature flow from 0.19 (`2026-11-18-release-per-feature.md`, revised in the same docs PR) keeps this gate: every release runs on staging first.

## What stays

- Only the owner releases (`CLAUDE.md`): the gate only blocks; it never stages or approves anything by itself.
- The gate reads the version staging really runs (`GET /__staging/version`), never a rebuild trigger. Staging follows only npm's `next` tag (never `next-0.18`), rebuilt by its own hourly check; nothing on the 0.18 line is tried on staging until it is in `main`.
- Staging's own Worker (the app CMS-version, `scripts/cms-rebuild.mjs` in `morpheme-staging`) checks npm every hour and calls its deploy hook, so staging rebuilds when `next` moves.
