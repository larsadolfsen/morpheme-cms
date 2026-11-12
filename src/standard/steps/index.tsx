// "Steps", a standard block: numbered steps with a heading and a text along a line. How it looks is the theme's
// (packages/editor/theme/blocks/steps/View.tsx; what it shows: view.ts, and load.ts on the site).
import { ListNumbers } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { headFields } from '../head';

export default defineBlock({
  group: 'lists',
  label: t.blocks.steps.label,
  icon: ListNumbers,
  hint: t.blocks.steps.hint,
  fields: [
    ...headFields,
    {
      name: 'items',
      label: t.blocks.steps.items,
      singular: t.blocks.steps.item,
      type: 'list',
      summary: 'title',
      required: true,
      fields: [
        { name: 'title', label: t.blocks.steps.title, type: 'string', required: true },
        { name: 'text', label: t.blocks.steps.text, type: 'text', required: true },
      ],
    },
  ],
  detail: (p) => [((p.items ?? []) as { title?: string }[]).map((s, i) => `${i + 1}. ${s.title ?? ''}`).join(' · ')],
});
