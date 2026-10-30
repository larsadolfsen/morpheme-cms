// What "Trin" shows (its view, drawn by the theme's View.tsx and StepList.tsx): its heading, and each step's heading
// and text. The same in the editor (viewOf) and on the site (load.ts): only its fields.
import type { ViewOf } from '../view';
import { headOf, type HeadView } from '../head';

export type Step = { title: string; text: string };
export type StepsView = HeadView & { items: Step[] };

export const stepsOf = (props: Record<string, any>): StepsView => ({ ...headOf(props), items: props.items ?? [] });

export const viewOf: ViewOf<StepsView> = stepsOf;
