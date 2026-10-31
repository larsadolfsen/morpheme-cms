// Who this site is, for the editor (/editor/) and its build: its name as an app, its domain, the GitHub repository it
// saves to, and what it says of itself beyond the standard (defineSite in @interstellarcms/cms/site/defineSite.mjs, where
// each setting is explained). No React here, so the build and the editor's page can use it.
import { defineSite } from '@interstellarcms/cms/site/defineSite.mjs';

export const config = defineSite({
  name: 'Mit site',
  description: 'Rediger indholdet på mit-site.dk.',
  locale: 'da-DK',
  domain: 'mit-site.dk',
  siteDescription: 'Mit site.',
  repo: { owner: 'mig', name: 'mit-site', branch: 'main' },
});
