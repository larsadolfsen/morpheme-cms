// A site's settings (its src/site/config.ts, `@site/config`): what it says of itself, over the standard ones, which are the
// same on every site (where its content, data and apps are, the lists the standard blocks use). Plain
// JavaScript, so Node, Vite and the Worker's build can all load it.

/** @typedef {{ value: string; label: string; note?: string; pick?: string; pickLabel?: string }} ButtonTarget */

/**
 * What a site says of itself in its config.ts.
 * @typedef {object} SiteOwn
 * @property {string} name The editor's name as an app (on the home screen, in the tab).
 * @property {string} description What the editor is for (the app's description).
 * @property {string} locale The site's language, with the country (BCP 47): the editor's, unless one is picked on "Konto" or
 *   the browser asks for another the editor has (src/i18n/); the commits are always in it.
 * @property {string} domain The site's own domain: a link written with it is a link within the site. The site is at
 *   https://<domain>/ (Astro's `site`, the structured data), and measures only there and at www.<domain> (site/tracking.ts).
 * @property {string} siteDescription What search engines show of the site when a page has no description of its own.
 * @property {{ owner: string; name: string; branch: string }} repo Where a save goes: one commit on this branch (src/github.ts).
 */

/**
 * What a site can say of itself, else the standard: the owner's picture (beside a blog post, and shown when a page with
 * none of its own is shared), the booking page and the pages a booking ends on, the page about the owner, the block
 * drawn after every blog post, the word a page's title can end in, pictures that are the same though their names say
 * otherwise, the file of its redirects from old addresses, the logo in the structured data, and its app store.
 * @typedef {object} SiteChoices
 * @property {{ src: string; alt: string } | null} picture The owner's picture, or none.
 * @property {{ path: string; thanks: string[] }} booking The booking page, where "Book en tid" goes when no booking sheet
 *   opens ('': the site has none, and the header has no button to it), and the pages a booking or an order ends on: not
 *   for search engines (site/noindex.mjs), and without the action bar.
 * @property {string} aboutPath The page about the owner (an AboutPage in the structured data), or ''.
 * @property {string} postEnd The block drawn across the page after every blog post (its type, with its shared texts), or ''.
 * @property {string} titleEnd A word a page's title can end in, after a dash, for search engines (" – København"): kept in
 *   <title>, left out of the page's heading (displayTitle in site/text.ts). Empty: nothing is left out.
 * @property {Record<string, string>} samePictures Pictures that are the same though their names say otherwise (a crop
 *   saved under a new name), by name (samePicture in site/images.mjs).
 * @property {{ rules: string; map: string }} siteRedirects The site's other redirects: rules ("<from> <to> 301", one to a
 *   line) and the Worker's map (`{ ids, paths }`, worker/index.js), shown and changed with the editor's own under
 *   Videresendelser (src/redirectData.ts).
 * @property {{ owner: string; name: string; branch: string; catalog: string } | null} store The app store ("Apps" ›
 *   "Appstore", src/store.ts): the GitHub repository and branch of its catalog (`catalog`, the apps and themes that can
 *   be installed, each with where its folder is in the repository, at which commit), or none: then "Appstore" has only
 *   the site's own.
 * @property {string} logo The address of the site's logo in the structured data (the business's `logo`,
 *   site/schema.ts), a path on the site ("/logo.svg").
 */

/** @type {SiteChoices} */
const CHOICES = {
  picture: null,
  booking: { path: '', thanks: [] },
  aboutPath: '',
  postEnd: '',
  titleEnd: '',
  samePictures: {},
  siteRedirects: { rules: 'public/_redirects', map: 'src/data/old-addresses.json' },
  store: null,
  logo: '/logo.svg',
};

/** The same on every site. */
const STANDARD = {
  /** The Worker's settings: the editor turns R2 caching on and off in them ("Indstillinger" › "Avanceret", src/r2Caching.ts). */
  wrangler: 'wrangler.jsonc',
  /** The folders the editor loads: the blog posts, the pages, the data files, the pictures and the PDFs, videos and zip
   * files (shown with the pictures in "Filer", at /filer/<name> on the site). */
  folders: {
    blog: 'src/content/blog',
    pages: 'src/content/pages',
    data: 'src/data',
    media: 'public/images/uploads',
    files: 'public/filer',
  },
  /** The redirects the editor writes when a page or post moves (src/addresses.ts; worker/index.js reads it). */
  redirects: 'src/data/redirects.json',
  /** The blocks turned off under "Blokindstillinger" (src/BlockSettings.tsx): `{ "off": [types] }`. */
  blockSettings: 'src/data/block-settings.json',
  /** The apps (src/apps/) installed under "Apps" (src/AppList.tsx): `{ "installed": [ids] }`; the folder of their
   * settings, a file for each (<id>.json); and the folder of the apps themselves, one for each (<id>/). */
  apps: { installed: 'src/data/apps.json', settings: 'src/data/apps', folder: 'src/apps' },
  /** The blocks' shared texts as the owner saved them ("Blokke"), by the block's type; until then those in the block's
   * shared.ts. */
  blockTexts: 'src/data/blocks.json',
  /** The theme in use, `{ "theme": "<folder>" }`, swapped on "Udseende" (ThemePick in src/Library.tsx, site/theme.mjs). */
  theme: 'src/data/theme.json',
  /** The icon pack chosen, `{ "pack": "<id>" }`, under "Udseende" › "Ikonpakker" (IconPacks in src/Library.tsx;
   * site/iconPacks.mjs): a system pack (icons/<id>/) or one a theme installed brings (`<theme>/<pack>`). Without it, the
   * theme's. */
  icons: 'src/data/icons.json',
  /** How the site moves, `{ "scheme": "expressive" | "standard" | "calm" }`, under "Udseende" › "Bevægelse" (Motion in
   * src/Motion.tsx; lib/motion.ts, site/motion.ts). Without it, the theme's ("motion" in its theme.json). */
  motion: 'src/data/motion.json',
  /** The folder of the themes installed, one for each (<folder>/) (site/theme.mjs); one from the store (src/store.ts) is
   * copied into it and deleted from it. */
  themes: 'src/themes',
  /** The addresses the pages may load from besides what the apps need, by kind (as an app's csp.json): those allowed
   * after the pages' Content-Security-Policy stopped them ("Blokeret adresse"). site/siteCsp.mjs gives them to the build. */
  csp: 'src/data/csp.json',
  /** The site's colours, for light and dark mode, under "Farver" (src/Colors.tsx, lib/colors.ts). */
  colors: 'src/data/colors.json',
  /** The menu ("Hovedmenu", its items under `items`), for "Vis som menuen" among the pages (src/Library.tsx). */
  menu: 'src/data/menu.json',
  /** Addresses of the site that are not pages, which a new page or post cannot have. */
  reserved: ['/editor/', '/admin/', '/oauth/', '/images/', '/filer/', '/ny/', '/404/'],
  /** The lists the standard blocks use, by what they hold, and their ids (their addresses, #liste/<id>): the
   * testimonials, the list the block "Udtalelser" brings (src/standard/testimonials/list.ts), the tags, which a
   * testimonial's "Opret et tag" makes a new one of, and the cookies, the list the block "Cookieliste" brings. */
  lists: { testimonials: 'udtalelser', tags: 'kategorier', cookies: 'cookies' },
  /** The folder of the site's cookie list, "Cookies" under "Lister" (the standard block "Cookieliste",
   * src/standard/cookies/list.ts): a file per cookie, those an app sets added when it is installed and taken out when it
   * is uninstalled (src/cookieList.ts). */
  cookieList: 'src/data/cookie-list',
  /** Where a button of the standard block "Knapper" can go besides a page: the booking sheet, the phone (their
   * addresses and texts: `buttons` in defaults/standard.ts and defaults/sitedata.ts), and a promotion on the page that a
   * button can open (`picked` in defaults/standard.ts, the choices `promotions` in defaults/rules.ts).
   * @type {ButtonTarget[]} */
  buttonTargets: [
    { value: 'booking', label: 'Book en tid' },
    { value: 'phone', label: 'Ring', note: 'Ved Ring vises telefonnummeret efter teksten.' },
    {
      value: 'promotion',
      label: 'Åbn promovering',
      note: 'Ved Åbn promovering bruges promoveringens tekst.',
      pick: 'promotions',
      pickLabel: 'Promovering',
    },
  ],
  /** Which pages are the front page, the blog page and the 404 page: `{ "front": "<its address>", "blog": …, "notFound": … }`
   * ("Indstillinger" › "Udseende" › "Standardsider", defaults/standardPages.ts). */
  standardPages: 'src/data/standard-pages.json',
};

/** @typedef {SiteOwn & SiteChoices & typeof STANDARD} SiteConfig */

/**
 * A site's settings: what it says of itself (`own`), with the standard ones for the rest.
 * @param {SiteOwn & Partial<SiteChoices>} own
 * @returns {SiteConfig}
 */
export const defineSite = (own) => ({ ...STANDARD, ...CHOICES, ...own });
