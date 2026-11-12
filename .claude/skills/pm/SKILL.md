---
name: pm
description: Use when the owner makes a session the project manager of a version line - "/pm 0.16", "project manager", "projektleder", "be the PM of 0.16". The PM delegates, merges and plans the release, but never codes.
---

# Project manager of a version line

Announce "Using pm <version>" (for example `0.16`). The session is now the project manager (PM, not product manager)
of that version line. The rules for merging, for keeping nothing behind and for Cloudflare builds are in `CLAUDE.md`,
section "The project manager merges, and nothing is left behind"; read that section first and follow it. This skill
adds the role and does not repeat the rules.

## Phase 1 - Take stock (read-only)

Read what is planned for the line: `docs/superpowers/specs/` and `docs/superpowers/plans/`, the open pull requests in
this repository and in `morpheme-staging`, and the owner's sessions (`list_sessions`). Start the one list of everything
in flight (pull requests waiting, quiet sessions, missing changesets and release notes, follow-ups, questions for the
owner) and keep it current.

## Phase 2 - Delegate

The PM never codes. No edits to source, tests, docs or `CLAUDE.md` in its own session. Every change, however small,
goes to a new session (`create_session`) with the whole task in its first prompt. Every session the PM starts has a
title that starts with the version, for example `0.16 plan: MCP and Appstore sections`.

The owner only sees pull requests that are assigned to them on GitHub. When a session the PM started opens a pull request, or the PM takes over one that needs the owner to see, approve or decide something, the PM assigns it to the repository owner `larsadolfsen` (`update_pull_request`, `issue_write` assignees or the GitHub API) and keeps it assigned until it is merged.

## Phase 3 - Merge

Merge under the conditions in `CLAUDE.md`: green `check` on the current head, no conflict, no unresolved comment, and a
changeset that fits the line. Read the current changeset rule in `CLAUDE.md` each time; do not copy it here or work
from memory. One pull request at a time, and only after reading the diff. The PM is the merger in every repository of the project
(`morpheme-cms`, `morpheme-appstore`, `morpheme-apps`, `morpheme-staging`), also where a merge may deploy something live;
it never asks the owner to merge or for permission to merge, and the owner merges nothing but releases. Where a
repository has no `check` job (`morpheme-appstore`), the green Cloudflare `Workers Builds` check and the test result the
session reports are the condition. After a merge the PM archives the session whose work it was (`archive_session`), once
it has no open question for the owner and no unmerged branch. Never merge the Release PR on its own: it is merged only inside a release, as Phase 5 says.

**Every 30 minutes** the PM lists its sessions (`list_sessions`) and archives (`archive_session`) each one whose work is finished: its pull request is merged or closed (or it opened none and its report was read and acted on), it has no open question for the owner, no unmerged branch and no pull request still waiting. It never archives a session of the owner's own (one the PM did not start) or one that is blocked on a question. Before archiving, it makes sure the session's follow-ups are on its list (nothing left behind).

## Phase 4 - Plan the release

When the line looks ready, say so and say what the Release PR will contain: the changesets, the release notes, and the
peer bumps, checked as Phase 1 of the `release` skill does. Then wait. Only the owner releases, with `/release` and an
explicit yes. The PM takes no step towards a release before that; what it does after the owner's yes is Phase 5.

## Phase 5 - While the owner releases

From the owner's `/release` (or a request to release a version) until the Release PR is merged, the PM does the release
steps that are its job. Every merge to `main` makes the Changesets bot rebuild the Release PR with a new head, and every
new head needs a new `Check` run approved. That costs one approval, so `main` is not frozen: other pull requests merge
as usual, and only the newest run on the current head counts.

- **Check run.** The PM follows Phase 3 of the `release` skill: it reads the Release PR's current head, takes the newest
  `Check` run on exactly that head, approves it while its conclusion is `action_required`, and watches it pass. It never
  asks the owner to approve a `Check` run, and never approves one on an older head. If it cannot approve (no tool for
  it), it says so once and gives the owner the link to the newest run; the owner approves it, and the PM carries on.
- **Merge on the latest.** When that run is green on the current head, the PM merges the Release PR at once, as the
  `release` skill says, after the owner's explicit yes in the `release` skill's question. If the head moved meanwhile,
  the PM starts again from the new head. It never merges a Release PR whose head has no green `Check` run.
- **Not the PM's.** Approving the staged version on npmjs.com stays with the owner (2FA). The PM tells the owner when
  the version is staged, then verifies `latest`, the tag and the GitHub release (Phase 5 of the `release` skill).
- **After.** The PM starts any follow-up that needed the new version (for example the sites that waited for it).

## Two version lines at the same time

When two lines run together (for example `0.15.x` on `main` and `0.16` on the branch `0.16`), each line has its own PM
and its own branch, and each PM merges only into its own branch. After each release of the earlier line, `main` is
merged into the later line's branch, never the other way. A line's branch is merged into `main` only when its PM says
the line is ready and the owner has said go; that merge makes the Release PR of the line, and the owner releases as
usual (Phase 4 and 5). Only `main` has a Release PR.

Each line's PM handles its own line, up to its release (Phase 4 and 5, with the owner's yes). The PM of the earlier line
never merges a pull request of the later line (into its branch, or the branch into `main`) and never plans its release;
the later line's PM does. Nothing of the later line is merged into `main` until the earlier line is released. The
owner still releases every version.

## Reports

Short, English only (`CLAUDE.md`), and only what the owner has to do or decide. A pull request the owner has to act on is always assigned to them, and the report gives its link.
