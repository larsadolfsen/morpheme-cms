# An app's CSS scoped at build time (spec)

Status: **20 November 2026, for the owner.** Owner, 20 November 2026: "instead of the dev setting the css, can we do it in build time",
then "do that". It changes what an app's CSS can reach, so it raises `APP_API` and ships with the next app contract, in **0.20**
(*Decision*). A small part is preparation in 0.19.6 (*Batches*, batch 0).

## The problem

- **An app's CSS is global.** An app block's `View.tsx` imports the app's CSS (`import '../../style.css'`), and Vite
  bundles it into the page's one stylesheet, on the site and in the editor. The sandbox (contract 4, QuickJS) runs only an app's build
  code (hooks and after-build steps); a block is a `full` place (`docs/app-contract.md`) and its CSS is not isolated.
- **Two apps can collide without a sound:**
  - the same class name (`.mo-signup`) in two apps styles both apps' blocks;
  - the same custom property declared on `:root` (`--mo-gap`): the later stylesheet wins for the whole page;
  - the same `@keyframes`, `@property`, `@font-face` family or `@layer` name: all are global;
  - an app's rule on `html`, `body` or a bare element changes the whole site, the theme's parts included.
- **Today the developer has to prevent it** by naming everything uniquely, and `check:mo-names` only checks that names start with `mo-`,
  not that they are unique to the app.

## The design

**The developer writes plain CSS; the build scopes it to the app.** The CMS knows at build time which app every file belongs to (the
app's id is its folder, `src/apps/<id>/`), so it does the scoping, like Vue's scoped styles and CSS Modules. A Vite plugin next to
`themePlugin` (`site/theme.mjs`) transforms every CSS file under `src/apps/<id>/`, on the site and in the editor alike.

1. **A scope on every app block.** Where the CMS draws an app's block, on the site and in the editor's preview, its outer element
   carries `data-mo-app="<id>"`. The app does not write it and cannot remove it.
2. **Selectors.** Every rule of the app's CSS applies only inside its own blocks:
   `@scope ([data-mo-app="<id>"]) to ([data-mo-app]:not([data-mo-app="<id>"]))`, so it reaches neither the page outside nor another
   app's block placed inside it. Batch 1 checks `@scope` against the CMS's supported browsers; if one lacks it, the plugin prefixes each
   selector with `[data-mo-app="<id>"]` instead and accepts the nested case.
3. **Custom properties.** The CMS's own tokens are known (the registry of `scripts/gen-token-registry.mjs`). A `--mo-…` name the app
   declares that is not on that list is private and is renamed `--mo-app-<id>-<name>`, where it is declared and where it is read, in
   the app's CSS. A CMS token keeps its name: the app reads `--mo-sys-color-primary` as before, and may override a CMS token on its
   block's outer element, as `docs/css-tokens.md` allows.
4. **Other global names.** `@keyframes`, `@property`, `@font-face` families and `@layer` names declared by the app are renamed with the
   same `mo-app-<id>-` prefix, with every use in the app's CSS. The app's CSS goes into a layer the CMS gives it, below the theme's
   parts.
5. **What the build refuses** (`check:content`, an app problem with the file and line): a rule on `:root`, `html` or `body`; a private
   custom property set or read from code (`style` objects, `setProperty`, `getPropertyValue` in `View.tsx` or `script.ts`), because the
   build renames only CSS; and `:global`-like escapes such as an attribute selector on `data-mo-app`.

What the developer sees: the plain names in the source, the renamed ones in the browser's tools. The developer guide (0.22.1) says so.

**Themes are not rewritten.** Only one theme runs at a time, so themes cannot collide with each other. A theme's private custom property
uses the reserved prefix `--mo-theme-*`, which the CMS never declares, so it cannot collide with a CMS token added later; only files in
the theme's own folder may declare or read one (`check:themes`). It stays the last resort: a value with a `--mo-` token is set through
that token (`docs/css-tokens.md`).

**Contract.** An app that styles anything outside its own blocks today stops doing so, which is a breaking change for apps: `APP_API`
rises and the contract is documented in `docs/app-contract.md`. A store app built for the old contract keeps working until its
publisher updates it, as the contract rules say. Scoping alone would not change `THEME_API` (`--mo-theme-*` is new and takes nothing away); contract 8 raises it for the M3 names.

## Decision

**When.** Decided by the owner on 20 November 2026: in **0.20.0 Material 3 names**, contract 8, together with the M3 token names ("Yes,
put it in the roadmap"), because a contract raise starts a line and apps should get one raise (`plans/2026-11-18-release-per-feature.md`).

## Batches

0. **Preparation in 0.19.6 UI fixes (no contract change).** The CMS puts `data-mo-app="<id>"` on every app block's outer element (it changes no
   look), and `npm run check:app-css -- --report` lists, without failing, what batch 2 would rename or refuse in each app. It is run on
   the owner's apps (`morpheme-apps`, which have no CSS today), so their fixes are known before the contract changes. Sara's site and
   the Venus theme are left out until Sara continues (owner, 20 November 2026).
1. **The plugin.** The Vite plugin with its tests (selectors, private names, the other global names, the layer), on the site and in
   the editor; the `@scope` support decided against the browser list. If it is the feature's first pull request, it sets the version.
2. **The check and the contract.** The refusals in `check:content`, `APP_API` raised, `docs/app-contract.md` and the developer guide's
   section, `--mo-theme-*` in `docs/css-tokens.md` and `check:themes`. `check:screens`, `check:themes` and `check:demo` green; the owner's
   apps pass. A release note for app developers (skill `release-notes`).

Done when two test apps with the same class, custom property and keyframes names render side by side on the demo without touching each
other, an app's rule on `:root` fails the check, and the release has run on staging.
