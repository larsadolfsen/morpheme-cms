// "Segmented list", a standard block: rows that fold out (closed to begin with), each with a heading, an icon before it, a text and a page it
// links to after the text; one open at a time (`only`) and an optional text button under the last row. A "List" from before with each row
// on its own surface is one of these with its rows always open (`show`, FORMER in lib/blocks.mjs). How it looks is the theme's
// (packages/editor/theme/blocks/segmented/View.tsx; what it shows: view.ts, and load.ts on the site).
import { Rows, SquaresFour } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { iconOptions } from '../../icon';
import { t } from '../../i18n';
import { headFields } from '../head';

type Row = { title?: string };

export default defineBlock({
  group: 'lists',
  label: t.blocks.segmented.label,
  icon: SquaresFour,
  hint: t.blocks.segmented.hint,
  fields: [
    ...headFields,
    {
      name: 'items',
      label: t.blocks.segmented.items,
      singular: t.blocks.segmented.item,
      type: 'list',
      summary: 'title',
      required: true,
      fields: [
        { name: 'icon', label: t.blocks.segmented.icon, type: 'select', icons: true, options: iconOptions(t.blocks.icons) },
        { name: 'title', label: t.blocks.segmented.title, type: 'string', required: true },
        { name: 'text', label: t.blocks.segmented.text, type: 'text' },
        { name: 'href', label: t.blocks.segmented.href, type: 'relation', to: 'pages', hint: t.blocks.segmented.hrefHint },
      ],
    },
    {
      name: 'only',
      label: t.blocks.segmented.only,
      type: 'boolean',
      toggle: t.blocks.segmented.onlyToggle,
      hint: t.blocks.segmented.onlyHint,
      default: true,
      missing: true,
    },
    {
      name: 'show',
      label: t.blocks.segmented.show,
      type: 'select',
      segments: true,
      options: [
        { label: t.blocks.segmented.showFold, value: '', icon: Rows },
        { label: t.blocks.segmented.showAll, value: 'all', icon: SquaresFour },
      ],
    },
    {
      name: 'maxRows',
      label: t.blocks.segmented.maxRows,
      type: 'number',
      hint: t.blocks.segmented.maxRowsHint,
    },
    { name: 'button', label: t.blocks.segmented.button, type: 'string', max: 30, hint: t.blocks.segmented.buttonHint },
    { name: 'buttonHref', label: t.blocks.segmented.buttonHref, type: 'relation', to: 'pages' },
  ],
  example: {
    items: [
      { icon: 'clock', title: t.blocks.segmented.exampleTitle, text: t.blocks.segmented.exampleText },
      { icon: 'info', title: t.blocks.segmented.exampleTitle, text: t.blocks.segmented.exampleText },
      { icon: 'map-pin', title: t.blocks.segmented.exampleTitle, text: t.blocks.segmented.exampleText },
    ],
  },
  detail: (p) => [((p.items ?? []) as Row[]).map((r) => r.title ?? '').join(' · ')],
});
