// Cards, as Material 3 has them (Card.tsx in ../../ui/: outlined, the default, filled or elevated): each with its media at the top (an icon,
// a picture, a video with its play button, or none), a headline, a text and either one link (a card with a page is one: the whole card,
// with the link's text at the bottom, `more`, the block's shared text) or the action area (its buttons). Two side by side from small screens
// (.block-cards in ../blocks.css). `color`: the extra colour of a filled card (primary, secondary, tertiary), else Material's own: the
// standard block "Cards".
// `className`: the site's own classes on the list, e.g. its margin.
import { BREAKPOINTS } from '@morphemecms/cms/lib/breakpoints.mjs';
import { Svg } from '@morphemecms/cms/src/icon';
import type { LinkCard } from '@morphemecms/cms/src/standard/cards/view';
import Buttons from '@theme/blocks/buttons/Buttons';
import Video from '@theme/blocks/video/View';
import Card, { cardKinds, type CardKind } from '@theme/ui/Card';

const sizes = `(min-width: ${BREAKPOINTS.medium}px) 352px, 100vw`;

export default function LinkCards({
  items,
  more,
  kind,
  color,
  className,
}: {
  items: LinkCard[];
  more: string;
  kind?: string;
  color?: string;
  className?: string;
}) {
  const type: CardKind = cardKinds.find((k) => k === kind) ?? 'outlined';
  const colored = type === 'filled' && color ? `block-cards-${color}` : undefined;
  return (
    <ul className={['block-cards', colored, className].filter(Boolean).join(' ')}>
      {items.map((card, i) => {
        const inside = (
          <>
            {card.media === 'image' && (
              <span className="block-card-picture">
                {card.image && (
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
                )}
              </span>
            )}
            {card.media === 'video' && card.video && (
              <span className="block-card-video">
                <Video view={card.video} />
              </span>
            )}
            {card.media === 'icon' && <Svg name={card.icon ?? ''} size={28} className="block-card-icon" />}
            <span className="block-card-title">{card.title}</span>
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
          <li key={i}>
            <Card kind={type} href={card.href || undefined} className="block-card">
              {inside}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
