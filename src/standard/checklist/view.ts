// What "Checklist" shows (its view, drawn by the theme's View.tsx and Checks.tsx): its heading and its points. The same
// in the editor (viewOf) and on the site (load.ts): only its fields.
import { headOf, type HeadView } from '../head';
import type { ViewOf } from '../view';

export type ChecklistView = HeadView & { items: string[] };

export const checklistOf = (props: Record<string, any>): ChecklistView => ({
  ...headOf(props),
  items: ((props.items ?? []) as string[]).filter(Boolean),
});

export const viewOf: ViewOf<ChecklistView> = checklistOf;
