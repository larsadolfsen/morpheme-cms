// What "Cards" shows (its view, drawn by the theme's View.tsx and LinkCards.tsx): its heading, its design (`design`: 'filled' or
// 'elevated', else outlined) and, for filled, its colour (`color`: primary, secondary or tertiary container, else the surface container),
// the link's text (its shared text), the one media of all its cards (an icon, an image, a video or none) and each card's headline, subhead,
// text and either its page (the whole card is the link) or its buttons. In the editor: viewOf; on the site: load.ts, with the images' sizes, the videos' stills and the buttons' targets.
import type { BlockData } from '../../blocks';
import { shownAt } from '../../images';
import { iconColorOf } from '../../iconColor';
import { sharedIn } from '../../shared';
import type { Image, ViewOf } from '../view';
import { headOf, type HeadView } from '../head';
import { textOf, type Button } from '../buttons/fields';
import { kindOf, type ButtonView } from '../buttons/view';
import { viewOf as videoViewOf, type VideoView } from '../video/view';
import shared from './shared';

export type CardMedia = 'none' | 'icon' | 'image' | 'video';
export type LinkCard = {
  /** The block's one choice, the same on every card. */
  media: CardMedia;
  icon?: string;
  /** A color role of the site for the icon (src/iconColor.ts); Primary without one. */
  iconColor?: string;
  image?: Image;
  video?: VideoView;
  title: string;
  /** The small line under the headline (a byline, a date, a place: whatever the owner writes). */
  subhead?: string;
  text: string;
  href?: string;
  /** The action area: none on a card with a page. */
  buttons: ButtonView[];
};
export type CardsView = HeadView & {
  design?: string;
  color?: string;
  /** 'carousel': swiped sideways on a phone (two cards or more); else stacked. */
  phone?: 'carousel';
  more: string;
  items: LinkCard[];
};

/** The cards on a phone as the block says: a carousel needs two cards at least. */
export const phoneOf = (props: Record<string, any>): 'carousel' | undefined =>
  props.phone === 'carousel' && Array.isArray(props.items) && props.items.length >= 2 ? 'carousel' : undefined;

/** A card as its field writes it. */
export type LinkCardProps = {
  icon?: string;
  iconColor?: string;
  image?: string;
  /** The image's own alternative text for this card (none: the image is decorative). */
  alt?: string;
  video?: string;
  title: string;
  subhead?: string;
  text: string;
  href?: string;
  buttons?: Button[];
};

const MEDIA: CardMedia[] = ['none', 'icon', 'image', 'video'];

/** The cards, with their images as `image` gives them, their videos as `video` and their buttons as `buttons` (the site's are asked for). */
export const cardsOf = (
  items: LinkCardProps[],
  blockMedia: unknown,
  how: {
    image: (src: string) => Image;
    video: (url: string, title: string) => VideoView | null;
    buttons: (card: LinkCardProps, i: number) => ButtonView[];
  },
): LinkCard[] =>
  items.map((card, i) => {
    const media = MEDIA.find((m) => m === blockMedia) ?? 'icon';
    const video = media === 'video' && card.video ? how.video(card.video, card.title) : null;
    return {
      media,
      ...(media === 'icon' ? { icon: card.icon, ...(iconColorOf(card.iconColor) ? { iconColor: iconColorOf(card.iconColor) } : {}) } : {}),
      ...(media === 'image' && card.image
        ? { image: { ...how.image(card.image), ...(card.alt?.trim() ? { alt: card.alt.trim() } : {}) } }
        : {}),
      ...(video ? { video } : {}),
      title: card.title,
      ...(card.subhead ? { subhead: card.subhead } : {}),
      text: card.text,
      // A page makes the card one link, with no buttons; a video is played, so it is not a link.
      ...(media !== 'video' && card.href ? { href: card.href } : {}),
      buttons: card.href && media !== 'video' ? [] : how.buttons(card, i),
    };
  });

/** Cards in the editor. */
export const shownCards = (items: LinkCardProps[], data: BlockData, media?: unknown) =>
  cardsOf(items, media, {
    image: (src) => ({ src: shownAt(src) }),
    video: (url, title) => videoViewOf({ url, title }, data),
    // A button that has no text yet (the next one, being made in the card's sheet) is not drawn.
    buttons: (card) =>
      (card.buttons ?? []).map((b) => ({ href: b.href ?? '', text: textOf(b, data), kind: kindOf(b), icon: b.icon })).filter((b) => b.text),
  });

export const viewOf: ViewOf<CardsView> = (props, data) => ({
  ...headOf(props),
  design: props.design || undefined,
  color: props.design === 'filled' ? props.color || undefined : undefined,
  phone: phoneOf(props),
  more: sharedIn(data.site, 'cards', shared.values).more,
  items: shownCards(props.items ?? [], data, props.media),
});
