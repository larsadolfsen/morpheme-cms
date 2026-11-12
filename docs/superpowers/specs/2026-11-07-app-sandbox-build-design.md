# App sandbox, part 1: the app manifest and the build sandbox (contract 4)

Date: 2026-11-07. Status: design for review.

## Goal

A store app can reach nothing of a site that it did not declare. Part 1 covers the app's description (`app.json`)
and all app code that runs during the build. App code at build runs in a QuickJS isolate. It returns data, and core
applies the data.

## Why

Today an app is source code that the site builds with its own code. It runs with full power in four places:

| Place | Today | Risk |
|---|---|---|
| Editor | app components run in the editor (`registry.tsx`) | can call the editor's GitHub API as the signed-in owner |
| Build | `build.mjs`, `slots/*.astro`, `load.ts`, `View.tsx`, `hooks/*.ts` run in Node | can read build variables and the repository, call the network, change any page |
| Worker | `worker.js` gets the full `env` (`worker/index.js:84`) | can read every secret, including the session secret |
| Visitor's page | `script.ts`, slot scripts | limited only by `csp.json` |

The store is for many third-party publishers (memory: store-many-publishers). The threat model is a malicious
publisher or a hacked publisher account. The sandbox is the wall. Store review helps, but the design does not rely on it.

## The whole framework (sub-projects)

| # | Sub-project | Status |
|---|---|---|
| A | `app.json` and contract 4 | this spec |
| B | Build sandbox: hooks and `after-build` in QuickJS | this spec |
| C | Described interface: blocks and kinds of entries return a tree of parts, the theme draws it | later spec |
| D | Declared tags: a script address, a consent category and an id; core loads it after consent | later spec |
| E | Editor places: app interfaces in sandboxed iframes with a message API | later spec |
| F | Worker isolates: Cloudflare Dynamic Workers, one per app, only declared bindings | later spec |
| G | Rules for scripts on visitors' pages | later spec |
| H | Store review and the move of the eight apps to sandboxed places | after C to G |
| — | Cloudflare build runner as a system app (runner interface, second engine) | later, only if QuickJS is too slow |

## Decisions

| # | Decision |
|---|---|
| 1 | Threat model: a malicious publisher. An app reaches only what it declares. |
| 2 | Every app goes through the sandbox: store apps and a site's own apps (`src/apps/`). One contract, one runtime. |
| 3 | The build engine is QuickJS in WebAssembly (`quickjs-emscripten`, its asyncify build). No network, no files, no environment. |
| 4 | The runner is an interface. Cloudflare Dynamic Workers become a second runner for the Worker (F), and maybe later for the build. |
| 5 | An app describes itself in one `app.json`. It is data. Core and the store read it and run nothing. |
| 6 | An app's build code returns data. Core checks the data against a schema and applies it. An app never writes a file or a page itself. |
| 7 | A failed app result is dropped for that page or step. The owner gets a notice. The build never fails because of an app. |
| 8 | No network during the build. Outside data comes through the app's Worker at runtime. |
| 9 | Each place of an app is `sandboxed`, `full` or `none`. A `full` place is open to first-party publishers only. |
| 10 | Short overlap: from the contract 4 release, the store accepts contract 4 only. Contract 2 and 3 apps still run, shown as full access, until the eight apps move. The next release stops running them. |
| 11 | Internal links stays in core. The spec `2026-11-07-internal-links-app-design.md` (branch `spec/internal-links-app`) is paused. It comes back as a sandboxed hook that returns links, after this spec lands. |

## Data model

### `app.json` (new, one per app folder)

The app's id is its folder name (`src/apps/<id>/`, a store id such as `app_a030dfba69793996`). `app.json` holds no id.
The store's `releases` row links the id, the version and the `api` level.

| Key | Type | Required | From today |
|---|---|---|---|
| `api` | `4` | yes | store `releases.api` |
| `label` | string (English) | yes | `defineApp.label` |
| `publisher` | string | yes | `defineApp.publisher` |
| `license` | SPDX string | yes | `defineApp.license` |
| `thirdParty` | `{ name, license, url }[]` | no | `defineApp.thirdParty` |
| `icon` | Phosphor icon name, e.g. `"Palette"` | yes | `defineApp.icon` (a component today) |
| `hint` | string | yes | `defineApp.hint` |
| `description` | string | no | `defineApp.description` |
| `category` | `AppCategory` | no | `defineApp.category` |
| `keywords` | string[] | no | `defineApp.keywords` |
| `version` | semver string | yes | `defineApp.version` |
| `releaseNotes` | `Record<version, string>` | no | `defineApp.releaseNotes` |
| `screenshots` | `{ file, label }[]` | no | `defineApp.screenshots` |
| `settings` | `{ fields: Field[], values, example? }` | no | `settings.ts` (data part) |
| `lists` | `OwnedList[]` with the icon as a name | no | `defineApp.lists` |
| `kinds` | `Record<list, AppKind>` without `draw` | no | `defineApp.kinds` (data part) |
| `cookies` | `AppCookieDecl[]` | no | `cookies.json` and `defineApp.cookies()` |
| `csp` | `Record<directive, host[]>` | no | `csp.json` (same shape) |
| `reads` | `ReadScope[]` | no | new |
| `hooks` | `AppHook[]` | no | `hooks/` file names |
| `afterBuild` | boolean | no | `build.mjs` exists |

`AppCookieDecl`: `{ name, provider, purpose, duration, category, when? }`. `name` is unique in the app. `category` is a
`ConsentCategory`. `when` is `{ setting: <field key> }`: the cookie applies only when that setting has a value. This
replaces the `cookies(values)` function.

Texts in other languages stay in `texts.json` (today `texts.ts`, same keys).

Rules, checked by `lib/appManifest.mjs`:

- `hooks` lists exactly the files in `hooks/`. `afterBuild` is true exactly when `after-build.ts` exists.
- Every `when.setting` is a key in `settings.fields`.
- Unknown keys fail the check.

### Places of an app

`placesOf(files, manifest)` gives one access level per place.

| Place | `sandboxed` when | `full` when | `none` when |
|---|---|---|---|
| `build` | only `hooks/`, `after-build.ts` | any of `slots/`, `blocks/`, a folder named by a key of `kinds`, `build.mjs` | no build code |
| `editor` | — (until E) | `editor.ts` exists | no `editor.ts` |
| `worker` | — (until F) | `worker.js` exists | no `worker.js` |
| `pages` | — (until D and G) | any `script.ts` or slot script | none |

A contract 2 or 3 app gets `full` for every place it has.

### `editor.ts` (contract 4, full access until E)

The code parts of today's `defineApp` move here: `page`, `screens`, `tabs`, `notifications`, `settings.changedTo`,
`kinds` with `draw`. The editor merges `app.json` and `editor.ts` into one `AppDefinition`. Only first-party apps may
have it until sub-project E.

### Read scopes (`ReadScope`)

Core gives an app only the scopes it lists in `reads`.

| Scope | Shape given to the app |
|---|---|
| `pages` | `{ address, title, blocks: string[] }[]` of published pages and posts |
| `pages.text` | adds `text` (Markdown) to each entry of `pages` |
| `cookies` | `{ banner: boolean, list: { name, provider, category, file }[] }` |
| `apps` | `{ id, version, settings, cookies: AppCookieDecl[], csp }[]` of active apps |
| `csp.allowed` | `string[]`: hosts the owner allowed (`src/data/csp.json`) |

### Build info (given to `after-build` always)

`{ commit: string, committed: ISO time }`. The app computes any fingerprint itself with the helper `hash`.

## The build sandbox

### Flow, for each active contract 4 app

1. Bundle each build entry (`hooks/<place>.ts`, `after-build.ts`) with esbuild.
2. Build the input from the app's settings and its read scopes.
3. Run the bundle in QuickJS with limits and the hook's helpers.
4. Check the result against the output schema.
5. Apply a valid result. Drop an invalid result, and record a problem.

### Bundling (`lib/sandbox/bundle.mjs`)

- An entry may import files in its own app folder and the allowed core modules. No other import.
- Allowed core modules: `@morphemecms/cms/lib/colors`, `@morphemecms/cms/lib/dynamic-colors`, `@morphemecms/cms/lib/hooks`.
- `@app/self` resolves to `{ id }`, as in contract 3.
- Output: one ESM string per entry. The bundle step runs no app code.

### Runner (`lib/sandbox/runner.mjs`, `lib/sandbox/quickjs.mjs`)

```ts
type Limits = { ms: number; memoryMb: number; outputKb: number };
type RunResult = { ok: true; value: unknown } | { ok: false; error: 'throw' | 'timeout' | 'memory' | 'output'; message: string };
run(bundle: string, input: unknown, helpers: Record<string, (...args: unknown[]) => unknown>, limits: Limits): Promise<RunResult>;
```

- The bundle's default export is called with `input` and `helpers`.
- Inside the isolate: no `fetch`, `process`, `require`, timers or `globalThis` from the host. Values cross as JSON.
  Byte arrays cross as `Uint8Array`.
- One fresh context per call. No state between calls.

| Entry | `ms` | `memoryMb` | `outputKb` |
|---|---|---|---|
| hook, per page | 1000 | 64 | 256 |
| `after-build` | 30000 | 256 | 5120 |

### Hooks (`lib/hooks.ts`)

Each hook place has an input builder, helpers and an output check.

| Place | Input | Helpers | Output |
|---|---|---|---|
| `page-colors` | as today (`PageColorsHook`): address, images, settings, roles, colours so far | `pixels(image)`, `readable(colors)` | `Colors` or `undefined`, checked by `colorPairs` as today |

### After-build (`lib/afterBuild.mjs`)

- Input: `{ settings, reads, build }`. Helpers: `hash(text)` (SHA-256, hex).
- Output: `{ files: Record<name, JSON value> }`. A name matches `^[a-z0-9-]+\.json$`. At most 20 files.
- Core writes each file to `dist/_apps/<id>/<name>`. The Worker serves `_apps/` to no one, as today.

### Problems

- Core collects each dropped result: `{ app, place, page?, error, message }`.
- Core writes them to `dist/_apps/_problems.json`.
- The Worker route `GET /api/apps/problems` gives the file to the signed-in editor.
- The app's page in the editor shows the app's problems from the last build as a notice.

## Editor

- The app page's permissions section (Danish label: Rettigheder) shows the four places and their level.
- Texts, present tense: en "Sandboxed", "Full access"; da "Afgrænset", "Fuld adgang".
- `needsOf` (`src/store.ts`) reads `app.json` for contract 4 apps, and the files for older apps.

## Store (`morpheme-appstore`)

- `src/releases.js` rejects `api < 4` unless the publisher's handle is in `FIRST_PARTY` (a Worker variable).
- It rejects an `api: 4` release with a `full` place unless the publisher is first-party. It uses `placesOf` from
  `@morphemecms/cms/lib/appPlaces.mjs`.

## Contract

- `APP_API` becomes 4. `docs/app-contract.md` gets a "Contract 4" section.
- A site on an older CMS gets no contract 4 release from the catalog (the catalog filters by `api`).

## The eight apps (`morpheme-apps`)

- All eight get `app.json`, `texts.json` and, where they have code parts, `editor.ts`.
- `content-colors`: its hook runs sandboxed. Its `build` place becomes `sandboxed`.
- `cookiescanner`: `build.mjs` becomes `after-build.ts` with reads `pages.text`, `cookies`, `apps`, `csp.allowed`.
  Its `build` place becomes `sandboxed`.
- The others keep `full` places (slots, blocks, kinds, Worker). They wait for sub-projects C, D, F and G.

## Speed

Measure a full build of `morpheme-website` before and after, with `content-colors` active. The sandbox may add at
most 20 % to the build time. Above that, profile first. Then consider the Cloudflare build runner.

## Testing

- Pure units have unit tests (`node --test`): manifest, places, bundle, runner, reads, after-build, hook check.
- The runner tests include a hostile app: it reads `process`, calls `fetch`, imports `node:fs`, loops forever, allocates
  too much, and returns too much. Each case gives the right `error` and never reaches the host.
- `npm run check` in `morpheme-cms` and `npm run check` in `morpheme-apps` pass.
- Checked by hand on staging: the app page shows the places; a broken hook shows a notice and the build passes.

## Out of scope

- Sub-projects C to H.
- The internal links app (paused, decision 11).
- The Cloudflare build runner.
