// The Cards block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, section 5): the cards are drawn as the site
// draws them (the theme's cards: LinkCards.tsx, of the block's design and colour) and each card's headline, subhead and text are typed where
// they stand. A card's media (the block's one: an icon, an image or a video), its page and its buttons are not typed. While a card is active
// its media area is always there: empty, it has one button for each kind (icon, image, video), which sets the block's media and opens its
// picker; with a media set, a tap on the icon, the image or the video opens the picker to change or remove it (no separate slot). The link is
// not in the card but the floating bar's Link (MarkdownEditor.tsx), which opens the card's sheet (page and buttons). Without a page the active
// card has its action area at the bottom: its buttons and the next one, empty and faded (`Add button`). The parts, the keys and what is kept
// are InlineItems.tsx and src/inlineRows.mjs; a new block starts with three empty, faded cards, the first active (the List has one); `Add
// card` and the dotted line are as in the List.
import { Image as ImageIcon, Shapes, VideoCamera } from '@phosphor-icons/react';
import { Svg } from './icon';
import { t } from './i18n';
import { SiteButton, SiteCard } from './themeUi';
import InlineItems, { InlineSlot } from './InlineItems';
import type { InlineViewProps } from './inlineViews';
import { sharedIn } from './shared';
import shared from './standard/cards/shared';
import { shownCards, type LinkCard, type LinkCardProps } from './standard/cards/view';
import { cardKinds, type CardKind } from '@theme/ui/Card';
import Buttons from '@theme/blocks/buttons/Buttons';
import { CardMedia } from '@theme/blocks/cards/LinkCards';

/** A card that has its media set: an icon, an image or a video. */
const hasMedia = (card: LinkCard) => !!(card.icon || card.image || card.video);

export default function InlineCards({ items, props, data, active, focus, onChange, onSettings, onIcon, onProps }: InlineViewProps) {
  const cards = shownCards(items as LinkCardProps[], data, props.media);
  const type: CardKind = cardKinds.find((k) => k === props.design) ?? 'outlined';
  const colored = type === 'filled' && props.color ? `block-cards-${props.color}` : undefined;
  const media = cards[0]?.media ?? 'icon';
  const kinds = [
    { kind: 'icon', label: t.blocks.cards.mediaIcon, Icon: Shapes },
    { kind: 'image', label: t.blocks.cards.mediaImage, Icon: ImageIcon },
    { kind: 'video', label: t.blocks.cards.mediaVideo, Icon: VideoCamera },
  ] as const;
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
              {card && here && hasMedia(card) ? (
                // A media that is set is changed by a tap on it: its picker, to replace or remove it.
                <button type="button" className="inline-card-media" aria-label={t.blocks.cards.media} onClick={() => onIcon(i)}>
                  <CardMedia card={card} />
                </button>
              ) : (
                <>
                  {card && <CardMedia card={card} />}
                  {here && (
                    <span className="inline-card-slots">
                      {kinds.map(({ kind, label, Icon }) => (
                        <InlineSlot
                          key={kind}
                          label={label}
                          pressed={media === kind}
                          onClick={() => {
                            onProps({ media: kind });
                            onIcon(i);
                          }}
                        >
                          <Icon size={24} />
                        </InlineSlot>
                      ))}
                    </span>
                  )}
                </>
              )}
              <span className="block-card-title">
                {field('title', t.blocks.cards.title, next ? t.blocks.cards.newCard : t.blocks.cards.title)}
              </span>
              <span className="block-card-subhead">{field('subhead', t.blocks.cards.subhead, t.blocks.cards.subhead)}</span>
              <span className="block-card-text">{field('text', t.blocks.cards.text, t.blocks.cards.text)}</span>
              {card?.href && <span className="block-card-more">{more}</span>}
              {!card?.href && (here || (card?.buttons.length ?? 0) > 0) && (
                <span className="block-card-actions">
                  {card && card.buttons.length > 0 && <Buttons buttons={card.buttons} />}
                  {/* The next button, empty and faded: a tap opens the card's sheet, where it is made (no fixed maximum). */}
                  {here && (
                    <SiteButton kind="text" className="inline-card-next-button" onClick={() => onSettings(i)}>
                      {t.blocks.cards.addButton}
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
