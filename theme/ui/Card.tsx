// A card (m3.material.io/components/cards, .mo-card in ../styles/ui/card.css): the surface a block or an app's block is, with
// what is on it. Its kind (`kind`: outlined, the default, elevated or filled) is Material's name; how each looks is the theme's, and
// so is its elevation (at rest, lifted when it is a link pointed at, and `dragged`: while it is dragged to another place).
//
// What is on it, drawn in Material 3's order (Cards, Guidelines, Anatomy): `media` (an image or a video, edge to edge at the top) or
// `icon`, then `headline`, `subhead`, `supporting` (the text), `children` (what the block puts there: a table, a price list, "can also
// contain other components") and `actions` (the buttons, in the action area at the bottom). A card with none of these draws its
// `children` as they are, as before (the block's own heading, text, image …), and `media` as `true` says that the first of them is a
// CardMedia (no padding, the image to the card's edge).
//
// With `href` the whole card is a link (Link: on the site; in the editor only drawn), with `as="button"` it is a button, else the element
// `as` (a <div>, a <section>, an <article>, an <aside>, a <figure> or an <li>). Material 3, Cards, Accessibility: "An action shouldn't be
// placed on an actionable surface", so a card with `actions` is neither: the types allow one or the other. `className` after its own
// classes (the block's: its layout); the rest (aria-…, id, data-…) on it. An Astro component without React gives an element the same
// classes with cardClass.
import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from '@morphemecms/cms/src/standard/view';
import { Svg } from '@morphemecms/cms/src/icon';

export const cardKinds = ['elevated', 'filled', 'outlined'] as const;
export type CardKind = (typeof cardKinds)[number];

/** A card's classes: its kind's, and evt. dragged, `media` (its first part is a CardMedia, edge to edge, no padding) and
 * `selected` (Material 3's selection: a check mark and a change of surface colour). */
export const cardClass = (kind: CardKind = 'outlined', { dragged = false, media = false, selected = false } = {}) =>
  ['mo-card', `mo-is-${kind}`, dragged && 'mo-card__dragged', media && 'mo-has-media', selected && 'mo-is-selected']
    .filter(Boolean)
    .join(' ');

/** The media of a card (Material 3: the image under "Container"): an image box with the card's corner at the top, edge to
 * edge. `ratio` (width / height) reserves its box before the image loads. */
export function CardMedia({ ratio, className, children }: { ratio?: number; className?: string; children: ReactNode }) {
  return (
    <span className={['mo-card__media', className].filter(Boolean).join(' ')} style={ratio ? { aspectRatio: String(ratio) } : undefined}>
      {children}
    </span>
  );
}

type Element = 'div' | 'section' | 'article' | 'aside' | 'figure' | 'li';

type Common = Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> & {
  kind?: CardKind;
  dragged?: boolean;
  /** Selected (a choice among cards, as in the Library): a check mark on it and the selected surface (Material 3's Selection: "a check mark icon, a checkbox component, a change in surface color, or a combination"). */
  selected?: boolean;
  /** The image or the video at the top (a CardMedia or an <img>), edge to edge. `true`: the first of `children` is a CardMedia (no padding). */
  media?: ReactNode;
  /** An icon at the top (Material 3: 24 dp, in the primary colour), inside the card's padding. */
  icon?: ReactNode;
  /** The headline: the subject of the card (title-large). `headingLevel` makes it a heading of that level. */
  headline?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** The subhead under the headline: a byline or a place (label-small). */
  subhead?: ReactNode;
  /** The supporting text: an article's summary, a description (body-medium). */
  supporting?: ReactNode;
  className?: string;
  children?: ReactNode;
  [data: `data-${string}`]: string | undefined;
};

export type CardProps = Common &
  (
    | { href?: string; as?: Element | 'button'; actions?: never }
    /** The action area: its buttons, text buttons first (Material 3: Buttons, Icon buttons). Never with `href` or `as="button"`. */
    | { href?: undefined; as?: Element; actions?: ReactNode }
  );

export default function Card({
  kind,
  dragged,
  media,
  icon,
  headline,
  headingLevel,
  subhead,
  supporting,
  actions,
  selected,
  as: Box = 'div',
  href,
  className,
  children,
  ...rest
}: CardProps) {
  const slotMedia = media !== undefined && media !== null && media !== false && media !== true;
  const parts = slotMedia || icon || headline || subhead || supporting || actions;
  const classes = [cardClass(kind, { dragged, media: media === true || slotMedia, selected }), className].filter(Boolean).join(' ');
  const Headline = headingLevel ? (`h${headingLevel}` as const) : 'div';
  const body = icon || headline || subhead || supporting || children || actions;
  // The text, what the block put there and the action area, in Material 3's order, one after the other.
  const content = parts ? (
    <>
      {slotMedia && <div className="mo-card__media-slot">{media}</div>}
      {body && (
        <div className="mo-card__body">
          {icon && <div className="mo-card__icon">{icon}</div>}
          {headline && <Headline className="mo-card__headline">{headline}</Headline>}
          {subhead && <div className="mo-card__subhead">{subhead}</div>}
          {supporting && <div className="mo-card__supporting">{supporting}</div>}
          {children && <div className="mo-card__content">{children}</div>}
          {actions && <div className="mo-card__actions">{actions}</div>}
        </div>
      )}
    </>
  ) : (
    children
  );
  return href === undefined ? (
    <Box className={classes} {...(Box === 'button' ? { type: 'button' as const } : {})} {...rest}>
      {content}
      {selected && <Svg name="check" size={18} className="mo-card__check" />}
    </Box>
  ) : (
    <Link href={href} className={classes} {...rest}>
      {content}
    </Link>
  );
}
