// The site's config (src/site/config.ts) for this package's modules that also run outside Vite, where @site is no alias
// (packages/editor/astro.mjs and the scripts): loaded from the site's root, the working directory, as Node loads TypeScript.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** A module of the site, by its path from the site's root (`src/site/csp.mjs`). @param {string} path */
export const fromSite = (path) => import(/* @vite-ignore */ pathToFileURL(join(process.cwd(), path)).href);

export const { config } = await fromSite('src/site/config.ts');
