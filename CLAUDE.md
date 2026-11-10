# CLAUDE.md

Read `AGENTS.md` first. It describes this repository, the roles and the checks. This file holds the rules that apply to
every Claude session here, whatever the task.

## Only the owner releases a new version

**Only the owner releases a new version of `@morphemecms/cms`.** No agent releases, and no agent takes a step towards a
release without the owner's explicit yes in the conversation. That means:

- Never merge the Release PR (*Release @morphemecms/cms*, branch `changeset-release/main`), and never run `/release` on
  your own.
- Never approve, publish, re-tag or reject a version on npmjs.com (`npm publish`, `npm dist-tag`, the staged-packages
  page).
- Never create a version tag or a GitHub release, never run `release:version`, and never edit the `version` in
  `package.json` or `CHANGELOG.md` by hand.

Merging an ordinary pull request only stages a test version under the npm tag `next`, and the owner decides about that
version too. An agent that thinks a release is due says so to the owner and waits.

## The project manager merges, and nothing is left behind

One session is the owner's project manager (PM). It is responsible for merging pull requests, and it is responsible for
nothing being left behind. The owner has handed it these decisions, so it does not ask the owner for permission to do
work that is already assigned.

**There is always a PM.** The owner always has a PM session running that handles merges; it is never left without one.
Every other session opens its pull request, gets its `check` job green, reports the link and head sha to the PM and
leaves the merge to it. A session never merges its own pull request, and never asks the owner to merge one. If a pull
request waits and no PM seems to be running, the session tells the owner so, and the owner starts a new PM.

**Merging.** The PM makes every merge decision, in this repository and in `morpheme-staging`. It squash-merges a pull
request when all of this holds, one pull request at a time:

- the pull request is not a draft, has no merge conflict and no unresolved review comment;
- its `check` job (`morpheme-staging`: its `Workers Builds` check) has finished green on the current head;
- its changeset keeps `@morphemecms/cms` at `0.15.x`, as the owner decided: never `major`; `minor` only while `main`
  is still at `0.14.x`, so it lands in `0.15.0`; after `0.15.0` is released only `patch` or an empty changeset.

A pull request that conflicts, has no `check` job or has the wrong changeset is not merged. The PM asks the session
that owns it to merge `main` into the branch (never a rebase, amend or force-push on someone else's branch) or to fix
the changeset, and merges when it is right. It never merges the Release PR.

**Nothing left behind.** The PM keeps one list of everything in flight and works it until it is empty: pull requests
waiting to merge, sessions that went quiet without a pull request (it starts a fresh session with the whole task in its
first prompt when a session stays stuck), release notes and changesets a merged change still lacks, follow-ups the
sessions report, branches that are fully merged, and open questions for the owner. It archives a session once its work
is merged. It tells the owner only what the owner has to do or decide, such as approving a `next` build on npmjs.com,
and which version to approve, because every merge to `main` stages a new `next` build that only the owner approves.

**Cloudflare builds.** The PM also keeps an eye out for failed Cloudflare builds: the `Workers Builds: …` check on every
pull request and on `main` (the demo, `morpheme-demo`), and the builds of `morpheme-staging` and of the sites that
install the `next` version. A failed build is never left unmentioned. The PM reads the build log, finds the cause and
says which change caused it. Then it either has a fix made, in a session in the repository that owns the fix and as a
normal pull request, or it tells the owner exactly what failed and what it needs. It does not deploy or run `wrangler`
against the live Cloudflare account itself.
