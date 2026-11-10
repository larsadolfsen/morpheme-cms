// The start screen, the lists and the account (Library.tsx), the top bar (Screen.tsx) and the sheets
// with choices (Sheet.tsx).
export const library = {
  siteUpdated: (when: string) => `Updated ${when}`,
  /** The CMS's name and version on the start screen (CmsVersion.tsx), before the update time. */
  cmsVersion: (version: string) => `Morpheme ${version}`,
  /** Between the CMS version and the update time in the start screen's status. */
  statusSeparator: ' · ',
  /** The start screen's FAB menu (StartFab.tsx), which makes a new page or blog post. */
  createNew: 'Create',
  /** On the start screen (widgets/continue.tsx): the card with the last three pages and blog posts saved. */
  continueTitle: 'Continue where you left off',
  /** The widget's name in the list of widgets to add, and on its card in edit mode. */
  continueWidgetLabel: 'Continue',
  /** Its line in that list. */
  continueWidgetHint: 'Shows the pages and posts you edited last.',
  /** In that card before anything is saved. */
  continueEmpty: 'The pages and posts you edit show up here.',
  /** On the start screen (widgets/unfinished.tsx): the card with the drafts, hidden and scheduled pages and posts. */
  unfinishedTitle: 'Unfinished',
  /** In the list "Add widget" and on the card in edit mode. */
  unfinishedWidgetLabel: 'Unfinished',
  unfinishedWidgetHint: 'Lists the drafts, hidden and scheduled pages and posts.',
  /** In the card, in edit mode, when no page or post is unfinished. */
  unfinishedEmpty: 'Nothing is unfinished',
  /** Under each of them: its kind ("Page") and when it was saved ("today at 1:42 PM", when.ts). */
  recentEdit: (kind: string, when: string) => `${kind} · Edited ${when}`,
  /** At the top of the start screen (UpdatesNotice.tsx): the card with what was updated since the last visit in this
   * browser. Its headline: the CMS's name, its edition (the place the edition's photo is from: "Braies") and its new
   * version; without an edition, cmsVersion; with only apps updated, how many (appsUpdated). */
  cmsEdition: (edition: string, version: string) => `Morpheme ${edition} ${version}`,
  appsUpdated: (count: number) => (count === 1 ? '1 app updated' : `${count} apps updated`),
  /** Under the CMS's new version: how many new things its release notes have since the version seen last. */
  newThings: (count: number) => (count === 1 ? '1 new thing' : `${count} new things`),
  /** The button to the Morpheme page, with all the release notes. */
  readMore: 'Read more',
  /** The info button on the edition's photo in that card, and its tooltip: who took the photo, and a link to its
   * licence under "Licenses". */
  photoInfo: 'About the photo',
  photoBy: (name: string) => `Photo by ${name} on Unsplash`,
  /** The same for a photo whose photographer isn't known. */
  photoFromUnsplash: 'Photo from Unsplash',
  photoLicense: 'See license',
  /** Under an updated app's name. */
  appUpdatedTo: (version: string) => `Updated to ${version}`,
  githubAccount: (login: string) => `GitHub account: ${login}`,
  logOut: 'Log out',
  /** The bell in the top bar and its side sheet (Notifications.tsx): the messages shown at the bottom. */
  notifications: 'Notifications',
  /** The bell's name while some are not seen yet. */
  notificationsNew: (count: number) => `Notifications, ${count} new`,
  noNotifications: 'No notifications',
  /** The buttons at the bottom of the side sheet: one clears all, one opens "Account" to choose the types. */
  clearNotifications: 'Clear',
  /** While some are selected (a long press on one, Notifications.tsx): the button that deletes them, and the one that
   * unselects them. */
  deleteSelected: (count: number) => `Delete ${count} selected`,
  cancelSelection: 'Cancel',
  /** The link in the top bar of the start screen: the site's home page, in a new tab. */
  openWebsite: 'Open website',
  /** On "Account" › "Notifications" (Library.tsx NotificationChoices, notificationData.ts). */
  /** The sliders on "Notifications": to "Account", where they are turned on or off. */
  notificationChoices: 'Settings',
  onDevice: 'On the phone',
  onDeviceHint: 'Also when the editor is closed.',
  deviceBlocked: 'The phone or browser doesn’t allow notifications from the editor. Turn them on in its settings.',
  notificationTypes: { site: 'Website updated', saved: 'Saved and deleted', failed: 'Couldn’t save', updates: 'Apps updated' },
  on: 'On',
  off: 'Off',
  /** Under a theme's name under "Themes" and on its page: its version and who made it. */
  themeByline: (version: string, author: string) => `Version ${version} · ${author}`,
  /** By the theme the website uses, under "Themes" and on its page. */
  themeInUse: 'In use',
  /** By the theme it is changed to, until the website is updated: under "Themes", and on its page. */
  themeNext: 'Changing to it',
  themeChanging: (name: string) => `Changing to ${name} in a few minutes`,
  /** On a theme's page: the pictures of the site in it (packages/editor/scripts/theme-screenshots.mjs), each by what it shows. */
  themeLooks: 'What your website looks like',
  themeShots: {
    front: 'The front page',
    'front-dark': 'The front page in dark mode',
    blog: 'The blog page',
    contact: 'The contact page',
  } as Record<string, string>,
  /** Its description, what it gives the site (its highlights) and what stays when it is used. */
  themeAbout: 'About the theme',
  themeHighlights: 'What you get',
  themeKept: 'What stays as it is',
  themeKeptContent: 'Pages and posts',
  themeKeptBrand: 'Colors and logo',
  themeKeptBlocks: "All blocks, in the theme's look",
  /** The button on a theme's page that swaps the theme the website uses to it. */
  useTheme: 'Use the theme',
  /** The question's button before the theme is changed. */
  changeTheme: 'Change theme',
  /** Asked before the theme is changed. */
  changeThemeAsk: (name: string) => `The website gets the theme ${name} in a few minutes`,
  /** The commit, in the site's language (siteT). */
  themeCommit: (name: string) => `Editor: change theme to ${name}`,
  /** A theme from the store (ThemeStore.tsx): installed, updated or uninstalled, asked before it is uninstalled, why
   * one in use cannot be, and under "Uninstall" when it can; a theme the store does not have; how many a developer
   * has made; and the commits, in the site's language (siteT). */
  themeInstalled: (name: string) => `${name} is installed. You can choose it in a few minutes.`,
  themeUpdated: (name: string, version: string) => `${name} is updated to ${version}. The website uses it in a few minutes.`,
  themeUninstalled: (name: string) => `${name} is uninstalled`,
  askUninstallTheme: (name: string) => `Uninstall ${name}? The theme is removed from the website.`,
  themeStuck: 'The theme is in use and can’t be uninstalled. Choose another theme first.',
  themeUninstallHint: 'Can be uninstalled, as the website doesn’t use the theme.',
  themePendingHint: 'You can choose the theme in a few minutes.',
  themeNotInStore: 'The theme isn’t in the Appstore',
  themeCount: (n: number) => (n === 1 ? '1 theme' : `${n} themes`),
  searchThemes: 'Search for themes',
  themeCommits: {
    install: (name: string) => `Editor: install the theme ${name}`,
    uninstall: (name: string) => `Editor: uninstall the theme ${name}`,
    update: (name: string, version: string) => `Editor: update the theme ${name} to ${version}`,
  },
  /** Under "Icon packs" (IconPacks in Library.tsx): under a pack's name who made it, its licence and, for one a theme
   * brings, the theme; a few of its icons, for screen readers; by the one the site is built with, and by the one chosen
   * until the site is built with it; asked before it is chosen, the question's button, what is said after it is saved,
   * and the commit, in the site's language (siteT). */
  iconPackByline: (author: string, license: string) => `${author} · ${license}`,
  iconPackFrom: (theme: string) => `From the theme ${theme}`,
  iconPackSamples: (name: string) => `Icons from ${name}`,
  iconPackInUse: 'In use',
  iconPackNext: 'Changing to it in a few minutes',
  changeIconPackAsk: (name: string) => `The website and the editor get the icons from ${name} in a few minutes`,
  changeIconPack: 'Change icon pack',
  iconPackSaved: (change: string) => `${change}. The website and the editor get the new icons in a few minutes.`,
  iconPackCommit: (name: string) => `Editor: change icon pack to ${name}`,
  /** Under "Motion" (MotionSchemes in Library.tsx): each motion scheme's name and how it moves (lib/motion.ts); by the
   * theme's own; asked before one is chosen, the question's button, what is said after it is saved, and the commit, in
   * the site's language (siteT). */
  motionSchemes: { expressive: 'Expressive', standard: 'Standard', calm: 'Calm' },
  motionHints: {
    expressive: 'What moves overshoots a little and settles',
    standard: 'What moves glides into place',
    calm: 'What moves does so briefly, and sections are shown right away',
  },
  motionOfTheme: 'The theme’s choice',
  changeMotionAsk: (name: string) => `The website gets the ${name} motion in a few minutes. The editor gets it right away.`,
  changeMotion: 'Change motion',
  motionSaved: (change: string) => `${change}. The website gets the new motion in a few minutes.`,
  motionCommit: (name: string) => `Editor: change motion to ${name}`,
  /** Appearance › Header (HeaderSettings.tsx): the group with the menu button's side. */
  headerMenuButton: 'Menu button',
  /** Appearance › Footer (FooterSettings.tsx): the groups of the footer's fields. */
  footerSections: { text: 'Text', contact: 'Contact', links: 'Links' },
  /** Under "Side column" (SideColumn.tsx): the choice of no block and what is under it, what is said when no block can be
   * drawn there, asked before one is chosen, the question's button, what is said after it is saved, and the commit, in
   * the site's language (siteT). */
  sideNone: 'None',
  sideNoneHint: 'The pages have no column beside their text',
  sideEmpty: 'No installed block can be drawn beside the text of a page.',
  changeSideAsk: (name: string) => `The pages get the column ${name} once the website is built in a few minutes.`,
  changeSideNoneAsk: 'The pages lose the column beside their text once the website is built in a few minutes.',
  changeSide: 'Change side column',
  sideSaved: (change: string) => `${change}. The website gets the change once it’s built.`,
  sideCommit: (name: string) => `Editor: change side column to ${name}`,
  sideCommitNone: 'Editor: turn off the side column',
  /** A theme whose icon pack is chosen cannot be uninstalled, nor updated to a version without it (ThemeStore.tsx). */
  themeIconPackStuck: "The theme's icon pack is in use, so the theme can’t be uninstalled. Choose another icon pack first.",
  themeDropsIconPack: (name: string, pack: string) =>
    `The new version of ${name} doesn’t have the icon pack ${pack}, which is in use. Choose another icon pack first.`,
  theme: 'Appearance',
  themes: { light: 'Light', auto: 'Auto', dark: 'Dark' },
  language: 'Language',
  /** The browser's language, else the site's, with the one it is now. */
  languageAuto: (name: string) => `Automatic: ${name}`,
  /** The search over the languages, for screen readers. */
  languageSearch: 'Search the languages',
  savingOrder: 'Saving the new order…',
  orderNotSaved: (error: string) => `Couldn’t save the order: ${error}`,
  status: {
    draft: 'Draft',
    unlisted: 'Hidden',
    scheduled: 'Scheduled',
    /** "Planlagt 1. nov. kl. 8.00" (`when`, when.ts). */
    scheduledAt: (when: string) => `Scheduled ${when}`,
  },
  /** The filter over the pages and posts that shows only those with one status. */
  statusFilter: 'Status',
  /** Its choices: all, and each status there is. */
  statusShown: { all: 'All', published: 'Published', draft: 'Draft', unlisted: 'Hidden', scheduled: 'Scheduled' },
  sort: 'Sort',
  sorts: {
    newest: 'Newest first',
    oldest: 'Oldest first',
    az: 'A–Z',
    za: 'Z–A',
    /** The pages, by when they were last saved. */
    savedNewest: 'Most recently changed first',
    savedOldest: 'Least recently changed first',
    /** A list of kinds (Promovering), under a heading for each kind. */
    type: 'By type',
    /** "Standard blocks" (#blocks), in the groups by where the blocks come from. */
    group: 'By group',
  },
  /** The funnel over a list of what is shown on pages (Promovering), with its filters in one sheet. */
  filter: 'Filter',
  /** The filter that shows only those on one page, and its first choice: those on all pages. */
  pageFilter: 'Page',
  allPages: 'All pages',
  /** The first choice of a filter by what pages or posts pick, by the field's name: "All tags". */
  allOf: (field: string) => `All ${field.toLocaleLowerCase('en')}`,
  /** Its headings, when there are both pages and tags to pick. */
  pagesGroup: 'Pages',
  tagsGroup: 'Tags',
  /** The filter by the kind of entry, and its first choice. */
  kindFilter: 'Type',
  allKinds: 'All types',
  /** The filter by whether an entry is turned on, and its first choice. */
  onOffFilter: 'Status',
  allOnOff: 'All',
  /** The filters over "Standard blocks" (#blocks): by the group (where the block comes from) and by whether
   * the block is on a page, each with its first choice. */
  groupFilter: 'Group',
  allGroups: 'All groups',
  useFilter: 'Use',
  allUses: 'All',
  inUse: 'In use',
  /** A filter picked, as a chip under the list's choices, for screen readers. */
  removeFilter: (label: string) => `Remove the filter ${label}`,
  showAsList: 'Show as a list',
  showAsMenu: 'Show as menu',
  /** The Google icon over the pages and posts: their SEO score at the start of each row. */
  showSeo: 'Show SEO rating',
  hideSeo: 'Hide SEO rating',
  menu: 'The menu',
  notInMenu: 'Not in the menu',
  pageGone: 'The page doesn’t exist',
  showSubpages: 'Show subpages',
  hideSubpages: 'Hide subpages',
  showSubpagesOf: (title: string) => `Show subpages of ${title}`,
  hideSubpagesOf: (title: string) => `Hide subpages of ${title}`,
  /** The name of the main navigation drawer (the site's parts in four sections). */
  navigation: 'Navigation',
  /** The top bar's menu button, which opens and closes that drawer. */
  openMenu: 'Open the menu',
  closeMenu: 'Close the menu',
  /** The first level of the main drawer: the name of the back row's target (its accessible name is "Back to Main menu"). */
  mainMenu: 'Main menu',
  /** The visible label of the back row in the main drawer's header, on a section's list. */
  back: 'Back',
  breadcrumbs: 'Breadcrumbs',
};
