// The site's settings (src/site/config.ts, `@site/config`) for this package's modules that also run outside Vite, where
// @site is no alias (astro.mjs and the scripts): loaded from the site's root, the working directory, as Node loads
// TypeScript. Its imports must be ones Node can follow (defineSite.mjs, not @site).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const configPath = existsSync(join(process.cwd(), 'src/site/config.ts'))
  ? join(process.cwd(), 'src/site/config.ts')
  : join(process.cwd(), 'playground/src/site/config.ts');

/** @type {{ config: import('./defineSite.mjs').SiteConfig }} */
export const { config } = await import(/* @vite-ignore */ pathToFileURL(configPath).href);
