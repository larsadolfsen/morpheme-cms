// Who this site is, for the editor (/editor/) and its build: its name as an app, its domain, the GitHub repository it
// saves to, and what it says of itself beyond the standard (defineSite in @interstellarcms/cms/site/defineSite.mjs, where
// each setting is explained). No React here, so the build and the editor's page can use it.
//
// This is the CMS's demo site (the package's demo/): a made-up site about Interstellar itself, which the pictures of the
// themes are taken of (scripts/theme-screenshots.mjs, scripts/demo-site.mjs). Nothing in it is a real business.
import { defineSite } from '@interstellarcms/cms/site/defineSite.mjs';

export const config = defineSite({
  name: 'Interstellar',
  description: 'Edit the content of interstellar.example.',
  locale: 'en-US',
  domain: 'interstellar.example',
  siteDescription:
    'Interstellar is the website editor for people who would rather run their business than their website. Edit any page from your phone, and every change is saved and checked.',
  repo: { owner: 'larsadolfsen', name: 'interstellar-cms', branch: 'main' },
  booking: { path: '/get-started/', thanks: [] },
  aboutPath: '/about/',
});
