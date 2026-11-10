// "Expandable list", a standard block: rows that fold out, one open at a time, each with a text (its own, or
// the opening of the page it links to) and a link to its page with the shared text "Read more about {emne}"
// (shared.ts), and links to more pages under it (`more`, as pills); with a head (../head.ts). The same
// rows as "Questions and answers". How it looks is the theme's
// (packages/editor/theme/blocks/accordion/View.tsx, with ../faq/Accordion.tsx and PageRow.tsx); what it shows: view.ts, and
// load.ts on the site.
import { Rows } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { headFields } from '../head';
import { example } from './shared';

export default defineBlock({
  label: t.blocks.accordion.label,
  icon: Rows,
  hint: t.blocks.accordion.hint,
  edit: { to: 'blocks/accordion', text: t.blocks.accordion.edit },
  fields: [
    ...headFields,
    {
      name: 'items',
      label: t.blocks.accordion.items,
      singular: t.blocks.accordion.item,
      type: 'list',
      summary: 'label',
      required: true,
      fields: [
        { name: 'label', label: t.blocks.accordion.title, type: 'string', required: true },
        { name: 'href', label: t.blocks.accordion.href, type: 'relation', to: 'pages', required: true },
        { name: 'text', label: t.blocks.accordion.text, type: 'text', hint: t.blocks.accordion.textHint },
        {
          name: 'more',
          label: t.blocks.accordion.moreItems,
          singular: t.blocks.accordion.moreItem,
          type: 'list',
          summary: 'label',
          fields: [
            { name: 'label', label: t.blocks.accordion.moreLabel, type: 'string', required: true },
            { name: 'href', label: t.blocks.accordion.href, type: 'relation', to: 'pages', required: true },
          ],
        },
      ],
    },
  ],
  example,
  detail: (p) => [((p.items ?? []) as { label?: string }[]).map((row) => row.label).join(' · ')],
});
