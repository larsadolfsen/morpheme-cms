// A navigation drawer (m3.material.io/components/navigation-drawer, .navigation-drawer in ../styles/ui.css), at the
// start edge (at the end edge with navigationDrawerEndClass; navigationDrawerBleedClass for one that springs in): the site's pages in a panel over the page (components/MobileMenu.tsx, and a theme's own menu), over its
// scrim (navigationDrawerScrimClass). Its pages are items (NavigationDrawerItem, `active`: the open page or the one
// holding it), an item with sub-pages is a row (NavigationDrawerRow) with the button that unfolds them after it
// (NavigationDrawerToggle, `expanded`), and a sub-page a subitem (NavigationDrawerSubitem). Where it comes from, how it
// moves and what else is in it (the logo, the buttons) is the menu's own: it gives its own element (a motion.div) the
// class with navigationDrawerClass; in a <dialog> (the editor's), the dialog has navigationDrawerDialogClass and its
// scrim is the dialog's. Its variant (variant): modal, the default, over its scrim, or standard, beside the content at
// full height without a scrim and without a shadow (navigationDrawerClasses gives the classes to an element of its own);
// where it stands is the component's own. Links are Link (on the site; in the editor's previews only drawn), an item
// without `href` a button (the editor's: a part of a form); other attributes (onClick, aria-…) go on them. An item has
// an icon before its label (icon: a Phosphor name, filled while it is active, or an icon made) and evt. a badge after
// the label (badge: how many there are, label large). The pages can stand in sections (NavigationDrawerSection, label:
// its name, title small), a full-width line (the theme's Divider) between them. The arrow keys, Home and End move
// between the items (NavigationDrawer does it itself; a drawer drawn as a class on an element of its own calls
// navigationDrawerKeys(root)), and a modal one gives its first item the focus when it opens
// (focusNavigationDrawerItem(root); navigationDrawerControl.ts). An item can end in an icon (trailing: an arrow to a list
// it opens), and a drawer in two levels has a back row (NavigationDrawerBack, an arrow and a label) at the top of the
// second level; it is a button, so the arrow keys reach it like an item.
import type { KeyboardEvent, ReactNode } from 'react';
import { Glyph, Svg, type IconRef } from '@morphemecms/cms/src/icon';
import { ToggleIcon } from '@theme/ui/Button';
import { Link } from '@morphemecms/cms/src/standard/view';
import Divider from '@theme/ui/Divider';
import { handleDrawerKey } from './navigationDrawerControl';
export { focusNavigationDrawerItem, navigationDrawerKeys } from './navigationDrawerControl';

export type NavigationDrawerVariant = 'modal' | 'standard';

/** The drawer's class, and its scrim's. */
export const navigationDrawerClass = 'navigation-drawer';
export const navigationDrawerScrimClass = 'navigation-drawer-scrim';
/** A modal drawer at the end edge of the screen (the right; the left in right-to-left languages): its corners mirrored. */
export const navigationDrawerEndClass = 'navigation-drawer-end';
/** A modal drawer that springs in, on the drawer or on the <dialog> it is in: a strip of it off the screen at its edge, so
 * an overshooting spring shows no gap. */
export const navigationDrawerBleedClass = 'navigation-drawer-bleed';
/** The class of a <dialog> the drawer is in: at the start of the screen, as high as it, over its scrim. */
export const navigationDrawerDialogClass = 'navigation-drawer-dialog';

/** The drawer's classes with its variant: `modal` (the default) over a scrim, `standard` beside the content, full height. */
export const navigationDrawerClasses = (variant: NavigationDrawerVariant = 'modal') =>
  [navigationDrawerClass, variant === 'standard' && 'navigation-drawer-standard'].filter(Boolean).join(' ');

export function NavigationDrawer({
  variant = 'modal',
  className,
  children,
  onKeyDown,
  ...rest
}: {
  variant?: NavigationDrawerVariant;
  className?: string;
  children: ReactNode;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
} & Record<string, unknown>) {
  return (
    <div
      className={[navigationDrawerClasses(variant), className].filter(Boolean).join(' ')}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) handleDrawerKey(event.nativeEvent, event.currentTarget);
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Items under each other in a section, with its name (`label`) over them. Between two sections stands a full-width
 * divider (drawn by the section that has one before it, shown by the theme), never between single items. */
export function NavigationDrawerSection({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="navigation-drawer-section" role={label ? 'group' : undefined} aria-label={label}>
      <Divider className="navigation-drawer-section-divider" />
      {label && (
        <span className="navigation-drawer-section-label" aria-hidden="true">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

/** The icon before an item's label: a Phosphor name is drawn outlined, and filled on the active item where the site draws
 * a filled one (ToggleIcon); an icon made is drawn as it is. */
function ItemIcon({ icon }: { icon: IconRef }) {
  return (
    <span className="navigation-drawer-icon">
      {typeof icon === 'string' ? <ToggleIcon part="navigation-drawer" name={icon} size={24} /> : <Glyph icon={icon} size={24} />}
    </span>
  );
}

/** A page in the drawer, `active` when it is the open page or holds it; without `href` a button. With an `icon` (24dp,
 * filled when it is active; Material: all items have one or none), evt. a badge (the text at its end: how many there
 * are) and evt. a `trailing` icon at the very end (24dp, outlined; an arrow to the list the item opens). */
export function NavigationDrawerItem({
  href,
  active,
  icon,
  badge,
  trailing,
  children,
  ...rest
}: {
  href?: string;
  active?: boolean;
  icon?: IconRef;
  badge?: ReactNode;
  trailing?: IconRef;
  children: ReactNode;
} & Record<string, unknown>) {
  const content = (
    <>
      {icon !== undefined && <ItemIcon icon={icon} />}
      <span className="navigation-drawer-label">{children}</span>
      {badge != null && badge !== '' && <span className="navigation-drawer-badge">{badge}</span>}
      {trailing !== undefined && (
        <span className="navigation-drawer-trailing">
          {typeof trailing === 'string' ? <Svg name={trailing} size={24} /> : <Glyph icon={trailing} size={24} />}
        </span>
      )}
    </>
  );
  return href === undefined ? (
    <button type="button" className="navigation-drawer-item" data-active={active || undefined} {...rest}>
      {content}
    </button>
  ) : (
    <Link href={href} className="navigation-drawer-item" data-active={active || undefined} {...rest}>
      {content}
    </Link>
  );
}

/** The back row at the top of a drawer's second level: an `arrow-left` and the `label` (the first level's name). A
 * button; `onClick` shows the first level. */
export function NavigationDrawerBack({ label, ...rest }: { label: string } & Record<string, unknown>) {
  return (
    <button type="button" className="navigation-drawer-item navigation-drawer-back" {...rest}>
      <span className="navigation-drawer-icon">
        <Svg name="arrow-left" size={24} />
      </span>
      <span className="navigation-drawer-label">{label}</span>
    </button>
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
