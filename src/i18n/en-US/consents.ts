// "Consents" under "Privacy" (Consents.tsx, consents.ts), as in Danish (../da-DK/consents.ts).
import type { Messages } from '../da-DK';

export const consents: Messages['consents'] = {
  title: 'Consents',
  intro: 'The visitors’ answers in the cookie banner, with the consent ID the banner shows them. They are deleted after 2 years.',
  count: (n: number) => `${n} ${n === 1 ? 'answer' : 'answers'}`,
  searchLabel: 'Search by consent ID',
  sorts: { newest: 'Newest first', oldest: 'Oldest first' },
  download: 'Download as CSV',
  loading: 'Loading the consents',
  notLoaded: (error: string) => `Could not load the consents: ${error}`,
  notKept: 'Consents are kept only on the published site.',
  none: (query: string) => (query ? `No consent ID starts with "${query}".` : 'No one has answered yet.'),
  yes: 'Yes',
  no: 'No',
  answered: (when: string) => `Answered ${when}.`,
  version: (commit: string) => `The cookie banner of version ${commit}.`,
  deleteAll: 'Delete the answers with this ID',
  deleteAsk: (id: string) => `Delete every answer with consent ID ${id}? This cannot be undone.`,
  deleted: 'The answers have been deleted',
  notDeleted: (error: string) => `Could not delete the answers: ${error}`,
};
