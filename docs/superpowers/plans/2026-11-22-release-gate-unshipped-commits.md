# The release gate lets commits through that ship nothing

Status: written by the CTO on 22 Nov 2026 at the 0.19.5 PM's request; the owner chose the change ("change the release gate so docs-only
commits do not block a release", relayed by the 0.19.5 PM). One build session, one pull request into `main`.
**Approved by the owner, 22 Nov 2026** ("Yes and yes").

## Why

The gate (`scripts/release-gate.mjs`, plan `2026-11-18-release-gate.md`) passes only when `npm view @morphemecms/cms@next gitHead` equals
`HEAD^1`, the `main` commit being released. A docs-only merge into `main` publishes no new `next`, but it moves `main` and rebuilds the
Release PR (#1145), so the gate stays red while docs keep landing. On 22 Nov 2026 0.19.5 is held: `next` 0.19.5-next-20261122104224 is
built from `ce5bbc0`, and `main` has since taken #1146, #1148 and #1149, all docs.

## The decision: a commit that changes nothing in the package may differ from `next`

Yes, `main` may be ahead of `next` by commits that change no shipped file. The owner's rule is that the exact build that would be released
has already run on staging (`CLAUDE.md`, *Only the owner releases*). A commit that changes no file in the package's tarball does not change
that build: the package released from `main` is then the same bytes staging ran, apart from the version and `CHANGELOG.md`, which the
Release PR already adds today. Forcing a new `next` for a plan or a skill would test nothing new and only hold releases.

The rule fails closed. A commit counts as shipping nothing only when the gate can prove it from a short list of paths that the package
never ships. Anything else, including a path the list does not name, blocks as today.

## The rule

The gate passes check (a) when `next`'s `gitHead` equals `HEAD^1` (as today), **or** when all of these hold:

1. `gitHead` is an ancestor of `HEAD^1` (`git merge-base --is-ancestor`). A `next` built from a branch that is not in `main` never passes.
2. Every path in `git diff --name-only <gitHead> <HEAD^1>` (added, changed, deleted or renamed, both names of a rename) matches the list
   of unshipped paths, `UNSHIPPED` in `scripts/release-gate.mjs`:
   - `docs/**`
   - `.claude/**`, `.agents/**`, `AGENTS.md`, `CLAUDE.md`
   - `.changeset/*.md` whose front matter is empty (`---` then `---`), i.e. the empty changeset of a docs-only pull request. A changeset
     that bumps a package changes what is released, so it blocks.
3. `package.json` is not among the paths (it is not on the list, so rule 2 already blocks it; the test says so explicitly).

Everything else blocks, including `.github/**` (it changes how the release runs), `scripts/**`, `release-notes/**`, `README.md` and
`CHANGELOG.md` (all shipped or release-relevant). The gate's message names the first path that blocks:
`next is built from ce5bbc0, and main has changed src/foo.ts since: merge main and approve the new next first`.

A test guards the list: no entry of `UNSHIPPED` matches any pattern in `package.json`'s `files`, and `npm pack --dry-run --json` lists no
file under them. If someone adds `docs` to the package later, the test fails rather than the gate letting shipped files through.

When the gate passes this way it says so: `Release gate passed: next is built from ce5bbc0; main is 3 commits ahead with unshipped files
only (docs/…, .claude/…), and staging runs it.`

Checks (b) and (c), staging running `next`'s version and its pages answering 200, are unchanged.

## The changes

- `scripts/release-gate.mjs`: `gate()` takes two new inputs, so the tests need no git: `isAncestor(gitHead, parent)` and
  `changedFiles(gitHead, parent)` returning `{ path, content? }[]` (the content only for `.changeset/*.md`). The command line fills them
  with `git merge-base --is-ancestor`, `git diff --name-only` and `git show <parent>:<path>`. Export `UNSHIPPED` and `isUnshipped(path,
  content)`. A git error fails the gate with its message.
- `.github/workflows/check.yml`, job `release-gate`, and `.github/workflows/publish.yml`, job `release`: the checkout fetches enough
  history to reach `gitHead` (`fetch-depth: 0`, or a `git fetch origin <gitHead>` step before the gate). Keep the comments above both
  steps true.
- `scripts/release-gate.test.mjs`, new tests:
  - equal `gitHead` passes, as today;
  - ahead by `docs/…` and `.claude/…` only passes, and the message names the commits ahead;
  - an empty changeset passes, and a changeset with `'@morphemecms/cms': patch` blocks;
  - each of `src/x.ts`, `package.json`, `scripts/x.mjs`, `.github/workflows/check.yml`, `release-notes/x.md`, `README.md` blocks, and the
    message names the path;
  - a deleted shipped file blocks, and a rename from `docs/` into `src/` blocks;
  - `gitHead` not an ancestor of `HEAD^1` blocks;
  - a git error blocks with its message;
  - `UNSHIPPED` overlaps nothing in `package.json`'s `files` or in `npm pack --dry-run`.
- `docs/superpowers/plans/2026-11-18-release-gate.md`: one line at the top saying the rule for unshipped commits is in this plan.
- The `release` skill: where it describes the gate, one sentence on this rule.

## What it does not change

- The gate's checks (b) and (c) on staging.
- That only the owner releases, approves `next` or merges the Release PR.
- The Release PR's own runs: a new `main` commit still rebuilds it, and its Check run still waits for approval where GitHub holds it. The
  rule only makes that run able to pass.

## Note for the PM: this fix ships

`scripts/release-gate.mjs` and its test are in the package (`files` has `scripts`), so this pull request is not unshipped. After it
merges into `main`, 0.19.5 needs a new `next` built from that commit, run on staging, before the gate can pass. From then on, docs merges
no longer hold the release. The changeset follows the skill `changesets`; the version stays 0.19.5.
