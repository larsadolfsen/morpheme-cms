// "Samtykker" under "Privatliv" (Consents.tsx, consentData.ts): the visitors' answers in the cookie banner.
export const consents = {
  title: 'Consents',
  intro: 'The visitors’ answers in the cookie banner, with the consent ID the banner shows them. Answers are kept for 2 years.',
  count: (n: number) => `${n} ${n === 1 ? 'answer' : 'answers'}`,
  searchLabel: 'Search by consent ID',
  sorts: { newest: 'Newest first', oldest: 'Oldest first' },
  download: 'Download as CSV',
  loading: 'Loading the consents…',
  notLoaded: (error: string) => `Couldn’t load the consents: ${error}`,
  /** Answers aren't stored in a preview of a branch, or on the site on another host. */
  notKept: 'Consents are kept only on the published website',
  /** None, or none matching the search. */
  none: (query: string) => (query ? `No consent ID starts with "${query}"` : 'No one has answered yet'),
  /** Under the id in a row: the yes and no as one line ("Ja: Statistik · Nej: Marketing"). */
  yes: 'Yes',
  no: 'No',
  /** In the sheet of one answer. */
  answered: (when: string) => `Answered ${when}`,
  version: (commit: string) => `The cookie banner of version ${commit}`,
  deleteAll: 'Delete the answers with this ID',
  deleteAsk: (id: string) => `Delete every answer with consent ID ${id}? This can’t be undone.`,
  deleted: 'The answers have been deleted',
  notDeleted: (error: string) => `Couldn’t delete the answers: ${error}`,
};
