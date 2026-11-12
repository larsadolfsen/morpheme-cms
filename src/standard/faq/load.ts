// "Questions and answers" on the site (view.ts): the answers as Astro's Markdown makes them (markdownHtml), one open at a
// time in each list (its own group, by its place in the text). With `Rows from` the questions are the items of the list it reads (a
// list with no item that fits shows nothing).
import { markdownHtml } from '../../../lib/inline';
import type { Load } from '../view';
import { headOf } from '../head';
import { loadRows } from '../rows/load';
import { asQuestions, withRows } from '../rows/rows.mjs';
import { faqSettings, type FaqView, type Question } from './view';

export const load: Load<FaqView> = async (all, { index }) => {
  const found = await loadRows(all);
  if (found && !found.rows.length) return null;
  const props = withRows(all, found);
  const questions = (found ? asQuestions(found.rows) : (props.items ?? [])) as Question[];
  return {
    ...headOf(props),
    ...faqSettings(props),
    group: `faq-${index}`,
    rows: await Promise.all(questions.map(async (q) => ({ label: q.question, html: await markdownHtml(q.answer ?? '') }))),
  };
};
