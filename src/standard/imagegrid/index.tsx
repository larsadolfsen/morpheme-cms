// "Image grid", a standard block: images from Files in a staggered grid of the theme's cards, which visitors can filter by tag (several tags at once: an
// image shows only if it has all of them) and open bigger. The images are those of Files with any of the block's tags (all without tags), or those
// picked (their order is kept). Each image's text, tags, caption and credit are its record's (src/fileRecords.mjs); a picked image can have a text of
// its own in the block. What it shows is view.ts (the editor) and load.ts (the site); the filter's rules, filter.mjs; how it looks is the theme's
// (theme/blocks/imagegrid/View.tsx). Typed in place (InlineLiveList.tsx): drawn as the site draws it, with the images of Files; the heading and the subheading are
// typed above them, everything else (which images, tags, what a card shows, its style, columns) is in Edit.
import { SquaresFour } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';
import { headFields } from '../head';

export default defineBlock({
  group: 'content',
  label: t.blocks.imageGrid.label,
  icon: SquaresFour,
  hint: t.blocks.imageGrid.hint,
  inline: {
    item: '',
    single: true,
    fields: ['heading', 'intro'],
    blockSettings: true,
    texts: { addAbove: '', addBelow: '', row: t.blocks.imageGrid.label },
  },
  edit: { to: 'blocks/imagegrid', text: t.blocks.imageGrid.edit },
  fields: [
    ...headFields,
    {
      name: 'show',
      label: t.blocks.imageGrid.images,
      type: 'select',
      segments: true,
      required: true,
      default: 'tags',
      options: [
        { label: t.blocks.imageGrid.showTags, value: 'tags' },
        { label: t.blocks.imageGrid.showPicked, value: 'picked' },
      ],
    },
    {
      name: 'tags',
      label: t.blocks.imageGrid.tags,
      type: 'relation',
      to: 'categories',
      multiple: true,
      add: t.blocks.imageGrid.addTag,
      hint: t.blocks.imageGrid.tagsHint,
      only: { field: 'show', is: ['picked'], not: true },
    },
    {
      name: 'picked',
      label: t.blocks.imageGrid.picked,
      singular: t.blocks.imageGrid.image,
      type: 'list',
      summary: 'image',
      hint: t.blocks.imageGrid.pickedHint,
      only: { field: 'show', is: ['picked'] },
      fields: [
        { name: 'image', label: t.blocks.imageGrid.image, type: 'image', required: true },
        { name: 'alt', label: t.blocks.picture.alt, type: 'string', hint: t.blocks.picture.altHint, libraryText: 'image' },
      ],
    },
    {
      name: 'order',
      label: t.blocks.imageGrid.order,
      type: 'select',
      default: 'newest',
      only: { field: 'show', is: ['picked'], not: true },
      // `library` (the order the owner picked) is the order of picked images, so it is not offered here.
      options: [
        { label: t.blocks.imageGrid.orders.newest, value: 'newest' },
        { label: t.blocks.imageGrid.orders.oldest, value: 'oldest' },
        { label: t.blocks.imageGrid.orders.random, value: 'random' },
      ],
    },
    { name: 'filter', label: t.blocks.imageGrid.filter, type: 'boolean', default: true, hint: t.blocks.imageGrid.filterHint },
    {
      name: 'start',
      label: t.blocks.imageGrid.start,
      type: 'relation',
      to: 'categories',
      multiple: true,
      add: t.blocks.imageGrid.addTag,
      hint: t.blocks.imageGrid.startHint,
      only: { field: 'filter', is: ['', 'false'], not: true },
    },
    { name: 'open', label: t.blocks.imageGrid.open, type: 'boolean', default: true, hint: t.blocks.imageGrid.openHint },
    {
      name: 'showCaption',
      label: t.blocks.imageGrid.caption,
      type: 'boolean',
      heading: { label: t.blocks.imageGrid.cardShows, hint: t.blocks.imageGrid.cardShowsHint },
    },
    { name: 'showTags', label: t.blocks.imageGrid.tagsOnCard, type: 'boolean' },
    { name: 'showCredit', label: t.blocks.imageGrid.credit, type: 'boolean' },
    {
      name: 'card',
      label: t.blocks.imageGrid.cardStyle,
      type: 'select',
      segments: true,
      default: 'filled',
      options: [
        { label: t.blocks.imageGrid.cardFilled, value: 'filled' },
        { label: t.blocks.imageGrid.cardElevated, value: 'elevated' },
        { label: t.blocks.imageGrid.cardOutlined, value: 'outlined' },
      ],
    },
    {
      name: 'columns',
      label: t.blocks.imageGrid.columns,
      type: 'select',
      segments: true,
      default: '',
      hint: t.blocks.imageGrid.columnsHint,
      options: [
        { label: t.blocks.imageGrid.columnsAuto, value: '' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
      ],
    },
    { name: 'max', label: t.blocks.imageGrid.max, type: 'number', hint: t.blocks.imageGrid.maxHint },
  ],
  example: { show: 'tags', tags: [], filter: true },
  detail: (p) => [p.show === 'picked' ? t.blocks.imageGrid.showPicked : t.blocks.imageGrid.showTags],
});
