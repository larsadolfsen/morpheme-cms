// "Points with icon", a standard block: points side by side where there is room, each with an icon in a circle, a
// heading, a text and, with a page, a link after the text. How it looks is the theme's
// (packages/editor/theme/blocks/points/View.tsx; what it shows: view.ts, and load.ts on the site).
import { SquaresFour } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { iconOptions } from '../../icon';
import { t } from '../../i18n';
import { headFields } from '../head';

type Point = { icon?: string; title?: string; text?: string; more?: string; href?: string };

export default defineBlock({
  group: 'lists',
  // Points with icon are a List now (lib/blocks.mjs); this block stays for a text that has one without its points.
  former: true,
  label: t.blocks.points.label,
  icon: SquaresFour,
  hint: t.blocks.points.hint,
  fields: [
    ...headFields,
    {
      name: 'items',
      label: t.blocks.points.items,
      singular: t.blocks.points.item,
      type: 'list',
      summary: 'title',
      required: true,
      fields: [
        { name: 'icon', label: t.blocks.points.icon, type: 'select', icons: true, options: iconOptions(t.blocks.icons), required: true },
        { name: 'title', label: t.blocks.points.title, type: 'string', required: true },
        { name: 'text', label: t.blocks.points.text, type: 'text', required: true },
        { name: 'href', label: t.blocks.points.href, type: 'relation', to: 'pages', hint: t.blocks.points.hrefHint },
        { name: 'more', label: t.blocks.points.more, type: 'string', hint: t.blocks.points.moreHint },
      ],
    },
  ],
  example: {
    items: [
      { icon: 'train', title: t.blocks.points.exampleTitle, text: t.blocks.points.exampleText },
      { icon: 'clock', title: t.blocks.points.exampleTitle, text: t.blocks.points.exampleText },
      { icon: 'info', title: t.blocks.points.exampleTitle, text: t.blocks.points.exampleText },
    ],
  },
  detail: (p) => [((p.items ?? []) as Point[]).map((x) => x.title ?? '').join(' · ')],
});
