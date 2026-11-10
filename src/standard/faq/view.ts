// What "Questions and answers" shows (its view, drawn by the theme's View.tsx and Accordion.tsx): its heading, its rows
// (each question, and its answer as HTML: paragraphs, lists, bold, italic and links), and the name that keeps one open
// at a time in it (on the site by its place in the text; in the editor its own). In the editor: viewOf; on the site:
// load.ts.
import { markdownNow } from '../../../lib/markdown';
import type { PageRowView } from '../accordion/view';
import type { ViewOf } from '../view';
import { headOf, type HeadView } from '../head';

/** A row that folds out: a question and its answer as HTML, or a page's row ("Expandable list", PageRow). */
export type AccordionRow = { label: string; html: string } | { label: string; page: PageRowView };

export type FaqView = HeadView & { group?: string; rows: AccordionRow[] };

/** A question as its field writes it. */
export type Question = { question: string; answer?: string };

export const viewOf: ViewOf<FaqView> = (props) => ({
  ...headOf(props),
  rows: ((props.items ?? []) as Question[]).map((q) => ({ label: q.question, html: markdownNow(q.answer ?? '') })),
});
