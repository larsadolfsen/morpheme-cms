// "Testimonials list", a standard block: the testimonials as rows under each other with the whole text, in the theme's list (the same as "List"), with a
// heading and, with two tags or more, buttons with the tags that show only the testimonials with one. Which ones, as "Testimonial cards"
// picks them (../testimonials/index.tsx): those with any of the block's tags (all without tags), those marked "Show on the front page", or those
// picked. A "Testimonials" block with `layout` 'list' is one of these (FORMER in lib/blocks.mjs). How it looks is the theme's
// (packages/editor/theme/blocks/testimoniallist/View.tsx; what it shows: view.ts, and load.ts on the site).
import { Rows } from '@phosphor-icons/react';
import { config } from '@site/config';
import { defineBlock, names } from '../../blocks';
import { t } from '../../i18n';
import { headFields } from '../head';
import { chosen, pickFields, showOptions } from '../testimonials';

export default defineBlock({
  group: 'lists',
  label: t.blocks.testimonialList.label,
  icon: Rows,
  hint: t.blocks.testimonialList.hint,
  edit: { to: `list/${config.lists.testimonials}`, text: t.blocks.testimonials.edit },
  fields: [
    ...headFields,
    {
      name: 'filter',
      label: t.blocks.testimonials.filter,
      type: 'boolean',
      default: true,
      hint: t.blocks.testimonials.filterHint,
    },
    ...pickFields,
  ],
  detail: (p, data) => [
    p.heading ? String(p.heading) : '',
    showOptions.find((o) => o.value === p.show)?.label ?? '',
    names(chosen(p, data)),
  ],
});
