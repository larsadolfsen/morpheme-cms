// A split button (m3.material.io/components/split-button, .split-button in ../styles/ui.css): the main action (the
// theme's Button: `label`, evt. `icon`, with `href` a link) and joined to it a button with an arrow (its name
// `menuLabel`, read by screen readers) that opens a menu with the other ways to do it, the theme's Menu with its
// MenuItems (`children`). Its kind (`kind`: filled, the default, tonal, elevated or outlined) and its size (`size`:
// xsmall, small, medium, the default, large or xlarge) are the Button's, and so is its look, with the corners between
// the two small (larger with the size); the arrow's button is as wide as the button is high, and fully round while its
// menu is open (aria-expanded). `open` draws it open (the editor). On the site ui/splitButton.script.ts opens and closes the
// menu. Other attributes (data-…) go on the main action, and `className` on the whole.
import { useId, type ReactNode } from 'react';
import { Svg } from '@interstellarcms/cms/src/icon';
import type { ButtonKind } from '@interstellarcms/cms/src/standard/view';
import Button, { buttonClass, type ButtonSize } from '@theme/ui/Button';
import { Menu } from '@theme/ui/Menu';

export type SplitButtonKind = Exclude<ButtonKind, 'text'>;
export const splitButtonKinds: SplitButtonKind[] = ['filled', 'tonal', 'elevated', 'outlined'];

/** A split button's class (the whole: its main action and its arrow have the Button's classes). */
export const splitButtonClass = 'split-button';

export default function SplitButton({
  kind = 'filled',
  size,
  icon,
  label,
  href,
  menuLabel,
  open,
  disabled,
  className,
  children,
  ...rest
}: {
  kind?: SplitButtonKind;
  size?: ButtonSize;
  icon?: string;
  label: string;
  href?: string;
  menuLabel: string;
  open?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  const menu = useId();
  return (
    <div className={[splitButtonClass, className].filter(Boolean).join(' ')} data-split-button="">
      <Button kind={kind} size={size} icon={icon} href={href} disabled={disabled} className="split-button-leading" {...rest}>
        {label}
      </Button>
      <button
        type="button"
        className={`${buttonClass(kind, size)} split-button-trailing`}
        aria-label={menuLabel}
        aria-expanded={Boolean(open)}
        aria-controls={menu}
        disabled={disabled}
        data-split-button-toggle=""
      >
        <Svg name="caret-down" size={20} className="split-button-arrow" />
      </button>
      <Menu id={menu} className="split-button-menu" aria-label={menuLabel} hidden={!open} data-split-button-menu="">
        {children}
      </Menu>
    </div>
  );
}
