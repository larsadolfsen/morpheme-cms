// What the screens check expects of the icons, by the icon pack in use (the site's, as the editor resolves it: iconPack() in
// site/theme.mjs, which reads src/data/icons.json, else the theme's "icons" in its theme.json, else Material Symbols). Pure
// functions, so a test runs them on both packs without a browser. Owner rule (CLAUDE.md): Material Symbols is the pack until a
// site, or a theme it installed, chooses another.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const MATERIAL = 'material-symbols';
export const PHOSPHOR = 'phosphor';

/** The pack's name in a message: Material Symbols, Phosphor, else its id. */
export const packName = (id) => (id === MATERIAL ? 'Material Symbols' : id === PHOSPHOR ? 'Phosphor' : id);

/** Phosphor's files are drawn in a 256 box; Material Symbols' in 0 -960 960 960. */
const PHOSPHOR_BOX = /viewBox="0 0 256 256"/;
const MATERIAL_BOX = /viewBox="0 -960 960 960"/;

/** The problems of one svg element of a built page (its tag and the start of its first path) under the pack in use.
 * `allowed(d)`: whether a 256-box glyph is one of the allowed own glyphs (PHOSPHOR_OK in context.mjs). Phosphor's glyphs are a
 * finding unless Phosphor is the pack (the check is as strict as before for every other pack); while Phosphor is the pack,
 * a Material Symbols glyph that is not marked as the fallback (data-icon-fallback) is the finding. */
export function glyphProblems(pack, where, tag, d, allowed = () => false) {
  if (pack !== PHOSPHOR && PHOSPHOR_BOX.test(tag) && !allowed(d))
    return [
      `${where}: an icon is drawn as a Phosphor glyph (path "${d.slice(0, 24)}…") while ${packName(pack)} is the icon pack in use: route it through the pack (Icon, or the pack's file) or allow it in PHOSPHOR_OK with a reason`,
    ];
  if (pack === PHOSPHOR && MATERIAL_BOX.test(tag) && !tag.includes('data-icon-fallback'))
    return [
      `${where}: an icon is drawn as a Material Symbols glyph (path "${d.slice(0, 24)}…") while Phosphor is the icon pack in use: route it through the pack (Icon, or the pack's file)`,
    ];
  return [];
}

/** The problem with a search for "acorn" (Phosphor has the icon, Material Symbols has none of that name), from whether the
 * picker had a tile of that name; none when it is as the pack in use needs. Only Phosphor's own pack finds it. */
export function acornProblem(pack, label, found) {
  if (pack === PHOSPHOR) return found ? null : `${label}: the search "acorn" found no acorn, but Phosphor is the icon pack in use`;
  return found ? `${label}: the search "acorn" found Phosphor's acorn, but ${packName(pack)} is the icon pack in use` : null;
}

/** The path of the pack's `devices` icon (the Preview icon), from its file in the pack's folder; undefined without one.
 * `folder`: the pack's folder from the site's root (packFolder in site/icons.mjs, a system pack's included). */
export function previewReference(folder, root) {
  try {
    return readFileSync(join(root, folder, 'devices.svg'), 'utf8').match(/<path d="([^"]+)"/)?.[1];
  } catch {
    return undefined;
  }
}
