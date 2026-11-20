// What "Points with icon" shows (its view, drawn by the theme's View.tsx and PointList.tsx): its heading, and each
// point's icon, heading, text and, with a page and a link's text, the link after the text. The same in the editor
// (viewOf) and on the site (load.ts): only its fields.
import type { ViewOf } from '../view';
import { headOf, type HeadView } from '../head';

export type Point = { icon: string; title: string; text: string; more?: string; href?: string };
export type PointsView = HeadView & { items: Point[] };

export const pointsOf = (props: Record<string, any>): PointsView => ({ ...headOf(props), items: props.items ?? [] });

export const viewOf: ViewOf<PointsView> = pointsOf;
