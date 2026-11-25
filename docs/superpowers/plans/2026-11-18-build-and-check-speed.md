# Build and check speed: one plan

Status: one plan since 18 November 2026 (owner: "merge the CI plan with what we planned to optimize build speed"). It joins the CI plan of
18 November (owner approved: "test less, but the important things") and the build-speed plan of 15 November (planned with the owner:
all eight options). Their decisions are unchanged; what is new is the shared building blocks, which are built once and used by both.

**Both tracks are built in 0.18** (owner, 18 November 2026: "ask the PM to implement it in 0.18").

Two tracks, one goal: **a change reaches the owner sooner**, as a green check on a pull request (track A) and as a live page after a save
(track B).

| Track | What | When |
| :--- | :--- | :--- |
| A. CI | the checks on pull requests: check levels, build once, touched areas | 0.18 (pull request 1 is #920) |
| B. Site builds | a save on a site goes live sooner: content lane, kept outputs, faster install, incremental builds | 0.18 (owner, 18 November 2026); batch 1's site part may go out before it |

## The shared building blocks

Built once, by whichever track needs them first, and used by both. Each is a small module in `lib/` with its own test. A2 means track A's pull request 2, B2 track B's batch 2.

1. **Outputs kept by their inputs.** An output (the editor's built bundle, the image sizes, the video stills, a check's build) is stored
   with a key made of the hash of everything it is made from, and reused when the key matches; never by file times (a fresh clone gives
   every file a new time). Track A keeps them in GitHub Actions' cache and artifacts (A2); track B in the build cache or the live site
   (B2, B6). One key function, so both agree on what "unchanged" means.
2. **What a change affects.** One map from changed paths to what they affect: the screens areas a pull request runs (A3), the lane of a
   site build (B1: content or full) and the pages an incremental build renders (B8). An unknown path affects everything, in both
   tracks.
3. **A faster install.** `npm ci` with the cache and no network checks (`prefer-offline`, no audit, no fund), and the browser for the
   screens check installed only where screens run, cached (A2, B5).
4. **Measure before and after.** Every pull request of either track measures what it speeds up (a CI run or a site build), before and
   after, and writes the numbers into this plan.

## Track A. CI: test less, but the important things

The levels are in the `checks` skill, *What CI runs*; feature branches in the `pm` skill, section 2.

### Where the time goes today (the full run of #888)

The full run of #888 (merge of 0.18 into `main`, run 44215891251, 18 November) took 18 minutes and about 135 runner-minutes:

| Job | Time each | Note |
| :--- | :--- | :--- |
| `starter`, 4 shards | 14–17 min | the long pole; it runs the editor's screens again on the starter site |
| `screens`, 8 shards | 6–8 min | |
| `screens-extra` | 4 min | |
| `static` | 2.5 min | `npm run check` 2 min |
| `demo` | 1 min | |

Every browser job repeats `npm ci` and `npm run build` (about 35 s) and installs Chromium (15 s to almost 4 min). A pull request into a
version line runs the light check (`static` and the 8 shards), about 8 minutes. `check.yml` runs only on pull requests into `main`,
`0.17`, `0.18` and `0.19`.

### The levels (the target)

| Merge | Check | Aim |
| :--- | :--- | :--- |
| A piece into `feature/<name>` | `static`, build, core screens, touched areas | 3–4 min |
| Each feature branch, daily | full | |
| Into a version line | `static`, core screens, touched areas, `demo`, starter smoke | 5–6 min |
| A line into `main`, the Release PR | full, all starter shards | about 9 min after PR 2 and 4 |

**Always:** Prettier, types, `npm run check`, the changeset, the build, the core screens, the screens of what changed. When in doubt
(an unknown path, an error in the selection), everything runs, as `scripts/ci-changes.mjs` does today.

### The pull requests, in this order

1. **Checks on feature branches.** Done: #920 (18 November). `check.yml` also runs on pull requests into `feature/**`; `ci-changes.mjs` gives the level from the
   base (`feature`, `line`, `full`) and its test covers each. The feature level runs the core set and the touched areas since PR 3. The PM
   opens no feature branch before this is merged.
2. **Build once, cache Chromium.** One job builds the editor and the demo and uploads them; the screens, `screens-extra`, `demo` and
   starter jobs download them instead of building. The Playwright browser is cached (`~/.cache/ms-playwright`, keyed on the Playwright
   version). Proof: the same run, timed before and after.
3. **Touched areas and the core set.** Built (see *A3 as built*). A map from source paths to the screens' area files (`scripts/screens/*.mjs`), kept next to
   them and tested (every source folder maps to an area or to "all"), and a fixed core list of units that always run. The feature and
   line levels run the core set and the mapped areas; a path the map does not know runs all shards.
4. **Starter smoke test.** Built (see *A4 as built*). `check:starter --smoke`: the starter packs and builds, and the editor opens, edits, saves and publishes on it.
   The line level runs the smoke test; the full level keeps all 4 shards.
5. **Daily full run on feature branches.** A scheduled workflow runs the full check on each open `feature/*` branch once a day and
   marks the branch's last commit; the PM reads it every morning.
6. **Test versions from a version line.** The publish workflow stages a `next` build from a version line's branch (for example
   `0.18.0-next-…` from `0.18`), so the line goes into `main` only at its release (`pm` skill).

Each pull request updates the `checks` skill's *What CI runs* to what it built, and `scripts/ci-changes.test.mjs`. No test is skipped,
disabled or deleted to save time: a unit leaves a level only by being outside the core set and outside the touched areas.

Added 18 November 2026 (owner: "optimize everything"), found in the workflow, the full run of #888 and the runs of the CTO's
docs pull requests:

7. **`static` does not build twice.** `npm run check` runs `npm run build` and Prettier on every file, so `static` builds the editor and
   the demo again beside the screens jobs. It reuses the shared build (A2); at the feature and line levels Prettier checks only the
   changed files and `tsc` keeps its build info (`.tsbuildinfo`) in the cache; the full level checks everything as today.
8. **Screens parts balanced by time.** The 8 parts took 5.5 to 8.5 minutes. The units are split by their measured time (kept from the
   last full run), so the slowest part sets a shorter wall time; the number of parts is chosen from the same numbers.
9. **No demo build for a docs-only push.** Cloudflare's Workers Builds builds `morpheme-demo` on every push of every branch, docs
   included. Its build watch paths (Settings > Build > Build watch paths; developers.cloudflare.com/workers/ci-cd/builds/build-watch-paths/)
   exclude `docs/*`, `.claude/*`, `.changeset/*` and the root Markdown files. A dashboard setting, not code: the owner sets it (or tells
   who may); the PM checks the next docs pull request skips the build.
10. **A cancelled run is not a failure.** A push that supersedes a run cancels it (`concurrency`), and the job `check` then fails with
    "cancelled, must be success", so every superseded head reports a red `check` that sessions investigate. The job `check` reports a
    run cancelled by a newer push as cancelled (not failed); a job that fails is still a failure.
11. **A fast local check.** `npm run check:fast`: Prettier on the changed files, `tsc` with its build info, `npm run check:language` and
    the tests next to the changed files. The `developer` and `checks` skills ask for it before a push; CI runs the rest. `npm run check`
    stays for the full local run.
12. **CI slots follow the cost (built: see A12 as built).** When A2, A3 and A7 are merged and a feature check takes a few minutes, the `pm` skill's limit of 3 runs
    per PM is set again from the measured queue (more runs when they are short), so the slots do not become the bottleneck.

A2 and A7 use building blocks 1 and 3; A3 and A8 build on block 2; A11 uses block 2 for "the tests next to the changed files".

### A5 as built (the daily full run on feature branches)

Files: `.github/workflows/daily-full.yml` (the schedule), `check.yml` (a `workflow_dispatch` entry and the mark), `scripts/daily-full.mjs` (the decisions),
tested in `scripts/daily-full.test.mjs`.

- **How the full level runs on a branch with no pull request: one definition, by dispatch.** `check.yml` gained `workflow_dispatch` (input `level`, only `full`). The
  scheduled workflow does not repeat any job: it dispatches `check.yml` on each chosen branch. Why not `workflow_call`: a called workflow checks out the *caller's*
  sha, so every checkout of the jobs would need a `ref:` input; a dispatch runs the branch's own copy of `check.yml` on the branch's own head, and no job changed.
  On a dispatch the job `changes` prints the full level without a diff (the same output as its "git diff failed" fallback: `level=full`, everything runs, all starter
  shards, Prettier on every file); `static` skips the changeset check (no base branch); the job `check` marks the head instead of reading a pull request's head.
- **The mark: the commit status `daily-full`** on the head the run tested (`github.sha`), written by the job `check` with `gh api repos/<repo>/statuses/<sha>`:
  `success` when every job passed, `failure` otherwise, with the run's link as its target. One call reads it:
  `gh api repos/larsadolfsen/morpheme-cms/commits/<branch>/statuses --jq '[.[]|select(.context=="daily-full")][0]|{state,description,target_url}'`
  (newest first). The `pm` skill has the morning command for every feature branch.
- **Decisions (`pick`, pure):** a branch is run when it is `feature/**`, has a commit `main` lacks, its head has **no** `daily-full` status yet and no full run is queued or
  running. A head with a green *or red* `daily-full` is not run again: it has not changed since (a push makes a new head with no status). At most 6 runs a day, oldest
  push first; the rest wait for tomorrow. `daily-full.yml` has its own concurrency group (one dispatcher at a time) and `check.yml`'s group for a dispatch is the
  branch's ref, so one run per branch and a pull request's runs never cancel it.
- **A cancel is not a red mark.** `markState` returns no state when a job was cancelled and none failed (a manual cancel, a lost runner, a timeout): `check` writes no status,
  and tomorrow's run starts again. A failed job, or a job skipped that must run, is `failure`.
- **Cost.** One full run is about 135 runner minutes (see above). At most 6 runs a day is at most about 810 runner minutes a day, and only on a day a branch has a new head.
  The repository is public, so Actions minutes are free; the only price is the shared queue, and the dispatcher runs at 02:17 UTC (after the Danish evening, before the morning).
  Branches that did not change cost nothing (the dispatcher itself is one 20-second job). The PM's CI slots (`pm` skill, section 6) do not count these runs.
- **Permissions.** `daily-full.yml`: `contents: read`, `statuses: read`, `actions: write` (needed only to dispatch `check.yml`; the script names no other workflow, and a test
  fails if it names another, or a merge, tag, release or publish endpoint). `check.yml`'s job `check`: `statuses: write` beside `contents: read` and `pull-requests: read`; no other job has it.
  Nothing here merges, publishes, tags or releases; the dispatched run is `check.yml`, which publishes nothing.
- **Limits, to know.** (1) A scheduled workflow runs only from the default branch, so `daily-full.yml` starts working when it is in `main` (at the next release), or by hand
  (*Run workflow* on `daily-full`, from a branch that has it) before. (2) A dispatch runs the branch's own `check.yml`: a feature branch cut before this change has no
  `workflow_dispatch` there and the dispatch fails (HTTP 422; the run of `daily-full` shows it) until the PM merges its line into it, which the PM does after each merge anyway.
  (3) Nothing was run against GitHub to test this; the decisions are unit-tested and both files parse. **First check (the PM):** after this reaches `main`, run `daily-full` by hand
  once and see `dispatch check.yml level=full on feature/…`, then the status on that head when the run ends.

### A6 as built (test versions from a version line)

**Removed on 18 Nov 2026** (the job `next-line` and `scripts/publish-next.mjs`): owner rule, "A version is pushed to npm and I'm told not to touch it. Then it shouldn't be there." Nothing goes to npm unless the owner is meant to approve it; line work reaches npm only as `next`, when it reaches `main`.

`publish.yml` runs on pushes to `main` and to a line's branch (`0.[0-9]+`: `0.17`, `0.18`, `0.19`, later lines). npm trusts only this one file, so the
new job `next-line` is in it. On a line the job `release` (Release PR, `latest`, tag, GitHub release) does not run (`if: github.ref == 'refs/heads/main'`),
so a line opens no Release PR and nothing of it can reach `latest`. `next-line` runs `changeset version --snapshot next` in its own checkout
(nothing committed), then `scripts/publish-next.mjs`, then `npm stage publish --tag next-<line>`. It stages only, as `next` does: the owner approves on npmjs.com.

- **Tag scheme: `next` stays for `main` alone; a line uses `next-<line>`** (`next-0.18`, `next-0.19`). Why: `morpheme-staging` (its own Worker checks npm's `next` every hour and calls its deploy hook) read `next` and must see only what `main` stages; with one shared tag the line that merged last would win, and three lines run at
  once. A site pins the exact version (`0.18.0-next-<timestamp>`), so it needs no tag; the tag is for finding the newest one
  (`npm view @morphemecms/cms@next-0.18 version`). `latest` is never used.
- **The version** is the changeset snapshot as today, `X.Y.Z-next-<14 digits>`; unique (the jobs share the group `publish-next`, one at a time) and
  sorted by time within its base. The script refuses a version that does not start with the line's own `X.Y.` (a line with only patch changesets
  calculates `0.17.1-next-…` on `0.18`): the job fails and stages nothing; add a `minor` changeset.
- **Tested:** `scripts/publish-next.test.mjs` (tags, versions, skips, and the workflow's tag, no `latest`/tag/release in the job, `release` only on main).
  Dry run by hand: `node scripts/publish-next.mjs --branch 0.18 --version 0.18.0-next-20261118120000 --base 0.17.0`. Nothing was published to test it.
- **First real stage (the PM, after the merge into `feature/build-check-speed` and its way into `0.18`):** the first push to `0.18` after the workflow is on
  `0.18` runs *Publish*; its job `next-line` must show `stage … under "next-0.18"`, and `npm view @morphemecms/cms dist-tags --json` must list `next-0.18`
  (after the owner approves) with `next` and `latest` unchanged. Note: a workflow runs from the pushed branch's own copy, so `0.18` needs this file.

### A8 as built (screens parts balanced by time)

Units are dealt to the shards by measured time (`scripts/screens/support/balance.mjs`, times in `scripts/screens/unit-times.json`,
refreshed by `scripts/refresh-unit-times.mjs`; skill `checks`, *Built (PR 8)*). Slowest unit first, each to the shard with the least time so far;
no times, or unreadable ones, deal by number as before.

- **Before** (the run of #924, run 44252865810, 363 units, 8 shards dealt by number): the `screens` step took 8:23, 7:43, 7:28, 7:28, 7:28, 7:26,
  6:48 and 5:26 (longest 503 s, shortest 326 s); the units add up to 3468 s, 433 s per shard if the shards were even; the longest unit is 94 s.
- **Predicted** from the same times: 8 shards of 437 to 438 s (the longest 503 s becomes about 438 s, about 1 minute less). 6 shards give 583 s,
  10 give 350 s, 12 give 292 s (`node scripts/refresh-unit-times.mjs <logs>` prints this table). Each job also spends about 30 to 60 s on setup.
  The count stays 8: more shards only cut the wall time by their share and cost one runner and one setup each.
- **After:** to be written from the first run of this pull request's `screens` jobs (a full run, `areas=all`, gives the numbers to compare; a
  selected run is shorter by design).


#### A2: what is built and what it measured

Built in two pull requests: #924 (build once, cache Chromium) and a second one (the output key and the faster install).

- **Build once** (#924). The job `build` runs `npm ci` and `npm run build` once and uploads one tarball (`.morpheme/demo/site` and
  `node_modules/@morphemecms/cms`, 18 MB); `screens`, `screens-extra` and `demo` unpack it. `starter` builds nothing from the demo (it packs
  the package itself), so it only gets the Chromium cache. The shared steps are `.github/actions/prepare`.
- **Block 1, outputs kept by their inputs.** `lib/outputKey.mjs` (test: `lib/outputKey.test.mjs`) makes the key from the paths and bytes of
  the inputs and a few values; no file times. `scripts/ci-build-key.mjs` applies it to every tracked file except `docs/`, `.claude/`,
  `.agents/`, and `.changeset/`, plus the Node major version. The job `build` keeps its tarball in Actions' cache under
  that key and builds only on a miss. A cache is read only by the same pull request (and the default branch), so it hits on a push that
  changes no input (docs, a changeset) and on a re-run; the first run of a pull request that changes an input always builds. Track B's
  batches 2 and 6 use the same function with their own inputs.
- **Block 3, a faster install.** A root `.npmrc` with `prefer-offline`, `audit=false` and `fund=false` (not shipped; a site gets its own
  from the starter in track B, batch 5). The browser is installed only in the jobs that run screens (`screens`, `screens-extra`, `starter`)
  and cached in `~/.cache/ms-playwright`, keyed on the Playwright version.

**Measured, #924** (light level, `static` and the 8 `screens` shards; before: run 44245479828 on a pull request into `0.18`, after: run
44252865810, head `46ffd52`, the Chromium cache cold):

| | Before | After |
| :--- | :--- | :--- |
| Whole run, wall-clock | 10m44s | 13m19s |
| `static` | 1m57s | 2m04s |
| `build` (new) | none | 56 s |
| `screens`, 8 shards added up | 71.0 min | 70.9 min |
| Set-up of a shard before its tests (`npm ci`, build, Chromium) | 45–87 s, outliers up to 3m47s | 31–62 s, two outliers 3m19s and 3m50s |

It is not faster: the build now runs alone before the shards, and the cold cache left the Chromium outliers in place.

**Measured, #928** (the output key and `.npmrc`; same light level, all 8 shards). The cold run, run 44255749452 (head `9aac220`), against the
re-run of run 44258369589 (head `2169576`, attempt 2) after attempt 1 had filled the caches:

| | Cold (first run) | Re-run, caches filled |
| :--- | :--- | :--- |
| Whole run, wall-clock | 14m41s | 11m09s |
| `build` job | 1m05s (builds) | 7 s (kept-build hit: `prepare`, `npm run build` and `tar` skipped) |
| `screens`, 8 shards added up | 70.5 min | 67.7 min |
| Set-up of a shard (`prepare`: `npm ci`, unpack, Chromium) | 29–45 s, one shard 5m49s | 26–42 s, one shard 4m01s |
| `npm ci` in `static` | 15 s | 15 s |

- **The kept build works:** on a re-run the key matched and the build cost 7 s instead of about 1 minute.
- **`.npmrc` made no difference to `npm ci`:** 14–15 s in `static` before (#924), with the `.npmrc` cold, and with it warm. The old flags
  `--no-audit --no-fund` were already passed, and `setup-node` already restores npm's cache; the file keeps the three settings in one place.
- **The Chromium cache cannot be seen in the step times:** the composite action reports one step, and the set-up of seven shards was 26–42 s
  cold and warm. One shard in each run still took 4–6 minutes in `prepare`, so the slow installs are not (only) the browser download.
  Whether the cache is hit is not proven by this; a `cache-hit` line in the log would prove it.
- **A cache is not shared between pull requests.** Actions caches are scoped to the pull request's own ref and the default branch, and
  `check.yml` never runs on a branch (only on pull requests), so a first run always starts cold. A workflow that runs on push to
  `feature/**` and `0.*` and fills the caches is the fix (third A2 pull request).
- The re-run is 4 minutes faster than the first run mostly because the build and the slowest installs were cheaper; the shard tests vary by
  several minutes between runs (shard 2: 6m15s now, 6m24s cold), so one run is not a benchmark.
### A3 as built (touched areas and the core set)

**The cache-fill workflow** (third pull request of A2). `.github/workflows/cache-fill.yml` runs on push to `feature/**` and `0.*` (and by hand),
does `.github/actions/prepare` with the browser (the same keys as `check.yml`: npm's cache by the lock file, Chromium by the Playwright version) and
saves the caches on that branch, where a pull request into it can read them. It builds nothing and has read-only permissions; a merge into a
feature branch is a push, so it costs one extra run, free here. The build is not kept this way: a pull request's inputs rarely equal the
branch's.

**Proof that a pull request into the branch restores them** (#937, the sync of 0.18, the first pull request into `feature/build-check-speed`
after the merge of #931; run 44268511487, head `fcb3e2c`). Cache-fill ran on the merge push (run 44266560124, 58 s, 08:23 UTC), saved the caches,
and the pull request's jobs read them:

- `build` job, `setup-node` (npm cache): `Cache restored from key: node-cache-Linux-x64-npm-f6ecbaac…` (174 MB, 2.7 s), then at the end
  `Cache hit occurred on the primary key … not saving cache`; `npm ci` took 12 s.
- A `screens` job (shard 3), the post step of the browser cache: `Cache hit occurred on the primary key playwright-Linux-1.65.0, not saving cache`,
  and the same for `node-cache-Linux-x64-npm-f6ecbaac…`.
- The kept build: `Cache not found for input keys: build-f7b8009e…` in the `build` job (expected, this pull request's inputs differ from the branch's),
  followed by `Cache saved with key: build-f7b8009e…`.

**What it gave in time.** The set-up of a `screens` shard (`prepare`: `npm ci`, the unpack, Chromium) was 25–45 s in five of six shards read and
2m58s in one, with both caches restored. That is the same as the cold runs of #928 (26–45 s, and one shard of 4–6 minutes), so restoring the caches
saves nothing that shows in the step times: the download was a small part of the set-up, and what remains (`npm ci` from the restored cache, the
system libraries from apt, the unpack) is what takes the rest. The one slow shard in each run is therefore not the browser download. The caches
are worth keeping for the network (one download of Chromium and of npm's cache per branch instead of per run), not for the minutes. The slow shard is explained in *A12 as built* below.

Built in `lib/affected.mjs` (the engine, tested in `lib/affected.test.mjs`, reusable by track B with its own rules),
`scripts/screens/support/areas.mjs` (the map, `AREAS`, `CORE_UNITS`; tested in `scripts/screens-areas.test.mjs`), `--areas` in the runner
(`scripts/editor-screens.mjs`) and `areas=` from `scripts/ci-changes.mjs` into each `screens` shard of `check.yml`. The rules are in the `checks` skill, *Built (PR 3)*.
Track B reuses `select(paths, rules)` from `lib/affected.mjs`; it does not build on the screens rules.

**What the map does with the real history.** The map was run over the 514 non-merge commits of the first-parent history of 0.18 (18 November 2026,
`origin/0.18`, each commit is one pull request):

| Selection | Commits | Share |
| :--- | :--- | :--- |
| every area (`all`: a shared part such as `theme/styles/`, `src/editor.css`, `src/i18n/`, `src/ui.tsx`, `lib/`, or an unknown path) | 393 | 76 % |
| the core set only (`none`: docs, tests, the Worker, the static-only checks, changesets) | 94 | 18 % |
| the core set and named areas | 27 | 5 % |

**It includes what a change really needs.** An objective check: when a commit changed an area's own unit file (`scripts/screens/<area>.mjs`)
besides other source, the author's change needed that area. 28 such commits exist; in all 28 the map selects that area (or all). Examples, all from
the history of 0.18:

| Commit | Changed (besides changesets and docs) | Map selects |
| :--- | :--- | :--- |
| afd2a605 Skip the Lists units on a site without the Lists page | `scripts/screens/lists.mjs` | `lists` |
| 068b66e1 checkBlockHandleCorner measures every block kind | `scripts/screens/block-bar.mjs`, `lists.mjs` | `block-bar,lists` |
| 3b71bdbe A mouse click in a card's headline is not taken by the row | release notes, `scripts/screens/cards.mjs`, `choice-groups.mjs` and more | `block-bar,cards,choice-groups,lists,page-rows,start-screens` |
| 919ca2b4 Leave out a form section with no field | `src/EntryForm.tsx`, `src/formSectionList.mjs` | `forms,sheets` |
| 1f2e59f9 The new-edition card gets its elevation | release notes, `src/UpdatesNotice.tsx` | `start-screens` |
| 37e492c7 Lists in columns: dividers and corners | `scripts/screens/lists.mjs`, `theme/styles/blocks.css` | all (the theme's CSS) |
| e2dd9fe5 Lists: Show more and the text button on one row | `demo/public/demo-names.js`, `scripts/screens/demo-names.mjs` | all (`demo/public/`) |
| 141af984 Fix CodeQL alerts: safe image and link sources | `lib/safe-url.mjs`, `scripts/screens/sheets.mjs` | all (`lib/`) |
| 67033e81 Rewrite the documents that overlap the cards and lists plan | docs and changesets | core set only |
| 2bce24ea Text measure check: a plain List is full width on compact screens | `scripts/check-text-measure.mjs` (run by `screens-extra`) | core set only |
| 339e27f0 List settings: clearer labels | `src/i18n/`, release notes | all (texts show on every screen) |
| b328d830 Move the Person, Icon list, Facts, Table and Badge rules into theme/styles | `theme/styles/base.css` | all |

**The honest limit.** The 0.18 history is mostly CSS splits, token renames and text changes, which can show on any screen, so three quarters of its pull
requests still run every unit. The map saves work for docs, Worker, test-only and static-check pull requests (the core set only) and for changes that
stay in one area's files. It does not narrow `theme/styles/` or `src/editor.css`: no unit is organised by component, so a rule there would be a guess.
A later pull request may split such a file by area; until then a path that can show anywhere runs everything.

**Sharding with a selection.** The selected units are spread over the same 8 shards (shard K runs every 8th selected unit), so a selection of 46
units (`files,sheets`: 6 core units and 40 of the 357 others) gives shards of 6, 6, 6, 6, 6, 6, 5 and 5 units, against about 45 each for all 363. The
matrix still has 8 jobs, so each job still installs and builds; shrinking the matrix with the selection is not done here (A2, build once, has merged and a dynamic matrix would be its own change).

**Timing (a representative light run).** Measured on one machine (this development container, Chromium 1243, a built demo), the `check:screens` step of shard 1 of 8 only, one run each, 18 November 2026:

| Run (shard 1/8) | Units in the shard | Wall time |
| :--- | :--- | :--- |
| Before: every unit (the light check today) | 46 | 8 min 20 s |
| After: a pull request that touches `src/Library.tsx` (`--areas files,sheets`: 46 of 363 units) | 6 | 2 min 11 s |
| After: a pull request that touches nothing a unit reads (`--areas none`, the core set alone) | 1 | 1 min 8 s |

So the screens step of a shard falls to about a quarter for a one-area change and to about an eighth for a docs, Worker or test-only change that still runs `static`. Read it with care:
it is one shard of eight on one machine, not a CI run; shard 1 also holds `screens 390` (68 s) and the one-time global icon checks, so the shortest
shards are quicker than these. The time outside that step (`npm ci`, the build and the Chromium install, about 1 to 4 minutes in each of the 8 jobs) is unchanged, and
three quarters of the pull requests in the history of 0.18 still select every unit, so the gain on a real run is smaller than the table.
The CI timing of the whole check (before and after, same pull request) is read from the first runs of this pull request and A2's against the numbers above.

### A7 as built (`static` reads the build, Prettier on changed files, tsc build info)

- **`static` does not build.** `npm run check` is now `format:check`, `check:source` (every check up to `check:types`), `npm run build`, `check:built`
  (`check:site-types`, `check:editor`), in the order it had. In CI `static` needs `build` and unpacks the same tarball the screens jobs use
  (`.github/actions/prepare`, `build: 'true'`), so it runs `check:source` and `check:built` and no `npm run build`. The build is made from the same head by the job `build` (or
  its kept build of the same input hash), and its content check (`check-content`) runs inside `npm run build`, so nothing is checked less. A docs-only pull request has no `build` job; there
  `static` runs `npm run build` itself, as before. A failed `build` skips `static`, and `check` reads a skipped `static` as red.
- **Prettier on the changed files.** `formatScope` in `scripts/ci-changes.mjs` (the job `changes` prints `format=all|changed`; tested). `changed` at the feature and
  line levels: `git diff --name-only --diff-filter=d origin/<base>...HEAD` piped to `prettier --check --ignore-unknown`. `all` (`npm run format:check`) at the full
  level, for the Release PR, an empty diff, any error, and when Prettier's own inputs change (`.prettierrc*`, `.prettierignore`, `.editorconfig`, `package.json`,
  `package-lock.json`, `check.yml`).
- **tsc build info.** `npm run check:types` writes `.morpheme/tsc/types.tsbuildinfo` (`--incremental --tsBuildInfoFile`). `static` restores it from the Actions cache by
  `scripts/ci-tsc-key.mjs` (`lib/outputKey.mjs` over TypeScript's version, `tsconfig.types.json`, `package.json`, `package-lock.json`, the Node major): the key is the prefix, so a
  change to any of them starts cold. A changed source file is not in the key: the info holds a hash of every file it read and tsc compares them itself.
  `cache-fill.yml` writes the same info on each push to a feature branch or version line, so a pull request into it restores a warm one.
  Checked: with a warm info, a new syntax error in a file is reported, and gone when the file is removed; a cold run and a warm one give the same result.

**Measured (local, this development container, one run each, 18 November 2026; Node 22, TypeScript 7.0.2, `npm ci` done).** The CI run times are added from the first runs of this pull request.

| Step | Before | After |
| :--- | :--- | :--- |
| Prettier, every file | 18.4 s | 0.9 s on the 9 files of this pull request's diff (`changed`) |
| `npm run build` inside `static` | 32 s | 0 (the artifact is unpacked) |
| `check:types`, cold info | 0.8 s | 0.8 s |
| `check:types`, warm info | 0.8 s | 0.4 s |

TypeScript 7 is so fast that the build info saves only about 0.4 s; the cache is kept as asked and costs almost nothing, but it is not where the time is.
The saving in `static` is the second build (about 30 s of runner time, more on a CI runner) and Prettier over every file. `static` now waits for `build`, so its wall time
is `build` plus the rest, still shorter than the screens shards that also wait for `build`.

### A11 as built (`npm run check:fast`)

`npm run check:fast` (`scripts/check-fast.mjs` runs, `scripts/check-fast-plan.mjs` decides; tests: `scripts/check-fast-plan.test.mjs`). It finds the base
branch (the remote `main`, `0.*` or `feature/**` the branch is fewest commits ahead of, or `--base <ref>`), takes the changed paths (committed,
staged, unstaged, untracked) and runs: Prettier on the changed files; the static checks whose inputs changed (a check leaves the plan only when no
changed path is one it reads); the unit tests in the folder of a changed file or whose text names a changed path or file; `tsc` when a changed
file is in its `include`; and, when the build reads a changed path (`needsStarterDemo`), the build, `check:site-types`, `check:editor` and the
screens core set plus the touched areas (`areasArg`). It prints what it ran, what it skipped and why, and that CI and `npm run check` are the gate.
When in doubt, everything: an unknown path (no rule in `areas.mjs`), a `..` path, no base branch, no changes, and a package or config file.
One deliberate narrowing, from the brief ("no full run"): when the change reaches every area, the screens run the core set only, the plan lists
"the units of every area" as skipped with the reason, and `--screens all` runs them. `--screens none` is the quick mode: the same plan without the screens (core set too), listed as skipped. `npm run check` is unchanged.

**Measured** (18 November 2026, this development container, one run each, nothing else running; `--base HEAD` so only the one change counts):

| Change | `check:fast` | `npm run check` |
| :--- | :--- | :--- |
| Docs only (a line in `docs/theme-grid.md`) | 9 s (format, language, token-names, density) | 111 s |
| CSS only (a comment line in `theme/styles/ui.css`; every area, so the core set) | about 190 s (1 s format, 2 s language, 6 s token names, 12 s web, 28 s build, 136 s core screens, the rest under 5 s; 9 test files in under 1 s) | 110 s |

Read it with care. For docs the saving is 12 times. For a CSS change `check:fast` is **slower** than `npm run check`, because it also runs the screens core
set (136 s here), which `npm run check` does not; the work it adds is the screens check CI runs, and its static part is the same 25 s or less. A
shared CSS file reaches every area, so no area narrowing helps there; a change inside one area's files (`src/Library.tsx`: `files,sheets`) runs 6 core units and the units of those areas.

### A4 as built (the starter smoke test)

- **`check:starter --smoke`** (`scripts/check-starter.mjs`). It does everything the shards do before their screens: the package is packed, installed in a copy of the
  starter, the site's own `npm run check` and the migrate checks run, and `npm run build` builds it. Then, instead of the screens in shards, it runs the screens' core set
  on the starter's content (`check:screens --areas none`: all 258 screens open, a page is edited and Save commits it) and `scripts/check-save-twice.mjs` from the installed
  package (a page is edited, saved twice and published, and a real concurrent edit is still refused). The editor's opening, editing, saving and publishing on the starter are
  therefore all covered; what the smoke test leaves to the full level is the other 350 units on the starter's content.
- **The job `starter-smoke`** (one job, no matrix, not waiting for `build`: the starter packs the package itself) runs at the **line level only**. The line level also runs `demo`,
  as the levels table asked. `SKIPPED_AT` in `scripts/ci-changes.mjs` says what each level skips (`feature`: `screens-extra`, `demo`, `starter`, `starter-smoke`; `line`: `screens-extra`,
  `starter`; `full`: `starter-smoke`), and the verdict reads the level (`feature|line|full`, no longer the light flag), so a job that ran where its level skips it, or was skipped where it
  must run, is red. An empty or unknown level is `full`. `starter-smoke` is also skipped when `starter_demo` is false, as `starter` and `demo` are.
- **Nothing is dropped.** The full level (`main`, the Release PR, an unknown base) still runs the 4 `starter` shards and every other job it ran, and it does not run the smoke test
  because the shards contain all of it (the same pack, install, check, build and every screen). The feature level runs what it ran. Only the line level runs more than before
  (`demo` and `starter-smoke`).

**Measured** (18 November 2026). Locally, this development container, one run: `node scripts/check-starter.mjs --smoke` took **4 min 41 s** (pack, install, the site's check and build about
2 min; the 6 core units 1 min 55 s, `screens 390` 54 s; `check-save-twice` the rest). CI numbers, from the plan's own table (full run of #888): a starter shard takes 14 to 17 minutes (median 14.2 on
the light runs, longest 19.8), because each shard repeats the same set-up and then runs about a quarter of the 363 screens units.

**Not measured in CI, and why.** The line-level `check` job cannot be timed by this pull request: its base is `feature/build-check-speed`, which is the feature level, and the feature level
runs neither `demo` nor the smoke test. The line level's wall time is the slowest of `static`, the 8 `screens` shards, `demo` and `starter-smoke`, which run side by side after `build`; before, it was
the slowest of the `screens` shards (7 to 11 minutes; 10m44s to 14m41s whole run in #924 and #928). The smoke test (about 5 minutes here, a CI runner is slower) and `demo` (about 1 minute) sit under the
screens shards, so the line level's time should not move much; the first pull request into `0.18` after this merges gives the number. The comparison to write then: the whole run and the `starter-smoke` job against
the 8 shards of the same run, and the old line-level run of the same size.

**Open.** (1) The line-level CI times above. (2) The smoke test does not run when the level is `feature`; the daily full run (A5) is what covers a feature branch's starter. (3) `check:starter --smoke`
needs a browser, so a local run needs Chromium installed (`CHROMIUM_PATH` for another one); in this container the Playwright of the starter wants Chromium 1254 and only 1243 is installed, so the local run used
`CHROMIUM_PATH`.

## Track B. Site builds: a save goes live sooner

From the build-speed plan of 15 November 2026 (planned with the owner, a brainstorm session; the owner chose all eight options). Each
batch gets its own pull request; a batch marked **verify first** starts with the check it names and stops if the check fails. B1 and B8
use building block 2, B2 and B6 block 1, B5 block 3.

**Goal:** a save in the editor is live sooner. Today a save on saravafaiblom.dk takes **3 min 41 s** from the start of
Cloudflare's build to the end; this plan aims at about **1 min 45 s**.

### What a build spends its time on today

Measured from saravafaiblom.dk's build of 12 November 2026 (Workers Builds, `@morphemecms/cms` 0.16.0, 135 content
files, 152 pages, 100 images, 5 videos). The save changed 3 files on the site.

- Setting up, cloning, restoring the build cache: 8.5 s. Installing Node: 5 s.
- `npm clean-install` (543 packages): **32 s**, although the npm cache was restored.
- `npm run check`, the full lane: **73.5 s**: Prettier 5.5 s, `astro sync` 7 s, `tsc` 20.5 s, `check:content` 8.5 s,
  `check:editor` 14 s, `check:worker` 17.5 s.
- `prebuild`: `check:content` a second time **8 s**, `responsive-images` **42 s** (100 images, 479 variants written, all
  of them again), `video-thumbnails` 2 s.
- `astro build`: **31 s**: autolinks and content sync 3.5 s, build info 1.5 s, Vite 2.9 s and **12.8 s** (the client
  bundle, with chunks over 500 kB: the editor), **rendering 152 pages 6.7 s**, sitemap, CSP and licences 4 s.
- `morpheme after-build`: 2.7 s. Upload and deploy: 8 s. Writing the build cache: 5.3 s.

The site's `wrangler.jsonc` still has `"command": "npm run check && npm run build"`, so every save takes the full lane;
`morpheme ci-build` (the content lane) exists since before 0.15 and `morpheme-website` uses it.

Facts the plan rests on (read 15 November 2026):

- Workers Builds: 2 vCPU on the Free plan, 4 on Paid; 8 GB memory; 20 minutes timeout
  (developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/).
- Its build cache keeps npm's cache (`.npm`) and, for Astro, only `node_modules/.astro`; it is turned on per Worker
  (Settings › Build › Build cache) and dropped 7 days after its last read (…/builds/build-caching/). It is on for Sara's
  Worker: her log says "Restoring from build output cache".
- **Open question for batch 2 and 8:** the log restores the cache at 18:21:14 and runs `npm clean-install` at 18:21:20.
  `npm ci` removes an existing `node_modules` before it installs, so `node_modules/.astro` may be gone before our build
  runs. Batch 2 verifies this first.
- Image transformations by address (`/cdn-cgi/image/<options>/<image>`) are on Cloudflare's Images Free plan: 5,000
  unique transformations a month free, then $0.50 per 1,000 on Images Paid; a unique transformation is one image at one
  set of options, counted once a month; `format` and `quality` do not count. The zone must turn transformations on
  (Images › Transformations) (developers.cloudflare.com/images/pricing/, …/images/optimization/transformations/overview/).
- Astro 7.4: `experimental.parallelPrerender` (`true` or `{ workers }`, default all cores but one; pages do not share
  module variables; `getStaticPaths()` props must be serialisable; ignored when an adapter prerenders, which only
  `@astrojs/cloudflare` does, and the CMS uses no adapter). Astro 7.2: `experimental.incrementalBuild` (a page is skipped
  when its `cacheKey` from `getStaticPaths()` and the hash of its module graph match the last build; the cache is in
  `cacheDir`, `node_modules/.astro/`; off when `build.concurrency` > 1; middleware changes do not invalidate).

### The batches

Expected savings are for a content save on a site like Sara's (about 100 pages and 100 images) with no new images.

#### Batch 1. Every site takes the content lane (about 55–60 s)

- **Now, outside the release, in `Sarashjemmesidedata`:** `wrangler.jsonc`'s `build.command` becomes
  `"npx morpheme ci-build"`, as in the starter. One-line change; her pinned 0.16.0 has `ci-build`. The PM may hand it out
  before the release.
- **In the CMS:** a site whose build command is not `npx morpheme ci-build` is moved to it once by the CMS update (the
  same place that writes the version in `package.json`), and `check:content` warns while it is not.
- **The full lane when the CMS changed, even without a commit** (owner, 15 November 2026). Today the lane follows the git
  diff since the live commit, so a CMS installed at build time is invisible to it: `morpheme-staging` installs the `next`
  CMS with `npm install … --no-save` (`scripts/install-cms.mjs`), and a content-only commit there would skip `tsc` and
  `check:worker` on a brand-new CMS. So:
  - `/editor/version.json` (`pages/editor/version.json.js`) also records `cms`, the installed `@morphemecms/cms` version.
  - `ci-build` (`lib/build-lane.mjs`, `site/live-diff.mjs`) takes the full lane when the installed version differs from
    the live `cms`, or the live file has none (a site built before this change). A test covers both.
  - Then `morpheme-staging`'s build command becomes `node scripts/install-cms.mjs && npx morpheme ci-build`. Its site
    config's `domain` is `morpheme.example` today, so `ci-build` cannot read its live `version.json` and would always take
    the full lane; staging's Worker gets `MORPHEME_LIVE_URL` (below) once the CMS-version rule is built.
- Saves: Prettier on all files, `astro sync`, `tsc` and `check:worker` on a content save (about 50 s), and the second
  `check:content` (`MORPHEME_CONTENT_CHECKED`, 8 s). A CMS update still takes the full lane.
- **The address `ci-build` reads the live commit from** (proposed, 15 November 2026). `ci-build` reads
  `https://<domain>/editor/version.json`, with `domain` from the site config. Before a site is launched its domain still
  serves the old site: saravafaiblom.dk is Sara's old site (it answered 504 or nothing), while her new site answers on
  `saravafaiblom-dk.sara-vafai-blom.workers.dev`. So `ci-build` always takes the full lane there after 5 s, and on
  staging (`morpheme.example`) too. `ci-build` takes the address from a build variable `MORPHEME_LIVE_URL` when it is
  set (Cloudflare: the Worker's Settings › Build › Variables), else from `domain`. Sara's Worker gets her workers.dev
  address until her launch; staging gets the address it is served at. A test covers both. Sara's PR is
  saravafaiblom/Sarashjemmesidedata#19 (merged).

#### Batch 2. Image sizes and video stills are kept between builds (about 40 s) — verify first

1. **Verify:** a build on a test site (`morpheme-staging`, or a branch build of the demo Worker) prints whether
   `node_modules/.astro/` holds what the last build left there when `ci-build` starts. Write the result in this plan.
2. `scripts/responsive-images.mjs` and `scripts/video-thumbnails.mjs` decide by **content, not file times**: a fresh clone
   gives every source a new time, so "older than the source" makes everything again. Each output is named or recorded by
   the source's hash (and the sizes and quality it was made with), in the manifest.
3. Where the outputs are kept between builds:
   - If step 1 says the cache survives: a folder in `node_modules/.astro/morpheme/images/`, copied into
     `public/images/_r/`, `_s/` and `_video/` before the build and filled back after it.
   - If not: the build takes them from **the live site**, which already serves every variant of the last build.
     `ci-build` already asks the live site what changed (`site/live-diff.mjs`); the live manifest says which hash each
     variant was made from, and only variants whose hash still matches are fetched. This works without the build cache
     and on every plan.
4. Only new or changed images go through sharp. `check:screens` and the image checks still see the same `srcset`.

   **As built (18 November 2026, 0.18).** Step 1 is still open: nobody has run a Cloudflare build that prints whether
   `node_modules/.astro/` survives `npm clean-install`, so the first route above (a cache folder) is not built. What works
   without the build cache is built instead: step 2 and step 3's second route. `lib/variant-record.mjs` writes
   `public/images/_variants.json`, which maps each output (`_r/…`, `_s/…`, `_video/…`) to a key of the source's content hash
   and the sizes and quality it was made with; the site serves it. `responsive-images` and `video-thumbnails` keep an output
   whose file exists and key matches, else fetch it from the live site when the live record has the same key
   (`MORPHEME_LIVE_URL`, which `ci-build` sets to `https://<domain>` unless it is already set), else sharp makes it. A fetch
   that fails or is not an image falls back to sharp, so every doubt gives the old result. The manifest and its `srcset`
   are unchanged; `scripts/responsive-images.test.mjs` compares them and the files byte for byte. Image parallelism is untouched (batch 3).

#### Batch 3. Images are made in parallel (about 20–25 s when all images are made)

- `responsive-images` today awaits one image after another. It runs the images through a small pool sized by
  `os.availableParallelism()` (sharp's own threads counted), so the first build of a site, a cleared cache and a big
  upload are faster. Same outputs, byte for byte; a test compares them.

**As built (18 November 2026, 0.18).** `scripts/responsive-images.mjs` makes each image in a function (`make`) and runs them through a small
pool: `MORPHEME_IMAGE_JOBS`, else `floor(os.availableParallelism() / sharp.concurrency())`, at most 8, at least 1 (`sharp.concurrency()` is
sharp's own thread count per image, so the two are not multiplied). Each image returns its manifest entry and its record entries; they are
put together in the order of the file list and the record is written with sorted keys, so the manifest, the record and every file are the same
whatever order the images finish in. The record's keys and the live-site route (batch 2) are unchanged. `scripts/responsive-images.test.mjs`
compares one at a time with four at a time (files, manifest and record byte for byte). Measured on 60 made-up 2400 × 1600 JPEGs, nothing kept
(4 cores, sharp concurrency 1): 1 at a time 42.4–43.3 s, 2 at a time 21.4–22.6 s, 4 at a time 11.3–11.5 s, so about 3.8 times faster on 4 cores.
On Workers Builds Free (2 vCPU) expect about half the time, not a quarter. An incremental build, where every variant is kept, makes no images
and gains nothing. **Not done: the video stills.** There are few, and their time is the network (YouTube, Vimeo), not sharp, so a pool is not a
clear win.

#### Batch 4. Cloudflare makes the image sizes, through the site's Worker (about 42 s, the whole image step)

**Decided** (owner, 18 November 2026: "Worker way it is"), replacing the plan's `/cdn-cgi/image/` addresses. Why (Cloudflare's docs, read
18 November): `/cdn-cgi/image/` needs a zone with transformations turned on, so not a `workers.dev` address, and its troubleshooting page
says "9524 — The /cdn-cgi/image/ resizing service could not perform resizing. This may happen when an image URL is intercepted by a
Worker", which ours is (`run_worker_first`). A transformation made by the Worker (the Images binding, `env.IMAGES`, or `fetch()` with
`cf.image`) "is available on any zone that hosts a Worker, including `*.workers.dev` subdomains".

- **The Worker answers `/_img/<width>/<image>`** (`worker/`): it reads the original from the site's files, resizes it and converts it
  (AVIF or WebP by the browser's `Accept`, `quality` 78) through the Images binding, and keeps the result in Cloudflare's cache with a
  long cache time; a second request for the same size is a cache hit. Only widths the site uses are answered (the list the build's
  `srcset` uses), so nobody can make the Worker produce endless sizes. The binding goes into the starter's `wrangler.jsonc`
  (`"images": { "binding": "IMAGES" }`), and the CMS update adds it to existing sites.
- **A site setting** (Settings › Developer › Caching and builds, next to R2 caching): **Image sizes by Cloudflare**, a switch, `On` /
  `Off`, off by default, with one sentence on what it costs. When on, `Img.astro` and the Markdown image plugin write `srcset` addresses
  of the form `/_img/<w>/<image>` and the build makes no `_r/` variants; it still reads each image's size for `width` and `height`, and
  still makes the share image (`_s/`, 1200 × 630, cropped around what matters).
- **Cost** (Cloudflare's pricing, read 18 November): the binding is billed per unique transformation (one image at one width, counted
  once a month; format and quality not counted): 5,000 a month free, then $0.50 per 1,000 on Images Paid. A site like Sara's uses about
  400. On the Images Free plan, a new size over 5,000 returns an error instead of a charge: the Worker then serves the original image.
  Worker requests do not grow: the site's Worker already runs on every request (`run_worker_first: true`); the resize costs a few
  milliseconds of CPU on the first request for a size.
- **CSP:** the addresses are on the site's own host, so `img-src 'self'` holds.
- **Checks:** the Worker's route with a test (sizes allowed, a size not on the list refused, the fallback to the original), and the
  screens checks with the setting on (the `srcset` addresses) and off (as today).
- Batches 2 and 3 stay for sites with the setting off, and for the share images and video stills.

#### Batch 5. A faster install (about 5–10 s)

- Workers Builds runs `npm clean-install` itself. The starter (and the CMS update, for existing sites) adds an `.npmrc`
  with `prefer-offline=true`, `audit=false` and `fund=false`, so npm uses the restored cache and skips the network
  checks. Measure on the test site before and after.
- Look at the site's 543 packages: what the site's `package.json` installs that only the editor's local checks need
  (Playwright and the like) moves to what `check:screens` installs on demand. Measure, then decide.
- **Built (B5).** `starter/.npmrc` and the CMS update (`lib/npmrc.mjs`, used by `worker/cms-update.js`) add the three lines once, keep the
  site's own lines and write nothing when they are there. Not measured: a Cloudflare test site cannot be reached from the build session, so the
  seconds saved are unmeasured. The starter already leaves Playwright out (`scripts/starter.mjs`); nothing else in its `package.json` is only for local checks
  (see the pull request for the sizes), so nothing moved.

#### Batch 6. The editor's client bundle is not built on every save (about 10–13 s) — decided: built in the package, 0.21

**Decided** (owner, 18 November 2026: "2", then "Options 2 in 18.2"): the second way below, in **0.21 Build speed** (owner, 19 November 2026; it was 0.18.3) after Tailwind (0.19.0), on
`feature/editor-prebuilt`. Design and pull requests: `docs/superpowers/specs/2026-11-18-editor-prebuilt-design.md`. The first way is not built.


- 12.8 s of `astro build` is Vite's client bundle, mostly the editor (chunks over 500 kB). A content save does not change
  it. Two ways, to be weighed in a short spec first:
  - **Built once per input:** the bundle is kept with a key of the CMS version, the lockfile, the theme, the apps and the
    site's `src/site/` files, in the same place as batch 2's images, and reused when the key matches.
  - **Built in the package:** the parts of the editor that do not depend on the site are built when the CMS is
    published, and the site builds only what is its own. Bigger, and it touches how themes and apps reach the editor.
- Also: split the editor's chunks (`import()` per screen), which the Vite warning asks for, and which makes the editor
  open faster too.

#### Batch 7. Parallel prerendering (about 3 s on 4 vCPU)

- `experimental.parallelPrerender: true` in `astro.mjs`. Rendering is 6.7 s for 152 pages; on Paid (3 workers) this
  saves about 3 s, on Free (1 worker) about nothing. It pays off more on bigger sites.
- Check before: no render-time code shares state between pages that the build reads at the end (the module caches in
  `site/images.mjs`, `site/autolinks.mjs` and `site/pageColors.ts` are read-once caches and warnings, which is fine);
  the after-build steps read `dist/`, not memory. `compare-html` on the demo: the same HTML with and without the flag.

**Tried 18 Nov 2026: left off.** `experimental: { parallelPrerender: true }` in `astro.mjs`, Astro 7.4.8, measured on the demo (37
pages) and on a synthetic site of 1027 pages (the demo with its 10 posts copied 99 times each, in a scratch folder, not committed).
The build works with the flag on both.

**Why the HTML differs.** The React ids (`useId`, `_r72R_2_`) start with a prefix that `@astrojs/react` takes from a counter of the
page (`context.js`: one counter per page render, +1 for every React component the page renders). The counter is not shared between
pages, so a page's ids do not depend on which worker renders it. They depend on the order in which the page's own React components
reach the counter, and a page renders its components concurrently, so the order follows the timing. Without the flag the timing is
the same every run (3 of 3 builds identical); with 3 workers it moved on one page (`/blocks/lists/`: `_r72R_` against `_r70R_`; the
same page with the ids normalised is identical). Is it harmless? In both builds the ids are unique on the page and every
`aria-controls` points to an id on the page (3 ids, 3 references, none dangling), because an id and the attribute that names it come
from the same render. Three builds with the flag on were identical to each other. So it is cosmetic: a changed number, not a broken
link. The components that call `useId` and render on a site are `theme/blocks/MoreRows.tsx` (Show more), `theme/blocks/accordion/Accordion.tsx`
and the theme's `List`, `Menu`, `Search`, `TextField`, `ChoiceGroup`, `ExposedDropdownMenu`, `FabMenu`, `SplitButton`, `BottomSheet`
and `Tooltip`; only a page that renders several of them in one page, such as the Lists demo, can shift.

**Measured** (1027 pages, 3 runs each, `taskset` to the vCPUs, the demo's `astro build`, no after-build; the step "generating
static routes" and the whole build):

| vCPUs (workers with the flag) | | Generating routes, 3 runs | Whole build, 3 runs |
| :--- | :--- | :--- | :--- |
| 4 (3 workers, Cloudflare Paid) | without | 12.3, 12.0, 11.6 s | 33.3, 33.5, 31.7 s |
| | with | 7.9, 7.9, 8.3 s | 30.1, 28.5, 29.9 s |
| 2 (1 worker, Cloudflare Free) | without | 11.7, 16.0, 15.4 s | 39.6, 40.6, 40.7 s |
| | with | 22.0, 14.3, 20.3 s | 49.2, 39.8, 46.7 s |

With 3 workers the route step is about 4 s (33 %) faster and the whole build about 3 s (10 %). With 1 worker there is no gain and the
builds are slower and noisier (the worker is started for nothing). `compare-html`: 4 vCPU, without against with: 1 of 1026 pages
differs (`/blocks/lists/`, the ids above); 2 vCPU, without against with: all 1026 the same (one worker keeps the order). The
output of a site therefore depends on the number of vCPUs of the machine that builds it.

**Recommendation: leave it off.** The output is not the same on every machine, and the gain is about 3 s of a build that is about
30 s here and minutes on the real site, on the Paid plan only. Turning it on only on 4 or more vCPUs
(`parallelPrerender: os.availableParallelism() >= 4`) would keep the Free plan unchanged, but it makes the HTML differ between
machines and weakens the "same HTML" proof that batch 8 (incremental builds) and `compare-html` rely on. Retry when
`@astrojs/react` gives each island a prefix that does not depend on the order (or Astro keeps the order), and measure on the test
site first. The shared module caches (`site/images.mjs`, `site/autolinks.mjs`, `site/pageColors.ts`) were not the cause, and the
after-build steps are untouched by the flag.

#### Batch 8. Incremental builds (up to about 6 s) — verify first, after batch 2

- Depends on batch 2's verification: Astro's cache is `node_modules/.astro/`; if `npm clean-install` removes it, this
  batch is dropped (or waits for Cloudflare to restore the cache after the install).
- `experimental.incrementalBuild: true`, and a `cacheKey` from `pages/[...slug].astro` and `pages/blog/tags/[category].astro`:
  the entry's `digest` plus **one site-wide digest** of what pages read without importing it: the image manifest and the
  Library's records (`site/images.mjs`), the autolink words (`linksDigest`), icons, theme, CSP, the apps' settings, the
  video stills, the editor's version, and the list of all pages and posts (menus, blog lists and tags show other pages).
  A content save then renders only the pages it changed; a change to the menu or the colours renders all.
- A check that builds the demo fully and incrementally after a scripted change and compares with `compare-html`, so a
  missing input in the digest fails CI instead of leaving a stale page.

### Order and what the release gives

1. Batch 1 (Sara's line now; the CMS part in the release).
2. Batch 2's verification, then batches 2 and 3.
3. Batches 4, 5 and 7, independent of each other.
4. Batch 6's spec, then its build.
5. Batch 8 last, only if batch 2's verification allows it.

With batches 1, 2, 5, 6 and 7, a content save on Sara's site should take about **1 min 45 s** instead of 3 min 41 s;
batch 4 takes the image step out entirely for sites that turn it on. Each batch's pull request measures the build on the
test site before and after and writes the numbers here.

Release notes (skill `release-notes`): batch 1 ("Saves go live sooner"), batch 4 (the new setting); the others are
internal.

### A12 as built (CI slots from measured cost, and `prepare` timed)

Measured on 18 November 2026 with `gh api` over the 27 successful or failed `Check` runs of that day (runs with 11 or 12 jobs; the 3-job
runs are the dispatcher kind and are not counted).

| Level | Runs read | Jobs | Runner-minutes | Longest job | Wait for a runner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Into a feature branch (`feature/build-check-speed`, `feature/cards-lists`) | 22 | 11-12 | 51-82, median 71 | 8.7-15.2 min, median 10.9 | 2-3 s in 19 runs, 63 s in 1, 318-341 s in 2 |
| Into a version line (`0.18`) | 5 | 11 | 69-82, median 76 | 10.4-15 min | 2-3 s in 4 runs, 245 s in 1 |
| Full (`main`, the Release PR) | 0 since A4 and A5 | | the last one, #888: about 135, 18 min | | the daily full run has not fired yet |

The feature and line levels cost the same today (the line adds `demo` and the starter smoke; both are short). A run is 8 `screens` shards,
`screens-extra`, `static`, `build` and, at the line level, `demo` and the smoke. Of the 27 runs, 3 or 4 overlapped in 13 (the most, 4, on
`feature/cards-site-cards` at 11:14, waited 3 s), and the only long waits (245, 318 and 341 s) came with 3 overlapping. So the queue is not
the bottleneck at 3 runs and mostly not at 4; the evidence for 4 is thin (one run with 4 overlapping), so the rule has a way back.
**The rule** (`pm` skill, section 6): 4 light runs at once; a full-level run counts as 2; back to 3 when more than 2 runs wait over 2
minutes; measure again after the first daily full runs.

**Why one `prepare` shard takes 3 to 6 minutes.** `prepare` was timed from the log of the slow shard of run 44294061736 (`screens (8)`, 366 s;
`screens (1)` took 145 s, the other six 28-44 s). Its steps: Node 10 s (npm cache restored), `npm ci` 9 s, artifact download and unpack 4 s,
Playwright cache restore 6 s, and then `npx playwright install --with-deps chromium`: 5 min 40 s. All of it is `apt`: an `apt-get update` of
31 s, then the font packages (`fonts-wqy-zenhei` and others, 21.9 MB) fetched from the runner's Ubuntu mirror at 74 kB/s (4 min 54 s), then
2 s to unpack. The browser itself was a cache hit. So the slow shard is a slow mirror on that runner, not our code. The step runs on a hit
too, because the system libraries and fonts are not in the Playwright cache. It is a plain mirror problem, so nothing is changed beyond
the timing: `prepare` now prints `prepare timing: <step> <seconds>s` after `npm ci`, the unpack and the Playwright install, so the next runs
show it without reading the whole log. **Next, if it keeps coming back:** cache the apt packages (`/var/cache/apt/archives`), or skip
`--with-deps` and install only the libraries the screens need; both change what `prepare` installs, so they are a separate pull request.

### Round 2 (25 Nov 2026): the screens check without fixed waits, on test pages

Owner, 25 Nov 2026, after asking why the screens shards take so long and whether they can be loosened: "Can we make special test pages
instead?", then "Yes, write the plan". The direction of 18 Nov stands ("test less, but the important things") and so does this plan's
rule: no test is skipped, disabled or deleted to save time. What is new: a check may **move** to a faster form, when the new form is
proved to catch what the old one caught.

#### Where the time goes (the times file, the full run of 18 Nov: 363 units, 3,468 s, about 434 s a shard)

- **Two widths.** Units at 375 px take 1,412 s and at 1280 px 1,307 s: 78 % of the time is the same checks at a phone and a computer width.
- **Fixed waits.** `scripts/screens/` holds 557 `waitForTimeout` calls (199 of 300 ms, 79 of 400, 70 of 500), many inside loops that run
  per screen, per section colour and per width. A few units already wait for the real state (`getAnimations()` in `block-bar.mjs`,
  `reducedMotion` in `page-rows.mjs` and `text-bar.mjs`).
- **The slowest checks** (both widths together): `choice-group` 242 s, `checkFocusIndicators` 203, `checkInsertNeverOpensSheet` 169,
  `checkTextBar` 157, `checkBlockHandleCorner` 155, `checkTableAlign` 149, `checkInlineTable` 148, `checkDynamicList` 141,
  `checkAnchoredParts` 107, the walk `screens` 104.
- **Per shard:** `prepare` (install, the build's artifact, Chromium) before the first unit, and every shard waits for `build`.

#### A13. Wait for the state, not for the clock

One helper in `scripts/screens/support/` that waits for what a unit needs: the element is there and visible, its animations have ended
(`getAnimations({ subtree: true })` empty), no request is pending. Every `waitForTimeout` in `scripts/screens/` is replaced with it, or
with Playwright's own wait for the condition (`waitForSelector`, `waitForFunction`). A wait that stays (a continuous indicator, a timer
the editor itself runs) carries the comment `// wait-ok` with the reason. A test (`scripts/screens-waits.test.mjs`) fails on a new
`waitForTimeout` without one. No unit changes what it checks.

Gap closed: motion is a spring (`--motion-spatial-fast`), so a fixed wait that is too short flakes on a slow runner and one that is too
long wastes time; waiting for the animations to end is both faster and steadier. Units that test motion itself (`page-rows`, `text-bar`)
keep their own waits on the animation.

#### A14. One width where the widths do not differ

A unit runs at both widths only when the screen it checks is laid out differently below 600 dp (a page or bottom sheet on a phone, a side
sheet or menu on a computer, the rail or the drawer, a carousel that shows only on a phone). Otherwise it runs once, at 375 px (the tighter
of the two). The pull request lists each unit that drops a width with that reason, beside its `unit(...)` line in its area file. When in
doubt it keeps both. The walk `screens` keeps both widths.

#### A15. Test pages for what things look like

A check of **how something looks** (colours on every section colour, contrast, sizes and targets, icons, the outline, text in a state)
moves to a test page: every case laid out at once, loaded once, measured in one pass, as `m3-render` measures the UI components page today.
A check of **behaviour** (a click, a key, a save, a drag, what a screen reader announces as you move, a list growing as you type) stays a
flow on the real screen.

- **Where.** Editor parts: the editor's developer screens (*Developer > Parts*, `#developer/parts/…`), which already hold the UI
  components and the editor's own parts and ship with every site's editor; a state the page cannot hold by itself (an open menu, an error)
  is shown by the sample's props, not by a copy. Blocks in the page editor: unlisted demo pages (`demo/src/content/pages/test-<area>.md`,
  *Hide from search engines*, in no menu), opened in the editor, with every block on every section colour. Never a customer's content
  and never a page of the starter.
- **No weight for the editor.** The developer screens' test samples load only on those screens (their own chunk, as a lazy import), so
  no other screen of the editor loads more (`CLAUDE.md`: blazingly fast).
- **The starter's run.** The full level runs the screens again on the starter (`starter` shards). `check:starter` lays the demo's
  `test-*.md` pages into its temporary site for the run, never into `starter/` itself, so a moved check runs there as before.
- **Real parts only.** A test page draws the real components through `src/ui.tsx` and the real `View.tsx`, never a copy or a
  test-only variant, so it tests what ships.
- **The demo's rules.** `scripts/demo-blocks.mjs` and `check:demo` know the test pages: they are not Blocks pages (not in `/blocks/`, not
  counted by "none twice"), and the demo's screenshots of themes skip them.
- **Moving a check.** One area at a time. The new check is proved to catch what the old one caught: the pull request breaks each rule the
  old unit checked once on purpose (locally, not committed), shows the new check failing on it, and lists the cases. Only then is the old
  unit removed, in the same pull request. The walk `screens` stays as it is, so a part used wrongly on a real screen is still found there.
- **First candidates**, by time: `choice-group`, `checkInlineTable` and `checkTableAlign`, `checkIconSlots` and `checkIconColor`,
  `checkCardsElevation`, `checkListDesigns`; the inventory below decides.

**Step 0, the inventory** (one session, no code): every unit in `scripts/screens/*.mjs` marked *look*, *behaviour* or *both* (split),
with its time from `unit-times.json`, written as a table into this plan. The PM gives the moves in that order, slowest first.

#### A16. The number of shards, last

After A13 to A15 have merged, `node scripts/refresh-unit-times.mjs` on the next full run's logs rewrites the times file, and the matrix of
`screens` is set from its table (A8). More shards cost nothing on a public repository but each repeats `prepare`, and GitHub runs 20 jobs
at a time per account, so the count is chosen from the measured times and A12's CI slots are set again from the new cost.

#### Order and measuring

A13, then A14, then step 0 and A15 area by area, then A16. Each is a pull request into `main`, one at a time (test code has an empty
changeset; one that adds samples to the developer screens ships editor code and has a patch changeset, skill `changesets`): they share
`scripts/screens/`. After the auto-merge plan's CI step (`2026-11-25-dev-auto-merge-feature.md`, step 2), which also touches `check.yml`.
Each pull request measures a full run before and after (building block 4) and writes the numbers here. The `checks` skill, *What CI runs*,
changes with A13 (the wait rule) and A16 (the shard count).
