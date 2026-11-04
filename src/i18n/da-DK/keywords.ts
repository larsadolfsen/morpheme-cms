import type { Messages } from '../en-US';

export const keywords: Messages['keywords'] = {
  title: 'Søgeord',
  searchLabel: 'Søg i søgeordene',
  on: (page, primary) => `${page} · ${primary ? 'Primært søgeord' : 'Sekundært søgeord'}`,
  noMatch: 'Ingen søgeord passer',
  none: 'Ingen sider har søgeord endnu',
  links: (n) => `${n} ${n === 1 ? 'link' : 'links'}`,
  sorts: { az: 'A–Å', za: 'Å–A', most: 'Flest links først', fewest: 'Færrest links først' },
  whichFilter: 'Søgeord',
  allWhich: 'Primære og sekundære',
  which: { primary: 'Primært søgeord', secondary: 'Sekundært søgeord' },
  linksFilter: 'Links',
  allLinks: 'Med og uden links',
  linked: { with: 'Med links', without: 'Uden links' },
  kindFilter: 'Slags',
  allKinds: 'Alle slags sider',
};
