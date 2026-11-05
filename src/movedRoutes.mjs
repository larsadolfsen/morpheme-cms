// The editor's screens that have moved, by their old address after the "#": a link or a bookmark to one opens it where
// it is now. Exposes MOVED and movedRoute (pure). Used by App.tsx (routeOf), which adds the app store's own.

/** Where each moved screen is now, by its old address. */
export const MOVED = /** @type {Record<string, string>} */ ({
  farver: 'udseende/farver',
  'virksomheden/logo': 'udseende/logo',
  'tema/blokvalg': 'blokvalg',
  dele: 'udseende/dele',
  tema: 'udseende',
  'tema/farver': 'udseende/farver',
  'tema/logo': 'udseende/logo',
  'tema/dele': 'udseende/dele',
  'tema/dele/editor': 'udseende/dele/editor',
  'virksomheden/bank': 'virksomheden/betaling/bank',
  videresendelser: 'seo/videresendelser',
  'videresendelser/alle': 'seo/videresendelser/alle',
  'videresendelser/ikke-fundet': 'seo/videresendelser/ikke-fundet',
  // The settings of the booking and newsletter apps were on a screen "Promovering"; they are on the apps' own pages now.
  promovering: 'apps',
  'promovering/calendly': 'apps/calendly',
  'promovering/mailchimp': 'apps/mailchimp',
  // The header's menus and settings were on a screen of their own under "Globalt"; they are under "Udseende" now.
  header: 'udseende/header',
  // The footer's form was the file's own screen; it is under "Udseende" now.
  'src/data/footer.json': 'udseende/footer',
});

/**
 * The address a screen is at now: where it moved to (`more` first, then MOVED), else the same address.
 * @param {string} route
 * @param {Record<string, string>} [more]
 * @returns {string}
 */
export const movedRoute = (route, more = {}) => more[route] ?? MOVED[route] ?? route;
