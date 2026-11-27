// The shared text of "Carousel" ("Blocks"): the link at the end of a card item that is a link, to begin with in the site's language (siteT).
import { siteT, t } from '../../i18n';
import { defineShared } from '../../shared';

/** The items it is shown with where no page has it: its screen under "Blocks" and "Available blocks" (index.tsx). In the site's language, like the drawing. */
export const example = { items: siteT.blocks.carousel.example.map((c) => ({ media: 'icon', card: true, ...c })) };

export default defineShared({
  fields: [{ name: 'more', label: t.blocks.carousel.more, type: 'string', required: true, max: 30 }],
  values: { more: siteT.blocks.carousel.moreText },
  // Each layout is a version of the block of its own (the choices of index.tsx, shown under "Blocks"); the card items, in each of the three variants.
  preview: {
    props: example,
    variants: [
      { label: t.blocks.cards.designOutlined, props: { layout: 'uncontained' } },
      { label: t.blocks.cards.designFilled, props: { layout: 'uncontained', design: 'filled' } },
      { label: t.blocks.cards.designElevated, props: { layout: 'uncontained', design: 'elevated' } },
    ],
  },
});
