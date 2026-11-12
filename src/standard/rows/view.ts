// "Rows from" in the editor: the rows a list block gets from the list it reads, drawn from the site's data (BlockData), and the choices
// of `Rows from`. The same rows as the site's (load.ts), but of the data the editor has: posts without their addresses.
import type { BlockData } from '../../blocks';
import { rowLists } from './lists';
import { inlineRowsOf, itemOfEntry } from './rows.mjs';
import type { SourceItem } from '../site';

/** The rows a block got from its list, which list, and the page of the list (where `Show all` goes; empty in the editor). */
export type RowsFrom = { source: string; rows: { icon?: string; title: string; text?: string; href?: string }[]; page?: string };

/** A source of rows: its id, its name for the choice, and whether its items have tags. */
export type RowSource = { value: string; label: string; tags: boolean };

const asRowsLists = rowLists;

/** The sources a block can read: the blog's posts, the testimonials, and each list that says its fields (`asRows`). */
export const rowSources = (labels: { posts: string; testimonials: string }): RowSource[] => [
  { value: 'posts', label: labels.posts, tags: true },
  { value: 'testimonials', label: labels.testimonials, tags: true },
  ...asRowsLists().map((l) => ({ value: l.id, label: l.label, tags: !!l.asRows?.tags })),
];

/** The items of a source as the editor has them. */
export const sourceItems = (id: string, data: BlockData): SourceItem[] => {
  if (id === 'posts')
    return data.site.posts.map((p) => ({ title: p.title, text: p.description, href: undefined, tags: p.categories }) as SourceItem);
  if (id === 'testimonials')
    return data.testimonials.map((t) => ({
      title: t.name,
      text: t.quote.split(/\n\s*\n/)[0]?.trim(),
      tags: t.categories ?? [],
    })) as SourceItem[];
  const list = asRowsLists().find((l) => l.id === id);
  return list?.asRows ? (data.lists[id] ?? []).map((e) => itemOfEntry(e, list.asRows!) as SourceItem) : [];
};

/** The rows a block takes from its list in the editor; undefined for a block with typed rows. */
export const editorRows = (props: Record<string, any>, data: BlockData): RowsFrom | undefined => {
  const source = typeof props.from === 'string' ? props.from.trim() : '';
  const found = source ? inlineRowsOf(props, sourceItems(source, data)) : undefined;
  return found ? { source: found.source, rows: found.rows } : undefined;
};
