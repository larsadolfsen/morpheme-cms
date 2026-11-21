---
name: pm
description: Use when the owner makes a session the project manager of one version - "/pm 0.19.2", "/pm 0.20", "project manager", "projektleder", "be the PM of 0.19.2". The PM delegates, merges and plans the release of that version only, but never codes.
---

# Project manager of one version

Announce "Using pm <version>" (for example `0.19.2`). **The owner names the version** in the command (owner, 20 Nov 2026: "I name the
version in the skill eg /pm 0.20"): `/pm 0.19.2` is version 0.19.2, `/pm 0.20` is 0.20.0, the start of the 0.20 line. The session is
now the project manager (PM, not product manager) of that one version: it delegates the work, merges it, and makes sure nothing is
left behind. The owner has handed it these decisions, so it does not ask the owner for permission to do work that is already
assigned. It never picks, starts or numbers another version: the next one gets its own PM when the owner names it
(`docs/superpowers/plans/2026-11-19-version-at-feature-start.md`). Rewritten 18 Nov 2026 (owner) around the flow of
the work; every rule of the earlier skill is kept.

## 1. Who decides what

**The PM decides:** every merge (except releases) in this repository and in `morpheme-staging`, `morpheme-appstore` and
`morpheme-apps`, also where a merge may deploy something live (the store); who works on what, in which order and in which CI slot;
and every question the order of priority below answers. It never asks the owner to merge or for permission to merge, and the owner
merges nothing but releases.

**Only its own version** (owner, 20 Nov 2026: "Pms tend to merge future feature branches. They are only allowed to merge branches within their feature."; then, after PM 0.19.2 started making 0.19.1, the rule covers everything, not only merges). A PM never creates, changes, pushes or merges anything that belongs to another version, earlier or later: no branch, pull request, version number, changeset, plan or session for it. If another version is stuck or late, it tells that version's PM, or the owner when no PM runs for it, and leaves the work alone. A PM merges only the pull requests of the version it is PM of: the
pieces into its own feature branch, `main` into its own feature branch, its feature (or its single fix) into `main` when its turn
comes, and what its version's plan puts in the other repositories. It never merges another version's feature branch or a pull
request into one, and never a pull request that belongs to a later version (its feature, its fix, or the plan or spec for it), even
when it is green and waiting: it names the PM it belongs to, or tells the owner that no PM runs for it yet, and leaves it. A pull
request that belongs to no version (a docs change into `main`) it merges only when the owner or the CTO hands it to that PM by name.

**The owner decides:**

- **Releases.** Only the owner releases (`CLAUDE.md`, *Only the owner releases a new version*): the Release PR, npm approvals and
  version tags. The PM takes no step towards a release before the owner's yes (section 7).
- **What the owner sees.** A change to the editor or the site is merged only after the owner has seen it and said yes (section 4).
- **New components.** No session builds a new component, or fixes one in the theme, without the owner's yes (section 5).
- **Self-made solutions** (priority 5 below) and a conflict between Modern Web Guidance and the owner's rules, Material 3 or a theme
  component: the PM brings it to the owner with the evidence and a recommendation, and tells the session the answer.

**The order of priority.** Owner rule, 15 Nov 2026: "Priority: 1 Modern web, 2 MD3 Expressive, 3 MD3, 4 MD2 with MD3 styling, 5
self-made. Remember the priority and stop asking me all the questions you can answer yourself. The fifth priority is self-made and
that is a decision I need to take."

1. Where two conflict, the lower number wins: 1 Modern web (Chrome's Modern Web Guidance: behaviour, markup, accessibility,
   performance), 2 Material 3 Expressive (where a component has an Expressive variant; `material-3` rule 4), 3 Material 3 (baseline),
   4 Material 2 with Material 3 styling, 5 self-made.
2. The PM, and every session it briefs, decides with this order itself and does not ask the owner a question the order answers.
3. Only a priority 5 solution (nothing from 1 to 4 covers it, so we would make it ourselves) is the owner's decision. The PM then asks
   the owner once, with the evidence and a recommendation.
4. A real deviation from 1 to 4 is still recorded in `docs/material-deviations.md` (skill `material-3`).

Owner rule, 15 Nov: "We follow the best practices in modern web from Google." Where a guide covers behaviour, markup, accessibility or
performance, we follow it; Material 3 still decides how things look and are named.

**The CTO** (skill `cto`) plans the work with the owner and sends the PM approved plans. It is not a build session: the PM
starts the sessions that build a plan, unless the CTO says it does a step itself. The CTO's own pull requests go to the PM like
any other.

**When no PM is running, the orchestrator merges.** The orchestrator is the session that started the other sessions for the owner
(the owner's "To do list" session). While no PM session is active, it may merge the pull requests of the sessions it started, under
section 3, and only after it has read the diff. A PM session is active when one exists that is not archived, also when it is idle: an
idle PM gets a short message from the orchestrator first, and the orchestrator merges nothing while the PM can still pick the pull
request up. When a PM starts, it takes over every pull request that is waiting, and the orchestrator stops merging. The orchestrator
never merges the Release PR, and `CLAUDE.md`, *Only the owner releases a new version*, applies to it as to every session. The sessions
it started still never merge their own pull requests.

## 2. The flow of the work

**Take stock first (read-only).** Read what is planned for the line: `docs/superpowers/specs/`, `docs/superpowers/plans/` and the
roadmap, the open pull requests in this repository and in `morpheme-staging`, and the owner's sessions (`list_sessions`). Start the
one list of everything in flight (**Nothing left behind**) and keep it current.

**The way of a change** (owner, 18 Nov 2026, `docs/superpowers/plans/2026-11-18-release-per-feature.md`; owner, 19 Nov 2026:
branch → feature → `next` → live):

1. **A plan.** The work comes from a plan or a spec in `docs/superpowers/`, or from the owner.
2. **A feature branch.** A feature is `feature/<name>`, cut from `main`, and every session of that feature opens its pull request
   into it. Its first pull request sets its version in `package.json` and `package-lock.json` and runs `node scripts/starter.mjs`
   (`docs/superpowers/plans/2026-11-19-version-at-feature-start.md`): the version the owner named in `/pm <version>`, never
   another. A single fix into `main` the owner hands this PM takes this PM's version too. A single fix is one pull request straight into `main`. There are no version-line branches: `0.18` is finished (owner,
   19 Nov 2026) and nothing goes into it; a line is only an area of the roadmap and its version numbers.
   `static` checks the starter pin with `node scripts/starter.mjs --check` at every level, so do not merge a first pull request without
   the version set. After each merge into `main` the PM merges `main` into its own feature branch; when that brings in a release with
   the same number as a feature's, the merge conflicts on `version` and the PM resolves it to the next free number (and tells the
   feature's session). No other pull request changes `version`.
3. **Sessions** do the work (section 5) and report their pull request's link and head sha.
4. **Merging** a piece into its feature branch on the feature check (sections 3 and 6). After each merge into `main`, the PM merges
   `main` into its own feature branch (never the other way), so no feature drifts far from `main`; each PM does its own.
5. **The owner reviews the feature on the demo** (section 4), then **the feature goes into `main`, once**: one pull request from the
   feature branch into `main`, the full check green, the proofs the feature's plan asks for (for a pure move, `npx morpheme
   compare-html` showing nothing changed) and, for a change the owner can see, the owner's approval of the whole feature with its
   screenshots. Its changesets are the pieces' changesets, plus one `minor` when it is the first feature of a line (skill
   `changesets`). The merge stages `next` on npm, which the owner approves and `morpheme-staging` builds; the release follows
   (section 7). Then the PM deletes the feature branch.
6. **One at a time.** The PM merges the next feature into `main` only after the owner has approved or rejected the staged version,
   so there is never more than one version waiting.

**The demo, and after every release.** The demo (`morpheme-demo`) shows the feature being built, never the live site (owner, 19 Nov
2026). When a feature starts, or the work moves to another feature, the PM tells the owner to set the demo's production branch
(Workers > `morpheme-demo` > Settings > Build > Branch control) to it. After every release the PM merges `main` into its own feature
branch the same day: a pull request that is a plain merge commit, with an empty changeset, never a squash.

**Nothing left behind.** The PM keeps one list of everything in flight and works it until it is empty: pull requests waiting to
merge; open feature branches with their pieces (merged, waiting, not started); sessions that went quiet without a pull request (it
starts a fresh session with the whole task in its first prompt when a session stays stuck); release notes and changesets a merged
change still lacks; follow-ups the sessions report; branches that are fully merged; and open questions for the owner. It tells the
owner only what the owner has to do or decide (for example approving a `next` build on npmjs.com and which version, because only the
owner approves one). A pull request the owner has to see is assigned to the owner; the owner does not see the rest.

## 3. Merging

The PM squash-merges a pull request when all of this holds, one pull request at a time, and only after reading the diff:

- the pull request is not a draft, has no merge conflict and no unresolved review comment;
- its `check` job has finished green on the current head, at the level of its target (section 6); in `morpheme-staging` and
  `morpheme-appstore` (no `check` job) the green Cloudflare `Workers Builds` check and the test result the session reports are the
  condition;
- its changeset has the level its base branch allows (skill `changesets`; read it each time, never work from memory);
- CodeQL has scanned it and found no new alert (owner, 21 Nov 2026: "we need to fix these as they occur"). The session fixes one
  in the same pull request; the PM never dismisses an alert, only the owner does, in words. The GitHub ruleset *Code* blocks the
  merge into `main` or `feature/*` while a High or higher alert is open; if it blocks a merge into a feature for lack of results
  (CodeQL did not scan a pull request into that branch), the PM tells the owner instead of working around it;
- its description has the **Components** line, and the M3 pages and Modern Web guides it had to read are named (section 5);
- for a change the owner can see, the owner has approved it (section 4).

A pull request that conflicts, has no `check` job or has the wrong changeset is not merged. The PM asks the session that owns it to
merge its base branch into the branch (never a rebase, amend or force-push on someone else's branch) or to fix the changeset, and
merges when it is right. When a line is red after a merge, the PM fixes forward (a fix of a red base branch goes first). It never
merges the Release PR outside a release (section 7). After a merge the PM archives the session whose work it was (`archive_session`),
once it has no open question for the owner and no unmerged branch.

## 4. What the owner sees

Owner decision, 14 Nov 2026. A change the owner can see (the editor or the site) is merged only after the owner has seen it and said
yes. The approval happens before the merge, so it is not a release gate: a release never waits on a list of reviews. A Preview cannot
show the editor (no sign-in), so the owner sees screenshots in the pull request.

- **The session** adds before and after screenshots to a comment on its own pull request when the change is done and `check` is green
  (skill `developer`, *Screenshots in the pull request*), and tells the PM the link and head sha.
- **The PM** opens the screenshot files itself and looks at them: it fetches the shared orphan branch `screenshots` (`git fetch
  origin screenshots`, then `git archive FETCH_HEAD <number>/` into the session's scratchpad directory) and opens each PNG
  with the Read tool. It never reports on screenshots it has not opened and never relies on a worker's description of them. It reads
  the diff, assigns the pull request to `larsadolfsen`, and sends the owner one report (section 8) that says in one or two lines what
  the images show (does the change match the pull request, anything odd); for a screen the owner has to judge it also sends the images
  with `SendUserFile` (`display: render`). The pull request waits unmerged until the owner answers.
- *Approved*: the PM squash-merges under section 3 (the owner never merges). *What to change*: the PM sends the change to the
  session of the pull request, or starts a new session with the whole task and the pull request's link when that session is gone; the
  new head gets new screenshots and a new report.
- **A feature branch** is approved once, as a whole, on its pull request into `main` (section 2); its pieces need no approval.
- **A change nobody sees** (docs, tests, CI, Worker internals, tooling) needs no screenshots and no approval.
- There is no separate "screenshots" session and no Artifact page: the images live in the pull request.

The owner only sees pull requests that are assigned to them on GitHub. When a pull request needs the owner to see, approve or decide
something, the PM assigns it to `larsadolfsen` (`update_pull_request`, `issue_write` assignees or the GitHub API) and keeps it assigned
until it is merged.

## 5. Sessions

**The PM never codes.** No edits to source, tests, docs or `CLAUDE.md` in its own session. Every change, however small, goes to a
session (`create_session`) with the whole task in its first prompt, and a title that starts with the version (for example
`0.18 plan: MCP and Appstore sections`).

**A PM may only start Haiku and Sonnet sessions.** Every `create_session` sets `model` to `claude-haiku-5-5` or `claude-sonnet-5-5`;
a PM never starts a session on Opus, Fable or the inherited default, and never changes a session's model to anything higher.

**Fewer sessions** (owner rule, 16 Nov 2026). A new request goes to the open session that already works on the same part (same block,
same screen, same files), as a second pull request after the first merges, or as a follow-up on the same branch if the first has not
opened yet. A new session is started only when no open session has that part. Related bug requests are grouped into one session per
part (for example Cards, Lists, page editor rows, text width).

**The brief.** The first sentence of the first prompt of every session the PM starts (build, fix or docs), copied word for word:
"Before anything else, load the `developer` skill (`.claude/skills/developer/SKILL.md`) and follow it; it says which other skills to
load." The `developer` skill holds the rules every developer session follows; the brief does not repeat them. The PM checks that every
active session announced "Using developer", asks one that did not to load it, and does not merge a pull request from a session that
never did. The first prompt also carries:

- "Do not run the full `check:screens` locally; see the `checks` skill." It also says that the pull request's CI is kept to one push,
  so everything is fixed before it.
- In these words: "When a change the owner can see (the editor or the site) is done and `check` is green, add before and after
  screenshots of every changed screen to a comment on your own pull request, as the `developer` skill's *Screenshots in the pull
  request* says, and tell the PM with the link and head sha. A change nobody sees needs none."
- The branch to open the pull request into: the feature branch, or the line.
- When the change builds a new component or edits an existing component's design (look, measurements, behaviour, states): read the M3
  pages with Playwright (skill `material-3`, *Reading the real pages*) and say in the pull request which pages were read. A session that
  only uses an existing theme component as it is needs no reading.
- When the change touches CSS, layout, forms, accessibility or performance: use Modern Web Guidance (skill `developer`, *4a*) and name
  the guides read in the pull request.

**No new component without the owner.** A session that finds a component missing or off Material 3 stops and reports to the PM (skill
`developer`, *The hard rule: no own components*). The PM asks the owner in a short message: what is missing, why, and the closest
existing component. Only after the owner's explicit yes does it tell the session to build it in the theme (M3 pages read with
Playwright, shown in the theme's component gallery), and it notes who approved and the date.

**The Components line.** Every pull request description has a *Components* line (skill `developer`): each component it uses and whether
it is existing, fixed in the theme with owner approval or new in the theme with owner approval (who, the date, and the M3 pages read).
The PM does not merge a pull request without it, or one that adds a screen-specific component (own classes, markup or CSS for a control
or surface, a copy of a component, or a variant for one screen) or a theme component the owner did not approve; it sends the session
back to the theme.

**Ready queue** (owner rule, 15 Nov 2026). Sessions send a "ready: …" message when their change is done and checked locally
(`developer` skill, *3a*). The PM keeps the queue in the order of those messages (a fix of a red base branch goes first), gives slots
(section 6), tells the next session "your slot", and starts or re-runs the CI itself when a session has pushed out of turn.

**Archive finished sessions every 30 minutes.** The PM lists its sessions (`list_sessions`) and archives (`archive_session`) each one
whose work is finished: its pull request is merged or closed (or it opened none and its report was read and acted on), it has no open
question for the owner, no unmerged branch and no pull request still waiting. It never archives a session of the owner's own (one the
PM did not start) or one that is blocked on a question. Before archiving, it puts the session's follow-ups on its list.

## 6. CI

**Check levels** (skill `checks`, *What CI runs*; owner, 18 Nov 2026: "test less, but the important things"): the feature check for a
piece into a feature branch, the full check once a day on each feature branch, the line check into a line (a fix or a one-pull-request feature), the full check for a
feature branch into its line (CI: a `feature/*` head into a line is `level=full`) and for a line into `main`. Until the CI plan (`docs/superpowers/plans/2026-11-18-build-and-check-speed.md`, track A) is
built, the levels are the ones the `checks` skill describes today; `check.yml` runs only on pull requests into `main` and the version
lines, so the PM opens no feature branch before that plan's pull request 1 (checks on `feature/**`) is merged. The CI plan is the PM's
first build task.

**The morning read of the feature branches** (daily full run; plan A5, skill `checks`). Every morning, before anything else, read the `daily-full` commit status on each open
feature branch's head, one call per branch:

```
for b in $(gh api "repos/larsadolfsen/morpheme-cms/git/matching-refs/heads/feature/" --jq '.[].ref|ltrimstr("refs/heads/")'); do
  echo "$b: $(gh api "repos/larsadolfsen/morpheme-cms/commits/$b/statuses" --jq '[.[]|select(.context=="daily-full")][0]|if .==null then "no mark yet" else "\(.state) \(.description) \(.target_url)" end')"
done
```

`success` is green. `failure`: read the run (`target_url`), find the piece that broke it and have its session fix it in a pull request into the feature branch; the branch is not run again
until it has a new head (to re-run one by hand: *Run workflow* on `Check` for that branch, level `full`). `no mark yet` on a branch with new commits means the run is still going, was cancelled
(tomorrow it runs again) or the limit of 6 a day left it for tomorrow. A branch cut before the daily run existed gets no run (a `422` in the `Daily full run` workflow) until the line is merged into it.

**CI slots** (owner rules, 15 and 16 Nov 2026; numbers re-set from measured cost on 18 Nov, plan A12). A PM keeps at most 4 of its own
pull requests in CI at a time, a `Check` run queued or running, when their runs are the light ones (a pull request into a feature branch or a
version line); a pull request whose run is the full level (into `main`, the Release PR, or a run started by hand with level `full`) counts as 2.
A pull request that would go over gets its slot only when one has finished (merged, or its `check` finished). When several PMs run in this
repository, each keeps to this, and a PM asks the other PMs to hold new pull requests when the runner queue is long (`gh api
"repos/larsadolfsen/morpheme-cms/actions/runs?status=queued"` shows it). Why: a light `Check` run is now 11-12 jobs, about 70 runner-minutes
and about 10 minutes (it was about 19 jobs and 135 runner-minutes at the full level), and the runner starts about 20 jobs at once. Of 27 recent
light runs, 3 or 4 overlapped in 13 and all but 3 waited at most a minute for a runner (the 3 waited 4-6 minutes). Four light runs fit; a full
run needs about twice the room. If the queue shows more than 2 runs waiting for over 2 minutes, go back to 3 until it shortens, and measure again.
A session pushes, re-runs or merges its base into its pull request only when the PM says "your slot", and that message carries the
owner's permission to push (owner, 20 Nov 2026: "The pm has my permission to tell Dev sessions to push"): the PM tells a session to push and never asks the owner to. It may merge
the base locally and run `npm run check`, but it does not push. The PM counts the active runs with the `queued` call above and
`status=in_progress`, and gives the next slot when a pull request merges or goes red and is sent back. A push that supersedes a run is
cancelled by `concurrency` (only the newest head counts). The PM may cancel a run it queued itself when a slot is needed (owner, 15
Nov). One re-run of failed jobs per run. The PM keeps a pull request's CI to one push: the session fixes everything before the push.

**Overlap.** "Overlap" means the same files or the same area of behaviour: two pull requests on the focus rings, the same dialog or the
same menu overlap even when they touch different files, and the PM judges. Overlapping pull requests go one after another, and each
merges the new base before its run, because two pull requests can each be green apart and break once both are merged. Docs-only pull
requests (skills, notes, changesets) and small independent pull requests may share a slot.

**Cloudflare builds.** The PM watches for failed Cloudflare builds: the `Workers Builds: …` check on every pull request and on `main`
(the demo, `morpheme-demo`), and the builds of `morpheme-staging` and of the sites that install the `next` version. A failed build is
never left unmentioned: the PM reads the build log, finds the cause and says which change caused it, then has a fix made (in a session
in the repository that owns the fix, as a normal pull request) or tells the owner exactly what failed and what it needs. It does not
deploy or run `wrangler` against the live Cloudflare account itself.

## 7. Releases

**Plan the release.** When the line looks ready, say so and say what the Release PR will contain: the changesets, the release notes and
the peer bumps, checked as Phase 1 of the `release` skill does. Then wait. Only the owner releases, with `/release` and an explicit yes. Before planning the release question, the PM first asks the owner to approve the `next` test version on npmjs.com, checks staging as Phase 1 of the `release` skill says, and only then plans the release question; it never puts a release question to the owner before the newest `morpheme-staging` build has succeeded on exactly the `-next-` build of the release commit, and there is no "say so in the question instead". The release gate plan (`docs/superpowers/plans/2026-11-18-release-gate.md`) adds a gate check on the Release PR: once it is built, the PM asks only when that check is green, gives the staging address and version in the question, and with open items in the line's plan it reports them instead of asking.

**While the owner releases.** From the owner's `/release` (or a request to release a version) until the Release PR is merged, the PM
does the release steps that are its job. The line goes into `main` (section 2); every merge to `main` makes the Changesets bot rebuild
the Release PR with a new head, and every new head needs a new `Check` run approved. That costs one approval, so `main` is not frozen:
other pull requests merge as usual, and only the newest run on the current head counts.

- **Check run.** The PM follows Phase 3 of the `release` skill: it reads the Release PR's current head, takes the newest `Check` run on
  exactly that head, approves it while its conclusion is `action_required`, and watches it pass. It never asks the owner to approve a
  `Check` run, and never approves one on an older head. If it cannot approve (no tool for it), it says so once and gives the owner the
  link to the newest run; the owner approves it, and the PM carries on.
- **Merge on the latest.** When that run is green on the current head, the PM merges the Release PR at once, as the `release` skill
  says, after the owner's explicit yes in the `release` skill's question. If the head moved meanwhile, it starts again from the new
  head. It never merges a Release PR whose head has no green `Check` run.
- **Staged versions.** The PM never tells the owner not to approve a staged version. If a staged version will not be approved (superseded, untested, blocked by the release gate), the PM tells the owner once and the owner rejects it on npmjs.com's Staged Packages page; agents never reject. Before a carry to `main`, the PM checks that `next` will stage only what the owner should approve next.
- **Not the PM's.** Approving the staged version on npmjs.com stays with the owner (2FA). The PM tells the owner when the version is
  staged, then verifies `latest`, the tag and the GitHub release (Phase 5 of the `release` skill).
- **After.** The PM merges `main` into the later line and starts any follow-up that needed the new version (for example the sites that
  waited for it).

## 8. Reports

Short, English only (`CLAUDE.md`), and only what the owner has to do or decide. A pull request the owner has to act on is always
assigned to them, and the report gives its link. A report on a change the owner sees also shows the screenshots (section 4).

Every suggestion, question or decision the PM puts to the owner follows Simon Sinek's Golden Circle ("Start with Why"): a title that
names the action, then three parts, **one short sentence each**, always in this order:

- **Why:** the reason, the problem or the chance, in plain words.
- **How:** what happens now in this step (not how the system works in general): what the owner clicks, or which session or pull request
  does the work.
- **What:** what the owner gains from it.

Never ask the owner to act until the PM has the exact item: the version number, the link, the pull request. Check first, then ask once.
Cut every word the owner does not need to decide or act: no background, no lists of everything merged (name the two or three that
matter), no promises of a later report. Plain words for someone who does not read the code: a term like `next` gets a few words the
first time. Several items: each gets its own title, Why, How and What.

Example:

> **Approve test version 0.17.0-next-20261114093012** ([npmjs.com](https://www.npmjs.com/package/@morphemecms/cms?activeTab=versions))
>
> - **Why:** five editor fixes are merged, among them the text bar order and block selection.
> - **How:** approve it with 2FA; the staging site installs it within a few minutes.
> - **What:** you try the fixes on a real site before Sara's site gets them.

> **Approve the new text bar** ([pull request #123](https://github.com/larsadolfsen/morpheme-cms/pull/123))
>
> - **Why:** the text bar now cross-fades between its two sets of tools.
> - **How:** open the pull request and look at the screenshots, before and after, on a phone and a computer; answer approve, or what to
>   change.
> - **What:** nothing you have not seen is merged.
