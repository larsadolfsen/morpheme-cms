// The site's settings (src/site/config.ts, `@site/config`) for this package's modules that also run outside Vite, where
// @site is no alias (astro.mjs and the scripts): loaded from the site's root, the working directory, as Node loads
// TypeScript. Its imports must be ones Node can follow (defineSite.mjs, not @site).
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { detectFacts } from '../lib/siteFacts.mjs';
import { resolveSettings } from '../lib/siteSettings.mjs';

/** @type {{ config: import('./defineSite.mjs').SiteConfig }} */
export const { config } = await import(/* @vite-ignore */ pathToFileURL(join(process.cwd(), 'src/site/config.ts')).href);

/** The settings a site can pin or have found (site/settings.ts is the same for the site and the editor): the folder of the files, the testimonials page, the contact anchor. */
export const settings = resolveSettings(config, detectFacts(process.cwd(), config.folders));
