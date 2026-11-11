// "List", a standard block (no head of its own: its label, heading and intro are the text's, lib/remark-list-head.mjs): rows under each other, each with a heading and, if it has them, an icon before it, a text
// under it and a page it links to (the whole row is the link, with an arrow after it): the theme's list. A list with each row on
// its own surface is "Segmented list" now (../segmented/, and FORMER in lib/blocks.mjs). How it looks is the theme's (packages/editor/theme/blocks/list/View.tsx; what it shows: view.ts, and load.ts on the site).
import { ListBullets } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { iconOptions } from '../../icon';
import { t } from '../../i18n';

type Row = { title?: string };

export default defineBlock({
  group: 'rows',
  label: t.blocks.list.label,
  icon: ListBullets,
  hint: t.blocks.list.hint,
  inline: true,
  fields: [
    {
      name: 'items',
      label: t.blocks.list.items,
      singular: t.blocks.list.item,
      type: 'list',
      summary: 'title',
      required: true,
      fields: [
        { name: 'icon', label: t.blocks.list.icon, type: 'select', icons: true, options: iconOptions(t.blocks.icons) },
        { name: 'title', label: t.blocks.list.title, type: 'string', required: true },
        { name: 'text', label: t.blocks.list.text, type: 'text' },
        { name: 'href', label: t.blocks.list.href, type: 'relation', to: 'pages', hint: t.blocks.list.hrefHint },
      ],
    },
  ],
  example: {
    items: [
      { icon: 'clock', title: t.blocks.list.exampleTitle, text: t.blocks.list.exampleText },
      { icon: 'info', title: t.blocks.list.exampleTitle, text: t.blocks.list.exampleText },
      { icon: 'map-pin', title: t.blocks.list.exampleTitle, text: t.blocks.list.exampleText },
    ],
  },
  detail: (p) => [((p.items ?? []) as Row[]).map((r) => r.title ?? '').join(' · ')],
});
