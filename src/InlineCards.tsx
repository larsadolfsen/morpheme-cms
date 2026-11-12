// The Cards block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, section 5): the cards are drawn as the site
// draws them (the theme's cards: LinkCards.tsx, of the block's design and colour) and each card's headline, subhead and text are typed where
// they stand. A card's media (the block's one: an icon, a picture or a video), its page and its buttons are not typed: the active card has
// two slots over its headline, the media and the link, which open the card's sheet (the first card's has the block's one media choice; Edit
// has the design and colour), and, without a page, the next button, shown empty and faded. The parts, the keys and what is kept are
// InlineItems.tsx and src/inlineRows.mjs; a new block starts with three empty, faded cards, the first active (the List has one); `Add card`
// and the dotted line are as in the List.
import { Image as PictureIcon, LinkSimple, Plus, VideoCamera } from '@phosphor-icons/react';
import { Svg } from './icon';
import { t } from './i18n';
import { SiteButton, SiteCard } from './themeUi';
import InlineItems, { InlineSlot } from './InlineItems';
import type { InlineViewProps } from './inlineViews';
import { sharedIn } from './shared';
import shared from './standard/cards/shared';
import { shownCards, type LinkCardProps } from './standard/cards/view';
import { cardKinds, type CardKind } from '@theme/ui/Card';
import Buttons from '@theme/blocks/buttons/Buttons';
import { CardMedia } from '@theme/blocks/cards/LinkCards';

export default function InlineCards({ items, props, data, active, focus, onChange, onSettings, onIcon }: InlineViewProps) {
  const cards = shownCards(items as LinkCardProps[], data, props.media);
  const type: CardKind = cardKinds.find((k) => k === props.design) ?? 'outlined';
  const colored = type === 'filled' && props.color ? `block-cards-${props.color}` : undefined;
  const media = cards[0]?.media ?? 'icon';
  const more = String(sharedIn(data.site, 'cards', shared.values).more);
  return (
    <InlineItems
      items={items}
      active={active}
      focus={focus}
      fields={['title', 'subhead', 'text']}
      start={3}
      add={t.blocks.cards.addCard}
      onChange={onChange}
      wrap={(list) => <ul className={['block-cards', 'inline-cards', colored].filter(Boolean).join(' ')}>{list}</ul>}
      renderItem={({ item, index: i, here, next, field }) => {
        const card = cards[i];
        return (
          <li key={i}>
            <SiteCard
              kind={type}
              data-row={i}
              aria-current={here ? 'true' : undefined}
              aria-label={next ? t.blocks.cards.newCard : t.blocks.cards.cardOf(i + 1, items.length)}
              className={['block-card', 'inline-list-row', here && 'inline-list-row-active', next && 'inline-list-row-next']
                .filter(Boolean)
                .join(' ')}
            >
              {card && <CardMedia card={card} />}
              {here && (
                <span className="inline-card-slots">
                  {(i === 0 || media !== 'none') && (
                    <InlineSlot label={t.blocks.cards.media} onClick={() => onIcon(i)}>
                      {media === 'icon' && card?.icon ? (
                        <Svg name={card.icon} size={24} />
                      ) : media === 'image' ? (
                        <PictureIcon size={24} />
                      ) : media === 'video' ? (
                        <VideoCamera size={24} />
                      ) : (
                        <Plus size={24} />
                      )}
                    </InlineSlot>
                  )}
                  <InlineSlot label={t.blocks.cards.link} onClick={() => onSettings(i)}>
                    <LinkSimple size={24} />
                  </InlineSlot>
                </span>
              )}
              <span className="block-card-title">
                {field('title', t.blocks.cards.title, next ? t.blocks.cards.newCard : t.blocks.cards.title)}
              </span>
              <span className="block-card-subhead">{field('subhead', t.blocks.cards.subhead, t.blocks.cards.subhead)}</span>
              <span className="block-card-text">{field('text', t.blocks.cards.text, t.blocks.cards.text)}</span>
              {card?.href && <span className="block-card-more">{more}</span>}
              {card && !card.href && (card.buttons.length > 0 || (here && !next)) && (
                <span className="block-card-actions">
                  {card.buttons.length > 0 && <Buttons buttons={card.buttons} />}
                  {/* The next button, empty and faded: a tap opens the card's sheet, where it is made (no fixed maximum). */}
                  {here && !next && (
                    <SiteButton
                      kind="outlined"
                      className="inline-card-next-button"
                      aria-label={t.blocks.cards.newButton}
                      onClick={() => onSettings(i)}
                    >
                      {t.blocks.cards.newButton}
                    </SiteButton>
                  )}
                </span>
              )}
            </SiteCard>
          </li>
        );
      }}
    />
  );
}
