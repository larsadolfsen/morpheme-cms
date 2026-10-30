// A chip (m3.material.io/components/chips, .chip in ../styles/ui.css): a short label (`label`), evt. an icon before it
// (`icon`), or a person's picture (`avatar`: its address, on an input chip) and one after it (`trailingIcon`). Its kind
// (`kind`) is Material's name; how each looks is the theme's: assist (the default: a link to something related, a post's
// tag), filter (one of a few that choose what is shown: `selected` is the chosen one, aria-pressed on a button,
// aria-current="page" on a link; it has a check before its label, which a theme shows on the chosen one or not), input
// (something entered, evt. selected and with a button after it that removes it, `removeLabel`, its name for screen
// readers, and what it does in the editor, `onRemove`) and suggestion (evt. selected). Assist, filter and suggestion chips can be `elevated` (with a shadow
// instead of the edge, on a picture or a colour). Its states: `selected`, `disabled` (it cannot be used: a button
// disabled, a link only shown) and `dragged` (while it is dragged to another place, with the shadow that lifts it).
// With `href` it is a link (Link: on the site; in the editor only drawn), with `plain` only shown (a tag without a
// page), else a <button type="button">; an input chip with `removeLabel` is the chip (a <span>) with its own button and
// the button that removes it. Other attributes (data-…, aria-…, onClick) go on the button or the link, and `className`
// after its own classes. The label is a prop, not children, so an Astro component shows it as it is (BlogIndex.astro).
import type { ReactNode } from 'react';
import { Glyph, Svg, type IconRef } from '@interstellarcms/cms/src/icon';
import { Link } from '@interstellarcms/cms/src/standard/view';

export type ChipKind = 'assist' | 'filter' | 'input' | 'suggestion';

/** The kinds of a chip, as Material 3 names them. */
export const chipKinds: ChipKind[] = ['assist', 'filter', 'input', 'suggestion'];

/** A chip's classes: its kind's, and evt. elevated (not an input chip), dragged, and with a button that removes it. */
export const chipClass = (kind: ChipKind = 'assist', { elevated = false, dragged = false, removable = false } = {}) =>
  ['chip', `chip-${kind}`, elevated && kind !== 'input' && 'chip-elevated', dragged && 'chip-dragged', removable && 'chip-removable']
    .filter(Boolean)
    .join(' ');

export default function Chip({
  label,
  kind = 'assist',
  selected,
  elevated,
  disabled,
  dragged,
  icon,
  avatar,
  trailingIcon,
  removeLabel,
  onRemove,
  href,
  plain,
  className,
  ...rest
}: {
  label: ReactNode;
  kind?: ChipKind;
  selected?: boolean;
  elevated?: boolean;
  disabled?: boolean;
  dragged?: boolean;
  icon?: IconRef;
  avatar?: string;
  trailingIcon?: IconRef;
  removeLabel?: string;
  onRemove?: () => void;
  href?: string;
  plain?: boolean;
  className?: string;
} & Record<string, unknown>) {
  const removable = kind === 'input' && Boolean(removeLabel);
  const classes = [chipClass(kind, { elevated, dragged, removable }), className].filter(Boolean).join(' ');
  // Chosen: a filter, an input or a suggestion chip that is a button (a filter chip that is a link: the open page).
  const pressed = kind === 'assist' ? undefined : kind === 'filter' ? Boolean(selected) : selected;
  const content = (
    <>
      {kind === 'filter' && <Svg name="check" size={18} className="chip-check" />}
      {avatar ? <img src={avatar} alt="" className="chip-avatar" /> : icon && <Glyph icon={icon} size={18} />}
      {label}
      {trailingIcon && !removable && <Glyph icon={trailingIcon} size={18} className="chip-trailing-icon" />}
    </>
  );
  if (removable)
    return (
      <span className={classes} data-selected={selected ? '' : undefined} aria-disabled={disabled || undefined}>
        <button type="button" className="chip-action" aria-pressed={pressed} disabled={disabled} {...rest}>
          {content}
        </button>
        <button type="button" className="chip-remove" aria-label={removeLabel} disabled={disabled} onClick={onRemove}>
          <Glyph icon={trailingIcon ?? 'x'} size={18} />
        </button>
      </span>
    );
  if (href !== undefined && !disabled)
    return (
      <Link href={href} className={classes} aria-current={selected ? 'page' : undefined} {...rest}>
        {content}
      </Link>
    );
  if (plain || href !== undefined)
    return (
      <span className={classes} aria-disabled={disabled || undefined} {...rest}>
        {content}
      </span>
    );
  return (
    <button type="button" className={classes} aria-pressed={pressed} disabled={disabled} {...rest}>
      {content}
    </button>
  );
}
