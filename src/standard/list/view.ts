// What "List" shows (its view, drawn by the theme's View.tsx and Rows.tsx): each row's icon, heading, text and page. The same in
// the editor (viewOf) and on the site (load.ts): only its fields. (The label, heading and intro it had are the text's own now.)
import type { ViewOf } from '../view';

export type ListRow = { icon?: string; title: string; text?: string; href?: string };
export type ListView = { items: ListRow[] };

export const listOf = (props: Record<string, any>): ListView => ({
  items: props.items ?? [],
});

export const viewOf: ViewOf<ListView> = listOf;
