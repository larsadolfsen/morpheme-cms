# App contract

The contract is the set of rules between the editor and an app. `APP_API` in `lib/contracts.mjs` holds its version. An app in the store says which version it is written to in its `api` field.

## App types with one active app

- The `subcategory` of an app is its type: `redirects` and `links`, both under the category `seo`. An app written before still has the category `redirects` or `links`; the editor reads that as the same subcategory of `seo` (`categoryOf` in `lib/storeCategories.mjs`).
- A type allows one active app when two apps of that type collide in code or data.
- `ONE_APP_TYPES` in `lib/appTypes.mjs` lists those types. Today: the subcategories `redirects` and `links` of `seo`.
- When an owner activates an app of such a type, the editor shows a warning and deactivates the other app of that type.
- Activate means install, or turn on the Enabled switch.
- The deactivated app keeps its folder, settings and data.
- The other types allow many active apps.

## Contract 4: app.json and the build sandbox

Contract 4 lets an app describe itself as data. Its build code runs in a sandbox. The app's id is the name of its folder
under `src/apps/`. The id is not in `app.json`.

### app.json

One `app.json` sits in each app folder.

| Key | Type | Required | Meaning |
|---|---|---|---|
| `api` | `4` or `5` | yes | The contract the app is written to. |
| `label` | string | yes | The app's name, in English. |
| `publisher` | string | yes | Who made the app. |
| `license` | SPDX string | yes | The app's license. |
| `thirdParty` | `{ name, license, url }[]` | no | Code or assets the app uses from others. |
| `icon` | Phosphor icon name | yes | The icon, such as `"Palette"`. |
| `hint` | string | yes | A short text the editor shows for the app. |
| `description` | string | no | A longer text about the app. |
| `category` | string | no | The app's category. |
| `keywords` | string[] | no | Words that help find the app. |
| `version` | semver string | yes | The app's version, such as `"1.0.0"`. |
| `releaseNotes` | `Record<version, string>` | no | The release notes per version. |
| `screenshots` | `{ shows, label, values? }[]` | no | Screenshots of the app; `shows` is a keyword, see "Screenshot keywords". |
| `settings` | `{ fields, values, example? }` | no | The settings fields and their values. |
| `lists` | `OwnedList[]` | no | The lists the app owns. |
| `kinds` | `Record<list, AppKind>` | no | The kinds of the lists, without `draw`. |
| `cookies` | `AppCookieDecl[]` | no | The cookies the app sets. |
| `csp` | `Record<directive, host[]>` | no | The hosts the app needs, per directive. |
| `reads` | `ReadScope[]` | no | The site data the app may read. |
| `hooks` | string[] | no | The hooks the app has, by file name. |
| `afterBuild` | boolean | no | True when the app has `after-build.ts`. |

Rules:

- `hooks` lists exactly the files in `hooks/`.
- `afterBuild` is true exactly when `after-build.ts` exists.
- Each cookie's `when.setting` is a field in `settings.fields`. The form is `{ "setting": "<field name>" }`.
- Unknown keys fail the check.

### editor.ts and texts.json

- `editor.ts` holds the app's code for the editor. It has full access.
- `texts.json` holds the app's texts in the other languages, under the keys of today's `texts.ts`.

### Screenshot keywords

Each entry of `screenshots` in an app's `index.ts` says what the picture shows with `shows`:

| Keyword | Shows | Picture file |
| :--- | :--- | :--- |
| `block:<type>` | one of the app's blocks | `<n>-block-<type>.jpg` |
| `kind:<list>:<n>` | variant `<n>` of the kind of one of its lists (`0` without variants) | `<n>-kind-<list>-<n>.jpg` |
| `list:<id>` | one of its lists | `<n>-list-<id>.jpg` |
| `settings` | its settings, with made-up `values` | `<n>-settings.jpg` |
| `page` | its own page | `<n>-page.jpg` |

The file `<n>` is the entry's place in the list, from 1. An unknown keyword is a build problem.

The old keywords `blok:<type>`, `slags:<list>:<n>`, `liste:<id>`, `indstillinger` and `side` still work for one release <!-- language-ok: the deprecated words -->
(`DEPRECATED_SHOT_WORDS` in `lib/appShots.mjs`): they give the same picture as the new ones. A picture is found under
its new file name and, until the app's pictures are taken again with `npx morpheme app-screenshots`, under the old one
(`1-blok-<type>.jpg`). Change the keywords in the app, take the pictures again and delete the old files. The old <!-- language-ok: the deprecated words -->
keywords and file names are removed in the release after the apps are changed.

### Places

An app has four places. The editor gives each place one access level.

| Place | `sandboxed` when | `full` when | `none` when |
|---|---|---|---|
| `build` | only `hooks/` and `after-build.ts` | `slots/`, `blocks/`, a folder of a kind, or `build.mjs` | no build code |
| `editor` | not used yet | `editor.ts` | no `editor.ts` |
| `worker` | not used yet | `worker.js` | no `worker.js` |
| `pages` | not used yet | a `script.ts` or a slot script | no such file |

- `sandboxed` code runs in the sandbox, with the limits below.
- `full` code runs without the sandbox. The store gives `full` only to first-party publishers.
- `none` means the place has no code.

### Reads

An app gets only the scopes it lists in `reads`.

| Scope | Shape the app gets |
|---|---|
| `pages` | `{ address, title, blocks: string[] }[]` of the published pages and posts |
| `pages.text` | the same, and `text` (Markdown) for each entry |
| `cookies` | `{ banner: boolean, list: { name, provider, category, file }[] }` |
| `apps` | `{ id, version, settings, cookies, csp }[]` of the active apps |
| `csp.allowed` | `string[]`: the hosts the owner allowed |

### Hooks

A hook is a file `hooks/<place>.ts`. `page-colors` is the only hook today.

- Input: the page's address, pictures, settings, roles and the colors so far.
- Helpers: `pixels(picture)` and `readable(colors)`.
- Output: `Colors` or `undefined`. The output is checked as today.

### After-build

`after-build.ts` runs once for each build.

- Input: `{ settings, reads, build }`. `build` is `{ commit, committed }`, the commit and its ISO time.
- Helper: `hash(text)` gives the SHA-256 of the text, in hex.
- Output: `{ files }`. Each name in `files` matches `^[a-z0-9-]+\.json$`, and there are at most 20 files.
- Core writes each file to `dist/_apps/<id>/<name>`. The Worker serves these files to no one.

### Imports

An app file imports from its own folder, from `@app/self`, and from these three core modules. Nothing else.

- `@morphemecms/cms/lib/colors`
- `@morphemecms/cms/lib/dynamic-colors`
- `@morphemecms/cms/lib/hooks`

The version functions (`publish`, `schedule`, `unpublish`, `discard` and `saveDraft`, with a version id) are in `@morphemecms/cms/lib/versions.mjs`. An app's `editor.ts` and Worker part have full access and import them like any module; a hook or after-build step may not, as it is not one of the three above.

### Limits

| Run | Time | Memory | Output |
|---|---|---|---|
| hook | 1000 ms | 64 MB | 256 KB |
| after-build | 30000 ms | 256 MB | 5120 KB |

### Problems

- A failed result is dropped. Core lists it in `dist/_apps/_problems.json`.
- The route `GET /api/apps/problems` gives that list to the signed-in editor.
- The app's page in the editor shows the app's problems from the last build.
- The build never fails because of an app.

Apps written to contract 2 or 3 build and run as before, and the editor shows each of their places as full access.

## Contract 5: `role` and `mcp`

Contract 5 is contract 4 with three more optional keys in `app.json`. Everything else is as in contract 4: the same files,
places, hooks and sandbox. The editor reads contracts 4 and 5 (`APP_APIS` in `lib/contracts.mjs`); `APP_API` is 5.

| Key | Type | Required | Meaning |
|---|---|---|---|
| `mediaProviders` | `MediaProviderDecl[]` | no | Sources of pictures for the picture picker; connectors only, see "Media providers". |
| `role` | `"connector"` or `"plugin"` | no | What the app is. A connector sends data to, or loads code from, an outside service. A plugin has no outside access. With no role, the editor reads an app with an `mcp` server or any host in its `csp` as a connector, and any other as a plugin. |
| `mcp` | `{ server, auth, tools }` | no | The MCP server a connector calls. `server` is an https address, `auth` is `"oauth"`, `"token"` or `"none"`, `tools` lists the tools the app may call. |

Rules:

- Contract 4 fails on `role` and `mcp` as unknown keys. They belong to contract 5 only.
- `mcp.server` is https, with a host that is a name: no port, no user info, no IP address.
- `mcp.tools` is required and not empty. Each name matches `^[a-z0-9_-]+$` and is listed once.
- `mcp.auth: "token"` needs a settings field named `token` with `"secret": true`.
- Only `role: "connector"` may declare `mcp`.
- An app with `role: "plugin"` lists no host in `csp` (only keywords such as `'self'` and schemes such as `data:`). The build refuses it otherwise.
- A plugin's `worker.js` and its other code outside the sandbox (`build.mjs`, `slots/`, `blocks/`, `script.ts`) may not use `fetch`, `WebSocket`, `XMLHttpRequest`, `connect` or `import()` of a URL. `npm run check:content` refuses it (`fullCodeProblems` in `lib/sandbox/bundle.mjs`). This scan stops mistakes, not a determined author, which is why `full` places are for first-party publishers only.
- The site's Content Security Policy is built from the active apps' `csp`. A plugin lists no host, so it adds none, and the browser refuses any load a plugin tries from another host.

### Media providers

A connector may add a source of pictures to the editor's picture picker with the optional key `mediaProviders` (contract 5). It is
data only: a request template and a mapping. The Worker makes the requests, to the hosts the app lists in `csp` only, and keeps the
owner's key sealed in D1. The app has no code for it. The shape, the host rules, the credit saved with a picture and the
checks are in `docs/superpowers/specs/2026-11-11-media-providers.md`.

### How long contract 4 stays accepted

Contract 4 stays accepted for as long as the store has an app written to it, and at least through the whole 0.x series. It is
removed only in a release that says so in its changeset, never before `1.0.0`, and never while a connector or plugin the
owner installed still needs it. Apps move to contract 5 with their next version (`1.1.0`): a version is for ever, so a
published contract 4 app is not rewritten.

## Contract 3: `@app/self`

Contract 3 adds one module. An app file can import the id of its own folder.

```ts
import self from '@app/self';

self.id; // 'app_a030dfba69793996'
```

- `self.id` is the folder name under `src/apps/`. Apps from the store have a store id such as `app_a030dfba69793996`. An app a site made itself, and an older store copy, keep a plain name such as `cookiescanner` or `mobilepay`.
- Use `self.id` where the app needs its own id. Do not write the folder name in the code.
- Only files under `src/apps/<id>/` can import `@app/self`. Any other file fails the build with `@app/self is only for app files: <path>`.
- The Vite plugin is `appSelf` in `site/appSelf.mjs`. The types are in `src/virtual.d.ts`.

## Contract 2

Apps written to contract 2 build and run as before. Contract 3 only adds `@app/self`.

## Slots

An app may draw a part of the editor's own screens in place of the core's. `slots` is an optional field of the app (`AppDefinition` in `src/apps.ts`, or in `editor.ts`). It does not change the contract number, and an app without `slots` works as before. A slot is a `full` editor place, like `tabs`, so for first-party apps.

- `versionSwitch`: the switch at the top of a page or post that has changes waiting, which the core draws as `Live` and `Scheduled` (`src/VersionSwitch.tsx`). The first installed app that has it is drawn instead. With none, the core's is drawn.
- The component is given `VersionSwitchProps` (`src/VersionSwitch.tsx`): `entry` (`path`, `collection`, `title`, `post`), `versions` (the page file `live` first, then each waiting version: `id`, `state` and `publishAt`), `editing` (the id being edited), `busy`, `onEdit(id)`, and the four functions `publish(id?)`, `schedule(at | null, id?)`, `unpublish()` and `discard(id?)`.
- The core keeps at most two versions, `live` and `waiting`. The functions take any version id (a plain slug); a file for another id is `src/drafts/<collection>/<page>/<id>.md` (`lib/versions.mjs`).

```ts
export default defineApp({
  // …
  slots: { versionSwitch: VersionList },
});
```

## Widgets

An app may add widgets to the editor's start screen. `widgets` is an optional field of the app (`AppDefinition` in `src/apps.ts`). It does not change the contract number: `APP_API` stays as it is, and an app without `widgets` works as before.

- A widget answers one question about the site in a card. Each person places, orders and sets up their own widgets.
- The key in `widgets` is the part after the app id. The full id of a widget is `<appId>:<key>`, such as `booking:today`.
- A widget is a `WidgetDefinition` (`src/widgets.ts`): `label`, `hint`, `icon`, an optional `settings` (made with `defineSettings`, per placed widget) and a `component`.
- The `component` is required. The check before the build fails with `src/apps/<app>/index.ts: The widget "<key>" has no component.`
- The component is given `WidgetProps`: `api` (asks the app's own addresses in the site's Worker, as an app page does), `settings` (the values of the placed widget) and `editing` (true while the person arranges the start screen; the widget then renders, never null).
- A widget with nothing to say may render nothing when `editing` is false.
- A widget shows only while its app is installed.

```ts
export default defineApp({
  // …
  widgets: {
    today: { label: 'Bookings today', hint: 'Who comes today', icon: CalendarCheck, component: Today },
  },
});
```
