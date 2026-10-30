// What an app (src/apps/<app>/, packages/editor/src/apps.ts) can have outside the editor and the pages, each only while
// it is installed (src/data/apps.json):
//   worker.js  its part of the site's Worker: its own addresses, /api/<app>/… (`fetch`), and what it does each hour
//              (`scheduled`). The Worker cannot find files itself, so worker/apps.js imports each one; this file writes
//              it (writeAppWorkers, npx interstellar app-workers), and npm run check:content says when it is out of date.
//   build.mjs  a step after the site is built (`export default async function ({ dir, out, root, logger })`), e.g. a
//              file the app's Worker reads: `out` is the app's own folder in the build, dist/_apps/<app>/, which the
//              Worker serves to no one (only to itself, through env.ASSETS).
// And what is in each app's folder, for the editor (APP_FOLDERS): its page says from it what the app needs.
// No TypeScript here: the build (packages/editor/astro.mjs) and the scripts read it.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Where an app's files from the build are, in the build (dist/) and so on the site (served only to the Worker). */
export const APP_FILES = '_apps';

const APPS = 'src/apps';
const INSTALLED = 'src/data/apps.json';
const WORKERS = 'worker/apps.js';

/** The ids of the apps, all of them (the folders in src/apps/). @param {string} root */
export const appIds = (root) =>
  existsSync(join(root, APPS))
    ? readdirSync(join(root, APPS), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

/** The ids of the apps installed. @param {string} root @returns {string[]} */
export function installedApps(root) {
  try {
    const { installed } = JSON.parse(readFileSync(join(root, INSTALLED), 'utf8'));
    return Array.isArray(installed) ? installed.map(String) : [];
  } catch {
    return [];
  }
}

/** worker/apps.js as it must be: an import of each app's worker.js, installed or not (the Worker answers only for
 * those installed), and of its texts.ts, for its notifications on the phone in the editor's other languages
 * (packages/editor/worker/push.js). @param {string} root */
export function appWorkersFile(root) {
  const ids = appIds(root).filter((id) => existsSync(join(root, APPS, id, 'worker.js')));
  const name = (id) => id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
  const texts = ids.filter((id) => existsSync(join(root, APPS, id, 'texts.ts')));
  const key = (id) => (/^[A-Za-z_$][\w$]*$/.test(id) ? id : `'${id}'`);
  const entry = (id, value) => (value === id ? id : `${key(id)}: ${value}`);
  return [
    '// Written by packages/editor/lib/apps.mjs (writeAppWorkers): the part of the Worker of each app',
    "// that has one (src/apps/<app>/worker.js), and its texts. Don't edit it; `npx interstellar app-workers` writes it again.",
    ...ids.map((id) => `import ${name(id)} from '../${APPS}/${id}/worker.js';`),
    ...texts.map((id) => `import { texts as ${name(id)}Texts } from '../${APPS}/${id}/texts.ts';`),
    '',
    `export const appWorkers = { ${ids.map((id) => entry(id, name(id))).join(', ')} };`,
    '',
    `export const appTexts = { ${texts.map((id) => entry(id, `${name(id)}Texts`)).join(', ')} };`,
    '',
  ].join('\n');
}

/** Writes worker/apps.js when it is not as it must be; true when it wrote it. @param {string} root */
export function writeAppWorkers(root) {
  const file = join(root, WORKERS);
  const text = appWorkersFile(root);
  if (existsSync(file) && readFileSync(file, 'utf8') === text) return false;
  writeFileSync(file, text);
  return true;
}

/** What is wrong with worker/apps.js (npm run check:content), as sentences. @param {string} root */
export function appWorkersProblems(root) {
  const file = join(root, WORKERS);
  return existsSync(file) && readFileSync(file, 'utf8') === appWorkersFile(root)
    ? []
    : [`${WORKERS} passer ikke til appenes worker.js. Kør npx interstellar app-workers, og commit filen.`];
}

/** The Astro integration that runs each installed app's build.mjs after the site is built (packages/editor/astro.mjs).
 * @param {string} root @returns {import('astro').AstroIntegration} */
export function appBuilds(root) {
  return {
    name: 'app-builds',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const built = fileURLToPath(dir);
        for (const id of installedApps(root)) {
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

/** The Vite plugin that gives the editor APP_FOLDERS (packages/editor/astro.mjs, and the scripts that load the editor).
 * @param {string} root @returns {import('vite').Plugin} */
export function appFoldersPlugin(root) {
  const id = `\0${APP_FOLDERS}`;
  return {
    name: 'app-folders',
    resolveId: (source) => (source === APP_FOLDERS ? id : null),
    load: (source) => (source === id ? `export default ${JSON.stringify(appFolders(root))};` : null),
  };
}
