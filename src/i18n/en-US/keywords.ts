import type { Messages } from '../da-DK';

export const keywords: Messages['keywords'] = {
  title: 'Keywords',
  searchLabel: 'Search the keywords',
  on: (page, primary) => `${page} · ${primary ? 'Primary keyword' : 'Secondary keyword'}`,
  noMatch: 'No keywords match.',
  none: 'No pages have keywords yet.',
  links: (n) => `${n} ${n === 1 ? 'link' : 'links'}`,
  sorts: { az: 'A–Z', za: 'Z–A', most: 'Most links first', fewest: 'Fewest links first' },
  whichFilter: 'Keywords',
  allWhich: 'Primary and secondary',
  which: { primary: 'Primary keyword', secondary: 'Secondary keyword' },
  linksFilter: 'Links',
  allLinks: 'With and without links',
  linked: { with: 'With links', without: 'Without links' },
  kindFilter: 'Kind',
  allKinds: 'All kinds of pages',
};
