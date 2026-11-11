// A site's settings (its src/site/config.ts, `@site/config`): what it says of itself, over the standard ones, which are the
// same on every site (where its content, data and apps are, the lists the standard blocks use). Plain
// JavaScript, so Node, Vite and the Worker's build can all load it.

/** @typedef {{ value: string; label: string; note?: string; pick?: string; pickLabel?: string }} ButtonTarget */

/**
 * What a site says of itself in its config.ts.
 * @typedef {object} SiteOwn
 * @property {string} name The editor's name as an app (on the home screen, in the tab).
 * @property {string} description What the editor is for (the app's description).
 * @property {string} locale The site's language, with the country (BCP 47): the editor's, unless one is picked on "Account" or
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
 * otherwise, the file of its redirects from old addresses, the logo in the structured data, whether it posts the
 * CMS's releases on its blog, the folder of its files, the address of its testimonials page and the anchor of the
 * directions on its contact page. A site that sets none of the last three and still has the old Danish names keeps them:
 * they are found in its content when it is built (lib/siteSettings.mjs, `settings` in site/settings.ts).
 * @typedef {object} SiteChoices
 * @property {{ src: string; alt: string } | null} picture The owner's picture, or none.
 * @property {{ path: string; thanks: string[] }} booking The booking page, where "Book an appointment" goes when no booking sheet
 *   opens ('': the site has none, and the header has no button to it), and the pages a booking or an order ends on: not
 *   for search engines (site/noindex.mjs), and without the action bar.
 * @property {string} aboutPath The page about the owner (an AboutPage in the structured data), or ''.
 * @property {string} postEnd The block drawn across the page after every blog post (its type, with its shared texts), or ''.
 * @property {string} titleEnd A word a page's title can end in, after a dash, for search engines (" – Copenhagen"): kept in
 *   <title>, left out of the page's heading (displayTitle in site/text.ts). Empty: nothing is left out.
 * @property {Record<string, string>} samePictures Pictures that are the same though their names say otherwise (a crop
 *   saved under a new name), by name (samePicture in site/images.mjs).
 * @property {{ rules: string; map: string }} siteRedirects The site's other redirects: rules ("<from> <to> 301", one to a
 *   line) and the Worker's map (`{ ids, paths }`, worker/index.js), shown and changed with the editor's own under
 *   "Redirects" (src/redirectData.ts).
 * @property {string} logo The address of the site's logo in the structured data (the business's `logo`,
 *   site/schema.ts), a path on the site ("/logo.svg").
 * @property {{ categories?: string[] } | null} releasePosts Whether each new version of the CMS on npm's `latest` gets a blog
 *   post on the site, minutes after it is released, with its release notes in the site's language (worker/release-post.js),
 *   tagged with `categories` (their ids). Morpheme's own site has it; null: no posts.
 * @property {{ files: string }} folders The folders a site can set, in `folders` (the others are the same on every site):
 *   `files`, the PDFs, videos and zip files shown with the pictures in "Files", "public/files" (at /files/<name> on the site).
 * @property {string} testimonialsPath The address of the page that shows the testimonials, with a slash at both ends: "/testimonials/".
 * @property {string} contactAnchor The anchor on the contact page that the footer's address links to (a heading "Directions"
 *   is `directions`), without #: "directions".
 * @property {string[]} pinned Which of `folders.files`, `testimonialsPath` and `contactAnchor` the site set itself (written by
 *   defineSite, not by the site): a setting a site does not set is found in its content when it is built (lib/siteSettings.mjs).
 */

/** @type {Omit<SiteChoices, 'pinned'>} */
const CHOICES = {
  picture: null,
  booking: { path: '', thanks: [] },
  aboutPath: '',
  postEnd: '',
  titleEnd: '',
  samePictures: {},
  siteRedirects: { rules: 'public/_redirects', map: 'src/data/old-addresses.json' },
  logo: '/logo.svg',
  releasePosts: null,
  folders: { files: 'public/files' },
  testimonialsPath: '/testimonials/',
  contactAnchor: 'directions',
};

/** The same on every site. */
const STANDARD = {
  /** The Worker's settings: the editor turns R2 caching on and off in them (Settings › Developer › Caching and builds, src/r2Caching.ts). */
  wrangler: 'wrangler.jsonc',
  /** The folders the editor loads: the blog posts, the pages, the data files and the pictures. The folder of the PDFs, videos
   * and zip files (`files`, shown with the pictures in "Files") is a setting of the site's own (CHOICES). */
  folders: {
    blog: 'src/content/blog',
    pages: 'src/content/pages',
    data: 'src/data',
    media: 'public/images/uploads',
  },
  /** The redirects the editor writes when a page or post moves (src/addresses.ts; worker/index.js reads it). */
  redirects: 'src/data/redirects.json',
  /** The blocks turned off under "Block settings" (src/BlockSettings.tsx): `{ "off": [types] }`. */
  blockSettings: 'src/data/block-settings.json',
  /** The apps (src/apps/) installed under "Apps" (src/AppList.tsx): `{ "installed": [ids] }`; the folder of their
   * settings, a file for each (<id>.json); and the folder of the apps themselves, one for each (<id>/). */
  apps: { installed: 'src/data/apps.json', settings: 'src/data/apps', folder: 'src/apps' },
  /** The blocks' shared texts as the owner saved them ("Blocks"), by the block's type; until then those in the block's
   * shared.ts. */
  blockTexts: 'src/data/blocks.json',
  /** The theme in use, `{ "theme": "<folder>" }`, swapped on "Appearance" (ThemePick in src/Library.tsx, site/theme.mjs). */
  theme: 'src/data/theme.json',
  /** The icon pack chosen, `{ "pack": "<id>" }`, under "Appearance" › "Icon packs" (IconPacks in src/Library.tsx;
   * site/iconPacks.mjs): a system pack (icons/<id>/) or one a theme installed brings (`<theme>/<pack>`). Without it, the
   * theme's. */
  icons: 'src/data/icons.json',
  /** How the site moves, `{ "scheme": "expressive" | "standard" | "calm" }`, under "Appearance" › "Motion" (Motion in
   * src/Motion.tsx; lib/motion.ts, site/motion.ts). Without it, the theme's ("motion" in its theme.json). */
  motion: 'src/data/motion.json',
  /** The block drawn in a column beside the text of ordinary pages, `{ "block": "<type>" | null }`, under "Appearance" ›
   * "Side column" (SideColumn in src/SideColumn.tsx; site/side.ts). Without it, no page has a column. */
  side: 'src/data/side.json',
  /** The folder of the themes installed, one for each (<folder>/) (site/theme.mjs); one from the store (src/store.ts) is
   * copied into it and deleted from it. */
  themes: 'src/themes',
  /** The addresses the pages may load from besides what the apps need, by kind (as an app's csp.json): those allowed
   * after the pages' Content-Security-Policy stopped them ("Blocked address"). site/siteCsp.mjs gives them to the build. */
  csp: 'src/data/csp.json',
  /** The site's colours, for light and dark mode, under "Colors" (src/Colors.tsx, lib/colors.ts). */
  colors: 'src/data/colors.json',
  /** The menu ("Main menu", its items under `items`), for "Show as menu" among the pages (src/Library.tsx). */
  menu: 'src/data/menu.json',
  /** Addresses of the site that are not pages, which a new page or post cannot have (defineSite adds the files folder's own). */
  reserved: ['/editor/', '/admin/', '/oauth/', '/images/', '/new/', '/404/'],
  /** The lists the standard blocks use, by what they hold, and their ids (their addresses, #list/<id>): the
   * testimonials, the list the block "Testimonials" brings (src/standard/testimonials/list.ts), the tags, which a
   * testimonial's "Create a tag" makes a new one of, and the cookies, the list the block "Cookie list" brings. */
  lists: { testimonials: 'testimonials', tags: 'tags', cookies: 'cookies' },
  /** The folder of the site's cookie list, "Cookies" under "Lists" (the standard block "Cookie list",
   * src/standard/cookies/list.ts): a file per cookie, those an app sets added when it is installed and taken out when it
   * is uninstalled (src/cookieList.ts). */
  cookieList: 'src/data/cookie-list',
  /** Where a button of the standard block "Buttons" can go besides a page: the booking sheet, the phone (their
   * addresses and texts: `buttons` in defaults/standard.ts and defaults/sitedata.ts), and a promotion on the page that a
   * button can open (`picked` in defaults/standard.ts, the choices `promotions` in defaults/rules.ts).
   * @type {ButtonTarget[]} */
  buttonTargets: [
    { value: 'booking', label: 'Book an appointment' },
    { value: 'phone', label: 'Call', note: 'With Call, the phone number is shown after the text.' },
    {
      value: 'promotion',
      label: 'Open promotion',
      note: "With Open promotion, the promotion's text is used.",
      pick: 'promotions',
      pickLabel: 'Promotion',
    },
  ],
  /** Which pages are the front page, the blog page and the 404 page: `{ "front": "<its address>", "blog": …, "notFound": … }`
   * ("Settings" › "Appearance" › "Default pages", defaults/standardPages.ts). */
  standardPages: 'src/data/standard-pages.json',
  /** The folder of the file records, one `<id>.json` per file in Files that has tags (`{ src, categories, removed }`,
   * src/fileRecords.mjs): what a file is tagged with and which tags were removed from it. */
  fileRecords: 'src/data/files',
};

/** @typedef {SiteOwn & SiteChoices & typeof STANDARD} SiteConfig */

/** The names of the settings a site can pin (SiteChoices.pinned). */
const PINNABLE = ['folders.files', 'testimonialsPath', 'contactAnchor'];

/**
 * A site's settings: what it says of itself (`own`), with the standard ones for the rest. `folders` is merged key by key, so
 * `folders: { files: 'public/files' }` alone is valid. `pinned` lists the settings the site set itself.
 * @param {SiteOwn & Partial<Omit<SiteChoices, 'folders' | 'pinned'>> & { folders?: Partial<SiteChoices['folders']> }} own
 * @returns {SiteConfig}
 */
export const defineSite = (own) => {
  const folders = { ...STANDARD.folders, ...CHOICES.folders, ...own.folders };
  const pinned = PINNABLE.filter((name) => (name === 'folders.files' ? own.folders?.files : own[name]) !== undefined);
  // The address the files folder has on the site, besides the old and the new standard one, which a page cannot have.
  const files = `/${folders.files.replace(/^public\//, '')}/`;
  const reserved = [...new Set([...STANDARD.reserved, files, '/filer/', '/files/', '/ny/'])]; // language-ok: the old files and new-versions addresses are reserved too
  return { ...STANDARD, ...CHOICES, ...own, folders, reserved, pinned };
};
