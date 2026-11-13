// The Buttons block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, section 5): the buttons are drawn as the
// site draws them (the theme's button, of each button's kind and icon, in the theme's row) and each button's label is typed on the button
// itself. Where a button leads and its kind are not typed: they are in the button's settings (the toolbar's Link); its icon is picked in the icon slot the active button has. A block with no
// buttons of its own shows the default ones, as the site does; a tap on them starts its own first button. The parts, the keys and what is kept
// are InlineItems.tsx and src/inlineRows.mjs; `Add button`, the faded empty button and the dotted line are as in the List.
import { t } from './i18n';
import { Plus } from '@phosphor-icons/react';
import { Glyph } from './icon';
import InlineItems, { InlineSlot } from './InlineItems';
import type { InlineViewProps } from './inlineViews';
import Buttons from '@theme/blocks/buttons/Buttons';
import { buttonClass } from '@theme/ui/Button';
import { buttonsOf } from './standard/buttons/view';
import type { Button } from './standard/buttons/fields';

export default function InlineButtons({ items, data, active, focus, onChange, onIcon }: InlineViewProps) {
  const own = items as Button[];
  const shared = own.length === 0 ? buttonsOf(undefined, data) : [];
  return (
    <InlineItems
      items={items}
      active={active}
      focus={focus}
      fields={['label']}
      add={t.blocks.buttons.addButton}
      onChange={onChange}
      wrap={(list) => <div className="block-buttons inline-buttons">{list}</div>}
      renderItem={({ item, index: i, here, next, editing, field }) => {
        // No buttons of its own and not being typed in: the default buttons as the site draws them; a tap starts the first own one.
        if (next && !editing && shared.length > 0)
          return (
            <div
              key={i}
              className="inline-buttons-shared"
              onClick={() => onChange({ items: [{ label: '' }], active: 0, focus: { row: 0, field: 'label' } })}
            >
              <Buttons buttons={shared} />
            </div>
          );
        const b = buttonsOf([item as Button], data)[0];
        const icon = b?.icon;
        return (
          <span
            key={i}
            data-row={i}
            aria-current={here ? 'true' : undefined}
            aria-label={next ? t.blocks.buttons.newButton : t.blocks.buttons.buttonOf(i + 1, items.length)}
            className={[
              buttonClass(b?.kind),
              'inline-list-row',
              'inline-button',
              here && 'inline-list-row-active',
              next && 'inline-list-row-next',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {/* The active button has its icon slot, empty or not (its picker); the others their icon, as the site draws it. */}
            {here ? (
              <InlineSlot label={t.blocks.buttons.icon} onClick={() => onIcon(i)}>
                {icon ? <Glyph icon={icon} size={24} /> : <Plus size={24} />}
              </InlineSlot>
            ) : (
              icon && icon !== 'arrow-right' && <Glyph icon={icon} size={20} />
            )}
            {field('label', t.blocks.buttons.text, b?.text || t.blocks.buttons.newButton)}
            {!here && icon === 'arrow-right' && <Glyph icon={icon} size={18} className="button-trailing-icon" />}
          </span>
        );
      }}
    />
  );
}
