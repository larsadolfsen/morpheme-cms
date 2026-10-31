import type { Messages } from '../en-US';

export const seo: Messages['seo'] = {
  title: 'SEO-vurdering',
  intro: 'Den samme vurdering, som står under Søgemaskiner på hver side og hvert blogindlæg.',
  average: (score) => `Gennemsnit ${score} af 100`,
  searchLabel: 'Søg i siderne og blogindlæggene',
  sorts: { low: 'Lavest først', high: 'Højest først', az: 'A–Å', za: 'Å–A' },
  scoreLabel: (score) => `SEO-vurdering ${score} af 100`,
  ratingFilter: 'Vurdering',
  allRatings: 'Alle vurderinger',
  ratings: { good: 'God (90–100)', average: 'Middel (50–89)', bad: 'Dårlig (0–49)' },
  keywordFilter: 'Primært søgeord',
  allKeywords: 'Med og uden primært søgeord',
  keywords: { with: 'Med primært søgeord', without: 'Uden primært søgeord' },
  kindFilter: 'Slags',
  allKinds: 'Sider og blogindlæg',
  noKeyword: 'Intet primært søgeord',
  none: 'Ingen sider eller blogindlæg passer.',
};
