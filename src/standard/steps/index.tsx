// "Steps", a standard block: numbered steps with a heading and a text along a line. How it looks is the theme's
// (packages/editor/theme/blocks/steps/View.tsx; what it shows: view.ts, and load.ts on the site).
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { materialIcon } from '../../icon';

export default defineBlock({
  group: 'lists',
  label: t.blocks.steps.label,
  icon: materialIcon('format_list_numbered'),
  hint: t.blocks.steps.hint,
  // Typed in place, with no sheet: a step has a heading and a text and nothing to pick, so no Edit.
  inline: {
    item: 'items',
    fields: ['title', 'text'],
    blockSettings: false,
    texts: { addAbove: t.blocks.steps.addAbove, addBelow: t.blocks.steps.addBelow, row: t.blocks.steps.step },
  },
  fields: [
    {
      name: 'items',
      label: t.blocks.steps.items,
      singular: t.blocks.steps.item,
      type: 'list',
      summary: 'title',
      required: true,
      fields: [
        { name: 'title', label: t.blocks.steps.title, type: 'string', required: true },
        { name: 'text', label: t.blocks.steps.text, type: 'text' },
      ],
    },
  ],
  detail: (p) => [((p.items ?? []) as { title?: string }[]).map((s, i) => `${i + 1}. ${s.title ?? ''}`).join(' · ')],
});
