// A card (m3.material.io/components/cards, .card in ../styles/ui.css): the surface a block or an app's block is, with
// what is on it (`children`: the block's own heading, text, image …). Its kind (`kind`: outlined, the default,
// elevated or filled) is Material's name; how each looks is the theme's, and so is its elevation (lifted when it is
// a link pointed at, and `dragged`: while it is dragged to another place). With `href` the whole card is a link (Link:
// on the site; in the editor only drawn), else the element `as` (a <div>, a <section>, an <article>, a <figure> or an
// <li>). `className` after its own classes (the block's: its layout and what is on it); the rest (aria-…, id, data-…)
// on it. An Astro component without React gives an element the same classes with cardClass.
import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from '@morphemecms/cms/src/standard/view';
import { Svg } from '@morphemecms/cms/src/icon';

export const cardKinds = ['elevated', 'filled', 'outlined'] as const;
export type CardKind = (typeof cardKinds)[number];

/** A card's classes: its kind's, and evt. dragged, `media` (its first part is a CardMedia, edge to edge, no padding) and
 * `selected` (Material 3's selection: a check mark and a change of surface colour). */
export const cardClass = (kind: CardKind = 'outlined', { dragged = false, media = false, selected = false } = {}) =>
  ['card', `card-${kind}`, dragged && 'card-dragged', media && 'card-with-media', selected && 'card-selected'].filter(Boolean).join(' ');

/** The media of a card (Material 3: the image under "Container"): an image box with the card's corner at the top, edge to
 * edge. `ratio` (width / height) reserves its box before the image loads. */
export function CardMedia({ ratio, className, children }: { ratio?: number; className?: string; children: ReactNode }) {
  return (
    <span className={['card-media', className].filter(Boolean).join(' ')} style={ratio ? { aspectRatio: String(ratio) } : undefined}>
      {children}
    </span>
  );
}

export default function Card({
  kind,
  dragged,
  media,
  selected,
  as: Box = 'div',
  href,
  className,
  children,
  ...rest
}: Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> & {
  kind?: CardKind;
  dragged?: boolean;
  /** Its first part is a CardMedia: no padding, the image to the card's edge. */
  media?: boolean;
  /** Selected (a choice among cards, as in the Library): a check mark on it and the selected surface. */
  selected?: boolean;
  as?: 'div' | 'section' | 'article' | 'figure' | 'li' | 'button';
  href?: string;
  className?: string;
  children: ReactNode;
  [data: `data-${string}`]: string | undefined;
}) {
  const classes = [cardClass(kind, { dragged, media, selected }), className].filter(Boolean).join(' ');
  return href === undefined ? (
    <Box className={classes} {...(Box === 'button' ? { type: 'button' as const } : {})} {...rest}>
      {children}
      {selected && <Svg name="check" size={18} className="card-check" />}
    </Box>
  ) : (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
