---
name: checks
description: Use before pushing a change to morpheme-cms, or when a CI job fails - "which checks", "check:screens", "check:demo", "check:starter", "shard", "contrast", "density", "CI failed". Says which of the repository's checks fits which change, what CI runs, and how to run one part of the screens check.
---

# The repository's checks

Announce "Using checks". Run every command from the root of this repository, on the demo (`npm run build` builds it in
`.morpheme/demo/site/`). `npm run check` always; the others when the change touches what they check.

## What CI runs

**The direction (owner, 18 Nov 2026): test less, but always the important things.** Plan:
`docs/superpowers/plans/2026-11-18-ci-check-levels.md`. The levels below are the target; PR 1 and 2 of the plan are built (what runs today is in the next table and below), PR 3-6 are not yet.

| Merge | Check |
| :--- | :--- |
| A piece into `feature/<name>` | **Feature check:** `static`, the build, the **core screens** (the editor opens, a page saves and publishes, the theme builds) and the screens areas the change touches. No full shards, no `starter`. |
| Every feature branch, once a day | The full check, so a break shows within a day. |
| A feature branch or a single pull request into a version line | **Line check:** `static`, the core screens, the touched areas, `demo` and the starter **smoke test** (the site builds; open, edit, save, publish). |
| A version line into `main` (its release) and the Release PR | **Full check:** everything, with all starter shards. |

**Built (PR 1, checks on feature branches).** `check.yml` runs on pull requests into `main`, `0.17`, `0.18`, `0.19` and `feature/**`.
`checkLevel(base, head)` in `scripts/ci-changes.mjs` gives the level from the base branch (the job `changes` prints `level=` beside
`light=`); it is tested for each level and the fallback in `scripts/ci-changes.test.mjs`:

| Base branch | Level | What runs today |
| :--- | :--- | :--- |
| `feature/**` | `feature` | the light check: `static` and the 8 `screens` shards (as the line level, until PR 3) |
| `0.*` (a version line) | `line` | the light check, as below (`demo` and the starter smoke test come in PR 4) |
| `main`, and the Release PR from any base | `full` | everything |
| anything else, an empty base, an error in the selection | `full` | everything (when in doubt, run) |

**Built (PR 2, build once, cache Chromium).** The job `build` (not on a docs-only pull request) runs `npm ci` and `npm run build` once and
uploads one tarball, the artifact `build` (`.morpheme/demo/site` and `node_modules/@morphemecms/cms`, 18 MB, kept 1 day). `screens`,
`screens-extra` and `demo` need `build`; each runs `npm ci` (they still need `node_modules`), unpacks the tarball and runs its checks
as before. `starter` has no build to take (it packs the package and builds the starter itself), so it does not wait for `build`. The steps
every job shares are the local action `.github/actions/prepare` (Node, `npm ci`, the artifact, Chromium). Chromium is cached in
`~/.cache/ms-playwright`, keyed on the Playwright version; a hit skips the download and only the system libraries are installed with apt.
A failed `build` leaves its jobs skipped, which the verdict turns red. The levels, `scripts/ci-changes.mjs` and the verdict are unchanged.

Not built yet: the core set and touched areas (PR 3), the starter smoke test (PR 4), the daily
full run on feature branches (PR 5), `next` builds from a version line (PR 6).

Always tested, at every level: Prettier, types, `npm run check` (language, tokens, colours, rules), the changeset, the build, the core
screens and the screens of what changed. Every job that reads the build uses the one shared build, and every browser job a cached Chromium (PR 2).

`.github/workflows/check.yml` runs on every pull request into `main`, `0.17`, `0.18`, `0.19` and `feature/**`, in two sizes (owner, 16 Nov 2026: a
merge into a version line shows on the demo within minutes). Its job `check` waits for the jobs and must be green on the current head
before the PM merges.

- **Light check, base is a version line or a feature branch** (`0.17`, `0.18`, `0.19`, `feature/**`; not the Release PR): `changes`, `static` (Prettier, language, the
  changeset, `npm run check`) and `check:screens` in its 8 shards. About 8 minutes (median of the shards 8.0, longest 10.9). It skips
  `check:screens:extra`, `check:demo` and `check:starter` (the 4 starter shards take a median of 14.2 minutes, the longest 19.8). The
  PM may merge into a version line on a green light `check`.
- **Full check, base is `main`**: the merge of a version line into `main` (`merge-0.18-into-main-N`) and the Release PR run everything:
  `static`, all 8 `screens` shards, `screens-extra`, `demo` and the 4 `starter` shards. A merge of a version line into `main` needs this
  full run green. Nothing reaches npm `next` or the owner without it.
- The job `changes` decides with `isLight(base, head)` in `scripts/ci-changes.mjs` and prints `light=true|false`; an empty or unknown
  base, `main`, the Release PR or any error in the step gives `light=false`, so everything runs. The changeset check is in `static` and
  stays on every pull request.
- To make the light check pick `screens` units from the changed files instead of all 8 shards, the screens units must first be split
  per area (`scripts/editor-screens.mjs`, the PM's screens-split work); until then the light check runs all 8 shards.

**A docs-only pull request skips the heavy jobs** (`screens`, `screens-extra`, `demo`, `starter`); `static` (Prettier, language,
changeset, `npm run check`) always runs. The first job `changes` decides from `git diff --name-only origin/<base>...HEAD`
(`scripts/ci-changes.mjs`, tested in `scripts/ci-changes.test.mjs`). Docs-only means every changed file is under
`.claude/skills/` or `docs/`, is a changeset (`.changeset/*.md`), or is `CLAUDE.md`, `AGENTS.md`, `README.md` or `SECURITY.md`.
`release-notes/` and `CHANGELOG.md` are never skipped (`check:release-notes`, the notes tests and the editor's build read them), and
neither are the Release PR, an empty diff or any other path: when in doubt, everything runs. There is no `paths-ignore`, because
`check` must always report. It is green when `static` and `changes` are green and each heavy job is green, or skipped on a
docs-only pull request, or (`screens-extra`, `demo`, `starter`) on a pull request into a version line; a failed, cancelled or wrongly skipped job makes it red. To put a folder on the list, first find which
checks read it (`grep` the scripts and tests) and change the list and its test in `scripts/ci-changes.mjs` only.

**`starter` and `demo` are also skipped when no changed file can affect them** (`needsStarterDemo` in `scripts/ci-changes.mjs`; the job
`changes` prints `starter_demo=false`). Both jobs work on the package as it ships (`starter` packs it, `demo` builds the editor and the
demo), so only paths that neither reads are skipped: docs, `.claude/`, `.agents/`, changesets, the other workflows, `staging-watcher/`,
`*.test.*` files and the static-only check scripts and allowlists (`check-language`, `check-phosphor`, `check-web`, `check-editor-colors`,
`check-colors`, `check-css-values`, `check-density`, `phosphor-allowlist.json`, `web-allowlist.json`). Everything else runs them: `src/`,
`theme/`, `lib/`, `pages/`, `site/`, `worker/`, `bin/`, `defaults/`, `starter/`, `demo/`, `release-notes/`, `package.json`, the lock file,
`wrangler.jsonc`, any other script, `check.yml` and `ci-changes.mjs` itself, the Release PR and an empty diff. `screens`, `screens-extra`
and `static` run on every pull request that is not docs-only (`screens-extra` not on a light one). The job `check` treats a job skipped by this filter as green. To add a path
to the skip list, first `grep` that neither job reads it (the list's comment says how), and change the list and its test only.

A new push to a pull request cancels that pull request's older queued and running `Check` runs (`concurrency` in
`check.yml`); only the newest head's run counts.

## The commands

| Command | Run it when | What it checks |
| :--- | :--- | :--- |
| `npm run check` | always | Prettier, `check:language`, `check:phosphor`, `check:css-tokens`, `check:token-names`, `check:token-registry`, `check:web`, `check:editor-colors`, `check:colors`, `check:css-values`, `check:density`, `check:release-notes`, the unit tests (`npm test`), the package's types (`check:types`), the demo built (`npm run build`, its content checked by the editor's rules), `check:site-types` and `check:editor` (each page the same after a save). |
| `npm run check:screens` | the editor changed (after `npm run build`) | All of the editor's screens open without errors, on a phone and a computer, and all icons exist; the site's margins, paddings and gaps on the Blocks page are on the 4 dp grid (`checkSpacingGrid`, exceptions with reasons in `scripts/spacing-grid.allow.mjs`). Each installed app's blocks are drawn on a test page of the app's own (`check-page.md`, `docs/app-contract.md`); an app without one is checked with default values and a warning that names it. The checks that measure the Blocks page (spacing, cards, tables) measure the system's test page (`scripts/core-blocks-page.mjs`), built on first use from a temporary copy of the site in `.astro/test-site/` and deleted when the run ends; `check:screens:extra` also checks that it is `noindex, nofollow` and in no sitemap, feed or list (`scripts/check-test-page.mjs`). |
| `npm run check:screens:shard -- K/N` | to run one part of `check:screens` | Every N-th unit of the screens check (the runner is `scripts/editor-screens.mjs`; the units are in `scripts/screens/<area>.mjs`, one file per area, so **a new unit goes in its area's file and in no other place**: add its `checkSomething` function and its `unit(...)` line to that file's `register` function, and never edit `scripts/screens/order.txt`, which freezes the numbering of the units that existed when the check was split; a unit that is new is numbered after them, in the order of the files); add `--list` to print the part's units without running them. `node ../../../scripts/editor-screens.mjs --only <unit name> <dist>` runs one unit on its own (`CHROMIUM_PATH` for another Chromium). `check:screens:extra` runs the checks over the whole site (save twice, unlisted, preview). `check:screens` with no part runs everything. |
| `node ../../../bin/morpheme.mjs check:themes` (in `.morpheme/demo/site/`) | a theme, the default theme, blocks or the editor changed | The same with each of the other themes. |
| `npm run check:starter` | the starter, the Worker or what a site installs changed | The starter works as a site with the package from `npm pack`: its own `npm run check` (the site's types and `check:worker`) and its build. |
| `npm run check:demo` | the CMS, the default theme or the demo changed | The demo builds with the default theme and follows the editor's rules; its Blocks pages are in order: every example on the page of the component that draws it (a special block on its own page), none twice, every page in the index at `/blocks/` (`scripts/demo-blocks.mjs`). |
| `npm run check:language` | text changed | No Danish text outside the language files (`i18n/da-DK/`); no old word for *image* (`scripts/check-language.mjs`). |
| `npm run check:density` | a height or vertical padding in the theme changed | Every part of the theme with a height or vertical padding in the density list writes it with the density step; a menu, dialog or snackbar never gets denser than Medium, and no horizontal padding or text size follows density (`scripts/check-density.mjs`; the sizes at each step are in `check:screens`). |
| `npm run check:editor-colors` | `src/editor.css` or `src/Inline*.tsx` changed | No fixed colour in the editor's block parts (allowlist with reasons). |
| `npm run check:css-tokens` | a custom property in `theme/`, `src/*.css`, `starter/` or an app's or theme's CSS changed | No new unprefixed custom property on `:root`, `html` or `body` (only `--mo-…`, `--tw-*` and Tailwind's `@theme` namespaces; count mode per file in `scripts/css-tokens-allowlist.json` until the rename lands), and no app or theme declares a name the CMS declares (`docs/css-tokens.md`). |
| `npm run check:token-names` | a custom property is renamed, or a stylesheet, script or doc writes a token name | No tracked file writes a name listed in `scripts/renamed-tokens.json` (the old names of the `--mo-ref-*`, `--mo-sys-*` and `--mo-comp-*` rename, which has no aliases); a rename PR adds its names to the list (`docs/superpowers/plans/2026-11-16-token-rename-table.md`). Not read: `docs/superpowers/`, release notes, changesets, `CHANGELOG.md`. Part of `npm run check`. |
| `npm run check:token-registry` | a `--mo-sys-*` or `--mo-ref-*` token with a plain default is added, changed or removed | The `@property` registry files `theme/styles/tokens/<origin>/registry.css` match the tokens' defaults (`node scripts/gen-token-registry.mjs` writes them, then Prettier). Part of `npm run check`. |
| `npm run check:phosphor` | icons in code changed | No new direct `@phosphor-icons/react` import (allowlist with reasons in `scripts/phosphor-allowlist.json`). |
| `npm run check:web` | CSS, layout, dialogs, colour scheme or forms changed | Modern Web Guidance's `legacy-scan` on `src/`, `theme/`, `pages/`, `lib/`, `worker/`, `starter/` and `demo/`: no new legacy pattern, and no allowlist entry that no longer matches (`scripts/web-allowlist.json`: key `<folder>/<file>` + rule id, `max`, `why`; a fix lowers or removes its entry; `node scripts/check-web.mjs --list` prints the current counts). A conflict with Material 3 or a theme component goes to the PM, never into the list without a reason. Part of `npm run check`, so CI's `static` job runs it. |
| `node --test scripts/pending-shared.test.mjs` | `worker/*.js` changed | No pending I/O promise kept in module memory (`CLAUDE.md`, *Worker*). |
| `cd .morpheme/demo/site && node ../../../scripts/measure-speed.mjs` | by hand, after `npm run build`, when a speed claim or a performance fix needs numbers (a few minutes, not in CI or `npm run check`; the numbers depend on the machine, so compare runs on the same one) | LCP, CLS, TBT, long tasks, long animation frames and the INP of scripted interactions (open menu, open a sheet, type, scroll, search) on the site's key pages and the editor's key screens, on a phone (375 px, CPU 4x) and a computer. `--runs N`, `--profile mobile\|desktop`, `--only <text>`, `--json <file>`; `CHROMIUM_PATH` for another Chromium. Baseline and method: `docs/performance-baseline.md`. |
| `npm run check:contrast` | by hand, after `npm run build`, when colours or blocks changed (about 4 minutes per theme, not in CI) | WCAG AA contrast of every block's text, icons and control borders on each section colour, on the site and typed in place in the editor, light and dark, phone and computer. `--all` runs every installed theme; `CONTRAST_DENSITY=-1` checks the editor at Small density. |

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
