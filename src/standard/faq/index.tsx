// "Spørgsmål og svar", a standard block: questions that fold out with the answer, one open at a time in
// each list; the answers with bold, italic, links and lists. How it looks is the theme's
// (packages/editor/theme/blocks/faq/View.tsx; what it shows: view.ts, and load.ts on the site).
import { Question } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { headFields } from '../head';

export default defineBlock({
  label: t.blocks.faq.label,
  icon: Question,
  hint: t.blocks.faq.hint,
  fields: [
    ...headFields,
    {
      name: 'items',
      label: t.blocks.faq.items,
      singular: t.blocks.faq.item,
      type: 'list',
      summary: 'question',
      required: true,
      fields: [
        { name: 'question', label: t.blocks.faq.question, type: 'string', required: true },
        { name: 'answer', label: t.blocks.faq.answer, type: 'markdown', required: true },
      ],
    },
  ],
  detail: (p) => [((p.items ?? []) as { question?: string }[]).map((q) => q.question).join(' · ')],
});
