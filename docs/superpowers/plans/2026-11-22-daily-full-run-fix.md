# The daily full run: one branch never stops the rest (plan)

Status: **22 November 2026.** Asked for by the owner through the PM of 0.19.5. A single fix: one pull request into `main`, because a
scheduled workflow runs only from the default branch.

## What went wrong

Run 45009509545 of *Daily full run* (`.github/workflows/daily-full.yml`) on `main` (045a2b8) failed in its one step,
`node scripts/daily-full.mjs dispatch`:

- It tried to start `check.yml` with `level=full` on `feature/build-check-speed-a7`. That branch was cut before A5 (last commit 18 Nov),
  so its `check.yml` has no `workflow_dispatch` trigger, and GitHub answered 422 "Workflow does not have 'workflow_dispatch' trigger".
- `api()` (`scripts/daily-full.mjs`, line 78) throws on any response that is not ok, and nothing catches it, so the whole job stopped at
  the first such branch.
- The same run had already left out every other branch, `feature/0.19.5-m3-tokens` among them, as "over today's limit of 6 runs,
  tomorrow". `dispatch` sorts the oldest push first (line 107), and `pick` gives the 6 slots in that order. Of the 21 `feature/*` branches
  on the remote, most are old and finished, so the old ones take the slots and the feature being built never gets one.

## What changes (all in `scripts/daily-full.mjs`, its test and the workflow)

1. **A branch that cannot be dispatched is skipped before it takes a slot.** For each branch, `dispatch` reads its
   `.github/workflows/check.yml` at the head (`contents/.github/workflows/check.yml?ref=<sha>`). A new pure function `canDispatch(text)`
   is true only when the file has the `workflow_dispatch` trigger with the `level` input. `pick` gets a `dispatchable` field and skips a
   branch without it: "check.yml has no workflow_dispatch with level (cut before A5): merge main into it".
2. **One branch's error never stops the run.** The dispatch of each branch is in its own `try`. A 422 is a skip with its reason (as in 1,
   for a race between reading and dispatching). Any other error on one branch (a 5xx, a 404 for a branch deleted while the run went) is
   recorded and the loop goes on. After the loop the job fails only if a branch had such an error, so a real fault is still red, but every
   other branch was dispatched first. The calls that read one branch (compare, statuses, runs, the file) are inside the same per-branch
   `try`: a branch that cannot be read is listed as an error, not a crash. Only listing the refs at the start may stop the job.
3. **The feature being built comes first; stale branches are left out.** `dispatch` reads the open pull requests once
   (`pulls?state=open&per_page=100`). A branch is **active** when an open pull request has it as its head or its base. `pick` orders the
   active branches first (oldest push first among them, as today), then the rest. A branch that is not active and whose last commit is
   more than 7 days old is skipped as "stale: no open pull request and no push for 7 days". The limit of 6 stays and counts only what is
   dispatched.
4. **The job summary says what happened.** `dispatch` writes a table to `$GITHUB_STEP_SUMMARY` (when the variable is set): each branch
   with *dispatched*, *skipped* and the reason, or *error* and the message. `--dry-run` prints the same table to stdout. The PM reads the
   stale ones from it.
5. **Tests** in `scripts/daily-full.test.mjs` for `canDispatch` (the trigger with `level`, without it, with `workflow_dispatch` but no
   `level`, no file), and for `pick` with the new fields: an undispatchable branch takes no slot, active branches come before older
   inactive ones, a stale branch is skipped, and the limit still holds. The dispatch loop gets a test with a fake `api` that answers 422
   for one branch and 500 for another: the others are dispatched, the 422 is a skip, the 500 is an error and the run's result is a
   failure. For that, `dispatch` takes `api` as a parameter (the CLI passes the real one).

The comments at the top of the script and the workflow are updated to match. Nothing else changes: the script still writes only one
dispatch per chosen branch, `markState` and the `mark` mode are untouched.

## Not in this fix

- **Deleting old branches.** The script never deletes a branch. `CLAUDE.md` says the repository keeps only `main`, the Release PR's
  branch, feature branches being built, branches of open pull requests and `screenshots`; the stale list in the summary shows which
  `feature/*` branches break that. Removing them is the owner's call (with the open item on deleting branches and GitHub's
  *Automatically delete head branches* setting); the PM brings the list.
- **Merging `main` into old feature branches** to give them the trigger. A branch that is still being built gets it the next time it takes
  `main`.

## The pull request

- From a branch of its own into `main`, with the changeset the skill `changesets` gives a change to CI scripts only, and the `check` job
  green. The pull request shows what `pick` decides for the 21 `feature/*` branches on the remote today (names, last commit, open pull
  requests, read with `git ls-remote` and the GitHub tools), as the table the summary would print.
- After the merge, the next scheduled run (02:17 UTC) or a manual `workflow_dispatch` of *Daily full run* shows it working: the summary
  lists `feature/build-check-speed-a7` as skipped, `feature/0.19.5-m3-tokens` as dispatched, and the job is green.
