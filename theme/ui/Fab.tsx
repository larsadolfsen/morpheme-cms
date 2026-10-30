// FABs (m3.material.io/components/floating-action-button and …/extended-fab, .fab and .extended-fab in
// ../styles/ui.css): the screen's main action, an icon (Fab, its name read by screen readers) or an icon and its label
// (ExtendedFab, only the icon while `collapsed`, data-collapsed: while the page scrolls down). Its size (`size`) and its
// colour (`kind`) are Material 3 Expressive's: a FAB is `fab` (the default), `medium` or `large` (the small FAB is
// deprecated), an extended FAB `small` (the default), `medium` or `large`, each with its own type style; the colours are
// the filled `primary` (the accent, the default), `secondary` and `tertiary`, and the tonal `primary-container`,
// `secondary-container` and `tertiary-container`, from the site's colours of those names (surface FABs are
// deprecated). How it looks is the theme's. Where it stands (fixed at the bottom of the screen, or in a menu) is the
// component's own. With `href` it is a link (Link), else a <button type="button">; other attributes (data-…) go on it,
// and `className` after its own classes. An Astro component gives an element the same classes with fabClass and
// extendedFabClass.
import type { ReactNode } from 'react';
import { Glyph, type IconRef } from '@interstellarcms/cms/src/icon';
import { Link } from '@interstellarcms/cms/src/standard/view';

export const fabKinds = ['primary', 'secondary', 'tertiary', 'primary-container', 'secondary-container', 'tertiary-container'] as const;
export type FabKind = (typeof fabKinds)[number];
export const fabSizes = ['fab', 'medium', 'large'] as const;
export type FabSize = (typeof fabSizes)[number];
export const extendedFabSizes = ['small', 'medium', 'large'] as const;
export type ExtendedFabSize = (typeof extendedFabSizes)[number];

/** A FAB's classes, and an extended FAB's: its kind, and its size when it is not the default. */
export const fabClass = (kind: FabKind = 'primary', size: FabSize = 'fab') => `fab fab-${kind}${size === 'fab' ? '' : ` fab-${size}`}`;
export const extendedFabClass = (kind: FabKind = 'primary', size: ExtendedFabSize = 'small') =>
  `extended-fab fab-${kind}${size === 'small' ? '' : ` extended-fab-${size}`}`;

// A link or a button with these classes.
function Action({
  href,
  className,
  children,
  ...rest
}: { href?: string; className: string; children: ReactNode } & Record<string, unknown>) {
  return href === undefined ? (
    <button type="button" className={className} {...rest}>
      {children}
    </button>
  ) : (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}

export function Fab({
  icon,
  label,
  kind,
  size,
  className,
  ...rest
}: { icon: IconRef; label: string; kind?: FabKind; size?: FabSize; href?: string; className?: string } & Record<string, unknown>) {
  return (
    <Action className={[fabClass(kind, size), className].filter(Boolean).join(' ')} aria-label={label} {...rest}>
      <Glyph icon={icon} size={24} />
    </Action>
  );
}

export function ExtendedFab({
  icon,
  label,
  kind,
  size,
  collapsed,
  className,
  ...rest
}: {
  icon: IconRef;
  label: string;
  kind?: FabKind;
  size?: ExtendedFabSize;
  collapsed?: boolean;
  href?: string;
  className?: string;
} & Record<string, unknown>) {
  return (
    <Action
      className={[extendedFabClass(kind, size), className].filter(Boolean).join(' ')}
      data-collapsed={collapsed || undefined}
      {...rest}
    >
      <Glyph icon={icon} size={24} />
      <span className="extended-fab-label">{label}</span>
    </Action>
  );
}
