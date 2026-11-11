// "List" on the site (view.ts): the pages' titles as the site has them (@site/standard) for a row with a page and no heading.
import { standard } from '@site/standard';
import type { Load } from '../view';
import { listOf, type ListView } from './view';

export const load: Load<ListView> = async (props) => {
  const titles = new Map<string, string | undefined>();
  for (const row of (props.items ?? []) as { title?: string; href?: string }[]) {
    if (row.href && !row.title?.trim() && !titles.has(row.href)) titles.set(row.href, await standard.pageTitle(row.href));
  }
  return listOf(props, (href) => titles.get(href));
};
