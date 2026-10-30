// What "Kort" shows (its view, drawn by the theme's View.tsx and LinkCards.tsx): its heading, its design ('image': a
// picture at the top, 'text': nothing, else an icon), its background ('accent', else the theme's surface), the link's text (its shared text) and each card's icon or
// picture, heading, text and page. In the editor: viewOf; on the site: load.ts, with the pictures' sizes.
import { shownAt } from '../../images';
import { sharedIn } from '../../shared';
import type { Picture, ViewOf } from '../view';
import { headOf, type HeadView } from '../head';
import shared from './shared';

export type LinkCard = { icon?: string; image?: Picture; title: string; text: string; href?: string };
export type CardsView = HeadView & { design?: string; background?: string; more: string; items: LinkCard[] };

/** A card as its field writes it. */
export type LinkCardProps = { icon?: string; image?: string; title: string; text: string; href?: string };

/** The cards, with their pictures as `picture` gives them. */
export const cardsOf = (items: LinkCardProps[], picture: (src: string) => Picture): LinkCard[] =>
  items.map(({ image, ...card }) => (image ? { ...card, image: picture(image) } : card));

/** Cards in the editor (a site's own too: its preview of the front page). */
export const shownCards = (items: LinkCardProps[]) => cardsOf(items, (src) => ({ src: shownAt(src) }));

export const viewOf: ViewOf<CardsView> = (props, data) => ({
  ...headOf(props),
  design: props.design,
  background: props.background || undefined,
  more: sharedIn(data.site, 'cards', shared.values).more,
  items: shownCards(props.items ?? []),
});
