// The editor's screens that have moved, by their old address after the "#": a link or a bookmark to one opens it where
// it is now. Exposes MOVED, RENAMED and movedRoute (pure). Used by App.tsx (routeOf), which adds the app store's own.

/** Where each moved screen is now, by its old address. */
export const MOVED = /** @type {Record<string, string>} */ ({
  farver: 'appearance/farver',
  'virksomheden/logo': 'appearance/logo',
  'tema/blokvalg': 'block-settings',
  dele: 'appearance/dele',
  tema: 'appearance',
  'tema/farver': 'appearance/farver',
  'tema/logo': 'appearance/logo',
  'tema/dele': 'appearance/dele',
  'tema/dele/editor': 'appearance/dele/editor',
  'virksomheden/bank': 'company/betaling/bank',
  videresendelser: 'seo/redirects',
  'videresendelser/alle': 'seo/redirects/alle',
  'videresendelser/ikke-fundet': 'seo/redirects/ikke-fundet',
  // The settings of the booking and newsletter apps were on a screen "Promovering"; they are on the apps' own pages now.
  promovering: 'apps',
  'promovering/calendly': 'apps/calendly',
  'promovering/mailchimp': 'apps/mailchimp',
  // The header's menus and settings were on a screen of their own under "Globalt"; they are under "Udseende" now.
  header: 'appearance/header',
  // The footer's form was the file's own screen; it is under "Udseende" now.
  'src/data/footer.json': 'appearance/footer',
});

/** Danish address segment -> English segment, one entry per renamed route id. Old links keep working through it. */
export const RENAMED = /** @type {Record<string, string>} */ ({
  indstillinger: 'settings',
  udseende: 'appearance',
  maaling: 'analytics',
  kategorier: 'tags',
  mobilmenu: 'mobile-menu',
  virksomheden: 'company',
  blokke: 'blocks',
  filer: 'files',
  privatliv: 'privacy',
  lister: 'lists',
  liste: 'list',
  videresendelser: 'redirects',
  blokvalg: 'block-settings',
});

/**
 * The address a screen is at now: where it moved to (`more` first, then MOVED), else the same address with each
 * renamed segment replaced.
 * @param {string} route
 * @param {Record<string, string>} [more]
 * @param {Record<string, string>} [renamed]
 * @returns {string}
 */
export const movedRoute = (route, more = {}, renamed = RENAMED) =>
  more[route] ??
  MOVED[route] ??
  route
    .split('/')
    .map((segment) => renamed[segment] ?? segment)
    .join('/');
