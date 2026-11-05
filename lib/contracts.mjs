/**
 * Store contract versions: the API levels for apps and themes.
 * Exposes APP_API and THEME_API.
 */

/** The version of the contract between the editor and an app (apps.ts: defineApp, its folder, and the theme's parts it
 * draws with: the standard blocks' and the UI components, @theme/blocks/… and @theme/ui/…, imported from
 * @morphemecms/cms): an app in the store says which it is written to, and only those the editor can run are
 * offered. Raised when an app written to the one before no longer works. */
export const APP_API = 2;

/** The version of the contract between the editor and a theme (what a theme must and may have, "Hvad et tema må" in
 * CLAUDE.md, themeProblems in packages/editor/site/theme.mjs, the standard theme's UI parts with Material 3's names and
 * variants, the motion scheme's --motion-* springs and motionSpring/motionTiming (@morphemecms/cms/lib/motion),
 * and the classes it styles): only themes written to it are offered. Raised when a theme written to the one before no
 * longer works. Material 3's breakpoints (--breakpoint-*: medium:, expanded:, large:, extra-large:) instead of Tailwind's.
 * The FAB menu's script with its setUpFabMenu export, and FabMenu with an icon as an element (the editor's start screen). */
export const THEME_API = 4;
