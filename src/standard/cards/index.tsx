// "Cards", a standard block: a heading and cards. The media at the top is one choice for the whole block (`media`: an icon, an image or a
// video, or none; the first card sets it), so the cards stay aligned. Each card has a headline, a subhead under it, a text and, as Material 3
// has it, either one link (a card with a page is one primary action: the whole card, and no buttons) or buttons (the action area, with no
// fixed maximum). The cards' design (`design`: outlined, filled or elevated) and, for filled, its colour (`color`: Material's container
// roles) are for all of them; the shared text of the link at the bottom ("Blocks" › "Cards", shared.ts). How it looks is the theme's
// (packages/editor/theme/blocks/cards/View.tsx with LinkCards.tsx); what it shows: view.ts, and load.ts on the site. Cards from before
// (`design` text, icon or image, `background`, `kind`, a `media` on each card) are read as these (FORMER in lib/blocks.mjs).
import { Cards, Circle, Image as ImageIcon, Prohibit, Shapes, Square, VideoCamera } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { iconOptions } from '../../icon';
import { iconColorField } from '../../iconColor';
import { t } from '../../i18n';
import { headFields } from '../head';
import { buttonList } from '../buttons/fields';
import { example } from './shared';

export default defineBlock({
  group: 'cards',
  label: t.blocks.cards.label,
  icon: Cards,
  hint: t.blocks.cards.hint,
  edit: { to: 'blocks/cards', text: t.blocks.cards.edit },
  // Typed in place (InlineCards.tsx): the headline, the subhead and the text where they stand; the media, the page and the buttons are picked in
  // the card's sheet from the slots (the first card's has the block's one media choice), the design and colour in the block's (Edit).
  inline: {
    item: 'items',
    fields: ['title', 'subhead', 'text'],
    media: ['icon', 'iconColor', 'image', 'alt', 'video'],
    blockMedia: ['media'],
    settings: ['href', 'buttons'],
    blockSettings: true,
    texts: {
      addAbove: t.blocks.cards.addAbove,
      addBelow: t.blocks.cards.addBelow,
      link: t.blocks.cards.link,
      row: t.blocks.cards.cardMenu,
      settings: t.blocks.cards.cardSettings,
      icon: t.blocks.cards.media,
    },
  },
  fields: [
    ...headFields,
    // Material 3's three cards; outlined is the empty choice (the cards from before there was a choice).
    {
      name: 'design',
      label: t.blocks.cards.design,
      type: 'select',
      segments: true,
      options: [
        { label: t.blocks.cards.designOutlined, value: '', icon: Square },
        { label: t.blocks.cards.designFilled, value: 'filled', icon: Circle },
        { label: t.blocks.cards.designElevated, value: 'elevated', icon: Shapes },
      ],
    },
    // How the cards show on a phone: stacked (the empty choice), or swiped sideways in a carousel (uncontained, Material 3's layout for
    // text-heavy items). Larger screens show the cards together either way. Fewer than two cards is never a carousel (view.ts).
    {
      name: 'phone',
      label: t.blocks.cards.phone,
      type: 'select',
      segments: true,
      hint: t.blocks.cards.phoneHint,
      options: [
        { label: t.blocks.cards.phoneStacked, value: '' },
        { label: t.blocks.cards.phoneCarousel, value: 'carousel' },
      ],
    },
    // A filled card is Material's surface container until another container is picked.
    {
      name: 'color',
      label: t.blocks.cards.color,
      type: 'select',
      segments: true,
      only: { field: 'design', is: ['filled'] },
      options: [
        { label: t.blocks.cards.colorSurface, value: '' },
        { label: t.blocks.cards.colorPrimary, value: 'primary' },
        { label: t.blocks.cards.colorSecondary, value: 'secondary' },
        { label: t.blocks.cards.colorTertiary, value: 'tertiary' },
      ],
    },
    // The media area at the top of every card: one choice for the block.
    {
      name: 'media',
      label: t.blocks.cards.media,
      type: 'select',
      segments: true,
      default: 'icon',
      options: [
        { label: t.blocks.cards.mediaNone, value: 'none', icon: Prohibit },
        { label: t.blocks.cards.mediaIcon, value: 'icon', icon: Shapes },
        { label: t.blocks.cards.mediaImage, value: 'image', icon: ImageIcon },
        { label: t.blocks.cards.mediaVideo, value: 'video', icon: VideoCamera },
      ],
    },
    {
      name: 'items',
      label: t.blocks.cards.items,
      singular: t.blocks.cards.item,
      type: 'list',
      summary: 'title',
      required: true,
      fields: [
        // The color comes first, so it is chosen before the icons below it.
        { ...iconColorField, only: { field: 'media', is: ['icon'] } },
        {
          name: 'icon',
          label: t.blocks.cards.icon,
          type: 'select',
          icons: true,
          options: iconOptions(t.blocks.icons),
          only: { field: 'media', is: ['icon'] },
        },
        { name: 'image', label: t.blocks.cards.image, type: 'image', only: { field: 'media', is: ['image'] } },
        {
          name: 'alt',
          label: t.blocks.picture.alt,
          type: 'string',
          hint: t.blocks.picture.altHint,
          libraryText: 'image',
          only: { field: 'media', is: ['image'] },
        },
        {
          name: 'video',
          label: t.blocks.cards.video,
          type: 'string',
          pattern: ['(youtube(-nocookie)?\\.com|youtu\\.be|vimeo\\.com)/', t.blocks.video.urlProblem],
          only: { field: 'media', is: ['video'] },
        },
        { name: 'title', label: t.blocks.cards.title, type: 'string', required: true },
        // The one small line under the headline, as Material 3 has it (a byline, a date or a place is written here).
        { name: 'subhead', label: t.blocks.cards.subhead, type: 'string' },
        { name: 'text', label: t.blocks.cards.text, type: 'text', required: true },
        // A card with a page is one link (the whole card, as Material 3's primary action); a video is played, so it has none, and a card with
        // buttons has none either (a link inside a link is not valid): the hint says why it is gone.
        {
          name: 'href',
          label: t.blocks.cards.href,
          type: 'relation',
          to: 'pages',
          hint: t.blocks.cards.hrefHint,
          only: { field: 'media', is: ['video'], not: true, and: { field: 'buttons', is: [''] } },
        },
        // The action area: only on a card that is not a link, no fixed maximum.
        {
          ...buttonList,
          name: 'buttons',
          label: t.blocks.cards.buttons,
          singular: t.blocks.cards.button,
          hint: t.blocks.cards.buttonsHint,
          only: { field: 'href', is: [''], loose: true },
        },
      ],
    },
  ],
  example,
  detail: (p) => [((p.items ?? []) as { title?: string }[]).map((c) => c.title).join(' · ')],
});
