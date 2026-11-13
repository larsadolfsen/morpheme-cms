// "Table", a standard block: rows of cells, the first row a header unless turned off. Cells are one line of text each. How it looks is the
// theme's (packages/editor/theme/blocks/table/View.tsx; what it shows: view.ts, and load.ts on the site). Typed in place (InlineTable.tsx):
// the sheet only has what is not text, the header row.
import { Table } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { tableOf } from './view';

export default defineBlock({
  group: 'content',
  label: t.blocks.table.label,
  icon: Table,
  hint: t.blocks.table.hint,
  fields: [
    { name: 'header', label: t.blocks.table.header, type: 'boolean', default: true, toggle: t.blocks.table.headerToggle },
    {
      name: 'striped',
      label: t.blocks.table.striped,
      type: 'boolean',
      toggle: t.blocks.table.stripedToggle,
      hint: t.blocks.table.stripedHint,
    },
  ],
  inline: {
    item: 'rows',
    fields: ['0'],
    blockSettings: true,
    grid: {
      addColumnBefore: t.blocks.table.addColumnBefore,
      addColumnAfter: t.blocks.table.addColumnAfter,
      deleteRow: t.blocks.table.deleteRow,
      deleteColumn: t.blocks.table.deleteColumn,
      alignLeft: t.blocks.table.alignLeft,
      alignCenter: t.blocks.table.alignCenter,
      alignRight: t.blocks.table.alignRight,
      alignAuto: t.blocks.table.alignAuto,
    },
    texts: {
      addAbove: t.blocks.table.addAbove,
      addBelow: t.blocks.table.addBelow,
      link: t.blocks.table.cell,
      row: t.blocks.table.rowsColumns,
      settings: t.blocks.table.settings,
      icon: t.blocks.table.cell,
    },
  },
  example: {
    header: true,
    rows: [
      ['', ''],
      ['', ''],
    ],
  },
  detail: (p) =>
    tableOf(p)
      .rows.slice(0, 3)
      .map((r) => r.join(' · ')),
});
