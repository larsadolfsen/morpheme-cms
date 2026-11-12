// "Testimonial cards", a standard block (type `testimonials`): testimonials as cards to leaf through, with a heading: those with any of the block's tags (all without tags), those marked "Show on the front page", or
// those picked. The testimonials are in the list the block brings ("Testimonials", list.ts; the relation `testimonials`,
// and BlockData.testimonials). The same quotes as rows are "Testimonials list" (../testimoniallist/; a "Testimonials" block with `layout` 'list' is
// one, FORMER in lib/blocks.mjs). How it looks is the theme's (packages/editor/theme/blocks/testimonials/View.tsx; what it shows: view.ts, and load.ts on the site).
import { Quotes } from '@phosphor-icons/react';
import { config } from '@site/config';
import type { Field } from '../../schema';
import { defineBlock, names, withTags, type BlockData, type BlockProps } from '../../blocks';
import { t } from '../../i18n';
import { headFields } from '../head';

/** The tags of these testimonials, as buttons to filter by (List.tsx), each once, in the order they come. */
export const tagsOf = (list: { categories?: string[] }[]) => [...new Set(list.flatMap((t) => t.categories ?? []))];
/** Whether the cards show their tags: not when the block picks by tags, which are then the same on all; in a list
 * (`rows`), all of them without tags. */
export const tagsShown = (props: BlockProps, rows = false) =>
  props.show !== 'categories' || (rows && !((props.categories ?? []) as string[]).length);

export const showOptions = [
  { label: t.blocks.testimonials.all, value: 'all' },
  { label: t.blocks.testimonials.withTags, value: 'categories' },
  { label: t.blocks.testimonials.front, value: 'front' },
  { label: t.blocks.testimonials.picked, value: 'picked' },
];

// Which testimonials it shows (as load.ts picks them on the site).
export function chosen(props: BlockProps, data: BlockData) {
  const all = data.testimonials;
  if (props.show === 'all') return all;
  if (props.show === 'categories') return withTags(all, props.categories);
  if (props.show === 'picked')
    return ((props.picked ?? []) as string[]).map((slug) => all.find((row) => row.slug === slug)).filter((row) => row !== undefined);
  return all.filter((row) => row.frontPage);
}

/** The fields that pick the testimonials, the same for "Testimonial cards" and "Testimonials list". */
export const pickFields: Field[] = [
  { name: 'show', label: t.blocks.testimonials.show, type: 'select', required: true, default: 'categories', options: showOptions },
  {
    name: 'categories',
    label: t.blocks.testimonials.tags,
    type: 'relation',
    to: 'categories',
    multiple: true,
    add: t.blocks.testimonials.addTag,
    hint: t.blocks.testimonials.tagsHint,
    only: { field: 'show', is: ['categories'] },
  },
  {
    name: 'picked',
    label: t.blocks.testimonials.items,
    type: 'relation',
    to: 'testimonials',
    multiple: true,
    only: { field: 'show', is: ['picked'] },
  },
];

export default defineBlock({
  group: 'cards',
  label: t.blocks.testimonials.label,
  icon: Quotes,
  hint: t.blocks.testimonials.hint,
  edit: { to: `list/${config.lists.testimonials}`, text: t.blocks.testimonials.edit },
  fields: [...headFields, ...pickFields],
  detail: (p, data) => [
    p.heading ? String(p.heading) : '',
    showOptions.find((o) => o.value === p.show)?.label ?? '',
    names(chosen(p, data)),
  ],
});
