# Theme coverage marks: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Worker routing follows `Interstellar/CLAUDE.md` (the Ollama runner by default).

**Spec:** `docs/superpowers/specs/2026-11-05-theme-coverage-design.md`

**Goal:** Show on *Appearance › Parts › UI components* which parts the active theme styles and which use Material.

**Architecture:** Pure functions read Material's CSS and the theme's CSS with postcss. `themePlugin` serves the
result as `virtual:theme-coverage`. The editor shows a badge per part, a summary, a *Style* filter and a frame group.

**Tech stack:** Node 22 (`node --test`), postcss 8, postcss-selector-parser 6, Vite plugin, React (editor), Astro.

## Global constraints

- The session branch is `feat/theme-coverage`, from `main` after the spec and plan merge, in the worktree
  `C:\Users\adolf\Documents\Interstellar\.worktrees\cms-theme-coverage`. Each task has its own branch from the
  session branch. Merge each task into the session branch after review.
- Every source file starts with a 2–3 line header: what it does, what it exposes, key dependencies.
- English is the source language. Write en-US texts first, then da-DK.
- No colours, sizes or other CSS values in the new editor components other than the existing tokens and Tailwind
  classes already in use in `src/PartsShown.tsx`.
- Checks before each merge: `npx prettier --check .`, `node --test` over the changed `*.test.mjs` files,
  `npm run build`.
- The PR has one changeset: `'@morphemecms/cms': minor`, "Mark the parts the theme leaves to Material on Parts › UI
  components."
- Do not release. The release is the owner's step (2FA).

## File structure

| File | Task | Responsibility |
| --- | --- | --- |
| `site/themeCoverage.mjs` | 1 | Pure functions: `styledClasses`, `partPieces`, `themeCoverage` |
| `site/themeCoverage.test.mjs` | 1 | Fixture tests of the three functions |
| `site/themeParts.mjs` | 2 | `THEME_PARTS` catalogue, `NOT_PARTS` allow-list |
| `site/themeParts.test.mjs` | 2 | Catalogue tests on Material's real CSS |
| `site/themeCoverageFiles.mjs` | 3 | File access: read Material's chain and the theme's own CSS |
| `site/themeCoverageFiles.test.mjs` | 3 | Tests of the `@import` walk on a temp folder |
| `site/theme.mjs` | 3 | `themePlugin` answers `virtual:theme-coverage` |
| `src/virtual.d.ts`, `src/coverage.ts` | 3 | Type and re-export for the editor |
| `package.json`, `package-lock.json` | 3 | `postcss`, `postcss-selector-parser` in `dependencies` |
| `src/i18n/en-US/parts.ts`, `src/i18n/da-DK/parts.ts` | 4 | Texts under `t.parts.screens.coverage` and `t.parts.screens.frame` |
| `src/CoverageBadge.tsx` | 5 | One part's status and missing pieces |
| `src/CoverageSummary.tsx` | 5 | The summary line |
| `src/PartsShown.tsx` | 5 | `Part` badge; optional *Style* filter |
| `src/FrameParts.tsx` | 5 | Status-only frame parts |
| `src/BlockParts.tsx` | 5 | `ComponentParts`: summary, filter, frame group |
| `.changeset/theme-coverage.md` | 6 | The release note |

---

### Task 1: Coverage functions

**Worker:** Ollama runner. **Files:** create `site/themeCoverage.mjs`, `site/themeCoverage.test.mjs`.

**Interfaces:**

- Consumes: `postcss` (`postcss.parse`), `postcss-selector-parser` (default export).
- Produces:

```ts
/** @typedef {{ id: string, group: 'ui' | 'frame', prefixes: string[] }} ThemePart */
/** @typedef {{ group: 'ui' | 'frame', status: 'own' | 'partly' | 'material', pieces: number, missing: string[] }} PartCoverage */
export function styledClasses(themeCss: string): Set<string>;
export function partOf(className: string, parts: ThemePart[]): string | null; // id of the longest matching prefix
export function partPieces(materialCss: string, parts: ThemePart[]): Record<string, string[]>; // sorted, no duplicates
export function themeCoverage(args: { materialCss: string; themeCss: string; parts: ThemePart[] }): Record<string, PartCoverage>;
```

Rules:

- A class matches a prefix when `cls === prefix` or `cls.startsWith(prefix + '-')`.
- `partOf` returns the id of the part with the longest matching prefix, else `null`.
- `partPieces` collects every class in every selector of `materialCss`, in all at-rules and layers. Comments do not
  count.
- `styledClasses` counts a rule only when it has at least one declaration whose `prop` does not start with `--`.
- `styledClasses` counts a rule at the top level and inside `@media`, `@supports`, `@container` (also nested). It
  ignores a rule with any `@layer` ancestor.
- `styledClasses` takes the classes of the subject compound only (after the last combinator), with the classes
  inside `:is()` and `:where()` of that compound. It ignores classes inside `:not()` and `:has()`.
- `themeCoverage` gives `own` when all pieces are styled, `material` when none is, else `partly`. `missing` is the
  sorted unstyled pieces. A part without pieces is not in the result.

- [ ] **Step 1: Write the failing tests** in `site/themeCoverage.test.mjs` (`node:test`, `node:assert/strict`):

| Test | Input | Expected |
| --- | --- | --- |
| subject only | `.card .button { color: red }` | `styledClasses` = `{button}` |
| selector list | `.a, .b > .c { margin: 0 }` | `{a, c}` |
| custom properties only | `.button { --x: 1 }` | empty set |
| mixed declarations | `.button { --x: 1; padding: 0 }` | `{button}` |
| inside `@media` | `@media (width > 1px) { .switch { padding: 0 } }` | `{switch}` |
| nested `@supports` in `@media` | `@media x { @supports (a: b) { .slider { padding: 0 } } }` | `{slider}` |
| inside `@layer` | `@layer fallback { .switch { padding: 0 } }` | empty set |
| `:is` and `:not` | `.x:is(.slider-track):not(.slider-stop) { padding: 0 }` | `{x, slider-track}` |
| `:has` | `.card:has(.button) { padding: 0 }` | `{card}` |
| pseudo-element | `.chip::before { content: '' }` | `{chip}` |
| longest prefix | `partOf('button-group-x', parts)` with Button `button`, ButtonGroup `button-group` | `'ButtonGroup'` |
| exact prefix | `partOf('tab', parts)` with Tabs `['tabs','tab']` | `'Tabs'` |
| no false prefix | `partOf('buttonx', parts)` | `null` |
| pieces | Material `@layer fallback { .button{a:b} .button-text{a:b} } .chip{a:b}` | `{ Button: ['button','button-text'], Chip: ['chip'] }` |
| own | theme styles `.button` and `.button-text` | Button `{ status: 'own', pieces: 2, missing: [] }` |
| partly | theme styles `.button` | Button `{ status: 'partly', missing: ['button-text'] }` |
| material | empty theme CSS | Button `{ status: 'material', missing: ['button', 'button-text'] }` |
| empty part left out | a part whose prefix matches no class | its id is not a key |
| `group` copied | Chip has `group: 'frame'` | result `Chip.group === 'frame'` |

- [ ] **Step 2: Run the tests. Expect them to fail.**
  Run: `node --test site/themeCoverage.test.mjs`. Expected: FAIL, module not found.
- [ ] **Step 3: Write `site/themeCoverage.mjs`.** Use the interfaces and rules above. No file access.
- [ ] **Step 4: Run the tests. Expect them to pass.**
  Run: `node --test site/themeCoverage.test.mjs`. Expected: all pass.
- [ ] **Step 5: Commit.** Message: `Add theme coverage functions`.

Runner call (`-Repo` is the session worktree, so the task branch starts from the session branch):

```powershell
pwsh -NoProfile -File C:\Users\adolf\Documents\Interstellar\orchestrator\runner\ollama-run.ps1 `
  -Spec C:\Users\adolf\Documents\Interstellar\orchestrator\specs\theme-coverage-1-functions.md `
  -Paths "site/themeCoverage.mjs,site/themeCoverage.test.mjs" `
  -Repo C:\Users\adolf\Documents\Interstellar\.worktrees\cms-theme-coverage -Branch feat/theme-coverage-functions `
  -Check "node --test site/themeCoverage.test.mjs"
```

---

### Task 2: Parts catalogue

**Worker:** Ollama runner. **Files:** create `site/themeParts.mjs`, `site/themeParts.test.mjs`.

**Interfaces:**

- Consumes: `partPieces`, `partOf`, `styledClasses`, `themeCoverage` from `site/themeCoverage.mjs` (Task 1).
- Produces: `export const THEME_PARTS: ThemePart[]` and `export const NOT_PARTS: string[]`.

`THEME_PARTS`, in this order:

| id | group | prefixes |
| --- | --- | --- |
| Button | ui | `button` |
| IconButton | ui | `icon-button` |
| TextField | ui | `text-field` |
| Checkbox | ui | `checkbox` |
| Chip | ui | `chip` |
| ChipSet | ui | `chip-set` |
| Card | ui | `card` |
| List | ui | `list` |
| Dialog | ui | `dialog` |
| BottomSheet | ui | `bottom-sheet` |
| Carousel | ui | `carousel` |
| Menu | ui | `menu` |
| DropdownMenu | ui | `dropdown-menu` |
| ExposedDropdownMenu | ui | `exposed-dropdown-menu` |
| Tabs | ui | `tabs`, `tab` |
| ButtonGroup | ui | `button-group` |
| SegmentedButton | ui | `segmented-button` |
| SplitButton | ui | `split-button` |
| Switch | ui | `switch` |
| SettingRow | ui | `setting-row` |
| RadioButton | ui | `radio-button`, `radio-group` |
| Slider | ui | `slider` |
| Divider | ui | `divider` |
| SideSheet | ui | `side-sheet` |
| Badge | ui | `badge` |
| LoadingIndicator | ui | `loading-indicator` |
| LinearProgressIndicator | ui | `linear-progress-indicator` |
| CircularProgressIndicator | ui | `circular-progress-indicator` |
| Snackbar | ui | `snackbar` |
| Tooltip | ui | `tooltip` |
| NavigationBar | ui | `navigation-bar` |
| NavigationRail | ui | `navigation-rail` |
| Search | ui | `search` |
| Toolbar | ui | `toolbar` |
| DatePicker | ui | `date-picker` |
| TimePicker | ui | `time-picker` |
| TopAppBar | frame | `top-app-bar` |
| HeaderMenu | frame | `md-nav-item`, `md-nav-toggle` |
| NavigationDrawer | frame | `navigation-drawer` |
| DrawerHead | frame | `md-drawer` |
| Fab | frame | `fab`, `extended-fab` |
| FabMenu | frame | `fab-menu` |
| Footer | frame | `md-footer` |
| ActionBar | frame | `theme-action-bar` |
| Logo | frame | `theme-logo` |

`NOT_PARTS` (classes of `ui.css` that are no part): `astro`, `material`, `comp`, `elevation`, `ripple`,
`ripple-wave`, `block-card`.

- [ ] **Step 1: Write the failing tests** in `site/themeParts.test.mjs`. Read the four files of `theme/styles/`
  (`base.css`, `ui.css`, `components.css`, `global.css`) with `readFileSync`, joined in that order.

| Test | Expected |
| --- | --- |
| unique ids | no `id` occurs twice in `THEME_PARTS` |
| every part has pieces | `partPieces(material, THEME_PARTS)[id].length > 0` for every id |
| `ui.css` fully covered | every class in the selectors of `ui.css` has `partOf(cls) !== null` or is in `NOT_PARTS` |
| Material as a theme | `themeCoverage({ materialCss, themeCss: materialCss, parts })` gives `material` for every part |
| spot checks | `partOf('chip-set-wrap') === 'ChipSet'`, `partOf('fab-menu-item') === 'FabMenu'`, `partOf('top-app-bar-search') === 'TopAppBar'`, `partOf('md-footer-list') === 'Footer'` |

- [ ] **Step 2: Run the tests. Expect them to fail.** Run: `node --test site/themeParts.test.mjs`.
- [ ] **Step 3: Write `site/themeParts.mjs`** with the table above.
- [ ] **Step 4: Run the tests. Expect them to pass.** If the `ui.css` test names a class that is not in the table,
  stop and report the class. Do not add it to `NOT_PARTS` without the orchestrator.
- [ ] **Step 5: Commit.** Message: `Add the catalogue of parts a theme styles`.

Runner call: the same as Task 1, with spec `theme-coverage-2-parts.md`, paths
`site/themeParts.mjs,site/themeParts.test.mjs`, branch `feat/theme-coverage-parts` and check
`node --test site/themeParts.test.mjs site/themeCoverage.test.mjs`.

---

### Task 3: The virtual module

**Worker:** Sonnet agent (repo rules of `site/theme.mjs`). **Files:** create `site/themeCoverageFiles.mjs`,
`site/themeCoverageFiles.test.mjs`, `src/coverage.ts`; modify `site/theme.mjs` (`themePlugin`, about line 474),
`src/virtual.d.ts`, `package.json`, `package-lock.json`.

**Interfaces:**

- Consumes: `themeCoverage` (Task 1), `THEME_PARTS` (Task 2), `activeTheme()`, `themeFolder()`, `STANDARD_THEME`
  (`site/theme.mjs`).
- Produces:

```ts
// site/themeCoverageFiles.mjs
export function materialCssOf(stylesDir: string): string;      // base, ui, components, global joined
export function themeOwnCss(globalCssFile: string): string;     // the file and its relative @imports, depth-first, each once
export function coverageModule(theme: string): string;          // JS source: `export default <json>;`
// virtual module
declare module 'virtual:theme-coverage' {
  const coverage: { theme: string; parts: Record<string, PartCoverage> } | null;
  export default coverage;
}
// src/coverage.ts
export { default as themeCoverage } from 'virtual:theme-coverage';
```

Rules:

- `themeOwnCss` follows `@import` with a relative path (`./`, `../`) only. It skips a package import and an import
  it read already. A missing file throws an error that names the file.
- `coverageModule(STANDARD_THEME)` returns `export default null;`.
- `themePlugin` resolves `virtual:theme-coverage` to `\0virtual:theme-coverage` and loads `coverageModule(activeTheme())`.
- Add `postcss` (move from `devDependencies`) and `postcss-selector-parser` `^6.0.10` to `dependencies`. Run
  `npm install` for the lock file.
- Update the header of `site/theme.mjs` (the plugin's list of virtual modules).

- [ ] **Step 1: Write the failing tests** in `site/themeCoverageFiles.test.mjs` on a temp folder (`mkdtempSync`):

| Test | Expected |
| --- | --- |
| relative imports | `global.css` imports `./a.css`; `a.css` imports `../b/c.css` → all three bodies, in import order |
| package import skipped | `@import '@morphemecms/cms/theme/styles/global.css';` is not read |
| each file once | two imports of `./a.css` → its body once |
| missing file | an import of `./gone.css` → throws, message contains `gone.css` |
| standard theme | `coverageModule('saturn')` → `export default null;` |

- [ ] **Step 2: Run the tests. Expect them to fail.** Run: `node --test site/themeCoverageFiles.test.mjs`.
- [ ] **Step 3: Write `site/themeCoverageFiles.mjs`, the plugin branch, the type and `src/coverage.ts`.**
- [ ] **Step 4: Run the checks.** Run: `node --test site/themeCoverageFiles.test.mjs site/theme.test.mjs`, then
  `npm run build`. Expected: pass; the build has no unresolved-import error.
- [ ] **Step 5: Commit.** Two commits, in this order, so each commit builds: first `Make postcss a dependency of
  sites` (`package.json`, `package-lock.json`), then `Serve the theme's coverage as a virtual module` (code, tests).

---

### Task 4: Texts

**Worker:** Ollama runner for da-DK; en-US in the same spec. **Files:** modify `src/i18n/en-US/parts.ts`,
`src/i18n/da-DK/parts.ts`.

**Interfaces:**

- Produces, under `t.parts.screens`:

```ts
coverage: {
  status: { own: string; partly: string; material: string };
  summary: (theme: string, own: number, total: number) => string;
  missing: string;           // label before the list of missing pieces
  filter: string;            // the filter group's title
  all: string;
};
frame: {
  title: string;
  headerMenu: string; drawerHead: string; footer: string; actionBar: string; logo: string;
};
```

en-US values:

| Key | en-US |
| --- | --- |
| `status.own` | `Own style` |
| `status.partly` | `Partly own` |
| `status.material` | `Material` |
| `summary` | `` `${theme} styles ${own} of ${total} parts fully. ${total - own} still use Material in part or in full.` `` |
| `missing` | `Left to Material:` |
| `filter` | `Style` |
| `all` | `All` |
| `frame.title` | `Site frame` |
| `frame.headerMenu` | `The top app bar's menu items and the button that opens a sub-menu.` |
| `frame.drawerHead` | `The site's name and role at the top of the navigation drawer.` |
| `frame.footer` | `The footer: its columns, headings, links and the bottom line.` |
| `frame.actionBar` | `The bar with the page's actions.` |
| `frame.logo` | `The logo: its mark, name and role.` |

- [ ] **Step 1: Add the en-US keys** after `componentsIntro` in `src/i18n/en-US/parts.ts`.
- [ ] **Step 2: Add the da-DK keys** in the same place in `src/i18n/da-DK/parts.ts`. Use natural Danish and the
  editor's fixed words. `Material` stays `Material`.
- [ ] **Step 3: Run the checks.** Run: `npx prettier --check src/i18n` and `npm run build`. Expected: pass (the da-DK
  dictionary type must match en-US).
- [ ] **Step 4: Commit.** Message: `Add the theme coverage texts`.

---

### Task 5: The marks on *UI components*

**Worker:** Sonnet agent (editor UI rules). **Files:** create `src/CoverageBadge.tsx`, `src/CoverageSummary.tsx`,
`src/FrameParts.tsx`; modify `src/PartsShown.tsx`, `src/BlockParts.tsx` (`ComponentParts`, about line 520).

**Interfaces:**

- Consumes: `themeCoverage` (`src/coverage.ts`, Task 3), `t.parts.screens.coverage` and `.frame` (Task 4),
  `Filters` and `useKept` (`src/ui.tsx`).
- Produces:

```ts
export function CoverageBadge({ coverage }: { coverage: PartCoverage }): JSX.Element;
export function CoverageSummary(): JSX.Element | null;           // null when themeCoverage is null
export default function FrameParts(): JSX.Element;               // HeaderMenu, DrawerHead, Footer, ActionBar, Logo
// PartsShown: new optional prop
styleFilter?: boolean;   // adds the "Style" group to Filters; kept under `${keep}-style`
// Part: new optional prop
coverage?: string;       // catalogue id; default: name.split(',')[0].trim()
```

Rules:

- `Part` shows `CoverageBadge` next to its name when `themeCoverage?.parts[id]` exists.
- `CoverageBadge` shows the status text. For `partly` it shows `missing` label and the pieces in `font-mono`.
  Reuse the existing tokens and the text classes of `Part` (`text-sm`, `text-muted`); write no new colour.
- With the *Style* filter on a status, `Part` returns `null` when its status differs or it has no entry.
- `PartsShown` shows the *Style* group only when `styleFilter` is true and `themeCoverage` is not `null`.
- `FrameParts` renders one `Part` per frame id without a drawing, with `use` from `t.parts.screens.frame`.
- `ComponentParts`: `CoverageSummary` under the intro; `styleFilter` on; group `{ id: 'frame', title: frame.title }`
  last, with `<FrameParts />`.
- Update the headers of `src/PartsShown.tsx` and `src/BlockParts.tsx`.

- [ ] **Step 1: Write `CoverageBadge`, `CoverageSummary` and `FrameParts`.**
- [ ] **Step 2: Change `Part` and `PartsShown`.**
- [ ] **Step 3: Change `ComponentParts`.**
- [ ] **Step 4: Run the checks.** Run: `npx prettier --check .` and `npm run build`. Expected: pass.
- [ ] **Step 5: Check by hand on the demo (Material).** Run `npm run build`, then the demo's dev server. Open
  `/editor/#udseende/dele/ui`. Expected: no badge, no summary, no *Style* filter, the *Site frame* group present.
- [ ] **Step 6: Commit.** Three commits: `Add the coverage badge and summary`, `Mark each part with its coverage`
  (`PartsShown.tsx`), `Add the site frame group to UI components` (`FrameParts.tsx`, `BlockParts.tsx`).

---

### Task 6: Changeset, Venus check, PR

**Worker:** the orchestrator (git and checks only).

- [ ] **Step 1: Add `.changeset/theme-coverage.md`** with the text from *Global constraints*. Commit:
  `Add the theme coverage changeset`.
- [ ] **Step 2: Run the checks.** Run `npx prettier --check .`, `node --test` over `site/*.test.mjs` and
  `theme/styles/*.test.mjs`, and `npm run build`. Expected: pass.
- [ ] **Step 3: Pack the branch.** Run `npm pack` in the worktree. Expected: `morphemecms-cms-<version>.tgz`.
- [ ] **Step 4: Install the pack in a `morpheme-apps` worktree.** In its `site/`, run `npm install <path to .tgz>`.
  Set Venus as the active theme there. Do not commit this worktree.
- [ ] **Step 5: Open the editor on that site.** Open `/editor/#udseende/dele/ui`. Expected: the summary names Venus;
  Checkbox, RadioButton, Switch, Slider, DatePicker and TimePicker show *Material*; *Style* › *Material* shows only
  the gaps.
- [ ] **Step 6: Take a screenshot.** Send it to the owner.
- [ ] **Step 7: Open the PR and merge.** Merge per the standing go-ahead when the checks pass. Remove the
  `morpheme-apps` worktree.
