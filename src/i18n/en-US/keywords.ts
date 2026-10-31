// "Søgeord" under "Interne links" (Keywords.tsx): the keywords of the pages, posts and fixed pages.
export const keywords = {
  title: 'Keywords',
  searchLabel: 'Search the keywords',
  /** Under a keyword: the page it links to, and whether it is its primary or a secondary one. */
  on: (page: string, primary: boolean) => `${page} · ${primary ? 'Primary keyword' : 'Secondary keyword'}`,
  /** None matching the search. */
  noMatch: 'No keywords match',
  /** No page has a keyword. */
  none: 'No pages have keywords yet',
  /** At the right of a keyword: how many pages and posts link with it on the site, as it was last updated. */
  links: (n: number) => `${n} ${n === 1 ? 'link' : 'links'}`,
  /** The orders: by word (the default), the most or the fewest links first. */
  sorts: { az: 'A–Z', za: 'Z–A', most: 'Most links first', fewest: 'Fewest links first' },
  /** The filters in the funnel: primary or secondary, with or without links, and the kind of page. */
  whichFilter: 'Keywords',
  allWhich: 'Primary and secondary',
  which: { primary: 'Primary keyword', secondary: 'Secondary keyword' },
  linksFilter: 'Links',
  allLinks: 'With and without links',
  linked: { with: 'With links', without: 'Without links' },
  kindFilter: 'Kind',
  allKinds: 'All kinds of pages',
};
