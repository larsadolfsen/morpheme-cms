// What "Table" shows (its view, drawn by the theme's View.tsx): its rows of cells, kept rectangular (every row as long as the longest, at
// least one row and one column), and whether the first row is the header (on unless the block says `header: false`). A cell is one line of
// text: a line break in it is a space. A column is aligned as the owner chose (`align`, per column) or, without a choice, by its cells: right
// when all are numbers, else left. The same in the editor (viewOf) and on the site (load.ts): only its fields.
import { siteT } from '../../i18n';
import type { ViewOf } from '../view';
import { alignOf, rectangle } from './rows.mjs';

/** `label` names the scroll box for a screen reader, in the site's language. */
export type TableView = { header: boolean; rows: string[][]; align: ('left' | 'center' | 'right')[]; label: string };

export const tableOf = (props: Record<string, any>): TableView => {
  const header = props.header !== false;
  const rows = rectangle(props.rows);
  return { header, rows, align: alignOf(rows, header, props.align), label: siteT.blocks.table.label };
};

export const viewOf: ViewOf<TableView> = tableOf;
