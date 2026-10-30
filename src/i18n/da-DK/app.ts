// The editor's frame (App.tsx, FormFrame.tsx, ask.tsx), logging in and saving to GitHub (github.ts, cache.ts), pictures (images.ts) and addresses (addresses.ts, checkSite.ts).
export const app = {
  logIn: 'Log ind med GitHub',
  loading: 'Henter hjemmesidens indhold',
  cannotSave: (login: string) => `${login} har ikke adgang til at gemme. Log ind med en anden GitHub-konto under Konto.`,
  notFound: 'Findes ikke',
  nothingAt: (route: string) => `Der er ikke noget på adressen ${route}.`,
  /** After a save, when the site has been rebuilt with it (or not). */
  siteUpdated: 'Hjemmesiden er opdateret med dine ændringer.',
  siteNotUpdated: 'Hjemmesiden blev ikke opdateret. Gendan den forrige version under Tidligere versioner.',
  /** Why a new page or post cannot have an address. */
  addressTaken: (address: string) => `Der findes allerede en side eller et blogindlæg med adressen ${address}.`,
  addressRedirects: (address: string, name: string) => `Adressen ${address} sender i dag besøgende videre til ${name}.`,
  addressLoop: (loop: string) => `Adressen kan ikke ændres, fordi videresendelserne ville gå i ring (${loop}).`,
  deleteEntry: (singular: string) => `Slet ${singular}? Det kan gendannes under Slettede.`,
  notDeleted: (error: string) => `Kunne ikke slette: ${error}`,
  /** The top bar's line under the title, and the save bar (FormFrame.tsx); the dots hop after it. */
  busy: { saving: 'Gemmer', deleting: 'Sletter' },
  lastSaved: (when: string) => `Sidst ændret ${when}`,
  notSavedYet: 'Ikke gemt endnu',
  /** Leaving a form with changes that are not saved (mayLeave, FormFrame.tsx): "Gem", "Kassér" or "Annuller". */
  unsavedTitle: 'Gem ændringerne?',
  unsaved: 'Du har ændringer, der ikke er gemt.',
  discard: 'Kassér',
  /** A sheet closed with changes (closeChanged, ask.tsx). */
  unsavedSheet: 'Du har ændringer, der ikke er gemt. Vil du beholde dem?',
  viewOnSite: 'Se på hjemmesiden',
  /** GitHub (github.ts). */
  loggedOut: 'Du er blevet logget ud. Log ind igen.',
  githubAnswered: (status: number) => `GitHub svarede ${status}.`,
  pictureNotLoaded: 'Billedet kunne ikke hentes fra GitHub. Tjek forbindelsen og prøv igen.',
  pictureNotWhole: 'Billedet kunne ikke hentes helt. Prøv igen.',
  changedElsewhere: 'Filen er ændret et andet sted. Kopiér din tekst, og genindlæs siden.',
  fileExists: 'Der findes allerede en fil med det navn. Prøv igen, eller vælg en anden titel.',
  /** A picture made ready before upload (images.ts). */
  pictureNotOpened: 'Billedet kunne ikke åbnes. Brug et JPEG-, PNG- eller WebP-billede.',
  pictureNotReady: 'Billedet kunne ikke klargøres.',
  preparingPicture: 'Klargør billedet…',
  /** The check before the build (checkSite.ts). */
  invalidJson: 'Filen er ikke gyldig JSON.',
  blocksOff: 'Slået fra',
  block: 'Blok',
  appsInstalled: 'Installeret',
  app: 'App',
  /** The commits, in the site's language (siteT). */
  commit: {
    delete: (singular: string, slug: string) => `Editor: slet ${singular} "${slug}"`,
    reorder: (label: string) => `Editor: ny rækkefølge for ${label}`,
  },
};
