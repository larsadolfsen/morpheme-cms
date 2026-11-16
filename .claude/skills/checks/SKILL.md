---
name: checks
description: Use before pushing a change to morpheme-cms, or when a CI job fails - "which checks", "check:screens", "check:demo", "check:starter", "shard", "contrast", "density", "CI failed". Says which of the repository's checks fits which change, what CI runs, and how to run one part of the screens check.
---

# The repository's checks

Announce "Using checks". Run every command from the root of this repository, on the demo (`npm run build` builds it in
`.morpheme/demo/site/`). `npm run check` always; the others when the change touches what they check.

## What CI runs

`.github/workflows/check.yml` runs on every pull request into `main`, `0.17`, `0.18` and `0.19`: `check`, `check:screens`
(8 shards), `check:screens:extra`, `check:demo` and `check:starter` (its screens in 4 shards), as jobs side by side, plus
the changeset (skill `changesets`). Its job `check` waits for them all and must be green on the current head before the
PM merges.

**A docs-only pull request skips the heavy jobs** (`screens`, `screens-extra`, `demo`, `starter`); `static` (Prettier, language,
changeset, `npm run check`) always runs. The first job `changes` decides from `git diff --name-only origin/<base>...HEAD`
(`scripts/ci-changes.mjs`, tested in `scripts/ci-changes.test.mjs`). Docs-only means every changed file is under
`.claude/skills/` or `docs/`, is a changeset (`.changeset/*.md`), or is `CLAUDE.md`, `AGENTS.md`, `README.md` or `SECURITY.md`.
`release-notes/` and `CHANGELOG.md` are never skipped (`check:release-notes`, the notes tests and the editor's build read them), and
neither are the Release PR, an empty diff or any other path: when in doubt, everything runs. There is no `paths-ignore`, because
`check` must always report. It is green when `static` and `changes` are green and each heavy job is green, or skipped on a
docs-only pull request; a failed, cancelled or wrongly skipped job makes it red. To put a folder on the list, first find which
checks read it (`grep` the scripts and tests) and change the list and its test in `scripts/ci-changes.mjs` only.

A new push to a pull request cancels that pull request's older queued and running `Check` runs (`concurrency` in
`check.yml`); only the newest head's run counts.

## The commands

| Command | Run it when | What it checks |
| :--- | :--- | :--- |
| `npm run check` | always | Prettier, `check:language`, `check:phosphor`, `check:web`, `check:editor-colors`, `check:colors`, `check:css-values`, `check:density`, `check:release-notes`, the unit tests (`npm test`), the package's types (`check:types`), the demo built (`npm run build`, its content checked by the editor's rules), `check:site-types` and `check:editor` (each page the same after a save). |
| `npm run check:screens` | the editor changed (after `npm run build`) | All of the editor's screens open without errors, on a phone and a computer, and all icons exist; the site's margins, paddings and gaps on the Blocks page are on the 4 dp grid (`checkSpacingGrid`, exceptions with reasons in `scripts/spacing-grid.allow.mjs`). Each installed app's blocks are drawn on a test page of the app's own (`check-page.md`, `docs/app-contract.md`); an app without one is checked with default values and a warning that names it. The checks that measure the Blocks page (spacing, cards, tables) measure the system's test page (`scripts/core-blocks-page.mjs`), built on first use from a temporary copy of the site in `.astro/test-site/` and deleted when the run ends; `check:screens:extra` also checks that it is `noindex, nofollow` and in no sitemap, feed or list (`scripts/check-test-page.mjs`). |
| `npm run check:screens:shard -- K/N` | to run one part of `check:screens` | Every N-th unit of `scripts/editor-screens.mjs`; add `--list` to print the part's units without running them. `node ../../../scripts/editor-screens.mjs --only <unit name> <dist>` runs one unit on its own (`CHROMIUM_PATH` for another Chromium). `check:screens:extra` runs the checks over the whole site (save twice, unlisted, preview). `check:screens` with no part runs everything. |
| `node ../../../bin/morpheme.mjs check:themes` (in `.morpheme/demo/site/`) | a theme, the default theme, blocks or the editor changed | The same with each of the other themes. |
| `npm run check:starter` | the starter, the Worker or what a site installs changed | The starter works as a site with the package from `npm pack`: its own `npm run check` (the site's types and `check:worker`) and its build. |
| `npm run check:demo` | the CMS, the default theme or the demo changed | The demo builds with the default theme and follows the editor's rules. |
| `npm run check:language` | text changed | No Danish text outside the language files (`i18n/da-DK/`); no old word for *image* (`scripts/check-language.mjs`). |
| `npm run check:density` | a height or vertical padding in the theme changed | Every part of the theme with a height or vertical padding in the density list writes it with the density step; a menu, dialog or snackbar never gets denser than Medium, and no horizontal padding or text size follows density (`scripts/check-density.mjs`; the sizes at each step are in `check:screens`). |
| `npm run check:editor-colors` | `src/editor.css` or `src/Inline*.tsx` changed | No fixed colour in the editor's block parts (allowlist with reasons). |
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

When a job fails, run the same command locally, fix the cause, and push again; never skip, disable or loosen a check
or add to an allowlist without the reason the allowlist asks for.
