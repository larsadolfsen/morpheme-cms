// The site settings as they are for this site, resolved: the folder of the files, the address of the testimonials page and
// the anchor of the directions on the contact page. A setting the site sets in its config.ts is that; else the old Danish
// value when the site's content still has it (found when the site is built, `virtual:site-facts`); else the English
// default. Read these, never the defaults in defineSite.mjs. Node scripts read the same from site/siteConfig.mjs.
import facts from 'virtual:site-facts';
import { config } from '@site/config';
import { resolveSettings } from '../lib/siteSettings.mjs';

export const settings = resolveSettings(config, facts);
