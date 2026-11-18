# CI: check levels, test less but the important things (plan)

Status: approved by the owner, 18 November 2026 ("this is the direction we'll go in"). For the PM, as build tasks. The levels are in
the `checks` skill, *What CI runs*; feature branches in the `pm` skill, *Feature branches and the way to `main`*.

## Why: where the time goes today

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

## The levels (the target)

| Merge | Check | Aim |
| :--- | :--- | :--- |
| A piece into `feature/<name>` | `static`, build, core screens, touched areas | 3–4 min |
| Each feature branch, daily | full | |
| Into a version line | `static`, core screens, touched areas, `demo`, starter smoke | 5–6 min |
| A line into `main`, the Release PR | full, all starter shards | about 9 min after PR 2 and 4 |

**Always:** Prettier, types, `npm run check`, the changeset, the build, the core screens, the screens of what changed. When in doubt
(an unknown path, an error in the selection), everything runs, as `scripts/ci-changes.mjs` does today.

## The pull requests, in this order

1. **Checks on feature branches.** `check.yml` also runs on pull requests into `feature/**`; `ci-changes.mjs` gives the level from the
   base (`feature`, `line`, `full`) and its test covers each. Until PR 3, the feature level runs what the light check runs today. The PM
   opens no feature branch before this is merged.
2. **Build once, cache Chromium.** One job builds the editor and the demo and uploads them; the screens, `screens-extra`, `demo` and
   starter jobs download them instead of building. The Playwright browser is cached (`~/.cache/ms-playwright`, keyed on the Playwright
   version). Proof: the same run, timed before and after.
3. **Touched areas and the core set.** A map from source paths to the screens' area files (`scripts/screens/*.mjs`), kept next to
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
