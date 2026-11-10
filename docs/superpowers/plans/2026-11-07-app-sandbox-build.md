# App sandbox, part 1 (manifest and build sandbox) Implementation Plan

Status: tasks 1–12 done in this repository (PR A #209 merged; PR B #211 for 7 and 8; PR C for 10–12). Tasks 13–18 need a release and the other repositories. Checked against the code on 2026-11-10.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Spec: `docs/superpowers/specs/2026-11-07-app-sandbox-build-design.md`. Tasks are numbered `app-sandbox/<n>`.

**Goal:** Contract 4: an app describes itself in `app.json`, and its build code runs in a QuickJS isolate.

**Architecture:** Core bundles each build entry with esbuild and runs it in QuickJS. The entry gets only declared
data. Core checks the result against a schema and applies it. Failed results become problems, not failed builds.

**Tech stack:** Node test runner, esbuild (from Vite), `quickjs-emscripten` (asyncify build), Astro, React, Cloudflare Worker.

## Global constraints

- Every new source file starts with a 2–3 line header: what it does, what it exposes, key dependencies.
- New `lib/` modules are plain JavaScript (`.mjs`) with JSDoc types, except where the spec names `.ts`.
- Editor texts are present tense, in `src/i18n/en-US/*.ts` and `src/i18n/da-DK/*.ts`.
- Atomic commits: one logical change each, tests in the same commit, stage by path.
- Each new file goes into the map in `AGENTS.md` in the same commit.
- Run `npm test` for touched files in each task. The session runs `npm run check` once at the end of each repo's tasks.
- Limits (spec): hook `{ ms: 1000, memoryMb: 64, outputKb: 256 }`; after-build `{ ms: 30000, memoryMb: 256, outputKb: 5120 }`.
- After-build file names match `^[a-z0-9-]+\.json$`. At most 20 files.

## Files

| Path | Task | What |
|---|---|---|
| `lib/appManifest.mjs`, `.test.mjs` | 1 | read and check `app.json` |
| `lib/appPlaces.mjs`, `.test.mjs` | 2 | access level per place |
| `lib/sandbox/bundle.mjs`, `.test.mjs` | 3 | esbuild bundle with the import allow-list |
| `lib/sandbox/runner.mjs`, `lib/sandbox/quickjs.mjs`, `.test.mjs` | 4 | the runner interface and the QuickJS runner |
| `lib/appProblems.mjs`, `.test.mjs` | 5 | collect and write problems |
| `lib/reads.mjs`, `.test.mjs` | 6 | read scopes from site data |
| `lib/hooks.ts`, `site/pageColors.ts` | 7 | `page-colors` through the sandbox |
| `lib/afterBuild.mjs`, `.test.mjs`, `lib/apps.mjs` | 8 | the after-build step |
| `worker/app-problems.js`, `worker/index.js` | 9 | `GET /api/apps/problems` |
| `lib/appDefinition.mjs`, `.test.mjs`, `src/apps.ts`, `src/registry.tsx`, `site/apps.ts` | 10 | load contract 4 apps |
| `src/store.ts`, `src/AppInfoTab.tsx`, `src/AppPlaces.tsx`, i18n | 11 | places and problems on the app page |
| `lib/contracts.mjs`, `docs/app-contract.md`, `.changeset/*.md` | 12 | `APP_API` 4 |
| `morpheme-appstore`: `src/releases.js`, `wrangler.jsonc`, `package.json` | 13 | store rules |
| `morpheme-apps`: `scripts/check.mjs` | 14 | check `app.json` and bundles |
| `morpheme-apps`: `apps/*/app.json`, `texts.json`, `editor.ts` | 15 | move the eight apps |
| `morpheme-apps`: `apps/cookiescanner/after-build.ts` | 16 | Cookiescanner's sandboxed step |
| `morpheme-website` (no commit) | 17 | speed measurement |
| `site/apps.ts`, `src/apps.ts`, `lib/apps.mjs` | 18 | stop running contract 2 and 3 |

## Order

- 1, 3, 4, 5 have no dependencies. 2 needs 1. 6 needs 1.
- 7 needs 3, 4, 5. 8 needs 3, 4, 5, 6. 9 needs 5.
- 10 needs 1. 11 needs 2, 9, 10. 12 needs 1 to 11.
- Release `@morphemecms/cms` after 12.
- 13, 14 need the release. 15 needs 14. 16 needs 15. 17 needs 15.
- 18 needs all eight apps published as contract 4.

## Worker per task

| Task | Worker | Why |
|---|---|---|
| 1, 3, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 18 | Sonnet agent | repo rules (app contract, i18n, editor UI, store) |
| 2, 12 | Haiku agent | small and fully specified |
| 4 | Opus agent | security boundary, hostile tests |
| 17 | Haiku agent | run two builds, report times |

---

### Task app-sandbox/1: `lib/appManifest.mjs`

**Files:** create `lib/appManifest.mjs`, `lib/appManifest.test.mjs`.

**Interfaces:**
- Consumes: the hook list. Move `APP_HOOKS` to a new `lib/appHooks.mjs`. `lib/hooks.ts` re-exports it, so plain Node scripts can import it.
- Produces:

```ts
type AppCookieDecl = { name: string; provider: string; purpose: string; duration: string; category: ConsentCategory; when?: { setting: string } };
type ReadScope = 'pages' | 'pages.text' | 'cookies' | 'apps' | 'csp.allowed';
type AppManifest = { api: 4; label: string; publisher: string; license: string; thirdParty?: { name: string; license: string; url: string }[];
  icon: string; hint: string; description?: string; category?: string; keywords?: string[]; version: string;
  releaseNotes?: Record<string, string>; screenshots?: { file: string; label: string }[];
  settings?: { fields: Field[]; values: Record<string, unknown>; example?: Record<string, unknown> };
  lists?: unknown[]; kinds?: Record<string, unknown>; cookies?: AppCookieDecl[]; csp?: Record<string, string[]>;
  reads?: ReadScope[]; hooks?: AppHook[]; afterBuild?: boolean };
export const READ_SCOPES: readonly ReadScope[];
export function manifestProblems(manifest: unknown, files: string[]): string[]; // [] when valid
export function readManifest(dir: string): { manifest: AppManifest | null; problems: string[] }; // null when no app.json
export function cookiesFor(manifest: AppManifest, values: Record<string, unknown>): AppCookieDecl[];
```

**Steps:**

- [ ] Write the tests in the table below.
- [ ] Run `node --test lib/appManifest.test.mjs`. Expect failures.
- [ ] Write `lib/appManifest.mjs`. Use no new dependency.
- [ ] Run the tests. Expect all to pass.
- [ ] Commit: "Add the app manifest reader and checks".

**Test cases:**

| Case | Input | Expected |
|---|---|---|
| valid minimal | `{ api: 4, label, publisher, license, icon, hint, version }`, files `['app.json']` | `[]` |
| missing key | no `label` | one problem naming `label` |
| unknown key | `{ …, foo: 1 }` | one problem naming `foo` |
| wrong api | `api: 3` | one problem naming `api` |
| hooks match files | `hooks: ['page-colors']`, files include `hooks/page-colors.ts` | `[]` |
| hook without file | `hooks: ['page-colors']`, no file | one problem |
| file without hook | file `hooks/page-colors.ts`, no `hooks` | one problem |
| unknown hook | `hooks: ['foo']` | one problem |
| afterBuild match | `afterBuild: true` and `after-build.ts` present | `[]`; each mismatch gives one problem |
| unknown read | `reads: ['secrets']` | one problem |
| cookie `when` | `when: { setting: 'id' }`, no field `id` | one problem |
| duplicate cookie | two cookies named `_ga` | one problem |
| `cookiesFor` | cookie with `when: { setting: 'id' }`, values `{ id: '' }` | cookie left out; with `{ id: 'G-1' }` kept |
| `readManifest` | folder without `app.json` | `{ manifest: null, problems: [] }` |
| `readManifest` | invalid JSON | `manifest: null`, one problem |

### Task app-sandbox/2: `lib/appPlaces.mjs`

**Files:** create `lib/appPlaces.mjs`, `lib/appPlaces.test.mjs`.

**Interfaces:**
- Consumes: `AppManifest` (task 1).
- Produces:

```ts
type Access = 'sandboxed' | 'full' | 'none';
type AppPlaces = { build: Access; editor: Access; worker: Access; pages: Access };
export function placesOf(files: string[], manifest: AppManifest | null): AppPlaces;
export function hasFullPlace(places: AppPlaces): boolean;
```

**Steps:**

- [ ] Write the tests below. Run them. Expect failures.
- [ ] Write the module. Paths are relative to the app folder, with `/`.
- [ ] Run the tests. Expect all to pass. Commit: "Add access levels per app place".

**Test cases:**

| Case | Files | Manifest | Expected |
|---|---|---|---|
| hooks only | `app.json`, `hooks/page-colors.ts` | `hooks: ['page-colors']` | `build: 'sandboxed'`, others `'none'` |
| after-build only | `app.json`, `after-build.ts` | `afterBuild: true` | `build: 'sandboxed'` |
| slot | `app.json`, `slots/head.astro` | valid | `build: 'full'`, `pages: 'full'` |
| block | `app.json`, `blocks/x/View.tsx` | valid | `build: 'full'` |
| block script | `blocks/x/script.ts` | valid | `pages: 'full'` |
| kind folder | `popups/load.ts` | `kinds: { popups: {} }` | `build: 'full'` |
| editor | `editor.ts` | valid | `editor: 'full'` |
| worker | `worker.js` | valid | `worker: 'full'` |
| old app | `index.ts`, `hooks/page-colors.ts` | `null` | `build: 'full'`, `editor: 'full'` |
| nothing | `app.json` | valid | all `'none'` |
| `hasFullPlace` | one place `'full'` | — | `true`; all others → `false` |

### Task app-sandbox/3: `lib/sandbox/bundle.mjs`

**Files:** create `lib/sandbox/bundle.mjs`, `lib/sandbox/bundle.test.mjs`, test fixtures under `lib/sandbox/fixtures/`.

**Interfaces:**
- Produces:

```ts
export const ALLOWED_CORE: readonly string[]; // '@morphemecms/cms/lib/colors', '@morphemecms/cms/lib/dynamic-colors', '@morphemecms/cms/lib/hooks'
export function bundleEntry(appDir: string, entry: string, appId: string): Promise<{ ok: true; code: string } | { ok: false; message: string }>;
```

- Output is one ESM string. Its default export is the entry's default export.
- `@app/self` resolves to `export default { id: appId }`.

**Steps:**

- [ ] Write fixture apps for each test case.
- [ ] Write the tests below. Run them. Expect failures.
- [ ] Write the module with esbuild's `build` (`write: false`, `bundle: true`, `format: 'esm'`, `platform: 'neutral'`).
- [ ] Add one esbuild plugin that resolves imports by the allow-list. Refuse every other bare import.
- [ ] Run the tests. Expect all to pass. Commit: "Bundle app build entries with an import allow-list".

**Test cases:**

| Case | Entry imports | Expected |
|---|---|---|
| own file | `./helper` in the app folder | `ok: true` |
| allowed core | `@morphemecms/cms/lib/dynamic-colors` | `ok: true` |
| self | `@app/self` | `ok: true`; the code contains the app id |
| Node builtin | `node:fs` | `ok: false`, message names `node:fs` |
| bare builtin | `fs` | `ok: false` |
| other package | `lodash` | `ok: false` |
| outside folder | `../../secret` | `ok: false` |
| other core | `@morphemecms/cms/site/apps` | `ok: false` |
| no app code runs | the entry throws at the top level | `ok: true` (bundling does not run it) |

### Task app-sandbox/4: the runner (`lib/sandbox/runner.mjs`, `lib/sandbox/quickjs.mjs`)

**Files:** create `lib/sandbox/runner.mjs`, `lib/sandbox/quickjs.mjs`, `lib/sandbox/runner.test.mjs`. Modify `package.json`
(add `quickjs-emscripten`). Add its licence to the editor's licence list (`src/licenseData.ts`).

**Interfaces:**
- Produces:

```ts
type Limits = { ms: number; memoryMb: number; outputKb: number };
type Helpers = Record<string, (...args: unknown[]) => unknown | Promise<unknown>>;
type RunResult = { ok: true; value: unknown } | { ok: false; error: 'throw' | 'timeout' | 'memory' | 'output'; message: string };
// runner.mjs: the interface, the limits, and the default runner
export const HOOK_LIMITS: Limits;        // { ms: 1000, memoryMb: 64, outputKb: 256 }
export const AFTER_BUILD_LIMITS: Limits; // { ms: 30000, memoryMb: 256, outputKb: 5120 }
export function run(code: string, input: unknown, helpers: Helpers, limits: Limits): Promise<RunResult>;
// quickjs.mjs: the QuickJS implementation that run() calls
export function runInQuickJS(code: string, input: unknown, helpers: Helpers, limits: Limits): Promise<RunResult>;
```

- Use the asyncify build (`newAsyncContext`). One fresh context per call. Dispose it after the call.
- Values cross as JSON. `Uint8Array` crosses as a byte array.
- The isolate has no `fetch`, `process`, `require`, `setTimeout` and no host objects.
- The time limit uses the interrupt handler. The memory limit uses the runtime's memory limit.

**Steps:**

- [ ] Write the tests below. Run them. Expect failures.
- [ ] Add the dependency. Write `quickjs.mjs`, then `runner.mjs`.
- [ ] Run the tests. Expect all to pass.
- [ ] Commit: "Run app code in a QuickJS sandbox".

**Test cases (each hostile case must not reach the host):**

| Case | App code | Expected |
|---|---|---|
| value | `export default (i) => i.a + 1` with `{ a: 1 }` | `{ ok: true, value: 2 }` |
| async helper | awaits `helpers.double(2)`; host returns a Promise of `4` | `value: 4` |
| bytes | helper returns `Uint8Array [1,2,3]`; app returns its length | `value: 3` |
| throw | `throw new Error('x')` | `error: 'throw'`, message contains `x` |
| process | reads `process.env` | `error: 'throw'` |
| fetch | calls `fetch('https://example.com')` | `error: 'throw'`; no request leaves (spy on the host `fetch`) |
| require | calls `require('fs')` | `error: 'throw'` |
| timers | calls `setTimeout` | `error: 'throw'` |
| loop | `while (true) {}` with `ms: 100` | `error: 'timeout'` within 1 s |
| memory | grows an array with `memoryMb: 8` | `error: 'memory'` |
| output | returns 1 MB of text with `outputKb: 256` | `error: 'output'` |
| no state | call 1 sets `globalThis.x = 1`; call 2 reads it | call 2 gets `undefined` |
| prototype | sets `Object.prototype.polluted = 1` | the host's `({}).polluted` stays `undefined` |

### Task app-sandbox/5: `lib/appProblems.mjs`

**Files:** create `lib/appProblems.mjs`, `lib/appProblems.test.mjs`.

**Interfaces:**
- Consumes: `RunResult` (task 4).
- Produces:

```ts
type AppProblem = { app: string; place: 'hook' | 'after-build' | 'bundle' | 'manifest'; hook?: string; page?: string; error: string; message: string };
export const PROBLEMS_FILE: '_problems.json'; // in dist/_apps/
export function createProblems(): { add(p: AppProblem): void; list(): AppProblem[] };
export function writeProblems(distDir: string, problems: AppProblem[]): void; // always writes, [] included
export function problemsOf(all: AppProblem[], app: string): AppProblem[];
```

**Steps:**

- [ ] Write the tests: add and list keep order; `writeProblems` writes valid JSON to `dist/_apps/_problems.json`;
      an empty list writes `[]`; `problemsOf` filters by app; messages longer than 500 characters are cut to 500.
- [ ] Run them. Expect failures. Write the module. Run them. Expect all to pass.
- [ ] Commit: "Collect app problems from the build".

### Task app-sandbox/6: `lib/reads.mjs`

**Files:** create `lib/reads.mjs`, `lib/reads.test.mjs`, fixtures under `lib/fixtures/reads-site/`.

**Interfaces:**
- Consumes: `ReadScope`, `AppManifest`, `cookiesFor` (task 1).
- Produces:

```ts
type SiteReads = { pages?: { address: string; title: string; blocks: string[]; text?: string }[];
  cookies?: { banner: boolean; list: { name: string; provider: string; category: string; file: string }[] };
  apps?: { id: string; version: string; settings: Record<string, unknown>; cookies: AppCookieDecl[]; csp: Record<string, string[]> }[];
  'csp.allowed'?: string[] };
export function readsFor(scopes: ReadScope[], root: string): Promise<SiteReads>; // only the keys asked for
```

- Pages: published pages and posts in `src/content/`. Leave out drafts and `/ny/…` versions.
- `blocks`: the block types the page uses, in order, without duplicates.
- `apps`: active apps only (`activeApps`, `lib/appsFile.mjs`). Contract 2 and 3 apps give `cookies` from `cookies.json` and `csp` from `csp.json`.

**Steps:**

- [ ] Write the fixture site and the tests below. Run them. Expect failures.
- [ ] Write the module. Reuse the site's existing readers; list each one you reuse in the header.
- [ ] Run the tests. Expect all to pass. Commit: "Give apps the site data they declare".

**Test cases:**

| Case | Scopes | Expected |
|---|---|---|
| none | `[]` | `{}` |
| pages | `['pages']` | addresses and titles of published entries; no `text` |
| pages with text | `['pages', 'pages.text']` | each entry has `text` |
| text alone | `['pages.text']` | same as both (text implies pages) |
| draft | fixture has a draft | not in `pages` |
| cookies | `['cookies']` | banner flag and the list from `src/data/cookies.json` and the list folder |
| apps | `['apps']` | only active apps; a turned-off app is missing |
| allowed | `['csp.allowed']` | the hosts in `src/data/csp.json` |

### Task app-sandbox/7: `page-colors` through the sandbox

**Files:** modify `lib/hooks.ts`, `site/pageColors.ts`. Add tests in `lib/hooks.test.mjs` (create if missing).

**Interfaces:**
- Consumes: `bundleEntry` (3), `run`, `HOOK_LIMITS` (4), `createProblems` (5), `readManifest` (1).
- Produces in `lib/hooks.ts`:

```ts
export function pageColorsOutputProblems(value: unknown, names: string[]): string[]; // [] when value is undefined or valid Colors
```

**Behaviour:**

- A contract 4 app with `hooks: ['page-colors']`: bundle `hooks/page-colors.ts` once per build. Run it for each page.
- Its input is today's hook input. Its helpers are `pixels` and `readable`, as today.
- Check the value with `pageColorsOutputProblems`, then with `colorPairs` as today.
- A failed run, or a failed check: add a problem with the page address, and keep the page's colours.
- A contract 2 or 3 app: run it as today.

**Steps:**

- [ ] Write the tests: valid colours pass; an unknown colour name fails; a non-object fails; `undefined` passes.
- [ ] Write a test with a fixture contract 4 app that returns fixed colours. Expect them on the page result.
- [ ] Write a test with a fixture app that throws. Expect the old colours and one problem.
- [ ] Run them. Expect failures. Change the two files. Run them. Expect all to pass.
- [ ] Commit: "Run the page colours hook in the sandbox".

### Task app-sandbox/8: the after-build step

**Files:** create `lib/afterBuild.mjs`, `lib/afterBuild.test.mjs`. Modify `lib/apps.mjs` (where `build.mjs` runs today).

**Interfaces:**
- Consumes: `bundleEntry` (3), `run`, `AFTER_BUILD_LIMITS` (4), `createProblems`, `writeProblems` (5), `readsFor` (6), `readManifest` (1).
- Produces:

```ts
export const FILE_NAME: RegExp; // /^[a-z0-9-]+\.json$/
export const MAX_FILES: 20;
export function afterBuildOutputProblems(value: unknown): string[];
export function runAfterBuild(opts: { root: string; dist: string; appId: string; build: { commit: string; committed: string };
  problems: ReturnType<typeof createProblems> }): Promise<void>;
```

- Input to the app: `{ settings, reads, build }`. Helper: `hash(text)` → SHA-256 hex (Node `crypto` on the host).
- Valid output: write each file to `dist/_apps/<appId>/<name>` as JSON.
- `build.commit` and `build.committed` come from `git log -1 --format=%H%n%cI`, run by core.
- `lib/apps.mjs` runs `runAfterBuild` for each active contract 4 app with `afterBuild: true`. It runs `build.mjs` for
  contract 2 and 3 apps as today. At the end it calls `writeProblems` once, with the problems of tasks 7 and 8.

**Steps:**

- [ ] Write the tests below. Run them. Expect failures.
- [ ] Write the module and the change in `lib/apps.mjs`.
- [ ] Run the tests. Expect all to pass. Commit: "Run the apps' after-build step in the sandbox".

**Test cases:**

| Case | App returns | Expected |
|---|---|---|
| one file | `{ files: { 'scan.json': { a: 1 } } }` | `dist/_apps/<id>/scan.json` holds `{"a":1}` |
| bad name | `{ files: { '../x.json': {} } }` | no file; one problem |
| upper case | `{ files: { 'Scan.json': {} } }` | no file; one problem |
| too many | 21 files | no file; one problem |
| not an object | `'x'` | no file; one problem |
| reads | app with `reads: ['pages']` returns `input.reads` | the file holds the pages |
| no reads | app without `reads` returns `input.reads` | the file holds `{}` |
| hash | returns `helpers.hash('a')` | the SHA-256 hex of `a` |
| build info | returns `input.build` | `commit` and `committed` present |

### Task app-sandbox/9: `GET /api/apps/problems`

**Files:** create `worker/app-problems.js`. Modify `worker/index.js`.

**Interfaces:**
- Consumes: `PROBLEMS_FILE` (5).
- Produces: `GET /api/apps/problems` → `200` with the JSON array from `dist/_apps/_problems.json` (`env.ASSETS`).
  No file → `200` with `[]`. No editor session → `401`, as the editor's other routes do.

**Steps:**

- [ ] Find how the existing editor routes check the session. Use the same check.
- [ ] Write a test for the handler with a fake `ASSETS`: the file, no file, and no session.
- [ ] Run it. Expect failures. Write the handler and the route. Run it. Expect all to pass.
- [ ] Commit: "Serve the build's app problems to the editor".

### Task app-sandbox/10: load contract 4 apps

**Files:** create `lib/appDefinition.mjs`, `lib/appDefinition.test.mjs`. Modify `src/apps.ts`, `src/registry.tsx`, `site/apps.ts`.

**Interfaces:**
- Consumes: `AppManifest`, `cookiesFor` (1).
- Produces:

```ts
export function definitionOf(manifest: AppManifest, editor: Partial<AppDefinitionCode> | undefined, texts: Record<string, unknown> | undefined): AppDefinitionData;
// AppDefinitionData: AppDefinition without React parts; icon stays a name. src/apps.ts maps the name to the Phosphor component.
// AppDefinitionCode: page, screens, tabs, notifications, settings.changedTo, kinds[*].draw.
```

- `src/registry.tsx` finds `app.json` (eager JSON import), `editor.ts` and `texts.json` in each app folder.
  A folder with `app.json` is contract 4. A folder with `index.ts` and no `app.json` is contract 2 or 3, as today.
- `cookies` of a contract 4 app: `(values) => categories of cookiesFor(manifest, values)`.
- `site/apps.ts`: `settingsOf(id)` without defaults takes them from the app's `app.json` `settings.values`.

**Steps:**

- [ ] Write tests for `definitionOf`: data keys copied; code parts merged from `editor`; `kinds` data merged with
      `draw` from `editor`; `cookies` derived from `cookiesFor`; texts attached as for `texts.ts` today.
- [ ] Run them. Expect failures. Write the module and the three changes. Run them. Expect all to pass.
- [ ] Check by hand: the demo site lists a fixture contract 4 app with its name, icon and settings.
- [ ] Commit: "Load apps that describe themselves in app.json".

### Task app-sandbox/11: places and problems on the app page

**Files:** create `src/AppPlaces.tsx`. Modify `src/store.ts` (`needsOf`), `src/AppInfoTab.tsx`, `src/i18n/en-US/apps.ts`,
`src/i18n/da-DK/apps.ts`. Use existing components from `src/ui.tsx` (`CheckList` or the rows already used under the
permissions section).

**Interfaces:**
- Consumes: `placesOf` (2), `GET /api/apps/problems` (9), `problemsOf` (5).
- Produces: `AppPlaces({ places }: { places: AppPlaces })` and `needs.places` on `AppNeeds`.

**Behaviour:**

- The permissions section (Danish label: Rettigheder) shows four rows: Build, Editor, Worker, Pages.
- Each row shows "Sandboxed" (da "Afgrænset"), "Full access" (da "Fuld adgang") or nothing for `none`.
- Above the section: the app's problems from the last build, one line each, as an error notice. None: no notice.

**Steps:**

- [ ] Extend `needsOf` with `places`. Add its test cases to the existing `needsOf` tests: a contract 4 app, an old app.
- [ ] Add the texts. Run `npm run check:language`.
- [ ] Write `AppPlaces.tsx` and the notice. Keep `AppInfoTab.tsx` as composition only.
- [ ] Check by hand on the demo site: a fixture app with a throwing hook shows one problem; its places show.
- [ ] Commit: "Show app places and build problems on the app page".

### Task app-sandbox/12: contract 4

**Files:** modify `lib/contracts.mjs`, `docs/app-contract.md`. Create `.changeset/app-contract-4.md` (minor).

**Steps:**

- [ ] Set `APP_API` to `4`. Extend its comment: 4 adds `app.json`, sandboxed hooks and `after-build.ts`.
- [ ] Add "Contract 4" to `docs/app-contract.md`: `app.json` keys, places, reads, hooks, after-build, limits, problems.
- [ ] State there: contract 2 and 3 apps run as before, shown as full access.
- [ ] Run `npm run check`. Expect it to pass. Commit: "Raise the app contract to 4".
- [ ] Open the PR for tasks 1–12. Hand it to the PR review session.

### Task app-sandbox/13: store rules (`morpheme-appstore`)

**Files:** modify `src/releases.js`, `wrangler.jsonc` (variable `FIRST_PARTY`), `package.json` (`@morphemecms/cms`).
Tests in `test/unit/`.

**Interfaces:**
- Consumes: `placesOf`, `hasFullPlace` from `@morphemecms/cms/lib/appPlaces.mjs`; `readManifest` logic is not needed:
  parse `app.json` from the release's files.
- `FIRST_PARTY`: a comma-separated list of publisher handles.

**Behaviour:**

- An app release with `api < 4` from a publisher not in `FIRST_PARTY`: reject with a clear message.
- An `api: 4` release with a `full` place from a publisher not in `FIRST_PARTY`: reject, and name the places.
- Themes: no change.

**Steps:**

- [ ] Write the tests: first-party `api: 3` passes; third-party `api: 3` fails; third-party `api: 4` sandboxed passes;
      third-party `api: 4` with `worker.js` fails and names `worker`; first-party `api: 4` with `worker.js` passes.
- [ ] Run them. Expect failures. Change the code. Run `npm test`. Expect all to pass.
- [ ] Commit: "Accept only sandboxed apps from third-party publishers". Open the PR. Hand it to the PR review session.

### Task app-sandbox/14: `morpheme-apps` check

**Files:** modify `scripts/check.mjs` and its test.

**Steps:**

- [ ] For each app with `app.json`: run `manifestProblems`. Run `bundleEntry` for each build entry.
- [ ] Report each problem with the app folder name. Exit with code 1 on any problem.
- [ ] Write tests with one valid and one invalid fixture app. Run `npm test`. Expect all to pass.
- [ ] Commit: "Check app manifests and sandbox bundles".

### Task app-sandbox/15: move the eight apps to `app.json`

**Files:** in each of `calendly`, `content-colors`, `cookiescanner`, `google-ads`, `google-analytics`, `gtm`,
`mailchimp`, `mobilepay`: create `app.json`, `texts.json`; create `editor.ts` where the app has code parts; delete
`index.ts`, `settings.ts`, `csp.json`, `cookies.json`, `texts.ts`.

**Steps (one commit per app):**

- [ ] Move the data keys of `defineApp` and `settings.ts` to `app.json`. Write the icon as its Phosphor name.
- [ ] Turn `cookies.json` and the `cookies()` function into `cookies` with `when` where the function checks a setting.
- [ ] Move `csp.json` to `csp`. Write `hooks` and `afterBuild` from the files.
- [ ] Move the code parts to `editor.ts`. Replace imports of `../settings` with `settingsOf(self.id)`.
- [ ] Set `api` to `4`. Raise the minor version. Add a release note: "Describes itself in app.json."
- [ ] Run `npm run check` in `morpheme-apps`. Expect it to pass.
- [ ] Check by hand on the demo site: the app page shows the same name, icon, settings and cookies as before.

### Task app-sandbox/16: Cookiescanner's sandboxed step

**Files:** in `apps/cookiescanner/`: create `after-build.ts`; delete `build.mjs`; change `app.json` (`afterBuild: true`,
`reads: ['pages', 'pages.text', 'cookies', 'apps', 'csp.allowed']`); change `worker.js` only where it reads `scan.json`.

**Behaviour:**

- `scan.json` keeps its shape (`SCAN_INFO` in `scan.mjs`). `built` comes from `input.build.committed`.
- The fingerprint is `helpers.hash` of the JSON of: the active apps (id, version, settings, cookies, csp), the cookies
  banner flag, and `csp.allowed`. This replaces the hash of files.
- Pages to visit: a page whose `blocks` has a video, and the page whose `text` has `calendly-inline-widget`.

**Steps:**

- [ ] Move the tests of `build.mjs` to `after-build.ts`. Feed them a fixed input. Expect the same `scan.json` as before.
- [ ] Write `after-build.ts`. Run the app's tests and `npm run check`. Expect them to pass.
- [ ] Check by hand on staging: the Worker scans after a settings change, and not after an unrelated text change.
- [ ] Commit: "Run Cookiescanner's build step in the sandbox". Open the PR for tasks 14–16. Hand it to the PR review session.

### Task app-sandbox/17: speed measurement (`morpheme-website`, no commit)

**Steps:**

- [ ] Run `npm run build` three times on the CMS release before contract 4. Record each time.
- [ ] Update to the contract 4 release with the moved `content-colors`. Run `npm run build` three times. Record each time.
- [ ] Report the medians. Report the rise in percent.
- [ ] A rise above 20 %: stop, and report to the session. Do not change code.

### Task app-sandbox/18: stop running contract 2 and 3

Start only when the store has all eight apps as contract 4, and every site runs them.

**Files:** modify `src/registry.tsx`, `src/apps.ts`, `site/apps.ts`, `lib/apps.mjs`, `site/pageColors.ts`.

**Steps:**

- [ ] Remove the code paths for `index.ts` apps and `build.mjs`.
- [ ] A folder with `index.ts` and no `app.json` gives one problem: "Written to an old contract. Update the app."
- [ ] Update the tests. Run `npm run check`. Expect it to pass.
- [ ] Add a changeset (minor). Commit: "Stop running apps written to contracts 2 and 3". Open the PR. Hand it over.

## Checked by hand (thin UI)

- Tasks 10 and 11 are thin editor wiring. Their logic is in `lib/appDefinition.mjs` and `lib/appPlaces.mjs`.
- Check on the demo site: a fixture contract 4 app shows its places; a throwing hook shows one problem; the build passes.
