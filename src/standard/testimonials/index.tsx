// "Testimonials", a standard block: testimonials to leaf through or one after another with the whole text (`layout`
// 'list'), with a heading: those with any of the block's tags (all without tags), those marked "Show on the front page", or
// those picked. The testimonials are in the list the block brings ("Testimonials", list.ts; the relation `testimonials`,
// and BlockData.testimonials). How it looks is the theme's (packages/editor/theme/blocks/testimonials/View.tsx; what it shows: view.ts, and load.ts on the site).
import { Columns, Quotes, Rows } from '@phosphor-icons/react';
import { config } from '@site/config';
import { defineBlock, names, withTags, type BlockData, type BlockProps } from '../../blocks';
import { t } from '../../i18n';
import { headFields } from '../head';

/** The tags of these testimonials, as buttons to filter by (List.tsx), each once, in the order they come. */
export const tagsOf = (list: { categories?: string[] }[]) => [...new Set(list.flatMap((t) => t.categories ?? []))];
/** Whether the cards show their tags: not when the block picks by tags, which are then the same on all; in a list,
 * all of them without tags. */
export const tagsShown = (props: BlockProps) =>
  props.show !== 'categories' || (props.layout === 'list' && !((props.categories ?? []) as string[]).length);

const showOptions = [
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

export default defineBlock({
  group: 'content',
  label: t.blocks.testimonials.label,
  icon: Quotes,
  hint: t.blocks.testimonials.hint,
  edit: { to: `list/${config.lists.testimonials}`, text: t.blocks.testimonials.edit },
  fields: [
    ...headFields,
    {
      name: 'layout',
      label: t.blocks.testimonials.layout,
      type: 'select',
      segments: true,
      default: 'slider',
      hint: t.blocks.testimonials.layoutHint,
      options: [
        { label: t.blocks.testimonials.slider, value: 'slider', icon: Columns },
        { label: t.blocks.testimonials.list, value: 'list', icon: Rows },
      ],
    },
    {
      name: 'filter',
      label: t.blocks.testimonials.filter,
      type: 'boolean',
      default: true,
      hint: t.blocks.testimonials.filterHint,
      only: { field: 'layout', is: ['list'] },
    },
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
  ],
  detail: (p, data) => [
    p.heading ? String(p.heading) : '',
    showOptions.find((o) => o.value === p.show)?.label ?? '',
    names(chosen(p, data)),
  ],
});
