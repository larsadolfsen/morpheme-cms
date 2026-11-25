# The editor pre-built in the package (design)

Status: decided by the owner on 18 November 2026 ("2", then "Options 2 in 18.2"): batch B6 of
`docs/superpowers/plans/2026-11-18-build-and-check-speed.md` is built as option 2, after Tailwind is gone (0.19.0), as a feature of **0.21 Build speed** (owner, 19 November
2026; it was 0.18.3). The
technical design below is the CTO's; the open points in section 7 are for the PR sessions to prove.

## 1. Why

On every save a site's build compiles the editor's client code again: 12.8 s of Vite on saravafaiblom.dk (build of 12 November 2026).
It is the same code on every site, except for the site's own parts, its theme and its apps, which it imports. Option 2 builds the editor
**once, when the CMS is published**, and a site builds only its own small module. A content save, a theme or app change and a CMS update
all stop recompiling the editor.

## 2. What the editor takes from the site today (read on `origin/0.18`)

| Seam | Where |
| :--- | :--- |
| `@site/…` (config, texts, schema, company, colours, prices …) | 99 uses in 72 files of `src/` and `pages/editor/` |
| `@theme/…` (theme parts, previews, looks, styles, blocks' `View.tsx`) | 79 uses in 19 files (61 distinct modules) |
| The apps (`/src/apps/*/…`: `index.ts`, `app.json`, `editor.ts`, `texts.json`, `store.json`, blocks, screenshots) | globs in `src/appFiles.ts`, `src/SideColumn.tsx`, `src/registry.tsx` |
| Themes and icon packs (`/src/themes/*/theme.json`, `store.json`, screenshots; `@icons/*/pack.json`) | globs in `src/themes.ts`, `src/iconPacks.ts`, `src/icon.tsx` |
| Built-in virtual modules (`virtual:site-facts`, `virtual:app-folders`, `virtual:all-icons`, Material Symbols, theme coverage) | 6 files |
| `@data/colors.json`, `@data/theme.json` | `pages/editor/index.astro`, `src/themes.ts` |

`virtual:site-facts` reads every page (`lib/siteFacts.mjs`, `detectFacts`), so today a content save changes the editor's bundle.

## 3. The design

**Two builds.**

- **The editor**, built by the publish workflow into the package (`dist/editor/`): `src/` as ES modules, with the site's seams left
  **external**. It contains React, the CMS's own modules and everything that is the same on every site.
- **The site module**, built by each site's build: its `src/site/` files, the theme in use, its apps and icon pack, compiled as ES
  modules against the editor's shared modules (React and the CMS modules a theme or an app imports are **external** here, so they exist
  once). Small: no editor code.

**One import map.** `pages/editor/index.astro` (still rendered per site: its colours, config and metas) writes a
`<script type="importmap">` that maps each external of the editor to the site module's file (`@site/config` →
`/editor/_site/config.js`, `@theme/editor/previews` → `/editor/_site/theme/editor/previews.js`) and each shared module of the site
module to the editor's file (`react` → `/editor/_app/react.js`). The editor's source keeps its `@site/…` and `@theme/…` imports as they
are; only the globs and the virtual modules change (below). Import maps are Baseline (all current browsers), so no loader script.

**Globs and virtual modules become manifests.** A glob cannot be external, so the 14 files with `import.meta.glob` over the site's apps,
themes, icon packs and screenshots read one generated module instead, `@site/_manifest` (the site build writes it: which apps, themes,
packs, blocks and images exist, with their paths in the site module). Globs over the package's own files (`release-notes/`,
`src/standard/*/`) stay in the editor build.

**Content-dependent data goes to runtime.** `virtual:site-facts` and `@data/colors.json` stop being compiled in: the build writes them
as JSON next to the editor (`/editor/site-facts.json`; the colours are already in the page as CSS and data), and the editor fetches them
when it opens. Then nothing in either build depends on a page's text, and a content save builds neither.

**What a theme or an app may import from the CMS** becomes a public list (the shared modules in the import map: React, `standard/view`,
`icon`, `i18n`, the theme UI parts through `themeUi`), checked by a script (`check:themes` and the apps' sandbox check): an import outside
it fails. That list is contract 8's (2026-11-25-public-imports-contract-8-design.md); this feature changes no contract.

**The editor's version** (`/editor/version.json`, the reload of an editor left open) becomes the package's editor fingerprint and the
site module's hash together.

**Development** (`npm run dev`, the demo) keeps compiling the editor from source with Vite as today; only `npm run build` and a site's
build use the two builds. The screens checks run against the built editor, as the sites do.

## 4. What a save then builds

| Change | Editor | Site module | Pages |
| :--- | :--- | :--- | :--- |
| Content (a page, a post, an image) | nothing (the package's) | nothing (no input changed; kept by building block 1 of the plan) | as today, or only the changed ones with B8 |
| Theme, app, icon pack or `src/site/` | nothing | a few seconds | as today |
| CMS update | nothing (the new package's) | a few seconds | as today |

## 5. The pull requests (on `feature/editor-prebuilt`, cut from `main` after 0.19.0)

1. **Proof.** A spike that builds the editor with `@site/*` and `@theme/*` external, a tiny site module and an import map, opens the demo
   editor in Chromium and saves a page; it proves React is one instance (hooks work across the two builds) and measures both builds.
   Stops the feature if it fails.
2. **Runtime data.** Site facts and colours fetched at runtime; `virtual:site-facts` removed from the editor bundle.
3. **Manifests.** The 14 globs over the site's apps, themes, packs and screenshots read `@site/_manifest`; the other virtual modules
   (`virtual:app-folders`, the icon modules) move into the site module or the manifest.
4. **The two builds.** The package's editor build (the publish workflow and `npm pack`), the site module build and the import map in
   `pages/editor/index.astro`; the old client build of the editor removed from a site's build.
5. **Generate the import map from lib/public-imports.mjs.** No `THEME_API`/`APP_API` raise.
6. **Measure and clean up.** The build on the test site before and after (written into the plan's B6), `compare-html`, the screens,
   starter and demo checks, and every doc that describes the editor's build (`docs/editor.md`, the skills).

## 6. What it does not change

What the editor does and looks like, the site's pages, the Worker, how a theme or an app is written (only what it may import), and the app
sandbox (its build hooks run as before; the editor parts of an app are loaded as before, from the site's own files).

## 7. Open points for the proof (PR 1)

- An app's or theme's editor code that imports a CMS module outside the public list: how many there are today (`git grep` in `src/apps`,
  `theme/`, `morpheme-apps`), so the list is right before the contract. Answered by the report of `check:imports` (2026-11-25-public-imports-contract-8-design.md).
- CSS: the theme's `styles/global.css` and a block's CSS imported from TSX: the site module emits them as files the editor page links.
- The Content-Security-Policy of `/editor/` (`src/data/csp.json`): an inline import map needs its hash in `script-src`, or the map is a file
  (`<script type="importmap" src>` is not supported, so the hash).
- The service worker (`pages/editor/sw.js`): it caches the editor's files by version; it must cache the editor and the site module both.
