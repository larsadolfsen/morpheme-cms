import type { Messages } from '../en-US';

export const palette: Messages['palette'] = {
  open: 'Søg',
  label: 'Søg i handlinger og sider',
  back: 'Luk søgning',
  clear: 'Ryd',
  recent: 'Seneste',
  suggested: 'Foreslået',
  empty: (query) => `Ingen resultater for “${query}”`,
  none: 'Ingen resultater',
  clearRecent: 'Ryd seneste handlinger',
  shortcuts: 'Tastaturgenveje',
  count: (n) => (n === 1 ? '1 resultat' : `${n} resultater`),
  groups: {
    go: 'Gå til',
    pages: 'Sider og indlæg',
    page: 'Side',
    text: 'Tekst',
    insert: 'Indsæt',
    section: 'Sektion',
    block: 'Blok',
    table: 'Tabel',
    image: 'Billede',
    list: 'Liste',
    setting: 'Indstillinger',
    app: 'Apps',
  },
};
