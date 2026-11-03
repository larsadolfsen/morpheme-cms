// A navigation bar (m3.material.io/components/navigation-bar, .navigation-bar in ../styles/ui.css): the few main
// destinations side by side at the bottom of a phone's screen (NavigationBar, a <nav> with its name, `label`), each
// (NavigationBarItem) with its icon and its label, the open one (`selected`, aria-current) with the indicator behind its
// icon, and evt. a badge on the icon (`badge`: true for a dot, else the number it shows; the theme's Badge). Where the
// icon stands (`iconPosition`) is M3 Expressive's item configuration: `top`, the default, over the label (vertical
// items, each as wide as the others), `start` beside it (horizontal items, as wide as their content, together in the
// middle of the bar, the indicator behind both), or `auto`: over it while the bar is narrower than 600px (a phone) and
// beside it from there (a tablet and wider), as Material recommends. Where it stands (fixed at the bottom of the screen)
// is the component's own; how it looks is the theme's. Links are Link (on the site; in the editor only drawn); other
// attributes go on them. An Astro component gives its elements the classes with navigationBarClass,
// navigationBarClasses and navigationBarItemClass.
import type { ReactNode } from 'react';
import { Svg } from '@morpheme/cms/src/icon';
import { Link } from '@morpheme/cms/src/standard/view';
import Badge from '@theme/ui/Badge';

export type NavigationBarIconPosition = 'top' | 'start' | 'auto';

/** The bar's class, and a destination's. */
export const navigationBarClass = 'navigation-bar';
export const navigationBarItemClass = 'navigation-bar-item';

/** The bar's classes with where its items' icons stand. */
export const navigationBarClasses = (iconPosition: NavigationBarIconPosition = 'top') =>
  iconPosition === 'top' ? navigationBarClass : `${navigationBarClass} navigation-bar-${iconPosition}`;

export default function NavigationBar({
  label,
  iconPosition,
  className,
  children,
  ...rest
}: { label: string; iconPosition?: NavigationBarIconPosition; className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <nav aria-label={label} className={[navigationBarClasses(iconPosition), className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </nav>
  );
}

/** A destination: its icon (a Phosphor name, the theme's icon) and its label, `selected` when it is the open page,
 * and evt. a badge on the icon. */
export function NavigationBarItem({
  href,
  icon,
  label,
  selected,
  badge,
  ...rest
}: { href: string; icon: string; label: ReactNode; selected?: boolean; badge?: true | number } & Record<string, unknown>) {
  return (
    <Link href={href} className={navigationBarItemClass} aria-current={selected ? 'page' : undefined} {...rest}>
      <span className="navigation-bar-indicator">
        <span className="navigation-bar-icon">
          <Svg name={icon} size={24} />
          {badge !== undefined && <Badge count={badge === true ? undefined : badge} className="navigation-bar-badge" />}
        </span>
        <span className="navigation-bar-label">{label}</span>
      </span>
    </Link>
  );
}
