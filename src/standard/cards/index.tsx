// "Cards", a standard block: a heading and cards, each with its own media at the top (an icon, a picture or a video, or none), a
// headline, a text and, as Material 3 has it, either one link (a card with a page is one primary action: the whole card, and no buttons) or
// buttons (the action area). The cards' type (`kind`: outlined, filled or elevated) and, for filled, an extra colour (`color`) are for all of
// them; the shared text of the link at the bottom ("Blocks" › "Cards", shared.ts). How it looks is the theme's
// (packages/editor/theme/blocks/cards/View.tsx with LinkCards.tsx); what it shows: view.ts, and load.ts on the site. Cards from before
// (`design`, `background`) are read as these (FORMER in lib/blocks.mjs).
import { Cards, Circle, Image as Picture, Prohibit, Shapes, Square, VideoCamera } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { iconOptions } from '../../icon';
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
  fields: [
    ...headFields,
    // Material 3's three cards; outlined is the empty choice (the cards from before there was a choice).
    {
      name: 'kind',
      label: t.blocks.cards.kind,
      type: 'select',
      segments: true,
      options: [
        { label: t.blocks.cards.kindOutlined, value: '', icon: Square },
        { label: t.blocks.cards.kindFilled, value: 'filled', icon: Circle },
        { label: t.blocks.cards.kindElevated, value: 'elevated', icon: Shapes },
      ],
    },
    // A filled card is Material's own colour until another is picked: the colours a section has.
    {
      name: 'color',
      label: t.blocks.cards.color,
      type: 'select',
      segments: true,
      only: { field: 'kind', is: ['filled'] },
      options: [
        { label: t.blocks.cards.colorStandard, value: '' },
        { label: t.blocks.cards.colorPrimary, value: 'primary' },
        { label: t.blocks.cards.colorSecondary, value: 'secondary' },
        { label: t.blocks.cards.colorTertiary, value: 'tertiary' },
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
        // The media area, at the top of the card.
        {
          name: 'media',
          label: t.blocks.cards.media,
          type: 'select',
          segments: true,
          required: true,
          default: 'icon',
          options: [
            { label: t.blocks.cards.mediaNone, value: 'none', icon: Prohibit },
            { label: t.blocks.cards.mediaIcon, value: 'icon', icon: Shapes },
            { label: t.blocks.cards.mediaImage, value: 'image', icon: Picture },
            { label: t.blocks.cards.mediaVideo, value: 'video', icon: VideoCamera },
          ],
        },
        {
          name: 'icon',
          label: t.blocks.cards.icon,
          type: 'select',
          icons: true,
          options: iconOptions(t.blocks.icons),
          required: true,
          only: { field: 'media', is: ['icon'] },
        },
        { name: 'image', label: t.blocks.cards.image, type: 'image', required: true, only: { field: 'media', is: ['image'] } },
        {
          name: 'video',
          label: t.blocks.cards.video,
          type: 'string',
          required: true,
          pattern: ['(youtube(-nocookie)?\\.com|youtu\\.be|vimeo\\.com)/', t.blocks.video.urlProblem],
          only: { field: 'media', is: ['video'] },
        },
        { name: 'title', label: t.blocks.cards.title, type: 'string', required: true },
        { name: 'text', label: t.blocks.cards.text, type: 'text', required: true },
        // A card with a page is one link (the whole card, as Material 3's primary action); a video is played, so it has none.
        {
          name: 'href',
          label: t.blocks.cards.href,
          type: 'relation',
          to: 'pages',
          hint: t.blocks.cards.hrefHint,
          only: { field: 'media', is: ['video'], not: true },
        },
        // The action area: only on a card that is not a link.
        {
          ...buttonList,
          name: 'buttons',
          label: t.blocks.cards.buttons,
          singular: t.blocks.cards.button,
          hint: t.blocks.cards.buttonsHint,
          only: { field: 'href', is: [''] },
        },
      ],
    },
  ],
  example,
  detail: (p) => [((p.items ?? []) as { title?: string }[]).map((c) => c.title).join(' · ')],
});
