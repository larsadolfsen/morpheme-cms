// A navigation rail (m3.material.io/components/navigation-rail, M3 Expressive; .navigation-rail in ../styles/ui.css):
// the main destinations down the side of a larger screen (NavigationRail, a <nav> with its name, `label`), collapsed
// (each destination's icon over its label) or expanded (`expanded`: the icon and the label side by side), with its menu
// button at the top (`menuLabel`, which expands and collapses it: on the site navigationRail.script.ts) and evt. the
// screen's main action under it (`fab`: an extended FAB, ExtendedFab, with only its icon while the rail is collapsed).
// Material's two configurations of the expanded rail: its modality (`modality`: `standard`, the default, beside the
// content, which makes room for it, or `modal`, over the page with a scrim behind it, which closes it, as Escape does)
// and its behaviour (`expandedBehavior`: `collapse`, the default, back into the collapsed rail, or `hide`, nothing while
// it is collapsed; then a button elsewhere opens it: an icon button with data-navigation-rail-menu and aria-controls,
// the rail's id). Each destination (NavigationRailItem) has its icon, its label, `selected` (aria-current) when it is
// the open page, and evt. a badge on the icon (`badge`: true for a dot, else the number it shows; the theme's Badge) and,
// while the rail is expanded, a text at its end (`trailingSupporting`: how many there are). The destinations can stand in
// sections (NavigationRailSection, M3 Expressive's), each with its name over it while the rail is expanded and a line
// between them while it is collapsed. Evt. something under the menu button while the rail is expanded (`header`: the
// editor's logo and the site's name). With `onExpandedChange` the rail is expanded and collapsed by whoever draws it (the
// editor) instead of by its script; a modal one without `scrim` has none (one that expands while the mouse is over it:
// the editor's).
// Where it stands (beside the content, in a row) is the component's own; how it looks is the theme's. Links are Link (on
// the site; in the editor only drawn). An Astro component gives its elements the classes with navigationRailClass,
// navigationRailClasses and navigationRailItemClass.
import type { ReactNode } from 'react';
import { Glyph, Svg, type IconRef } from '@morphemecms/cms/src/icon';
import { Link } from '@morphemecms/cms/src/standard/view';
import { ExtendedFab } from '@theme/ui/Fab';
import { iconButtonClass } from '@theme/ui/IconButton';
import Badge from '@theme/ui/Badge';

export type NavigationRailModality = 'standard' | 'modal';
export type NavigationRailExpandedBehavior = 'collapse' | 'hide';

/** The rail's class, and a destination's. */
export const navigationRailClass = 'navigation-rail';
export const navigationRailItemClass = 'navigation-rail-item';

/** The rail's classes with its expanded modality and behaviour. */
export const navigationRailClasses = (
  modality: NavigationRailModality = 'standard',
  expandedBehavior: NavigationRailExpandedBehavior = 'collapse',
) =>
  [navigationRailClass, modality === 'modal' && 'navigation-rail-modal', expandedBehavior === 'hide' && 'navigation-rail-hide']
    .filter(Boolean)
    .join(' ');

/** The scrim's class, behind a modal rail while it is expanded. */
export const navigationRailScrimClass = 'navigation-rail-scrim';

export default function NavigationRail({
  label,
  menuLabel,
  expanded,
  modality = 'standard',
  expandedBehavior = 'collapse',
  fab,
  header,
  scrim = true,
  onExpandedChange,
  className,
  children,
  ...rest
}: {
  label: string;
  menuLabel: string;
  expanded?: boolean;
  modality?: NavigationRailModality;
  expandedBehavior?: NavigationRailExpandedBehavior;
  fab?: { icon: string; label: string; href?: string } & Record<string, unknown>;
  header?: ReactNode;
  scrim?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  const rail = (
    <nav
      aria-label={label}
      className={[navigationRailClasses(modality, expandedBehavior), className].filter(Boolean).join(' ')}
      data-navigation-rail=""
      data-expanded={expanded || undefined}
      {...rest}
    >
      <div className="navigation-rail-header">
        <button
          type="button"
          className={`${iconButtonClass('standard')} navigation-rail-menu`}
          aria-label={menuLabel}
          aria-expanded={!!expanded}
          data-navigation-rail-menu={onExpandedChange ? undefined : ''}
          onClick={onExpandedChange && (() => onExpandedChange(!expanded))}
        >
          <Svg name="list" size={24} />
          <Svg name="caret-left" size={24} />
        </button>
        {fab && <ExtendedFab {...fab} collapsed={!expanded} />}
        {header != null && <div className="navigation-rail-header-content">{header}</div>}
      </div>
      <div className="navigation-rail-items">{children}</div>
    </nav>
  );
  // A modal one's scrim just before it, over the page and under the rail (navigationRail.script.ts shows it).
  return modality === 'modal' && scrim ? (
    <>
      <div className={navigationRailScrimClass} data-navigation-rail-scrim="" hidden={!expanded} />
      {rail}
    </>
  ) : (
    rail
  );
}

/** Destinations under each other in a section, with its name (`label`) over them while the rail is expanded. */
export function NavigationRailSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="navigation-rail-section" role="group" aria-label={label}>
      <span className="navigation-rail-section-label" aria-hidden="true">
        {label}
      </span>
      {children}
    </div>
  );
}

/** A destination: its icon (a Phosphor name, the theme's icon, or an icon made: IconRef) and its label, `selected` when
 * it is the open page, evt. a badge on the icon, and a text at its end while the rail is expanded. */
export function NavigationRailItem({
  href,
  icon,
  label,
  selected,
  badge,
  trailingSupporting,
  ...rest
}: {
  href: string;
  icon: IconRef;
  label: ReactNode;
  selected?: boolean;
  badge?: true | number;
  trailingSupporting?: ReactNode;
} & Record<string, unknown>) {
  return (
    <Link href={href} className={navigationRailItemClass} aria-current={selected ? 'page' : undefined} {...rest}>
      <span className="navigation-rail-indicator">
        <span className="navigation-rail-icon">
          <Glyph icon={icon} size={24} />
          {badge !== undefined && <Badge count={badge === true ? undefined : badge} className="navigation-rail-badge" />}
        </span>
        <span className="navigation-rail-label">{label}</span>
        {trailingSupporting != null && trailingSupporting !== '' && (
          <span className="navigation-rail-trailing-supporting">{trailingSupporting}</span>
        )}
      </span>
    </Link>
  );
}
