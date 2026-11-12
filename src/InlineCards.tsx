// The Cards block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, section 5): the cards are drawn as the site
// draws them (the theme's cards: LinkCards.tsx, of the block's type and colour) and each card's headline and text are typed where they
// stand. A card's media (an icon, an image or a video), its page and its buttons are not typed: the active card has two slots over its
// headline, the media and the link, which open the card's sheet (Edit has the block's own type and colour). The parts, the keys and what
// is kept are InlineItems.tsx and src/inlineRows.mjs; the empty, faded card, `Add card` and the dotted line are as in the List.
import { LinkSimple, Plus } from '@phosphor-icons/react';
import { Svg } from './icon';
import { t } from './i18n';
import { SiteCard } from './themeUi';
import InlineItems, { InlineSlot } from './InlineItems';
import type { InlineViewProps } from './inlineViews';
import { sharedIn } from './shared';
import shared from './standard/cards/shared';
import { shownCards, type LinkCardProps } from './standard/cards/view';
import { cardKinds, type CardKind } from '@theme/ui/Card';
import Buttons from '@theme/blocks/buttons/Buttons';
import { CardMedia } from '@theme/blocks/cards/LinkCards';

export default function InlineCards({ items, props, data, active, focus, onChange, onSettings, onIcon }: InlineViewProps) {
  const cards = shownCards(items as LinkCardProps[], data);
  const type: CardKind = cardKinds.find((k) => k === props.kind) ?? 'outlined';
  const colored = type === 'filled' && props.color ? `block-cards-${props.color}` : undefined;
  const more = String(sharedIn(data.site, 'cards', shared.values).more);
  return (
    <InlineItems
      items={items}
      active={active}
      focus={focus}
      fields={['title', 'text']}
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
                  <InlineSlot label={t.blocks.cards.media} onClick={() => onIcon(i)}>
                    {card?.media === 'icon' && card.icon ? <Svg name={card.icon} size={24} /> : <Plus size={24} />}
                  </InlineSlot>
                  <InlineSlot label={t.blocks.cards.link} onClick={() => onSettings(i)}>
                    <LinkSimple size={24} />
                  </InlineSlot>
                </span>
              )}
              <span className="block-card-title">
                {field('title', t.blocks.cards.title, next ? t.blocks.cards.newCard : t.blocks.cards.title)}
              </span>
              <span className="block-card-text">{field('text', t.blocks.cards.text, t.blocks.cards.text)}</span>
              {card?.href && <span className="block-card-more">{more}</span>}
              {card && !card.href && card.buttons.length > 0 && (
                <span className="block-card-actions">
                  <Buttons buttons={card.buttons} />
                </span>
              )}
            </SiteCard>
          </li>
        );
      }}
    />
  );
}
