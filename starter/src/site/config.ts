// Who this site is, for the editor (/editor/) and its build: its name as an app, its domain, the GitHub repository it
// saves to, and what it says of itself beyond the standard (defineSite in @morphemecms/cms/site/defineSite.mjs, where
// each setting is explained). No React here, so the build and the editor's page can use it.
import { defineSite } from '@morphemecms/cms/site/defineSite.mjs';

export const config = defineSite({
  name: 'My site',
  description: 'Edit the content of my-site.com.',
  locale: 'en-US',
  domain: 'my-site.com',
  siteDescription: 'My site.',
  repo: { owner: 'me', name: 'my-site', branch: 'main' },
});
