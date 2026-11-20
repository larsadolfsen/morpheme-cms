// "Tickets", the demo's block of an app that is typed in place: a heading and a text per row, drawn by Inline.tsx where it stands in the
// text (`inline` and its view, docs/app-contract.md, "Blocks typed in place"); a block with `inline` and no Inline.tsx keeps its sheet.
import { Ticket } from '@phosphor-icons/react';
import { defineBlock } from '@morphemecms/cms/src/blocks';

export default defineBlock({
  group: 'lists',
  label: 'Tickets',
  icon: Ticket,
  hint: 'Rows with a heading and a text, typed where they stand.',
  inline: {
    item: 'items',
    fields: ['title', 'text'],
    texts: {
      addAbove: 'Add above',
      addBelow: 'Add below',
      link: 'Link',
      row: 'Ticket',
      settings: 'Ticket settings',
      icon: 'Icon',
    },
  },
  fields: [
    {
      name: 'items',
      label: 'Tickets',
      singular: 'Ticket',
      type: 'list',
      summary: 'title',
      required: true,
      fields: [
        { name: 'title', label: 'Heading', type: 'string' },
        { name: 'text', label: 'Text', type: 'text' },
      ],
    },
  ],
  example: { items: [{ title: 'Early bird', text: 'Until the end of the month.' }] },
  detail: (p) => [((p.items ?? []) as { title?: string }[]).map((r) => r.title ?? '').join(' · ')],
});
