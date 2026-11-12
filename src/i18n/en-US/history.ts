// The history: earlier versions of a page, a post or another file (Versions.tsx) and what was deleted
// (Deleted.tsx).
export const history = {
  /** The button in the top bar of a form, and the sheet it opens. */
  versions: 'Earlier versions',
  loading: 'Loading the versions…',
  notLoaded: (error: string) => `Couldn’t load the versions: ${error}`,
  none: 'There are no earlier versions',
  /** Who saved a version (their name on GitHub). */
  by: (name: string) => `Saved by ${name}`,
  /** The newest version: the one saved now. */
  current: 'Current version',
  more: 'Show older versions',
  /** A version is opened in the form, as changes that are not saved yet. */
  opening: 'Loading the version…',
  notThere: 'The file didn’t exist in that version',
  notOpened: (error: string) => `Couldn’t open the version: ${error}`,
  shownTitle: (when: string) => `The version from ${when}`,
  shownText: 'Tap Save changes to restore it',
  cannotShow: 'The version can’t be shown. You’re seeing the current one.',
  showCurrent: 'Show the current version',
  /** What was deleted from a list ("Deleted blog posts"), and what it says under each. */
  deletedOf: (label: string) => `Deleted ${label.charAt(0).toLowerCase()}${label.slice(1)}`,
  deletedNote: 'Deleted items can be restored.',
  /** What was deleted from Filer: "Slettede filer". */
  files: 'files',
  loadingDeleted: 'Loading deleted items…',
  deletedNotLoaded: (error: string) => `Couldn’t load deleted items: ${error}`,
  noneDeleted: 'Nothing has been deleted recently',
  deletedAt: (when: string, by: string) => (by ? `Deleted ${when} by ${by}` : `Deleted ${when}`),
  restore: 'Restore',
  restoreAsk: (name: string) => `Restore ${name}?`,
  restoring: 'Restoring…',
  /** The address a deleted page or post had is taken now; `reason` says by what. */
  restoreTaken: (reason: string) => `${reason} It can’t be restored at its old address.`,
  notRestored: (error: string) => `Couldn’t restore: ${error}`,
  open: 'Open',
  /** The commits, in the site's language (siteT); `what` is a name or a file name in quotation marks. */
  commit: {
    restoreVersion: (what: string, when: string) => `Editor: restore ${what} from ${when}`,
    restoreDeleted: (singular: string, what: string) => `Editor: restore ${singular} ${what}`,
  },
};
