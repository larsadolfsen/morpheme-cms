// What "List" shows (its view, drawn by the theme's View.tsx and Rows.tsx): its heading, and each row's
// icon, heading, text and page. The same in the editor (viewOf) and on the site (load.ts): only its fields.
import type { ViewOf } from '../view';
import { headOf, type HeadView } from '../head';

export type ListRow = { icon?: string; title: string; text?: string; href?: string };
export type ListView = HeadView & { items: ListRow[] };

export const listOf = (props: Record<string, any>): ListView => ({
  ...headOf(props),
  items: props.items ?? [],
});

export const viewOf: ViewOf<ListView> = listOf;
