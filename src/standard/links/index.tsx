// "Links", a standard block: groups of links to pages, each group in a box with a heading, which can go to a page of
// its own, and the pages under each other by their names. How it looks is the theme's
// (packages/editor/theme/blocks/links/View.tsx; what it shows: view.ts, and load.ts on the site).
import { LinkSimple } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { siteT, t } from '../../i18n';

type Group = { title?: string; href?: string; paths?: string[] };

export default defineBlock({
  group: 'rows',
  // Links are a List now (lib/blocks.mjs); this block stays for a text that has one without its groups.
  former: true,
  label: t.blocks.links.label,
  icon: LinkSimple,
  hint: t.blocks.links.hint,
  fields: [
    { name: 'heading', label: t.blocks.heading, type: 'string', hint: t.blocks.headingHint },
    {
      name: 'groups',
      label: t.blocks.links.groups,
      singular: t.blocks.links.group,
      type: 'list',
      summary: 'title',
      required: true,
      fields: [
        { name: 'title', label: t.blocks.links.title, type: 'string', required: true },
        { name: 'href', label: t.blocks.links.href, type: 'relation', to: 'pages', fixed: true, hint: t.blocks.links.hrefHint },
        {
          name: 'paths',
          label: t.blocks.links.pages,
          singular: t.blocks.links.page,
          type: 'list',
          required: true,
          field: { name: 'path', label: t.blocks.links.page, type: 'relation', to: 'pages', fixed: true, required: true },
        },
      ],
    },
  ],
  example: {
    groups: siteT.blocks.links.example.map((title) => ({ title, paths: ['/'] })),
  },
  detail: (p) => [((p.groups ?? []) as Group[]).map((g) => g.title ?? '').join(' · ')],
});
