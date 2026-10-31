// "Interne links" under "Søgemaskineoptimering": the keywords of the pages, the posts and the blog page become links
// to them when the site is built (packages/editor/site/autolinks.mjs), in src/data/internal-links.json: whether they do and how many
// per page; under them the list of the keywords (`below`, Keywords.tsx in the editor).
import { LinkSimple } from '@phosphor-icons/react';
import type { Part } from '../src/schema';

export const internalLinks: Part = {
  id: 'interne-links',
  label: 'Interne links',
  icon: LinkSimple,
  file: 'src/data/internal-links.json',
  defaults: { enabled: true, maxPerPage: 8 },
  below: 'keywords',
  fields: [
    {
      name: 'enabled',
      label: 'Aktiveret',
      type: 'boolean',
      toggle: ['Til', 'Fra'],
      hint: 'Søgeordene på siderne og blogindlæggene bliver links til dem, når hjemmesiden opdateres.',
    },
    {
      name: 'maxPerPage',
      label: 'Antal links (pr. side)',
      type: 'number',
      required: true,
      hint: 'Højst så mange automatiske links på en side eller i et indlæg.',
    },
  ],
};
