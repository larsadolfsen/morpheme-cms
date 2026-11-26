// The Cards block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, section 5): the cards are drawn as the site
// draws them (the theme's cards: LinkCards.tsx, of the block's design and colour) and each card's headline, subhead and text are typed where
// they stand. A card's media (the block's one: an icon, an image or a video), its page and its buttons are not typed. While a card is active
// its media area is always there: empty, it has one button for each kind (icon, image, video), which sets the block's media and opens its
// picker; with a media set, a tap on the icon, the image or the video opens the picker to change or remove it (no separate slot). The page is
// picked from the link control in the action row, which opens the page picker at once (a card has no sheet of its own). The active card has
// its action area at the bottom: its buttons and the next one, empty and faded (`Add button`; with a page it says so and adds none). The parts, the keys and what is kept
// are InlineItems.tsx and src/inlineRows.mjs; a new block starts with three empty, faded cards, the first active (the List has one); `Add
// card` and the dotted line are as in the List.
import { buttonClass } from '@theme/ui/Button';
import { useState } from 'react';
import { Icon, materialIcon } from './icon';
import { t } from './i18n';
import { SiteButton, SiteCard } from './themeUi';
import InlineItems, { InlineField, InlineSlot, type Item } from './InlineItems';
import type { InlineViewProps } from './inlineViews';
import { sharedIn } from './shared';
import ButtonMenu, { type ButtonPatch } from './ButtonMenu';
import { buttonList, type Button } from './standard/buttons/fields';
import { buttonsOf as resolveButtons } from './standard/buttons/view';
import shared from './standard/cards/shared';
import { layoutOf, ratioProp, shownCards, type LinkCard, type LinkCardProps } from './standard/cards/view';
import { cardKinds, type CardKind } from '@theme/ui/Card';
import Buttons from '@theme/blocks/buttons/Buttons';
import Divider from '@theme/ui/Divider';
import { CardMedia } from '@theme/blocks/cards/LinkCards';

/** A card that has its media set: an icon, an image or a video. */
const hasMedia = (card: LinkCard) => !!(card.icon || card.image || card.video);

export default function InlineCards({
  items,
  props,
  data,
  active,
  focus,
  onChange,
  onSettings,
  onIcon,
  onProps,
  onRow,
  onPick,
}: InlineViewProps) {
  // The menu of the active card's button (its target, style, icon and Remove), opened from the control on the button.
  const [menu, setMenu] = useState<{ card: number; row: number; at: HTMLElement } | null>(null);
  const change = (card: number, row: number, patch: ButtonPatch) =>
    onChange({
      items: items.map((r, j) =>
        j === card ? { ...r, buttons: ((r.buttons ?? []) as Button[]).map((x, m) => (m === row ? { ...x, ...patch } : x)) } : r,
      ),
      active: card,
      focus: null,
    });
  // A button's icon: the icon picker of the button's own field (the card's media icon is the slot on the card).
  const pickIcon = (card: number, row: number) => {
    const f = buttonList.fields!.find((x) => x.name === 'icon')!;
    const buttons = (items[card]?.buttons ?? []) as Button[];
    onRow?.({
      headline: t.blocks.buttons.icon,
      fields: [f],
      value: { icon: buttons[row]?.icon ?? '' },
      closes: true,
      onChange: (v) => change(card, row, { icon: v.icon as string }),
    });
  };
  const cards = shownCards(items as LinkCardProps[], data, props.media, ratioProp(props), layoutOf(props) === 'multi-aspect-ratio');
  const type: CardKind = cardKinds.find((k) => k === props.design) ?? 'outlined';
  const colored = type === 'filled' && props.color ? `mo-block-cards__${props.color}` : undefined;
  const media = cards[0]?.media ?? 'icon';
  const kinds = [
    { kind: 'icon', label: t.blocks.cards.mediaIcon, Icon: materialIcon('shapes') },
    { kind: 'image', label: t.blocks.cards.mediaImage, Icon: materialIcon('image') },
    { kind: 'video', label: t.blocks.cards.mediaVideo, Icon: materialIcon('videocam') },
  ] as const;
  const more = String(sharedIn(data.site, 'cards', shared.values).more);
  // The active card's action area: each button's text is typed on the button itself (its target, style and icon are in its menu), and the
  // next button is always there, empty and faded (`Add button`; no fixed maximum). Backspace in an empty one drops it, Enter adds the next.
  const buttonsOf = (i: number, row: Item) => {
    const list = (Array.isArray(row.buttons) ? row.buttons : []) as Button[];
    const page = typeof row.href === 'string' && row.href !== '';
    const set = (buttons: object[], focus?: number) =>
      onChange({
        items: items.map((r, j) => (j === i ? (buttons.length ? { ...r, buttons } : (({ buttons: _, ...rest }) => rest)(r)) : r)),
        active: i,
        focus: focus === undefined ? null : { row: i, field: `button-${focus}` },
      });
    const made = () => ({ label: '', to: 'page', kind: 'filled' });
    return (
      <span className="mo-block-cards__card-actions mo-editor-inline-card-buttons">
        {list.map((b, n) => (
          <span
            key={n}
            role="group"
            aria-label={t.blocks.buttons.buttonOf(n + 1, list.length)}
            className={[buttonClass(resolveButtons([b], data)[0]?.kind), 'mo-editor-inline-button', 'mo-editor-inline-card-button'].join(
              ' ',
            )}
          >
            <InlineField
              name={`button-${n}`}
              value={b.label ?? ''}
              label={t.blocks.cards.buttonText}
              placeholder={t.blocks.cards.buttonText}
              onType={(v) => set(list.map((x, m) => (m === n ? { ...x, label: v } : x)))}
              onFocus={() => {}}
              onKeys={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (b.label?.trim()) set([...list.slice(0, n + 1), made(), ...list.slice(n + 1)], n + 1);
                }
                if (e.key === 'Backspace' && !b.label) {
                  e.preventDefault();
                  set(
                    list.filter((_, m) => m !== n),
                    Math.max(0, n - 1),
                  );
                }
              }}
            />
            {onPick && (
              <span onClickCapture={(e) => setMenu({ card: i, row: n, at: e.currentTarget })}>
                <InlineSlot label={t.blocks.buttons.options} onClick={() => {}}>
                  <Icon name="more_vert" size={18} />
                </InlineSlot>
              </span>
            )}
          </span>
        ))}
        {/* A card with a page is one link (Material 3's primary action) and has no buttons: the control says so and adds none. */}
        <SiteButton
          kind="text"
          data-add-button=""
          className="mo-editor-inline-card-next-button"
          disabled={page}
          onClick={() => !page && set([...list, made()], list.length)}
        >
          {page ? t.blocks.cards.noButtons : t.blocks.cards.addButton}
        </SiteButton>
        {/* The card's page (the whole card is its link) is picked from the control at once; with buttons it has none, and the divider is a switch. */}
        {list.length === 0 && (
          <InlineSlot label={page ? t.blocks.cards.linkTo : t.blocks.cards.addLink} pressed={page} onClick={() => onSettings(i)}>
            <Icon name={page ? 'link' : 'add_link'} size={24} />
          </InlineSlot>
        )}
        {list.length > 0 && (
          <InlineSlot
            label={t.blocks.cards.dividerOn}
            pressed={row.divider === true}
            onClick={() =>
              onChange({ items: items.map((r, j) => (j === i ? { ...r, divider: r.divider !== true } : r)), active: i, focus: null })
            }
          >
            <Icon name="horizontal_rule" size={24} />
          </InlineSlot>
        )}
      </span>
    );
  };
  return (
    <>
      {props.phone === 'carousel' && <span className="mo-editor-inline-cards-chip">{t.blocks.cards.carouselChip}</span>}
      <InlineItems
        items={items}
        active={active}
        focus={focus}
        fields={['title', 'subhead', 'text']}
        start={3}
        add={t.blocks.cards.addCard}
        onChange={onChange}
        paste="text"
        wrap={(list) => <ul className={['mo-block-cards', 'mo-editor-inline-cards', colored].filter(Boolean).join(' ')}>{list}</ul>}
        renderItem={({ item, index: i, here, next, field }) => {
          const card = cards[i];
          return (
            <li key={i}>
              <SiteCard
                kind={type}
                data-row={i}
                role="group"
                aria-current={here ? 'true' : undefined}
                aria-label={next ? t.blocks.cards.newCard : t.blocks.cards.cardOf(i + 1, items.length)}
                className={[
                  'mo-block-cards__card',
                  'mo-editor-inline-list-row',
                  here && 'mo-editor-inline-list-row-active',
                  next && 'mo-editor-inline-list-row-next',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {card && hasMedia(card) ? (
                  // A media that is set is changed by a tap on it, on any card: its picker, to replace or remove it, and the card is the active one.
                  // An image is its own tap target: a tap selects the card, and the bar has the image's tools (Change image, Crop, Alt text, Remove).
                  <div className="mo-editor-inline-card-media-box">
                    {/* The media is drawn as it is (a video keeps its own play button, so it is `inert` here) and the button that changes it is its sibling, laid over it:
                        a control may not hold another. */}
                    <div className="mo-editor-inline-card-media-view" inert>
                      <CardMedia card={card} />
                    </div>
                    <button
                      type="button"
                      className="mo-editor-inline-card-media"
                      aria-label={t.blocks.cards.media}
                      onClick={() => (card.image ? !here && onChange({ active: i }) : onIcon(i))}
                    />
                  </div>
                ) : (
                  <>
                    {card && <CardMedia card={card} />}
                    {here && (
                      <span className="mo-editor-inline-card-slots">
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
                <span className="mo-block-cards__card-title">
                  {field('title', t.blocks.cards.title, next ? t.blocks.cards.newCard : t.blocks.cards.title)}
                </span>
                {/* The subhead and the text are optional: a card without one has no empty row (and no room kept for it) unless it is the one being typed in, so a card is as high here as on the site. */}
                {(here || next || String(item.subhead ?? '').trim() !== '') && (
                  <span className="mo-block-cards__card-subhead">{field('subhead', t.blocks.cards.subhead, t.blocks.cards.subhead)}</span>
                )}
                {(here || next || String(item.text ?? '').trim() !== '') && (
                  <span className="mo-block-cards__card-text">{field('text', t.blocks.cards.text, t.blocks.cards.text)}</span>
                )}
                {card?.href && <span className="mo-block-cards__card-more">{more}</span>}
                {/* The divider is drawn only above buttons (a card with a page or a video has none), the value kept otherwise. */}
                {!card?.href &&
                  item.divider === true &&
                  ((card?.buttons.length ?? 0) > 0 || (here && Array.isArray(item.buttons) && item.buttons.length > 0)) && (
                    <Divider className="mo-block-cards__card-divider" />
                  )}
                {here && buttonsOf(i, item)}
                {!card?.href && !here && (card?.buttons.length ?? 0) > 0 && (
                  <span className="mo-block-cards__card-actions">
                    <Buttons buttons={card!.buttons} />
                  </span>
                )}
              </SiteCard>
            </li>
          );
        }}
      />
      {menu && onPick && (
        <ButtonMenu
          anchor={menu.at}
          button={((items[menu.card]?.buttons ?? []) as Button[])[menu.row] ?? {}}
          onChange={(patch) => change(menu.card, menu.row, patch)}
          onRemove={() => {
            const left = ((items[menu.card]?.buttons ?? []) as Button[]).filter((_, m) => m !== menu.row);
            onChange({
              items: items.map((r, j) =>
                j === menu.card ? (left.length ? { ...r, buttons: left } : (({ buttons: _, ...rest }) => rest)(r)) : r,
              ),
              active: menu.card,
              focus: null,
            });
          }}
          onPick={onPick}
          onIcon={() => pickIcon(menu.card, menu.row)}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}
