// "Checklist", a standard block: a heading and points, each a short text with a check in a circle in the accent before
// it; with many of them, in two columns where there is room. How it looks is the theme's
// (packages/editor/theme/blocks/checklist/View.tsx with Checks.tsx); what it shows: view.ts, and load.ts on the site.
import { ListChecks } from '@phosphor-icons/react';
import { cut, defineBlock } from '../../blocks';
import { siteT, t } from '../../i18n';
import { headFields } from '../head';

export default defineBlock({
  group: 'rows',
  label: t.blocks.checklist.label,
  icon: ListChecks,
  hint: t.blocks.checklist.hint,
  fields: [
    ...headFields,
    {
      name: 'items',
      label: t.blocks.checklist.items,
      singular: t.blocks.checklist.item,
      type: 'list',
      required: true,
      field: { name: 'text', label: t.blocks.checklist.text, type: 'string', required: true },
    },
  ],
  // In the site's language, like the drawing.
  example: { items: siteT.blocks.checklist.example },
  detail: (p) => [cut(((p.items ?? []) as string[]).join(' · '), 140)],
});
