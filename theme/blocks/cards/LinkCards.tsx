// Cards that link to other pages (outlined cards, Card.tsx in ../../ui/; one without a page is only its text), each with
// an icon, (`design` 'image') a picture or ('text') nothing at the top, a heading, a text and the link's text at the
// bottom (`more`, the block's shared text), two side by side from small screens (.block-cards in ../blocks.css), on the
// theme's surface or (`background`) the accent: the standard block "Kort", and a site's own cards (this site's front
// page).
// `className`: the site's own classes on the list, e.g. its margin.
import { Svg } from '@morpheme/cms/src/icon';
import type { LinkCard } from '@morpheme/cms/src/standard/cards/view';
import Card from '@theme/ui/Card';

const sizes = '(min-width: 640px) 352px, 100vw';

export default function LinkCards({
  items,
  more,
  design,
  background,
  className,
}: {
  items: LinkCard[];
  more: string;
  design?: string;
  background?: string;
  className?: string;
}) {
  const pictures = design === 'image';
  const filled = background === 'accent' ? 'block-cards-accent' : undefined;
  return (
    <ul className={['block-cards', pictures && 'block-cards-pictures', filled, className].filter(Boolean).join(' ')}>
      {items.map((card, i) => {
        const inside = (
          <>
            {pictures ? (
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
            ) : (
              design !== 'text' && <Svg name={card.icon ?? ''} size={28} className="block-card-icon" />
            )}
            <span className="block-card-title">{card.title}</span>
            <span className="block-card-text">{card.text}</span>
            {card.href && (
              <span className="block-card-more">
                {more}
                <Svg name="arrow-right" size={18} className="block-card-arrow" />
              </span>
            )}
          </>
        );
        // A card without a page is not a link, and has no link's text.
        return (
          <li key={i}>
            <Card href={card.href || undefined} className="block-card">
              {inside}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
