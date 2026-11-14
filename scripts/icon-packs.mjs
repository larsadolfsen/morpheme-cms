// Writes the system's own icon packs (packages/editor/icons/<pack>/: Material Symbols, Phosphor and Lucide; SYSTEM_PACKS in
// packages/editor/site/iconPacks.mjs) from their sets' packages at the versions in PACK_SOURCES (packages/editor/site/icons.mjs): for each icon the
// site and the editor draw, by its Phosphor name (usedIcons: the site's in packages/editor/src/icon.tsx, which the
// content stores; the editor's as it imports them from @phosphor-icons/react and @phosphor-icons/core, found in the
// code; the app store's), the set's icon its map names (MATERIAL_SYMBOLS, LUCIDE; one the set has none of from
// Pictogrammers' Material Design Icons, MATERIAL_DESIGN_ICONS; one neither has, X's logo, our own file,
// OWN_ICONS), as one <svg> with its viewBox, without a size or a colour
// of its own: Svg and the theme's Vite plugin (themePlugin in packages/editor/site/theme.mjs) give it those. Phosphor's are its files
// as they are (so a site with Phosphor's pack draws Phosphor's own icons, unchanged); Lucide's lines in a <g> with
// Lucide's stroke (`-fill`: filled in). Beside them the pack's manifest (pack.json: name, author, licence, and the icons
// from Material Design Icons under `includes`) and the licences (LICENSE, LICENSE-material-design-icons), from the
// packages. The files are committed, so neither an install nor the site's build needs the sets' packages.
//
//   npm run icons   (npm run icons)
//
// Run it after a new icon on the site or in the editor (check:content says which a pack has none for) or a new version
// of a set (PACK_SOURCES). It fetches the sets' packages at those versions itself, once, into node_modules/.cache/ (they
// are not in package.json, and large); Phosphor's is the site's own dependency.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { ICON_PACK_FILE, ICON_PACK_LICENSE, SYSTEM_PACKS } from '@morphemecms/cms/site/iconPacks.mjs';
import { packFolder } from '@morphemecms/cms/site/icons.mjs';
import {
  MATERIAL_DESIGN_ICONS,
  PACK_MAPS,
  OWN_ICONS,
  PACK_SOURCES,
  phosphorFile,
  phosphorNames,
  usedIcons,
} from '@morphemecms/cms/site/icons.mjs';

const MDI = 'material-design-icons';
const version = (spec) => spec.replace(/^.*@/, '');

// A set's package at its version, in a folder of its own, so the site's node_modules stays as package.json has it.
function fetched(spec) {
  const cache = `node_modules/.cache/${spec.replace(/[/@]/g, '_')}`;
  const pkg = `${cache}/node_modules/${spec.replace(/@[^@]*$/, '')}/`;
  if (!existsSync(`${pkg}package.json`)) {
    console.log(`Fetching ${spec} into ${cache} …`);
    mkdirSync(cache, { recursive: true });
    // npm is npm.cmd on Windows, which execFileSync cannot start without a shell: npm's own script with Node, when npm
    // runs this.
    const npm = process.env.npm_execpath ? [process.execPath, process.env.npm_execpath] : ['npm'];
    execFileSync(
      npm[0],
      [...npm.slice(1), 'install', '--prefix', cache, '--no-save', '--no-package-lock', '--no-audit', '--no-fund', spec],
      {
        stdio: 'inherit',
      },
    );
  }
  return pkg;
}

const used = [...usedIcons()].sort();
const phosphorPkg = 'node_modules/@phosphor-icons/core/';
const phosphorVersion = JSON.parse(readFileSync(`${phosphorPkg}package.json`, 'utf8')).version;
if (`@phosphor-icons/core@${phosphorVersion}` !== PACK_SOURCES.phosphor.package) {
  console.error(
    `@phosphor-icons/core is ${phosphorVersion}, not ${PACK_SOURCES.phosphor.package}: fix the version in PACK_SOURCES (packages/editor/site/icons.mjs), or install it.`,
  );
  process.exit(1);
}
const pkgs = { phosphor: phosphorPkg };
for (const id of [...SYSTEM_PACKS, MDI]) pkgs[id] ??= fetched(PACK_SOURCES[id].package);

// An icon's file of a set by the set's own name.
const sourceFile = {
  'material-symbols': (icon) => `${pkgs['material-symbols']}outlined/${icon}.svg`,
  lucide: (icon) => `${pkgs.lucide}icons/${icon.replace(/-fill$/, '')}.svg`,
  [MDI]: (icon) => `${pkgs[MDI]}svg/${icon}.svg`,
};

// One <svg> with the file's viewBox and what is in it, without comments, a size or a class of its own.
function bare(file, wrap = (inner) => inner) {
  const svg = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const viewBox = svg.match(/\bviewBox="([^"]*)"/)?.[1];
  const inner = svg.match(/^\s*<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/)?.[1];
  if (!viewBox || !inner) throw new Error(`${file} is not one <svg> with a viewBox.`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${wrap(inner)}</svg>\n`;
}
// Lucide's lines, in the text's colour as lines (its own <svg> has the stroke); `-fill` filled in.
const lines = (fill) => (inner) =>
  `<g fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner.replace(/\s+/g, ' ').trim()}</g>`;

// What each pack's files are, by Phosphor's name: its set's, and those from Material Design Icons.
function sourcesOf(id) {
  if (id === 'phosphor') return phosphorNames(used).map((name) => ({ name, text: () => phosphorFile(name) }));
  const map = PACK_MAPS[id];
  const mdi = MATERIAL_DESIGN_ICONS[id] ?? {};
  return [
    ...Object.entries(map).map(([name, icon]) => {
      const file = sourceFile[id](icon);
      return { name, icon, file, text: () => bare(file, id === 'lucide' ? lines(icon.endsWith('-fill')) : undefined) };
    }),
    ...Object.entries(mdi).map(([name, icon]) => {
      const file = sourceFile[MDI](icon);
      return { name, icon, file, text: () => bare(file) };
    }),
    ...Object.entries(OWN_ICONS[id] ?? {}).map(([name, file]) => ({ name, icon: file, file, text: () => bare(file) })),
  ];
}

const problems = [];
for (const id of SYSTEM_PACKS) {
  const sources = sourcesOf(id);
  const names = sources.map((s) => s.name);
  const missing = used.filter((name) => !names.includes(name));
  if (missing.length)
    problems.push(
      `${PACK_SOURCES[id].name} has no icon for ${missing.join(', ')} in packages/editor/site/icons.mjs: write the one that fits (one the set has none of, in MATERIAL_DESIGN_ICONS).`,
    );
  for (const { name, icon, file } of sources)
    if (file && !existsSync(file)) problems.push(`${PACK_SOURCES[id].name} has no "${icon}" (for ${name}).`);
  if (id === 'phosphor') for (const name of phosphorNames(used)) if (!phosphorFile(name)) problems.push(`Phosphor has no "${name}".`);
}
if (problems.length) {
  for (const p of problems) console.error(p);
  process.exit(1);
}

for (const id of SYSTEM_PACKS) {
  const dir = `${packFolder(id)}/`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const { name, text } of sourcesOf(id)) writeFileSync(`${dir}${name}.svg`, text());
  const { name, author, license, url, package: spec } = PACK_SOURCES[id];
  const mdi = Object.keys(MATERIAL_DESIGN_ICONS[id] ?? {}).sort();
  const manifest = {
    name,
    author,
    license,
    url,
    version: version(spec),
    source: spec,
    ...(mdi.length
      ? {
          includes: [
            ...(mdi.length
              ? [
                  {
                    name: PACK_SOURCES[MDI].name,
                    author: PACK_SOURCES[MDI].author,
                    license: PACK_SOURCES[MDI].license,
                    url: PACK_SOURCES[MDI].url,
                    version: version(PACK_SOURCES[MDI].package),
                    source: PACK_SOURCES[MDI].package,
                    licenseFile: `${ICON_PACK_LICENSE}-${MDI}`,
                    icons: mdi,
                  },
                ]
              : []),
          ],
        }
      : {}),
  };
  writeFileSync(`${dir}${ICON_PACK_FILE}`, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(`${dir}${ICON_PACK_LICENSE}`, `${readFileSync(`${pkgs[id]}LICENSE`, 'utf8').trim()}\n`);
  if (mdi.length) writeFileSync(`${dir}${ICON_PACK_LICENSE}-${MDI}`, `${readFileSync(`${pkgs[MDI]}LICENSE`, 'utf8').trim()}\n`);
  console.log(
    `${readdirSync(dir).filter((f) => f.endsWith('.svg')).length} icons from ${spec}${mdi.length ? ` and ${PACK_SOURCES[MDI].package}` : ''} in ${dir}.`,
  );
}
