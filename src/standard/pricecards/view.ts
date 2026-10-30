// What "Priskort" shows (its view, drawn by the theme's View.tsx): its heading, and each card's name, price, what the
// price is for (`unit`), text, what is included, button, and whether it is highlighted, with its label. In the editor:
// viewOf, with the buttons as the editor has them (buttonsOf); on the site: load.ts (loadButtons). A card without a
// button has none, not the shared buttons of "Knapper".
import type { Button } from '../buttons/fields';
import { buttonsOf, type ButtonView } from '../buttons/view';
import { headOf, type HeadView } from '../head';
import type { ViewOf } from '../view';

/** A card as its fields write it. */
export type PriceCardProps = {
  name?: string;
  price?: string;
  unit?: string;
  text?: string;
  features?: string[];
  buttons?: Button[];
  featured?: boolean;
  badge?: string;
};

/** A card as it is drawn: its label only when it is highlighted. */
export type PriceCard = {
  name: string;
  price: string;
  unit?: string;
  text?: string;
  features: string[];
  buttons: ButtonView[];
  featured: boolean;
  badge?: string;
};
export type PriceCardsView = HeadView & { items: PriceCard[] };

/** A card with its buttons, as the editor or the site makes them. */
export const priceCardOf = (c: PriceCardProps, buttons: ButtonView[]): PriceCard => ({
  name: c.name ?? '',
  price: c.price ?? '',
  unit: c.unit?.trim() || undefined,
  text: c.text?.trim() || undefined,
  features: (c.features ?? []).filter(Boolean),
  buttons,
  featured: c.featured === true,
  badge: (c.featured === true && c.badge?.trim()) || undefined,
});

export const viewOf: ViewOf<PriceCardsView> = (props, data) => ({
  ...headOf(props),
  items: ((props.items ?? []) as PriceCardProps[]).map((c) => priceCardOf(c, c.buttons?.length ? buttonsOf(c.buttons, data) : [])),
});
