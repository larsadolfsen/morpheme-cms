// The start screen, the lists and the account (Library.tsx), the top bar (Screen.tsx) and the sheets
// with choices (Sheet.tsx).
export const library = {
  siteUpdated: (when: string) => `Opdateret ${when}`,
  githubAccount: (login: string) => `GitHub-konto: ${login}`,
  logOut: 'Log ud',
  /** The bell in the top bar and its screen (#notifikationer, Notifications.tsx): the messages shown at the bottom. */
  notifications: 'Notifikationer',
  /** The bell's name while some are not seen yet. */
  notificationsNew: (count: number) => `Notifikationer, ${count} nye`,
  noNotifications: 'Ingen notifikationer.',
  clearNotifications: 'Ryd notifikationer',
  /** On "Konto" › "Notifikationer" (Library.tsx NotificationChoices, notifications.ts). */
  /** The sliders on "Notifikationer": to "Konto", where they are turned on or off. */
  notificationChoices: 'Vælg notifikationer',
  onDevice: 'På telefonen',
  onDeviceHint: 'Også når editoren er lukket.',
  deviceBlocked: 'Telefonen eller browseren tillader ikke notifikationer fra editoren. Slå dem til i dens indstillinger.',
  notificationTypes: { site: 'Hjemmesiden opdateret', saved: 'Gemt og slettet', failed: 'Kunne ikke gemme', updates: 'Apps opdateret' },
  on: 'Til',
  off: 'Fra',
  /** Under a theme's name under "Temaer" and on its page: its version and who made it. */
  themeByline: (version: string, author: string) => `Version ${version} · ${author}`,
  /** By the theme the site is built with, under "Temaer" and on its page. */
  themeInUse: 'I brug',
  /** By the theme it is changed to, until the site is built with it: under "Temaer", and on its page. */
  themeNext: 'Skifter hertil',
  themeChanging: (name: string) => `Skifter til ${name} om et par minutter`,
  /** On a theme's page: the pictures of the site in it (packages/editor/scripts/theme-screenshots.mjs), each by what it shows. */
  themeLooks: 'Sådan ser din hjemmeside ud',
  themeShots: {
    front: 'Forsiden',
    'front-dark': 'Forsiden i mørk tilstand',
    blog: 'Blogsiden',
    contact: 'Kontaktsiden',
  } as Record<string, string>,
  /** Its description, what it gives the site (its highlights) and what stays when it is used. */
  themeAbout: 'Om temaet',
  themeHighlights: 'Det får du',
  themeKept: 'Det bliver, som det er',
  themeKeptContent: 'Sider og indlæg',
  themeKeptBrand: 'Farver og logo',
  themeKeptBlocks: 'Alle blokke, i temaets udseende',
  /** The button on a theme's page that swaps the theme the site is built with to it. */
  useTheme: 'Brug temaet',
  /** The question's button before the theme is changed. */
  changeTheme: 'Skift tema',
  /** Asked before the theme is changed. */
  changeThemeAsk: (name: string) => `Hjemmesiden får temaet ${name}. Den opdateres om et par minutter.`,
  /** The commit, in the site's language (siteT). */
  themeCommit: (name: string) => `Editor: skift tema til ${name}`,
  /** A theme from the store (ThemeStore.tsx): installed, updated or uninstalled, asked before it is uninstalled, why
   * one in use cannot be, and under "Afinstaller" when it can; a theme the store does not have; how many a developer
   * has made; and the commits, in the site's language (siteT). */
  themeInstalled: (name: string) => `${name} er installeret og kan vælges, når hjemmesiden er bygget.`,
  themeUpdated: (name: string, version: string) => `${name} er opdateret til ${version} og ser sådan ud, når hjemmesiden er bygget.`,
  themeUninstalled: (name: string) => `${name} er afinstalleret.`,
  askUninstallTheme: (name: string) => `Afinstaller ${name}? Temaet fjernes fra hjemmesiden.`,
  themeStuck: 'Temaet er i brug og kan ikke afinstalleres. Vælg et andet tema først.',
  themeUninstallHint: 'Kan afinstalleres, fordi hjemmesiden ikke bruger temaet.',
  themePendingHint: 'Temaet kan vælges, når hjemmesiden er bygget.',
  themeNotInStore: 'Temaet findes ikke i Appstore.',
  themeCount: (n: number) => (n === 1 ? '1 tema' : `${n} temaer`),
  searchThemes: 'Søg efter temaer',
  themeCommits: {
    install: (name: string) => `Editor: installer temaet ${name}`,
    uninstall: (name: string) => `Editor: afinstaller temaet ${name}`,
    update: (name: string, version: string) => `Editor: opdater temaet ${name} til ${version}`,
  },
  /** Under "Ikonpakker" (IconPacks in Library.tsx): under a pack's name who made it, its licence and, for one a theme
   * brings, the theme; a few of its icons, for screen readers; by the one the site is built with, and by the one chosen
   * until the site is built with it; asked before it is chosen, the question's button, what is said after it is saved,
   * and the commit, in the site's language (siteT). */
  iconPackByline: (author: string, license: string) => `${author} · ${license}`,
  iconPackFrom: (theme: string) => `Fra temaet ${theme}`,
  iconPackSamples: (name: string) => `Ikoner fra ${name}`,
  iconPackInUse: 'I brug',
  iconPackNext: 'Skifter hertil, når hjemmesiden er bygget',
  changeIconPackAsk: (name: string) => `Hjemmesiden og editoren får ikonerne fra ${name}, når hjemmesiden er bygget om et par minutter.`,
  changeIconPack: 'Skift ikonpakke',
  iconPackSaved: 'Gemt. Hjemmesiden og editoren får de nye ikoner, når hjemmesiden er bygget.',
  iconPackCommit: (name: string) => `Editor: skift ikonpakke til ${name}`,
  /** A theme whose icon pack is chosen cannot be uninstalled, nor updated to a version without it (ThemeStore.tsx). */
  themeIconPackStuck: 'Temaets ikonpakke er i brug, så temaet kan ikke afinstalleres. Vælg en anden ikonpakke først.',
  themeDropsIconPack: (name: string, pack: string) =>
    `Den nye version af ${name} har ikke ikonpakken ${pack}, som er i brug. Vælg en anden ikonpakke først.`,
  theme: 'Udseende',
  themes: { light: 'Lys', auto: 'Auto', dark: 'Mørk' },
  language: 'Sprog',
  /** The browser's language, else the site's, with the one it is now. */
  languageAuto: (name: string) => `Automatisk: ${name}`,
  /** The search over the languages, for screen readers. */
  languageSearch: 'Søg i sprogene',
  savingOrder: 'Gemmer den nye rækkefølge…',
  orderNotSaved: (error: string) => `Kunne ikke gemme rækkefølgen: ${error}`,
  status: {
    draft: 'Kladde',
    unlisted: 'Skjult',
    scheduled: 'Planlagt',
    /** "Planlagt 1. nov. kl. 8.00" (`when`, when.ts). */
    scheduledAt: (when: string) => `Planlagt ${when}`,
  },
  /** The filter over the pages and posts that shows only those with one status. */
  statusFilter: 'Status',
  /** Its choices: all, and each status there is. */
  statusShown: { all: 'Alle', published: 'Udgivet', draft: 'Kladde', unlisted: 'Skjult', scheduled: 'Planlagt' },
  sort: 'Sortér',
  sorts: {
    nyeste: 'Nyeste først',
    aeldste: 'Ældste først',
    az: 'A–Å',
    za: 'Å–A',
    /** The pages, by when they were last saved. */
    savedNewest: 'Senest ændret først',
    savedOldest: 'Ældst ændret først',
    /** A list of kinds (Promovering), under a heading for each kind. */
    type: 'Efter type',
    /** "Standardblokke" (#blokke), in the groups by where the blocks come from. */
    group: 'Efter gruppe',
  },
  /** The funnel over a list of what is shown on pages (Promovering), with its filters in one sheet. */
  filter: 'Filter',
  /** The filter that shows only those on one page, and its first choice: those on all pages. */
  pageFilter: 'Side',
  allPages: 'Alle sider',
  /** The first choice of a filter by what pages or posts pick, by the field's name: "Alle tags". */
  allOf: (field: string) => `Alle ${field.toLocaleLowerCase('da')}`,
  /** Its headings, when there are both pages and tags to pick. */
  pagesGroup: 'Sider',
  tagsGroup: 'Tags',
  /** The filter by the kind of entry, and its first choice. */
  kindFilter: 'Type',
  allKinds: 'Alle typer',
  /** The filter by whether an entry is turned on, and its first choice. */
  onOffFilter: 'Status',
  allOnOff: 'Alle',
  /** The filters over "Standardblokke" (#blokke): by the group (where the block comes from) and by whether
   * the block is on a page, each with its first choice. */
  groupFilter: 'Gruppe',
  allGroups: 'Alle grupper',
  useFilter: 'Brug',
  allUses: 'Alle',
  inUse: 'I brug',
  /** A filter picked, as a chip under the list's choices, for screen readers. */
  removeFilter: (label: string) => `Fjern filteret ${label}`,
  showAsList: 'Vis som liste',
  showAsMenu: 'Vis som menu',
  /** The Google icon over the pages and posts: their SEO score at the start of each row. */
  showSeo: 'Vis SEO-vurdering',
  hideSeo: 'Skjul SEO-vurdering',
  menu: 'Menuen',
  notInMenu: 'Ikke i menuen',
  pageGone: 'Siden findes ikke',
  showSubpages: 'Vis undersider',
  hideSubpages: 'Skjul undersider',
  showSubpagesOf: (title: string) => `Vis undersider til ${title}`,
  hideSubpagesOf: (title: string) => `Skjul undersider til ${title}`,
  openSidebar: 'Åbn sidepanelet',
  closeSidebar: 'Luk sidepanelet',
  sidebar: 'Sidepanelet',
  breadcrumbs: 'Brødkrummer',
};
