// "Kort", a standard block: a heading and cards with only text, or an icon or a picture at the top (`design`, for
// all the cards), on the theme's surface or the accent (`background`, for all of them), a heading, a text and a link to another page, with the shared text of the link at the bottom
// ("Blokke" › "Kort", shared.ts). How it looks is the theme's (packages/editor/theme/blocks/cards/View.tsx with
// LinkCards.tsx); what it shows: view.ts, and load.ts on the site.
import { Cards, Circle, Image as Picture, Shapes, Square, TextAa } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { iconOptions } from '../../icon';
import { t } from '../../i18n';
import { headFields } from '../head';
import { example } from './shared';

export default defineBlock({
  label: t.blocks.cards.label,
  icon: Cards,
  hint: t.blocks.cards.hint,
  edit: { to: 'blocks/cards', text: t.blocks.cards.edit },
  fields: [
    ...headFields,
    // An icon is the empty choice: so are the cards from before there was a choice.
    {
      name: 'design',
      label: t.blocks.cards.design,
      type: 'select',
      segments: true,
      options: [
        { label: t.blocks.cards.designText, value: 'text', icon: TextAa },
        { label: t.blocks.cards.designIcon, value: '', icon: Shapes },
        { label: t.blocks.cards.designImage, value: 'image', icon: Picture },
      ],
    },
    // The cards' background, for all of them: the theme's surface (empty, as the cards from before there was a choice)
    // or the site's accent.
    {
      name: 'background',
      label: t.blocks.cards.background,
      type: 'select',
      segments: true,
      options: [
        { label: t.blocks.cards.backgroundStandard, value: '', icon: Square },
        { label: t.blocks.cards.backgroundAccent, value: 'accent', icon: Circle },
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
        // At the top, as on the card; by the block's design (inUse in check.ts looks next to the list).
        {
          name: 'icon',
          label: t.blocks.cards.icon,
          type: 'select',
          icons: true,
          options: iconOptions(t.blocks.icons),
          required: true,
          only: { field: 'design', is: [''] },
        },
        { name: 'image', label: t.blocks.cards.image, type: 'image', required: true, only: { field: 'design', is: ['image'] } },
        { name: 'title', label: t.blocks.cards.title, type: 'string', required: true },
        { name: 'text', label: t.blocks.cards.text, type: 'text', required: true },
        // Without one, the card is not a link (LinkCards.tsx).
        { name: 'href', label: t.blocks.cards.href, type: 'relation', to: 'pages', hint: t.blocks.cards.hrefHint },
      ],
    },
  ],
  example,
  detail: (p) => [((p.items ?? []) as { title?: string }[]).map((c) => c.title).join(' · ')],
});
