// The site's theme: how it looks (src/themes/<theme>/, with its theme.json). Which one is in use is data,
// src/data/theme.json (`{ "theme": "<folder>" }`), changed with the swap button on "Tema" in the editor.
// Every theme builds on the standard theme (packages/editor/theme/): what a theme does not have itself, a file of the
// theme or the look of a block, is the standard theme's, styled by the theme in use's CSS. The site and the editor
// reach the theme as @theme (themePlugin: the theme in use's file, else the standard theme's), and the site's own
// parts (src/site/) as @site (aliases): for packages/editor/astro.mjs and packages/editor/scripts/check-content.mjs. Stops with what is
// wrong, when the theme named is not installed or a folder in src/themes/ is a malformed store id (a store id is theme_ + 16 hex characters). Also the virtual module with the theme's and the icon pack's icons (themeIconsModule) and with the theme's coverage of Material's parts
// (coverageModule, site/themeCoverageFiles.mjs) and with what the site's files tell the site settings (detectFacts).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { svgParts } from '@morphemecms/cms/lib/svg.mjs';
import { declarationProblems, ownerId } from '@morphemecms/cms/lib/licenses.mjs';
import { installedPacks, isIconName, packFolder, packProblems, svgProblems } from './icons.mjs';
import { MATERIAL_ALL, MATERIAL_SSR, materialModule, materialSsrModule } from './materialSymbols.mjs';
import {
  ICON_PACK_FILE,
  ICON_PACK_LICENSE,
  RETIRED_PACKS,
  SYSTEM_PACKS,
  isStorePack,
  THEME_PACKS_FOLDER,
  packInUse,
  packTheme,
  themePackId,
} from './iconPacks.mjs';
import { STATEMENT_FILE, statementProblems } from '@morphemecms/cms/lib/accessibility.mjs';
import { MOTION_SCHEMES } from '@morphemecms/cms/lib/motion-schemes.mjs';
import { templateProblems } from '@morphemecms/cms/lib/page-template.mjs';
import { strayStoreId } from '@morphemecms/cms/lib/storeEntries.mjs';
import { storeImportProblems } from './storeTheme.mjs';
import { coverageModule } from './themeCoverageFiles.mjs';
import { detectFacts } from '@morphemecms/cms/lib/siteFacts.mjs';
import { reduceFacts } from '@morphemecms/cms/lib/siteSettings.mjs';

/** The site's choice of icon pack, `{ "pack": "<id>" }` (config.icons in src/site/config.ts). */
const ICONS_FILE = 'src/data/icons.json';

// The site's root (the working directory) and this package's.
const root = pathToFileURL(`${process.cwd()}/`);
const pkg = new URL('../', import.meta.url);

/** The theme every theme builds on, Material (this package's theme/, id 'saturn'): it has all of THEME_FILES and the look of every
 * standard block. */
export const STANDARD_THEME = 'saturn';

/** A theme's folder, from the site's root: the standard theme's is this package's theme/, another's src/themes/<theme>. */
export const themeFolder = (theme) =>
  theme === STANDARD_THEME ? relative(process.cwd(), fileURLToPath(new URL('theme', pkg))) : `src/themes/${theme}`;

// What the standard theme has, as its folder in src/themes/: what the site's pages (packages/editor/pages/) and the editor
// (src/site/) take from it as @theme. Besides these, the look of its blocks (blocks/<type>/) and what they import.
// Another theme needs only theme.json and styles/global.css (OWN_FILES); the rest it may have, else it is the
// standard theme's. A theme may replace each part of the post page (components/Post*, ShareRow, RelatedPosts) by a file
// of the same name.
export const THEME_FILES = [
  'theme.json',
  'styles/global.css',
  'layouts/PageLayout.astro',
  'layouts/PostLayout.astro',
  ...['PostHeader.astro', 'PostAuthor.astro', 'PostMeta.tsx', 'ShareRow.astro', 'PostCard.tsx', 'RelatedPosts.astro'].map(
    (f) => `components/${f}`,
  ),
  ...['Home', 'Blog', 'Category', 'New', 'NotFound'].map((t) => `templates/${t}.astro`),
  'editor/previews.tsx',
  'editor/looks.mjs',
];

/** The themes installed: the standard theme and the folders in src/themes/ with a theme.json. Stops on a folder that
 * starts with `app_` or `theme_` but is not a store id of a theme. */
export const installedThemes = () => {
  const names = (existsSync(new URL('src/themes/', root)) ? readdirSync(new URL('src/themes/', root), { withFileTypes: true }) : [])
    .filter((e) => e.isDirectory() && existsSync(new URL(`src/themes/${e.name}/theme.json`, root)))
    .map((e) => e.name);
  const stray = names.find((name) => strayStoreId(name, 'theme'));
  if (stray)
    throw new Error(
      `src/themes/${stray}: the folder name looks like a store id but is not one. A store theme id is theme_ and 16 lowercase hex characters; rename the folder.`,
    );
  return [STANDARD_THEME, ...names];
};

/** What every theme has itself. */
export const OWN_FILES = ['theme.json', 'styles/global.css'];

// A block's contract (its type, fields, rules, shared texts, list and what it shows), which is the editor's or an
// app's, never a theme's: a theme has only the look of the standard blocks (blocks/<type>/: View.tsx, components).
const CONTRACT_FILES = ['index.tsx', 'shared.ts', 'texts.ts', 'list.ts', 'fields.ts', 'view.ts', 'load.ts'];

// How a block looked before it was drawn from its view, once on the site and once in the editor: now View.tsx.
const OLD_LOOK = ['Site.astro', 'draw.tsx'];

// The standard theme's own global.css imports ./base.css.
const STANDARD_IMPORT = /@import\s+['"]\.\/base\.css['"]/;
// Every other theme imports the standard theme's global.css, so Material is its fallback.
const FALLBACK_IMPORT = /@import\s+['"]@morphemecms\/cms\/theme\/styles\/global\.css['"]/;

/** What is wrong with a theme's styles/global.css import (`css` is the file's text): null when it is right. */
export function importProblem(theme, css) {
  if (theme === STANDARD_THEME)
    return STANDARD_IMPORT.test(css) ? null : `${themeFolder(theme)}/styles/global.css: doesn't import ./base.css.`;
  return FALLBACK_IMPORT.test(css)
    ? null
    : `${themeFolder(theme)}/styles/global.css: doesn't import the standard theme, which is the theme's fallback: put @import '@morphemecms/cms/theme/styles/global.css' at the top.`;
}

const folders = (url) =>
  existsSync(url)
    ? readdirSync(url, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];
const has = (path) => existsSync(new URL(path, root));

/** The standard blocks' types: their contracts' folders in the editor (packages/editor/src/standard/<type>/). */
const standardTypes = () => folders(new URL('src/standard/', pkg)).filter((t) => existsSync(new URL(`src/standard/${t}/index.tsx`, pkg)));

/** What is wrong with a theme's own icons (icons/<name>.svg, drawn by Svg in packages/editor/src/icon.tsx, in place of
 * its icon pack's): each is one <svg> with a viewBox, with only what draws in it (svgProblems), by a name the site
 * draws. */
function iconProblems(theme) {
  const dir = `${themeFolder(theme)}/icons`;
  if (!has(dir)) return [];
  const problems = [];
  for (const entry of readdirSync(new URL(dir, root), { withFileTypes: true })) {
    const file = `${dir}/${entry.name}`;
    const name = entry.name.replace(/\.svg$/, '');
    if (!entry.isFile() || !entry.name.endsWith('.svg')) {
      problems.push(`${file}: a theme's icon is an SVG file, ${dir}/<name>.svg.`);
      continue;
    }
    if (!isIconName(name))
      problems.push(
        `${file}: the site draws no icon named "${name}". An icon is named as in Material Symbols (e.g. location_on, play_arrow-fill).`,
      );
    problems.push(...svgProblems(file, readFileSync(new URL(file, root), 'utf8')));
  }
  return problems;
}

const manifestOf = (theme) => JSON.parse(readFileSync(new URL(`${themeFolder(theme)}/theme.json`, root), 'utf8'));

/** The icon packs a theme brings (src/themes/<theme>/icon-packs/<pack>/, with its pack.json), by their folders. */
const ownPacks = (theme) =>
  folders(new URL(`${themeFolder(theme)}/${THEME_PACKS_FOLDER}/`, root)).filter((p) =>
    has(`${themeFolder(theme)}/${THEME_PACKS_FOLDER}/${p}/${ICON_PACK_FILE}`),
  );

/** The choice of icon pack made under "Settings" › "Appearance" › "Icon packs" (src/data/icons.json, `{ "pack": "<id>"
 * }`), or undefined while none is made (then the theme's is used). */
export function chosenPack() {
  const file = new URL(ICONS_FILE, root);
  if (!existsSync(file)) return undefined;
  const { pack } = JSON.parse(readFileSync(file, 'utf8'));
  return pack ?? undefined;
}

/** The icon pack the site and the editor draw their icons with, by its id (packInUse in packages/editor/site/iconPacks.mjs): the one
 * chosen, else the theme's ("icons" in its theme.json), else the standard theme's (Material Symbols). Stops with what is
 * wrong when it is not installed. */
export function iconPack(theme = activeTheme()) {
  const installed = installedPacks();
  const chosen = chosenPack();
  const id = packInUse({ chosen, theme, icons: manifestOf(theme).icons, standardIcons: manifestOf(STANDARD_THEME).icons, installed });
  if (!installed.includes(id))
    throw new Error(
      chosen === id
        ? `${ICONS_FILE}: the icon pack ${JSON.stringify(id)} isn't installed (${packFolder(id)}/${ICON_PACK_FILE}).`
        : `${themeFolder(theme)}/theme.json: "icons" is the icon pack ${JSON.stringify(id)}, which isn't installed.`,
    );
  return id;
}

/** The icon packs there are with their licences, from their manifests, for "Licenses" under "Settings" (IconPack
 * in @morphemecms/cms/lib/licenses.mjs, licensesIntegration in packages/editor/astro.mjs): each pack's id, name, version, who made it,
 * its licence's name and file (LICENSE in its folder), the theme it came with, whether the site draws with it, and each
 * set it takes icons from besides its own (`includes`, with its `licenseFile`). packProblems checks the manifests. */
export function iconPackLicenses() {
  const inUse = iconPack();
  return installedPacks().map((id) => {
    const dir = packFolder(id);
    const manifest = JSON.parse(readFileSync(new URL(`${dir}/${ICON_PACK_FILE}`, root), 'utf8'));
    const set = (x, file) => ({ name: x.name, version: x.version ?? null, author: x.author, license: x.license, file: `${dir}/${file}` });
    return {
      id,
      ...set(manifest, ICON_PACK_LICENSE),
      ...(packTheme(id) ? { theme: packTheme(id) } : {}),
      inUse: id === inUse,
      includes: (manifest.includes ?? []).map((x) => set(x, x.licenseFile)),
    };
  });
}

/** The folders a theme's icons come from, first the one that wins: its own icons/, then the standard theme's (it has
 * none), then the icon pack in use's (iconPack); the system's pack has no files of its own to draw: Material Symbols' set is drawn
 * for every name a theme and a pack have none of. */
const iconFolders = (theme) => {
  const pack = iconPack(theme);
  return [...new Set([theme, STANDARD_THEME])]
    .map((t) => `${themeFolder(t)}/icons/`)
    .concat(SYSTEM_PACKS.includes(pack) ? [] : `${packFolder(pack)}/`);
};

/** The theme in use's icons as their files' text, by Material Symbols name (`<name>`, `<name>-fill`): its own (icons/<name>.svg), else its icon pack's
 * (iconPack). The others are Material Symbols' own. */
function themeIcons() {
  const icons = {};
  for (const dir of iconFolders(activeTheme()).reverse())
    if (has(dir))
      for (const f of readdirSync(new URL(dir, root)))
        if (f.endsWith('.svg')) icons[f.slice(0, -'.svg'.length)] = readFileSync(new URL(dir + f, root), 'utf8');
  return icons;
}

/** An icon of a theme (the one in use, if none is given) as its file's text: its own (icons/<name>.svg), else its icon
 * pack's; null when neither has it (then it is Material Symbols'). For what is drawn outside Vite: the
 * play button of a video in the text (rehypeVideo, packages/editor/astro.mjs). In Vite, themePlugin's virtual module holds them. */
export function themeIcon(name, theme = activeTheme()) {
  for (const dir of iconFolders(theme)) if (has(`${dir}${name}.svg`)) return readFileSync(new URL(`${dir}${name}.svg`, root), 'utf8');
  return null;
}

/** The site's choice of motion scheme, `{ "scheme": "<scheme>" }` (config.motion in src/site/config.ts). */
const MOTION_FILE = 'src/data/motion.json';

/** What is wrong with the choice of motion scheme made under "Appearance" › "Motion" (src/data/motion.json): one that
 * is not a scheme (lib/motion.ts). */
export function motionProblems() {
  const file = new URL(MOTION_FILE, root);
  if (!existsSync(file)) return [];
  try {
    const { scheme } = JSON.parse(readFileSync(file, 'utf8'));
    if (MOTION_SCHEMES.includes(scheme)) return [];
    return [`${MOTION_FILE}: the motion scheme ${JSON.stringify(scheme ?? null)} doesn't exist. Choose one under Appearance › Motion.`];
  } catch (e) {
    return [`${MOTION_FILE}: ${e.message}`];
  }
}

/** What is wrong with the system's icon packs and those installed from the store (packProblems, which does not ask a pack to have every
 * icon; a theme's own are its themeProblems) and the choice of one: src/data/icons.json naming one that is not there. A choice of Phosphor or
 * Lucide (RETIRED_PACKS) or of a store pack that is not installed is no problem: the site draws Material Symbols. */
export function iconPackProblems() {
  const installed = installedPacks();
  const problems = installed.filter((id) => SYSTEM_PACKS.includes(id) || isStorePack(id)).flatMap((id) => packProblems(id));
  for (const id of SYSTEM_PACKS) if (!installed.includes(id)) problems.push(`${packFolder(id)}/${ICON_PACK_FILE} is missing.`);
  try {
    const chosen = chosenPack();
    if (
      chosen !== undefined &&
      (typeof chosen !== 'string' || !(installed.includes(chosen) || RETIRED_PACKS.includes(chosen) || isStorePack(chosen)))
    )
      problems.push(
        `${ICONS_FILE}: the icon pack ${JSON.stringify(chosen)} isn't installed. Choose another under Appearance › Icon packs.`,
      );
  } catch (e) {
    problems.push(`${ICONS_FILE}: ${e.message}`);
  }
  return problems;
}

const MATERIAL_ALL_ID = `\0${MATERIAL_ALL}`;
const MATERIAL_SSR_ID = `\0${MATERIAL_SSR}`;

/** The virtual module with the theme's and the icon pack in use's icons, by Material Symbols name, as text (src/icon.tsx; themeIconsModule). */
export const THEME_ICONS = 'virtual:theme-icons';
/** The virtual module with the theme's coverage of Material's parts (coverageModule). */
export const THEME_COVERAGE = 'virtual:theme-coverage';
/** The virtual module with what the site's files tell the site settings (detectFacts, lib/siteFacts.mjs, reduced to what the settings read: reduceFacts; site/settings.ts). */
export const SITE_FACTS = 'virtual:site-facts';

/** The module code of the theme's icons (`icons`, as themeIcons returns them): each one's `<svg>` text, in the text's colour (`fill="currentColor"`),
 * by its name. Only those that draw (svgParts). @param {Record<string, string>} icons */
export function themeIconsModule(icons) {
  const all = {};
  for (const name of Object.keys(icons).sort()) {
    const parts = svgParts(icons[name]);
    if (!parts) continue;
    const box = parts.viewBox ? ` viewBox="${parts.viewBox}"` : '';
    all[name] = `<svg xmlns="http://www.w3.org/2000/svg"${box} fill="currentColor">${parts.inner}</svg>`;
  }
  return `export const themeIcons = ${JSON.stringify(all)};`;
}

/** What a theme is missing (the standard theme: of THEME_FILES and the look of every standard block, another: of
 * OWN_FILES), what is wrong in its theme.json (name, version, author, icon), a block of its own (a folder in its
 * blocks/ that is not the look of a standard block, or with a block's contract in it), a part nothing uses (in a
 * folder without its View.tsx, a file the standard theme does not have there), and what is wrong with its own icons
 * (iconProblems). */
export function themeProblems(theme) {
  const needed = theme === STANDARD_THEME ? THEME_FILES : OWN_FILES;
  const problems = needed.filter((f) => !has(`${themeFolder(theme)}/${f}`)).map((f) => `${themeFolder(theme)}/${f} is missing.`);
  const standard = new Set(standardTypes());
  // Its accessibility statement, when it has one (lib/accessibility.mjs): the parts it falls short on, which the checks let through.
  if (has(`${themeFolder(theme)}/${STATEMENT_FILE}`))
    try {
      problems.push(
        ...statementProblems(JSON.parse(readFileSync(new URL(`${themeFolder(theme)}/${STATEMENT_FILE}`, root), 'utf8'))).map(
          (p) => `${themeFolder(theme)}/${p}`,
        ),
      );
    } catch (e) {
      problems.push(`${themeFolder(theme)}/${STATEMENT_FILE}: ${e.message}`);
    }
  if (theme === STANDARD_THEME)
    for (const type of standard)
      if (!has(`${themeFolder(theme)}/blocks/${type}/View.tsx`)) problems.push(`${themeFolder(theme)}/blocks/${type}/View.tsx is missing.`);
  // Every theme builds on the standard theme. Another theme imports the standard theme's global.css, so a style it does
  // not write is Material's; the standard theme's own imports ./base.css.
  const css = `${themeFolder(theme)}/styles/global.css`;
  if (has(css)) {
    const problem = importProblem(theme, readFileSync(new URL(css, root), 'utf8'));
    if (problem !== null) problems.push(problem);
  }
  for (const type of folders(new URL(`${themeFolder(theme)}/blocks/`, root))) {
    const dir = `${themeFolder(theme)}/blocks/${type}`;
    if (!standard.has(type)) problems.push(`${dir}: a theme can only have the look of a standard block, and "${type}" is not one.`);
    for (const f of CONTRACT_FILES)
      if (has(`${dir}/${f}`)) problems.push(`${dir}/${f}: a block's contract belongs to the editor or an app, not to the theme.`);
    // Without a View.tsx of its own, the standard theme's draws the block, and each file replaces one of its parts
    // (expand/Accordion.tsx), which it imports as @theme/…; else nothing would use it. The standard theme draws them all.
    if (theme === STANDARD_THEME || has(`${dir}/View.tsx`)) {
      if (!has(`${dir}/View.tsx`)) problems.push(`${dir}/View.tsx is missing: it draws the block on the site and in the editor.`);
    } else
      for (const entry of readdirSync(new URL(dir, root), { withFileTypes: true }))
        if (
          entry.name !== 'script.ts' &&
          !CONTRACT_FILES.includes(entry.name) &&
          !has(`${themeFolder(STANDARD_THEME)}/blocks/${type}/${entry.name}`)
        )
          problems.push(
            `${dir}/${entry.name}: the standard theme has no part with that name, so nothing uses it. Give it the same name as the part it replaces, or draw the block with a View.tsx.`,
          );
    for (const f of OLD_LOOK)
      if (has(`${dir}/${f}`)) problems.push(`${dir}/${f}: the block is drawn by View.tsx, both on the site and in the editor.`);
  }
  try {
    const manifest = JSON.parse(readFileSync(new URL(`${themeFolder(theme)}/theme.json`, root), 'utf8'));
    for (const key of ['name', 'version', 'author', 'icon'])
      if (typeof manifest[key] !== 'string' || !manifest[key]) problems.push(`${themeFolder(theme)}/theme.json: "${key}" is missing.`);
    const { description, highlights, releaseNotes } = manifest;
    const byLanguage = (x, ok) => x && typeof x === 'object' && !Array.isArray(x) && Object.values(x).length && Object.values(x).every(ok);
    if (description !== undefined && !byLanguage(description, (x) => typeof x === 'string' && x))
      problems.push(`${themeFolder(theme)}/theme.json: "description" must be the text in each language, e.g. { "da-DK": "…" }.`);
    if (
      highlights !== undefined &&
      !byLanguage(highlights, (x) => Array.isArray(x) && x.length && x.every((y) => typeof y === 'string' && y))
    )
      problems.push(`${themeFolder(theme)}/theme.json: "highlights" must be the points in each language, e.g. { "da-DK": ["…"] }.`);
    if (releaseNotes !== undefined && !byLanguage(releaseNotes, (x) => byLanguage(x, (y) => typeof y === 'string' && y)))
      problems.push(
        `${themeFolder(theme)}/theme.json: "releaseNotes" must be what is new in each version in each language, e.g. { "da-DK": { "1.1.0": "…" } }.`,
      );
    if ('store' in manifest && (manifest.store !== true || theme === STANDARD_THEME))
      problems.push(
        `${themeFolder(theme)}/theme.json: "store" can only be true (the theme is in the Appstore, npm run store:release), and the standard theme does not have it.`,
      );
    // A theme from the store is copied in as its folder only: its CSS imports nothing from outside it but the CMS.
    if (manifest.store === true) {
      const styles = `${themeFolder(theme)}/styles`;
      for (const f of has(styles) ? readdirSync(new URL(`${styles}/`, root), { recursive: true }) : [])
        if (String(f).endsWith('.css')) {
          const inTheme = `styles/${String(f).replaceAll('\\', '/')}`;
          for (const p of storeImportProblems(readFileSync(new URL(`${themeFolder(theme)}/${inTheme}`, root), 'utf8'), inTheme))
            problems.push(`${themeFolder(theme)}/${p}`);
        }
    }
    // The icon pack it uses by default: a system pack, or one of its own by its folder; the standard theme's a system pack.
    const own = ownPacks(theme);
    if (
      (manifest.icons !== undefined || theme === STANDARD_THEME) &&
      !(
        SYSTEM_PACKS.includes(manifest.icons) ||
        RETIRED_PACKS.includes(manifest.icons) ||
        (theme !== STANDARD_THEME && own.includes(manifest.icons))
      )
    )
      problems.push(
        `${themeFolder(theme)}/theme.json: "icons" is the icon pack the theme uses when none is chosen: ${[...SYSTEM_PACKS, ...own].map((p) => `"${p}"`).join(', ')}.`,
      );
    // How it moves while the owner has chosen none (lib/motion.ts); without it, the standard theme's.
    if (manifest.motion !== undefined && !MOTION_SCHEMES.includes(manifest.motion))
      problems.push(
        `${themeFolder(theme)}/theme.json: "motion" is the motion scheme the theme uses when none is chosen: ${MOTION_SCHEMES.map((s) => `"${s}"`).join(', ')}.`,
      );
    // The page templates it offers (lib/page-template.mjs); without the key, the standard theme's list.
    for (const p of templateProblems(manifest.templates)) problems.push(`${themeFolder(theme)}/theme.json: ${p}`);
    // Its own licence and the licences of what it brings (fonts, code, images), for "Licenses" and the store.
    problems.push(
      ...declarationProblems({
        license: manifest.license,
        thirdParty: manifest.thirdParty,
        folder: fileURLToPath(new URL(`${themeFolder(theme)}/`, root)),
        where: `${themeFolder(theme)}/theme.json`,
        what: `the theme ${manifest.name || theme}`,
        owner: ownerId('theme', theme),
        root: fileURLToPath(root),
      }),
    );
  } catch (e) {
    problems.push(`${themeFolder(theme)}/theme.json: ${e.message}`);
  }
  // The icon packs it brings: each as every pack must be, and not by a system pack's name.
  const packs = ownPacks(theme);
  for (const p of packs)
    if (SYSTEM_PACKS.includes(p))
      problems.push(
        `${themeFolder(theme)}/${THEME_PACKS_FOLDER}/${p}: an icon pack in a theme is not named like the system's (${SYSTEM_PACKS.join(', ')}).`,
      );
  if (theme === STANDARD_THEME && packs.length)
    problems.push(`${themeFolder(theme)}/${THEME_PACKS_FOLDER}: the standard theme's icon packs are the system's, in the CMS's icons/.`);
  for (const entry of has(`${themeFolder(theme)}/${THEME_PACKS_FOLDER}`)
    ? readdirSync(new URL(`${themeFolder(theme)}/${THEME_PACKS_FOLDER}/`, root))
    : [])
    if (!packs.includes(entry))
      problems.push(`${themeFolder(theme)}/${THEME_PACKS_FOLDER}/${entry}: an icon pack is a folder with its ${ICON_PACK_FILE}.`);
  return [...problems, ...iconProblems(theme), ...packs.flatMap((p) => packProblems(themePackId(theme, p)))];
}

// A site's own parts (src/site/<file>), else the package's standard ones (defaults/<file>): `@site/<file>`. With `/` only, as Vite's ids (Windows).
const SITE_DIRS = [fileURLToPath(new URL('src/site/', root)), fileURLToPath(new URL('defaults/', pkg))].map((d) => d.replaceAll('\\', '/'));

/** The file `@site/<file>` is: the site's src/site/<file>, else the package's defaults/<file>, with or without its
 * extension (`@site/editor`, as TypeScript writes it), or null. */
export function siteFile(file) {
  for (const dir of SITE_DIRS)
    for (const ext of ['', '.ts', '.tsx', '.mjs', '.js'])
      if (statSync(dir + file + ext, { throwIfNoEntry: false })?.isFile()) return dir + file + ext;
  return null;
}

/** The folder of the theme in use, under src/themes/. */
export function activeTheme() {
  const { theme } = JSON.parse(readFileSync(new URL('src/data/theme.json', root), 'utf8'));
  if (
    typeof theme !== 'string' ||
    !/^([a-z0-9-]+|theme_[0-9a-f]{16})$/.test(theme) ||
    !existsSync(new URL(`${themeFolder(theme)}/theme.json`, root))
  )
    throw new Error(`src/data/theme.json: the theme ${JSON.stringify(theme)} isn't installed (src/themes/<theme>/theme.json).`);
  return theme;
}

/** @data (the site's data, src/data/), @saturn (the standard theme, this package's theme/) and @icons (the system's icon
 * packs), as Vite's resolve.alias. @site is themePlugin's (siteFile). */
export const aliases = () => ({
  '@data': fileURLToPath(new URL('src/data', root)),
  '@saturn': fileURLToPath(new URL('theme', pkg)),
  '@icons': fileURLToPath(new URL('icons', pkg)),
});

/** @theme and @site as a Vite plugin: `@site/<file>` is the site's own part, else the package's standard one
 * (siteFile), and `@theme/<file>` is the theme in use's file, else the standard theme's. A glob
 * (`import.meta.glob('@theme/blocks/*\/View.tsx')`) is the theme in use's; whoever globs puts the standard
 * theme's under it (packages/editor/src/standard/siteLooks.ts, packages/editor/src/standard/themeBlocks.ts).
 * And the theme's icons (themeIcons: its own, else the icon pack in use's, iconPack) as the virtual module `virtual:theme-icons`, by Material Symbols
 * name, which Svg (packages/editor/src/icon.tsx) draws before Material Symbols' own. The pack is read when the site is built, so a new choice
 * (src/data/icons.json) or theme is in the site and the editor after the next build. */
export function themePlugin() {
  // With forward slashes, as Vite writes ids: on Windows a mixed id (C:\…\theme\components/MobileNav.astro) hides a
  // component's script from Astro, which looks it up with forward slashes.
  const themes = [activeTheme(), STANDARD_THEME].map((t) => fileURLToPath(new URL(`${themeFolder(t)}/`, root)).replaceAll('\\', '/'));
  const icons = themeIcons();
  return {
    name: 'site-theme',
    enforce: 'pre',
    resolveId(source) {
      if (source === THEME_ICONS) return '\0' + THEME_ICONS;
      if (source === THEME_COVERAGE) return '\0' + THEME_COVERAGE;
      if (source === SITE_FACTS) return '\0' + SITE_FACTS;
      if (source === MATERIAL_ALL) return MATERIAL_ALL_ID;
      if (source === MATERIAL_SSR) return MATERIAL_SSR_ID;
      if (source.startsWith('@site/')) return siteFile(source.slice('@site/'.length));
      if (!source.startsWith('@theme/')) return null;
      const file = source.slice('@theme/'.length);
      if (file.includes('*')) return themes[0] + file;
      // A file without its extension (`@theme/editor/previews`), as TypeScript writes it.
      for (const dir of themes)
        for (const ext of ['', '.ts', '.tsx', '.mjs', '.js'])
          if (statSync(dir + file + ext, { throwIfNoEntry: false })?.isFile()) return dir + file + ext;
      return null;
    },
    load(id, options) {
      if (id === MATERIAL_ALL_ID) return materialModule();
      if (id === MATERIAL_SSR_ID) return materialSsrModule(options?.ssr);
      if (id === '\0' + THEME_ICONS) return themeIconsModule(icons);
      if (id === '\0' + THEME_COVERAGE) return coverageModule(activeTheme());
      if (id === '\0' + SITE_FACTS) return `export default ${JSON.stringify(reduceFacts(detectFacts(process.cwd())))};`;
      return null;
    },
  };
}

/** What a block is missing to be drawn from its view (packages/editor/src/standard/view.tsx): a standard block's
 * contract its view.ts and load.ts, an app's block (src/apps/<app>/blocks/<type>/) its viewOf.ts, load.ts and View.tsx; and the
 * files of how a block looked before (Site.astro, draw.tsx), which nothing uses now. */
export function blockProblems() {
  const problems = [];
  for (const type of standardTypes())
    for (const f of ['view.ts', 'load.ts'])
      if (!existsSync(new URL(`src/standard/${type}/${f}`, pkg))) problems.push(`packages/editor/src/standard/${type}/${f} is missing.`);
  for (const app of folders(new URL('src/apps/', root)))
    for (const type of folders(new URL(`src/apps/${app}/blocks/`, root))) {
      const dir = `src/apps/${app}/blocks/${type}`;
      for (const f of ['index.tsx', 'viewOf.ts', 'load.ts', 'View.tsx']) if (!has(`${dir}/${f}`)) problems.push(`${dir}/${f} is missing.`);
      for (const f of OLD_LOOK)
        if (has(`${dir}/${f}`)) problems.push(`${dir}/${f}: the block is drawn by View.tsx, both on the site and in the editor.`);
    }
  return problems;
}
