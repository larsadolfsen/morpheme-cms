// The editor's screens that have moved or been renamed, by their old address after the "#": a link or a bookmark to one
// opens it where it is now. Exposes MOVED, RENAMED and movedRoute (pure). Used by App.tsx (routeOf), which adds the app store's own.

/** Where each moved screen is now, by its old address. */
export const MOVED = /** @type {Record<string, string>} */ ({
  farver: 'appearance/colors',
  'virksomheden/logo': 'appearance/logo',
  'tema/blokvalg': 'block-settings',
  dele: 'appearance/parts',
  tema: 'appearance',
  'tema/farver': 'appearance/colors',
  'tema/logo': 'appearance/logo',
  'tema/dele': 'appearance/parts',
  'tema/dele/editor': 'appearance/parts/editor',
  'virksomheden/bank': 'company/payment/bank',
  videresendelser: 'seo/redirects',
  'videresendelser/alle': 'seo/redirects/all',
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

/**
 * Old route prefix (Danish, one or more segments, as the routes were before the ids got English names) -> its new
 * English prefix. Only a route that starts with the old prefix is renamed, and the rest of it is data (a file path, a
 * slug, an id) that keeps its name. A key segment `*` matches any one segment and keeps it (in the value too).
 * Old links keep working through it. The longest matching key wins.
 */
export const RENAMED = /** @type {Record<string, string>} */ ({
  indstillinger: 'settings',
  'indstillinger/appstore/temaer': 'settings/appstore/themes',
  'apps/*/indstillinger': 'apps/*/settings',
  'apps/udvikler': 'apps/developer',
  udseende: 'appearance',
  'udseende/temaer': 'appearance/themes',
  'udseende/ikonpakker': 'appearance/icon-packs',
  'udseende/bevaegelse': 'appearance/motion',
  'udseende/sidekolonne': 'appearance/side-column',
  'udseende/farver': 'appearance/colors',
  'udseende/farver/reservefarver': 'appearance/colors/fallback-colors',
  'udseende/dele': 'appearance/parts',
  'udseende/dele/blokke': 'appearance/parts/blocks',
  'udseende/dele/liste': 'appearance/parts/list',
  'udseende/dele/vaerdier': 'appearance/parts/values',
  'udseende/standardsider': 'appearance/default-pages',
  maaling: 'analytics',
  privatliv: 'privacy',
  'privatliv/samtykker': 'privacy/consents',
  lister: 'lists',
  liste: 'list',
  'liste/kategorier': 'list/tags',
  'liste/udtalelser': 'list/testimonials',
  'liste/mobilmenu': 'list/mobile-menu',
  ny: 'new',
  'ny/kategorier': 'new/tags',
  'ny/udtalelser': 'new/testimonials',
  slettet: 'deleted',
  'slettet/kategorier': 'deleted/tags',
  'slettet/udtalelser': 'deleted/testimonials',
  'slettet/mobilmenu': 'deleted/mobile-menu',
  'slettet/filer': 'deleted/files',
  virksomheden: 'company',
  'virksomheden/kontakt': 'company/contact',
  'virksomheden/betaling': 'company/payment',
  blokke: 'blocks',
  filer: 'files',
  'seo/videresendelser': 'seo/redirects',
  'seo/videresendelser/alle': 'seo/redirects/all',
  'seo/vurdering': 'seo/rating',
  blokvalg: 'block-settings',
  avanceret: 'advanced',
  licenser: 'licenses',
  konto: 'account',
  notifikationer: 'notifications',
});

/**
 * The address a screen is at now: where it moved to (`more` first, then MOVED), else the address with its longest old
 * prefix in `renamed` replaced and the rest as it is, else the same address.
 * @param {string} route
 * @param {Record<string, string>} [more]
 * @param {Record<string, string>} [renamed]
 * @returns {string}
 */
export const movedRoute = (route, more = {}, renamed = RENAMED) => {
  const moved = more[route] ?? MOVED[route];
  if (moved !== undefined) return moved;
  const parts = route.split('/');
  let best = null;
  for (const key of Object.keys(renamed)) {
    const old = key.split('/');
    if (old.length > parts.length || (best && old.length <= best.old.length)) continue;
    if (old.every((segment, n) => segment === '*' || segment === parts[n])) best = { key, old };
  }
  if (!best) return route;
  const kept = parts.slice(0, best.old.length);
  let n = 0;
  const now = renamed[best.key].split('/').map((segment) => {
    if (segment !== '*') return segment;
    while (best.old[n] !== '*') n += 1;
    return kept[n++];
  });
  return [...now, ...parts.slice(best.old.length)].join('/');
};
