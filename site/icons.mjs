// The icon packs (the folders, packages/editor/site/iconPacks.mjs): which packs there are (installedPacks), each one's icons (packIcons) and
// what is wrong with one (packProblems). An icon is drawn by its Material Symbols name (`location_on`; `<name>-fill` is the filled one): the pack
// in use's file of that name, else Material Symbols' own (`@material-symbols/svg-400`, the whole set). So a pack lists only the icons it draws its
// own way; a theme's own icons (icons/<name>.svg) and a pack's are named the same way. The system's pack (SYSTEM_PACKS: Material Symbols, in
// packages/editor/icons/material-symbols/) holds its manifest, its licence and a few samples; Phosphor and Lucide left the package in 0.19.6 (owner,
// 22 Nov 2026), and Phosphor comes back as a pack in the store (specs/2026-11-14-icon-packs-in-the-store-design.md).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cleanSvg } from '@morphemecms/cms/lib/svg.mjs';
import { ICON_PACK_FILE, ICON_PACK_LICENSE, THEME_PACKS_FOLDER, themePackId } from './iconPacks.mjs';

// The site's root (the working directory) and this package's.
const root = pathToFileURL(`${process.cwd()}/`);
const pkg = new URL('../', import.meta.url);

/** Where the system's own packs are, one folder each (this package's icons/), from the site's root. */
export const SYSTEM_PACKS_FOLDER = relative(process.cwd(), fileURLToPath(new URL('icons', pkg)));

/** A pack's folder, from its id, from the site's root: a system pack's in this package, a theme's in its folder. */
export const packFolder = (id) => {
  const [theme, pack] = id.split('/');
  return pack ? `src/themes/${theme}/${THEME_PACKS_FOLDER}/${pack}` : `${SYSTEM_PACKS_FOLDER}/${theme}`;
};
const has = (path) => existsSync(new URL(path, root));

/** Whether a name is one an icon of a pack or of a theme can have: a Material Symbols name (lower case letters, digits and `_`), and `<name>-fill` for the filled one. */
export const isIconName = (name) => /^[a-z0-9_]+(-fill)?$/.test(name);

/** What is wrong with an icon's SVG file (`file` its path, for the message): one <svg> with a viewBox, with only what
 * draws in it (what cleanSvg keeps; the rest is left out where it is drawn). */
export function svgProblems(file, svg) {
  const clean = cleanSvg(svg);
  if (!clean || svg.match(/<svg\b/gi).length > 1 || !clean.viewBox)
    return [`${file}: an icon is one <svg> with a viewBox and nothing before or after it.`];
  if (clean.removed.length)
    return [
      `${file}: ${clean.removed.join(', ')} doesn't draw and isn't shown. An icon holds only drawing: no scripts, styles, event handlers (on…) or anything fetched from outside.`,
    ];
  return [];
}

const folders = (dir) =>
  has(dir)
    ? readdirSync(new URL(dir, root), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

/** The icon packs there are, by id: the system's (packages/editor/icons/<pack>/) and those the themes installed bring
 * (src/themes/<theme>/icon-packs/<pack>/, as `<theme>/<pack>`), each a folder with its pack.json. */
export function installedPacks() {
  const system = folders(`${SYSTEM_PACKS_FOLDER}/`).filter((p) => has(`${SYSTEM_PACKS_FOLDER}/${p}/${ICON_PACK_FILE}`));
  const themes = folders('src/themes/').flatMap((theme) =>
    folders(`src/themes/${theme}/${THEME_PACKS_FOLDER}/`)
      .filter((p) => has(`src/themes/${theme}/${THEME_PACKS_FOLDER}/${p}/${ICON_PACK_FILE}`))
      .map((p) => themePackId(theme, p)),
  );
  return [...system, ...themes];
}

/** A pack's icons as their files' text, by name (its <name>.svg). */
export function packIcons(id) {
  const dir = `${packFolder(id)}/`;
  const icons = {};
  if (has(dir))
    for (const f of readdirSync(new URL(dir, root)))
      if (f.endsWith('.svg')) icons[f.slice(0, -'.svg'.length)] = readFileSync(new URL(dir + f, root), 'utf8');
  return icons;
}

const isText = (x) => typeof x === 'string' && x.trim() !== '';

/** What is wrong with an icon pack (`id`, as installedPacks gives it): its manifest (pack.json: name, author, license;
 * and for each set it takes icons from besides its own, `includes`, its name, author, license, licence file and icons),
 * its licences (LICENSE, and each `includes`' licenseFile), a file that is not an icon by a Material Symbols name, and each
 * icon's SVG (svgProblems). A pack need not have every icon: Material Symbols' own draws the others. */
export function packProblems(id) {
  const dir = packFolder(id);
  const problems = [];
  let manifest = {};
  try {
    manifest = JSON.parse(readFileSync(new URL(`${dir}/${ICON_PACK_FILE}`, root), 'utf8'));
  } catch (e) {
    return [`${dir}/${ICON_PACK_FILE}: ${e.message}`];
  }
  for (const key of ['name', 'author', 'license'])
    if (!isText(manifest[key]))
      problems.push(`${dir}/${ICON_PACK_FILE}: "${key}" is missing (the icon pack's name, who made it, and its license).`);
  if (!has(`${dir}/${ICON_PACK_LICENSE}`)) problems.push(`${dir}/${ICON_PACK_LICENSE} is missing: the icon pack's license.`);
  const licences = new Set([ICON_PACK_LICENSE]);
  if (manifest.includes !== undefined && !Array.isArray(manifest.includes))
    problems.push(`${dir}/${ICON_PACK_FILE}: "includes" is a list of the sets the pack has icons from besides its own.`);
  for (const x of Array.isArray(manifest.includes) ? manifest.includes : []) {
    const named = isText(x?.name) ? x.name : '?';
    if (!['name', 'author', 'license', 'licenseFile'].every((k) => isText(x?.[k])) || !Array.isArray(x.icons) || !x.icons.every(isText))
      problems.push(`${dir}/${ICON_PACK_FILE}: "includes" (${named}) must have "name", "author", "license", "licenseFile" and "icons".`);
    else if (!/^LICENSE-[a-z0-9-]+$/.test(x.licenseFile) || !has(`${dir}/${x.licenseFile}`))
      problems.push(
        `${dir}/${x.licenseFile ?? ICON_PACK_LICENSE}: the license for ${named} is missing (LICENSE-<set> in the pack's folder).`,
      );
    else licences.add(x.licenseFile);
    for (const name of Array.isArray(x?.icons) ? x.icons : [])
      if (!has(`${dir}/${name}.svg`))
        problems.push(`${dir}/${ICON_PACK_FILE}: "includes" (${named}) names ${name}, which the pack does not have.`);
  }
  const files = has(dir) ? readdirSync(new URL(`${dir}/`, root), { withFileTypes: true }) : [];
  for (const entry of files) {
    const file = `${dir}/${entry.name}`;
    if (entry.name === ICON_PACK_FILE || licences.has(entry.name)) continue;
    if (!entry.isFile() || !entry.name.endsWith('.svg')) {
      problems.push(`${file}: an icon pack has only ${ICON_PACK_FILE}, its licenses and icons (${dir}/<name>.svg).`);
      continue;
    }
    const name = entry.name.slice(0, -'.svg'.length);
    if (!isIconName(name))
      problems.push(
        `${file}: the site draws no icon named "${name}". An icon is named as in Material Symbols (e.g. location_on, play_arrow-fill).`,
      );
    problems.push(...svgProblems(file, readFileSync(new URL(file, root), 'utf8')));
  }
  return problems;
}
