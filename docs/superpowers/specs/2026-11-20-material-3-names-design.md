# 0.20.0 Material 3 names, contract 8 (spec)

> **Moved into 0.19.6, 22 Nov 2026** (owner, 22 Nov 2026: "Yes, move the names into 096. Also move phosphor icons as in a store icon into it, so Sarah can get it. And also the full screen dialog should be there." `plans/2026-11-22-one-release-per-line.md`). It is the first batch of the 0.19.6
> release: branch `feature/0.19.6-m3-names`, version `0.19.6`, PM `/pm 0.19.6`; where this spec says 0.20.0, read 0.19.6 (the update
> crosses 0.19.6, and `morpheme migrate --from 0.19.5`). Changed with it:
> - **The full-screen dialog** comes back in the theme's Dialog (DG1) here, and the editor's full-screen pages (C1, B1, B2) follow it in
>   the editor-in-Material-3 batch (`plans/2026-11-21-0-19-6-editor-in-material-3.md`).
> - **Icons:** a site whose chosen pack is `phosphor` or `lucide` draws Material Symbols with **no warning** (owner, 22 Nov 2026: "don't
>   give a warning about the icons"). Phosphor is in the store in the same release, as a pack the site installs and picks (the next
>   batch; `specs/2026-11-14-icon-packs-in-the-store-design.md`).
> - **Sara and Venus are back in:** Sara updates on Wednesday 25 Nov 2026, prepared on 24 and 25 Nov (owner, 22 Nov 2026). Venus gets a
>   version written to contract 8 in `morpheme-apps`, so her site can update; *Migration*, 3, below no longer leaves it out.

Status: **20 November 2026, for the owner.** Owner, 20 November 2026: "I want us to match md both in appearance and in naming", then
"Yes, put it in the roadmap" and "Write the 0.20.0 Material 3 names spec". 0.19.5 makes the appearance match
(`plans/2026-11-20-0-19-5-material-3-tokens.md`); this spec covers the names. It is contract 8, the first release of the 0.20 line
(`plans/2026-11-14-roadmap-0-18-to-0-24.md`, item 0.20.0), and an app's CSS scoped at build time ships with it
(`specs/2026-11-20-scoped-app-css-design.md`), so apps get one contract raise. One decision is open (*Open decisions*).

## The goal

A theme or app author who knows Material 3 finds every name where M3 puts it. A token, a component, a part, a kind and a size have
M3's name, so that m3.material.io's specs pages read as the CMS's own documentation. Names that are not M3's are only:

- the page and post editor (`mo-editor-*`, its bar, overflow menu, text and block menus): outside Material 3 (owner, 13 November
  2026);
- a value M3 has no token for: it gets a name in M3's pattern and is listed as ours (*Ours*, below).

## What is renamed

1. **Tokens.** Every `--mo-sys-*` and `--mo-comp-*` token is `--mo-` plus M3's token name, its dots turned into dashes:
   `md.sys.color.secondary-container` → `--mo-sys-color-secondary-container`, `md.comp.search-bar.container.color` →
   `--mo-comp-search-bar-container-color`, `md.comp.button.small.container.height` → `--mo-comp-button-small-container-height`. The
   source is the token copy `docs/m3-tokens/` (0.19.5, batch 1), never memory. Where a set has an Expressive and a baseline name, the
   Expressive one counts (skill `material-3`). `--mo-ref-*` follows `md.ref.*` the same way.
2. **Components and parts.** A class's component is M3's component name, the same word as its tokens (`docs/class-names.md`):
   `mo-<component>`, `mo-<component>__<part>`, with the part named as M3's tokens name it (`container`, `label-text`, `leading-icon`,
   `active-indicator`). A theme UI component in `theme/ui/` has M3's name in PascalCase (`SearchBar` and `SearchView` where M3 has two
   components). Batch 1 lists each component whose name differs, read from the token copy's set names.
3. **Kinds and sizes.** A kind (`mo-is-<kind>`, a component's `kind` prop) and a size (`mo-is-<size>`, `mo-<component>__<size>`, a
   `size` prop) take M3's words. The known case: our *medium* button is 40 dp, M3 Expressive's *small*
   (`md.comp.button.small.container.height`, 40 dp; M3's sizes are xsmall 32, small 40, medium 56, large 96, xlarge 136 dp). After
   0.19.5 each of our sizes has an M3 height; it takes the name of that height. Two sizes of ours that land on the same M3 size become
   one; an M3 size we lack is not added here.
4. **Ours.** A value M3 has no token for keeps a name in M3's pattern, `--mo-sys-<group>-<name>` or
   `--mo-comp-<component>-<part>-<attribute>`, and is listed in `scripts/m3-names.ours.mjs` with the reason M3 has none. Examples:
   the elevation shadows (`--mo-sys-elevation-levelN-shadow` and `-rest-shadow`, `specs/2026-11-20-elevation-design.md`: M3's data
   has only `shadow-color`), density, the section colours, the blocks' tokens (`--mo-comp-block-*`: blocks are not M3 components).

5. **Icons** (owner, 21 Nov 2026: "phosphor should not be a part of the cms. it should be installable. so remove it and lucide for
   now. we will add it later to the store"; "In 0.20.0"). The icon vocabulary becomes Material Symbols' names. Today the names
   are Phosphor's: content (a card's `icon: certificate`), an app's `icon` in `app.json`, the store catalog and the editor's code
   (about 80 files import `@phosphor-icons/react` components, and a few, such as `lib/snackbar.ts` and `src/contextualMenu.ts`,
   import Phosphor's SVG files with `?raw`). After 0.20.0:
   - every stored icon name is its Material Symbols name (`map-pin` → `location_on`), rewritten by the update from the map in
     `lib/materialIcon.mjs` (`materialName`). A name with no Material Symbols icon is listed in batch 1's map with the closest one, and
     the CTO reviews it with the rest of the map;
   - the editor's code draws every icon through the shared `Icon` by its Material name (roadmap 0.27.0 moves here);
   - `icons/phosphor/`, `icons/lucide/`, `@phosphor-icons/core`, `@phosphor-icons/react` and the Lucide source leave the package.
     `SYSTEM_PACKS` is `material-symbols` alone, and `themePlugin` stops redrawing Phosphor imports. `check:phosphor` fails on any
     import of `@phosphor-icons/*` or Lucide, with no allowlist;
   - a theme may still bring its own pack (`icon-packs/`), keyed by Material names;
   - **brand logos are their own always-drawn pack** (owner, 24 Nov 2026: "we keep brand logos as their own icon pack because they are
     the same no matter what"; "Share buttons must use the real logos. If missing we need to create our own standard svg logos").
     Material Symbols has no brand marks, so `facebook-logo`, `x-logo`, `linkedin-logo`, `pinterest-logo`, `github-logo` and
     `google-logo` are `{ brand: '<name>' }` in `lib/materialIconMap.mjs`, never a `closest` Material icon. The brand pack is drawn
     whatever icon pack a site picks. The standard SVGs and the share row that draws them come in batch 7; the map only says which
     names are brands. Recorded in `docs/material-deviations.md`, *Brand logos*;
   - a site whose chosen pack is `phosphor` or `lucide` draws Material Symbols, with a warning in the editor, never a failed build
     (decision 3 of `specs/2026-11-14-icon-packs-in-the-store-design.md`). Venus is such a theme (`"icons": "phosphor"`). Phosphor,
     Lucide and Font Awesome come back as store packs in 0.27.2 (owner, 21 Nov 2026: "We will add Phosphor, lucide and font awesome
     to the store").

The names change; the values do not. Every value is M3's after 0.19.5, so 0.20.0 changes no look (except the icons of a site that
picked Phosphor or Lucide, above), and `check:screens` must show the
same screens before and after each rename.

## The map

`scripts/m3-names.json`, made once in batch 1 from 0.19.5's `check:m3-tokens --report` and the token copy, then reviewed by hand. It
has four parts: `tokens` (old custom property → new), `classes` (old class → new), `props` (component → prop → old value → new, for
example `Button.size.medium` → `small`), and `reused`, the old names that come back with another meaning (after the button rename,
*small* and *medium* are both old and new names).

- An old name that is not reused goes into `scripts/renamed-tokens.json` too, so `check:token-names` keeps failing on it, as for
  contract 6.
- A reused name cannot be caught by a check: an app written to contract 7 with `size="medium"` would get the 56 dp button. That is
  why the contract is raised, and why the rewrite runs exactly once (*Migration*).
- `docs/theme-token-files.md` and `docs/class-names.md` get the table of every old and new name, as for contract 6.

## Contract 8

`THEME_API` and `APP_API` are 8 and `APP_APIS` is `[8]` (`lib/contracts.mjs`). The editor reads contract 8 only, the store offers a CMS
at 8 only themes and apps written to 8, and an installed one written to 7 is refused with `The key "api" must be 8.` until its
publisher releases a new version. A published version is forever, so it is not rewritten. `docs/app-contract.md` gets a section
*Contract 8* with the names (here) and the scoped CSS (its spec). No key or file of `app.json` changes.

**What a theme or an app may import from the CMS** (owner, 25 Nov 2026: "Yes, so we avoid the extra contract"; moved here from `specs/2026-11-18-editor-prebuilt-design.md`, so 0.21.1 needs no contract): a public list of CMS modules (React, `standard/view`, `standard/load`, `icon`, `i18n`, the theme UI parts through `themeUi`, and every other module that Venus, the store apps in `morpheme-apps` and Sara's own app import today, counted with `git grep` before the list is fixed), checked by `check:themes` and the apps' sandbox check: an import outside it fails. The list only grows; adding a module needs no contract, removing one would. It is written into `docs/app-contract.md`, *Contract 8*. See specs/2026-11-25-public-imports-contract-8-design.md.

## Migration

Contracts 6 and 7 rewrote nothing: authors released new versions, and a site with an old theme or app broke on update until they did
(Venus on 0.18.1, 19 November). The roadmap and the 0.19.5 plan said contract 6 had `morpheme migrate` rewrite themes and apps; that
was wrong and is corrected with this spec. 0.20 is *Maturity*: a site updates safely in one step. So contract 8 rewrites what it can
and holds the update where it cannot.

1. **The site's content.** The class names the editor saved in content (`lib/content-class-names.mjs`) get the classes of the map
   from `0.20.0` (a second entry beside `CLASS_NAMES_SINCE = '0.19.0'`). As in 0.19.0, the Worker's update (`worker/cms-update.js`)
   rewrites them in the same commit when it crosses 0.20.0, and `npx morpheme migrate` does it by hand.
2. **A site's own themes and apps** (in `src/themes/` and `src/apps/` with no `store.json`). A new
   `lib/migrate-code.mjs` rewrites their CSS, TS and TSX, used by the Worker's update and by `morpheme migrate`:
   - token and class names as text: every name starts with `--mo-` or `mo-`, so a whole-name match cannot hit a word of text; all
     renames happen in one pass, so `medium` → `small` and `small` → `xsmall` do not chain;
   - prop values only as a literal attribute (`size="medium"`) on a component the same file imports from `@theme/ui/<Name>`;
   - every name map the site crossed, in order: contract 6's `scripts/renamed-tokens.json` and contract 7's class map before this
     one, so a site on 0.16 gets all of them;
   - what it cannot rewrite safely (a computed value, `size={big ? 'large' : 'medium'}`, an old name built from parts, a Tailwind
     class) it lists by file and line, and the update does not go: it says which file to fix.
   It runs once, because reused names make a second run wrong: the Worker runs it only when an update crosses 0.20.0, and
   `morpheme migrate` asks for the version the site came from (`--from 0.19.7`).
3. **Store themes and apps** are never rewritten on a site (a published version is forever, and the site's copy must equal it). Their
   publishers release a version written to 8: the owner's apps from `morpheme-apps` (the owner releases them, as always). The store must accept contract 8 before 0.20.0 is
   released. **The update installs what the target needs** (owner, 24 November 2026, replacing the 20 November rule that the update
   never installs store items, so Sara's site can update): an old editor offers only themes and apps up to its own contract, and the new CMS
   fails the build without newer ones, so the old way, a stop, undid every update. The update's Cloudflare build runs the target
   package's code (`morpheme ci-build`, which no old editor can change), and before its checks the build does this:
   - **When.** The live `/editor/version.json` does not record the contracts the target reads (`contracts`: `{ theme, apps }`, which
     older versions do not write), or lists store items waiting for the editor's commit (`installs`, below). Other updates skip
     the step.
   - **What.** For each folder of the site's themes and apps named as a store id (`theme_<16 hex>`, `app_<16 hex>`), it asks the store
     whether the installed version is written to a contract the target reads (`GET /store/releases/<id>/<version>`). If not, it takes the
     store's newest version of the item for the target (`GET /store/catalog?app=<n>&theme=<n>`, asked once for each app contract the target reads and joined, because `?app=<n>` may give only versions at exactly n), reads each
     file (`GET /store/files/<oid>`), checks each against its git blob id, and writes the folder, with its `store.json`, into the build's
     working tree, all or nothing. The checks and the Astro build then run on that tree.
   - **What stops it.** The build fails with a line naming the item and why, and the old editor undoes the update as it does for any failed build
     (its message, *Undo the update of Morpheme to …*, and the build log with the item's name): *an item with no version the target accepts*
     (its publisher must release one); *a site copy* (a folder named as a store id with no `store.json`: the store never held it, so no
     update can replace it); *an item changed in the site* (its files differ from `store.json`: the build never writes over the site's own work).
   - **The key.** The build reads the store's key from the build variable `MORPHEME_STORE_KEY` (and `MORPHEME_STORE_URL` for another
     store); the key a site connects with in the editor lives in its Worker's database, which a build cannot read. When the step runs for a site
     that has store items and the variable is missing, the build fails and says exactly that: set `MORPHEME_STORE_KEY` in Cloudflare (Workers &
     Pages, the site, Settings, Build, Variables and secrets). A site with nothing to install never needs it. When the store cannot be reached,
     nothing is installed and the checks decide, as before. A site copy is named in either case.
   - **Site copies are named, not swapped** (PM, 24 November 2026, from Sara's upgrade): replacing a site copy by its store version would
     also move its settings (`src/data/apps/<name>.json` to `app_<id>.json`), which nothing in the CMS does, so the build names the copy
     and stops; the owner does that swap by hand. The build needs no `store/catalog.json`: it reads the store's catalog.
   - **An app's Worker part.** An installed app with a `worker.js` is written into `worker/apps.js` (`appWorkersFile`) in the build, so
     `check:content` passes, and the editor commits that file with the last app of its first start. The build names every `env.NAME` the app's
     Worker reads that the site's `wrangler.jsonc` does not declare (a binding or variable) in its log, and adds none.
   - **The commit.** The build's tree is deployed, so the site runs the new items, while the site's git still has the old ones. The build
     leaves `.morpheme/build-installs.json` (what it installed), served as `/editor/build-installs.json` (`no-store`), and lists the same items
     as `installs` in `/editor/version.json`, so every build of that git redoes the install until the commit. On its first start the new editor
     reads the file and commits all items through `src/store.ts` (`appChanges`, `themeChanges`) as the store's versions, with `worker/apps.js`, in one
     commit (one build on Cloudflare, not one per item), once per editor session (`commitBuildInstalls` in `src/AppList.tsx`): not when the site already has that version or newer, the item
     was uninstalled, or a file of it was changed in the site.
   - **The Worker's nightly hold** (`heldByContract`) is unchanged by this: it still holds an update it cannot show to be safe.

   **Sara's site and Venus are out** (owner, 20 November 2026: "We keep sara out until she is ready to continue. this also means we do
   not maintain venus"). Venus gets no contract 8 version, and no batch waits for Sara's site, her app or Venus.

## Checks

- **`check:m3-names`** (`scripts/check-m3-names.mjs`, in `check:source`): every `--mo-sys-*`, `--mo-comp-*` and `--mo-ref-*` token
  the theme declares is an M3 token name in `docs/m3-tokens/` or listed in `scripts/m3-names.ours.mjs`; every `mo-<component>` class
  names an M3 component, a block (`mo-block-*`), the editor (`mo-editor-*`) or an entry of the ours list. It fails on any other name,
  and on an ours entry M3 has since got a token for. It takes over the naming part of 0.19.5's `--report`.
- `check:token-names` fails on the old names (the map's non-reused names).
- `migrate-code` has tests: a made-up theme and app with old names of contracts 6, 7 and 7-to-8 (no customer content), rewritten and then built; the reused-name case; a second run refused; every unsafe form listed.
- `check:screens`, `check:themes` and `check:demo` green, with the same screens as before the rename.

## Batches (pull requests into `feature/0.20.0-m3-names`)

1. **The version and the map.** Sets the version to 0.20.0 (`plans/2026-11-19-version-at-feature-start.md`), makes
   `scripts/m3-names.json` and `scripts/m3-names.ours.mjs`, and `check:m3-names -- --report` (never failing yet). The CTO reviews the
   map before batch 2.
2. **Tokens.** Every token renamed in the theme, the editor, the blocks, the demo and the starter; `renamed-tokens.json` extended.
3. **Components, parts, kinds and sizes.** Classes, `theme/ui/` names and props; the content class map from 0.20.0.
4. **The rewrite.** `lib/migrate-code.mjs` with its tests, in `morpheme migrate` and in the Worker's update.
5. **The update across contract 8.** The build installs the store items the target needs, or names the item it cannot (*Migration*, 3; owner, 24 Nov 2026). Tests with a fake higher contract; the contract numbers are batch 8's.
6. **Scoped app CSS** (its spec, batches 1 and 2).
7. **Icons** (*What is renamed*, 5). The editor's code moves onto `Icon` first, then the stored names are rewritten (with batch 4's
   rewrite), then Phosphor and Lucide leave the package.
8. **Contract 8.** `THEME_API`, `APP_API` and `APP_APIS` raised, `check:m3-names` failing, `docs/app-contract.md`,
   `docs/theme-token-files.md`, `docs/class-names.md`, and release notes for site owners (nothing to do; the update does it) and
   for theme and app developers (the map) (skill `release-notes`).

Batch 1 goes first; 2, 3 and 7 can run side by side; 4 follows 2 and 3, and takes 7's name rewrite; 5 and 6 can run beside 4; 8
goes last. Outside this repository:
the owner's apps get their contract 8 versions in `morpheme-apps` before 0.20.0 is offered to sites.

## Open decisions

1. **The update test.** 0.20.1's update test (from every supported version) would catch a failed rewrite. **Recommended: batch 4
   runs the update from the last 0.19 to 0.20.0 on a test site** with a theme and an app of its own and a store app; 0.20.1 makes it cover
   every version.

Decided: the update's build installs the store items the target needs, and names the item when none fits (*Migration*, 3; owner, 24 November 2026, replacing the 20 November decision that it never installs).

2. **The key for the build.** For 0.19.6 the key is the build variable `MORPHEME_STORE_KEY`; a site connected by the editor's button has its key only in its
   Worker's database, so its update fails until the variable is set (for Sara's site, by hand), with the message above. A key the build can read
   without that step needs a store-side change in `morpheme-appstore` (`/store/connect`): the PM takes it to the CTO for a later version.

## Done when

`check:m3-names` fails on any name that is not M3's, the editor's or on the ours list; the screens are the same as before; a site on
0.19 with its own theme and app and a store app updates to 0.20.0 in one step from the editor and builds, on staging; an update with a store
item still at contract 7 installs the version for contract 8 in its build (and the editor commits it on its first start), or, when the store has none, stops and names it; the owner's apps are released at contract 8; and 0.20.0 has run on staging
before the owner releases it.
