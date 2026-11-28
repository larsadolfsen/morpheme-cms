// What "Carousel" shows (its view, drawn by the theme's View.tsx): its layout (Material 3's, below), its header, the variant of its card items
// (`design`: 'filled' or 'elevated', else outlined; `color`, for filled) and its items. An item is what Material 3 prints (m3.material.io/components/carousel,
// Overview: "Contain visual items like images or video, along with optional label text"; Guidelines: "Carousel items are primarily visual. Item text is
// optional and should be brief"): an image, a video, or (only in the uncontained layouts) a card, with a brief label (title, subhead and text) and, for
// a card, a page or buttons. A Cards block that was a carousel is read as this block (FORMER in lib/blocks.mjs, lib/migrate-carousel.mjs). In the editor: viewOf;
// on the site: load.ts, with the images' sizes, the videos' stills and the buttons' targets.
import type { BlockData } from '../../blocks';
import { shownAt } from '../../images';
import { libraryAltPart } from '../../imageAlt.mjs';
import { iconColorOf } from '../../iconColor';
import { sharedIn } from '../../shared';
import type { Image, ViewOf } from '../view';
import { textOf, type Button } from '../buttons/fields';
import { kindOf, type ButtonView } from '../buttons/view';
import { viewOf as videoViewOf, type VideoView } from '../video/view';
import shared from './shared';
import { ratioOf } from '../../../lib/crop.mjs';
import { aspectProp, cutOf, DEFAULT_RATIO, ratioProp } from '../cards/cut.mjs';

export { ASPECTS, DEFAULT_ASPECT, DEFAULT_RATIO, aspectProp, ratioProp } from '../cards/cut.mjs';

/** The layouts, as Material 3 names them, in its order; the block starts as the first (Multi-browse). */
export const carouselLayouts = ['multi-browse', 'uncontained', 'multi-aspect-ratio', 'hero', 'hero-center', 'full-screen'] as const;
export type CarouselLayout = (typeof carouselLayouts)[number];
export const DEFAULT_LAYOUT: CarouselLayout = 'multi-browse';

/** The layout as the block says (Multi-browse without one). */
export const layoutOf = (props: Record<string, any>): CarouselLayout => carouselLayouts.find((l) => l === props.layout) ?? DEFAULT_LAYOUT;

/** The layouts in which an item can be a card ("Uncontained ... can be customized to show more text or other UI above or below each item without the text being masked or cropped"). */
export const cardLayouts: CarouselLayout[] = ['uncontained', 'multi-aspect-ratio'];

/** The carousel's header as the block says: trimmed, none when empty. */
export const headerOf = (props: Record<string, any>): string | undefined =>
  typeof props.header === 'string' && props.header.trim() ? props.header.trim() : undefined;

export type ItemMedia = 'none' | 'icon' | 'image' | 'video';
export type CarouselItem = {
  /** What fills the item: its image (the default), its video, an icon (a card) or nothing (a card). */
  media: ItemMedia;
  /** A card (the Card component, in the block's variant): only in the uncontained layouts. */
  card?: true;
  icon?: string;
  iconColor?: string;
  /** Its image, with the part to show (percent: left, top, width, height) when the item has one made for the ratio of its card. */
  image?: Image & { crop?: number[] };
  /** The aspect ratio of a card's image: the block's (3:2 unless set), or in the multi-aspect ratio layout the item's own. */
  ratio?: string;
  /** Only in the multi-aspect ratio layout: the item's width / height (9:16 to 16:9), which sets its width. */
  aspect?: number;
  video?: VideoView;
  /** The brief label: all optional. */
  title: string;
  subhead?: string;
  text: string;
  href?: string;
  /** A card's action area: none on an item with a page. */
  buttons: ButtonView[];
  divider?: boolean;
};
/** A carousel is at the top of the page when it is among the first parts of the text (its place, `index`; the heading in front of it is part 0): its first image is loaded at once. */
export const TOP_PARTS = 2;
export const isTop = (index: unknown) => typeof index === 'number' && index < TOP_PARTS;

export type CarouselView = {
  /** At the top of the page (site only): the first image is loaded eagerly with high priority; the others always wait until they are near. */
  top?: boolean;
  layout: CarouselLayout;
  header?: string;
  design?: string;
  color?: string;
  more: string;
  items: CarouselItem[];
};

/** An item as its fields write it. */
export type CarouselItemProps = {
  media?: string;
  card?: boolean;
  icon?: string;
  iconColor?: string;
  image?: string;
  aspect?: string;
  alt?: string;
  video?: string;
  /** A video item's own still (an image of the site), as the Video block's. */
  thumbnail?: string;
  title?: string;
  subhead?: string;
  text?: string;
  href?: string;
  buttons?: Button[];
  divider?: boolean;
};

const MEDIA: ItemMedia[] = ['none', 'icon', 'image', 'video'];
/** An item's media: its choice (an image when it has none). */
export const mediaOf = (item: CarouselItemProps): ItemMedia => MEDIA.find((m) => m === item.media) ?? 'image';

/** The items, with their images as `image` gives them, their videos as `video` and their buttons as `buttons` (the site's are asked for). */
export const itemsOf = (
  items: CarouselItemProps[],
  layout: CarouselLayout,
  blockRatio: string,
  how: {
    image: (src: string) => Image;
    video: (item: CarouselItemProps) => VideoView | null;
    buttons: (item: CarouselItemProps, i: number) => ButtonView[];
  },
): CarouselItem[] =>
  items.map((item, i) => {
    const media = mediaOf(item);
    const card = item.card === true && cardLayouts.includes(layout);
    const perItem = layout === 'multi-aspect-ratio';
    const ratio = perItem ? aspectProp(item.aspect) : blockRatio;
    const video = media === 'video' && item.video ? how.video(item) : null;
    const page = media !== 'video' && !!item.href;
    // Only a card has an action area; an item with a page is one link, with no buttons.
    const buttons = card && !page ? how.buttons(item, i) : [];
    const image = media === 'image' && item.image ? cutOf(item.image, ratio) : null;
    return {
      media,
      ...(card ? { card: true as const } : {}),
      ...(media === 'icon' ? { icon: item.icon, ...(iconColorOf(item.iconColor) ? { iconColor: iconColorOf(item.iconColor) } : {}) } : {}),
      ...(image
        ? {
            image: {
              ...how.image(image.src),
              ...(item.alt?.trim() ? { alt: item.alt.trim() } : {}),
              ...(image.crop ? { crop: image.crop } : {}),
            },
            // The shape of a card's image (an image item fills its item whatever shape that is); the item's width in the multi-aspect ratio layout.
            ratio,
            ...(perItem ? { aspect: ratioOf(ratio) } : {}),
          }
        : {}),
      ...(video ? { video } : {}),
      title: item.title ?? '',
      ...(item.subhead ? { subhead: item.subhead } : {}),
      text: item.text ?? '',
      ...(page ? { href: item.href } : {}),
      buttons,
      ...(item.divider === true && buttons.length > 0 ? { divider: true } : {}),
    };
  });

/** The items in the editor. */
export const shownItems = (items: CarouselItemProps[], data: BlockData, layout: CarouselLayout, ratio: string = DEFAULT_RATIO) =>
  itemsOf(items, layout, ratio, {
    image: (src) => ({ src: shownAt(src), ...libraryAltPart(data.libraryAlt?.(src)) }),
    video: (item) => videoViewOf({ url: item.video, title: item.title, thumbnail: item.thumbnail, alt: item.alt }, data),
    // A button that has no text yet (the next one, being made on the card) is not drawn.
    buttons: (item) =>
      (item.buttons ?? []).map((b) => ({ href: b.href ?? '', text: textOf(b, data), kind: kindOf(b), icon: b.icon })).filter((b) => b.text),
  });

export const viewOf: ViewOf<CarouselView> = (props, data) => {
  const layout = layoutOf(props);
  return {
    layout,
    header: headerOf(props),
    design: props.design || undefined,
    color: props.design === 'filled' ? props.color || undefined : undefined,
    more: sharedIn(data.site, 'carousel', shared.values).more,
    items: shownItems(props.items ?? [], data, layout, ratioProp(props)),
  };
};
