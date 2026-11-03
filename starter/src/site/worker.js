// What the site's Worker (@morpheme/cms/worker/) has from this site, as `@site/worker` (the alias in wrangler.jsonc).
// JavaScript, not TypeScript, because it imports worker/apps.js, which the build writes.
import oldAddresses from '../data/old-addresses.json';
import apps from '../data/apps.json';
import contact from '../data/contact.json';
import moved from '../data/redirects.json';
import standard from '../data/standard-pages.json';

export { appTexts, appWorkers } from '../../worker/apps.js';
/** The apps installed (`installed`), the site's contact details (its name on the phone's notifications), the pages and
 * posts that moved in the editor, and the pages that are the front page and the blog page. */
export { apps, contact, moved, standard };
/** The site's redirects from its old addresses, `{ ids, paths }`. */
export { oldAddresses };
