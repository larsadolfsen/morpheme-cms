/**
 * Store contract versions: the API levels for apps, themes and icon packs.
 * Exposes APP_API, THEME_API, ICON_PACK_API and ICON_PACK_APIS.
 */

/** The version of the contract between the editor and an app (apps.ts: defineApp, its folder, and the theme's parts it
 * draws with: the standard blocks' and the UI components, @theme/blocks/… and @theme/ui/…, imported from
 * @morphemecms/cms): an app in the store says which it is written to, and only those the editor can run are
 * offered. Raised when an app written to the one before no longer works. 3 adds `import self from '@app/self'` (the id
 * of the app's own folder, site/appSelf.mjs); an app written to 2 works as before. 4 adds app.json (an app describes itself
 * as data), sandboxed hooks (hooks/<place>.ts) and after-build.ts, run in QuickJS; apps written to 2 or 3 run as before. 5 adds the optional app.json keys `role` (connector or plugin) and `mcp` (a connector's
 * MCP server). 6 renames the design tokens to Material 3's pattern (`--mo-ref-*`, `--mo-sys-*`, `--mo-comp-<component>-*`, docs/theme-token-files.md)
 * with no alias, so an app written to 4 or 5 that reads or sets an old token name draws without it; contract 6 read only 6 (APP_APIS), and an app written
 * to 4 or 5 is not offered by the store to an editor at 6 until it is released again. 7 ends Tailwind: a theme or an app written to 6 that uses a utility class, `theme()`, `@theme` or `@apply` does not work (themes and apps use the `mo-` layout classes and literal breakpoints, docs/tailwind-migration.md), and the store offers only contract 7. 8 gives an app's CSS its own scope (`data-mo-app`, docs/app-contract.md, "Contract 8: scoped CSS"), lets an app's promotion kind draw inside it and open as the bottom sheet, and renames the theme's classes, tokens and parts to Material 3's names (docs/class-names.md, docs/theme-token-files.md, scripts/m3-names.json) with no alias; a theme or app imports from `@morphemecms/cms` only the modules of lib/public-imports.mjs (0.21.1's pre-built editor reads that list). An app written to 7 does not work at 8 until its author publishes a new version, and the store offers only contract 8. */
export const APP_API = 8;

/** The contracts of apps the editor reads, oldest first: 8 only since the scoped CSS, Material 3's names and the public imports (docs/app-contract.md, "Contract 8"). */
export const APP_APIS = Object.freeze([8]);

/** The version of the contract between the editor and a theme (what a theme must and may have, "What a theme may" in
 * CLAUDE.md, themeProblems in packages/editor/site/theme.mjs, the standard theme's UI parts with Material 3's names and
 * variants, the motion scheme's --mo-sys-motion-spring-* springs and motionSpring/motionTiming (@morphemecms/cms/lib/motion),
 * and the classes it styles): only themes written to it are offered. Raised when a theme written to the one before no
 * longer works. Material 3's breakpoints (`--mo-ref-breakpoint-*`: medium, expanded, large, extra-large) instead of Tailwind's.
 * The FAB menu's script with its setUpFabMenu export, and FabMenu with an icon as an element (the editor's start screen).
 * 5 removes the dialog's full-screen kind (owner, 14 Nov 2026: no full-screen views, a full screen is a page with a back arrow): `kind` and
 * `closeLabel` of `@theme/ui/Dialog`, `dialogFullScreenModalClass`, the classes `dialog-full-screen`, `dialog-modal-full-screen`,
 * `dialog-header` and `dialog-header-actions`, and the tokens `--dialog-full-screen-max-width` and `--dialog-full-screen-headline-size`;
 * `dialogClassOf` takes only `parts`. A theme or an app written to 4 that uses them does not work. 6 renames the design tokens to Material 3's pattern
 * (`--mo-ref-*`, `--mo-sys-*`, `--mo-comp-<component>-*`, docs/theme-token-files.md) with no alias: a theme or an app written to 5 that sets or reads an old name
 * (for example the colour roles are now `--mo-sys-color-*`) does not work, and the store offers a theme only at the contract the editor has. 7 ends Tailwind: a theme written to 6 that uses a utility class, `theme()`, `@theme` or `@apply` does not work (docs/app-contract.md, "Contract 7"). 8 names the classes, tokens and parts the way Material 3 does (docs/class-names.md, docs/theme-token-files.md, scripts/m3-names.json) with no alias, scopes an app's CSS, and lets a theme import from `@morphemecms/cms` only the modules of lib/public-imports.mjs: a theme written to 7 does not work at 8, and the store offers only contract 8. */
export const THEME_API = 8;

/** The version of the contract between the editor and an icon pack from the store (docs/icon-pack-contract.md): a pack is SVG files and
 * text, with no code (`pack.json`, `LICENSE*` and one `<material name>.svg` for each icon it draws its own way; an icon it lacks is drawn
 * in Material Symbols). A pack in the store says which it is written to in its `pack.json` `api`, and only those the editor can read are
 * offered. Raised when a pack written to the one before no longer works (a changed name rule or file rule). */
export const ICON_PACK_API = 1;

/** The contracts of icon packs the editor reads, oldest first. */
export const ICON_PACK_APIS = Object.freeze([1]);
