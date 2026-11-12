// What "Questions and answers" shows (its view, drawn by the theme's View.tsx and Accordion.tsx): its heading, its rows
// (each question, and its answer as HTML: paragraphs, lists, bold, italic and links), and the name that keeps one open
// at a time in it (on the site by its place in the text; in the editor its own). In the editor: viewOf; on the site:
// load.ts.
import { markdownNow } from '../../../lib/markdown';
import type { PageRowView } from '../accordion/view';
import type { ViewOf } from '../view';
import { editorRows } from '../rows/view';
import { asQuestions, withRows } from '../rows/rows.mjs';
import { headOf, type HeadView } from '../head';

/** A row that folds out: a question and its answer as HTML, or a page's row ("Expandable list", PageRow). */
export type AccordionRow =
  | { label: string; html: string; icon?: string; href?: string; link?: string; buttons?: { label: string; href: string }[] }
  | { label: string; page: PageRowView };

export type FaqView = HeadView & {
  group?: string;
  /** Any number of questions can be open at once (`only` is off). */
  several: boolean;
  rows: AccordionRow[];
  /** The text button under the last question. */
  button?: { label: string; href?: string };
};

/** What the block's fields say besides its head and questions: whether several can be open, and the button. */
export const faqSettings = (props: Record<string, any>): Pick<FaqView, 'several' | 'button'> => {
  const label = typeof props.button === 'string' ? props.button.trim() : '';
  return { several: props.only === false, button: label ? { label, href: props.buttonHref || undefined } : undefined };
};

/** A question as its field writes it. */
export type Question = { question: string; answer?: string };

export const viewOf: ViewOf<FaqView> = (all, data) => {
  const found = editorRows(all, data);
  const props = withRows(all, found);
  return {
    ...headOf(props),
    ...faqSettings(props),
    rows: ((found ? asQuestions(found.rows) : (props.items ?? [])) as Question[]).map((q) => ({
      label: q.question,
      html: markdownNow(q.answer ?? ''),
    })),
  };
};
