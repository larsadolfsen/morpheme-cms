// The shared text of "Cards" ("Blocks"): the link on the cards, to begin with in the
// site's language (siteT).
import { siteT, t } from '../../i18n';
import { defineShared } from '../../shared';

/** The cards it is shown with where no page has it: its screen under "Blocks" and "Available
 * blocks" (index.tsx). In the site's language, like the drawing. With a page, so the link's text,
 * which is edited there, is on them. */
export const example = { items: siteT.blocks.cards.example.map((c) => ({ ...c, media: 'icon', href: '/' })) };

export default defineShared({
  fields: [{ name: 'more', label: t.blocks.cards.more, type: 'string', required: true, max: 30 }],
  values: { more: siteT.blocks.cards.moreText },
  // The three types, each under its name, and the filled one in a colour.
  preview: {
    props: example,
    variants: [
      { label: t.blocks.cards.kindOutlined, props: {} },
      { label: t.blocks.cards.kindFilled, props: { kind: 'filled' } },
      { label: t.blocks.cards.kindElevated, props: { kind: 'elevated' } },
      { label: `${t.blocks.cards.kindFilled}, ${t.blocks.cards.colorPrimary.toLowerCase()}`, props: { kind: 'filled', color: 'primary' } },
    ],
  },
});
