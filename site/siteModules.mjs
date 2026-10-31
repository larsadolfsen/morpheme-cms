// The site's TypeScript loaded with Vite, as the build has it (its @site, @theme and apps), for the scripts that run
// outside the build: Node itself loads no TypeScript from a package in node_modules, and follows no @site.
import { createServer } from 'vite';
import { appFoldersPlugin } from '../lib/apps.mjs';
import { aliases, themePlugin } from './theme.mjs';

/**
 * Runs `use` with a loader of the site's modules (`@site/collections`, `/src/apps/<id>/index.ts`), then closes it.
 * @template T
 * @param {(load: (path: string) => Promise<any>) => Promise<T>} use
 * @returns {Promise<T>}
 */
export async function withSiteModules(use) {
  const server = await createServer({
    configFile: false,
    logLevel: 'error',
    appType: 'custom',
    plugins: [themePlugin(), appFoldersPlugin(`${process.cwd()}/`)],
    resolve: { alias: aliases() },
    server: { middlewareMode: true, hmr: false, ws: false },
  });
  try {
    return await use((path) => server.ssrLoadModule(path));
  } finally {
    await server.close();
  }
}
