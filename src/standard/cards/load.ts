// "Kort" on the site (view.ts): the pictures' sizes come from the site (pictureOf).
import { pictureOf } from '../load';
import type { Load } from '../view';
import { headOf } from '../head';
import shared from './shared';
import { cardsOf, type CardsView, type LinkCardProps } from './view';

/** Cards on the site, with their pictures' sizes (a site's own cards too: this site's front page). */
export const loadCards = (items: LinkCardProps[]) => cardsOf(items, pictureOf);

export const load: Load<CardsView> = async (props, { texts }) => ({
  ...headOf(props),
  design: props.design,
  background: props.background || undefined,
  more: texts.more ?? shared.values.more,
  items: loadCards(props.items ?? []),
});
