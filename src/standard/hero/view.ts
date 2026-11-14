// What "Banner" shows (its view, drawn by the theme's View.tsx), from the parts of its text (heroParts in fields.ts):
// its heading (an H2; the page's H1 is the page's), the text before its buttons as HTML (the first paragraph the
// subtitle, the others the introduction), its image (beside the text, or behind it), whether it goes across the whole
// width of the window, the buttons of its "Buttons" block (its own, else the shared ones, "Blocks" › "Buttons"; none
// without the block), and the text after them, with a quote written in it. In the editor: viewOf; on the site: load.ts.
import { markdownNow } from '../../../lib/markdown';
import { shownAt } from '../../images';
import { buttonsOf, type ButtonView } from '../buttons/view';
import type { Button } from '../buttons/fields';
import type { Image, ViewOf } from '../view';
import { heroParts } from './fields';

export type HeroView = {
  heading?: string;
  html: string;
  image?: Image;
  /** The image behind the text (`placement` 'behind'), not beside it. */
  behind?: boolean;
  /** Across the whole width of the window (`width` 'full'), not only the text's. */
  full?: boolean;
  /** The buttons of its "Buttons" block; none without one. */
  buttons?: ButtonView[];
  /** The text after the buttons, as HTML: its paragraphs and a quote ("> …"). */
  note?: string;
};

export const viewOf: ViewOf<HeroView> = (props, data) => {
  const parts = heroParts(props.text);
  return {
    heading: parts.heading,
    html: markdownNow(parts.text),
    image: parts.image ? { src: shownAt(parts.image.src), alt: parts.image.alt } : undefined,
    behind: props.placement === 'behind' && !!parts.image,
    full: props.width === 'full',
    buttons: parts.buttons && buttonsOf(parts.buttons.items as Button[] | undefined, data),
    note: parts.after ? markdownNow(parts.after) : undefined,
  };
};
