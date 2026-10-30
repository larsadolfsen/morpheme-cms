// The history: earlier versions of a page, a post or another file (Versions.tsx) and what was deleted
// (Deleted.tsx).
export const history = {
  /** The button in the top bar of a form, and the sheet it opens. */
  versions: 'Tidligere versioner',
  loading: 'Henter versionerne',
  notLoaded: (error: string) => `Kunne ikke hente versionerne: ${error}`,
  none: 'Der er ingen tidligere versioner.',
  /** Who saved a version (their name on GitHub). */
  by: (name: string) => `Gemt af ${name}`,
  /** The newest version: the one saved now. */
  current: 'Nuværende version',
  more: 'Vis ældre versioner',
  /** A version is opened in the form, as changes that are not saved yet. */
  opening: 'Henter versionen…',
  notThere: 'Filen fandtes ikke i den version.',
  notOpened: (error: string) => `Kunne ikke åbne versionen: ${error}`,
  shownTitle: (when: string) => `Versionen fra ${when}`,
  shownText: 'Tryk Gem ændringer for at gendanne den.',
  cannotShow: 'Versionen kan ikke vises. Du ser den nuværende.',
  showCurrent: 'Vis den nuværende version',
  /** What was deleted from a list ("Slettede blogindlæg"), and what it says under each. */
  deletedOf: (label: string) => `Slettede ${label.charAt(0).toLowerCase()}${label.slice(1)}`,
  deletedNote: 'Slettede elementer kan gendannes.',
  /** What was deleted from Filer: "Slettede filer". */
  files: 'filer',
  loadingDeleted: 'Henter slettede elementer',
  deletedNotLoaded: (error: string) => `Kunne ikke hente slettede elementer: ${error}`,
  noneDeleted: 'Der er ikke slettet noget for nylig.',
  deletedAt: (when: string, by: string) => (by ? `Slettet ${when} af ${by}` : `Slettet ${when}`),
  restore: 'Gendan',
  restoreAsk: (name: string) => `Gendan ${name}?`,
  restoring: 'Gendanner…',
  /** The address a deleted page or post had is taken now; `reason` says by what. */
  restoreTaken: (reason: string) => `${reason} Den kan ikke gendannes på sin gamle adresse.`,
  notRestored: (error: string) => `Kunne ikke gendanne: ${error}`,
  restored: 'Gendannet. Du får besked, når hjemmesiden er opdateret.',
  open: 'Åbn',
  /** The commits, in the site's language (siteT); `what` is a name or a file name in quotation marks. */
  commit: {
    restoreVersion: (what: string, when: string) => `Editor: gendan ${what} fra ${when}`,
    restoreDeleted: (singular: string, what: string) => `Editor: gendan ${singular} ${what}`,
  },
};
