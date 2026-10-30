// "Søgeord" under "Interne links" (Keywords.tsx): the keywords of the pages, posts and fixed pages.
export const keywords = {
  title: 'Søgeord',
  searchLabel: 'Søg i søgeordene',
  /** Under a keyword: the page it links to, and whether it is its primary or a secondary one. */
  on: (page: string, primary: boolean) => `${page} · ${primary ? 'Primært søgeord' : 'Sekundært søgeord'}`,
  /** None matching the search. */
  noMatch: 'Ingen søgeord passer.',
  /** No page has a keyword. */
  none: 'Ingen sider har søgeord endnu.',
  /** At the right of a keyword: how many pages and posts link with it on the site, as it was last updated. */
  links: (n: number) => `${n} ${n === 1 ? 'link' : 'links'}`,
  /** The orders: by word (the default), the most or the fewest links first. */
  sorts: { az: 'A–Å', za: 'Å–A', most: 'Flest links først', fewest: 'Færrest links først' },
  /** The filters in the funnel: primary or secondary, with or without links, and the kind of page. */
  whichFilter: 'Søgeord',
  allWhich: 'Primære og sekundære',
  which: { primary: 'Primært søgeord', secondary: 'Sekundært søgeord' },
  linksFilter: 'Links',
  allLinks: 'Med og uden links',
  linked: { with: 'Med links', without: 'Uden links' },
  kindFilter: 'Slags',
  allKinds: 'Alle slags sider',
};
