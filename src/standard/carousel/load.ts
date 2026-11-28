// "Carousel" on the site (view.ts): the images' sizes come from the site (imageOf), a video's still from the site (facadeOf, or its thumbnail: facadeWithThumbnail) and the
// buttons' targets from the site's config (loadButtons).
import { videoOf } from '../../../lib/video-id.mjs';
import { imageOf } from '../load';
import type { Load } from '../view';
import { loadButtons } from '../buttons/load';
import { facadeWithThumbnail } from '../video/load';
import shared from './shared';
import { headerOf, isTop, itemsOf, layoutOf, ratioProp, type CarouselItemProps, type CarouselLayout, type CarouselView } from './view';

/** The items on the site, with their images' sizes, their videos' stills and their buttons. */
export async function loadItems(items: CarouselItemProps[], layout: CarouselLayout, ratio: string) {
  // The buttons are asked for first (the site's targets are asynchronous), then drawn with the items.
  const buttons = await Promise.all(items.map((item) => loadButtons(item.buttons)));
  return itemsOf(items, layout, ratio, {
    image: imageOf,
    video: (item) => {
      const video = videoOf(item.video ?? '');
      return video ? facadeWithThumbnail(video, item, item.title) : null;
    },
    buttons: (_, i) => buttons[i],
  });
}

export const load: Load<CarouselView> = async (props, { texts, index }) => {
  const layout = layoutOf(props);
  return {
    top: isTop(index),
    layout,
    header: headerOf(props),
    design: props.design || undefined,
    color: props.design === 'filled' ? props.color || undefined : undefined,
    more: texts.more ?? shared.values.more,
    items: await loadItems(props.items ?? [], layout, ratioProp(props)),
  };
};
