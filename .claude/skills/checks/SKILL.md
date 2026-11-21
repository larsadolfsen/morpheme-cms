---
name: checks
description: Use before pushing a change to morpheme-cms, or when a CI job fails - "which checks", "check:screens", "check:demo", "check:starter", "shard", "contrast", "density", "CI failed". Says which of the repository's checks fits which change, what CI runs, and how to run one part of the screens check.
---

# The repository's checks

Announce "Using checks". Run every command from the root of this repository, on the demo (`npm run build` builds it in
`.morpheme/demo/site/`). `npm run check` always; the others when the change touches what they check.

## What CI runs

**The direction (owner, 18 Nov 2026): test less, but always the important things.** Plan:
`docs/superpowers/plans/2026-11-18-build-and-check-speed.md`, track A. The levels below are the target; PR 1 (levels), PR 2 (build once, cached Chromium) and PR 3 (core set and touched areas), PR 4 (starter smoke test), PR 5 (daily full run), PR 6 (test versions from a line), PR 8 (shards balanced by time) and A7 (`static` reads the build) are built (what runs today is in the next table and below), the other new ones are not yet.

| Merge | Check |
| :--- | :--- |
| A piece into `feature/<name>` | **Feature check:** `static`, the build, the **core screens** (the editor opens, a page saves and publishes, the theme builds) and the screens areas the change touches. No full shards, no `starter`. |
| Every feature branch, once a day | The full check, so a break shows within a day. |
| A single pull request (a fix or a one-pull-request feature, a head that is not `feature/*`) into a version line | **Line check:** `static`, the core screens, the touched areas, `demo` and the starter **smoke test** (the site builds; open, edit, save, publish). |
| A `feature/*` branch into its version line, a version line into `main` (its release) and the Release PR | **Full check:** everything, with all starter shards. |

**Built (PR 1, checks on feature branches).** `check.yml` runs on pull requests into `main`, `0.17`, `0.18`, `0.19` and `feature/**`.
`checkLevel(base, head)` in `scripts/ci-changes.mjs` gives the level from the base branch (and the head: a `feature/*` head into a line is `full`) (the job `changes` prints `level=` beside
`light=`); it is tested for each level and the fallback in `scripts/ci-changes.test.mjs`:

| Base branch | Level | What runs today |
| :--- | :--- | :--- |
| `feature/**` | `feature` | the light check: `static` and the 8 `screens` shards with the core units and the touched areas only (`--areas`, below) |
| `0.*` (a version line), head not `feature/*` | `line` | the light check, as below, with the core units and the touched areas, `demo` and the starter smoke test (`starter-smoke`); not `screens-extra` and not the 4 starter shards |
| `0.*` (a version line), head `feature/*` (the feature into its line) | `full` | everything |
| `main`, and the Release PR from any base | `full` | everything |
| anything else, an empty base, an error in the selection | `full` | everything (when in doubt, run) |

**Removed (18 Nov 2026, was PR 6, test versions from a version line).** A merge into a line's branch stages nothing on npm; `publish.yml` still triggers on a
line's branch, but its job `release` (Release PR, `latest`) and the `next` job run on `main` only. A workflow-only change is outside the starter and demo (`ci-changes.mjs`).

**Built (PR 5, the daily full run on feature branches).** `.github/workflows/daily-full.yml` runs once a day (02:17 UTC; from `main`, as every schedule) and dispatches
`check.yml` (`workflow_dispatch`, `level=full`) on each `feature/**` branch that has a commit `main` lacks, whose head has no `daily-full` status yet and has no full run
going; at most 6 a day (`scripts/daily-full.mjs`, tested in `scripts/daily-full.test.mjs`). The dispatched run is the same jobs at the full level (no diff, everything, all starter
shards, no changeset check). The job `check` marks the head with the commit status `daily-full` (`success` or `failure`); a cancelled run writes no mark and runs again the next day; a head
with a mark is not run again until it changes. Read it: `gh api repos/larsadolfsen/morpheme-cms/commits/<branch>/statuses --jq '[.[]|select(.context=="daily-full")][0]'`. A branch cut before
this change needs its line merged into it first (its own `check.yml` must have `workflow_dispatch`). Details and cost: plan, "A5 as built".

**Built (PR 2, build once, cache Chromium).** The job `build` (not on a docs-only pull request) runs `npm ci` and `npm run build` once and
uploads one tarball, the artifact `build` (`.morpheme/demo/site` and `node_modules/@morphemecms/cms`, 18 MB, kept 1 day). `screens`,
`screens-extra` and `demo` need `build`; each runs `npm ci` (they still need `node_modules`), unpacks the tarball and runs its checks
as before. `starter` has no build to take (it packs the package and builds the starter itself), so it does not wait for `build`. The steps
every job shares are the local action `.github/actions/prepare` (Node, `npm ci`, the artifact, Chromium). Chromium is cached in
`~/.cache/ms-playwright`, keyed on the Playwright version; a hit skips the download and only the system libraries are installed with apt.
The job `build` keeps its tarball in Actions' cache under `scripts/ci-build-key.mjs`'s key (`lib/outputKey.mjs`: the hash of every tracked file
the build can read, except `docs/`, `.claude/`, `.agents/`, and `.changeset/`, and the Node major version; never file times) and
builds only on a miss, which happens on the first run of a pull request that changes an input; a push that changes none (docs, a changeset) and a
re-run take the kept build. A root `.npmrc` (`prefer-offline`, no audit, no fund) makes `npm ci` use the npm cache first.
An Actions cache is read only by the branch that saved it, the default branch and a pull request into its base branch, and `check.yml` runs only on pull
requests, so every pull request started with cold caches (npm's cache and Chromium). `.github/workflows/cache-fill.yml` runs on every push to
`feature/**` and `0.*` (each merge into it, plus `workflow_dispatch`), does the same set-up as the jobs (`.github/actions/prepare`, so the same keys), and saves the
caches for the next pull request into that branch. It builds and checks nothing and has `contents: read`. Not kept this way: the build (a pull request's
inputs rarely equal the branch's), so the kept build still hits only on a re-run.
A failed `build` leaves its jobs skipped, which the verdict turns red. The levels, `scripts/ci-changes.mjs` and the verdict are unchanged.

**Built (PR 3, touched areas and the core set).** The feature and line levels run the 8 `screens` shards on the **core set** plus the
**units of the touched areas**; the full level (`main`, the Release PR, an unknown base) runs every unit, unchanged.

- **The map** is `RULES` in `scripts/screens/support/areas.mjs`, next to the areas (`scripts/screens/<area>.mjs`), read with the engine
  `lib/affected.mjs` (`select(paths, rules)`; track B reads its own rules with it). A rule is `[pattern, areas | 'none' | 'all']`, the first
  match decides. `'none'` is for what no screens unit reads (docs, tests, the Worker, the static-only checks), `'all'` for what can show
  anywhere (`src/ui.tsx`, `src/editor.css`, `src/store.ts`, `src/i18n/`, `theme/styles/`, `theme/ui/`, most of `lib/`), and a narrow rule names
  the area that owns a file **and its neighbours** (a change to `src/Library.tsx` runs `files` and `sheets`). **A path no rule knows runs
  everything**, and `scripts/screens-areas.test.mjs` fails until every tracked path has a rule, so a new folder or file always gets a decision.
- **The core set** is `CORE_UNITS` in the same file: `screens 390`, `screens 1280`, `key states` (every screen opens, icons exist),
  `checkSaveKeyNoAutosave` (a page is edited and Save commits it) and `checkSpacingGrid 375` / `1280` (the theme builds and the site is drawn).
  It runs on every pull request that is not docs-only. A unit leaves a level only by being outside the core set and outside the touched
  areas; none is skipped, disabled or deleted.
- **In CI** the job `changes` prints `areas=all|none|<area>,<area>` (`screensAreas` in `scripts/ci-changes.mjs`; `all` for the full level,
  the Release PR, an empty diff, an unknown path and any error) and each `screens` shard runs `npm run check:screens:shard -- K/8 --areas <areas>`.
  The selected units are spread over the 8 shards (by their measured time since PR 8, below). An `--areas` value the runner cannot read (an
  unknown area, a missing core unit) runs every unit.
- **Locally**, `npm run check:screens:shard -- K/N --areas files,sheets [--list]` runs or lists one part of a selection; `--areas none` is the
  core set alone. **A new unit goes in its area's file and is in the selection of that area automatically**; a new area file needs its name in
  `AREAS` and a rule (the test fails until it has both). A change to the screens harness (`scripts/screens/support/`, `scripts/editor-screens.mjs`) runs everything.

**Built (PR 8, shards balanced by time).** The selected units are dealt to the shards by their measured time, not by number, so the slowest
shard sets a shorter wall time (`scripts/screens/support/balance.mjs`, tested in `scripts/screens-balance.test.mjs`).

- **Where the times come from.** The runner prints `unit N name: S s` for each unit it runs. `scripts/screens/unit-times.json` keeps the times
  of the last full run (every unit, all shards). `node scripts/refresh-unit-times.mjs <the logs of the 8 screens jobs> --from "<run>"` rewrites
  it and prints the shard count the same times suggest (`--target <seconds>`, default 240) and each shard's time for 4 to 12 shards. Never edit
  the file by hand; refresh it after a full run (a version line into `main`) or when units were added or got much slower.
- **The deal.** The selected units (all of them, or the core set and the touched areas) are taken slowest first, each to the shard with the
  least time so far (ties go to the lowest shard), so it is the same on every run and in every shard. A unit with no time (a new one) gets the
  average of the file. Every selected unit runs in exactly one shard and together the shards run all of them, with or without `--areas`.
- **When in doubt.** A missing, unreadable or empty times file deals by number (`index % N` among the selected units), as before. A time never
  skips, disables or deletes a unit. A change to the times file or the refresh script runs no extra unit (`areas.mjs`, rule `none`).
- **The number of shards** is the matrix of the `screens` job in `check.yml`; choose it from the refresh script's table, not by hand.

**Built (A7, `static` reads the build).** `static` needs `build` and unpacks its artifact: it runs `npm run check:source` (the checks of `npm run check` before the
build, types included) and `npm run check:built` (`check:site-types`, `check:editor`) and does not run `npm run build` again; a docs-only pull request has no `build`, so
`static` builds there. `npm run check` is unchanged for a local run (`format:check`, `check:source`, `build`, `check:built`). At the feature and line levels Prettier checks only
the files the pull request changed against its base (`formatScope` in `scripts/ci-changes.mjs`, `format=changed` from the job `changes`); the full level, the Release PR, an
empty diff, any error and a change to Prettier's settings or packages (`.prettierrc*`, `.prettierignore`, `.editorconfig`, `package.json`, `package-lock.json`, `check.yml`)
check every file. `npm run check:types` keeps `.morpheme/tsc/types.tsbuildinfo`; `static` restores it from the cache under the key of `scripts/ci-tsc-key.mjs` (TypeScript, `tsconfig.types.json`,
the lock file, Node), and tsc itself compares the source files, so a cold run and a warm one give the same result.

**Built (PR 4, the starter smoke test).** `npm run check:starter -- --smoke` (`scripts/check-starter.mjs`): the same pack, install in a copy of the starter, the site's own
`npm run check`, the migrate checks and `npm run build` as the shards run, then, instead of the screens in shards, the core screens set on the starter's content
(`check:screens --areas none`: every screen opens, a page is edited and Save commits it) and `scripts/check-save-twice.mjs` (a page edited, saved twice and published). The
job `starter-smoke` runs it once, at the **line level only**; the full level keeps the 4 `starter` shards and does not run the smoke test (the shards contain it), and the feature
level runs neither. The line level also runs `demo` now. `SKIPPED_AT` in `scripts/ci-changes.mjs` says what each level skips (`feature`: `screens-extra`, `demo`, `starter`,
`starter-smoke`; `line`: `screens-extra`, `starter`; `full`: `starter-smoke`); the job `check` passes the level to the verdict, so a job that runs where it should not, or is skipped where it should run, is red.
`starter-smoke` is also skipped when `starter_demo` is false.

Not built yet: the daily
full run on feature branches (PR 5), `next` builds from a version line (PR 6).

Always tested, at every level: Prettier, types, `npm run check` (language, tokens, colours, rules), the changeset, the build, the core
screens and the screens of what changed. Every job that reads the build uses the one shared build, and every browser job a cached Chromium (PR 2).

`.github/workflows/check.yml` runs on every pull request into `main`, `0.17`, `0.18`, `0.19` and `feature/**`, in two sizes (owner, 16 Nov 2026: a
merge into a version line shows on the demo within minutes). Its job `check` waits for the jobs and must be green on the current head
before the PM merges.

- **Light check, base is a version line or a feature branch** (`0.17`, `0.18`, `0.19`, `feature/**`; not the Release PR): `changes`, `static` (Prettier, language, the
  changeset, `npm run check`) and `check:screens` in its 8 shards (the core units and the touched areas only, see *Built (PR 3)*; the numbers here are of the all-units run). About 8 minutes (median of the shards 8.0, longest 10.9). A version line
  also runs `check:demo` and the starter smoke test (*Built (PR 4)*). It skips `check:screens:extra` and the 4 starter shards (a median of 14.2 minutes, the longest 19.8); a feature branch also skips `check:demo` and the smoke test. The
  PM may merge into a version line on a green light `check`.
- **Full check, base is `main`**: the merge of a version line into `main` (`merge-0.18-into-main-N`) and the Release PR run everything:
  `static`, all 8 `screens` shards, `screens-extra`, `demo` and the 4 `starter` shards. A merge of a version line into `main` needs this
  full run green. Nothing reaches npm `next` or the owner without it.
- The job `changes` decides with `isLight(base, head)` in `scripts/ci-changes.mjs` and prints `light=true|false`; an empty or unknown
  base, `main`, the Release PR or any error in the step gives `light=false`, so everything runs. The changeset check is in `static` and
  stays on every pull request.
- The light check picks `screens` units from the changed files: the core set and the touched areas (*Built (PR 3)* above).

**A docs-only pull request skips the heavy jobs** (`screens`, `screens-extra`, `demo`, `starter`); `static` (Prettier, language,
changeset, `npm run check`) always runs. The first job `changes` decides from `git diff --name-only origin/<base>...HEAD`
(`scripts/ci-changes.mjs`, tested in `scripts/ci-changes.test.mjs`). Docs-only means every changed file is under
`.claude/skills/` or `docs/`, is a changeset (`.changeset/*.md`), or is `CLAUDE.md`, `AGENTS.md`, `README.md` or `SECURITY.md`.
`release-notes/` and `CHANGELOG.md` are never skipped (`check:release-notes`, the notes tests and the editor's build read them), and
neither are the Release PR, an empty diff or any other path: when in doubt, everything runs. There is no `paths-ignore`, because
`check` must always report. It is green when `static` and `changes` are green and each heavy job is green, or skipped on a
docs-only pull request, or (`screens-extra`, `demo`, `starter`) on a pull request into a version line; a failed or wrongly skipped job makes it red. To put a folder on the list, first find which
checks read it (`grep` the scripts and tests) and change the list and its test in `scripts/ci-changes.mjs` only.

**`starter` and `demo` are also skipped when no changed file can affect them** (`needsStarterDemo` in `scripts/ci-changes.mjs`; the job
`changes` prints `starter_demo=false`). Both jobs work on the package as it ships (`starter` packs it, `demo` builds the editor and the
demo), so only paths that neither reads are skipped: docs, `.claude/`, `.agents/`, changesets, the other workflows,
`*.test.*` files and the static-only check scripts and allowlists (`check-language`, `check-phosphor`, `check-web`, `check-editor-colors`,
`check-colors`, `check-css-values`, `check-density`, `phosphor-allowlist.json`, `web-allowlist.json`). Everything else runs them: `src/`,
`theme/`, `lib/`, `pages/`, `site/`, `worker/`, `bin/`, `defaults/`, `starter/`, `demo/`, `release-notes/`, `package.json`, the lock file,
`wrangler.jsonc`, any other script, `check.yml` and `ci-changes.mjs` itself, the Release PR and an empty diff. `screens`, `screens-extra`
and `static` run on every pull request that is not docs-only (`screens-extra` not on a light one, `demo` not on a feature one). The job `check` treats a job skipped by this filter as green. To add a path
to the skip list, first `grep` that neither job reads it (the list's comment says how), and change the list and its test only.

A new push to a pull request cancels that pull request's older queued and running `Check` runs (`concurrency` in
`check.yml`); only the newest head's run counts. `check` does not report a run as failed when a newer push cancelled it: it looks up the pull request's current head
(`gh api repos/<repo>/pulls/<n> --jq .head.sha`, token with `pull-requests: read`) and compares it with this run's
`github.event.pull_request.head.sha`. Only when a job is cancelled, none failed and the two heads differ, `outcome` in
`scripts/ci-changes.mjs` says `cancelled`: the job prints `cancelled=true` and ends without red. A cancel on the same head (a manual
cancel, a lost runner, a timeout), a failed lookup, a job that really failed (also next to a cancelled one) and a job skipped wrongly
are all still red: when in doubt it stays red.

## The commands

| Command | Run it when | What it checks |
| :--- | :--- | :--- |
| `npm run check` | always | Prettier, `check:language`, `check:phosphor`, `check:css-tokens`, `check:mo-names`, `check:token-names`, `check:token-registry`, `check:web`, `check:editor-colors`, `check:tailwind`, `check:colors`, `check:css-values`, `check:density`, `check:release-notes`, the unit tests (`npm test`), the package's types (`check:types`), the demo built (`npm run build`, its content checked by the editor's rules), `check:site-types` and `check:editor` (each page the same after a save). |
| `npm run check:screens` | the editor changed (after `npm run build`) | All of the editor's screens open without errors, on a phone and a computer, and all icons exist; the site's margins, paddings and gaps on the Blocks page are on the 4 dp grid (`checkSpacingGrid`, exceptions with reasons in `scripts/spacing-grid.allow.mjs`). Each installed app's blocks are drawn on a test page of the app's own (`check-page.md`, `docs/app-contract.md`); an app without one is checked with default values and a warning that names it. The checks that measure the Blocks page (spacing, cards, tables) measure the system's test page (`scripts/core-blocks-page.mjs`), built on first use from a temporary copy of the site in `.astro/test-site/` and deleted when the run ends; `check:screens:extra` also checks that it is `noindex, nofollow` and in no sitemap, feed or list (`scripts/check-test-page.mjs`). |
| `npm run check:screens:shard -- K/N` | to run one part of `check:screens` | Every N-th unit of the screens check (the runner is `scripts/editor-screens.mjs`; the units are in `scripts/screens/<area>.mjs`, one file per area, so **a new unit goes in its area's file and in no other place**: add its `checkSomething` function and its `unit(...)` line to that file's `register` function, and never edit `scripts/screens/order.txt`, which freezes the numbering of the units that existed when the check was split; a unit that is new is numbered after them, in the order of the files); add `--list` to print the part's units without running them. `node ../../../scripts/editor-screens.mjs --only <unit name> <dist>` runs one unit on its own (`CHROMIUM_PATH` for another Chromium). `check:screens:extra` runs the checks over the whole site (save twice, unlisted, preview). `check:screens` with no part runs everything. |
| `node ../../../bin/morpheme.mjs check:themes` (in `.morpheme/demo/site/`) | a theme, the default theme, blocks or the editor changed | The same with each of the other themes. |
| `npm run check:starter` | the starter, the Worker or what a site installs changed | The starter works as a site with the package from `npm pack`: its own `npm run check` (the site's types and `check:worker`) and its build. `-- --smoke` adds only the core screens and a save-twice-and-publish run (about 5 minutes locally); `-- --screens --shard K/N` adds a part of every screen (CI's full level). |
| `npm run check:demo` | the CMS, the default theme or the demo changed | The demo builds with the default theme and follows the editor's rules; its Blocks pages are in order: every example on the page of the component that draws it (a special block on its own page), none twice, every page in the index at `/blocks/` (`scripts/demo-blocks.mjs`). |
| `npm run check:language` | text changed | No Danish text outside the language files (`i18n/da-DK/`); no old word for *image* (`scripts/check-language.mjs`). |
| `npm run check:density` | a height or vertical padding in the theme changed | Every part of the theme with a height or vertical padding in the density list writes it with the density step; a menu, dialog or snackbar never gets denser than Medium, and no horizontal padding or text size follows density (`scripts/check-density.mjs`; the sizes at each step are in `check:screens`). |
| `npm run check:editor-colors` | `src/editor.css` or `src/Inline*.tsx` changed | No fixed colour in the editor's block parts (allowlist with reasons). |
| `npm run check:tailwind` | any change | Tailwind stays gone (contract 7, T16 and T17), with no allowlist: a utility class, variant or arbitrary value in a class attribute (`.tsx .astro .jsx .md`) or in a string of utilities (`.ts .mjs .js`), `@theme`, `@utility`, `@plugin`, `@apply`, `@source`, `@reference`, `theme(--` or `--tw-` in a stylesheet, a tailwind package in `package.json` or a tailwind plugin in Prettier's settings fails. The rules and the frozen list of utility names are `site/tailwind.mjs` and `site/tailwind-utilities.json`; `check:content` runs them on a site's `src/themes`, `src/apps`, `src/site` and `src/content`, so `check:themes` does too. |
| `npm run check:css-tokens` | a custom property in `theme/`, `src/*.css`, `starter/` or an app's or theme's CSS changed | No new unprefixed custom property on `:root`, `html` or `body` (only `--mo-…`; no exemption for `--tw-*` or `@theme`; count mode per file in `scripts/css-tokens-allowlist.json`, empty since the rename), and no app or theme declares a name the CMS declares (`docs/css-tokens.md`). |
| `npm run check:mo-names` | a class or custom-property name in `theme/`, `src/`, `pages/`, `defaults/`, `site/`, `lib/` or `scripts/` changed | The permanent check for the `mo-` names (`docs/class-names.md`), with no allowlist: an unprefixed class or custom property defined, written or read; an old name of the rename (`scripts/renamed-classes.json`) in a class list or a selector string; a `[class*=…]`, `[class^=…]` or `[style*=…]` selector that spells another name; a `mo-` class of the wrong shape; a plain class attribute without `mo-`. What is not ours has its reason in `NOT_RENAMED` (`scripts/mo-names.mjs`). `check:content` runs it on a site's `src/themes` and `src/apps`. |
| `npm run check:token-names` | a custom property is renamed, or a stylesheet, script or doc writes a token name | No tracked file writes a name listed in `scripts/renamed-tokens.json` (the old names of the `--mo-ref-*`, `--mo-sys-*` and `--mo-comp-*` rename, which has no aliases); a rename PR adds its names to the list (`docs/superpowers/plans/2026-11-16-token-rename-table.md`). Not read: `docs/superpowers/`, release notes, changesets, `CHANGELOG.md`. Part of `npm run check`. |
| `npm run check:token-registry` | a `--mo-sys-*` or `--mo-ref-*` token with a plain default is added, changed or removed | The `@property` registry files `theme/styles/tokens/<origin>/registry.css` match the tokens' defaults (`node scripts/gen-token-registry.mjs` writes them, then Prettier). Part of `npm run check`. |
| `npm run check:phosphor` | icons in code changed | No new direct `@phosphor-icons/react` import (allowlist with reasons in `scripts/phosphor-allowlist.json`). |
| `npm run check:a11y` | any change a person sees (the site, the theme, a screen of the editor), and a change to the scan itself, after `npm run build` (the site, about 1 minute, in the job `demo`: the line and full levels) | WCAG 2.2 AA with axe-core (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) on every built page of the demo at 1280 and 375 px, light and dark. It fails on a violation that is not on `scripts/a11y-allowlist.json` and on an entry that no longer matches (the list only shrinks; a fix removes its entries, never adds one without the owner's approval). The editor's screens are scanned in the screens units `screens 390` and `screens 1280` (core set, so in every `screens` shard job), never run by hand: `node ../../../scripts/editor-screens.mjs --only "screens 390" dist` from `.morpheme/demo/site/` does one width (about 3 minutes). `check:a11y -- --list` and `A11Y_COLLECT=<file>` on the units print what is found as allowlist entries. Rules and matching: `scripts/a11y.mjs`, tested in `scripts/a11y.test.mjs`. Not run by `npm run check`. |
| `npm run check:keyboard` | a change to an editor screen, a sheet, a dialog, a menu or the bars (the top bar, the text bar, the Save bar), after `npm run build` (about 10 minutes on its own, so run it only for such a change; it runs from `.morpheme/demo/site`; `-- --flows`, `-- --screens` and `-- --only a,b` run a part, `-- --list` prints what is found as allowlist entries, `KEYBOARD_TRACE=1` prints the flows' steps) | The editor by keyboard alone (WCAG 2.2 AA: 2.1.1, 2.1.2, 2.4.3, 2.4.7, 2.4.11, 3.2.1; plan `docs/superpowers/plans/2026-11-20-0-19-3-keyboard.md`). The Tab walk of every editor screen (up to 150 presses) fails on a trap, covered focus, invisible focus, no indicator (text fields counted with the caret shown) and lost focus; the flows A to I (write, blocks, format, page settings, images, menus, lists, settings, dashboard; A, B and F also at 375 px) fail when a step's control can't be reached by keyboard or focus is on `body` after something opens or closes. It fails on a problem that is not on `scripts/keyboard-allowlist.json` (problem, screen or flow, selector, reason) and on an entry that no longer matches, so the list only shrinks: a fix removes its entries, an entry is added only with the owner's approval. The walk runs in the screens units `screens 390` and `screens 1280` and the flows in `checkKeyboardFlows 1280` and `checkKeyboardFlows 375` (core and `start-screens` area, so in the `screens` shards); never run those by hand in full: `node ../../../scripts/editor-screens.mjs --only "checkKeyboardFlows 1280" dist` from `.morpheme/demo/site` does one. Skipped on a site that installed the package. Rules and matching: `scripts/keyboard.mjs`, flows: `scripts/keyboard-flows.mjs`. Not run by `npm run check`. |
| `npm run check:announce` | a change to a name, a label, a message, a snackbar, a notice, a dialog, a sheet, a menu, a tab or a live region (`aria-live`, `role=status`, `role=alert`), after `npm run build` (about 8 minutes on its own; it runs from `.morpheme/demo/site`; `-- --flows`, `-- --screens` and `-- --only a,b` run a part, `-- --list` prints what is found as allowlist entries) | What a screen reader gets of the editor (WCAG 2.2 AA: 1.1.1, 1.3.1, 2.4.6, 3.3.1, 3.3.2, 4.1.2, 4.1.3; plan `docs/superpowers/plans/2026-11-21-0-19-4-screen-readers.md`). The name walk reads Chromium's accessibility tree on every editor screen and on one page per block, the demo's Blocks pages (at 1280 and 390 px), never on the other content items or the text a site owner wrote in a text area (owner, 21 Nov 2026; `announceWalks` and `isAuthored` in `scripts/announce.mjs`), and fails on a control with no name, a name that is an icon's ligature, punctuation, its role, a file name or an id, a name repeated in one list, a dialog, menu, tab panel or region with no name, a tab with no selected state, a menu button with no `aria-expanded`, an `aria-describedby`, `aria-labelledby` or `aria-controls` that points nowhere, an invalid field with no description, a disabled `Save` with no reason, and a live-region mistake. The flows A, B, C, F, I (the keyboard check's) and J, K, L (save and errors, messages, open and close; A, B, F and J also at 375 px) run with a recorder of every live region and `document.title`, and fail when a step that should be announced is not (a region that came into the page with its text does not count), the same text is announced twice, the urgency is wrong, or focus is on `body` or on a node with no name. It fails on a problem that is not on `scripts/announce-allowlist.json` (problem, screen or flow, selector, reason) and on an entry that no longer matches, so the list only shrinks: a fix removes its entries, an entry is added only with the owner's approval. The name walk runs in the screens units `screens 390` and `screens 1280` and the flows in `checkAnnounceFlows 1280` and `checkAnnounceFlows 375` (`start-screens` area, so in the `screens` shards); never run those by hand in full: `node ../../../scripts/editor-screens.mjs --only "checkAnnounceFlows 1280" dist` from `.morpheme/demo/site` does one. The speech log, `announce-log.txt` (`ANNOUNCE_LOG` for another file), lists what a reader would say at each step; CI keeps it as the artifact `announce-log-<shard>`. Skipped on a site that installed the package. Rules and matching: `scripts/announce.mjs` and `scripts/allowlist.mjs`, flows: `scripts/announce-flows.mjs` (its `EXPECT` table says which steps must be announced, and with what text); the owner's real reader pass, which this check does not replace, is `docs/screen-reader-test.md`. A new announcement is a new `en-US` and `da-DK` text, and a new step to announce is a line in `EXPECT`. Not run by `npm run check`. |
| `npm run check:web` | CSS, layout, dialogs, colour scheme or forms changed | Modern Web Guidance's `legacy-scan` on `src/`, `theme/`, `pages/`, `lib/`, `worker/`, `starter/` and `demo/`: no new legacy pattern, and no allowlist entry that no longer matches (`scripts/web-allowlist.json`: key `<folder>/<file>` + rule id, `max`, `why`; a fix lowers or removes its entry; `node scripts/check-web.mjs --list` prints the current counts). A conflict with Material 3 or a theme component goes to the PM, never into the list without a reason. Part of `npm run check`, so CI's `static` job runs it. |
| `node --test scripts/pending-shared.test.mjs` | `worker/*.js` changed | No pending I/O promise kept in module memory (`CLAUDE.md`, *Worker*). |
| `cd .morpheme/demo/site && node ../../../scripts/measure-speed.mjs` | by hand, after `npm run build`, when a speed claim or a performance fix needs numbers (a few minutes, not in CI or `npm run check`; the numbers depend on the machine, so compare runs on the same one) | LCP, CLS, TBT, long tasks, long animation frames and the INP of scripted interactions (open menu, open a sheet, type, scroll, search) on the site's key pages and the editor's key screens, on a phone (375 px, CPU 4x) and a computer. `--runs N`, `--profile mobile\|desktop`, `--only <text>`, `--json <file>`; `CHROMIUM_PATH` for another Chromium. Baseline and method: `docs/performance-baseline.md`. |
| `npm run check:contrast` | by hand, after `npm run build`, when colours or blocks changed (about 4 minutes per theme, not in CI) | WCAG AA contrast of every block's text, icons and control borders on each section colour, on the site and typed in place in the editor, light and dark, phone and computer. `--all` runs every installed theme; `CONTRAST_DENSITY=-1` checks the editor at Small density. |

## Proving that a class rename did not change the look: `compare-styles`

Added 18 Nov 2026 (batch T01 of `docs/superpowers/plans/2026-11-16-move-away-from-tailwind.md`). A batch that renames classes without changing the look
proves it with these tools; `compare-html` alone cannot, because it compares markup.

- **The site:** build the base into a folder and the branch into another (`npx astro build --outDir <folder>`, or copy `.morpheme/demo/site/dist` before and after the change), then
  `node scripts/compare-styles.mjs <before> <after>` (`npm run compare:styles -- …`). It opens every page at 375, 700, 900 and 1300 px, light and dark, and on each
  section colour, with animations, `data-reveal` and motion frozen and the fonts loaded, and compares the computed style of about 60 properties and the bounding box of every element in
  document order. It prints the first element that differs in each case (its selector path and the property) and exits 1. The structure (same tags, same order) must be the same; class
  attributes may differ. `--pages /a/,/b/` and `--limit N` take a part for a quick try; a run takes about a second a page and width. Set `CHROMIUM_PATH` if Playwright's own Chromium is not installed.
  `node scripts/compare-html.mjs --ignore-classes <before> <after>` is the structure check that goes with it.
- **The editor:** `cd .morpheme/demo/site && STYLES_OUT=<folder> node ../../../scripts/styles-snapshot.mjs` writes a gzipped snapshot of the computed styles of every editor screen at
  375 and 1280 px, light and dark, density -1, 0 and 1 (about 15 minutes; `STYLES_ONLY=,settings` takes some screens). Take one folder on the base and one on the branch, then
  `node scripts/compare-styles.mjs --snapshots <before> <after>`. It uses the harness of `check:screens` (`scripts/screens/support/context.mjs`) and edits no unit. Images from another host are
  answered with a 1 px image so the network can not change a snapshot.

## While you work: `npm run check:fast`

Added 18 Nov 2026 (plan `docs/superpowers/plans/2026-11-18-build-and-check-speed.md`, A11). Run `npm run check:fast` after each step while you
work. It compares the files you changed with the base branch (found by itself, or `--base <ref>`) and runs only what they can break: Prettier on
the changed files, the static checks whose inputs changed, the unit tests in the folder of a changed file or naming it, `tsc`, and, when the
build reads a changed file, the build, `check:editor` and the screens **core set plus the units of the touched areas**
(`scripts/check-fast-plan.mjs`, over `isDocsOnly` and `needsStarterDemo` of `scripts/ci-changes.mjs` and `areasArg` of the screens map). It prints
what it ran and what it skipped and why. A path nothing knows, a package or config file, no base branch and any error run everything
(`--dry-run` prints the plan only). When the change reaches every screens area (a shared file such as `theme/styles/` or `src/ui.tsx`) it runs
the core set only and says so; `--screens all` runs every unit.

**It is not always quicker than `npm run check`.** On a change that reaches the build (a CSS file, `src/`, `theme/`), `check:fast` adds the screens core set
(about 2 minutes) that `npm run check` does not run, so a CSS-only change took about 190 s against 110 s. It is quicker for docs, skills, tests and the Worker. For
the quick mode while you iterate on a build-reaching change, run `npm run check:fast -- --screens none` (everything else, no screens); run the screens
(without `--screens none`) before you hand the change over.

`check:fast` is **not the gate**. `npm run check` stays what you run before the last push, and CI runs the full check.

## What to run before a push

Before a push a session runs `npm run check` and only the screens units that cover what it changed: `npm run check:screens:shard -- K/N --list`
finds the unit, and `node ../../../scripts/editor-screens.mjs --only <unit name> <dist>` (from `.morpheme/demo/site/`) runs it.
The full `check:screens`, `check:demo` and `check:starter` run in CI and are not run locally unless (a) the change is to the
screens harness itself (the shared helpers in `scripts/editor-screens.mjs`, the Playwright setup), (b) a CI job failed and the
failure does not reproduce with the changed units, or (c) the PM or the owner asks.
Why (owner, 16 Nov 2026): CI runs them in shards side by side, and a local full run takes 20+ minutes and does the same work twice.

A change to one component is checked on that component's demo page (`/blocks/<component>/`), not on all of them.

When a job fails, run the same command locally, fix the cause, and push again; never skip, disable or loosen a check
or add to an allowlist without the reason the allowlist asks for.
