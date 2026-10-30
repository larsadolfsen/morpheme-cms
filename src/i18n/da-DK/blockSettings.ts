// "Blokindstillinger" (BlockSettings.tsx).
export const blockSettings = {
  stillOn: (n: number) => `Blokken bruges på ${n} ${n === 1 ? 'side' : 'sider'}. Fjern den derfra først.`,
  on: 'Til',
  off: 'Fra',
  /** At the right of a block's row, and the filter, when it is off (its switch: active, off). */
  inactive: 'Deaktiveret',
  standard: 'Standardblokke',
  /** In the group of an installed app with neither blocks nor kinds. */
  noBlocks: 'Appen har ingen blokke.',
  isStandard: 'En standardblok.',
  /** A block of an app (src/apps/): the app's name. */
  isApp: (app: string) => `En appblok fra ${app}.`,
  /** An app's kind of a list, a block of the list (a Mailchimp popup, "En promoveringsblok"): the list's name for one, and
   * the app's name. */
  isKind: (one: string, app: string) => `En ${one}sblok fra ${app}.`,
  stuck: 'Blokken bruges på sider og kan ikke slås fra.',
  onHint: 'Vises under Indsæt.',
  offHint: 'Vises ikke under Indsæt.',
  /** The switch of an app's kind of a list, and under it: the list's name, its button for a new one ("Ny promovering"),
   * and its name for more ("promoveringer"). */
  active: 'Aktiveret',
  kindStuck: (more: string) => `Blokken bruges i ${more} og kan ikke slås fra.`,
  kindStillOn: (n: number, what: string) => `Blokken bruges i ${n} ${what}. Slet ${n === 1 ? 'den' : 'dem'} først.`,
  kindOnHint: (create: string) => `Vises under ${create}.`,
  kindOffHint: (create: string) => `Vises ikke under ${create}.`,
  looks: 'Eksempel',
  /** Under the preview: whose fields it has (the page's title). */
  asOn: (page: string) => `Som den vises på ${page}.`,
  empty: 'Et eksempel. Blokken bruges endnu ikke på nogen side.',
  nothing: 'Blokken bruges endnu ikke på nogen side, så der er intet at vise.',
  /** Under the preview of an app's kind of a list: whose fields it has (the entry's name), or none. */
  asIn: (entry: string) => `Som den vises i ${entry}.`,
  kindEmpty: 'Et eksempel. Blokken bruges endnu ikke.',
  kindNothing: 'Blokken bruges endnu ikke, så der er intet at vise.',
  pages: 'Bruges på',
  noPages: 'Ingen sider.',
  /** Over the entries of an app's kind of a list (its name for more), and when there are none. */
  usedIn: 'Bruges i',
  noEntries: (more: string) => `Ingen ${more}.`,
  /** The commits, in the site's language (siteT). */
  commit: {
    on: (block: string) => `Editor: slå blokken til: ${block}`,
    off: (block: string) => `Editor: slå blokken fra: ${block}`,
    kindOn: (kind: string) => `Editor: slå til: ${kind}`,
    kindOff: (kind: string) => `Editor: slå fra: ${kind}`,
  },
};
