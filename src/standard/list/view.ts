// What "List" shows (its view, drawn by the theme's View.tsx and Rows.tsx): each row's icon, heading, text and page. A row with a page and no heading of its own has the page's title (the pages' links of "Links" are
// rows like that), and one whose page is missing is left out. In the editor: viewOf, from the site's pages; on the site: load.ts. (The label,
// heading and intro the block had are the text's own now, lib/remark-list-head.mjs.)
import type { ViewOf } from '../view';
import { editorRows } from '../rows/view';
import { withRows } from '../rows/rows.mjs';

/** `iconColor`: a color role of the site (src/iconColor.ts), Primary without one. */
export type ListRow = {
  icon?: string;
  iconColor?: string;
  title: string;
  text?: string;
  href?: string;
  buttons?: { label: string; href: string }[];
};
export type ListView = { items: ListRow[] };

/** A row as its fields write it: without a heading of its own when it has a page. */
export type ListRowProps = Partial<ListRow>;

/** The view from the block's fields; `titleOf`: a page's title by its address, undefined when there is no such page. */
export const listOf = (props: Record<string, any>, titleOf: (href: string) => string | undefined): ListView => ({
  items: ((props.items ?? []) as ListRowProps[]).flatMap((row) => {
    const title = row.title?.trim() || (row.href ? titleOf(row.href) : undefined);
    if (!title) return [];
    return [{ ...row, title }];
  }),
});

export const viewOf: ViewOf<ListView> = (props, data) => {
  const byPath = new Map(data.site.pages.map((p) => [p.path, p.title]));
  return listOf(withRows(props, editorRows(props, data)), (href) => byPath.get(href));
};
