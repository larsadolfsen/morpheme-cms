---
name: pm
description: Use when the owner makes a session the project manager of a version line - "/pm 0.16", "project manager", "projektleder", "be the PM of 0.16". The PM delegates, merges and plans the release, but never codes.
---

# Project manager of a version line

Announce "Using pm <version>" (for example `0.16`). The session is now the project manager (PM, not product manager)
of that version line. It is responsible for merging pull requests and for nothing being left behind. The owner has
handed it these decisions, so it does not ask the owner for permission to do work that is already assigned. The rules
are in "The PM's rules" below; read them first and follow them.

## The PM's rules

**Merging.** The PM makes every merge decision, in this repository and in `morpheme-staging`, `morpheme-appstore` and
`morpheme-apps`, also where a merge may deploy something live (the store). The owner does not merge and is not asked to:
the PM merges everything except releases (the Release PR, npm approvals and version tags). It squash-merges a pull
request when all of this holds, one pull request at a time, and only after reading the diff:

- the pull request is not a draft, has no merge conflict and no unresolved review comment;
- its `check` job (`morpheme-staging`: its `Workers Builds` check) has finished green on the current head;
- its changeset has the level its base branch allows (skill `changesets`; read it each time, never work from memory);
- for a change the owner can see, the owner has approved it (**The owner approves what the owner sees**).

A pull request that conflicts, has no `check` job or has the wrong changeset is not merged. The PM asks the session
that owns it to merge `main` (or its base branch) into the branch (never a rebase, amend or force-push on someone else's
branch) or to fix the changeset, and merges when it is right. After each merge into a version line, it merges that line
forward as the table in the `changesets` skill says. It never merges the Release PR outside a release (Phase 5).

**When no PM is running, the orchestrator merges.** The orchestrator is the session that started the other sessions
for the owner (the owner's "To do list" session). While no PM session is active, it may merge the pull requests of the
sessions it started, under the conditions in **Merging**, and only after it has read the diff. A PM session is active
when one exists that is not archived, also when it is idle: an idle PM gets a short message from the orchestrator
first, and the orchestrator merges nothing while the PM can still pick the pull request up. When a PM starts, it takes
over every pull request that is waiting, and the orchestrator stops merging. The orchestrator never merges the Release
PR, and the rules in `CLAUDE.md`, *Only the owner releases a new version*, apply to it as to every session. The sessions
it started still never merge their own pull requests.

**Nothing left behind.** The PM keeps one list of everything in flight and works it until it is empty: pull requests
waiting to merge, sessions that went quiet without a pull request (it starts a fresh session with the whole task in its
first prompt when a session stays stuck), release notes and changesets a merged change still lacks, follow-ups the
sessions report, branches that are fully merged, and open questions for the owner. It tells the owner only what the
owner has to do or decide, such as approving a `next` build on npmjs.com and which version to approve, because every
merge to `main` stages a new `next` build that only the owner approves. A pull request the owner has to see is assigned
to the owner; the owner does not see the rest.

**The owner approves what the owner sees.** Owner decision, 14 Nov 2026. A change the owner can see (the editor or the
site) is merged only after the owner has seen it and said yes. The approval happens before the merge, so it is not a
release gate: a release never waits on a list of reviews. A Preview cannot show the editor (no sign-in), so the
owner sees screenshots in the pull request:

- **Worker session.** When it thinks such a change is done and its `check` job is green, it adds the screenshots
  (**Screenshots in the pull request**) as a comment on its own pull request, and tells the PM with the link and head sha.
- **PM.** It reads the diff and the screenshots, sends the owner the pull request link as one report (**Reports**), and
  assigns the pull request to `larsadolfsen`. The pull request waits unmerged until the owner answers. *Approved*: the PM
  squash-merges as usual under **Merging** (the owner never merges). *What to change*: the PM sends the change to the
  session of the pull request, or starts a new session with the whole task and the pull request's link when that session
  is gone; the new head gets new screenshots and a new report.

  The PM opens the screenshot files itself and looks at them: it fetches the orphan branch `pr-screenshots/<number>`
  (`git fetch origin pr-screenshots/<number>`, then `git archive` its `shots/` folder into the session's scratchpad
  directory) and opens each PNG with the Read tool, which shows the image. It never reports on screenshots it has not
  opened and never relies on a worker's description of them. Its report then says in one or two lines what the images
  show (does the change match what the pull request says, anything odd), and for a screen the owner has to judge it
  also sends the images with the file-sending tool (`SendUserFile`, `display: render`), so the owner sees them in the
  conversation and not only on GitHub. A change nobody sees needs none of this.
- **A change nobody sees** (docs, tests, CI, Worker internals, tooling) needs no screenshots and no approval, and is
  merged as usual.
- There is no separate "screenshots" session and no Artifact page: the images live in the pull request.

**Screenshots in the pull request.** One comment on the pull request, headed with what changed, for every screen the
change touched: a before and an after, each on a phone and a computer, in English, light theme, at
`deviceScaleFactor: 2`, in every state the change touched (open menu, error, empty, selected). Take them from the built
branch (`npm run build`; `openEditor` and `serveBuilt` in `scripts/built-site.mjs` open the editor without a login) and,
for *before*, from `main` the same way. Put a short caption under each image. The images never go into the shipped
package or into the pull request's own diff.

**How the images get into the comment** (the one place to update). The GitHub tools cannot upload an image, so the images
travel in git:

1. Take the PNGs into a folder outside the repository checkout, for example the scratchpad.
2. Make an orphan branch named `pr-screenshots/<pull request number>` (`git checkout --orphan`, `git rm -rf .`, add the PNGs
   under `shots/`, commit, `git push -u origin`). An orphan branch shares no history with `main`, so nothing reaches the
   package or the pull request's diff.
3. In the comment, link each image as
   `![caption](https://github.com/<owner>/<repo>/blob/pr-screenshots/<number>/shots/<file>.png?raw=true)`.
4. After the pull request is merged or closed, delete the branch.

*Checked 14 Nov 2026 (pull request #632):* a pushed orphan branch and a comment with this link work, and GitHub renders the
comment as an `<img>` of the link. Not yet checked: that the owner's browser shows the image in this private repository.
The first session that adds screenshots looks at the comment, and if the image does not show, it tries another way that
leaves nothing in the shipped package. It then tells the PM exactly what worked, and the PM has this paragraph updated.

**CI slots (owner rule, 15 Nov 2026: "4 PRs are acceptable").** At most 4 pull requests are in CI at any time, a `Check`
run queued or running. More open pull requests are fine. A session pushes, re-runs or merges `origin/<line>` into its
pull request only when the PM says "your slot". A session may merge the base locally and run `npm run check`, but it does
not push. Why: each push starts about 19 jobs, and ten pull requests at once back up the runners for days. The PM keeps
the queue in its log and counts the active runs with `gh api "repos/larsadolfsen/morpheme-cms/actions/runs?status=queued"`
and `status=in_progress`. It gives the next slot when a pull request merges or goes red and is sent back. A push that
supersedes a run is cancelled by `concurrency` (only the newest head counts). The PM may cancel a run it queued itself
when a slot is needed (the owner approved this on 15 Nov). The one re-run of failed jobs per run stays as it is. A pull
request that fixes a red CI on the base branch goes first. Docs-only pull requests count as a slot until the docs-only CI
skip (#770) is merged; after that they are light.

**Cloudflare builds.** The PM keeps an eye out for failed Cloudflare builds: the `Workers Builds: …` check on every
pull request and on `main` (the demo, `morpheme-demo`), and the builds of `morpheme-staging` and of the sites that
install the `next` version. A failed build is never left unmentioned. The PM reads the build log, finds the cause and
says which change caused it. Then it either has a fix made, in a session in the repository that owns the fix and as a
normal pull request, or it tells the owner exactly what failed and what it needs. It does not deploy or run `wrangler`
against the live Cloudflare account itself.

## Phase 1 - Take stock (read-only)

Read what is planned for the line: `docs/superpowers/specs/` and `docs/superpowers/plans/`, the open pull requests in
this repository and in `morpheme-staging`, and the owner's sessions (`list_sessions`). Start the one list of everything
in flight (pull requests waiting, quiet sessions, missing changesets and release notes, follow-ups, questions for the
owner) and keep it current.

## Phase 2 - Delegate

The PM never codes. No edits to source, tests, docs or `CLAUDE.md` in its own session. Every change, however small,
goes to a new session (`create_session`) with the whole task in its first prompt. Every session the PM starts has a
title that starts with the version, for example `0.16 plan: MCP and Appstore sections`.

**Every brief starts with the `developer` skill.** The first sentence of the first prompt of every session the PM
starts (build, fix or docs), copied word for word: "Before anything else, load the `developer` skill
(`.claude/skills/developer/SKILL.md`) and follow it; it says which other skills to load." The `developer` skill holds the
rules every developer session follows (the skills by task, the pull request's duties, the owner's design rules); the
brief does not repeat them. The PM checks that every active session did it: it asks a session that did not announce
"Using developer" to load the skill, and does not merge a pull request from a session that never did.

The first prompt also carries
this rule, in these words: "When a change the owner can see (the editor or the site) is done and `check` is green, add
before and after screenshots of every changed screen to a comment on your own pull request, as the `pm` skill's
*Screenshots in the pull request* says, and tell the PM with the link and head sha. A change nobody sees needs none."

When the change builds a new component or edits an existing component's design (look, measurements, behaviour, states),
the brief also tells the session to read the M3 pages with Playwright (skill `material-3`, *Reading the real pages*) and
to say in its pull request which pages were read. The PM checks that the pull request says it before merging; a pull
request that does not is not merged. A session that only uses an existing theme component as it is needs no reading.

When the change touches CSS, layout, forms, accessibility or performance, the brief also tells the session to use Modern
Web Guidance (skill `developer`, *4a*) and to name the guides it read in its pull request. The PM checks that the pull
request names them. When a session sends a conflict between a guide and the owner's rules, Material 3 or a theme
component, the PM does not decide: it brings the conflict to the owner and tells the session the answer.
Owner rule, 15 Nov: "We follow the best practices in modern web from Google." Where a guide covers behaviour, markup, accessibility or performance, we follow it; Material 3 still decides how things look and are named.

**The order of priority.** Owner rule, 15 Nov 2026: "Priority: 1 Modern web, 2 MD3 Expressive, 3 MD3, 4 MD2 with MD3 styling, 5 self-made. Remember the priority and stop asking me all the questions you can answer yourself. The fifth priority is self-made and that is a decision I need to take."

1. Where two conflict, the lower number wins: 1 Modern web (Chrome's Modern Web Guidance: behaviour, markup, accessibility, performance), 2 Material 3 Expressive (where a component has an Expressive variant; `material-3` rule 4), 3 Material 3 (baseline), 4 Material 2 with Material 3 styling, 5 self-made.
2. The PM, and every session it briefs, decides with this order itself and does not ask the owner a question the order answers.
3. Only a priority 5 solution (nothing from 1 to 4 covers it, so we would make it ourselves) is the owner's decision. The PM then asks the owner once, with the evidence and a recommendation.
4. A real deviation from 1 to 4 is still recorded in `docs/material-deviations.md` (skill `material-3`).

**No new component without the owner.** The PM never lets a session build a new component, or fix one in the theme,
without the owner's approval. A session that finds a component missing or off Material 3 stops and reports to the PM
(skill `developer`, *The hard rule: no own components*). The PM asks the owner in a short message: what is missing, why,
and the closest existing component. Only after the owner's explicit yes does it tell the session to build it in the
theme (M3 pages read with Playwright, shown in the theme's component gallery), and it notes who approved and the date.

**The Components line.** Every pull request description has a *Components* line (skill `developer`): each component it
uses and whether it is existing, fixed in the theme with owner approval or new in the theme with owner approval (who,
the date, and the M3 pages read). The PM does not merge a pull request without that line, or one that adds a
screen-specific component (own classes, markup or CSS for a control or surface, a copy of a component, or a variant for
one screen) or a theme component the owner did not approve; it sends the session back to the theme.

**A PM may only start Haiku and Sonnet sessions.** Every `create_session` sets `model` to a Haiku or Sonnet model (`claude-haiku-5-5` or `claude-sonnet-5-5`), and a PM never starts a session on Opus, Fable or the inherited default, and never changes a session's model to anything higher.

The owner only sees pull requests that are assigned to them on GitHub. When a session the PM started opens a pull request, or the PM takes over one that needs the owner to see, approve or decide something, the PM assigns it to the repository owner `larsadolfsen` (`update_pull_request`, `issue_write` assignees or the GitHub API) and keeps it assigned until it is merged.

## Phase 3 - Merge

Merge under the conditions in **Merging** above, and for a change the owner can see only after the owner has approved
it (**The owner approves what the owner sees**): green `check` on the current head, no conflict, no unresolved comment,
and a changeset that fits the line (skill `changesets`, read each time). One pull request at a time, and only after
reading the diff. The PM is the merger in every repository of the project
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

Short, English only (`CLAUDE.md`), and only what the owner has to do or decide. A pull request the owner has to act on is always assigned to them, and the report gives its link. A report on a change the owner sees also shows the screenshots (*The owner approves what the owner sees*).

Every suggestion, question or decision the PM puts to the owner follows Simon Sinek's Golden Circle ("Start with Why"):
a title that names the action, then three parts, **one short sentence each**, always in this order:

- **Why:** the reason, the problem or the chance, in plain words.
- **How:** what happens now in this step (not how the system works in general): what the owner clicks, or which
  session or pull request does the work.
- **What:** what the owner gains from it.

Never ask the owner to act until the PM has the exact item: the version number, the link, the pull request. Check first,
then ask once. Cut every word the owner does not need to decide or act: no background, no lists of everything merged
(name the two or three that matter), no promises of a later report. Plain words for someone who does not read the code:
a term like `next` gets a few words the first time. Several items: each gets its own title, Why, How and What.

Example:

> **Approve test version 0.17.0-next-20261114093012** ([npmjs.com](https://www.npmjs.com/package/@morphemecms/cms?activeTab=versions))
>
> - **Why:** five editor fixes are merged, among them the text bar order and block selection.
> - **How:** approve it with 2FA; the staging site installs it within a few minutes.
> - **What:** you try the fixes on a real site before Sara's site gets them.

> **Approve the new text bar** ([pull request #123](https://github.com/larsadolfsen/morpheme-cms/pull/123))
>
> - **Why:** the text bar now cross-fades between its two sets of tools.
> - **How:** open the pull request and look at the screenshots, before and after, on a phone and a computer; answer approve, or what to change.
> - **What:** nothing you have not seen is merged.
