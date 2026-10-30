// The licences of the third-party work the site and the editor are made with, for "Licenser" under "Indstillinger"
// (packages/editor/src/Licenses.tsx), found, not written by hand:
//   - What is shipped: the npm packages whose code, styles or files end up in what visitors and editors download. That
//     is the browser's bundle (the site's scripts, its islands and the editor), the styles of every page (a package a
//     stylesheet imports: Tailwind's preflight and typography, a font's @font-face) and the files they bring (the
//     fonts), with the bundler's helpers and Astro's script that wakes the islands, which the build writes into the pages
//     (licensesIntegration). A package only the build runs (Astro's compiler, Vite, Tailwind's engine, the Markdown
//     pipeline on the server, sharp) puts nothing of its own in a page: the HTML it renders is the site's own content,
//     so it is not shipped, and neither is the Worker's code (it runs at Cloudflare and is not handed to anyone).
//   - The icon packs (IconPack; the site gives them, iconPacks, from each pack's manifest): the system's (Material
//     Symbols, Phosphor and Lucide), shipped or not, since any of them can be chosen, each with the sets it takes icons
//     from besides its own (Material Design Icons), and those a theme brings, under it.
//   - What each app (`license` and `thirdParty` in its defineApp) and each theme (the same in its theme.json) declares:
//     its own licence and the third-party work it brings (declaredWorks), shipped or not.
// A package's licence is its package.json's `license`, its text its LICENSE files (with its NOTICE, which the Apache
// License asks to be passed on), else the licence's standard text (license-texts/<SPDX>.txt) with who made it; who made
// it is its `author`, else its first contributor, the holder its licence's copyright line names, its first maintainer or
// the owner of its repository.
// The build writes dist/editor/licenses.json (LicensesFile in src/licenses.ts), which the editor fetches, and stops when
// something shipped has no licence it can show. npm run check:content checks, before a build: every package the site's
// and the editor's code imports, and what they depend on (codePackageProblems, more than is shipped, so nothing shipped
// slips through) and each app's and theme's declaration (declarationProblems); the icon packs' manifests and licences
// are checked with the packs (packProblems in packages/editor/site/icons.mjs).
// No TypeScript here: the build and the scripts read it.
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appIds, installedApps } from './apps.mjs';

const posix = (path) => path.split(sep).join('/');
const read = (file) => readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trim();

/** The kinds of third-party work: a font, icons, code (a library, styles too) and pictures. */
export const LICENSE_KINDS = ['font', 'icons', 'library', 'image'];

/** The licence of one's own work that grants nothing ("all rights reserved"), as npm writes it. */
export const UNLICENSED = 'UNLICENSED';

/** The file with the licence of an app's or a theme's own work, in its folder, when it is not UNLICENSED. */
export const OWN_LICENSE_FILE = 'LICENSE';

/** A package's name from what is imported (`@scope/name/sub/file.js` → `@scope/name`, `name/x` → `name`). */
export const packageName = (specifier) => {
  const parts = specifier.split(/[?#]/)[0].split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
};

/** The folder of an npm package that a file is in: up to its name after the last node_modules/ in its real path. */
export function packageDirOf(file) {
  let path;
  try {
    path = posix(realpathSync(file));
  } catch {
    path = posix(file);
  }
  return path.match(/^(.*\/node_modules\/(?:@[^/]+\/[^/]+|[^/@][^/]*))(?:\/|$)/)?.[1] ?? null;
}

/** The folder of a package by its name, as Node finds it from a folder: in node_modules/ there or above. */
export function packageDir(name, from) {
  for (let dir = from; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', name);
    if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate);
    if (dirname(dir) === dir) return null;
  }
}

// ---------------------------------------------------------------------------------------------------
// A package's licence

/** Whom a licence's copyright line names (`Copyright (c) 2015-present Titus Wormer <…>` → `Titus Wormer`). */
function holderIn(text) {
  const line = text?.match(/^[ \t]*(?:portions[ \t]+)?copyright\b[ \t]*(.*)$/im)?.[1];
  const holder = line
    ?.replace(/\(c\)|©/gi, ' ')
    .replace(/\b\d{4}\b(?:\s*[-–,]\s*(?:\d{4}\b|present\b))*/gi, ' ')
    .replace(/^\s*(?:by\s+)?/i, '')
    .replace(/[<(].*$/, '')
    .replace(/\s*all rights reserved\.?/i, '')
    .replace(/[.,;:\s]+$/, '')
    .trim();
  return holder || null;
}

/** A person as package.json writes one: `Name <mail> (url)`, or { name }. */
const personName = (p) => (typeof p === 'string' ? p.replace(/\s*[<(].*$/, '').trim() : p?.name?.trim()) || null;

/** The owner of a package's repository (`github:owner/name`, `owner/name`, a GitHub address). */
function repositoryOwner(pkg) {
  const url = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
  return url?.match(/^(?:github:)?([\w.-]+)\/[\w.-]+$/)?.[1] ?? url?.match(/github\.com[/:]([\w.-]+)\//)?.[1] ?? null;
}

/** Who made a package (see the top of this file). */
const authorOf = (pkg, text) =>
  personName(pkg.author) ?? personName(pkg.contributors?.[0]) ?? holderIn(text) ?? personName(pkg.maintainers?.[0]) ?? repositoryOwner(pkg);

/** A package's licence by its package.json: `license` (an SPDX expression), or the old `licenses` list. */
const licenseOf = (pkg) =>
  typeof pkg.license === 'string'
    ? pkg.license
    : (pkg.license?.type ??
      (Array.isArray(pkg.licenses) && pkg.licenses.length ? pkg.licenses.map((l) => l.type ?? l).join(' OR ') : null));

const LICENSE_FILE = /^(licen[cs]e|copying|copyright|notice|ofl)([-_.][\w.-]*)?$/i;
const CODE = /\.(m?[jt]sx?|cjs|astro|css|json|map)$/;

/** The texts of a package's licence: its LICENSE files (LICENSE, LICENSE.md, LICENSE-MIT, LICENCE.txt, COPYING …) and its
 * NOTICE. */
function licenseFileText(dir) {
  const texts = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && LICENSE_FILE.test(e.name) && !CODE.test(e.name))
    .map((e) => e.name)
    .sort()
    .map((f) => read(join(dir, f)))
    .filter(Boolean);
  return texts.length ? texts.join('\n\n') : null;
}

/** A licence's standard text (license-texts/<SPDX>.txt) with its copyright line naming the holder, for a work without a
 * text of its own; null when the editor has none for it, or it needs a holder and has none. */
export function standardText(license, holder) {
  if (!/^[\w.+-]+$/.test(license ?? '')) return null;
  const file = fileURLToPath(new URL(`./license-texts/${license}.txt`, import.meta.url));
  if (!existsSync(file)) return null;
  const text = read(file);
  if (text.includes('{{copyright}}') && !holder) return null;
  return text.replace('{{copyright}}', holder ?? '');
}

/** An npm package as "Licenser" shows it, from its folder: its name, version, who made it, its licence and its text
 * (`standard`: the licence's standard text, as the package has none of its own). */
export function packageInfo(dir) {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const own = licenseFileText(dir);
  const author = authorOf(pkg, own);
  const license = licenseOf(pkg);
  const text = own ?? standardText(license, author);
  return { name: pkg.name, version: pkg.version ?? null, author, license, text, ...(own || !text ? {} : { standard: true }) };
}

/** What is missing for a work's licence to be shown, as sentences (`at`: where it is from): its licence, its text, who
 * made it. */
export function workProblems(work, at) {
  const problems = [];
  if (!work.license) problems.push(`${at}: ${work.name} siger ikke, hvilken licens den har (license i dens package.json).`);
  else if (!work.text)
    problems.push(
      `${at}: ${work.name} har ingen licenstekst (en LICENSE-fil), og editoren har ingen standardtekst for ${work.license} (packages/editor/lib/license-texts/${work.license}.txt).`,
    );
  if (!work.author) problems.push(`${at}: der står ingen steder i ${work.name}, hvem der har lavet den.`);
  return problems;
}

// ---------------------------------------------------------------------------------------------------
// The icon packs

/** An icon set's licence as the site gives it: its name, version, who made it, its licence's name (SPDX) and the file
 * with its text (from the site's folder, or absolute).
 * @typedef {{ name: string, version?: string | null, author: string, license: string, file: string }} IconSetLicense */

/** An icon pack as the site gives it (licensesIntegration's `iconPacks`, from each pack's manifest): its id (a system
 * pack's folder in packages/editor/icons/, a theme's `<theme>/<pack>`), its own licence, the theme it came with (none for the
 * system's own), and the sets it takes icons from besides its own (`includes`: Material Design Icons' logos), each with
 * its licence; and whether the site and the editor draw with it (`inUse`).
 * @typedef {IconSetLicense & { id: string, theme?: string, inUse?: boolean, includes?: IconSetLicense[] }} IconPack */

const inRoot = (root, file) => (isAbsolute(file) ? file : join(root, file));

/** The works an icon pack is (as "Licenser" shows them): the pack itself (its id `ikoner/<pack id>`), and each set it
 * takes icons from besides its own (`ikoner/<the set's name>`, once for all the packs that take from it, `via` them).
 * @param {IconPack} pack @param {string} root */
export function iconPackWorks(pack, root) {
  const work = (set, id, via) => ({
    id,
    name: set.name,
    version: set.version ?? null,
    author: set.author,
    license: set.license,
    kind: 'icons',
    text: set.file && existsSync(inRoot(root, set.file)) ? read(inRoot(root, set.file)) : null,
    where: [],
    ...(via ? { via: [via] } : {}),
  });
  return [work(pack, `ikoner/${pack.id}`), ...(pack.includes ?? []).map((set) => work(set, `ikoner/${slug(set.name)}`, pack.name))];
}

// ---------------------------------------------------------------------------------------------------
// What an app or a theme imports and declares

/** A package's peerDependencies but the optional ones (peerDependenciesMeta): those it needs installed beside it. This
 * package's optional ones are the tools its commands run with (bin/interstellar.mjs), not code it is built on. */
const requiredPeers = (pkg) => Object.keys(pkg.peerDependencies ?? {}).filter((name) => !pkg.peerDependenciesMeta?.[name]?.optional);

/** The packages that are the system (the editor and what it is built on: its required peerDependencies), which an app
 * or a theme uses without declaring them: their licences are under the editor's. */
export function systemPackages() {
  const editor = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  return new Set([editor.name, ...requiredPeers(editor)]);
}

const SOURCE = /\.(m?[jt]sx?|astro|css)$/;
const builtins = new Set(builtinModules);

/** The packages a folder's code imports by name (`from 'motion'`, `import('…')`, CSS `@import '…'` and `@plugin '…'`;
 * not `import type`, which ships nothing), each with the files that import it: not node's own, the site's aliases
 * (@theme/, @site/, @data/, @saturn/) or Vite's and Astro's virtual modules. */
export function importsIn(folder) {
  const found = new Map();
  if (!existsSync(folder)) return found;
  for (const entry of readdirSync(folder, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !SOURCE.test(entry.name)) continue;
    const file = join(entry.parentPath, entry.name);
    // Not the packages inside the folder (the folder itself may be a package's: the CMS's standard theme).
    if (posix(relative(folder, file)).split('/').includes('node_modules')) continue;
    // Without comments, so an import in a sentence about it is not one.
    const code = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
    const specifiers = [
      ...code.matchAll(/\b(?:import|export)\s+(?!type\b)[\w*{}\s,$]*?\bfrom\s*['"]([^'"]+)['"]/g),
      ...code.matchAll(/\bimport\s*['"]([^'"]+)['"]/g),
      ...code.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g),
      ...code.matchAll(/@(?:import|plugin)\s+(?:url\()?\s*['"]([^'"]+)['"]/g),
    ].map((m) => m[1]);
    for (const specifier of specifiers) {
      if (/^(\.|\/|node:|@theme\/|@site\/|@data\/|@saturn\/|virtual:|astro:|https?:|data:|\$)/.test(specifier) || specifier.startsWith('#'))
        continue;
      const name = packageName(specifier);
      if (builtins.has(name)) continue;
      if (!found.has(name)) found.set(name, []);
      found.get(name).push(file);
    }
  }
  return found;
}

/** An app's or a theme's id among the licences ("Licenser": its group, its own licence's page), and where it brings
 * something (a shipped package's `where`): `app/<id>`, `tema/<id>`. */
export const ownerId = (kind, id) => `${kind === 'app' ? 'app' : 'tema'}/${id}`;

/** A text's id in an address (`Pictogrammers Free License` → `pictogrammers-free-license`). */
const slug = (text) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** A work an app or a theme declares (an entry of its `thirdParty`), as "Licenser" shows it, with its licence's text:
 * an npm package's from its folder (its id its name), with the `author` and the licence `file` (in the app's or the
 * theme's folder) it declares in place of what the package does not have; another work's as declared, with the text of
 * its licence file (its id `<owner>/<its name>`). A theme's icon packs are not declared: their manifests say it
 * (iconPackWorks). @param {object} entry @param {{ folder: string, owner: string }} where */
export function declaredWork(entry, { folder, owner }) {
  const own = (file) => (typeof file === 'string' && existsSync(join(folder, file)) ? read(join(folder, file)) : null);
  if (entry.package) {
    const dir = packageDir(entry.package, folder);
    const info = dir ? packageInfo(dir) : { name: entry.package, version: null, author: null, license: null, text: null };
    const author = entry.author ?? info.author;
    // A package without a text of its own: the licence's standard text, with the author it declares.
    const fromFile = typeof entry.file === 'string';
    const text = fromFile ? own(entry.file) : info.standard || !info.text ? standardText(info.license, author) : info.text;
    return {
      name: info.name,
      version: info.version,
      license: info.license,
      id: entry.package,
      author,
      text,
      kind: entry.kind,
      ...(!fromFile && text && (info.standard || !info.text) ? { standard: true } : {}),
    };
  }
  return {
    id: `${owner}/${slug(String(entry.name ?? ''))}`,
    name: entry.name,
    version: entry.version ?? null,
    author: entry.author,
    license: entry.license,
    kind: entry.kind,
    text: own(entry.file),
  };
}

/** An app's or a theme's own licence (with its text, LICENSE in its folder, when it is not UNLICENSED) and the works it
 * declares, as "Licenser" and the store show them. */
export function declaredWorks({ license, thirdParty }, where) {
  const file = join(where.folder, OWN_LICENSE_FILE);
  const text = license && license !== UNLICENSED && existsSync(file) ? read(file) : null;
  return { license, text, works: (Array.isArray(thirdParty) ? thirdParty : []).map((entry) => declaredWork(entry, where)) };
}

/** What is wrong with what an app or a theme declares (`license`, its own licence, and `thirdParty`, the third-party
 * work it brings), as sentences for npm run check:content: a declaration that is missing or not as it must be, a
 * package it imports that is not declared (or one declared it does not import), a work without a licence it can show,
 * and a licence file that is not there. `where`: the file it is declared in; `what`: the app or the theme, as a sentence
 * names it; `owner`: its id (ownerId).
 * @param {{ license: unknown, thirdParty: unknown, folder: string, where: string, what: string, owner: string,
 *   root: string }} declared */
export function declarationProblems({ license, thirdParty, folder, where, what, owner, root }) {
  const problems = [];
  const fix = `Skriv det i ${where}.`;
  const rel = (file) => posix(relative(root, join(folder, file)));
  if (typeof license !== 'string' || !license.trim())
    problems.push(
      `${where}: licensen for ${what} selv mangler (license: "${UNLICENSED}", når alle rettigheder er forbeholdt, ellers fx "MIT"). ${fix}`,
    );
  else if (license !== UNLICENSED && !existsSync(join(folder, OWN_LICENSE_FILE)))
    problems.push(`${where}: ${what} har licensen ${license}, men ${rel(OWN_LICENSE_FILE)} med licensens tekst findes ikke.`);
  if (!Array.isArray(thirdParty)) {
    problems.push(
      `${where}: thirdParty mangler, listen over det, ${what} har med fra andre: skrifter, ikoner, biblioteker og billeder ([], når der intet er). ${fix}`,
    );
    return problems;
  }
  const system = systemPackages();
  const declared = new Set();
  for (const [i, entry] of thirdParty.entries()) {
    const at = `${where}: thirdParty[${i}]`;
    if (!entry || typeof entry !== 'object') {
      problems.push(`${at} er ikke et værk: { "package", "kind" } eller { "name", "author", "license", "file", "kind" }.`);
      continue;
    }
    if (!LICENSE_KINDS.includes(entry.kind)) problems.push(`${at}: kind skal være ${LICENSE_KINDS.join(', ')}.`);
    if (typeof entry.file === 'string' && !existsSync(join(folder, entry.file)))
      problems.push(`${at}: licensfilen ${rel(entry.file)} findes ikke.`);
    if (entry.package) {
      declared.add(entry.package);
      if (system.has(entry.package))
        problems.push(
          `${at}: ${entry.package} er en del af editoren (dens peerDependencies), og dens licens står allerede under editoren. Tag den ud.`,
        );
      else if (!packageDir(entry.package, folder)) problems.push(`${at}: pakken ${entry.package} er ikke installeret (npm install).`);
      else
        problems.push(
          ...workProblems(declaredWork(entry, { folder, owner }), at).map((p) =>
            p.includes('licenstekst')
              ? `${p} Læg licensens tekst i en fil i mappen, og skriv den som file.`
              : p.includes('hvem der')
                ? `${p} Skriv det som author.`
                : p,
          ),
        );
    } else {
      for (const key of ['name', 'author', 'license', 'file'])
        if (typeof entry[key] !== 'string' || !entry[key].trim())
          problems.push(
            `${at}: et værk, der ikke er en npm-pakke, har ${key}: dets navn, hvem der har lavet det, licensens navn og filen med licensen.`,
          );
    }
  }
  const imported = importsIn(folder);
  for (const [name, files] of imported) {
    if (system.has(name) || declared.has(name)) continue;
    problems.push(
      `${posix(relative(root, files[0]))}: ${what} bruger pakken ${name}, men den står ikke i thirdParty i ${where}, så dens licens kan ikke vises. Skriv { "package": "${name}", "kind": "…" } dér.`,
    );
  }
  for (const name of declared)
    if (!imported.has(name) && !system.has(name))
      problems.push(`${where}: ${what} har ${name} i thirdParty, men bruger den ikke. Tag den ud.`);
  return problems;
}

// ---------------------------------------------------------------------------------------------------
// What the site's and the editor's code uses (npm run check:content)

/** What is missing for the licences of the packages the site's and the editor's code imports (in `folders`, from the
 * site's folder) and those they depend on to be shown, as sentences: more than the build ships (a package the server
 * or the build alone runs too), so that whatever is shipped has one. `skip`: the packages an app or a theme declares,
 * checked with what it gives in place of what a package lacks (declarationProblems); those they depend on are not.
 * @param {string} root @param {string[]} folders @param {Set<string>} [skip] */
export function codePackageProblems(root, folders, skip = new Set()) {
  const problems = [];
  const seen = new Set();
  const walk = (name, from, by) => {
    const dir = packageDir(name, from);
    if (!dir || seen.has(dir)) return;
    seen.add(dir);
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    // A program for one kind of computer (`os`, `cpu`: sharp's libvips) runs where the site is built, never in a browser.
    if (pkg.os || pkg.cpu) return;
    if (!pkg.private && !skip.has(name)) problems.push(...workProblems(packageInfo(dir), by));
    for (const next of [...Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies }), ...requiredPeers(pkg)])
      walk(next, dir, `${by.split(':')[0]}: pakken ${name}`);
  };
  for (const folder of folders)
    for (const [name, files] of importsIn(join(root, folder))) walk(name, dirname(files[0]), posix(relative(root, files[0])));
  return problems;
}

// ---------------------------------------------------------------------------------------------------
// What the build ships

// This package's folder: in the site's packages/editor/ or in node_modules/@interstellarcms/cms/.
const PACKAGE = fileURLToPath(new URL('..', import.meta.url));
/** Whether a file is this package's own (not one of the packages it uses). @param {string} file */
const isOwn = (file) => {
  const path = posix(relative(PACKAGE, file));
  return !path.startsWith('../') && !isAbsolute(path) && !path.split('/').includes('node_modules');
};
/** The folder of the package a file of the bundle is in, but none for this package's own: those are where the editor,
 * the site's pages or the standard theme bring what they use. @param {string} file */
const libraryDirOf = (file) => (isOwn(file) ? null : packageDirOf(file));

/** Who brings a file of the site, by its folder: the standard theme (this package's theme/), the site's pages and
 * what they read (this package's pages/ but /editor/, and site/), the rest of the editor (this package), a theme
 * (src/themes/<id>/), an app (src/apps/<id>/), or the site's own code (the rest). */
function whereOf(file, root) {
  const inPackage = posix(relative(PACKAGE, file));
  if (isOwn(file)) {
    if (inPackage.startsWith('theme/')) return ownerId('theme', 'saturn');
    if (/^(site|pages)\//.test(inPackage) && !inPackage.startsWith('pages/editor/')) return 'site';
    return 'editor';
  }
  const path = posix(relative(root, file));
  const own = path.match(/^src\/(themes|apps)\/([^/]+)\//);
  if (own) return ownerId(own[1] === 'apps' ? 'app' : 'theme', own[2]);
  return 'site';
}

/** The bundler's helpers that it writes into the bundle (Vite's and Rolldown's virtual modules): their package. The
 * site's own virtual modules (the apps' folders, the theme's icons) are made of its own files. */
const HELPERS = [
  [/^\0vite\//, 'vite'],
  [/^\0rolldown\//, 'rolldown'],
];
const OWN_VIRTUAL = [/^\0virtual:app-folders$/, /^\0site-theme-icons?(:|$)/];

/** An app or a theme as licensesIntegration takes it: its kind and id, its name, version and who made it, its manifest
 * (its defineApp or its theme.json, with `license` and `thirdParty`), its folder, and whether the site is built with it
 * (an app installed; the theme in use, and the standard theme it builds on).
 * @typedef {{ kind: 'app' | 'theme', id: string, name: string, version?: string | null, author: string,
 *   manifest: { license?: string, thirdParty?: object[] }, folder: string, inUse: boolean }} Owner */

/** The apps (all in src/apps/, their defineApp as `load` loads it) and the themes (all in src/themes/, their
 * theme.json) as licensesIntegration takes them; `themesInUse`: those the site is built with.
 * @param {string} root @param {(id: string) => Promise<any>} load @param {string[]} themesInUse
 * @returns {Promise<Owner[]>} */
export async function siteOwners(root, load, themesInUse) {
  const installed = installedApps(root);
  const apps = [];
  for (const id of appIds(root).filter((x) => existsSync(join(root, 'src/apps', x, 'index.ts')))) {
    const app = await load(id);
    apps.push({
      kind: 'app',
      id,
      name: app.label,
      version: app.version ?? null,
      author: app.publisher,
      manifest: app,
      folder: join(root, 'src/apps', id),
      inUse: installed.includes(id),
    });
  }
  // The standard theme, this package's theme/ (STANDARD_THEME in site/theme.mjs), and the site's in src/themes/.
  const dir = join(root, 'src/themes');
  const folders = [
    { id: 'saturn', folder: fileURLToPath(new URL('../theme', import.meta.url)) },
    ...(existsSync(dir) ? readdirSync(dir, { withFileTypes: true }) : [])
      .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'theme.json')))
      .map((d) => ({ id: d.name, folder: join(dir, d.name) })),
  ];
  const themes = folders.map(({ id, folder }) => {
    const manifest = JSON.parse(readFileSync(join(folder, 'theme.json'), 'utf8'));
    return {
      kind: 'theme',
      id,
      name: manifest.name,
      version: manifest.version ?? null,
      author: manifest.author,
      manifest,
      folder,
      inUse: themesInUse.includes(id),
    };
  });
  return [...apps, ...themes];
}

/** The Astro integration that finds the licences of what the build ships and writes them, with the icon sets' and the
 * apps' and themes' own and declared, to dist/editor/licenses.json (see the top of this file). `iconPacks`: the icon
 * packs there are, the system's and the themes' (IconPack); `owners`: the apps and the themes (Owner, siteOwners).
 * Stops the build when
 * something shipped has no licence it can show, or comes from somewhere the list cannot name.
 * @param {{ root: string, iconPacks: () => IconPack[], owners: () => Promise<Owner[]> }} options
 * @returns {import('astro').AstroIntegration} */
export function licensesIntegration({ root, iconPacks, owners }) {
  // Each package shipped: its folder, the kinds it is shipped as, who brings it and through which packages.
  const shipped = new Map();
  const unknown = new Set();
  const note = (dir, kind, where, via) => {
    if (!shipped.has(dir)) shipped.set(dir, { kinds: new Set(), where: new Set(), via: new Set() });
    const x = shipped.get(dir);
    x.kinds.add(kind);
    if (where) x.where.add(where);
    if (via && via !== dir) x.via.add(via);
  };
  const helperOf = (id) => HELPERS.find(([re]) => re.test(id))?.[1];

  /** The packages a stylesheet of the site imports, followed through its own @imports (a theme's global.css → the
   * standard theme's base.css → tailwindcss), each with the file that imports it. */
  const cssImports = (file, seen = new Set()) => {
    if (seen.has(file) || !existsSync(file)) return [];
    seen.add(file);
    const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    return [...css.matchAll(/@(?:import|plugin)\s+(?:url\()?\s*['"]([^'"]+)['"]/g)].flatMap(([, spec]) =>
      spec.startsWith('.') ? cssImports(join(dirname(file), spec), seen) : /^(\/|https?:|data:)/.test(spec) ? [] : [{ spec, file }],
    );
  };

  const plugin = {
    name: 'site-licenses',
    generateBundle(_, bundle) {
      const client = this.environment?.name === 'client';
      const info = (id) => this.getModuleInfo(id);
      // The site's files that import a module of a package first (its importers, up to the site's own files): who
      // brings it, and through which package.
      const usersOf = (id) => {
        const found = [];
        const seen = new Set([id]);
        let next = [id];
        while (next.length && found.length < 50) {
          const after = [];
          for (const m of next)
            for (const by of [...(info(m)?.importers ?? []), ...(info(m)?.dynamicImporters ?? [])]) {
              if (seen.has(by)) continue;
              seen.add(by);
              if (by.startsWith('\0') || libraryDirOf(by)) after.push(by);
              else found.push({ where: whereOf(by.split('?')[0], root), via: libraryDirOf(m) });
            }
          next = after;
        }
        return found;
      };
      for (const file of Object.values(bundle)) {
        if (file.type === 'asset') {
          // A file a package brings (a font its stylesheet points to), from either build.
          for (const original of file.originalFileNames ?? []) {
            const dir = original.includes('node_modules/') ? packageDirOf(join(root, original)) : null;
            if (dir) note(dir, /\.(woff2?|ttf|otf|eot)$/i.test(original) ? 'font' : 'library', null);
          }
          continue;
        }
        for (const id of file.moduleIds ?? Object.keys(file.modules)) {
          const path = id.split('?')[0];
          // The pages' styles are in the server's build too (they are written into the pages): its stylesheets'.
          if (/\.css$/.test(path) && (!path.includes('/node_modules/') || isOwn(path)) && !id.startsWith('\0'))
            for (const { spec, file: by } of cssImports(path)) {
              const dir = packageDir(packageName(spec), dirname(by));
              if (dir) note(dir, 'library', whereOf(by, root));
              else unknown.add(`${posix(relative(root, by))}: ${spec}`);
            }
          // Only the browser's bundle is downloaded as code.
          if (!client) continue;
          if (id.startsWith('\0')) {
            const helper = helperOf(id);
            if (helper) note(packageDir(helper, root), 'library', 'site');
            else if (!OWN_VIRTUAL.some((re) => re.test(id))) unknown.add(id.slice(1));
            continue;
          }
          // This package itself (the CMS, MIT), where its own code is shipped.
          if (isOwn(path)) {
            note(realpathSync(PACKAGE), 'library', whereOf(path, root));
            continue;
          }
          const dir = packageDirOf(path);
          if (!dir) continue;
          const users = usersOf(id);
          if (!users.length) note(dir, 'library', 'site');
          for (const { where, via } of users) note(dir, 'library', where, via);
        }
      }
    },
  };

  return {
    name: 'site-licenses',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => updateConfig({ vite: { plugins: [plugin] } }),
      'astro:build:done': async ({ dir, logger }) => {
        const built = fileURLToPath(dir);
        // Astro's islands: the script that wakes them, which Astro writes into every page with one.
        const pages = readdirSync(built, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.html'));
        if (pages.some((f) => readFileSync(join(built, f), 'utf8').includes('<astro-island')))
          note(packageDir('astro', root), 'library', 'site');
        const problems = [...unknown].map(
          (id) =>
            `${id}: kommer med på sitet, men ikke fra en pakke, så licensen kan ikke findes. Skriv i packages/editor/lib/licenses.mjs, hvor det kommer fra.`,
        );

        const works = new Map();
        const add = (work) => {
          const had = works.get(work.id);
          works.set(work.id, had ? { ...work, ...had, where: [...new Set([...had.where, ...work.where])].sort() } : work);
        };
        // What is shipped: a package that brings a font is the font.
        for (const [dir, x] of shipped) {
          const info = packageInfo(dir);
          const via = [...x.via].map((d) => packageInfo(d).name).filter((n) => n !== info.name);
          const work = {
            ...info,
            id: info.name,
            kind: x.kinds.has('font') ? 'font' : 'library',
            where: [...x.where].sort(),
            ...(via.length ? { via: [...new Set(via)].sort() } : {}),
          };
          problems.push(...workProblems(work, 'Licenser'));
          add(work);
        }
        // The icon packs, each with the sets it takes icons from besides its own; a theme's under it (its packs).
        const packs = iconPacks();
        const packWorks = new Map();
        for (const pack of packs) {
          const own = iconPackWorks(pack, root);
          // The pack the site and the editor draw with is used there; a theme's own is the theme's.
          own[0].where = [...(pack.inUse ? ['editor', 'site'] : []), ...(pack.theme ? [ownerId('theme', pack.theme)] : [])];
          for (const work of own) {
            problems.push(...workProblems(work, `Ikonpakken ${pack.name}`));
            const had = works.get(work.id);
            works.set(work.id, had ? { ...had, via: [...new Set([...(had.via ?? []), ...(work.via ?? [])])].sort() } : work);
          }
          if (pack.theme) packWorks.set(pack.theme, [...(packWorks.get(pack.theme) ?? []), ...own.map((w) => w.id)]);
        }

        // The apps' and the themes' own licences and what they declare (checked by npm run check:content, with what they
        // give in place of what a package lacks), shipped or not; and what is shipped through them alone.
        const owned = [];
        for (const o of await owners()) {
          const id = ownerId(o.kind, o.id);
          const { license, text, works: declared } = declaredWorks(o.manifest, { folder: o.folder, owner: id });
          for (const work of declared) {
            const shippedAs = works.get(work.id);
            // A declared package that is shipped keeps what the bundle says of it, and its declaration's kind.
            if (shippedAs && work.kind !== 'icons') works.set(work.id, { ...shippedAs, kind: work.kind });
            // Not downloaded though the site is built with it (the Worker's, the build's, a font another theme's replaces).
            else if (!shippedAs) add({ ...work, where: [], ...(o.inUse ? { shipped: false } : {}) });
            if (o.inUse) add({ ...works.get(work.id), where: [id] });
          }
          const through = [...works.values()].filter(
            (w) => w.where.includes(id) && !w.where.some((x) => x === 'editor' || x === 'site') && !declared.some((d) => d.id === w.id),
          );
          owned.push({
            id,
            kind: o.kind,
            key: o.id,
            name: o.name,
            version: o.version ?? null,
            author: o.author,
            license: license ?? null,
            text,
            works: [
              ...declared.map((w) => w.id),
              ...through.map((w) => w.id).sort(),
              ...(o.kind === 'theme' ? (packWorks.get(o.id) ?? []) : []),
            ],
            inUse: o.inUse,
          });
        }
        if (problems.length) throw new Error(`Licenserne kan ikke vises:\n${[...new Set(problems)].join('\n')}`);
        const all = [...works.values()].sort((a, b) => a.name.localeCompare(b.name));
        mkdirSync(join(built, 'editor'), { recursive: true });
        writeFileSync(join(built, 'editor', 'licenses.json'), `${JSON.stringify({ works: all, owners: owned })}\n`);
        logger.info(
          `${shipped.size} pakker på sitet og i editoren, ${packs.length} ikonpakker og ${owned.length} apps og temaer med deres licenser i editor/licenses.json.`,
        );
      },
    },
  };
}

// ---------------------------------------------------------------------------------------------------
// The store

/** An app's or a theme's licences as the store's catalog has them (StoreLicenses in src/licenses.ts): its own licence's
 * name, and each work's name, version, who made it, its licence's name and kind, without the texts.
 * @param {{ license?: string, thirdParty?: object[] }} manifest @param {{ folder: string, owner: string }} where */
export function storeLicenses(manifest, where) {
  const { license, works } = declaredWorks(manifest, where);
  return { license, works: works.map(({ name, version, author, license, kind }) => ({ name, version, author, license, kind })) };
}
