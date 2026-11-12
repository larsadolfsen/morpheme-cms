// What "Cards" shows (its view, drawn by the theme's View.tsx and LinkCards.tsx): its heading, its type (`kind`: 'filled' or
// 'elevated', else outlined) and, for filled, its colour (`color`: primary, secondary or tertiary, else Material's own), the link's text
// (its shared text) and each card's media (an icon, a picture, a video or none), headline, text and either its page (the whole card is the
// link) or its buttons. In the editor: viewOf; on the site: load.ts, with the pictures' sizes, the videos' stills and the buttons' targets.
import type { BlockData } from '../../blocks';
import { shownAt } from '../../images';
import { sharedIn } from '../../shared';
import type { Picture, ViewOf } from '../view';
import { headOf, type HeadView } from '../head';
import { textOf, type Button } from '../buttons/fields';
import { kindOf, type ButtonView } from '../buttons/view';
import { viewOf as videoViewOf, type VideoView } from '../video/view';
import shared from './shared';

export type CardMedia = 'none' | 'icon' | 'image' | 'video';
export type LinkCard = {
  media: CardMedia;
  icon?: string;
  image?: Picture;
  video?: VideoView;
  title: string;
  text: string;
  href?: string;
  /** The action area: none on a card with a page. */
  buttons: ButtonView[];
};
export type CardsView = HeadView & { kind?: string; color?: string; more: string; items: LinkCard[] };

/** A card as its field writes it. */
export type LinkCardProps = {
  media?: CardMedia;
  icon?: string;
  image?: string;
  video?: string;
  title: string;
  text: string;
  href?: string;
  buttons?: Button[];
};

const MEDIA: CardMedia[] = ['none', 'icon', 'image', 'video'];

/** The cards, with their pictures as `picture` gives them, their videos as `video` and their buttons as `buttons` (the site's are asked for). */
export const cardsOf = (
  items: LinkCardProps[],
  how: {
    picture: (src: string) => Picture;
    video: (url: string, title: string) => VideoView | null;
    buttons: (card: LinkCardProps, i: number) => ButtonView[];
  },
): LinkCard[] =>
  items.map((card, i) => {
    const media = MEDIA.find((m) => m === card.media) ?? 'icon';
    const video = media === 'video' && card.video ? how.video(card.video, card.title) : null;
    return {
      media,
      ...(media === 'icon' ? { icon: card.icon } : {}),
      ...(media === 'image' && card.image ? { image: how.picture(card.image) } : {}),
      ...(video ? { video } : {}),
      title: card.title,
      text: card.text,
      // A page makes the card one link, with no buttons; a video is played, so it is not a link.
      ...(media !== 'video' && card.href ? { href: card.href } : {}),
      buttons: card.href && media !== 'video' ? [] : how.buttons(card, i),
    };
  });

/** Cards in the editor. */
export const shownCards = (items: LinkCardProps[], data: BlockData) =>
  cardsOf(items, {
    picture: (src) => ({ src: shownAt(src) }),
    video: (url, title) => videoViewOf({ url, title }, data),
    buttons: (card) => (card.buttons ?? []).map((b) => ({ href: b.href ?? '', text: textOf(b, data), kind: kindOf(b), icon: b.icon })),
  });

export const viewOf: ViewOf<CardsView> = (props, data) => ({
  ...headOf(props),
  kind: props.kind || undefined,
  color: props.kind === 'filled' ? props.color || undefined : undefined,
  more: sharedIn(data.site, 'cards', shared.values).more,
  items: shownCards(props.items ?? [], data),
});
