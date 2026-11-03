// An icon button (m3.material.io/components/icon-buttons, .icon-button in ../styles/ui.css): only an icon (`icon`, its
// name in the theme's icons, or in the editor an icon already made), its name (`label`) read by screen readers. Its kind (`kind`: standard, the default, filled,
// tonal or outlined), its size (`size`: xsmall, small, the default, medium, large or xlarge), its width (`width`:
// narrow, default or wide) and its shape (`shape`: round, the default, or square) are Material's names; how each looks
// is the theme's. With `selected` (true or false) it is a toggle icon button, aria-pressed: the theme gives each kind its
// look off and on, and its corners turn square when it is on (round when it is square); what turns it on and off is the
// script of the block that shows it (or the editor), and its icon is drawn filled while it is on, where the site draws
// it filled. `badge`: the theme's Badge at its icon's corner, a number or a dot (true), which `label` should say too. With
// `href` it is a link (Link: on the site; in the editor only drawn; never a toggle), else a <button type="button">.
// Other attributes (data-…, disabled) go on it, and `className` after its own classes (its place). An Astro component
// without React gives an element the same classes with iconButtonClass, and a toggle aria-pressed itself.
import { Glyph, type IconRef } from '@morphemecms/cms/src/icon';
import Badge from '@theme/ui/Badge';
import { Link, type IconButtonKind } from '@morphemecms/cms/src/standard/view';
import { ToggleIcon, type ButtonShape, type ButtonSize } from '@theme/ui/Button';

export const iconButtonWidths = ['narrow', 'default', 'wide'] as const;
export type IconButtonWidth = (typeof iconButtonWidths)[number];

/** An icon button's classes: its kind's and, unless it is small, its size's, unless it is the default width, its
 * width's and, unless it is round, its shape's. */
export const iconButtonClass = (
  kind: IconButtonKind = 'standard',
  size: ButtonSize = 'small',
  width: IconButtonWidth = 'default',
  shape: ButtonShape = 'round',
) =>
  [
    'icon-button',
    `icon-button-${kind}`,
    size !== 'small' && `icon-button-${size}`,
    width !== 'default' && `icon-button-${width}`,
    shape !== 'round' && `icon-button-${shape}`,
  ]
    .filter(Boolean)
    .join(' ');

export default function IconButton({
  icon,
  label,
  kind,
  size,
  width,
  shape,
  selected,
  badge,
  href,
  className,
  ...rest
}: {
  icon: IconRef;
  label: string;
  kind?: IconButtonKind;
  size?: ButtonSize;
  width?: IconButtonWidth;
  shape?: ButtonShape;
  selected?: boolean;
  badge?: number | boolean;
  href?: string;
  className?: string;
} & Record<string, unknown>) {
  const classes = [iconButtonClass(kind, size, width, shape), className].filter(Boolean).join(' ');
  const toggle = selected !== undefined && href === undefined;
  const glyph =
    toggle && typeof icon === 'string' ? <ToggleIcon part="icon-button" name={icon} size={22} /> : <Glyph icon={icon} size={22} />;
  const button =
    href === undefined ? (
      <button type="button" aria-label={label} className={classes} aria-pressed={toggle ? selected : undefined} {...rest}>
        {glyph}
      </button>
    ) : (
      <Link href={href} aria-label={label} className={classes} {...rest}>
        {glyph}
      </Link>
    );
  if (!badge) return button;
  return <Badge count={badge === true ? undefined : badge}>{button}</Badge>;
}
