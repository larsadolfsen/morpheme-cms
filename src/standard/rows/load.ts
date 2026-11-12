// "Rows from" on the site: the rows a list block gets from the list it reads (a source, rows.mjs), when it is built. Only load.ts files
// import it (it reads @site/standard), never the editor.
import { standard } from '@site/standard';
import { rowsFromItems, sourceOf } from './rows.mjs';
import type { RowsFrom } from './view';

/** The rows of a block that reads a list (`from`), with tag filter and `How many`, and the page of the list for `Show all`.
 * Undefined for a block with typed rows. */
export const loadRows = async (props: Record<string, any>): Promise<RowsFrom | undefined> => {
  const from = sourceOf(props.from);
  if (!from) return undefined;
  const { items, page } = await standard.source(from);
  return { source: from, rows: rowsFromItems(items, props), page };
};
