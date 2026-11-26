// The Price cards block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, section 5): the cards are drawn as the
// site draws them (the theme's price cards, View.tsx) and each card's name, price, unit and text are typed where they stand. What is included
// is a checklist inside the card, with its own `Add feature`, and the card's button label is typed on the button. Whether the card is
// highlighted is a switch on the active card and its label is typed on it; where its button leads, its style and its icon are in the button's menu (ButtonMenu.tsx). A price list has
// at most four cards. The parts, the keys and what is kept are InlineItems.tsx and src/inlineRows.mjs; the empty, faded card, `Add price
// card` and the dotted line are as in the List.
import type { KeyboardEvent } from 'react';
import { t } from './i18n';
import { Glyph, Icon } from './icon';
import { useState } from 'react';
import ButtonMenu, { type ButtonPatch } from './ButtonMenu';
import InlineItems, { InlineField, InlineSlot, type Item } from './InlineItems';
import type { InlineViewProps } from './inlineViews';
import { buttonsOf } from './standard/buttons/view';
import { buttonList, targets, type Button } from './standard/buttons/fields';
import type { PriceCardProps } from './standard/pricecards/view';
import { SiteButton, SiteCard } from './themeUi';
import List, { ListItem } from '@theme/ui/List';
import { buttonClass } from '@theme/ui/Button';

const texts = t.blocks.pricecards;
export const maxCards = 4;

export default function InlinePriceCards({ items, props, data, active, focus, onChange, onRow, onPick }: InlineViewProps) {
  const cards = items as PriceCardProps[];
  // The menu of the active card's button, opened from the control on the button.
  const [menu, setMenu] = useState<{ card: number; at: HTMLElement } | null>(null);
  const changeButton = (card: number, patch: ButtonPatch) =>
    onChange({
      items: cards.map((c, j) =>
        j === card ? { ...c, buttons: ((c.buttons ?? []) as Button[]).map((x, m) => (m === 0 ? { ...x, ...patch } : x)) } : c,
      ),
      active: card,
      focus: null,
    });
  // The button's icon: the icon picker of the button's own field.
  const pickIcon = (card: number) => {
    const f = buttonList.fields!.find((x) => x.name === 'icon')!;
    onRow?.({
      headline: t.blocks.buttons.icon,
      fields: [f],
      value: { icon: ((cards[card]?.buttons ?? []) as Button[])[0]?.icon ?? '' },
      closes: true,
      onChange: (v) => changeButton(card, { icon: v.icon as string }),
    });
  };
  const put = (i: number, patch: Item, focusField?: string) =>
    onChange({
      items: cards.map((c, j) => (j === i ? { ...c, ...patch } : c)),
      active: i,
      ...(focusField ? { focus: { row: i, field: focusField } } : {}),
    });
  const features = (i: number) => cards[i]?.features ?? [];
  const setFeatures = (i: number, list: string[], focusField?: string) => put(i, { features: list }, focusField);

  // A feature: Enter makes the next one below, Backspace in an empty one drops it and goes to the one before (or the card's text).
  const featureKeys = (i: number, j: number, e: KeyboardEvent<HTMLTextAreaElement>) => {
    const list = features(i);
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (list[j]?.trim()) setFeatures(i, [...list.slice(0, j + 1), '', ...list.slice(j + 1)], `f${j + 1}`);
    }
    if (e.key === 'Backspace' && !list[j]) {
      e.preventDefault();
      setFeatures(
        i,
        list.filter((_, k) => k !== j),
        j > 0 ? `f${j - 1}` : 'text',
      );
    }
  };

  // The card's one button: its label is typed. An emptied label that has nothing else drops the button again.
  const setLabel = (i: number, label: string) => {
    const [own, ...rest] = (cards[i]?.buttons ?? []) as Button[];
    const base: Button = own ?? { to: targets[0]?.value ?? 'page' };
    const next = { ...base, label };
    const bare = !label.trim() && !next.href && !next.open && !next.kind && !next.icon && !rest.length;
    put(i, { buttons: bare ? [] : [next, ...rest] });
  };

  return (
    <>
      <InlineItems
        items={items}
        active={active}
        focus={focus}
        fields={['name', 'price', 'unit', 'text', 'badge']}
        add={texts.addCard}
        max={maxCards}
        onChange={onChange}
        wrap={(list) => (
          <div className="mo-block-pricecards__plans mo-editor-inline-plans">
            <ul className={`mo-block-pricecards__plans-list mo-block-pricecards__plans-${Math.max(1, items.length)}`}>{list}</ul>
          </div>
        )}
        renderItem={({ item, index: i, here, next, field }) => {
          const card = item as PriceCardProps;
          const list = features(i);
          const button = ((card.buttons ?? []) as Button[])[0];
          const view = button ? buttonsOf([button], data)[0] : undefined;
          return (
            <SiteCard
              as="li"
              key={i}
              data-row={i}
              aria-current={here ? 'true' : undefined}
              aria-label={next ? texts.newCard : texts.cardOf(i + 1, items.length)}
              className={[
                card.featured === true ? 'mo-block-pricecards__plan mo-is-featured' : 'mo-block-pricecards__plan',
                'mo-editor-inline-list-row',
                here && 'mo-editor-inline-list-row-active',
                next && 'mo-editor-inline-list-row-next',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {here && !next && (
                <span className="mo-editor-inline-card-slots">
                  <InlineSlot
                    label={texts.featured}
                    pressed={card.featured === true}
                    onClick={() => put(i, { featured: card.featured === true ? undefined : true })}
                  >
                    <Icon name="star" size={24} />
                  </InlineSlot>
                </span>
              )}
              {card.featured === true && (here || card.badge?.trim()) && (
                <span className="mo-block-pricecards__plan-badge">{field('badge', texts.badge, texts.badge)}</span>
              )}
              <h3 className="mo-block-pricecards__plan-name">{field('name', texts.name, next ? texts.newCard : texts.name)}</h3>
              <p className="mo-block-pricecards__plan-price">
                <span className="mo-block-pricecards__plan-amount">{field('price', texts.price, texts.price)}</span>
                <span className="mo-block-pricecards__plan-unit">{field('unit', texts.unit, texts.unit)}</span>
              </p>
              <div className="mo-block-pricecards__plan-text">{field('text', texts.text, texts.text)}</div>
              {(list.length > 0 || here) && (
                <List dividers="none" className="mo-block-checklist mo-block-pricecards__plan-features mo-editor-inline-plan-features">
                  {list.map((text, j) => (
                    <ListItem
                      key={j}
                      leadingIcon="check"
                      headline={
                        <InlineField
                          name={`f${j}`}
                          value={text}
                          label={texts.feature}
                          placeholder={texts.newFeature}
                          onType={(v) =>
                            setFeatures(
                              i,
                              list.map((x, k) => (k === j ? v : x)),
                            )
                          }
                          onFocus={() => active !== i && onChange({ active: i })}
                          onKeys={(e) => featureKeys(i, j, e)}
                        />
                      }
                    />
                  ))}
                </List>
              )}
              {here && !next && (
                <SiteButton
                  kind="text"
                  data-add-feature=""
                  className="mo-editor-inline-list-add"
                  onClick={() => setFeatures(i, [...list, ''], `f${list.length}`)}
                >
                  {texts.addFeature}
                </SiteButton>
              )}
              {(button || (here && !next)) && (
                <div className="mo-block-buttons mo-block-pricecards__plan-buttons">
                  <span
                    className={[buttonClass(view?.kind), 'mo-editor-inline-button', !button && 'mo-editor-inline-button-faded']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {view?.icon && view.icon !== 'arrow_forward' && <Glyph icon={view.icon} size={20} />}
                    <InlineField
                      name="button"
                      value={button?.label ?? ''}
                      label={texts.button}
                      placeholder={view?.text || texts.newButton}
                      onType={(v) => setLabel(i, v)}
                      onFocus={() => active !== i && onChange({ active: i })}
                      onKeys={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                    />
                    {view?.icon === 'arrow_forward' && <Glyph icon={view.icon} size={18} className="mo-button__trailing-icon" />}
                  </span>
                  {here && button && onPick && (
                    <span onClickCapture={(e) => setMenu({ card: i, at: e.currentTarget })}>
                      <InlineSlot label={t.blocks.buttons.options} onClick={() => {}}>
                        <Icon name="more_vert" size={18} />
                      </InlineSlot>
                    </span>
                  )}
                </div>
              )}
            </SiteCard>
          );
        }}
      />
      {menu && onPick && (
        <ButtonMenu
          anchor={menu.at}
          button={((cards[menu.card]?.buttons ?? []) as Button[])[0] ?? {}}
          onChange={(patch) => changeButton(menu.card, patch)}
          onRemove={() => put(menu.card, { buttons: [] })}
          onPick={onPick}
          onIcon={() => pickIcon(menu.card)}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}
