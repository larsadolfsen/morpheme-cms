// A FAB menu (m3.material.io/components/fab-menu, .fab-menu in ../styles/ui.css): the theme's FAB (its classes,
// fabClass: `icon`, its name `label`, its size `size`, any of the FAB sizes, and its colour `fabKind`, any of the FAB
// colours, the menu's `kind` filled if it has none) that opens two to six related actions above it (`items`, each the
// theme's ExtendedFab: its icon and label, with `href` a link), the last nearest the FAB. The menu comes in Material's
// three colour sets (`kind`: primary, the default, secondary or tertiary): while it is open (aria-expanded) the FAB is a
// round close button with a cross (its name `closeLabel`) in the set's filled colour, and the actions are in its
// container colour, so they stand apart from it. Where it stands (fixed at the bottom of the screen) is the component's
// (`className`). `open` draws it open (the editor). On the site ui/fabMenu.script.ts opens and closes it. Other
// attributes (data-…) go on the whole.
import { useId } from 'react';
import { Svg } from '@morphemecms/cms/src/icon';
import { ExtendedFab, fabClass, type FabKind, type FabSize } from '@theme/ui/Fab';

export type FabMenuItem = { icon: string; label: string; href?: string } & Record<string, unknown>;
export const fabMenuKinds = ['primary', 'secondary', 'tertiary'] as const;
export type FabMenuKind = (typeof fabMenuKinds)[number];

/** A FAB menu's classes (the whole, with its colour set: its FAB and its actions have the FABs' classes). */
export const fabMenuClass = (kind: FabMenuKind = 'primary') => `fab-menu fab-menu-${kind}`;

export default function FabMenu({
  icon,
  label,
  closeLabel,
  items,
  kind = 'primary',
  fabKind,
  size,
  open,
  className,
  ...rest
}: {
  icon: string;
  label: string;
  closeLabel: string;
  items: FabMenuItem[];
  kind?: FabMenuKind;
  fabKind?: FabKind;
  size?: FabSize;
  open?: boolean;
  className?: string;
} & Record<string, unknown>) {
  const list = useId();
  return (
    <div className={[fabMenuClass(kind), className].filter(Boolean).join(' ')} data-fab-menu="" {...rest}>
      <button
        type="button"
        className={`${fabClass(fabKind ?? kind, size)} fab-menu-button`}
        aria-label={open ? closeLabel : label}
        aria-expanded={Boolean(open)}
        aria-controls={list}
        data-label={label}
        data-close-label={closeLabel}
      >
        <Svg name={icon} size={24} className="fab-menu-icon" />
        <Svg name="x" size={24} className="fab-menu-close-icon" />
      </button>
      <ul id={list} className="fab-menu-list" aria-label={label} hidden={!open}>
        {items.map(({ icon: glyph, label: name, ...item }) => (
          <li key={name}>
            <ExtendedFab icon={glyph} label={name} kind={`${kind}-container`} className="fab-menu-item" {...item} />
          </li>
        ))}
      </ul>
    </div>
  );
}
