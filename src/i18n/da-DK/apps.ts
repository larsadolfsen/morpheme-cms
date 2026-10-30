// "Apps" (AppList.tsx): the apps in the site, each on its page, installed with a button; and the app store ("Appstore",
// store.ts), where more can be found and installed.
import type { AppHook } from '../../../lib/hooks';

export const apps = {
  installed: 'Installeret',
  notInstalled: 'Ikke installeret',
  /** Under its name on its page: who made it. */
  publisher: (name: string) => `Udvikler: ${name}`,
  /** On its page: its pictures (each opening it whole), what it does more fully, what it needs of the site
   * (needsOf in store.ts), the cookies it sets and who made it, with a row to their page. */
  screenshots: 'Skærmbilleder',
  about: 'Om appen',
  /** What is new in its last versions (its release notes), on its page. */
  news: 'Det er nyt',
  needs: 'Rettigheder',
  needsPages: 'Sætter sin egen kode på alle sider',
  needsLoads: 'Henter fra andre adresser',
  needsSends: 'Sender formularer til andre adresser',
  needsServer: 'Har sin egen del af hjemmesidens server',
  needsBuild: 'Laver sine egne filer, når hjemmesiden bygges',
  /** What it changes of what the site does itself, by its file in hooks/ (@interstellarcms/cms/lib/hooks.ts). */
  changes: { 'page-colors': 'Ændrer sidernes farver' } as Record<AppHook, string>,
  /** In the check before the build: a file in an app's hooks/ that is no place an app may change the site. */
  unknownHook: (places: string) => `Filen er ikke et sted, en app kan ændre hjemmesiden: ${places}.`,
  needsNothing: 'Ingen',
  /** The kinds of notifications it sends (its `notifications`), each turned off under "Konto" › "Notifikationer". */
  notifications: 'Notifikationer',
  notifiesNone: 'Sender ingen notifikationer',
  cookies: 'Cookies',
  /** Its cookies (AppCookie): how long one lasts, and the first row when the cookie banner asks first. */
  cookieLasts: (lasts: string) => `Varer ${lasts}`,
  cookiesAsk: 'Sættes først, når den besøgende har sagt ja i cookiebanneret',
  noCookies: 'Sætter ingen cookies',
  developer: 'Udvikler',
  /** On a developer's page (#apps/udvikler/<navn>): over their apps, and the number of them by their row on an app's page. */
  developerApps: 'Apps',
  appCount: (n: number) => (n === 1 ? '1 app' : `${n} apps`),
  /** At the address of a developer no app has. */
  noDeveloper: 'Der er ingen apps fra den udvikler.',
  /** In the check before the build: a picture in an app's index.ts that shows nothing it has (shotOf), one without
   * its file (screenshots/, packages/editor/scripts/app-screenshots.mjs), and a file there index.ts does not name. */
  unknownScreenshot: (shows: string) =>
    `Billedet "${shows}" viser intet, appen har: blok:<type>, slags:<liste>:<variant>, liste:<id>, indstillinger eller side.`,
  noScreenshot: (file: string) => `${file} findes ikke. Tag billederne med npx interstellar app-screenshots.`,
  unlistedScreenshot: 'Billedet står ikke under screenshots i appens index.ts.',
  install: 'Installer',
  uninstall: 'Afinstaller',
  installing: 'Installerer…',
  uninstalling: 'Afinstallerer…',
  updating: 'Opdaterer…',
  /** After installing: where its blocks are now. */
  isInstalled: (app: string) => `${app} er installeret.`,
  isUninstalled: (app: string) => `${app} er afinstalleret.`,
  /** After installing or updating one from the store, which the site's next build has. */
  isInstalledSoon: (app: string) => `${app} er installeret og kan bruges, når hjemmesiden er bygget.`,
  isUpdatedSoon: (app: string, version: string) => `${app} er opdateret til ${version} og virker sådan, når hjemmesiden er bygget.`,
  /** Asked before uninstalling. */
  askUninstall: (app: string) => `Afinstaller ${app}? Det, appen tilføjer, forsvinder fra editoren.`,
  /** The name of the switch in the row of one of its blocks (or kinds of a list), read by screen readers. */
  activeOf: (block: string) => `Aktiveret: ${block}`,
  /** Under "Afinstaller". */
  uninstallHint: 'Kan afinstalleres, fordi intet på hjemmesiden bruger appen.',
  /** Over the pages and entries that use it (its blocks, its kind of pop-up). */
  used: 'Bruges på',
  /** In the sheet of something it adds, when it is used nowhere. */
  notUsed: 'Bruges ingen steder.',
  /** Under "Afinstaller", which cannot be pressed, while it is used. */
  stuck: 'Appen bruges og kan ikke afinstalleres. Fjern den fra stederne ovenfor først.',
  /** Over the blocks it adds, and the lists it brings ("Priser"); its kinds of the site's lists (a Mailchimp popup)
   * are under the list's name. */
  blocks: 'Blokke',
  lists: 'Lister',
  /** The row on its page to its settings (beside it, the screen they are on: "Analytics"). */
  settings: 'Indstillinger',
  /** The app store: the button to it over the list of apps, its title, and its search. */
  find: 'Appstore',
  searchStore: 'Søg efter apps',
  loadingStore: 'Henter apps',
  storeFailed: 'Kunne ikke hente Appstore.',
  /** An app's files did not come from the store as its catalog says. */
  storeBroken: (app: string) => `${app} kunne ikke hentes rigtigt fra Appstore.`,
  /** At an address of an app the store does not have. */
  notInStore: 'Appen findes ikke i Appstore.',
  /** The filters over the store (by category, and whether it is installed), each with its first choice, and the kinds
   * of apps (store.ts appCategories). */
  categoryFilter: 'Kategori',
  allCategories: 'Alle kategorier',
  stateFilter: 'Status',
  allStates: 'Alle',
  categories: { booking: 'Booking', newsletter: 'Nyhedsbrev', analytics: 'Måling', content: 'Indhold', design: 'Udseende' },
  /** An app's version, under its name on its page. */
  version: (version: string) => `Version ${version}`,
  /** An app from the store in the site's file of apps, which the site's build does not have yet. */
  pending: 'Installeres …',
  pendingHint: 'Appen kan bruges, når hjemmesiden er bygget.',
  /** A newer version in the store: in the list, and the button on its page. */
  updateFound: 'Opdatering findes',
  update: (version: string) => `Opdater til ${version}`,
  /** Asked before an update, over what is new in it (its release notes, each under t.apps.version). */
  askUpdate: (app: string, version: string) => `Opdater ${app} til ${version}?`,
  /** Under them, when files of it were changed in the site. */
  overwrites: 'Det, der er rettet i filerne her, bliver overskrevet.',
  updateNow: 'Opdater',
  /** An app updated on its own when the editor opened (autoUpdate), with a link to its page. */
  autoUpdated: (app: string, version: string) => `${app} er opdateret til ${version}.`,
  whatsNew: 'Se, hvad der er nyt',
  /** A version with a higher first number in the store, which is not updated to on its own (autoUpdate). */
  breakingFound: (app: string, version: string) => `${app} ${version} findes. Den kan ødelægge noget, så den opdateres ikke af sig selv.`,
  /** Asked before such an update, under its release notes. */
  breaking: 'Versionen har ændringer, der kan ødelægge noget.',
  /** On a screen with the settings of apps ("Analytics"), when none of them is installed. */
  noneHere: 'Ingen installerede apps har indstillinger her.',
  /** What a save of an app's settings changed, in the commit (siteT). */
  settingsOf: (app: string) => `indstillinger for ${app}`,
  /** In the check before the build: an app in the site's file of apps without its folder. */
  missing: (id: string, folder: string) => `Appen "${id}" er installeret, men ${folder}/ findes ikke.`,
  /** The commits, in the site's language (siteT). */
  commit: {
    install: (app: string) => `Editor: installer appen ${app}`,
    uninstall: (app: string) => `Editor: afinstaller appen ${app}`,
    update: (app: string, version: string) => `Editor: opdater appen ${app} til ${version}`,
  },
};
