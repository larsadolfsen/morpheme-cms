// The site's theme: how it looks (src/themes/<theme>/, with its theme.json). Which one is in use is data,
// src/data/theme.json (`{ "theme": "<folder>" }`), changed with the swap button on "Tema" in the editor.
// Every theme builds on the standard theme (packages/editor/theme/): what a theme does not have itself, a file of the
// theme or the look of a block, is the standard theme's, styled by the theme in use's CSS. The site and the editor
// reach the theme as @theme (themePlugin: the theme in use's file, else the standard theme's), and the site's own
// parts (src/site/) as @site (aliases): for packages/editor/astro.mjs and packages/editor/scripts/check-content.mjs. Stops with what is
// wrong, when the theme named is not installed. Also the virtual module with all Phosphor's icons (allIconsModule).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { svgParts } from '@morphemecms/cms/lib/svg.mjs';
import { declarationProblems, ownerId } from '@morphemecms/cms/lib/licenses.mjs';
import { installedPacks, isIconName, packFolder, packProblems, phosphorFile, svgProblems, usedIcons } from './icons.mjs';
import { MATERIAL_ALL, MATERIAL_SSR, materialModule, materialSsrModule } from './materialSymbols.mjs';
import { ICON_PACK_FILE, ICON_PACK_LICENSE, SYSTEM_PACKS, THEME_PACKS_FOLDER, packInUse, packTheme, themePackId } from './iconPacks.mjs';
import { MOTION_SCHEMES } from '@morphemecms/cms/lib/motion-schemes.mjs';
import { storeImportProblems } from './storeTheme.mjs';

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

/** The themes installed: the standard theme and the folders in src/themes/ with a theme.json. */
export const installedThemes = () => [
  STANDARD_THEME,
  ...(existsSync(new URL('src/themes/', root)) ? readdirSync(new URL('src/themes/', root), { withFileTypes: true }) : [])
    .filter((e) => e.isDirectory() && existsSync(new URL(`src/themes/${e.name}/theme.json`, root)))
    .map((e) => e.name),
];

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
    return STANDARD_IMPORT.test(css) ? null : `${themeFolder(theme)}/styles/global.css: importerer ikke ./base.css.`;
  return FALLBACK_IMPORT.test(css)
    ? null
    : `${themeFolder(theme)}/styles/global.css: importerer ikke standardtemaet, som er temaets fallback: @import '@morphemecms/cms/theme/styles/global.css' øverst.`;
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
      problems.push(`${file}: et temas ikon er en SVG-fil, ${dir}/<navn>.svg.`);
      continue;
    }
    if (!isIconName(name))
      problems.push(`${file}: sitet tegner intet ikon, der hedder "${name}". Et ikon hedder som i Phosphor (fx map-pin, play-fill).`);
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

/** The choice of icon pack made under "Indstillinger" › "Udseende" › "Ikonpakker" (src/data/icons.json, `{ "pack": "<id>"
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
        ? `${ICONS_FILE}: ikonpakken ${JSON.stringify(id)} er ikke installeret (${packFolder(id)}/${ICON_PACK_FILE}).`
        : `${themeFolder(theme)}/theme.json: "icons" er ikonpakken ${JSON.stringify(id)}, som ikke er installeret.`,
    );
  return id;
}

/** The icon packs there are with their licences, from their manifests, for "Licenser" under "Indstillinger" (IconPack
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
 * none), then the icon pack in use's (iconPack). */
const iconFolders = (theme) =>
  [...new Set([theme, STANDARD_THEME])].map((t) => `${themeFolder(t)}/icons/`).concat(`${packFolder(iconPack(theme))}/`);

/** Whether an icon's file is Phosphor's own (as its package has it, as Phosphor's pack has it): then it needs no
 * putting in Phosphor's place. */
const isPhosphors = (name, svg) => svg.trim() === phosphorFile(name)?.trim();

/** The theme in use's icons as their files' text, by name: its own (icons/<name>.svg), else its icon pack's (iconPack);
 * not those that are Phosphor's own, which the site and the editor draw as they are (all, with Phosphor's pack). */
function themeIcons() {
  const icons = {};
  for (const dir of iconFolders(activeTheme()).reverse())
    if (has(dir))
      for (const f of readdirSync(new URL(dir, root)))
        if (f.endsWith('.svg')) icons[f.slice(0, -'.svg'.length)] = readFileSync(new URL(dir + f, root), 'utf8');
  for (const [name, svg] of Object.entries(icons)) if (isPhosphors(name, svg)) delete icons[name];
  return icons;
}

/** An icon of a theme (the one in use, if none is given) as its file's text: its own (icons/<name>.svg), else its icon
 * pack's; null when it is Phosphor's own, or neither has it (then it is Phosphor's). For what is drawn outside Vite: the
 * play button of a video in the text (rehypeVideo, packages/editor/astro.mjs). In Vite, themePlugin puts them in Phosphor's place. */
export function themeIcon(name, theme = activeTheme()) {
  for (const dir of iconFolders(theme))
    if (has(`${dir}${name}.svg`)) {
      const svg = readFileSync(new URL(`${dir}${name}.svg`, root), 'utf8');
      return isPhosphors(name, svg) ? null : svg;
    }
  return null;
}

/** The site's choice of motion scheme, `{ "scheme": "<scheme>" }` (config.motion in src/site/config.ts). */
const MOTION_FILE = 'src/data/motion.json';

/** What is wrong with the choice of motion scheme made under "Udseende" › "Bevægelse" (src/data/motion.json): one that
 * is not a scheme (lib/motion.ts). */
export function motionProblems() {
  const file = new URL(MOTION_FILE, root);
  if (!existsSync(file)) return [];
  try {
    const { scheme } = JSON.parse(readFileSync(file, 'utf8'));
    if (MOTION_SCHEMES.includes(scheme)) return [];
    return [`${MOTION_FILE}: bevægelsen ${JSON.stringify(scheme ?? null)} findes ikke. Vælg en under Udseende › Bevægelse.`];
  } catch (e) {
    return [`${MOTION_FILE}: ${e.message}`];
  }
}

/** What is wrong with the system's icon packs (packProblems; a theme's own are its themeProblems) and the choice of one:
 * src/data/icons.json naming one that is not there. */
export function iconPackProblems() {
  const used = usedIcons();
  const installed = installedPacks();
  const problems = SYSTEM_PACKS.filter((id) => installed.includes(id)).flatMap((id) => packProblems(id, used));
  for (const id of SYSTEM_PACKS)
    if (!installed.includes(id)) problems.push(`${packFolder(id)}/${ICON_PACK_FILE} mangler: kør npm run icons.`);
  try {
    const chosen = chosenPack();
    if (chosen !== undefined && (typeof chosen !== 'string' || !installed.includes(chosen)))
      problems.push(`${ICONS_FILE}: ikonpakken ${JSON.stringify(chosen)} er ikke installeret. Vælg en anden under Udseende › Ikonpakker.`);
  } catch (e) {
    problems.push(`${ICONS_FILE}: ${e.message}`);
  }
  return problems;
}

// Phosphor, as the site and the editor import it: its React icons (`import { CaretRight } from '@phosphor-icons/react'`)
// and its SVG files as text (`@phosphor-icons/core/assets/regular/caret-right.svg?raw`, `…/fill/play-fill.svg?raw`, also
// in the import.meta.glob of Svg, packages/editor/src/icon.tsx). themePlugin puts the theme's icons in their place.
const PHOSPHOR_REACT = '@phosphor-icons/react';
const PHOSPHOR_FILE = /@phosphor-icons\/core\/assets\/(?:regular|fill)\/([a-z0-9-]+)\.svg\?raw$/;
const REACT_ICONS = '\0site-theme-icons';
const FILE_ICON = '\0site-theme-icon:';
const MATERIAL_ALL_ID = `\0${MATERIAL_ALL}`;
const MATERIAL_SSR_ID = `\0${MATERIAL_SSR}`;

/** The React component's name of a Phosphor icon by its file's name (`caret-right` → CaretRight), when Phosphor has it. */
const reactName = (name) => {
  const pascal = name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
  return has(`node_modules/@phosphor-icons/react/dist/csr/${pascal}.es.js`) ? pascal : null;
};

/** `@phosphor-icons/react` with the theme's icons in place of Phosphor's, the rest Phosphor's: each one the theme has
 * draws its SVG file in the file's viewBox, with the props of a Phosphor icon (size, color, weight, mirrored, alt, the
 * svg's own; from IconContext as Phosphor's), through Phosphor's IconBase; `weight="fill"` its `<name>-fill`, if the
 * theme has one, else the same as the others. */
function reactIcons(icons) {
  const lines = [
    "import { createElement, forwardRef, useContext } from 'react';",
    `import { IconBase, IconContext } from '${PHOSPHOR_REACT}';`,
    `export * from '${PHOSPHOR_REACT}';`,
    'const draw = (regular, fill) =>',
    '  forwardRef((props, ref) => {',
    '    const context = useContext(IconContext);',
    "    const weight = props.weight ?? context.weight ?? 'regular';",
    '    const color = props.color ?? context.color;',
    "    const [viewBox, inner] = weight === 'fill' && fill ? fill : regular;",
    // A colour of its own also for lines (a theme's own icon drawn with stroke="currentColor"), not only for what is filled.
    "    const drawn = createElement('g', { color: color === 'currentColor' ? undefined : color, dangerouslySetInnerHTML: { __html: inner } });",
    '    return createElement(IconBase, { ...props, ref, viewBox, weights: new Map([[weight, drawn]]) });',
    '  });',
  ];
  const parts = (name) => {
    const svg = svgParts(icons[name]);
    return svg && JSON.stringify([svg.viewBox, svg.inner]);
  };
  for (const name of Object.keys(icons)) {
    const component = reactName(name);
    if (!component || !parts(name)) continue;
    lines.push(
      `export const ${component}Icon = /* @__PURE__ */ draw(${parts(name)}, ${parts(`${name}-fill`) ?? 'null'});`,
      `export { ${component}Icon as ${component} };`,
    );
  }
  return lines.join('\n');
}

/** The text of an icon's SVG file as Phosphor's are (in the text's colour, `fill="currentColor"`), not JSON-encoded. */
const themedSvg = (svg) => {
  const { viewBox, inner } = svgParts(svg);
  const box = viewBox ? ` viewBox="${viewBox}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg"${box} fill="currentColor">${inner}</svg>`;
};

/** An icon's SVG file as Phosphor's are, for an import of Phosphor's. */
const fileIcon = (svg) => `export default ${JSON.stringify(themedSvg(svg))};`;

/** The virtual module with all Phosphor's icons (regular) as text (src/allIcons.ts). */
export const ALL_ICONS = 'virtual:all-icons';

/** The module code of all Phosphor's icons in `folder` (its `regular/` folder), by the keys `import.meta.glob` gave, the
 * theme's (`icons`, as themeIcons returns them) in place of Phosphor's own. The files are read one at a time: a glob
 * opens them all at once, and the build image's limit of open files (1024) stops the build. */
export function allIconsModule(folder, icons) {
  const all = {};
  for (const file of readdirSync(folder)
    .filter((f) => f.endsWith('.svg'))
    .sort()) {
    const name = file.slice(0, -'.svg'.length);
    all[`/node_modules/@phosphor-icons/core/assets/regular/${file}`] = svgParts(icons[name])
      ? themedSvg(icons[name])
      : readFileSync(join(folder, file), 'utf8');
  }
  return `export const allIcons = ${JSON.stringify(all)};`;
}

/** What a theme is missing (the standard theme: of THEME_FILES and the look of every standard block, another: of
 * OWN_FILES), what is wrong in its theme.json (name, version, author, icon), a block of its own (a folder in its
 * blocks/ that is not the look of a standard block, or with a block's contract in it), a part nothing uses (in a
 * folder without its View.tsx, a file the standard theme does not have there), and what is wrong with its own icons
 * (iconProblems). */
export function themeProblems(theme) {
  const needed = theme === STANDARD_THEME ? THEME_FILES : OWN_FILES;
  const problems = needed.filter((f) => !has(`${themeFolder(theme)}/${f}`)).map((f) => `${themeFolder(theme)}/${f} mangler.`);
  const standard = new Set(standardTypes());
  if (theme === STANDARD_THEME)
    for (const type of standard)
      if (!has(`${themeFolder(theme)}/blocks/${type}/View.tsx`)) problems.push(`${themeFolder(theme)}/blocks/${type}/View.tsx mangler.`);
  // Every theme builds on the standard theme. Another theme imports the standard theme's global.css, so a style it does
  // not write is Material's; the standard theme's own imports ./base.css.
  const css = `${themeFolder(theme)}/styles/global.css`;
  if (has(css)) {
    const problem = importProblem(theme, readFileSync(new URL(css, root), 'utf8'));
    if (problem !== null) problems.push(problem);
  }
  for (const type of folders(new URL(`${themeFolder(theme)}/blocks/`, root))) {
    const dir = `${themeFolder(theme)}/blocks/${type}`;
    if (!standard.has(type)) problems.push(`${dir}: et tema kan kun have udseendet af en standardblok, og "${type}" er ikke en.`);
    for (const f of CONTRACT_FILES)
      if (has(`${dir}/${f}`)) problems.push(`${dir}/${f}: en bloks kontrakt hører til editoren eller en app, ikke temaet.`);
    // Without a View.tsx of its own, the standard theme's draws the block, and each file replaces one of its parts
    // (faq/Accordion.tsx), which it imports as @theme/…; else nothing would use it. The standard theme draws them all.
    if (theme === STANDARD_THEME || has(`${dir}/View.tsx`)) {
      if (!has(`${dir}/View.tsx`)) problems.push(`${dir}/View.tsx mangler: den tegner blokken på sitet og i editoren.`);
    } else
      for (const entry of readdirSync(new URL(dir, root), { withFileTypes: true }))
        if (
          entry.name !== 'script.ts' &&
          !CONTRACT_FILES.includes(entry.name) &&
          !has(`${themeFolder(STANDARD_THEME)}/blocks/${type}/${entry.name}`)
        )
          problems.push(
            `${dir}/${entry.name}: standardtemaet har ingen del med det navn, så intet bruger den. Giv den samme navn som den del, den erstatter, eller tegn blokken med en View.tsx.`,
          );
    for (const f of OLD_LOOK)
      if (has(`${dir}/${f}`)) problems.push(`${dir}/${f}: blokken tegnes af View.tsx, både på sitet og i editoren.`);
  }
  try {
    const manifest = JSON.parse(readFileSync(new URL(`${themeFolder(theme)}/theme.json`, root), 'utf8'));
    for (const key of ['name', 'version', 'author', 'icon'])
      if (typeof manifest[key] !== 'string' || !manifest[key]) problems.push(`${themeFolder(theme)}/theme.json: "${key}" mangler.`);
    const { description, highlights, releaseNotes } = manifest;
    const byLanguage = (x, ok) => x && typeof x === 'object' && !Array.isArray(x) && Object.values(x).length && Object.values(x).every(ok);
    if (description !== undefined && !byLanguage(description, (x) => typeof x === 'string' && x))
      problems.push(`${themeFolder(theme)}/theme.json: "description" skal være teksten på hvert sprog, fx { "da-DK": "…" }.`);
    if (
      highlights !== undefined &&
      !byLanguage(highlights, (x) => Array.isArray(x) && x.length && x.every((y) => typeof y === 'string' && y))
    )
      problems.push(`${themeFolder(theme)}/theme.json: "highlights" skal være punkterne på hvert sprog, fx { "da-DK": ["…"] }.`);
    if (releaseNotes !== undefined && !byLanguage(releaseNotes, (x) => byLanguage(x, (y) => typeof y === 'string' && y)))
      problems.push(
        `${themeFolder(theme)}/theme.json: "releaseNotes" skal være det nye i hver version på hvert sprog, fx { "da-DK": { "1.1.0": "…" } }.`,
      );
    if ('store' in manifest && (manifest.store !== true || theme === STANDARD_THEME))
      problems.push(
        `${themeFolder(theme)}/theme.json: "store" kan kun være true (temaet står i Appstore, npm run store:release), og standardtemaet har det ikke.`,
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
      !(SYSTEM_PACKS.includes(manifest.icons) || (theme !== STANDARD_THEME && own.includes(manifest.icons)))
    )
      problems.push(
        `${themeFolder(theme)}/theme.json: "icons" er den ikonpakke, temaet bruger, når ingen er valgt: ${[...SYSTEM_PACKS, ...own].map((p) => `"${p}"`).join(', ')}.`,
      );
    // How it moves while the owner has chosen none (lib/motion.ts); without it, the standard theme's.
    if (manifest.motion !== undefined && !MOTION_SCHEMES.includes(manifest.motion))
      problems.push(
        `${themeFolder(theme)}/theme.json: "motion" er den bevægelse, temaet bruger, når ingen er valgt: ${MOTION_SCHEMES.map((s) => `"${s}"`).join(', ')}.`,
      );
    // Its own licence and the licences of what it brings (fonts, code, pictures), for "Licenser" and the store.
    problems.push(
      ...declarationProblems({
        license: manifest.license,
        thirdParty: manifest.thirdParty,
        folder: fileURLToPath(new URL(`${themeFolder(theme)}/`, root)),
        where: `${themeFolder(theme)}/theme.json`,
        what: `temaet ${manifest.name || theme}`,
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
        `${themeFolder(theme)}/${THEME_PACKS_FOLDER}/${p}: en ikonpakke i et tema hedder ikke som systemets (${SYSTEM_PACKS.join(', ')}).`,
      );
  if (theme === STANDARD_THEME && packs.length)
    problems.push(`${themeFolder(theme)}/${THEME_PACKS_FOLDER}: standardtemaets ikonpakker er systemets, i CMS'ets icons/.`);
  for (const entry of has(`${themeFolder(theme)}/${THEME_PACKS_FOLDER}`)
    ? readdirSync(new URL(`${themeFolder(theme)}/${THEME_PACKS_FOLDER}/`, root))
    : [])
    if (!packs.includes(entry))
      problems.push(`${themeFolder(theme)}/${THEME_PACKS_FOLDER}/${entry}: en ikonpakke er en mappe med sin ${ICON_PACK_FILE}.`);
  const used = usedIcons();
  return [...problems, ...iconProblems(theme), ...packs.flatMap((p) => packProblems(themePackId(theme, p), used))];
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
  if (typeof theme !== 'string' || !/^[a-z0-9-]+$/.test(theme) || !existsSync(new URL(`${themeFolder(theme)}/theme.json`, root)))
    throw new Error(`src/data/theme.json: temaet ${JSON.stringify(theme)} er ikke installeret (src/themes/<tema>/theme.json).`);
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
 * And the theme's icons (themeIcons: its own, else the icon pack in use's, iconPack) in Phosphor's place, on the site
 * and in the editor alike: an import of `@phosphor-icons/react` is Phosphor's with the theme's icons in place of its own
 * (reactIcons), and an SVG file of Phosphor's as text (`?raw`) the theme's, when it has one. An icon neither has is
 * Phosphor's (check:content stops at a pack without one the site or the editor draws: packProblems). With Phosphor's
 * pack and no icons of its own nothing is changed. The pack is read when the site is built, so a new choice
 * (src/data/icons.json) or theme is in the site and the editor after the next build. */
export function themePlugin() {
  // With forward slashes, as Vite writes ids: on Windows a mixed id (C:\…\theme\components/MobileNav.astro) hides a
  // component's script from Astro, which looks it up with forward slashes.
  const themes = [activeTheme(), STANDARD_THEME].map((t) => fileURLToPath(new URL(`${themeFolder(t)}/`, root)).replaceAll('\\', '/'));
  const icons = themeIcons();
  const own = Object.keys(icons).length > 0;
  return {
    name: 'site-theme',
    enforce: 'pre',
    // Phosphor's package bundled for the browser, also when the first import of it is the theme's icons'.
    config: () => (own ? { optimizeDeps: { include: [PHOSPHOR_REACT] } } : {}),
    resolveId(source, importer) {
      // The theme's icons import Phosphor's own.
      if (source === PHOSPHOR_REACT) return own && importer !== REACT_ICONS ? REACT_ICONS : null;
      if (source === ALL_ICONS) return '\0' + ALL_ICONS;
      if (source === MATERIAL_ALL) return MATERIAL_ALL_ID;
      if (source === MATERIAL_SSR) return MATERIAL_SSR_ID;
      const icon = source.match(PHOSPHOR_FILE)?.[1];
      if (icon) return svgParts(icons[icon]) ? FILE_ICON + icon : null;
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
      if (id === REACT_ICONS) return reactIcons(icons);
      if (id === '\0' + ALL_ICONS)
        return allIconsModule(fileURLToPath(new URL('node_modules/@phosphor-icons/core/assets/regular/', root)), icons);
      if (id.startsWith(FILE_ICON)) return fileIcon(icons[id.slice(FILE_ICON.length)]);
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
      if (!existsSync(new URL(`src/standard/${type}/${f}`, pkg))) problems.push(`packages/editor/src/standard/${type}/${f} mangler.`);
  for (const app of folders(new URL('src/apps/', root)))
    for (const type of folders(new URL(`src/apps/${app}/blocks/`, root))) {
      const dir = `src/apps/${app}/blocks/${type}`;
      for (const f of ['index.tsx', 'viewOf.ts', 'load.ts', 'View.tsx']) if (!has(`${dir}/${f}`)) problems.push(`${dir}/${f} mangler.`);
      for (const f of OLD_LOOK)
        if (has(`${dir}/${f}`)) problems.push(`${dir}/${f}: blokken tegnes af View.tsx, både på sitet og i editoren.`);
    }
  return problems;
}
