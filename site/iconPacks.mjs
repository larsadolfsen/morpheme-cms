// The site's icon packs, and which one it draws its icons with, without reading a file: for the site's build
// (packages/editor/site/icons.mjs, packages/editor/site/theme.mjs) and the editor (packages/editor/src/iconPacks.ts) alike.
//
// An icon pack is a folder: its manifest (pack.json: name, author, licence; ICON_PACK_FILE), its licence (LICENSE, and
// one more for each set it takes icons from besides its own, `includes`) and an SVG file for every icon the site and the
// editor draw, by the name they draw it by, Material Symbols' (`location_on.svg`, `play_arrow-fill.svg`; an icon a pack has none of is
// Material Symbols' own). The system's own is packages/editor/icons/material-symbols/ (its manifest, licence and a few samples); a theme
// may bring its own in its folder, src/themes/<theme>/icon-packs/<pack>/, which come and go with the theme (the
// Appstore installs, updates and uninstalls them with it, as its other files).
//
// Which one is used: the one chosen under "Settings" › "Appearance" › "Icon packs" (src/data/icons.json,
// `{ "pack": "<id>" }`), else the theme in use's ("icons" in its theme.json: a system pack, or one of its own by its
// folder), else the standard theme's (Material Symbols).

/** Where a theme's own packs are in its folder, one folder each. */
export const THEME_PACKS_FOLDER = 'icon-packs';

/** Where a pack installed from the store is in a site, one folder each, named by its store id (`icons_<16 hex>`; docs/icon-pack-contract.md). */
export const STORE_PACKS_FOLDER = 'src/icon-packs';

/** A pack's manifest, in its folder. */
export const ICON_PACK_FILE = 'pack.json';

/** A pack's licence, in its folder. */
export const ICON_PACK_LICENSE = 'LICENSE';

/** The system's own packs, by their folders in this package's icons/: the ids a theme's "icons" and src/data/icons.json name them by. */
export const SYSTEM_PACKS = ['material-symbols'];

/** The system packs of 0.19.5 and before that left the package in 0.19.6 (Phosphor and Lucide; owner, 22 Nov 2026): a site that chose one, or a theme whose
 * `icons` names one, draws Material Symbols, with no warning. Phosphor comes back as a pack in the store. */
export const RETIRED_PACKS = ['phosphor', 'lucide'];

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
  const id =
    typeof chosen === 'string' && chosen
      ? chosen
      : (() => {
          const name = icons ?? standardIcons;
          return themePack(theme, name, installed.includes(themePackId(theme, name)));
        })();
  return RETIRED_PACKS.includes(id) ? 'material-symbols' : id;
}
