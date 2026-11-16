// "Segmented list", a standard block: rows that fold out (closed to begin with), each with a heading, an icon before it, a text and a page it
// links to after the text; one open at a time (`only`) and an optional text button under the last row. A "List" from before with each row
// on its own surface is one of these with its rows always open (`show`, FORMER in lib/blocks.mjs). How it looks is the theme's
// (packages/editor/theme/blocks/segmented/View.tsx; what it shows: view.ts, and load.ts on the site).
import { Rows, SquaresFour } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { headFields } from '../head';
import { fromLine, nameWith, rowsFromFields, typed } from '../rows/fields';
import { listInline, listRowFields } from '../rows/listParts';

type Row = { title?: string };

export default defineBlock({
  group: 'lists',
  label: t.blocks.segmented.label,
  icon: SquaresFour,
  nameOf: (p) => nameWith(t.blocks.segmented.label, p),
  hint: t.blocks.segmented.hint,
  // Typed in place as the List is (InlineList.tsx, which InlineSegmented.tsx hands over to): the heading and text where they stand, the icon in a slot,
  // the page and the row's button in the row's sheet, which the link slot and the toolbar's Link open. Edit keeps the block's own settings (Only one
  // open, Rows, Max rows, the text button).
  inline: { ...listInline({ buttons: true }), blockSettings: true },
  fields: [
    ...headFields,
    ...rowsFromFields,
    {
      name: 'items',
      only: typed,
      label: t.blocks.list.items,
      singular: t.blocks.list.item,
      type: 'list',
      summary: 'title',
      required: true,
      fields: listRowFields({ buttons: true }),
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
      { icon: 'clock', title: t.blocks.list.exampleTitle, text: t.blocks.list.exampleText },
      { icon: 'info', title: t.blocks.list.exampleTitle, text: t.blocks.list.exampleText },
      { icon: 'map-pin', title: t.blocks.list.exampleTitle, text: t.blocks.list.exampleText },
    ],
  },
  detail: (p, data) => (p.from ? [...fromLine(p, data)] : [((p.items ?? []) as Row[]).map((r) => r.title ?? '').join(' · ')]),
});
