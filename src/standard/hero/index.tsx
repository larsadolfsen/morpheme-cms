// "Banner" (type "hero", as it was called before), a standard block: a text written as a page's (Markdown), in which a
// picture and a "Knapper" block can be put with "+" (one of each): a heading at its top is its own heading (not the
// page's H1), the first paragraph the subtitle, the others the introduction, and the text after the buttons is under
// them, a quote ("> …") in it too (fields.ts); the picture beside the text or behind it (`placement`), across the whole
// width of the window or as wide as the text (`width`); at the top of a page or anywhere in its text. At the top of the
// front page its text up to the buttons is written as the text above its card (`frontLeads` in src/site/standardPages.ts,
// sections.mjs). How it looks is the theme's
// (packages/editor/theme/blocks/hero/View.tsx; what it shows: view.ts, and load.ts on the site).
import { ArrowsInLineHorizontal, ArrowsOutLineHorizontal, Columns, ImageSquare, Sparkle } from '@phosphor-icons/react';
import { cut, defineBlock, plain } from '../../blocks';
import { t } from '../../i18n';
import { heroParts } from './fields';

export default defineBlock({
  label: t.blocks.hero.label,
  icon: Sparkle,
  hint: t.blocks.hero.hint,
  fields: [
    // A picture ('image', IMAGE in BlockDialog.tsx) and a "Knapper" block, at most one of each.
    {
      name: 'text',
      label: t.blocks.hero.text,
      type: 'markdown',
      hint: t.blocks.hero.textHint,
      template: { blocks: ['image', 'buttons'], max: { image: 1, buttons: 1 } },
    },
    // Where the picture is: beside the text (empty, as the banners from before there was a choice) or behind it.
    {
      name: 'placement',
      label: t.blocks.hero.placement,
      type: 'select',
      segments: true,
      options: [
        { label: t.blocks.hero.placementBeside, value: '', icon: Columns },
        { label: t.blocks.hero.placementBehind, value: 'behind', icon: ImageSquare },
      ],
    },
    // Across the whole width of the window (a new banner) or as wide as the text (empty, as the banners from before
    // there was a choice: one saved without it is as wide as the text, `missing`).
    {
      name: 'width',
      label: t.blocks.hero.width,
      type: 'select',
      segments: true,
      default: 'full',
      missing: '',
      options: [
        { label: t.blocks.hero.widthFull, value: 'full', icon: ArrowsOutLineHorizontal },
        { label: t.blocks.hero.widthText, value: '', icon: ArrowsInLineHorizontal },
      ],
    },
  ],
  detail: (p) => {
    const parts = heroParts(p.text);
    return [parts.heading ?? '', cut(plain(parts.text), 140)];
  },
});
