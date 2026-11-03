// A modal navigation drawer (m3.material.io/components/navigation-drawer, .navigation-drawer in ../styles/ui.css): the
// site's pages in a panel over the page (components/MobileMenu.tsx, and a theme's own menu), over its scrim
// (navigationDrawerScrimClass). Its pages are items (NavigationDrawerItem, `active`: the open page or the one holding
// it), an item with sub-pages is a row (NavigationDrawerRow) with the button that unfolds them after it
// (NavigationDrawerToggle, `expanded`), and a sub-page a subitem (NavigationDrawerSubitem). Where it comes from, how it
// moves and what else is in it (the logo, the buttons) is the menu's own: it gives its own element (a motion.div) the
// class with navigationDrawerClass; in a <dialog> (the editor's), the dialog has navigationDrawerDialogClass and its
// scrim is the dialog's. Links are Link (on the site; in the editor's previews only drawn), an item without `href` a
// button (the editor's: a part of a form); other attributes (onClick, aria-…) go on them.
import type { ReactNode } from 'react';
import { Svg } from '@morphemecms/cms/src/icon';
import { Link } from '@morphemecms/cms/src/standard/view';

/** The drawer's class, and its scrim's. */
export const navigationDrawerClass = 'navigation-drawer';
export const navigationDrawerScrimClass = 'navigation-drawer-scrim';
/** The class of a <dialog> the drawer is in: at the end of the screen, as high as it, over its scrim. */
export const navigationDrawerDialogClass = 'navigation-drawer-dialog';

export function NavigationDrawer({ className, children, ...rest }: { className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <div className={[navigationDrawerClass, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}

/** A page in the drawer, `active` when it is the open page or holds it; without `href` a button. */
export function NavigationDrawerItem({
  href,
  active,
  children,
  ...rest
}: { href?: string; active?: boolean; children: ReactNode } & Record<string, unknown>) {
  return href === undefined ? (
    <button type="button" className="navigation-drawer-item" data-active={active || undefined} {...rest}>
      {children}
    </button>
  ) : (
    <Link href={href} className="navigation-drawer-item" data-active={active || undefined} {...rest}>
      {children}
    </Link>
  );
}

/** An item and what stands after it (the toggle of its sub-pages). */
export function NavigationDrawerRow({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <div className={['navigation-drawer-row', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}

/** The button that unfolds an item's sub-pages: a caret, turned while they are open (`expanded`). */
export function NavigationDrawerToggle({ label, expanded, ...rest }: { label: string; expanded: boolean } & Record<string, unknown>) {
  return (
    <button type="button" className="navigation-drawer-toggle" aria-expanded={expanded} aria-label={label} {...rest}>
      <Svg name="caret-down" size={20} />
    </button>
  );
}

/** A sub-page, `active` when it is the open page. */
export function NavigationDrawerSubitem({
  href,
  active,
  children,
  ...rest
}: { href: string; active?: boolean; children: ReactNode } & Record<string, unknown>) {
  return (
    <Link href={href} className="navigation-drawer-subitem" data-active={active || undefined} {...rest}>
      {children}
    </Link>
  );
}
