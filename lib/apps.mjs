// A site folder in src/apps/ named app_ or theme_ that is not a store id stops the build (appIds, strayStoreId).
// What an app (src/apps/<app>/, packages/editor/src/apps.ts) can have outside the editor and the pages, each only while
// it is installed and not turned off (src/data/apps.json, "off"):
//   worker.js  its part of the site's Worker: its own addresses, /api/<app>/… (`fetch`), and what it does each hour
//              (`scheduled`). The Worker cannot find files itself, so worker/apps.js imports each one; this file writes
//              it (writeAppWorkers, npx morpheme app-workers), and npm run check:content says when it is out of date.
//   build.mjs  a step after the site is built (`export default async function ({ dir, out, root, logger })`), e.g. a
//              file the app's Worker reads: `out` is the app's own folder in the build, dist/_apps/<app>/, which the
//              Worker serves to no one (only to itself, through env.ASSETS).
// And what is in each app's folder, for the editor (APP_FOLDERS): its page says from it what the app needs.
// No TypeScript here: the build (packages/editor/astro.mjs) and the scripts read it.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { activeOf, readAppsFile } from './appsFile.mjs';
import { strayStoreId } from './storeEntries.mjs';

/** Where an app's files from the build are, in the build (dist/) and so on the site (served only to the Worker). */
export const APP_FILES = '_apps';

const APPS = 'src/apps';
const INSTALLED = 'src/data/apps.json';
const WORKERS = 'worker/apps.js';

/** The ids of the apps, all of them (the folders in src/apps/). Stops on a folder that starts with `app_` or `theme_` but
 * is not a store id of an app. @param {string} root */
export const appIds = (root) => {
  const ids = existsSync(join(root, APPS))
    ? readdirSync(join(root, APPS), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];
  const stray = ids.find((id) => strayStoreId(id, 'app'));
  if (stray)
    throw new Error(
      `${APPS}/${stray}: the folder name looks like a store id but is not one. A store app id is app_ and 16 lowercase hex characters; rename the folder.`,
    );
  return ids;
};

/** The state of src/data/apps.json: the apps installed and those turned off. @param {string} root */
function appsState(root) {
  try {
    return readAppsFile(readFileSync(join(root, INSTALLED), 'utf8'));
  } catch {
    return readAppsFile(undefined);
  }
}

/** The ids of the apps installed, also those turned off. @param {string} root @returns {string[]} */
export const installedApps = (root) => appsState(root).installed;

/** The ids of the apps installed and not turned off: those that run. @param {string} root @returns {string[]} */
export const activeApps = (root) => activeOf(appsState(root));

/** worker/apps.js as it must be: an import of each app's worker.js, installed or not (the Worker answers only for
 * those installed), and of its texts.ts, for its notifications on the phone in the editor's other languages
 * (packages/editor/worker/push.js). @param {string} root */
export function appWorkersFile(root) {
  const ids = appIds(root).filter((id) => existsSync(join(root, APPS, id, 'worker.js')));
  const name = (id) => id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
  const texts = ids.filter((id) => existsSync(join(root, APPS, id, 'texts.ts')));
  const key = (id) => (/^[A-Za-z_$][\w$]*$/.test(id) ? id : `'${id}'`);
  const entry = (id, value) => (value === id ? id : `${key(id)}: ${value}`);
  const object = (entries) => (entries.length ? `{ ${entries.join(', ')} }` : '{}');
  return [
    '// Written by packages/editor/lib/apps.mjs (writeAppWorkers): the part of the Worker of each app',
    "// that has one (src/apps/<app>/worker.js), and its texts. Don't edit it; `npx morpheme app-workers` writes it again.",
    ...ids.map((id) => `import ${name(id)} from '../${APPS}/${id}/worker.js';`),
    ...texts.map((id) => `import { texts as ${name(id)}Texts } from '../${APPS}/${id}/texts.ts';`),
    '',
    `export const appWorkers = ${object(ids.map((id) => entry(id, name(id))))};`,
    '',
    `export const appTexts = ${object(texts.map((id) => entry(id, `${name(id)}Texts`)))};`,
    '',
  ].join('\n');
}

/** The text with its line endings as \n, as git on Windows may check it out with \r\n. @param {string} text */
const lf = (text) => text.replace(/\r\n/g, '\n');

/** Writes worker/apps.js when it is not as it must be; true when it wrote it. @param {string} root */
export function writeAppWorkers(root) {
  const file = join(root, WORKERS);
  const text = appWorkersFile(root);
  if (existsSync(file) && lf(readFileSync(file, 'utf8')) === text) return false;
  writeFileSync(file, text);
  return true;
}

/** What is wrong with worker/apps.js (npm run check:content), as sentences. @param {string} root */
export function appWorkersProblems(root) {
  const file = join(root, WORKERS);
  return existsSync(file) && lf(readFileSync(file, 'utf8')) === appWorkersFile(root)
    ? []
    : [`${WORKERS} does not match the apps' worker.js. Run npx morpheme app-workers and commit the file.`];
}

/** The Astro integration that runs each installed app's build.mjs after the site is built (packages/editor/astro.mjs).
 * @param {string} root @returns {import('astro').AstroIntegration} */
export function appBuilds(root) {
  return {
    name: 'app-builds',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const built = fileURLToPath(dir);
        for (const id of activeApps(root)) {
          const step = join(root, APPS, id, 'build.mjs');
          if (!existsSync(step)) continue;
          const out = join(built, APP_FILES, id);
          mkdirSync(out, { recursive: true });
          const { default: run } = await import(pathToFileURL(step).href);
          await run({ dir: built, out, root, logger: logger.fork(id) });
        }
      },
    },
  };
}

/** The module with what is in each app's folder (appFoldersPlugin): its files, by their paths in it, and its csp.json,
 * so the editor can say what an app needs (needsOf in src/store.ts) without loading its code. */
export const APP_FOLDERS = 'virtual:app-folders';

/** Each app's files, by their paths in its folder, and its csp.json, by its id.
 * @param {string} root @returns {Record<string, { files: string[], csp?: Record<string, string[]> }>} */
export function appFolders(root) {
  return Object.fromEntries(
    appIds(root).map((id) => {
      const folder = join(root, APPS, id);
      const files = readdirSync(folder, { recursive: true, withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) =>
          join(e.parentPath, e.name)
            .slice(folder.length + 1)
            .split(sep)
            .join('/'),
        )
        .sort();
      let csp;
      try {
        csp = JSON.parse(readFileSync(join(folder, 'csp.json'), 'utf8'));
      } catch {}
      return [id, csp ? { files, csp } : { files }];
    }),
  );
}

/** The module with a loader for the page-colors hook of each app that is not a contract 4 app (no app.json), so the
 * site's build bundles and runs only those (site/pageColors.ts). A contract 4 app's hook is code from outside: the build
 * runs it in the sandbox (lib/sandboxHooks.mjs) and never imports it, and Vite never has to resolve its imports. */
export const OLD_PAGE_COLORS = 'virtual:old-page-colors';

/** The source of OLD_PAGE_COLORS: `{ <id>: () => import('/src/apps/<id>/hooks/page-colors.ts') }`.
 * @param {string} root @returns {string} */
export function oldPageColorsModule(root) {
  const loaders = appIds(root)
    .filter((id) => existsSync(join(root, APPS, id, 'hooks/page-colors.ts')) && !existsSync(join(root, APPS, id, 'app.json')))
    .map((id) => `${JSON.stringify(id)}: () => import(${JSON.stringify(`/${APPS}/${id}/hooks/page-colors.ts`)})`);
  return `export default { ${loaders.join(', ')} };`;
}

/** The Vite plugin that gives the editor APP_FOLDERS and the site OLD_PAGE_COLORS (packages/editor/astro.mjs, and the
 * scripts that load the editor).
 * @param {string} root @returns {import('vite').Plugin} */
export function appFoldersPlugin(root) {
  const folders = `\0${APP_FOLDERS}`;
  const colors = `\0${OLD_PAGE_COLORS}`;
  return {
    name: 'app-folders',
    resolveId: (source) => (source === APP_FOLDERS ? folders : source === OLD_PAGE_COLORS ? colors : null),
    load: (source) =>
      source === folders ? `export default ${JSON.stringify(appFolders(root))};` : source === colors ? oldPageColorsModule(root) : null,
  };
}
