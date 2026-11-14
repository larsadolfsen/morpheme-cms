// A card (m3.material.io/components/cards, .card in ../styles/ui.css): the surface a block or an app's block is, with
// what is on it (`children`: the block's own heading, text, image …). Its kind (`kind`: outlined, the default,
// elevated or filled) is Material's name; how each looks is the theme's, and so is its elevation (lifted when it is
// a link pointed at, and `dragged`: while it is dragged to another place). With `href` the whole card is a link (Link:
// on the site; in the editor only drawn), else the element `as` (a <div>, a <section>, an <article>, an <aside>, a <figure> or an
// <li>). `className` after its own classes (the block's: its layout and what is on it); the rest (aria-…, id, data-…)
// on it. An Astro component without React gives an element the same classes with cardClass.
import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from '@morphemecms/cms/src/standard/view';

export const cardKinds = ['elevated', 'filled', 'outlined'] as const;
export type CardKind = (typeof cardKinds)[number];

/** A card's classes: its kind's, and evt. dragged. */
export const cardClass = (kind: CardKind = 'outlined', { dragged = false } = {}) =>
  ['card', `card-${kind}`, dragged && 'card-dragged'].filter(Boolean).join(' ');

export default function Card({
  kind,
  dragged,
  as: Box = 'div',
  href,
  className,
  children,
  ...rest
}: Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> & {
  kind?: CardKind;
  dragged?: boolean;
  as?: 'div' | 'section' | 'article' | 'aside' | 'figure' | 'li';
  href?: string;
  className?: string;
  children: ReactNode;
  [data: `data-${string}`]: string | undefined;
}) {
  const classes = [cardClass(kind, { dragged }), className].filter(Boolean).join(' ');
  return href === undefined ? (
    <Box className={classes} {...rest}>
      {children}
    </Box>
  ) : (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
