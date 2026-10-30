// The site's icon packs, and which one it draws its icons with, without reading a file: for the site's build
// (packages/editor/site/icons.mjs, packages/editor/site/theme.mjs) and the editor (src/site/icons.ts) alike.
//
// An icon pack is a folder: its manifest (pack.json: name, author, licence; ICON_PACK_FILE), its licence (LICENSE, and
// one more for each set it takes icons from besides its own, `includes`) and an SVG file for every icon the site and the
// editor draw, by the name they draw it by, Phosphor's (usedIcons in packages/editor/site/icons.mjs: `map-pin.svg`, `play-fill.svg`).
// The system's own are in packages/editor/icons/<pack>/ (Material Symbols, Phosphor and Lucide, written by `npm run icons`); a theme
// may bring its own in its folder, src/themes/<theme>/icon-packs/<pack>/, which come and go with the theme (the
// Appstore installs, updates and uninstalls them with it, as its other files).
//
// Which one is used: the one chosen under "Indstillinger" › "Udseende" › "Ikonpakker" (src/data/icons.json,
// `{ "pack": "<id>" }`), else the theme in use's ("icons" in its theme.json: a system pack, or one of its own by its
// folder), else the standard theme's (Material Symbols).

/** Where a theme's own packs are in its folder, one folder each. */
export const THEME_PACKS_FOLDER = 'icon-packs';

/** A pack's manifest, in its folder. */
export const ICON_PACK_FILE = 'pack.json';

/** A pack's licence, in its folder. */
export const ICON_PACK_LICENSE = 'LICENSE';

/** The system's own packs, by their folders in this package's icons/: the ids a theme's "icons" and src/data/icons.json name them by. */
export const SYSTEM_PACKS = ['material-symbols', 'phosphor', 'lucide'];

/** A pack's id: a system pack's folder, a theme's `<theme>/<its folder>`. */
export const themePackId = (theme, pack) => `${theme}/${pack}`;

/** The theme a pack came with, from its id; undefined for the system's own. */
export const packTheme = (id) => (id.includes('/') ? id.split('/')[0] : undefined);

/** A theme's own pack ("icons" in its theme.json: one of its own by its folder, else a system pack) as an id. `own`:
 * whether the theme has a pack of its own by that name. */
export const themePack = (theme, name, own) => (own ? themePackId(theme, name) : name);

/** The pack the site draws its icons with: the one chosen (src/data/icons.json's `pack`), else the theme's ("icons" in
 * its theme.json), else the standard theme's. `installed`: the ids of the packs there are. */
export function packInUse({ chosen, theme, icons, standardIcons, installed }) {
  if (typeof chosen === 'string' && chosen) return chosen;
  const name = icons ?? standardIcons;
  return themePack(theme, name, installed.includes(themePackId(theme, name)));
}
