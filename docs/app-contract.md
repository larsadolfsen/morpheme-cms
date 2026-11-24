# App contract

The contract is the set of rules between the editor and an app. `APP_API` in `lib/contracts.mjs` holds its version. An app in the store says which version it is written to in its `api` field. `APP_API` is 7.

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
| `api` | `6` | yes | The contract the app is written to. |
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

Each entry of `screenshots` in an app's `index.ts` says what the image shows with `shows`:

| Keyword | Shows | Image file |
| :--- | :--- | :--- |
| `block:<type>` | one of the app's blocks | `<n>-block-<type>.jpg` |
| `kind:<list>:<n>` | variant `<n>` of the kind of one of its lists (`0` without variants) | `<n>-kind-<list>-<n>.jpg` |
| `list:<id>` | one of its lists | `<n>-list-<id>.jpg` |
| `settings` | its settings, with made-up `values` | `<n>-settings.jpg` |
| `page` | its own page | `<n>-page.jpg` |

The file `<n>` is the entry's place in the list, from 1. An unknown keyword is a build problem.

The old keywords `blok:<type>`, `slags:<list>:<n>`, `liste:<id>`, `indstillinger` and `side` still work for one release <!-- language-ok: the deprecated words -->
(`DEPRECATED_SHOT_WORDS` in `lib/appShots.mjs`): they give the same image as the new ones. An image is found under
its new file name and, until the app's images are taken again with `npx morpheme app-screenshots`, under the old one
(`1-blok-<type>.jpg`). Change the keywords in the app, take the images again and delete the old files. The old <!-- language-ok: the deprecated words -->
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

- Input: the page's address, images, settings, roles and the colors so far.
- Helpers: `pixels(image)` and `readable(colors)`.
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

Custom colors (a site that sets Primary, Secondary and Tertiary itself) add optional fields to the `dynamic` choice in `lib/dynamic-colors`: `harmony: 'custom'`, `secondary`, `tertiary` and `kept: ['primary']`. They are only there for a site that chose Custom; `dynamicColors(dynamic, roles)` keeps its signature, and `lowContrast(set, pairs)` of `lib/colors` takes an optional third argument, the roles kept (`dynamic.kept`). A hook that reads `dynamic` must accept a `harmony` it does not know.

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
places, hooks and sandbox. Contracts 6 and 7 have the same keys: 6 changes only the names of the design tokens, 7 ends Tailwind (see below). The editor
reads contract 7 only (`APP_APIS` in `lib/contracts.mjs`).

| Key | Type | Required | Meaning |
|---|---|---|---|
| `mediaProviders` | `MediaProviderDecl[]` | no | Sources of images for the image picker; connectors only, see "Media providers". |
| `role` | `"connector"` or `"plugin"` | no | What the app is. A connector sends data to, or loads code from, an outside service. A plugin has no outside access. With no role, the editor reads an app with an `mcp` server or any host in its `csp` as a connector, and any other as a plugin. |
| `mcp` | `{ server, auth, tools }` | no | The MCP server a connector calls. `server` is an https address, `auth` is `"oauth"`, `"token"` or `"none"`, `tools` lists the tools the app may call. |

Rules:

- A manifest below contract 5 fails on `role` and `mcp` as unknown keys. They belong to contract 5 and up.
- `mcp.server` is https, with a host that is a name: no port, no user info, no IP address.
- `mcp.tools` is required and not empty. Each name matches `^[a-z0-9_-]+$` and is listed once.
- `mcp.auth: "token"` needs a settings field named `token` with `"secret": true`.
- Only `role: "connector"` may declare `mcp`.
- An app with `role: "plugin"` lists no host in `csp` (only keywords such as `'self'` and schemes such as `data:`). The build refuses it otherwise.
- A plugin's `worker.js` and its other code outside the sandbox (`build.mjs`, `slots/`, `blocks/`, `script.ts`) may not use `fetch`, `WebSocket`, `XMLHttpRequest`, `connect` or `import()` of a URL. `npm run check:content` refuses it (`fullCodeProblems` in `lib/sandbox/bundle.mjs`). This scan stops mistakes, not a determined author, which is why `full` places are for first-party publishers only.
- The site's Content Security Policy is built from the active apps' `csp`. A plugin lists no host, so it adds none, and the browser refuses any load a plugin tries from another host.

### Media providers

A connector may add a source of images to the editor's image picker with the optional key `mediaProviders` (contract 5). It is
data only: a request template and a mapping. The Worker makes the requests, to the hosts the app lists in `csp` only, and keeps the
owner's key sealed in D1. The app has no code for it. The shape, the host rules, the credit saved with an image and the
checks are in `docs/superpowers/specs/2026-11-11-media-providers.md`.

## Contract 7: no Tailwind

In force since the Tailwind removal (batch T16 of `docs/superpowers/plans/2026-11-18-tailwind-batches.md`, released as 0.19.0).

Contract 7 is contract 6 without Tailwind. A theme or an app written to 7 uses no utility class (`flex`, `px-4`,
`medium:grid-cols-2`, `hover:underline`), no `theme()`, no `@theme`, no `@apply` and no `@source`, and no `--tw-*` custom
property. The CMS no longer builds them: such a class or rule does nothing, without a message. The text style is `mo-prose` and its opt-out is
`mo-is-not-prose` (they were `prose` and `not-prose`). A theme or an app writes layout with the `mo-` classes (`mo-row`, `mo-stack`, `mo-grid` …), breakpoints as
`@media (width >= 37.5rem)` literals and states as CSS selectors. No key or file of `app.json` changes.

`THEME_API` and `APP_API` are 7 and `APP_APIS` in `lib/contracts.mjs` is `[7]`, replacing 6. The editor reads
contract 7 only, the store offers a CMS at 7 only apps and themes written to 7, and an installed app or theme written to 6 is
refused with `The key "api" must be 7.` until its author publishes a new version. A published version is for ever, so it is
not rewritten. An app or a theme written to 6 that already uses no utility needs only its `api` number changed.

The migration, class by class, is `docs/tailwind-migration.md` and `docs/tailwind-migration-classes.md`.

## Contract 8: scoped CSS

Spec: `docs/superpowers/specs/2026-11-20-scoped-app-css-design.md`. The outer element of every app block carries `data-mo-app="<id>"` (the CMS puts it on the element
the view returns, so no element is added to the page's flow; a view that returns a fragment or nothing of its own gets one that takes no space, `display: contents`; the app does not write it and cannot remove it). From the contract that raises `SCOPED_CSS_FROM_API` (8, `lib/appCss.mjs`), the build
rewrites every `.css` file in `src/apps/<id>/`, on the site and in the editor (`site/appCss.mjs`):

- every selector applies only inside the app's own blocks (`:where([data-mo-app="<id>"])` before it: the build targets Firefox 114 and Safari 16.4, which lack `@scope`; `APP_CSS_MODE` switches to `@scope` when the target moves);
- a `--mo-…` custom property the app declares that is not the CMS's is renamed `--mo-app-<id>-<name>`, where it is declared and where it is read in the app's CSS;
- the app's `@keyframes`, `@property`, `@font-face` families and `@layer` names are renamed `mo-app-<id>-<name>`;
- the rules go into the layer `mo-app`, the lowest layer, below the theme's parts.

An app written to an older contract keeps its global CSS. `npm run check:app-css -- --report` lists what the build would rename in each app, and what the contract refuses.

**What the check refuses** (`check:content`, from an app written to 8; one line with the file and line, shown on the app's page):

- a rule on `:root`, `html` or `body` (style the app's own elements; a CMS token is overridden on the block's outer element, `docs/css-tokens.md`);
- a private custom property set or read from code (`style` objects, `setProperty`, `getPropertyValue`, a `var(--mo-…)` string in `View.tsx` or `script.ts`), because the build renames CSS only;
- an attribute selector on `data-mo-app`.

**What the developer sees.** The source keeps the plain names; the browser's tools show the renamed ones (`--mo-app-shop-gap`, `mo-app-shop-fade`) and the selectors with `:where([data-mo-app="shop"])` before them. Two apps may use the same class, custom property and keyframes names without touching each other. A `@import` in an app's CSS is not scoped: put the rules in the app's own files. A `<style>` or `<style is:global>` block in an app's `.astro` file is not scoped either (the build rewrites `.css` files only); `check:content` still refuses a rule on `:root`, `html` or `body` in it, and the report lists the block. The developer guide (0.22.1) takes this section over.

**A theme's private custom property** is `--mo-theme-*` (`docs/css-tokens.md`); it is not renamed, and only files in the theme's own folder declare or read one (`check:content`, so `check:themes`).

## Contract 6: the design tokens' names

Contract 6 renames every design token that is not Tailwind's to Material 3's pattern: `--mo-ref-*`, `--mo-sys-*` and
`--mo-comp-<component>-*`. The old names stop working with no alias, so a theme or an app that writes one, in CSS or in a
a Tailwind class that holds a `var()` of one, must use the new one. `docs/theme-token-files.md` has the folders and the table of
every old and new name. No key or file of `app.json` changes.

From contract 6 the editor read contract 6 only (`APP_APIS` was `[6]`): an app or a theme written to 4 or 5 was not offered, and an installed one
was refused with `The key "api" must be 6.`, until its author publishes a new version that uses the new names. A published version is for
ever, so it is not rewritten.

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

## The theme's UI components by name

An app draws with the theme's parts (`@theme/ui/…`, `@theme/blocks/…`), by Material 3's names. Two have new names; the old
ones stay as aliases of the same part until a later `THEME_API` removes them, so an app or a theme written with them works as before.

| Import (Material 3's name) | Old name, kept as an alias | Material 3 |
| :--- | :--- | :--- |
| `@theme/ui/AppBar`: `AppBar`, `appBarKinds`, `appBarClass`, `appBarClasses`, `AppBarKind` | `@theme/ui/TopAppBar`: `TopAppBar`, `topAppBarKinds`, `topAppBarClass`, `topAppBarClasses`, `TopAppBarKind` | App bars: "Four variants: Search app bar, small, medium flexible, large flexible" |
| `@theme/ui/TextFieldMenu`: `TextFieldMenu`, `textFieldMenuClass`, `TextFieldMenuOption` | `@theme/ui/ExposedDropdownMenu`: `ExposedDropdownMenu`, `exposedDropdownMenuClass`, `ExposedDropdownMenuOption` | Menus: "Dropdown menu and exposed dropdown menu are now both referred to as menu"; text fields: "Text field dropdown menus" |
| `@theme/blocks/Panel` | — | An outlined card; the name Panel stays |

### Removed prop

The update rewrites this in the site's own themes and apps (`lib/migrate-code.mjs`). A store item is never rewritten: its publisher releases a version written to contract 8. `ListItem` keeps Material 3's slot names (`leadingIcon`, `leadingIconSelected`, `leadingAvatar`, `leadingImage`, `leadingVideo`, `leadingMedia`, `trailingIcon`, `trailingSupporting`, `trailing`, as its list tokens name them), and `Card` has no renamed prop.

| Component | Old prop | New |
| :--- | :--- | :--- |
| `ListItem` (`@theme/ui/List`) | `columns` | removed (a bare `columns` is dropped; `columns={expr}` stops the update and names the line) |

A theme that draws its own bar or menu still does it in `ui/TopAppBar.tsx` and `ui/ExposedDropdownMenu.tsx` while
the aliases stay; the new names lead to the theme's file, else the standard theme's.

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
- A widget is a `WidgetDefinition` (`src/widgets.ts`): `label`, `hint`, `icon`, an optional `settings` (made with `defineSettings`, per placed widget), an optional `span` and a `component`.
- `span` is the width of the widget's card on the start screen's grid (the theme grid, `docs/theme-grid.md`). It is optional and an app can set it; the CMS's own widgets leave it out. There is no setting for it in edit mode and nothing is stored for it.
  - Left out: the card is full width on a phone (under 600 dp) and one column from 600 dp, as every card was before `span` existed.
  - `'full'`: the card goes across all the columns at every size.
  - `'column'`: the card takes one column at every size, half the width on a phone, where the start screen has two columns. Two `'column'` widgets in a row sit side by side; a card of one column is narrow (about 160 px on a phone), so use it only for a widget that reads well that narrow: a number, a short status, a few short lines.
  - Cards pack down the columns in their order, each under the one above with only the gutter between them, so a full width card splits the columns above it from the ones below it.
  - `span` is optional, so `APP_API` and `THEME_API` stay as they are and an app without it works as before.
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

## The app's test page

An app with blocks can bring a test page: `check-page.md` in the app's folder, next to `app.json`. It is a page in the site's own format (front matter with a `title`, then the app's blocks as the editor writes them, `<div data-block="<type>" data-props="…"></div>`) that holds each block of the app with valid props, so the checks draw the blocks as the author intends. I chose a page over a key in `app.json` because the block markup is the one the editor and the site already read and write (`lib/blocks.mjs`), so the author can copy it from a page saved in the editor; a key would need a second schema, and `app.json` fails on unknown keys.

- `check:screens` and `check:themes` (which runs the screens with each theme) load each installed app's test page as a temporary page that exists only in the run's memory (the texts the editor is given). It is never a file in the site's folder, never saved to the site's repository and never published. Every failure is reported under the app's name (`app <id> (check-page.md): …`). Core blocks keep the system's own test page; a theme has none.
- The page may hold only the app's own blocks (the folders in `blocks/` with an `index.tsx`). A block of another type, a missing front matter or a page with no block fails the check under the app's name. A block of the app that the page leaves out only gets a warning.
- An app with blocks and no `check-page.md` is not broken by that: its blocks are inserted with their default values, and the run prints a warning that names the app (`warning: app <id>: no check-page.md …`).
- The file is optional and nothing that exists changes meaning, so it needs no step in `APP_API` (it stays as it is; an addition is not a break). The code is `lib/appCheckPage.mjs`.

## Blocks typed in place (`inline`)

A block can be typed where it stands in the text, with no sheet, instead of being filled in a sheet. The editor's standard blocks List and Cards are the first. A block opts in with `inline` in its `defineBlock` (`InlineSpec`, `src/blocks.ts`); an app's block (`src/apps/<app>/blocks/<type>/index.tsx`) is defined with the same `defineBlock`, so the definition is the same. The plan is in `docs/superpowers/specs/2026-11-12-inline-block-editing-design.md` (row *An app's blocks*) and `docs/superpowers/plans/2026-11-12-inline-block-editing.md`.

An app's block opts in with two things: `inline` in its `index.tsx` and an `Inline.tsx` next to its `View.tsx`, which draws it. The editor types the block in place only when it has both.

- `src/apps/<app>/blocks/<type>/Inline.tsx` has the view as its default export, a component given `InlineViewProps` (`@morphemecms/cms/src/inline`). `src/registry.tsx` collects it the way it collects `View.tsx` and `viewOf.ts` (`appInlines`, `src/appFiles.ts`), and the editor draws that component for the block (`inlineView` on the block).
- It is built on the shared parts, imported from `@morphemecms/cms/src/inline`: `InlineItems`, `InlineField`, `InlineSlot` and `InlineAdd`, with the types `InlineViewProps`, `Change`, `Focus`, `Item` and `ItemContext`. That path is the one an app imports; the files behind it may move.
- A block with `inline` and no `Inline.tsx` keeps its card that opens the sheet, and a new one is made in the sheet (`BlockDialog.tsx`), so it can always be filled in. A block without `inline` is not affected.
- An app's view is never looked up by the block's type in the editor's own list, so an app that names its block `list` or `cards` does not get the standard block's drawing.

The demo has a working example: the app `demo/src/apps/inline-example/` and its block `tickets` (`index.tsx` with `inline`, `Inline.tsx`, `View.tsx`, `viewOf.ts`, `load.ts`). `check:screens` opens it on a phone (375 px) and a computer (1280 px) and types in it.

This opens nothing to the sandbox. A block is a `full` place that runs in the editor, as `View.tsx` does; hooks and after-build steps still import only the three modules of *Imports*, and the sandbox that runs them (QuickJS) is unchanged. It is not a change of contract: no key and no file an app has today changes meaning, so `APP_API` stays 6 and apps written to contract 6 work as before. (`APP_API` rises only when an app written to the one before stops working.)

### The definition

```ts
inline: {
  item: 'items',            // the name of the list field that holds the items
  fields: ['title', 'text'], // the typed fields of an item, in the order the cursor goes
  icon: 'icon',             // the field picked in the icon slot (or `media: [...]` for a card's media)
  link: 'href',             // the field picked in the link slot (or `settings: [...]`)
  blockSettings: false,     // true when the block has settings besides its items: its menu keeps Edit
  texts: { addAbove, addBelow, link, row, settings, icon }, // the toolbar's and the item's words, in the editor's language
},
```

A standard block's markup is a component in `src/inlineViews.tsx`; an app's is its `Inline.tsx`. Both are built on the shared parts (`src/InlineItems.tsx`; an app imports them from `@morphemecms/cms/src/inline`), and the block adds one entry to `inlineBlocks` in `scripts/editor-screens.mjs` so `check:screens` opens it on a phone.

### Worked example: List

`src/standard/list/index.tsx` has the items in `items` (each with `icon`, `title`, `text` and `href`) and says:

```ts
inline: {
  item: 'items',
  fields: ['title', 'text'],
  icon: 'icon',
  link: 'href',
  texts: { addAbove: t.blocks.list.addAbove, addBelow: t.blocks.list.addBelow, link: t.blocks.list.link,
           row: t.blocks.list.row, settings: t.blocks.list.rowSettings, icon: t.blocks.list.icon },
},
```

So the heading and text of each row are typed in place, the icon and the link are slots, and `src/InlineList.tsx` (registered as `list` in `inlineViews`) draws the rows as the site draws them.

### Rules every block follows

- Only text is typed in place. Everything that is not text (icon, image, link, dates, choices) stays in the sheet.
- The block has no label or heading in place: a heading above the block is the text's own.
- Only the active item shows its empty fields; the others show their live look.
- `Add` (for example `Add list row`) is a text button below the last item, shown only while the block is active.
- Words follow the word-choice rules (short, active verbs), in English first with the Danish in `i18n/da-DK/`.
