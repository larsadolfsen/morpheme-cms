// A button (m3.material.io/components/buttons, .button in ../styles/ui.css): a label, an icon before it (`icon`) and
// evt. one after it (`trailingIcon`, the arrow; each its name, or in the editor an icon already made; its class button-trailing-icon, so a theme can hide or move it). Its
// kind (`kind`: filled, the default, tonal, elevated, outlined or text), its size (`size`: xsmall, small, medium, the
// default, large or xlarge) and its shape (`shape`: round, the default, or square) are Material's names; how each looks
// is the theme's. With `selected` (true or false) it is a toggle button, aria-pressed: the theme gives each kind its
// look off and on, and its corners turn square when it is on (round when it is square). A text button is never a toggle
// (Material). What turns it on and off is the script of the block that shows it. Its icon is then drawn filled while it
// is on, where the site draws the icon filled. With `href` it is a link (Link: on the site; in the editor only drawn;
// never a toggle), else a <button> (`type`, button by default). Other attributes (data-…, aria-…, disabled) go on it, and `className`
// after its own classes (its width). An Astro component without React gives an element the same classes with
// buttonClass, and a toggle aria-pressed itself.
import type { ReactNode } from 'react';
import { Glyph, Svg, iconFile, type IconRef } from '@morphemecms/cms/src/icon';
import { Link, type ButtonKind } from '@morphemecms/cms/src/standard/view';

export const buttonSizes = ['xsmall', 'small', 'medium', 'large', 'xlarge'] as const;
export type ButtonSize = (typeof buttonSizes)[number];
export const buttonShapes = ['round', 'square'] as const;
export type ButtonShape = (typeof buttonShapes)[number];

/** A button's classes: its kind's and, unless it is medium, its size's and, unless it is round, its shape's. */
export const buttonClass = (kind: ButtonKind = 'filled', size: ButtonSize = 'medium', shape: ButtonShape = 'round') =>
  ['button', `button-${kind}`, size !== 'medium' && `button-${size}`, shape !== 'round' && `button-${shape}`].filter(Boolean).join(' ');

/** A toggle's icon (a Button's, an IconButton's): the icon, and the same icon filled while it is on, where the site
 * draws it filled (the theme shows the one of the state it is in: .<part>-unselected-icon, .<part>-selected-icon). */
export function ToggleIcon({ part, name, size }: { part: 'button' | 'icon-button'; name: string; size: number }) {
  if (!iconFile(name, 'fill')) return <Svg name={name} size={size} />;
  return (
    <>
      <Svg name={name} size={size} className={`${part}-unselected-icon`} />
      <Svg name={name} weight="fill" size={size} className={`${part}-selected-icon`} />
    </>
  );
}

export default function Button({
  kind,
  size,
  shape,
  selected,
  icon,
  trailingIcon,
  href,
  type = 'button',
  className,
  children,
  ...rest
}: {
  kind?: ButtonKind;
  size?: ButtonSize;
  shape?: ButtonShape;
  selected?: boolean;
  icon?: IconRef;
  trailingIcon?: IconRef;
  href?: string;
  type?: 'button' | 'submit';
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  const classes = [buttonClass(kind, size, shape), className].filter(Boolean).join(' ');
  const toggle = selected !== undefined && href === undefined;
  const content = (
    <>
      {icon && (toggle && typeof icon === 'string' ? <ToggleIcon part="button" name={icon} size={20} /> : <Glyph icon={icon} size={20} />)}
      {children}
      {trailingIcon && <Glyph icon={trailingIcon} size={18} className="button-trailing-icon" />}
    </>
  );
  return href === undefined ? (
    <button type={type} className={classes} aria-pressed={toggle ? selected : undefined} {...rest}>
      {content}
    </button>
  ) : (
    <Link href={href} className={classes} {...rest}>
      {content}
    </Link>
  );
}
