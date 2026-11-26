// "Cards" on the site (view.ts): the images' sizes come from the site (imageOf), a video's still from the site (facadeOf) and the
// buttons' targets from the site's config (loadButtons).
import { facadeOf } from '../../../lib/video.mjs';
import { videoOf } from '../../../lib/video-id.mjs';
import { imageOf } from '../load';
import type { Load } from '../view';
import { loadButtons } from '../buttons/load';
import shared from './shared';
import { cardsOf, DEFAULT_RATIO, layoutOf, phoneOf, ratioProp, type CardsView, type LinkCardProps } from './view';

/** Cards on the site, with their images' sizes, their videos' stills and their buttons. */
export async function loadCards(items: LinkCardProps[], media?: unknown, ratio: string = DEFAULT_RATIO, perCard = false) {
  // The buttons are asked for first (the site's targets are asynchronous), then drawn with the cards.
  const buttons = await Promise.all(items.map((card) => loadButtons(card.buttons)));
  return cardsOf(
    items,
    media,
    ratio,
    {
      image: imageOf,
      video: (url, title) => {
        const video = videoOf(url);
        return video ? facadeOf(video, title) : null;
      },
      buttons: (_, i) => buttons[i],
    },
    perCard,
  );
}

export const load: Load<CardsView> = async (props, { texts }) => ({
  design: props.design || undefined,
  color: props.design === 'filled' ? props.color || undefined : undefined,
  phone: phoneOf(props),
  layout: layoutOf(props),
  more: texts.more ?? shared.values.more,
  items: await loadCards(props.items ?? [], props.media, ratioProp(props), layoutOf(props) === 'multi-aspect-ratio'),
});
