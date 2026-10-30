// "SEO-vurdering" under "Søgemaskineoptimering" (SeoScores.tsx): the SEO rating of every page and blog post.
export const seo = {
  /** Its row under "Søgemaskineoptimering" and its screen's title. */
  title: 'SEO-vurdering',
  intro: 'Den samme vurdering, som står under Søgemaskiner på hver side og hvert blogindlæg.',
  /** Under the title: the average of the scores. */
  average: (score: number) => `Gennemsnit ${score} af 100`,
  searchLabel: 'Søg i siderne og blogindlæggene',
  /** The orders: the lowest score first (the default), the highest first, by name. */
  sorts: { low: 'Lavest først', high: 'Højest først', az: 'A–Å', za: 'Å–A' },
  /** The ring, read aloud. */
  scoreLabel: (score: number) => `SEO-vurdering ${score} af 100`,
  /** The filters in the funnel: by the colour of the rating, by whether a primary keyword is filled in, and by kind. */
  ratingFilter: 'Vurdering',
  allRatings: 'Alle vurderinger',
  ratings: { good: 'God (90–100)', average: 'Middel (50–89)', bad: 'Dårlig (0–49)' },
  keywordFilter: 'Primært søgeord',
  allKeywords: 'Med og uden primært søgeord',
  keywords: { with: 'Med primært søgeord', without: 'Uden primært søgeord' },
  kindFilter: 'Slags',
  allKinds: 'Sider og blogindlæg',
  /** Under the name of one without a primary keyword. */
  noKeyword: 'Intet primært søgeord',
  /** None matching the search and the filters. */
  none: 'Ingen sider eller blogindlæg passer.',
};
