// "Questions and answers" on the site (view.ts): the answers as Astro's Markdown makes them (markdownHtml), one open at a
// time in each list (its own group, by its place in the text).
import { markdownHtml } from '../../../lib/inline';
import type { Load } from '../view';
import { headOf } from '../head';
import type { FaqView, Question } from './view';

export const load: Load<FaqView> = async (props, { index }) => ({
  ...headOf(props),
  group: `faq-${index}`,
  rows: await Promise.all(
    ((props.items ?? []) as Question[]).map(async (q) => ({ label: q.question, html: await markdownHtml(q.answer ?? '') })),
  ),
});
