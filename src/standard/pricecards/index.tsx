// "Price cards", a standard block: a heading and one to four price cards side by side where there is room, each with a
// name, a price and what it is for (`unit`, after it), a short text, what is included (each line with a check, as
// "Checklist") and a button at the bottom (as one of "Buttons", buttons/fields.ts); one can be highlighted, with a small
// label over its name. The prices are written here (a site's own price list is an app's block). How it looks
// is the theme's (packages/editor/theme/blocks/pricecards/View.tsx); what it shows: view.ts, and load.ts on the site.
import { CurrencyCircleDollar } from '@phosphor-icons/react';
import { defineBlock } from '../../blocks';
import { siteT, t } from '../../i18n';
import { headFields } from '../head';
import { buttonList } from '../buttons/fields';
import type { PriceCardProps } from './view';

const texts = t.blocks.pricecards;

export default defineBlock({
  group: 'cards',
  label: texts.label,
  icon: CurrencyCircleDollar,
  hint: texts.hint,
  fields: [
    ...headFields,
    {
      name: 'items',
      label: texts.items,
      singular: texts.item,
      type: 'list',
      summary: 'name',
      required: true,
      maxItems: 4,
      fields: [
        { name: 'name', label: texts.name, type: 'string', required: true, max: 40 },
        { name: 'price', label: texts.price, type: 'string', required: true, max: 20 },
        { name: 'unit', label: texts.unit, type: 'string', max: 30, hint: texts.unitHint },
        { name: 'text', label: texts.text, type: 'text' },
        {
          name: 'features',
          label: texts.features,
          singular: texts.feature,
          type: 'list',
          field: { name: 'feature', label: texts.text, type: 'string', required: true },
        },
        // One button, as a "Buttons" block's; without one, none (not the shared buttons).
        { ...buttonList, name: 'buttons', label: texts.button, singular: texts.buttonItem, maxItems: 1 },
        { name: 'featured', label: texts.featured, type: 'boolean', toggle: texts.featuredToggle },
        { name: 'badge', label: texts.badge, type: 'string', max: 20, hint: texts.badgeHint, only: { field: 'featured', is: ['true'] } },
      ],
    },
  ],
  // In the site's language, like the drawing: the middle one highlighted, its button filled and the others' outlined.
  example: {
    items: siteT.blocks.pricecards.example.map(({ button, badge, ...card }) => ({
      ...card,
      ...(badge ? { featured: true, badge } : {}),
      buttons: [{ to: 'page', href: '/', label: button, kind: badge ? 'filled' : 'outlined' }],
    })),
  },
  detail: (p) => [((p.items ?? []) as PriceCardProps[]).map((c) => [c.name, c.price].filter(Boolean).join(' ')).join(' · ')],
});
