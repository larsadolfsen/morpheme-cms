// The Buttons block typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md, section 5): the buttons are drawn as the
// site draws them (the theme's button, of each button's kind and icon, in the theme's row) and each button's label is typed on the button
// itself. Where a button leads and its kind are not typed: they are in the button's settings (the toolbar's Link); its icon is picked in the icon slot the active button has. A block with no
// buttons of its own shows the default ones, as the site does; a tap on them starts its own first button. The parts, the keys and what is kept
// are InlineItems.tsx and src/inlineRows.mjs; `Add button`, the faded empty button and the dotted line are as in the List.
import { useState } from 'react';
import { t } from './i18n';
import { Icon } from './icon';
import ButtonMenu, { type ButtonPatch } from './ButtonMenu';
import InlineItems, { InlineIcon, InlineSlot } from './InlineItems';
import type { InlineViewProps } from './inlineViews';
import Buttons from '@theme/blocks/buttons/Buttons';
import { buttonClass } from '@theme/ui/Button';
import { buttonsOf } from './standard/buttons/view';
import type { Button } from './standard/buttons/fields';

export default function InlineButtons({ items, data, active, focus, onChange, onIcon, onPick }: InlineViewProps) {
  const own = items as Button[];
  // The menu of the active button (its target, style, icon and Remove), opened from the control on the button.
  const [menu, setMenu] = useState<{ row: number; at: HTMLElement } | null>(null);
  const change = (row: number, patch: ButtonPatch) =>
    onChange({ items: items.map((r, j) => (j === row ? { ...r, ...patch } : r)), active: row, focus: null });
  const shared = own.length === 0 ? buttonsOf(undefined, data) : [];
  return (
    <>
      <InlineItems
        items={items}
        active={active}
        focus={focus}
        fields={['label']}
        add={t.blocks.buttons.addButton}
        onChange={onChange}
        wrap={(list) => <div className="mo-block-buttons mo-editor-inline-buttons">{list}</div>}
        renderItem={({ item, index: i, here, next, editing, field }) => {
          // No buttons of its own and not being typed in: the default buttons as the site draws them; a tap starts the first own one.
          if (next && !editing && shared.length > 0)
            return (
              <div
                key={i}
                className="mo-editor-inline-buttons-shared"
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
              role="group"
              // The button's target area is larger than its fields (editor.css, M3's 48 dp): a tap on it that no field got goes to the label.
              onPointerDown={(e) => {
                if (e.target !== e.currentTarget) return;
                e.preventDefault();
                e.currentTarget.querySelector<HTMLTextAreaElement>('[data-field="label"]')?.focus();
              }}
              aria-current={here ? 'true' : undefined}
              aria-label={next ? t.blocks.buttons.newButton : t.blocks.buttons.buttonOf(i + 1, items.length)}
              className={[
                buttonClass(b?.kind),
                'mo-editor-inline-list-row',
                'mo-editor-inline-button',
                here && 'mo-editor-inline-list-row-active',
                next && 'mo-editor-inline-list-row-next',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* The icon is the shared control: empty (a plus) while the button is active, and its icon, a tap on which opens the picker, on any button that has one. */}
              {(here || icon !== 'arrow_forward') && (
                <InlineIcon label={t.blocks.buttons.icon} icon={icon} here={here} size={here ? 24 : 20} onClick={() => onIcon(i)} />
              )}
              {field('label', t.blocks.buttons.text, b?.text || t.blocks.buttons.newButton)}
              {here && !next && onPick && (
                <span onClickCapture={(e) => setMenu({ row: i, at: e.currentTarget })}>
                  <InlineSlot label={t.blocks.buttons.options} onClick={() => {}}>
                    <Icon name="more_vert" size={18} />
                  </InlineSlot>
                </span>
              )}
              {!here && icon === 'arrow_forward' && (
                <InlineIcon label={t.blocks.buttons.icon} icon={icon} here={false} size={18} onClick={() => onIcon(i)} />
              )}
            </span>
          );
        }}
      />
      {menu && onPick && (
        <ButtonMenu
          anchor={menu.at}
          button={own[menu.row] ?? {}}
          onChange={(patch) => change(menu.row, patch)}
          onRemove={() => onChange({ items: items.filter((_, j) => j !== menu.row), active: Math.max(0, menu.row - 1), focus: null })}
          onPick={onPick}
          onIcon={() => onIcon(menu.row)}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}
