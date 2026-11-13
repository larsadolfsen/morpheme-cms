// The Price cards block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, section 5): the cards are drawn as the
// site draws them (the theme's price cards, View.tsx) and each card's name, price, unit and text are typed where they stand. What is included
// is a checklist inside the card, with its own `Add feature`, and the card's button label is typed on the button. Whether the card is
// highlighted, its label and where its button leads are not typed: they are in the card's settings (the toolbar's Settings). A price list has
// at most four cards. The parts, the keys and what is kept are InlineItems.tsx and src/inlineRows.mjs; the empty, faded card, `Add price
// card` and the dotted line are as in the List.
import type { KeyboardEvent } from 'react';
import { t } from './i18n';
import { Glyph } from './icon';
import InlineItems, { InlineField, type Item } from './InlineItems';
import type { InlineViewProps } from './inlineViews';
import { headOf } from './standard/head';
import { buttonsOf } from './standard/buttons/view';
import { targets, type Button } from './standard/buttons/fields';
import type { PriceCardProps } from './standard/pricecards/view';
import BlockHead from '@theme/blocks/BlockHead';
import { SiteButton, SiteCard } from './themeUi';
import List, { ListItem } from '@theme/ui/List';
import { buttonClass } from '@theme/ui/Button';

const texts = t.blocks.pricecards;
export const maxCards = 4;

export default function InlinePriceCards({ items, props, data, active, focus, onChange }: InlineViewProps) {
  const cards = items as PriceCardProps[];
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
      <BlockHead view={headOf(props)} />
      <InlineItems
        items={items}
        active={active}
        focus={focus}
        fields={['name', 'price', 'unit', 'text']}
        add={texts.addCard}
        max={maxCards}
        onChange={onChange}
        wrap={(list) => (
          <div className="block-plans inline-plans">
            <ul className={`block-plans-list block-plans-${Math.max(1, items.length)}`}>{list}</ul>
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
                card.featured === true ? 'block-plan block-plan-featured' : 'block-plan',
                'inline-list-row',
                here && 'inline-list-row-active',
                next && 'inline-list-row-next',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {card.featured === true && card.badge?.trim() && <span className="block-plan-badge">{card.badge}</span>}
              <h3 className="block-plan-name">{field('name', texts.name, next ? texts.newCard : texts.name)}</h3>
              <p className="block-plan-price">
                <span className="block-plan-amount">{field('price', texts.price, texts.price)}</span>
                <span className="block-plan-unit">{field('unit', texts.unit, texts.unit)}</span>
              </p>
              <div className="block-plan-text">{field('text', texts.text, texts.text)}</div>
              {(list.length > 0 || here) && (
                <List dividers="none" className="block-checklist block-plan-features inline-plan-features">
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
                  className="inline-list-add"
                  onClick={() => setFeatures(i, [...list, ''], `f${list.length}`)}
                >
                  {texts.addFeature}
                </SiteButton>
              )}
              {(button || (here && !next)) && (
                <div className="block-buttons block-plan-buttons">
                  <span className={[buttonClass(view?.kind), 'inline-button', !button && 'inline-button-faded'].filter(Boolean).join(' ')}>
                    {view?.icon && view.icon !== 'arrow-right' && <Glyph icon={view.icon} size={20} />}
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
                    {view?.icon === 'arrow-right' && <Glyph icon={view.icon} size={18} className="button-trailing-icon" />}
                  </span>
                </div>
              )}
            </SiteCard>
          );
        }}
      />
    </>
  );
}
