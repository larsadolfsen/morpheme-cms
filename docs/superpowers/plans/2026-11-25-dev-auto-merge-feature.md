# Developers auto-merge their pull requests into a feature branch

Owner, 25 Nov 2026: yes to developers merging their own pull requests into a feature branch with GitHub's auto-merge, the PM keeping
`main`, and a plan for it. Why: a PM that forgot to merge left fourteen pull requests waiting. With no two open pull requests sharing a
file (owner, 25 Nov 2026), the merge itself is safe; what the PM still checked by hand moves into CI, so GitHub can merge the moment a
pull request is ready and nobody can forget.

## What stays as it is

- The PM gives "your slot" (no file of the session's change is in an open pull request; the CI slots of `pm` section 6) and keeps the
  order of the work. Sessions still check in with "ready: …" first.
- Every pull request into `main` (a feature into `main`, a single fix, the Release PR at a release) is merged by the PM, by hand, after
  reading the diff. Only the owner releases.
- A feature is approved by the owner once, as a whole, on its pull request into `main` (`pm` section 4); its pieces need no approval.
  Screenshots of visible changes are still posted on each piece.

## Facts the plan rests on (read 25 Nov 2026)

- `check.yml` runs only on `pull_request` (and the daily full run); a merge into a feature branch runs no check on the feature's head.
- `static` checks that a changeset exists (`changeset status`), not its level; `scripts/version-rule.mjs` already has `levelOf`.
- Nothing checks the pull request description (the Components line, the M3 pages and Modern Web guides named).
- CodeQL runs as GitHub's default setup (no workflow file); whether it scans a pull request into a feature branch is not yet checked.
- `check` always reports (no `paths-ignore`; a docs-only change skips the heavy jobs), so a required `check` never leaves a pull
  request waiting forever. The daily full run already writes `daily-full` on a feature's head once a day.
- The repository belongs to a personal account, which has no merge queue, so GitHub does not bring a waiting pull request up to date
  by itself.

## Step 1: GitHub settings (the owner; an agent cannot change them)

Only after step 2 has merged into `main` and `main` into the feature branch (2e): a required check that no workflow on the feature
branch runs would leave every pull request into it waiting, the PM's own merges included. Item 3 can be checked at once.

1. Settings > General > Pull requests: turn on *Allow auto-merge*; keep squash merging allowed.
2. The ruleset for `feature/*` (add it to the existing *Code* ruleset, or a new one): *Require status checks to pass* with `check` and `pr-body` (step 2), **without** *Require branches to be
   up to date*. Why not up to date: with no merge queue, every merge would make every other open pull request out of date and need a
   new full run; with no shared files the risk it guards is small, and step 2c checks the feature's head after each merge instead.
3. Check that CodeQL scans a pull request into `feature/**` (Security > Code scanning, a test pull request). If it does not, the CI
   session of step 2 adds an advanced-setup CodeQL workflow for `pull_request` into `main` and `feature/**` (the repository is public, so
   it costs nothing).
4. Until steps 1 and 2 are in place nobody turns auto-merge on: a branch with no required check would be merged at once.

## Step 2: CI (one developer session, pull request into `main`)

a. **`pr-body`**: a small workflow of its own (`.github/workflows/pr-body.yml`, `pull_request` types `opened`, `edited`,
   `synchronize`, `reopened`, into `main` and `feature/**`) with one job, `pr-body`, running `scripts/pr-body.mjs` (with tests): the
   description has the lines `Components:`, `M3 pages:` and `Web guides:`, each with a value (`none` and a reason is a value). A job of its
   own, so fixing the description re-runs only this, not the whole `Check`.
b. **The changeset's level**: a step in `static` using `levelOf` that fails on a level the base does not allow, by the table in skill
   `changesets` (*The level the base branch allows*); the script reads the rule from one place and the skill names the script.
c. **The feature's head after a merge**: `check.yml` also runs on `push` to `feature/**`. A push has no base branch, so `changes` takes the
   feature level and the diff `before..after` of the push (in doubt: full), and `static` skips the changeset and version steps (as the
   daily run does). Concurrency per ref; a newer merge cancels an older run (only the newest head counts). A red run is a red base
   (`pm` section 3): the PM turns auto-merge off on the waiting pull requests into that feature (`disable_pr_auto_merge`) until it is green
   again, and the session of the newest merge looks first.
d. The rule goes into skill `checks`, *What CI runs*.
e. A pull request runs the workflows of its base branch, so the PM merges `main` into each running feature branch once this has merged;
   only then does step 1 start.

## Step 3: the skills and `CLAUDE.md` (docs session, pull request into `main`, after steps 1 and 2 work)

- `CLAUDE.md`, *Pull requests go to the PM*: a pull request into a feature branch is merged by GitHub's auto-merge, which its session
  turns on; one into `main` is merged by the PM. "Never merges its own pull request" becomes "never merges a pull request into `main`".
- `developer` 3 and 3a: on "your slot": merge `origin/<base>`, run `npm run check`, push, open the pull request, turn on auto-merge
  (`enable_pr_auto_merge`, squash), and watch it (`subscribe_pr_activity`). If GitHub refuses because the pull request is already
  mergeable, the session merges it itself (`merge_pull_request`, squash) once `check` and `pr-body` are green on the current head. Before
  it turns auto-merge on, the feature's newest push run (2c) is green; while it is red, the session waits. Screenshots (3b) go on the pull
  request in the turn it is opened; they do not hold the merge. A red `check` or `pr-body` is fixed locally and pushed on a
  new slot. The session stays until it is merged, then reads the `Workers Builds` checks and the push run of 2c on the merge commit, and
  sends the PM `merged: <link>, <merge sha>, builds green` (or red, with the cause, and fixes it forward first). Into `main`: as today,
  `green: <link>, <head sha>` and the PM merges.
- `pm` 3: pieces of a feature merge themselves; the PM merges into `main` only. The PM's checks every 30 minutes (its two scheduled
  tasks) look for what is stuck: a pull request without auto-merge, one green but not merged, one red with no session working on it, a
  failed build or a red push run on the feature. It archives a session after its `merged:` report.
- `pm` 5 *The Components line* and section 3's description checks: CI checks the lines are there; the PM still reads the feature's
  whole diff on its pull request into `main`.

## Step 4: switching on, pilot and rollback

When the step 3 pull request has merged, the PM sends every running session of its feature the new text of `developer` 3 and 3a, and
changes the prompts of its two scheduled merge checks to the new `pm` 3 (they no longer merge pieces by hand). The first three pull requests that merge themselves are watched by the PM: merged only when green, the push run of 2c ran, the
builds were read, the `merged:` report came. Then it is the rule. If something goes wrong, the owner turns *Allow auto-merge* off and
the PM merges by hand as before; nothing else needs undoing.

## Gaps closed

- A branch with no required check would merge at once: settings first, a test pull request, then the rule (step 1.4).
- Two pull requests with different files can still break each other: the run on the feature's head after each merge (2c).
- Editing the description does not re-run `Check`: `pr-body` is its own workflow (2a).
- CodeQL may not scan pull requests into a feature branch: checked in step 1.3, with a workflow as the fallback.
- A session that ends before its merge leaves nobody to read the builds: it stays until merged and reports (step 3).
- Two sessions pushing overlapping files at the same time: the PM still gives the slots, one at a time.
- Auto-merge cannot be turned on for a pull request that is already mergeable: the session merges it itself (step 3).
- More pull requests merging onto a red feature: the PM turns their auto-merge off until the head is green (2c).
- Running sessions and the PM's scheduled tasks still carry the old rule: updated at switch-on (step 4).
- A required check missing from the feature branch would block every pull request into it: CI first, merged into the feature, then the
  settings (step 1, 2e).
- A push run has no base branch for `changes` and the changeset step: it uses the push's diff and skips those steps (2c).
