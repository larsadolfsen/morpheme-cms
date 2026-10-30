// The shared text of "Kort" ("Blokke"): the link on the cards, to begin with in the
// site's language (siteT).
import { siteT, t } from '../../i18n';
import { defineShared } from '../../shared';

/** The cards it is shown with where no page has it: its screen under "Blokke" and "Tilgængelige
 * blokke" (index.tsx). In the site's language, like the drawing. With a page, so the link's text,
 * which is edited there, is on them. */
export const example = { items: siteT.blocks.cards.example.map((c) => ({ ...c, href: '/' })) };

export default defineShared({
  fields: [{ name: 'more', label: t.blocks.cards.more, type: 'string', required: true, max: 30 }],
  values: { more: siteT.blocks.cards.moreText },
  // The three designs, each under its name, and the icons on the accent.
  preview: {
    props: example,
    variants: [
      { label: t.blocks.cards.designText, props: { design: 'text' } },
      { label: t.blocks.cards.designIcon, props: { design: '' } },
      { label: t.blocks.cards.designImage, props: { design: 'image' } },
      {
        label: `${t.blocks.cards.designIcon}, ${t.blocks.cards.backgroundAccent.toLowerCase()}`,
        props: { design: '', background: 'accent' },
      },
    ],
  },
});
