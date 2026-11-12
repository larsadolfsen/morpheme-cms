// Cards, as Material 3 has them (Card.tsx in ../../ui/: outlined, the default, filled or elevated): each with the block's one media at the top
// (an icon, an image, a video with its play button, or none), a headline, a subhead, a text and either one link (a card with a page is one:
// the whole card, with the link's text at the bottom, `more`, the block's shared text) or the action area (its buttons). Two side by side from
// small screens (.block-cards in ../blocks.css). `color`: the container of a filled card (primary, secondary, tertiary), else the surface
// container: the standard block "Cards".
// `className`: the site's own classes on the list, e.g. its margin.
import { BREAKPOINTS } from '@morphemecms/cms/lib/breakpoints.mjs';
import { Svg } from '@morphemecms/cms/src/icon';
import type { LinkCard } from '@morphemecms/cms/src/standard/cards/view';
import { siteT } from '@morphemecms/cms/src/i18n';
import Buttons from '@theme/blocks/buttons/Buttons';
import Button from '@theme/ui/Button';
import Carousel from '@theme/ui/Carousel';
import Video from '@theme/blocks/video/View';
import Card, { cardKinds, type CardKind } from '@theme/ui/Card';

const sizes = `(min-width: ${BREAKPOINTS.medium}px) 352px, 100vw`;

/** A card's media at the top: its image, its video with the play button or its icon (nothing for none). */
export function CardMedia({ card }: { card: LinkCard }) {
  return (
    <>
      {card.media === 'image' && card.image && (
        <span className="block-card-picture">
          <img
            src={card.image.src}
            srcSet={card.image.srcset}
            sizes={card.image.srcset ? sizes : undefined}
            width={card.image.width}
            height={card.image.height}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </span>
      )}
      {card.media === 'video' && card.video && (
        <span className="block-card-video">
          <Video view={card.video} />
        </span>
      )}
      {card.media === 'icon' && card.icon && <Svg name={card.icon ?? ''} size={28} className="block-card-icon" />}
    </>
  );
}

export default function LinkCards({
  items,
  more,
  design,
  color,
  phone,
  label,
  className,
}: {
  items: LinkCard[];
  more: string;
  design?: string;
  color?: string;
  /** 'carousel': on a phone (below 600 px) the cards are swiped sideways, with `Show all` under them; larger screens show them together. */
  phone?: string;
  /** What the carousel is called for screen readers. */
  label?: string;
  className?: string;
}) {
  const type: CardKind = cardKinds.find((k) => k === design) ?? 'outlined';
  const colored = type === 'filled' && color ? `block-cards-${color}` : undefined;
  const say = siteT.blocks.cards;
  const cardOf = (card: LinkCard) => {
    const inside = (
      <>
        <CardMedia card={card} />
        <span className="block-card-title">{card.title}</span>
        {card.subhead && <span className="block-card-subhead">{card.subhead}</span>}
        <span className="block-card-text">{card.text}</span>
        {card.href && (
          <span className="block-card-more">
            {more}
            <Svg name="arrow-right" size={18} className="block-card-arrow" />
          </span>
        )}
        {!card.href && card.buttons.length > 0 && (
          <span className="block-card-actions">
            <Buttons buttons={card.buttons} />
          </span>
        )}
      </>
    );
    // A card without a page is not a link (and may have buttons).
    return (
      <Card kind={type} href={card.href || undefined} className="block-card">
        {inside}
      </Card>
    );
  };
  if (phone === 'carousel' && items.length >= 2)
    return (
      <div className={['block-cards-carousel', colored, className].filter(Boolean).join(' ')} data-cards-carousel="">
        <Carousel
          label={label || say.cardsLabel}
          roleDescription={say.carousel}
          itemRoleDescription={say.slide}
          items={items.map((card, i) => ({
            key: String(i),
            label: say.slideOf(i + 1, items.length),
            content: cardOf(card),
            // A card with a page is one link and one with buttons has them to focus; a text-only card is reached itself.
            focusable: !card.href && card.buttons.length === 0,
          }))}
          indicatorLabels={items.map((card, i) => say.showCard(i + 1, card.title))}
        />
        <div className="block-cards-show-all">
          <Button kind="text" aria-expanded="false" data-cards-show-all="" data-all={say.showAll} data-fewer={say.showFewer}>
            {say.showAll}
          </Button>
        </div>
      </div>
    );
  return (
    <ul className={['block-cards', colored, className].filter(Boolean).join(' ')}>
      {items.map((card, i) => (
        <li key={i}>{cardOf(card)}</li>
      ))}
    </ul>
  );
}
