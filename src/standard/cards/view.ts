// What "Cards" shows (its view, drawn by the theme's View.tsx and LinkCards.tsx): its heading, its design (`design`: 'filled' or
// 'elevated', else outlined) and, for filled, its colour (`color`: primary, secondary or tertiary container, else the surface container),
// the link's text (its shared text), the one media of all its cards (an icon, an image, a video or none) and each card's headline, subhead,
// text and either its page (the whole card is the link) or its buttons. In the editor: viewOf; on the site: load.ts, with the images' sizes, the videos' stills and the buttons' targets.
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
import { aspectProp, cutOf, DEFAULT_ASPECT, DEFAULT_RATIO, ratioProp } from './cut.mjs';

export { aspectProp, ASPECTS, DEFAULT_ASPECT, DEFAULT_RATIO, ratioProp } from './cut.mjs';

export type CardMedia = 'none' | 'icon' | 'image' | 'video';
export type LinkCard = {
  /** The block's one choice, the same on every card. */
  media: CardMedia;
  icon?: string;
  /** A color role of the site for the icon (src/iconColor.ts); Primary without one. */
  iconColor?: string;
  /** Its image, with the part to show (percent: left, top, width, height) when the card has one made for the block's ratio. */
  image?: Image & { crop?: number[] };
  /** The aspect ratio of the card's image: the block's one (3:2 unless set), or in the multi-aspect ratio layout the card's own. */
  ratio?: string;
  /** Only in the multi-aspect ratio layout: the card's width / height (9:16 to 16:9), which sets its width in the carousel. */
  aspect?: number;
  video?: VideoView;
  title: string;
  /** The small line under the headline (a byline, a date, a place: whatever the owner writes). */
  subhead?: string;
  /** The text under it; empty when the card has none (it is optional). */
  text: string;
  href?: string;
  /** The action area: none on a card with a page. */
  buttons: ButtonView[];
  /** A line between the text and the buttons (Divider); only on a card with buttons. */
  divider?: boolean;
};
export type CardsView = {
  design?: string;
  color?: string;
  /** 'carousel': swiped sideways on a phone (two cards or more); else stacked. */
  phone?: 'carousel';
  /** The carousel's Material 3 layout (carouselLayouts, below); none is the uncontained layout. */
  layout?: CardsLayout;
  more: string;
  items: LinkCard[];
};

/** The cards on a phone as the block says: a carousel needs two cards at least. */
export const phoneOf = (props: Record<string, any>): 'carousel' | undefined =>
  props.phone === 'carousel' && Array.isArray(props.items) && props.items.length >= 2 ? 'carousel' : undefined;

/** The layouts of the cards' carousel besides the uncontained one (the empty choice, which every site saved before the choice has), as Material 3 names them. */
export const cardsLayouts = ['multi-aspect-ratio', 'multi-browse', 'hero', 'hero-center', 'full-screen'] as const;
export type CardsLayout = (typeof cardsLayouts)[number];

/** The carousel's layout as the block says; none (uncontained) without a carousel or for a choice that is not offered (the multi-aspect ratio layout is for images only:
 * its widths come from them; the choice stays stored and comes back with the images). */
export const layoutOf = (props: Record<string, any>): CardsLayout | undefined => {
  const layout = phoneOf(props) ? cardsLayouts.find((l) => l === props.layout) : undefined;
  return layout === 'multi-aspect-ratio' && props.media !== 'image' ? undefined : layout;
};

/** A card as its field writes it. */
export type LinkCardProps = {
  icon?: string;
  iconColor?: string;
  image?: string;
  /** The card's image aspect ratio (width:height), used only in the multi-aspect ratio layout. */
  aspect?: string;
  /** The image's own alternative text for this card (none: the image is decorative). */
  alt?: string;
  video?: string;
  title: string;
  subhead?: string;
  /** Optional: a card can be its headline alone. */
  text?: string;
  href?: string;
  buttons?: Button[];
  /** A line above the buttons; kept when the card loses its buttons or its video, drawn only with buttons. */
  divider?: boolean;
};

const MEDIA: CardMedia[] = ['none', 'icon', 'image', 'video'];

/** A card's image: its address without the format and crop words, its alt text, and its crop when it was made for the block's ratio (else the middle part is shown). */
function imageOfCard(card: LinkCardProps, ratio: string, image: (src: string) => Image) {
  const { src, crop } = cutOf(card.image!, ratio);
  return { ...image(src), ...(card.alt?.trim() ? { alt: card.alt.trim() } : {}), ...(crop ? { crop } : {}) };
}

/** The cards, with their images as `image` gives them, their videos as `video` and their buttons as `buttons` (the site's are asked for). */
export const cardsOf = (
  items: LinkCardProps[],
  blockMedia: unknown,
  blockRatio: string,
  how: {
    image: (src: string) => Image;
    video: (url: string, title: string) => VideoView | null;
    buttons: (card: LinkCardProps, i: number) => ButtonView[];
  },
  /** The multi-aspect ratio layout: each card's image has the card's own aspect ratio instead of the block's. */
  perCard = false,
): LinkCard[] =>
  items.map((card, i) => {
    const cardRatio = perCard ? aspectProp(card.aspect) : blockRatio;
    const media = MEDIA.find((m) => m === blockMedia) ?? 'icon';
    const video = media === 'video' && card.video ? how.video(card.video, card.title) : null;
    const buttons = card.href && media !== 'video' ? [] : how.buttons(card, i);
    return {
      media,
      ...(media === 'icon' ? { icon: card.icon, ...(iconColorOf(card.iconColor) ? { iconColor: iconColorOf(card.iconColor) } : {}) } : {}),
      ...(media === 'image' && card.image ? { image: imageOfCard(card, cardRatio, how.image), ratio: cardRatio } : {}),
      ...(media === 'image' && card.image && perCard ? { aspect: ratioOf(cardRatio) } : {}),
      ...(video ? { video } : {}),
      title: card.title,
      ...(card.subhead ? { subhead: card.subhead } : {}),
      text: card.text ?? '',
      // A page makes the card one link, with no buttons; a video is played, so it is not a link.
      ...(media !== 'video' && card.href ? { href: card.href } : {}),
      buttons,
      ...(card.divider === true && buttons.length > 0 ? { divider: true } : {}),
    };
  });

/** Cards in the editor. */
export const shownCards = (items: LinkCardProps[], data: BlockData, media?: unknown, ratio: string = DEFAULT_RATIO, perCard = false) =>
  cardsOf(
    items,
    media,
    ratio,
    {
      image: (src) => ({ src: shownAt(src), ...libraryAltPart(data.libraryAlt?.(src)) }),
      video: (url, title) => videoViewOf({ url, title }, data),
      // A button that has no text yet (the next one, being made in the card's sheet) is not drawn.
      buttons: (card) =>
        (card.buttons ?? [])
          .map((b) => ({ href: b.href ?? '', text: textOf(b, data), kind: kindOf(b), icon: b.icon }))
          .filter((b) => b.text),
    },
    perCard,
  );

export const viewOf: ViewOf<CardsView> = (props, data) => ({
  design: props.design || undefined,
  color: props.design === 'filled' ? props.color || undefined : undefined,
  phone: phoneOf(props),
  layout: layoutOf(props),
  more: sharedIn(data.site, 'cards', shared.values).more,
  items: shownCards(props.items ?? [], data, props.media, ratioProp(props), layoutOf(props) === 'multi-aspect-ratio'),
});
