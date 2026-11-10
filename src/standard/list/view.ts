// What "List" shows (its view, drawn by the theme's View.tsx and Rows.tsx): its heading, its design, and each row's
// icon, heading, text and page. The same in the editor (viewOf) and on the site (load.ts): only its fields.
import type { ViewOf } from '../view';
import { headOf, type HeadView } from '../head';

/** Its design: the theme's list (empty; lines between the rows if the theme has them) or each row on its own surface
 * (`segmented`). */
export type ListDesign = '' | 'segmented';
export type ListRow = { icon?: string; title: string; text?: string; href?: string };
export type ListView = HeadView & { design: ListDesign; items: ListRow[] };

export const listOf = (props: Record<string, any>): ListView => ({
  ...headOf(props),
  design: props.design === 'segmented' ? 'segmented' : '',
  items: props.items ?? [],
});

export const viewOf: ViewOf<ListView> = listOf;
