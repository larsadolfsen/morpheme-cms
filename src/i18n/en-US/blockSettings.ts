// "Block settings" (BlockSettings.tsx).
export const blockSettings = {
  stillOn: (n: number) => `The block is used on ${n} ${n === 1 ? 'page' : 'pages'}. Remove it from there first.`,
  /** At the right of a block's row, and the filter, when it is off (its switch: active, off). */
  inactive: 'Disabled',
  standard: 'Standard blocks',
  /** The headings of the standard blocks in `Insert` (BlockDialog.tsx), by what the blocks do. */
  groups: {
    cards: 'Cards',
    lists: 'Lists',
    content: 'From your content',
    banners: 'Banners',
    buttons: 'Buttons',
    media: 'Media',
  },
  /** In the group of an installed app with neither blocks nor kinds. */
  noBlocks: 'The app has no blocks',
  isStandard: 'A standard block.',
  /** A block of an app (src/apps/): the app's name. */
  isApp: (app: string) => `An app block from ${app}.`,
  /** An app's kind of a list, a block of the list (a Mailchimp popup, "En promoveringsblok"): the list's name for one, and
   * the app's name. */
  isKind: (one: string, app: string) => `A ${one} block from ${app}.`,
  stuck: 'The block is used on pages and can’t be turned off',
  onHint: 'Shown under Insert.',
  offHint: 'Not shown under Insert.',
  /** The switch of an app's kind of a list, and under it: the list's name, its button for a new one ("New promotion"),
   * and its name for more ("promoveringer"). */
  active: 'Enabled',
  kindStuck: (more: string) => `The block is used in ${more} and can’t be turned off`,
  kindStillOn: (n: number, what: string) => `The block is used in ${n} ${what}. Delete ${n === 1 ? 'it' : 'them'} first.`,
  kindOnHint: (create: string) => `Shown under ${create}.`,
  kindOffHint: (create: string) => `Not shown under ${create}.`,
  looks: 'Example',
  /** Under the preview: whose fields it has (the page's title). */
  asOn: (page: string) => `As shown on ${page}`,
  empty: 'An example. The block isn’t used on any page yet.',
  nothing: 'The block isn’t used on any page yet, so there’s nothing to show',
  /** Under the preview of an app's kind of a list: whose fields it has (the entry's name), or none. */
  asIn: (entry: string) => `As shown in ${entry}`,
  kindEmpty: 'An example. The block isn’t used yet.',
  kindNothing: 'The block isn’t used yet, so there’s nothing to show',
  pages: 'Used on',
  noPages: 'No pages',
  /** Over the entries of an app's kind of a list (its name for more), and when there are none. */
  usedIn: 'Used in',
  noEntries: (more: string) => `No ${more}`,
  /** The commits, in the site's language (siteT). */
  commit: {
    on: (block: string) => `Editor: turn on the block: ${block}`,
    off: (block: string) => `Editor: turn off the block: ${block}`,
    kindOn: (kind: string) => `Editor: turn on: ${kind}`,
    kindOff: (kind: string) => `Editor: turn off: ${kind}`,
  },
};
