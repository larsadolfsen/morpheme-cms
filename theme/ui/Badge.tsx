// A badge (m3.material.io/components/badges, .badge in ../styles/ui.css): a small dot (without `count`: something new)
// or a number (`count`, more than `max` shown as "999+"), on what it is about (`children`: an icon or an icon button,
// at its top end corner, .badge-anchor) or by itself after a label (a navigation drawer's item). The badge is only seen:
// what it says is read by screen readers from `label` (e.g. "3 nye beskeder"), or, on an icon button, from the button's
// own name, which should say it. How it looks is the theme's (--badge-*). An Astro component gives an element the same
// classes with badgeClass.
import type { ReactNode } from 'react';

/** A badge's classes: the small dot, or the large one with a number. */
export const badgeClass = (large: boolean) => `badge ${large ? 'badge-large' : 'badge-small'}`;

export default function Badge({
  count,
  max = 999,
  label,
  className,
  children,
  ...rest
}: {
  count?: number;
  max?: number;
  label?: string;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const large = count !== undefined;
  const badge = (
    <span className={[badgeClass(large), className].filter(Boolean).join(' ')} aria-hidden="true" {...rest}>
      {large && (count > max ? `${max}+` : count)}
    </span>
  );
  const read = label && <span className="badge-label">{label}</span>;
  return children === undefined ? (
    <>
      {badge}
      {read}
    </>
  ) : (
    <span className="badge-anchor">
      {children}
      {badge}
      {read}
    </span>
  );
}
