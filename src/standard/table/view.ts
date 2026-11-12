// What "Table" shows (its view, drawn by the theme's View.tsx): its rows of cells, kept rectangular (every row as long as the longest, at
// least one row and one column), and whether the first row is the header (on unless the block says `header: false`). A cell is one line of
// text: a line break in it is a space. The same in the editor (viewOf) and on the site (load.ts): only its fields.
import { siteT } from '../../i18n';
import type { ViewOf } from '../view';
import { rectangle } from './rows.mjs';

/** `label` names the scroll box for a screen reader, in the site's language. */
export type TableView = { header: boolean; rows: string[][]; label: string };

export const tableOf = (props: Record<string, any>): TableView => ({
  header: props.header !== false,
  rows: rectangle(props.rows),
  label: siteT.blocks.table.label,
});

export const viewOf: ViewOf<TableView> = tableOf;
