// What the screens check expects of the icons, by the icon pack in use (the site's, as the editor resolves it: iconPack() in
// site/theme.mjs, which reads src/data/icons.json, else the theme's "icons" in its theme.json, else Material Symbols). Pure
// functions, so a test runs them on both packs without a browser. Owner rule (CLAUDE.md): Material Symbols is the pack until a
// site, or a theme it installed, chooses another. Phosphor and Lucide are not packs any more (a site that chose one draws Material Symbols).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const MATERIAL = 'material-symbols';

/** The pack's name in a message: Material Symbols, else its id. */
export const packName = (id) => (id === MATERIAL ? 'Material Symbols' : id);

/** Phosphor's files were drawn in a 256 box (they are not in the package any more, 0.19.6); Material Symbols' are in 0 -960 960 960. */
const PHOSPHOR_BOX = /viewBox="0 0 256 256"/;

/** The problems of one svg element of a built page (its tag and the start of its first path) under the pack in use.
 * `allowed(d)`: whether a 256-box glyph is one of the allowed own glyphs (PHOSPHOR_OK in context.mjs). Any other 256-box glyph is
 * a finding: Phosphor and Lucide have left the package, so no pack draws one. */
export function glyphProblems(pack, where, tag, d, allowed = () => false) {
  if (PHOSPHOR_BOX.test(tag) && !allowed(d))
    return [
      `${where}: an icon is drawn as a Phosphor glyph (path "${d.slice(0, 24)}…") while ${packName(pack)} is the icon pack in use: route it through the pack (Icon, or the pack's file) or allow it in scripts/screens/support/context.mjs (PHOSPHOR_OK) with the reason`,
    ];
  return [];
}

/** The problem with a search for "acorn" (Phosphor had the icon, Material Symbols has none of that name), from whether the
 * picker had a tile of that name: none while it has not. */
export function acornProblem(pack, label, found) {
  return found ? `${label}: the search "acorn" found Phosphor's acorn, but ${packName(pack)} is the icon pack in use` : null;
}

/** The path of the pack in use's `devices` icon (the Preview icon): its file in the pack's folder, else Material Symbols' own; undefined without one.
 * `folder`: the pack's folder from the site's root (packFolder in site/icons.mjs, a system pack's included). */
export function previewReference(folder, root) {
  for (const file of [join(root, folder, 'devices.svg'), join(root, 'node_modules/@material-symbols/svg-400/outlined/devices.svg')]) {
    try {
      const d = readFileSync(file, 'utf8').match(/<path d="([^"]+)"/)?.[1];
      if (d) return d;
    } catch {}
  }
  return undefined;
}
