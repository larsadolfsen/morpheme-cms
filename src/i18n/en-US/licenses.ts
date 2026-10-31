// "Licenser" under "Indstillinger" (Licenses.tsx): the third-party work the site and the editor are made with, and the
// licences on an app's and a theme's page.
import type { LicenseKind } from '../../licenses';

export const licenses = {
  /** The groups: the icon packs, what the editor and the site's own code bring, and each app and theme in use. */
  icons: 'Icon packs',
  system: 'The editor and the site',
  app: (name: string) => `The app ${name}`,
  theme: (name: string) => `The theme ${name}`,
  /** A licence that gives no rights ("UNLICENSED"), as its name. */
  unlicensed: 'All rights reserved',
  kinds: { font: 'Font', icons: 'Icons', library: 'Code', image: 'Pictures' },
  /** Who brings it, after what it is: "Kode i editoren og på sitet". */
  inEditor: 'in the editor',
  onSite: 'on the site',
  inApp: (name: string) => `in the app ${name}`,
  inTheme: (name: string) => `in the theme ${name}`,
  /** Through which packages, when the site does not use it itself. */
  via: (names: string) => `through ${names}`,
  /** Brought by an app or a theme the site is built with, but not downloaded (the Worker's, the build's). */
  notShipped: 'not downloaded from the site',
  /** An icon pack the site does not draw with, which can be chosen. */
  offered: 'can be chosen',
  version: (version: string) => `Version ${version}`,
  /** The app's or the theme's own work, first in its group. */
  own: (name: string) => `${name} itself`,
  loading: 'Fetching the licenses',
  /** The site has not been built since they came, or the editor is offline. */
  missing: 'The licenses come once the site is updated',
  /** One licence's page. */
  text: 'License text',
  noText: 'There’s no license text, as all rights are reserved',
  standardText: (license: string) => `The package has no license file, so this is the standard text of ${license}.`,
  notFound: 'The license doesn’t exist',
};
