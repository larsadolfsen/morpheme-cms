// Checks the site's content by the editor's own rules before it is built (prebuild, and
// `npm run check:content`): every block in the text of the pages and the data files the editor writes
// (checkSite.ts in the editor, packages/editor/). Stops with what is wrong, so a broken page never goes
// out; the site that is out stays as it is; among it every theme (themeProblems, with the icon packs it brings) and
// the system's icon packs and the choice of one (iconPackProblems), and so an icon the site or the editor draws that a
// pack has none for, and the choice of motion scheme (motionProblems), and names in a folder that differ only in case
// (casingProblems). Says too which of the site's texts the
// editor has no translation of (@site/texts, a block's texts.ts); that does not stop the build. The editor's
// code is TypeScript and TSX, so it is loaded with Vite, as the site's own build does. Exits early, without checking, when
// MORPHEME_CONTENT_CHECKED names the commit being built (morpheme ci-build already ran it; already-checked.mjs).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../site/siteConfig.mjs';
import { createServer } from 'vite';
import {
  aliases,
  blockProblems,
  iconPackProblems,
  motionProblems,
  installedThemes,
  themeFolder,
  themePlugin,
  themeProblems,
} from '@morphemecms/cms/site/theme.mjs';
import { appFoldersPlugin, appIds, appWorkersProblems } from '@morphemecms/cms/lib/apps.mjs';
import { appSelf } from '@morphemecms/cms/site/appSelf.mjs';
import { caseCollisionProblems } from '@morphemecms/cms/lib/caseCollisions.mjs';
import { codePackageProblems, declarationProblems, ownerId } from '@morphemecms/cms/lib/licenses.mjs';
import { breakpointProblems } from '@morphemecms/cms/site/breakpoints.mjs';
import { casingProblems } from '../site/casing.mjs';
import { BUILD_SETTINGS_PATH } from '../lib/build-settings.mjs';
import { buildSettingsProblems } from './build-settings-problems.mjs';
import { textProblems } from './text-problems.mjs';
import { notesOf, releaseProblems } from './releases.mjs';
import { alreadyChecked } from './already-checked.mjs';

// morpheme ci-build has run this check for the commit being built.
// Git is asked only then; no repository or no commit yet means "not checked".
if (process.env.MORPHEME_CONTENT_CHECKED) {
  let head = '';
  try {
    head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {}
  if (alreadyChecked(process.env.MORPHEME_CONTENT_CHECKED, head)) {
    console.log(`check:content already ran for ${head.slice(0, 7)}`);
    process.exit(0);
  }
}

const root = `${process.cwd()}/`;
// This package's own code, from the site's root (packages/editor/ or node_modules/@morphemecms/cms/).
const own = relative(root, fileURLToPath(new URL('..', import.meta.url)));
const { allowedCspProblems, appCspProblems } = await import('../site/siteCsp.mjs');
const { appCookieProblems } = await import('../site/appCookies.mjs');

// With the redirects' other two files (siteRedirects in src/site/config.ts): none may send on through another.
const files = ['src/content', 'src/data']
  .filter((dir) => existsSync(dir))
  .flatMap((dir) =>
    readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile() && /\.(md|json)$/.test(e.name))
      .map((e) => join(e.parentPath, e.name).replaceAll('\\', '/')),
  )
  .concat([config.siteRedirects.rules, config.siteRedirects.map])
  .map((path) => ({ path, text: readFileSync(path, 'utf8') }));

const server = await createServer({
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  // As in packages/editor/astro.mjs: the editor takes the site from src/site/ as @site, and the theme in use as @theme.
  plugins: [themePlugin(), appFoldersPlugin(process.cwd()), appSelf()],
  resolve: { alias: aliases() },
  server: { middlewareMode: true, hmr: false, ws: false },
});
let result, missing, enTexts;
// The licences ("Licenser" under "Indstillinger", @morphemecms/cms/lib/licenses.mjs): each app's own and those of the
// third-party work it brings (its defineApp), installed or not, as each theme's (themeProblems), with the packages they
// declare, which they give what a package lacks for.
const licenses = [];
const declared = new Set();
// The apps and themes of the app store, against what the catalog has released of them (releases.mjs).
let catalog = {};
const releases = [];
try {
  const { problemsOf, untranslated } = await server.ssrLoadModule('@morphemecms/cms/src/checkSite.ts');
  result = problemsOf(files);
  missing = untranslated();
  // The editor's English texts against Material 3's rules for writing (text-problems.mjs).
  enTexts = textProblems((await server.ssrLoadModule('@morphemecms/cms/src/i18n/en-US/index.ts')).enUS);
  if (existsSync('store/catalog.json')) catalog = JSON.parse(readFileSync('store/catalog.json', 'utf8'));
  for (const id of appIds(root)) {
    const app = (await server.ssrLoadModule(`/src/apps/${id}/index.ts`)).default;
    for (const x of app.thirdParty ?? []) if (x?.package) declared.add(x.package);
    if (app.version)
      releases.push(
        ...releaseProblems(catalog, {
          kind: 'apps',
          id,
          folder: `src/apps/${id}`,
          version: app.version,
          notes: notesOf(app.releaseNotes),
          where: `src/apps/${id}/index.ts`,
        }),
      );
    licenses.push(
      ...declarationProblems({
        license: app.license,
        thirdParty: app.thirdParty,
        folder: join(root, 'src/apps', id),
        where: `src/apps/${id}/index.ts`,
        what: `appen ${app.label}`,
        owner: ownerId('app', id),
        root,
      }),
    );
  }
} finally {
  await server.close();
}

for (const [locale, files] of Object.entries(missing)) {
  for (const [file, texts] of Object.entries(files)) {
    console.warn(`\nEditoren viser ${texts.length} af sitets tekster uoversat på ${locale}. Skriv dem i ${file}:\n`);
    for (const text of texts) console.warn(`  ${JSON.stringify(text)}`);
  }
}

// The editor's English texts follow Material 3's rules for writing (text-problems.mjs).
result.problems.push(...enTexts);
// Every theme installed has what a theme must have (the standard theme all of it), so the owner can swap to any of them
// on "Udseende".
result.problems.push(...installedThemes().flatMap(themeProblems), ...iconPackProblems(), ...motionProblems());
// Every block is drawn from its view, on the site and in the editor alike.
result.problems.push(...blockProblems());
result.problems.push(...breakpointProblems(root));
// What each app loads from elsewhere is in its csp.json, so the pages' Content-Security-Policy lets it through.
result.problems.push(...appCspProblems());
// The addresses allowed in the editor after the policy stopped them are written as an app's csp.json.
result.problems.push(...allowedCspProblems());
// The cookies each app sets are in its cookies.json, for the cookie list in the cookie policy.
result.problems.push(...appCookieProblems());
// The Worker has the part of each app that has one (worker/apps.js).
result.problems.push(...appWorkersProblems(root));
// No two files of the package or the site differ only by case (an import would find the wrong one on Windows).
result.problems.push(...caseCollisionProblems(root, [own, 'src']));
// Every app and theme says what its licence is and what it brings (the icon packs say theirs, themeProblems), and
// every package the site's and the editor's code imports, and those they depend on, has a licence the editor can show
// under "Licenser" (more than the build ships, which stops on its own when something it ships has none).
for (const theme of installedThemes())
  for (const x of JSON.parse(readFileSync(`${themeFolder(theme)}/theme.json`, 'utf8')).thirdParty ?? [])
    if (x?.package) declared.add(x.package);
result.problems.push(...licenses, ...codePackageProblems(root, [join(own, 'src'), join(own, 'lib'), 'src'], declared));
// What is changed in an app or a theme of the store since it was released has its next version, once, with its note.
for (const theme of installedThemes()) {
  const manifest = JSON.parse(readFileSync(`${themeFolder(theme)}/theme.json`, 'utf8'));
  if (manifest.store === true)
    releases.push(
      ...releaseProblems(catalog, {
        kind: 'themes',
        id: theme,
        folder: themeFolder(theme),
        version: manifest.version,
        notes: notesOf(manifest.releaseNotes, true),
        where: `${themeFolder(theme)}/theme.json`,
      }),
    );
}
result.problems.push(...releases);
// No two names in a folder differ only in case, so the site builds on Windows and macOS too (casing.mjs). From git's
// list of the files; a site that is no git repository (a fresh starter) has none to give.
let tracked = [];
try {
  tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
} catch {}
result.problems.push(...casingProblems(tracked));
// The build settings the editor writes under "Avanceret": only boolean contentLane and paidBuilds; a missing file passes.
result.problems.push(
  ...buildSettingsProblems(BUILD_SETTINGS_PATH, existsSync(BUILD_SETTINGS_PATH) ? readFileSync(BUILD_SETTINGS_PATH, 'utf8') : undefined),
);

if (result.problems.length) {
  console.error(`\nIndholdet følger ikke editorens regler (${result.problems.length}):\n`);
  for (const line of result.problems) console.error(`  ${line}`);
  console.error('\nRet filerne (eller blokkens felter i src/apps/<app>/blocks/), så bygges sitet igen.\n');
  process.exit(1);
}
console.log(`${result.files} filer og ${result.blocks} blokke følger editorens regler.`);
