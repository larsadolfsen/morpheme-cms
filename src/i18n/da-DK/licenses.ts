// "Licenser" under "Indstillinger" (Licenses.tsx): the third-party work the site and the editor are made with, and the
// licences on an app's and a theme's page.
import type { LicenseKind } from '../../licenses';

export const licenses = {
  /** The groups: the icon packs, what the editor and the site's own code bring, and each app and theme in use. */
  icons: 'Ikonpakker',
  system: 'Editoren og sitet',
  app: (name: string) => `Appen ${name}`,
  theme: (name: string) => `Temaet ${name}`,
  /** A licence that gives no rights ("UNLICENSED"), as its name. */
  unlicensed: 'Alle rettigheder forbeholdt',
  kinds: { font: 'Skrift', icons: 'Ikoner', library: 'Kode', image: 'Billeder' } satisfies Record<LicenseKind, string>,
  /** Who brings it, after what it is: "Kode i editoren og på sitet". */
  inEditor: 'i editoren',
  onSite: 'på sitet',
  inApp: (name: string) => `i appen ${name}`,
  inTheme: (name: string) => `i temaet ${name}`,
  /** Through which packages, when the site does not use it itself. */
  via: (names: string) => `gennem ${names}`,
  /** Brought by an app or a theme the site is built with, but not downloaded (the Worker's, the build's). */
  notShipped: 'hentes ikke fra sitet',
  /** An icon pack the site does not draw with, which can be chosen. */
  offered: 'kan vælges',
  version: (version: string) => `Version ${version}`,
  /** The app's or the theme's own work, first in its group. */
  own: (name: string) => `${name} selv`,
  loading: 'Henter licenserne',
  /** The site has not been built since they came, or the editor is offline. */
  missing: 'Licenserne kommer, når hjemmesiden er opdateret.',
  /** One licence's page. */
  text: 'Licenstekst',
  noText: 'Der er ingen licenstekst, da alle rettigheder er forbeholdt.',
  standardText: (license: string) => `Pakken har ingen licensfil, så her står standardteksten for ${license}.`,
  notFound: 'Licensen findes ikke.',
};
