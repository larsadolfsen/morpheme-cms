// "Apps" (AppList.tsx): the apps in the site, each on its page, installed with a button; and the app store ("Appstore",
// store.ts), where more can be found and installed.
import type { AppHook } from '../../../lib/hooks';

export const apps = {
  installed: 'Installed',
  notInstalled: 'Not installed',
  /** The switch at the top of an installed app's Settings tab, and its status under its name while it is off. */
  enabled: 'Enabled',
  deactivated: 'Deactivated',
  /** Under its name on its page: who made it. */
  publisher: (name: string) => `Developer: ${name}`,
  /** On its page: its pictures (each opening it whole), what it does more fully, what it needs of the site
   * (needsOf in store.ts), the cookies it sets and who made it, with a row to their page. */
  screenshots: 'Screenshots',
  about: 'About the app',
  /** What is new in its last versions (its release notes), on its page. */
  news: 'What’s new',
  needs: 'Permissions',
  needsPages: 'Puts its own code on every page',
  needsLoads: 'Loads from other addresses',
  needsSends: 'Sends forms to other addresses',
  needsServer: 'Has its own part of the website’s server',
  needsBuild: 'Makes its own files when the website is updated',
  /** What it changes of what the site does itself, by its file in hooks/ (@morphemecms/cms/lib/hooks.ts). */
  changes: { 'page-colors': 'Changes the pages’ colors' } as Record<AppHook, string>,
  /** In the check before the website is updated: a file in an app's hooks/ that is no place an app may change the site. */
  unknownHook: (places: string) => `The file is no place an app can change the website: ${places}.`,
  needsNothing: 'None',
  /** Under "Permissions": the places an app runs code in (lib/appPlaces.mjs), each with its access; a place without code has none. */
  placeBuild: 'Build',
  placeEditor: 'Editor',
  placeWorker: 'Server',
  placePages: 'Pages',
  access: { sandboxed: 'Sandboxed', full: 'Full access' },
  /** Above "Permissions" of an installed app: what the last build found wrong in it (the build's _problems.json), one line each:
   * what it is about (a change of the site by its name, or the place below) and what is wrong. */
  problemsTitle: 'Problems in the last build',
  /** In a line of problems found on several pages: how many. */
  problemPages: (n: number) => `${n} pages`,
  problemLine: (where: string, message: string) => `${where}: ${message}`,
  problemPlaces: { hook: 'Change', 'after-build': 'Step after the build', bundle: 'Code', manifest: 'app.json' },
  /** The kinds of notifications it sends (its `notifications`), each turned off under "Account" › "Notifications". */
  notifications: 'Notifications',
  notifiesNone: 'Sends no notifications',
  cookies: 'Cookies',
  /** Its cookies (AppCookie): how long one lasts, and the first row when the cookie banner asks first. */
  cookieLasts: (lasts: string) => `Lasts ${lasts}`,
  cookiesAsk: 'Set only once the visitor has said yes in the cookie banner',
  noCookies: 'Sets no cookies',
  developer: 'Developer',
  /** On a developer's page (#apps/developer/<name>): over their apps, and the number of them by their row on an app's page. */
  developerApps: 'Apps',
  appCount: (n: number) => (n === 1 ? '1 app' : `${n} apps`),
  /** At the address of a developer no app has. */
  noDeveloper: 'There are no apps from that developer',
  /** In the check before the build: a picture in an app's index.ts that shows nothing it has (shotOf), one without
   * its file (screenshots/, packages/editor/scripts/app-screenshots.mjs), and a file there index.ts does not name. */
  unknownScreenshot: (shows: string) =>
    `The picture "${shows}" shows nothing the app has: block:<type>, kind:<list>:<variant>, list:<id>, settings or page.`,
  noScreenshot: (file: string) => `${file} doesn’t exist. Take the pictures with npx morpheme app-screenshots.`,
  unlistedScreenshot: 'The picture isn’t under screenshots in the app’s index.ts.',
  /** In the check before the build: a widget in an app's index.ts (AppDefinition.widgets) that has no component. */
  widgetNoComponent: (key: string) => `The widget "${key}" has no component.`,
  install: 'Install',
  uninstall: 'Uninstall',
  installing: 'Installing…',
  uninstalling: 'Uninstalling…',
  updating: 'Updating…',
  /** After installing: where its blocks are now. */
  isInstalled: (app: string) => `${app} is installed`,
  isUninstalled: (app: string) => `${app} is uninstalled`,
  /** After installing or updating one from the store, which the website gets in a few minutes. */
  isInstalledSoon: (app: string) => `${app} is installed and can be used in a few minutes`,
  isUpdatedSoon: (app: string, version: string) => `${app} is updated to ${version}. The website uses it in a few minutes.`,
  /** Asked before uninstalling. */
  askUninstall: (app: string) => `Uninstall ${app}? What the app adds disappears from the editor.`,
  /** The name of the switch in the row of one of its blocks (or kinds of a list), read by screen readers. */
  activeOf: (block: string) => `Enabled: ${block}`,
  /** Under "Uninstall". */
  uninstallHint: 'Can be uninstalled, as nothing on the website uses the app.',
  /** Over the pages and entries that use it (its blocks, its kind of pop-up). */
  used: 'Used on',
  /** In the sheet of something it adds, when it is used nowhere. */
  notUsed: 'Not used anywhere',
  /** Under "Uninstall", which cannot be pressed, while it is used. */
  stuck: 'The app is in use and can’t be uninstalled. Remove it from the places above first.',
  /** Over the blocks it adds, and the lists it brings ("Priser"); its kinds of the site's lists (a Mailchimp popup)
   * are under the list's name. */
  blocks: 'Blocks',
  lists: 'Dynamic lists',
  /** The tabs of an installed app's page, in the top bar: its settings, and what it says about itself. */
  tabSettings: 'Settings',
  tabInfo: 'Information',
  /** The tabs' name, read by screen readers. */
  tabs: 'Sections of the app',
  /** The app store: the button to it over the list of apps, its title, and its search. */
  find: 'Appstore',
  searchStore: 'Search for apps',
  loadingStore: 'Loading apps…',
  storeFailed: 'Can’t reach the store. Try again in 10 minutes.',
  /** On "Appstore" when the site's Worker has no store key: only the site's own are there. */
  noStore: 'The website has no Appstore',
  /** On "Appstore": the box that connects the site to the Morpheme store, the row that disconnects it, and the answer at the store's hourly limit. */
  connectTitle: 'The website is not connected to Morpheme',
  connectText: 'Connect it to install apps and themes from the Appstore.',
  connect: 'Connect to Morpheme',
  connected: 'Connected to Morpheme',
  disconnect: 'Disconnect from Morpheme',
  disconnectAsk: 'Disconnect the website from Morpheme? Installed apps and themes stay.',
  connectBusy: 'Many websites are connecting right now. Try again in an hour.',
  /** On a connector's page (AppConnection.tsx): the service it connects to (its MCP server), what it uses, and the connection's state. */
  mcpConnectsTo: (host: string) => `Connects to ${host}`,
  mcpUses: (tools: string) => `Uses: ${tools}`,
  mcpConnect: 'Connect',
  mcpConnected: 'Connected',
  mcpDisconnect: 'Disconnect',
  mcpNeedsSignIn: 'Needs sign-in',
  mcpToken: 'Token',
  mcpTokenHint: 'Paste the token from the service. It is kept on the server and never shown again.',
  mcpDisconnectAsk: (host: string) => `Disconnect from ${host}? The app stops using the service until you connect again.`,
  mcpFailed: 'Could not connect. Check the details and try again.',
  /** A settings field filled from the service: while it loads, and when it cannot. */
  mcpLoading: 'Loading…',
  mcpNotLoaded: (host: string) => `Could not load the choices from ${host}. Connect on the app’s page.`,
  /** An app's files did not come from the store as its catalog says. */
  storeBroken: (app: string) => `${app} couldn’t be loaded correctly from the Appstore`,
  /** At an address of an app the store does not have. */
  notInStore: 'The app isn’t in the Appstore',
  /** The filters over the store (by category, and whether it is installed), each with its first choice, and the main
   * categories of apps (CATEGORIES in lib/storeCategories.mjs). */
  /** The Appstore's three sections (switch at its top) and the role label of an app (roleOf in lib/storeCategories.mjs). */
  sectionsLabel: 'Section of the Appstore',
  sections: { themes: 'Themes', connectors: 'Connectors', plugins: 'Plugins' },
  roles: { connector: 'Connector', plugin: 'Plugin' },
  /** A connector's card and page: the outside service it connects to; a plugin has none. */
  connectsTo: (service: string) => `Connects to ${service}`,
  otherService: 'an outside service',
  noOutsideAccess: 'No outside access',
  needsReads: 'Reads from the website',
  readScopes: {
    pages: 'Pages',
    'pages.text': 'Page texts',
    cookies: 'Cookies',
    apps: 'Installed apps',
    'csp.allowed': 'Allowed addresses',
  } as Record<string, string>,
  categoryFilter: 'Category',
  allCategories: 'All categories',
  stateFilter: 'Status',
  allStates: 'All',
  categories: {
    analytics: 'Analytics',
    appearance: 'Appearance',
    booking: 'Booking',
    email: 'Email',
    forms: 'Forms',
    languages: 'Languages',
    payments: 'Payments',
    privacy: 'Privacy',
    security: 'Security',
    seo: 'SEO',
    shop: 'Shop',
    social: 'Social',
  },
  /** The types of apps (subcategories of SEO) of which a site runs one active app (lib/appTypes.mjs). */
  subcategories: {
    links: 'Links',
    redirects: 'Redirects',
  },
  /** Asked before an app of a type that allows one active app (redirects, links) is activated while another is. */
  oneOfType: (type: string, app: string, others: string) =>
    `Only one ${type} app can be active. Activating ${app} deactivates ${others}. Its settings and data stay, and you can activate it again.`,
  /** The button of that question. */
  activate: 'Activate',
  /** An app's version, under its name on its page. */
  version: (version: string) => `Version ${version}`,
  /** An app from the store in the site's file of apps, which the site's build does not have yet. */
  pending: 'Installing…',
  pendingHint: 'The app can be used in a few minutes.',
  /** A newer version in the store: in the list, and the button on its page. */
  updateFound: 'Update available',
  update: (version: string) => `Update to ${version}`,
  /** Asked before an update, over what is new in it (its release notes, each under t.apps.version). */
  askUpdate: (app: string, version: string) => `Update ${app} to ${version}?`,
  /** Under them, when files of it were changed in the site. */
  overwrites: 'What was changed in the files here will be overwritten.',
  updateNow: 'Update',
  /** An app updated on its own when the editor opened (autoUpdate), with a link to its page. */
  autoUpdated: (app: string, version: string) => `${app} has been updated to ${version}`,
  whatsNew: 'See what’s new',
  /** A version with a higher first number in the store, which is not updated to on its own (autoUpdate). */
  breakingFound: (app: string, version: string) =>
    `${app} ${version} is available. It can break something, so it isn’t updated on its own.`,
  /** Asked before such an update, under its release notes. */
  breaking: 'This version has changes that can break something.',
  /** On a screen with the settings of apps ("Analytics"), when none of them is installed. */
  noneHere: 'No installed apps have settings here',
  /** What a save of an app's settings changed, in the commit (siteT). */
  settingsOf: (app: string) => `settings for ${app}`,
  /** In the check before the build: an app in the site's file of apps without its folder. */
  missing: (id: string, folder: string) => `The app "${id}" is installed, but ${folder}/ doesn’t exist.`,
  /** The commits, in the site's language (siteT). */
  commit: {
    install: (app: string) => `Editor: install the app ${app}`,
    uninstall: (app: string) => `Editor: uninstall the app ${app}`,
    turnOn: (app: string) => `Editor: turn on the app ${app}`,
    turnOff: (app: string) => `Editor: turn off the app ${app}`,
    update: (app: string, version: string) => `Editor: update the app ${app} to ${version}`,
  },
};
