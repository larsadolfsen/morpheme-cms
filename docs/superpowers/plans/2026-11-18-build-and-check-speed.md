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
4. **Starter smoke test.** `check:starter --smoke`: the starter packs and builds, and the editor opens, edits, saves and publishes on it.
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
12. **CI slots follow the cost.** When A2, A3 and A7 are merged and a feature check takes a few minutes, the `pm` skill's limit of 3 runs
    per PM is set again from the measured queue (more runs when they are short), so the slots do not become the bottleneck.

A2 and A7 use building blocks 1 and 3; A3 and A8 build on block 2; A11 uses block 2 for "the tests next to the changed files".

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
  `.agents/`, `.changeset/` and `staging-watcher/`, plus the Node major version. The job `build` keeps its tarball in Actions' cache under
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
are worth keeping for the network (one download of Chromium and of npm's cache per branch instead of per run), not for the minutes. **Open item** (owner of
the next pull request that touches `prepare`: A12, CI slots from measured cost, or a later one): the slow `prepare` shard is still unexplained. Time
`prepare`'s steps separately (apt, `npm ci`, the unpack, the browser; the composite action reports one step today), and look at the apt step
(`playwright install --with-deps`), which runs on a hit too.

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

### A11 as built (`npm run check:fast`)

`npm run check:fast` (`scripts/check-fast.mjs` runs, `scripts/check-fast-plan.mjs` decides; tests: `scripts/check-fast-plan.test.mjs`). It finds the base
branch (the remote `main`, `0.*` or `feature/**` the branch is fewest commits ahead of, or `--base <ref>`), takes the changed paths (committed,
staged, unstaged, untracked) and runs: Prettier on the changed files; the static checks whose inputs changed (a check leaves the plan only when no
changed path is one it reads); the unit tests in the folder of a changed file or whose text names a changed path or file; `tsc` when a changed
file is in its `include`; and, when the build reads a changed path (`needsStarterDemo`), the build, `check:site-types`, `check:editor` and the
screens core set plus the touched areas (`areasArg`). It prints what it ran, what it skipped and why, and that CI and `npm run check` are the gate.
When in doubt, everything: an unknown path (no rule in `areas.mjs`), a `..` path, no base branch, no changes, and a package or config file.
One deliberate narrowing, from the brief ("no full run"): when the change reaches every area, the screens run the core set only, the plan lists
"the units of every area" as skipped with the reason, and `--screens all` runs them. `npm run check` is unchanged.

**Measured** (18 November 2026, this development container, one run each, nothing else running; `--base HEAD` so only the one change counts):

| Change | `check:fast` | `npm run check` |
| :--- | :--- | :--- |
| Docs only (a line in `docs/theme-grid.md`) | 9 s (format, language, token-names, density) | 111 s |
| CSS only (a comment line in `theme/styles/ui.css`; every area, so the core set) | about 190 s (1 s format, 2 s language, 6 s token names, 12 s web, 28 s build, 136 s core screens, the rest under 5 s; 9 test files in under 1 s) | 110 s |

Read it with care. For docs the saving is 12 times. For a CSS change `check:fast` is **slower** than `npm run check`, because it also runs the screens core
set (136 s here), which `npm run check` does not; the work it adds is the screens check CI runs, and its static part is the same 25 s or less. A
shared CSS file reaches every area, so no area narrowing helps there; a change inside one area's files (`src/Library.tsx`: `files,sheets`) runs 6 core units and the units of those areas.

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

#### Batch 3. Images are made in parallel (about 20–25 s when all images are made)

- `responsive-images` today awaits one image after another. It runs the images through a small pool sized by
  `os.availableParallelism()` (sharp's own threads counted), so the first build of a site, a cleared cache and a big
  upload are faster. Same outputs, byte for byte; a test compares them.

#### Batch 4. Cloudflare can make the image sizes (about 42 s, the whole image step)

- A site setting (Settings › Developer › Caching and builds, next to R2 caching): **Image sizes by Cloudflare**,
  a switch, `On` / `Off`, off by default. When on, `Img.astro` and the Markdown image plugin write `srcset` addresses of
  the form `/cdn-cgi/image/width=<w>,quality=78,format=auto/<image>` and the build makes no `_r/` variants; the build
  still reads each image's size for `width` and `height`, and still makes the share image (`_s/`, 1200 × 630, cropped
  around what matters) unless the share image moves to a transformation too (`fit=cover,gravity=auto`; compare the crop).
- The editor turns it on only when the zone has transformations on, and says what it costs: a site like Sara's uses about
  400 unique transformations a month, inside the free 5,000.
- CSP: the addresses are on the site's own host, so `img-src 'self'` holds; check the Worker serves `/cdn-cgi/` paths
  untouched (`run_worker_first` is on).
- Batches 2 and 3 stay for sites without it and for the share images and video stills.

#### Batch 5. A faster install (about 5–10 s)

- Workers Builds runs `npm clean-install` itself. The starter (and the CMS update, for existing sites) adds an `.npmrc`
  with `prefer-offline=true`, `audit=false` and `fund=false`, so npm uses the restored cache and skips the network
  checks. Measure on the test site before and after.
- Look at the site's 543 packages: what the site's `package.json` installs that only the editor's local checks need
  (Playwright and the like) moves to what `check:screens` installs on demand. Measure, then decide.

#### Batch 6. The editor's client bundle is not built on every save (about 10–13 s) — needs a design

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
