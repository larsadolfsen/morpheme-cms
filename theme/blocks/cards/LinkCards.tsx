// Cards, as Material 3 has them (Card.tsx in ../../ui/: outlined, the default, filled or elevated): each with the block's one media at the top
// (an icon, an image, a video with its play button, or none), a headline, a subhead, a text and either one link (a card with a page is one:
// the whole card, with the link's text at the bottom, `more`, the block's shared text) or the action area (its buttons). Two side by side from
// small screens (.mo-block-cards in ../blocks.css). `color`: the container of a filled card (primary, secondary, tertiary), else the surface
// container: the standard block "Cards".
// `className`: the site's own classes on the list, e.g. its margin.
import { BREAKPOINTS } from '@morphemecms/cms/lib/breakpoints.mjs';
import { Svg } from '@morphemecms/cms/src/icon';
import type { CardsLayout, LinkCard } from '@morphemecms/cms/src/standard/cards/view';
import { siteT } from '@morphemecms/cms/src/i18n';
import Buttons from '@theme/blocks/buttons/Buttons';
import Button from '@theme/ui/Button';
import Carousel from '@theme/ui/Carousel';
import Video from '@theme/blocks/video/View';
import Card, { CardMedia as MediaBox, cardKinds, type CardKind } from '@theme/ui/Card';

/** The image of a card cut to the part the owner chose (crop.mjs: percent of the image from the left, from the top, its width and height): wider than its box and moved. */
const cutStyle = ([x, y, w]: number[]) => ({
  width: `${Math.round((100 / w) * 100 * 100) / 100}%`,
  height: 'auto',
  maxWidth: 'none',
  objectFit: 'fill' as const,
  transform: `translate(${-Math.round(x * 10) / 10}%, ${-Math.round(y * 10) / 10}%)`,
});

const sizes = `(min-width: ${BREAKPOINTS.medium}px) 352px, 100vw`;

/** A card's media at the top: its image, its video with the play button or its icon (nothing for none). */
export function CardMedia({ card }: { card: LinkCard }) {
  return (
    <>
      {card.media === 'image' && card.image && (
        <span
          className="mo-block-cards__card-picture"
          style={card.ratio && card.ratio !== '3:2' ? { aspectRatio: card.ratio.replace(':', ' / ') } : undefined}
        >
          <img
            style={card.image.crop ? cutStyle(card.image.crop) : undefined}
            src={card.image.src}
            srcSet={card.image.srcset}
            sizes={card.image.srcset ? sizes : undefined}
            width={card.image.width}
            height={card.image.height}
            alt={card.image.alt ?? ''}
            loading="lazy"
            decoding="async"
          />
        </span>
      )}
      {card.media === 'video' && card.video && (
        <span className="mo-block-cards__card-video">
          <Video view={card.video} />
        </span>
      )}
      {card.media === 'icon' && card.icon && (
        <Svg name={card.icon} size={28} className="mo-block-cards__card-icon" iconColor={card.iconColor} />
      )}
    </>
  );
}

/** The `media` of a card's props (Card.tsx): the image cut to the part the owner chose, or the video with its play button, edge to edge at the
 * top; nothing for an icon (it is the card's `icon`) or none. */
function mediaOf(card: LinkCard) {
  if (card.media === 'image' && card.image) {
    const [w, h] = card.ratio ? card.ratio.split(':').map(Number) : [3, 2];
    return (
      <MediaBox ratio={w && h ? w / h : 3 / 2}>
        <img
          style={card.image.crop ? cutStyle(card.image.crop) : undefined}
          src={card.image.src}
          srcSet={card.image.srcset}
          sizes={card.image.srcset ? sizes : undefined}
          width={card.image.width}
          height={card.image.height}
          alt={card.image.alt ?? ''}
          loading="lazy"
          decoding="async"
        />
      </MediaBox>
    );
  }
  if (card.media === 'video' && card.video) return <Video view={card.video} />;
  return undefined;
}

export default function LinkCards({
  items,
  more,
  design,
  color,
  phone,
  layout,
  label,
  className,
}: {
  items: LinkCard[];
  more: string;
  design?: string;
  color?: string;
  /** 'carousel': the cards are swiped sideways on every screen size, adapting to the carousel's width, with `Show all` under them (not in the full-screen layout). */
  phone?: string;
  /** The carousel's Material 3 layout: uncontained without one. */
  layout?: CardsLayout;
  /** What the carousel is called for screen readers. */
  label?: string;
  className?: string;
}) {
  const type: CardKind = cardKinds.find((k) => k === design) ?? 'outlined';
  const colored = type === 'filled' && color ? `mo-block-cards__${color}` : undefined;
  const say = siteT.blocks.cards;
  const cardOf = (card: LinkCard) => {
    const parts = {
      kind: type,
      className: 'mo-block-cards__card',
      media: mediaOf(card),
      icon:
        card.media === 'icon' && card.icon ? (
          <Svg name={card.icon} size={24} className="mo-block-cards__card-icon" iconColor={card.iconColor} />
        ) : undefined,
      headline: card.title,
      subhead: card.subhead || undefined,
      supporting: card.text || undefined,
    };
    // A card with a page is one link, the whole card, with `more` at its end; one without is not a link and may have buttons.
    return card.href ? (
      <Card {...parts} href={card.href}>
        <span className="mo-block-cards__card-more">
          {more}
          <Svg name="arrow_forward" size={18} className="mo-block-cards__card-arrow" />
        </span>
      </Card>
    ) : (
      <Card {...parts} actions={card.buttons.length > 0 ? <Buttons buttons={card.buttons} /> : undefined} divider={card.divider} />
    );
  };
  if (phone === 'carousel' && items.length >= 2)
    return (
      <div className={['mo-block-cards__carousel', colored, className].filter(Boolean).join(' ')} data-cards-carousel="">
        <Carousel
          layout={layout === 'hero-center' ? 'hero' : layout}
          alignment={layout === 'hero-center' ? 'center' : 'start'}
          label={label || say.cardsLabel}
          roleDescription={say.carousel}
          itemsFocusable
          itemRoleDescription={say.slide}
          items={items.map((card, i) => ({
            key: String(i),
            label: say.slideOf(i + 1, items.length),
            content: cardOf(card),
            ...(layout === 'multi-aspect-ratio' ? { aspect: card.aspect } : {}),
            // A card with a page is one link and one with buttons has them to focus; a text-only card is reached itself.
            focusable: !card.href && card.buttons.length === 0,
          }))}
        />
        {layout !== 'full-screen' && (
          <div className="mo-block-cards__show-all">
            <Button kind="text" aria-expanded="false" data-cards-show-all="" data-all={say.showAll} data-fewer={say.showFewer}>
              {say.showAll}
            </Button>
          </div>
        )}
      </div>
    );
  return (
    <ul className={['mo-block-cards', colored, className].filter(Boolean).join(' ')}>
      {items.map((card, i) => (
        <li key={i}>{cardOf(card)}</li>
      ))}
    </ul>
  );
}
