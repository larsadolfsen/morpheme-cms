// "SEO-vurdering" under "Søgemaskineoptimering" (SeoScores.tsx): the SEO rating of every page and blog post.
export const seo = {
  /** Its row under "Søgemaskineoptimering" and its screen's title. */
  title: 'SEO rating',
  intro: 'The same rating as under Search engines on each page and blog post.',
  /** Under the title: the average of the scores. */
  average: (score: number) => `Average ${score} of 100`,
  searchLabel: 'Search the pages and blog posts',
  /** The orders: the lowest score first (the default), the highest first, by name. */
  sorts: { low: 'Lowest first', high: 'Highest first', az: 'A–Z', za: 'Z–A' },
  /** The ring, read aloud. */
  scoreLabel: (score: number) => `SEO rating ${score} of 100`,
  /** The filters in the funnel: by the color of the rating, by whether a primary keyword is filled in, and by kind. */
  ratingFilter: 'Rating',
  allRatings: 'All ratings',
  ratings: { good: 'Good (90–100)', average: 'Average (50–89)', bad: 'Poor (0–49)' },
  keywordFilter: 'Primary keyword',
  allKeywords: 'With and without a primary keyword',
  keywords: { with: 'With a primary keyword', without: 'Without a primary keyword' },
  kindFilter: 'Kind',
  allKinds: 'Pages and blog posts',
  /** Under the name of one without a primary keyword. */
  noKeyword: 'No primary keyword',
  /** None matching the search and the filters. */
  none: 'No pages or blog posts match',
};
