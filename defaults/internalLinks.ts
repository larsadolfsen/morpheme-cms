// "Internal links" under "Search engine optimization": the keywords of the pages, the posts and the blog page become links
// to them when the site is built (packages/editor/site/autolinks.mjs), in src/data/internal-links.json: whether they do and how many
// per page; under them the list of the keywords (`below`, Keywords.tsx in the editor).
import { LinkSimple } from '@phosphor-icons/react';
import type { Part } from '../src/schema';

export const internalLinks: Part = {
  id: 'internal-links',
  label: 'Internal links',
  icon: LinkSimple,
  file: 'src/data/internal-links.json',
  defaults: { enabled: true, maxPerPage: 8 },
  below: 'keywords',
  fields: [
    {
      name: 'enabled',
      label: 'Activated',
      type: 'boolean',
      toggle: ['On', 'Off'],
      hint: 'The keywords of the pages and blog posts become links to them when the website is updated.',
    },
    {
      name: 'maxPerPage',
      label: 'Number of links (per page)',
      type: 'number',
      required: true,
      hint: 'At most this many automatic links on a page or in a post.',
    },
  ],
};
