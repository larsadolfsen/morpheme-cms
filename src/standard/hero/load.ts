// "Banner" on the site (view.ts): the parts of its text as Astro's Markdown makes them, its image with the sizes the
// site has made of it, and the buttons of its "Buttons" block (@site/standard).
import { standard } from '@site/standard';
import { markdownHtml } from '../../../lib/inline';
import type { Button } from '../buttons/fields';
import { loadButtons } from '../buttons/load';
import { imageOf } from '../load';
import type { Load } from '../view';
import { heroParts } from './fields';
import type { HeroView } from './view';

export const load: Load<HeroView> = async (props) => {
  const parts = heroParts(props.text);
  return {
    heading: parts.heading,
    html: await markdownHtml(parts.text),
    // Its own text wins; without one the Library's (imageOf); marked decorative here it has none.
    image: parts.image
      ? { ...imageOf(parts.image.src), ...(parts.image.decorative ? { alt: '' } : parts.image.alt ? { alt: parts.image.alt } : {}) }
      : undefined,
    behind: props.placement === 'behind' && !!parts.image,
    full: props.width === 'full',
    buttons: parts.buttons && (await loadButtons(parts.buttons.items as Button[] | undefined, standard.texts.buttons?.items)),
    note: parts.after ? await markdownHtml(parts.after) : undefined,
  };
};
