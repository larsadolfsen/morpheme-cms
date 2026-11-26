// "List", a standard block (no head of its own: its label, heading and intro are the text's, lib/remark-list-head.mjs): rows under each other, each with a heading and, if it has them, an icon before it, a text
// under it and a page it links to (the whole row is the link, with an arrow after it): the theme's list. Its `design` is the rows on the page
// (default) or each row on its own surface (`card`, a "Segmented list" or a List with `design: segmented` from before: FORMER in lib/blocks.mjs).
// Rows that fold out are "Expandable list" (../expand/). How it looks is the theme's (packages/editor/theme/blocks/list/View.tsx; what it shows: view.ts, and load.ts on the site).
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { columnsField } from '../columns';
import { fromLine, nameWith, rowsFromFields, typed } from '../rows/fields';
import { designField, leadingField, listInline, listRowFields, moreFields } from '../rows/listParts';
import { materialIcon } from '../../icon';

type Row = { title?: string };

export default defineBlock({
  group: 'lists',
  label: t.blocks.list.label,
  icon: materialIcon('format_list_bulleted'),
  nameOf: (p) => nameWith(t.blocks.list.label, p),
  hint: t.blocks.list.hint,
  // Its own settings (Design, Columns, Max rows, the text button) are in Edit, in the block's menu.
  inline: { ...listInline({}), blockSettings: true },
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
      fields: listRowFields({ pageTitle: true }),
    },
    designField,
    leadingField,
    columnsField(),
    ...moreFields,
  ],
  example: {
    items: [
      { icon: 'schedule', title: t.blocks.list.exampleTitle, text: t.blocks.list.exampleText },
      { icon: 'info', title: t.blocks.list.exampleTitle, text: t.blocks.list.exampleText },
      { icon: 'location_on', title: t.blocks.list.exampleTitle, text: t.blocks.list.exampleText },
    ],
  },
  detail: (p, data) => (p.from ? [...fromLine(p, data)] : [((p.items ?? []) as Row[]).map((r) => r.title ?? '').join(' · ')]),
});
