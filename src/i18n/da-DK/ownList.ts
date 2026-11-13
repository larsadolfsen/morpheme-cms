// De lister, ejeren selv laver (lib/ownList.mjs, src/ownLists.ts, src/OwnListSheet.tsx), på dansk (../en-US/ownList.ts).
import type { Messages } from '../en-US';

export const ownList: Messages['ownList'] = {
  icon: 'Ikon',
  title: 'Overskrift',
  text: 'Brødtekst',
  image: 'Billede',
  href: 'Link',
  tags: 'Tags',
  addTag: 'Tilføj tag',
  createTag: 'Opret et tag',
  create: 'Tilføj række',
  singular: 'Række',
  list: 'liste',
  edit: 'Rediger liste',
  delete: 'Slet liste',
  menu: 'Listemenu',
  name: 'Navn',
  fields: 'Felter',
  titleOn: 'Overskriften er altid slået til.',
  held: (n) => `Data i ${n} ${n === 1 ? 'række' : 'rækker'} bliver, til du fjerner det.`,
  removeData: 'Fjern data',
  removeDataAsk: (field, n) => `Fjerne ${field.toLowerCase()} fra ${n} ${n === 1 ? 'række' : 'rækker'} for altid?`,
  used: (n) => `Listen bruges på ${n} ${n === 1 ? 'side' : 'sider'}. Fjern den derfra først.`,
  deleteAsk: (label, n) => `Slette ${label} og dens ${n} ${n === 1 ? 'række' : 'rækker'}?`,
};
