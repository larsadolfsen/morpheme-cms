/**
 * Store contract versions: the API levels for apps and themes.
 * Exposes APP_API and THEME_API.
 */

/** The version of the contract between the editor and an app (apps.ts: defineApp, its folder, and the theme's parts it
 * draws with: the standard blocks' and the UI components, @theme/blocks/… and @theme/ui/…, imported from
 * @morphemecms/cms): an app in the store says which it is written to, and only those the editor can run are
 * offered. Raised when an app written to the one before no longer works. 3 adds `import self from '@app/self'` (the id
 * of the app's own folder, site/appSelf.mjs); an app written to 2 works as before. 4 adds app.json (an app describes itself
 * as data), sandboxed hooks (hooks/<place>.ts) and after-build.ts, run in QuickJS; apps written to 2 or 3 run as before. 5 adds the optional app.json keys `role` (connector or plugin) and `mcp` (a connector's
 * MCP server); the editor reads contracts 4 and 5 (APP_APIS). */
export const APP_API = 5;

/** The contracts of apps the editor still reads, oldest first (docs/app-contract.md, "How long contract 4 stays accepted"). */
export const APP_APIS = Object.freeze([4, 5]);

/** The version of the contract between the editor and a theme (what a theme must and may have, "What a theme may" in
 * CLAUDE.md, themeProblems in packages/editor/site/theme.mjs, the standard theme's UI parts with Material 3's names and
 * variants, the motion scheme's --motion-* springs and motionSpring/motionTiming (@morphemecms/cms/lib/motion),
 * and the classes it styles): only themes written to it are offered. Raised when a theme written to the one before no
 * longer works. Material 3's breakpoints (--breakpoint-*: medium:, expanded:, large:, extra-large:) instead of Tailwind's.
 * The FAB menu's script with its setUpFabMenu export, and FabMenu with an icon as an element (the editor's start screen). */
export const THEME_API = 4;
