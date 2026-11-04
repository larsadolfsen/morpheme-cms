# Tonal elevation — plan

Spec: `docs/superpowers/specs/2026-11-04-tonal-elevation-design.md`. Read the spec before each task.

## Goal

Each elevation level gives a colour and a resting shadow in the base. The Material theme shows elevation by colour
and keeps shadows only for the FAB and the lift.

## Architecture

- Base: `theme/styles/ui.css`, section "Elevation", and the part rules in the same file.
- Material theme: `theme/styles/global.css`.
- Venus: `morpheme-apps/themes/venus/styles/global.css` and `morpheme-apps/site/src/themes/venus/styles/global.css`.
- Test: `theme/styles/elevation.test.mjs` (new), `node:test`, reads the CSS files as text.

## Constraints

- Package root: the CMS package's current source. Until step 4 of `docs/repositories.md` (morpheme-website) is done,
  that is `morpheme-website/packages/editor/`. After step 4 it is `morpheme-cms/`. Check before each task.
  All `theme/...` paths below are relative to the package root.
- Line numbers change. Find each rule by its variable name, not by line number.
- Change nothing that the spec tables do not list.
- Worker: a Sonnet agent for tasks 1–4 and 6 (theme files need repo-rule judgement). Task 5 can go to the Ollama runner.
- Tasks 1–4 change the same files. Do them in sequence: 1, 2, 3, 4.
- Task 5 must merge before a Venus site takes the CMS version with tasks 1–4.

## Tasks

### tonal-elevation/1 — level tokens in the base

Files: `theme/styles/ui.css`, `theme/styles/elevation.test.mjs` (new).

1. In `ui.css`, section "Elevation", add the tokens from the spec table "Tokens" to `:where(:root)`.
2. Do not add them to the dark-mode blocks. The surface colours change with the site's colours.
3. Update the section's header comment. Describe the level as a colour and a shadow, and name the rest shadow.
4. Create `elevation.test.mjs`. Give it the 2–3 line file header.
5. Add one test per token. Assert the exact default from the spec.

Acceptance:

| Check | Result |
|---|---|
| `node --test theme/styles/elevation.test.mjs` | pass |
| `ui.css` contains `--elevation-3-surface: var(--surface-container-high, var(--block-surface));` once | yes |
| `ui.css` contains `--elevation-1-rest-shadow: var(--elevation-1);` once | yes |

### tonal-elevation/2 — neutral part surfaces read their level

Files: `theme/styles/ui.css`, `theme/styles/elevation.test.mjs`.

1. For each spec row with kind "neutral" and a surface default "`--elevation-N-surface`", change the part's surface
   fallback to `var(--elevation-N-surface)`.
2. Keep the part's own variable first, for example `var(--dialog-surface, var(--elevation-3-surface))`.
3. For the modal navigation rail, replace the fallback to `--navigation-rail-surface` with `--elevation-2-surface`.
4. For the scrolled top app bar, use `var(--top-app-bar-stuck-surface, var(--elevation-2-surface))`.
5. Do not change role parts, parts without a container, or hover and drag surfaces.
6. Update the header comment of each changed part, where it names the surface.
7. Add one test per changed part. Assert the exact `background` value in its rule.

Acceptance:

| Check | Result |
|---|---|
| `node --test theme/styles/elevation.test.mjs` | pass |
| `ui.css` contains `var(--dialog-surface, var(--elevation-3-surface))` | yes |
| The menu rules read `--block-surface` as the menu's surface fallback | no |
| The navigation drawer rule reads `var(--bg)` as its surface fallback | no |

### tonal-elevation/3 — resting shadows read the rest-shadow tokens

Files: `theme/styles/ui.css`, `theme/styles/elevation.test.mjs`.

1. For each spec row with a rest shadow "`--elevation-N-rest-shadow`", change the resting shadow fallback to it.
2. Keep the part's own variable first, for example `var(--menu-shadow, var(--elevation-2-rest-shadow))`.
3. The bottom sheet as a dialog: `var(--bottom-sheet-shadow-large, var(--elevation-3-rest-shadow))`.
4. Do not change the shadows for pointing, pressing and dragging. Do not change the hard-coded shadows.
5. Update the header text "At rest, pointed at …" so that it names the rest-shadow tokens.
6. Add one test per changed rule. Add one test that the hover rule of the elevated card still reads `--elevation-2`.

Acceptance:

| Check | Result |
|---|---|
| `node --test theme/styles/elevation.test.mjs` | pass |
| `ui.css` contains `var(--fab-shadow, var(--elevation-3-rest-shadow))` | yes |
| The elevated card's hover rule still reads `--elevation-2` | yes |

### tonal-elevation/4 — the Material theme: colour at rest, shadow for the FAB and the lift

Files: `theme/styles/global.css`, `theme/styles/elevation.test.mjs`.

1. In `:root`, add `--elevation-1-rest-shadow` … `--elevation-5-rest-shadow: var(--elevation-0);`.
2. Add `--fab-shadow: var(--elevation-3);` and `--fab-hover-shadow: var(--elevation-4);` to `:root`.
3. Set `--shadow` and `--block-shadow` to `var(--elevation-1-rest-shadow)`, in light and in dark mode.
4. Remove each line that the spec column "Material theme line" marks "remove (same)".
5. Keep the lines marked "keep". Keep the extended FAB lines in the navigation drawer.
6. Update the comments that name a removed line or a part's shadow.
7. Add tests: the added lines exist, and the removed lines do not exist.

Acceptance:

| Check | Result |
|---|---|
| `node --test theme/styles/elevation.test.mjs` | pass |
| `global.css` contains `--dialog-surface:` | no |
| `global.css` contains `--fab-hover-shadow: var(--elevation-4);` once | yes |
| `npm run check` (package root's repo) | pass |
| `npm run build`, then `npm run check:screens` and `npm run check:themes` | pass |
| By hand, light and dark: a dialog and a menu are tonal without a shadow; the FAB has a shadow; an elevated card lifts when pointed at | yes |

### tonal-elevation/5 — Venus keeps its look

Repo: `morpheme-apps`. Files: `themes/venus/styles/global.css`, `site/src/themes/venus/styles/global.css`.

1. In `:root` of each file, add the four rows of the spec table "Venus".
2. Add one comment line above them: the base's level colours, kept white for Venus.
3. Change nothing else.

Acceptance:

| Check | Result |
|---|---|
| Each file contains `--elevation-3-surface: var(--surface);` once | yes |
| Each file contains `--navigation-drawer-surface: var(--bg);` once | yes |
| The repo's checks (its `CLAUDE.md`) | pass |

### tonal-elevation/6 — documentation

Files: `docs/editor.md` (section "Temaets variabler", the theme variables) and the `site-editor-theme` skill, in the
package root's repo.

1. Add the tokens `--elevation-N-surface` and `--elevation-N-rest-shadow` with one line each.
2. Add the rules: a role colour wins; pointing changes only the shadow; a theme turns resting shadows off with the
   rest-shadow tokens.
3. Keep the documents' language. Change no other section.

Acceptance:

| Check | Result |
|---|---|
| `docs/editor.md` contains `--elevation-N-rest-shadow` | yes |
| `npm run check` | pass |
