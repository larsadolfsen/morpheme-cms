// "Consents" under "Privacy" (Consents.tsx, consentData.ts), as in Danish (../da-DK/consents.ts).
import type { Messages } from '../en-US';

export const consents: Messages['consents'] = {
  title: 'Samtykker',
  intro: 'De besøgendes svar i cookiebanneret, med det samtykke-id, banneret viser dem. De slettes efter 2 år.',
  count: (n) => `${n} svar`,
  searchLabel: 'Søg efter samtykke-id',
  sorts: { newest: 'Nyeste først', oldest: 'Ældste først' },
  download: 'Hent som CSV',
  loading: 'Henter samtykkerne',
  notLoaded: (error) => `Kunne ikke hente samtykkerne: ${error}`,
  notKept: 'Samtykkerne gemmes kun på det udgivne site.',
  none: (query) => (query ? `Intet samtykke-id begynder med "${query}".` : 'Ingen har svaret endnu.'),
  yes: 'Ja',
  no: 'Nej',
  answered: (when) => `Svarede ${when}.`,
  version: (commit) => `Cookiebanneret fra version ${commit}.`,
  deleteAll: 'Slet svarene med dette id',
  deleteAsk: (id) => `Slet alle svar med samtykke-id ${id}? Det kan ikke fortrydes.`,
  deleted: 'Svarene er slettet',
  notDeleted: (error) => `Kunne ikke slette svarene: ${error}`,
};
