// "Samtykker" under "Privatliv" (Consents.tsx, consents.ts): the visitors' answers in the cookie banner.
export const consents = {
  title: 'Samtykker',
  intro: 'De besøgendes svar i cookiebanneret, med det samtykke-id, banneret viser dem. De slettes efter 2 år.',
  count: (n: number) => `${n} svar`,
  searchLabel: 'Søg efter samtykke-id',
  sorts: { newest: 'Nyeste først', oldest: 'Ældste først' },
  download: 'Hent som CSV',
  loading: 'Henter samtykkerne',
  notLoaded: (error: string) => `Kunne ikke hente samtykkerne: ${error}`,
  /** Without the Worker's storage (a preview of a branch, or the site on another host). */
  notKept: 'Samtykkerne gemmes kun på det udgivne site.',
  /** None, or none matching the search. */
  none: (query: string) => (query ? `Intet samtykke-id begynder med "${query}".` : 'Ingen har svaret endnu.'),
  /** Under the id in a row: the yes and no as one line ("Ja: Statistik · Nej: Marketing"). */
  yes: 'Ja',
  no: 'Nej',
  /** In the sheet of one answer. */
  answered: (when: string) => `Svarede ${when}.`,
  version: (commit: string) => `Cookiebanneret fra version ${commit}.`,
  deleteAll: 'Slet svarene med dette id',
  deleteAsk: (id: string) => `Slet alle svar med samtykke-id ${id}? Det kan ikke fortrydes.`,
  deleted: 'Svarene er slettet',
  notDeleted: (error: string) => `Kunne ikke slette svarene: ${error}`,
};
