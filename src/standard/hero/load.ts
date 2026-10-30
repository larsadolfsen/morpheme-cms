// "Banner" on the site (view.ts): the parts of its text as Astro's Markdown makes them, its picture with the sizes the
// site has made of it, and the buttons of its "Knapper" block (@site/standard).
import { standard } from '@site/standard';
import { markdownHtml } from '../../../lib/inline';
import type { Button } from '../buttons/fields';
import { loadButtons } from '../buttons/load';
import { pictureOf } from '../load';
import type { Load } from '../view';
import { heroParts } from './fields';
import type { HeroView } from './view';

export const load: Load<HeroView> = async (props) => {
  const parts = heroParts(props.text);
  return {
    heading: parts.heading,
    html: await markdownHtml(parts.text),
    image: parts.picture ? { ...pictureOf(parts.picture.src), alt: parts.picture.alt } : undefined,
    behind: props.placement === 'behind' && !!parts.picture,
    full: props.width === 'full',
    buttons: parts.buttons && (await loadButtons(parts.buttons.items as Button[] | undefined, standard.texts.buttons?.items)),
    note: parts.after ? await markdownHtml(parts.after) : undefined,
  };
};
