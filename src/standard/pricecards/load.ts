// "Priskort" on the site (view.ts): each card's button as a "Knapper" block's (loadButtons, which knows the site's pages
// and targets), and none without one.
import { loadButtons } from '../buttons/load';
import { headOf } from '../head';
import type { Load } from '../view';
import { priceCardOf, type PriceCardProps, type PriceCardsView } from './view';

export const load: Load<PriceCardsView> = async (props) => ({
  ...headOf(props),
  items: await Promise.all(((props.items ?? []) as PriceCardProps[]).map(async (c) => priceCardOf(c, await loadButtons(c.buttons, [])))),
});
