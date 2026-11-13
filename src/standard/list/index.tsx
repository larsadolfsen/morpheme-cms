// "List", a standard block (no head of its own: its label, heading and intro are the text's, lib/remark-list-head.mjs): rows under each other, each with a heading and, if it has them, an icon before it, a text
// under it and a page it links to (the whole row is the link, with an arrow after it): the theme's list. A list with each row on
// its own surface is "Segmented list" now (../segmented/, and FORMER in lib/blocks.mjs). How it looks is the theme's (packages/editor/theme/blocks/list/View.tsx; what it shows: view.ts, and load.ts on the site).
import { ListBullets } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { iconOptions } from '../../icon';
import { iconColorField } from '../../iconColor';
import { t } from '../../i18n';
import { fromLine, nameWith, rowsFromFields, typed } from '../rows/fields';

type Row = { title?: string };

export default defineBlock({
  group: 'lists',
  label: t.blocks.list.label,
  icon: ListBullets,
  nameOf: (p) => nameWith(t.blocks.list.label, p),
  hint: t.blocks.list.hint,
  inline: {
    item: 'items',
    fields: ['title', 'text'],
    media: ['icon', 'iconColor'],
    link: 'href',
    texts: {
      addAbove: t.blocks.list.addAbove,
      addBelow: t.blocks.list.addBelow,
      link: t.blocks.list.link,
      row: t.blocks.list.row,
      settings: t.blocks.list.rowSettings,
      icon: t.blocks.list.icon,
    },
  },
  fields: [
    ...rowsFromFields,
    {
      name: 'items',
      only: typed,
      label: t.blocks.list.items,
      singular: t.blocks.list.item,
      type: 'list',
      summary: 'title',
      required: true,
      fields: [
        { name: 'icon', label: t.blocks.list.icon, type: 'select', icons: true, options: iconOptions(t.blocks.icons) },
        iconColorField,
        { name: 'title', label: t.blocks.list.title, type: 'string', hint: t.blocks.list.titleHint },
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
  detail: (p, data) => (p.from ? [...fromLine(p, data)] : [((p.items ?? []) as Row[]).map((r) => r.title ?? '').join(' · ')]),
});
