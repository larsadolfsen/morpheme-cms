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

## The commands

| Command | Run it when | What it checks |
| :--- | :--- | :--- |
| `npm run check` | always | Prettier, `check:language`, `check:phosphor`, `check:editor-colors`, `check:colors`, `check:css-values`, `check:density`, `check:release-notes`, the unit tests (`npm test`), the package's types (`check:types`), the demo built (`npm run build`, its content checked by the editor's rules), `check:site-types` and `check:editor` (each page the same after a save). |
| `npm run check:screens` | the editor changed (after `npm run build`) | All of the editor's screens open without errors, on a phone and a computer, and all icons exist; the site's margins, paddings and gaps on the Blocks page are on the 4 dp grid (`checkSpacingGrid`, exceptions with reasons in `scripts/spacing-grid.allow.mjs`). Each installed app's blocks are drawn on a test page of the app's own (`check-page.md`, `docs/app-contract.md`); an app without one is checked with default values and a warning that names it. |
| `npm run check:screens:shard -- K/N` | to run one part of `check:screens` | Every N-th unit of `scripts/editor-screens.mjs`; add `--list` to print the part's units without running them. `node ../../../scripts/editor-screens.mjs --only <unit name> <dist>` runs one unit on its own (`CHROMIUM_PATH` for another Chromium). `check:screens:extra` runs the checks over the whole site (save twice, unlisted, preview). `check:screens` with no part runs everything. |
| `node ../../../bin/morpheme.mjs check:themes` (in `.morpheme/demo/site/`) | a theme, the default theme, blocks or the editor changed | The same with each of the other themes. |
| `npm run check:starter` | the starter, the Worker or what a site installs changed | The starter works as a site with the package from `npm pack`: its own `npm run check` (the site's types and `check:worker`) and its build. |
| `npm run check:demo` | the CMS, the default theme or the demo changed | The demo builds with the default theme and follows the editor's rules. |
| `npm run check:language` | text changed | No Danish text outside the language files (`i18n/da-DK/`); no old word for *image* (`scripts/check-language.mjs`). |
| `npm run check:density` | a height or vertical padding in the theme changed | Every part of the theme with a height or vertical padding in the density list writes it with the density step; a menu, dialog or snackbar never gets denser than Medium, and no horizontal padding or text size follows density (`scripts/check-density.mjs`; the sizes at each step are in `check:screens`). |
| `npm run check:editor-colors` | `src/editor.css` or `src/Inline*.tsx` changed | No fixed colour in the editor's block parts (allowlist with reasons). |
| `npm run check:phosphor` | icons in code changed | No new direct `@phosphor-icons/react` import (allowlist with reasons in `scripts/phosphor-allowlist.json`). |
| `node --test scripts/pending-shared.test.mjs` | `worker/*.js` changed | No pending I/O promise kept in module memory (`CLAUDE.md`, *Worker*). |
| `npm run check:contrast` | by hand, after `npm run build`, when colours or blocks changed (about 4 minutes per theme, not in CI) | WCAG AA contrast of every block's text, icons and control borders on each section colour, on the site and typed in place in the editor, light and dark, phone and computer. `--all` runs every installed theme; `CONTRAST_DENSITY=-1` checks the editor at Small density. |

When a job fails, run the same command locally, fix the cause, and push again; never skip, disable or loosen a check
or add to an allowlist without the reason the allowlist asks for.
