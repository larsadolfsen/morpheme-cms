// "Events", a block of the demo's made-up app "event-notes": a layout choice and rows with a title, a date and a text.
import { defineBlock } from '@morphemecms/cms/src/blocks';
import { materialIcon } from '@morphemecms/cms/src/icon';

export default defineBlock({
  group: 'lists',
  label: 'Events',
  icon: materialIcon('event'),
  hint: 'Upcoming events, each with a title, a date and a text.',
  fields: [
    {
      name: 'layout',
      label: 'Layout',
      type: 'select',
      required: true,
      default: 'list',
      options: [
        { label: 'List', value: 'list' },
        { label: 'Cards', value: 'cards' },
      ],
    },
    {
      name: 'items',
      label: 'Events',
      singular: 'Event',
      type: 'list',
      summary: 'title',
      required: true,
      fields: [
        { name: 'title', label: 'Title', type: 'string' },
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'text', label: 'Text', type: 'text' },
      ],
    },
  ],
  example: { layout: 'list', items: [{ title: 'Open house', date: '2026-12-05', text: 'Come and see the demo.' }] },
  detail: (p) => [((p.items ?? []) as { title?: string }[]).map((r) => r.title ?? '').join(' · ')],
});
