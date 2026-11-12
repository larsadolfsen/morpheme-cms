// "List" on the site (view.ts): the pages' titles as the site has them (@site/standard) for a row with a page and no heading.
import { standard } from '@site/standard';
import type { Load } from '../view';
import { loadRows } from '../rows/load';
import { withRows } from '../rows/rows.mjs';
import { listOf, type ListView } from './view';

export const load: Load<ListView> = async (all) => {
  const found = await loadRows(all);
  if (found && !found.rows.length) return null;
  const props = withRows(all, found);
  const titles = new Map<string, string | undefined>();
  for (const row of (props.items ?? []) as { title?: string; href?: string }[]) {
    if (row.href && !row.title?.trim() && !titles.has(row.href)) titles.set(row.href, await standard.pageTitle(row.href));
  }
  return listOf(props, (href) => titles.get(href));
};
