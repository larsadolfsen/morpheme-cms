// "Table", a standard block: rows of cells, the first row a header unless turned off. Cells are one line of text each. How it looks is the
// theme's (packages/editor/theme/blocks/table/View.tsx; what it shows: view.ts, and load.ts on the site). Not offered under Insert yet: it
// is typed in place (the next step), and until then a table can only be shown.
import { Table } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { tableOf } from './view';

export default defineBlock({
  group: 'content',
  written: true,
  label: t.blocks.table.label,
  icon: Table,
  hint: t.blocks.table.hint,
  fields: [{ name: 'header', label: t.blocks.table.header, type: 'boolean', default: true, toggle: t.blocks.table.headerToggle }],
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
