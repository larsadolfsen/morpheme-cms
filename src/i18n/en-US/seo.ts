import type { Messages } from '../da-DK';

export const seo: Messages['seo'] = {
  title: 'SEO rating',
  intro: 'The same rating as under Search engines on each page and blog post.',
  average: (score: number) => `Average ${score} of 100`,
  searchLabel: 'Search the pages and blog posts',
  sorts: { low: 'Lowest first', high: 'Highest first', az: 'A–Z', za: 'Z–A' },
  scoreLabel: (score: number) => `SEO rating ${score} of 100`,
  ratingFilter: 'Rating',
  allRatings: 'All ratings',
  ratings: { good: 'Good (90–100)', average: 'Average (50–89)', bad: 'Poor (0–49)' },
  keywordFilter: 'Primary keyword',
  allKeywords: 'With and without a primary keyword',
  keywords: { with: 'With a primary keyword', without: 'Without a primary keyword' },
  kindFilter: 'Kind',
  allKinds: 'Pages and blog posts',
  noKeyword: 'No primary keyword',
  none: 'No pages or blog posts match.',
};
