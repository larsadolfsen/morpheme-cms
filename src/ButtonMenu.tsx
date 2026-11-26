// A button's menu, for every block that has buttons typed in place (the Buttons block, a card's action row): where it leads (a page, or one of the
// site's targets), its style and its icon, and Remove. It is the editor's Menu (ui.tsx) opened from the control on the button, so nothing is edited in a
// sheet of the button (owner, 22 Nov 2026, B5). A page, or what a target opens, is picked in the page sheet (`pick`), the icon in the icon picker
// (`icon`); both are the host's (MarkdownEditor.tsx).
import { useMemo } from 'react';
import { materialIcon } from './icon';
import { t } from './i18n';
import { Menu, MenuDivider, MenuItem } from './ui';
import { buttonList, type Button } from './standard/buttons/fields';
import type { Field } from './schema';

const field = (name: string) => buttonList.fields!.find((f) => f.name === name)!;

/** The button as the menu changes it: the values of the fields the menu sets (`to`, `href`, `open`, `kind`, `icon`). */
export type ButtonPatch = Partial<Pick<Button, 'to' | 'href' | 'open' | 'kind' | 'icon'>>;

export default function ButtonMenu({
  anchor,
  button,
  onChange,
  onRemove,
  onPick,
  onIcon,
  onClose,
}: {
  /** The control that opened it; null while it is closed. */
  anchor: HTMLElement | null;
  button: Button;
  onChange: (patch: ButtonPatch) => void;
  onRemove: () => void;
  /** Opens the page sheet for a relation field (a page, or what a target picks); the value picked, or null when it was closed. */
  onPick: (field: Field, value: string, title: string) => Promise<string | null>;
  /** Opens the icon picker for this button. */
  onIcon: () => void;
  onClose: () => void;
}) {
  const to = button.to ?? (field('to').default as string) ?? 'page';
  const targets = useMemo(() => (field('to').options ?? []).filter((o) => o.value !== 'page'), []);
  const kinds = field('kind').options ?? [];
  // A style the block does not offer any more (a saved `elevated`) is drawn as tonal, so it shows as tonal.
  const kind = kinds.some((k) => k.value === button.kind) ? button.kind : button.kind ? 'tonal' : 'filled';
  const page = async () => {
    onClose();
    const picked = await onPick(field('href'), button.href ?? '', t.blocks.buttons.href);
    if (picked !== null) onChange({ to: 'page', href: picked });
  };
  const target = async (value: string) => {
    onClose();
    const pick = buttonList.fields!.find((f) => f.name === 'open' && f.only?.is?.includes(value));
    if (!pick) return onChange({ to: value });
    const picked = await onPick(pick, button.open ?? '', pick.label);
    if (picked !== null) onChange({ to: value, open: picked });
  };
  return (
    <Menu popup="start" anchor={anchor} label={t.blocks.buttons.button} onClose={onClose}>
      <MenuItem icon={materialIcon('add_link')} selected={to === 'page'} onClick={() => void page()}>
        {t.blocks.buttons.menuPage}
      </MenuItem>
      {targets.map((o) => (
        <MenuItem key={o.value} icon={materialIcon('link')} selected={to === o.value} onClick={() => void target(o.value)}>
          {o.label}
        </MenuItem>
      ))}
      <MenuDivider />
      {kinds.map((k) => (
        <MenuItem
          key={k.value}
          icon={materialIcon('palette')}
          selected={kind === k.value}
          onClick={() => {
            onClose();
            onChange({ kind: k.value });
          }}
        >
          {`${t.blocks.buttons.menuStyle}: ${k.label}`}
        </MenuItem>
      ))}
      <MenuDivider />
      <MenuItem
        icon={materialIcon('shapes')}
        onClick={() => {
          onClose();
          onIcon();
        }}
      >
        {t.blocks.buttons.menuIcon}
      </MenuItem>
      <MenuItem
        icon={materialIcon('delete')}
        onClick={() => {
          onClose();
          onRemove();
        }}
      >
        {t.blocks.buttons.menuRemove}
      </MenuItem>
    </Menu>
  );
}
