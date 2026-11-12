// "FAQ list" (type "faq", as it was "Questions and answers"), a standard block: questions that fold out with the answer, one open at a time in
// each list (or any number, `only`), and an optional text button under the last question; the answers with bold, italic, links and lists. How it looks is the theme's
// (packages/editor/theme/blocks/faq/View.tsx; what it shows: view.ts, and load.ts on the site).
import { Question } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { headFields } from '../head';
import { fromLine, nameWith, rowsFromFields, typed } from '../rows/fields';

export default defineBlock({
  group: 'lists',
  label: t.blocks.faq.label,
  icon: Question,
  nameOf: (p) => nameWith(t.blocks.faq.label, p),
  hint: t.blocks.faq.hint,
  // Typed in place (InlineFaq.tsx): the question in the summary line, the answer in the open panel. `Only one open`, the button and `Rows
  // from` stay in Edit; the head (heading, intro) is drawn when filled in and is set in Edit.
  inline: {
    item: 'items',
    fields: ['question', 'answer'],
    blockSettings: true,
    texts: {
      addAbove: t.blocks.faq.addAbove,
      addBelow: t.blocks.faq.addBelow,
      link: '',
      row: t.blocks.faq.questionMenu,
      settings: t.blocks.faq.questionSettings,
      icon: '',
    },
  },
  fields: [
    ...headFields,
    ...rowsFromFields,
    {
      name: 'items',
      only: typed,
      label: t.blocks.faq.items,
      singular: t.blocks.faq.item,
      type: 'list',
      summary: 'question',
      required: true,
      fields: [
        { name: 'question', label: t.blocks.faq.question, type: 'string', required: true },
        { name: 'answer', label: t.blocks.faq.answer, type: 'markdown' },
      ],
    },
    // One open at a time is how the list has always worked, so a saved list without it has it on.
    {
      name: 'only',
      label: t.blocks.faq.only,
      type: 'boolean',
      toggle: t.blocks.faq.onlyToggle,
      hint: t.blocks.faq.onlyHint,
      default: true,
      missing: true,
    },
    { name: 'button', label: t.blocks.faq.button, type: 'string', max: 30, hint: t.blocks.faq.buttonHint },
    { name: 'buttonHref', label: t.blocks.faq.buttonHref, type: 'relation', to: 'pages' },
  ],
  detail: (p, data) =>
    p.from ? [...fromLine(p, data)] : [((p.items ?? []) as { question?: string }[]).map((q) => q.question).join(' · ')],
});
