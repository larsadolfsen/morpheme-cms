// The Carousel block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, section 5): its optional header and its items are typed where
// they stand. A swiping row cannot be typed in, so the items are drawn stacked, as the site draws them when `Show all` is on: a plain item (an image or a video filling it,
// with its brief label on it) or, in the uncontained layouts, a card (the Card component in the block's variant). An item's media (an image or a video; for a card also
// an icon or none) is picked from its slots: each sets the item's `media` and opens its picker; with a media set a tap on it opens the picker to change or remove it. The
// active item has its slots for the media and, in the uncontained layouts, the `Card` switch; a card also has its action area (its buttons and the next one, empty and
// faded) and its page. The parts, the keys and what is kept are InlineItems.tsx and src/inlineRows.mjs; a new block starts with three empty, faded items, the first active.
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
import shared from './standard/carousel/shared';
import { cardLayouts, layoutOf, ratioProp, shownItems, type CarouselItem, type CarouselItemProps } from './standard/carousel/view';
import { cardKinds, type CardKind } from '@theme/ui/Card';
import Buttons from '@theme/blocks/buttons/Buttons';
import Divider from '@theme/ui/Divider';
import Video from '@theme/blocks/video/View';
import { Svg } from './icon';

/** An item that has its media set: an icon, an image or a video. */
const hasMedia = (item: CarouselItem) => !!(item.icon || item.image || item.video);

/** The media of an item as the site draws it, edge to edge. */
function Media({ item }: { item: CarouselItem }) {
  if (item.media === 'image' && item.image)
    return (
      <span className="mo-block-carousel__item-media">
        <img
          src={item.image.src}
          srcSet={item.image.srcset}
          width={item.image.width}
          height={item.image.height}
          alt={item.image.alt ?? ''}
        />
      </span>
    );
  if (item.media === 'video' && item.video)
    return (
      <span className="mo-block-carousel__item-media">
        <Video view={item.video} />
      </span>
    );
  if (item.media === 'icon' && item.icon)
    return <Svg name={item.icon} size={24} className="mo-block-carousel__card-icon" iconColor={item.iconColor} />;
  return null;
}

export default function InlineCarousel({
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
  const layout = layoutOf(props);
  const cardsHere = cardLayouts.includes(layout);
  const shown = shownItems(items as CarouselItemProps[], data, layout, ratioProp(props));
  const type: CardKind = cardKinds.find((k) => k === props.design) ?? 'outlined';
  const colored = type === 'filled' && props.color ? `mo-block-carousel__${props.color}` : undefined;
  const more = String(sharedIn(data.site, 'carousel', shared.values).more);
  // A new block has no stored item yet, only the empty one shown to type in (`next`): a change to it makes it the item.
  const patch = (i: number, p: Item) =>
    onChange({
      items: i >= items.length ? [...items, { title: '', ...p }] : items.map((r, j) => (j === i ? { ...r, ...p } : r)),
      active: i,
      focus: null,
    });

  // The active card's action area: each button's text is typed on the button itself (its target, style and icon are in its menu), and the next button is always there,
  // empty and faded (`Add button`; no fixed maximum). Backspace in an empty one drops it, Enter adds the next.
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
      <span className="mo-block-carousel__card-actions mo-editor-inline-card-buttons">
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
        {list.length > 0 && (
          <InlineSlot
            label={t.blocks.cards.dividerOn}
            pressed={row.divider === true}
            onClick={() => patch(i, { divider: row.divider !== true })}
          >
            <Icon name="horizontal_rule" size={24} />
          </InlineSlot>
        )}
      </span>
    );
  };

  // What an item's media slot sets: its `media` ('' is an image), then its picker.
  const kinds = [
    ...(cardsHere ? [{ kind: 'icon', label: t.blocks.cards.mediaIcon, Icon: materialIcon('shapes') }] : []),
    { kind: '', label: t.blocks.cards.mediaImage, Icon: materialIcon('image') },
    { kind: 'video', label: t.blocks.cards.mediaVideo, Icon: materialIcon('videocam') },
  ] as const;

  return (
    <>
      <span className="mo-editor-inline-cards-chip">{t.blocks.carousel.label}</span>
      {/* The carousel's optional header, typed where it stands, as the site draws it (the arrow beside it is the site's, not drawn here). Empty: no header, `Show all` under the row. */}
      <div className="mo-block-carousel__header mo-editor-inline-cards-header">
        <span className="mo-block-carousel__heading">
          <InlineField
            name="header"
            value={typeof props.header === 'string' ? props.header : ''}
            label={t.blocks.carousel.header}
            placeholder={t.blocks.carousel.headerPlaceholder}
            onType={(v) => onProps({ header: v })}
            // A tap in the header makes the block the active one, as a tap in an item does.
            onFocus={() => onChange({ active: Math.max(active ?? 0, 0), focus: null })}
            onKeys={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
          />
        </span>
      </div>
      <InlineItems
        items={items}
        active={active}
        focus={focus}
        fields={['title', 'subhead', 'text']}
        start={3}
        add={t.blocks.carousel.addItem}
        onChange={onChange}
        paste="text"
        wrap={(list) => <ul className={['mo-block-carousel', 'mo-editor-inline-carousel', colored].filter(Boolean).join(' ')}>{list}</ul>}
        renderItem={({ item, index: i, here, next, field }) => {
          const one = shown[i];
          const card = !!one?.card;
          const rowClass = [
            'mo-editor-inline-list-row',
            here && 'mo-editor-inline-list-row-active',
            next && 'mo-editor-inline-list-row-next',
          ];
          const label = next ? t.blocks.carousel.newItem : t.blocks.carousel.itemOf(i + 1, items.length);
          // The slots over an active item: the media kinds and, where the layout takes cards, the Card switch.
          const slots = here && (
            <span className="mo-editor-inline-card-slots">
              {kinds.map(({ kind, label, Icon }) => (
                <InlineSlot
                  key={kind || 'image'}
                  label={label}
                  pressed={(item.media ?? '') === kind}
                  onClick={() => {
                    patch(i, { media: kind });
                    onIcon(i);
                  }}
                >
                  <Icon size={24} />
                </InlineSlot>
              ))}
              {cardsHere && (
                <InlineSlot label={t.blocks.carousel.card} pressed={card} onClick={() => patch(i, { card: !card })}>
                  <Icon name="cards" size={24} />
                </InlineSlot>
              )}
            </span>
          );
          // A media that is set is changed by a tap on it: its picker, to replace or remove it, and the item is the active one.
          const mediaOf = one && hasMedia(one) && (
            <div className="mo-editor-inline-card-media-box">
              <div className="mo-editor-inline-card-media-view" inert>
                <Media item={one} />
              </div>
              <button
                type="button"
                className="mo-editor-inline-card-media"
                aria-label={t.blocks.carousel.media}
                onClick={(e) => {
                  e.currentTarget.focus();
                  onIcon(i);
                }}
              />
            </div>
          );
          if (card)
            return (
              <li key={i}>
                <SiteCard
                  kind={type}
                  data-row={i}
                  role="group"
                  aria-current={here ? 'true' : undefined}
                  aria-label={label}
                  className={['mo-block-carousel__card', ...rowClass].filter(Boolean).join(' ')}
                >
                  {slots}
                  {mediaOf}
                  <span className="mo-block-carousel__card-title">
                    {field('title', t.blocks.cards.title, next ? t.blocks.carousel.newItem : t.blocks.cards.title)}
                  </span>
                  {(here || next || String(item.subhead ?? '').trim() !== '') && (
                    <span className="mo-block-carousel__card-subhead">
                      {field('subhead', t.blocks.cards.subhead, t.blocks.cards.subhead)}
                    </span>
                  )}
                  {(here || next || String(item.text ?? '').trim() !== '') && (
                    <span className="mo-block-carousel__card-text">{field('text', t.blocks.cards.text, t.blocks.cards.text)}</span>
                  )}
                  {one?.href && <span className="mo-block-carousel__card-more">{more}</span>}
                  {!one?.href &&
                    item.divider === true &&
                    ((one?.buttons.length ?? 0) > 0 || (here && Array.isArray(item.buttons) && item.buttons.length > 0)) && (
                      <Divider className="mo-block-carousel__card-divider" />
                    )}
                  {here && buttonsOf(i, item)}
                  {!one?.href && !here && (one?.buttons.length ?? 0) > 0 && (
                    <span className="mo-block-carousel__card-actions">
                      <Buttons buttons={one!.buttons} />
                    </span>
                  )}
                </SiteCard>
              </li>
            );
          // A plain item: the media fills it, the brief label (all optional) sits on it.
          return (
            <li key={i}>
              <div
                data-row={i}
                role="group"
                aria-current={here ? 'true' : undefined}
                aria-label={label}
                className={['mo-block-carousel__item', !(one && hasMedia(one)) && 'mo-has-no-media', ...rowClass].filter(Boolean).join(' ')}
              >
                {slots}
                {mediaOf}
                <span className="mo-block-carousel__item-label">
                  <span className="mo-block-carousel__item-title">
                    {field('title', t.blocks.cards.title, next ? t.blocks.carousel.newItem : t.blocks.cards.title)}
                  </span>
                  {(here || next || String(item.subhead ?? '').trim() !== '') && (
                    <span className="mo-block-carousel__item-subhead">
                      {field('subhead', t.blocks.cards.subhead, t.blocks.cards.subhead)}
                    </span>
                  )}
                  {(here || next || String(item.text ?? '').trim() !== '') && (
                    <span className="mo-block-carousel__item-text">{field('text', t.blocks.cards.text, t.blocks.cards.text)}</span>
                  )}
                </span>
                {here && (
                  <InlineSlot
                    label={(item.href ? t.blocks.cards.linkTo : t.blocks.cards.addLink) as string}
                    pressed={!!item.href}
                    onClick={() => onSettings(i)}
                  >
                    <Icon name={item.href ? 'link' : 'add_link'} size={24} />
                  </InlineSlot>
                )}
              </div>
            </li>
          );
        }}
      />
      {menu && onPick && (
        <ButtonMenu
          anchor={menu.at}
          button={((items[menu.card]?.buttons ?? []) as Button[])[menu.row] ?? {}}
          onChange={(p) => change(menu.card, menu.row, p)}
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
