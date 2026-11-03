// A menu (m3.material.io/components/menus, .menu in ../styles/ui.css): choices on a surface (Menu, a <ul>), each a menu
// item (MenuItem, .menu-item). The header's pages under an item (components/Header.astro, and a theme's own header)
// and a split button's other ways (SplitButton.tsx) are menus of links; an Astro header gives its elements the classes
// with menuClass and menuItemClass. A menu's colour (`color`: standard, the default, on the surface; vibrant, in the
// accent) and its groups (MenuGroup, evt. with a name over them; `groups`: each group on its own surface with a gap
// between them, the default, or one surface with a divider between them) are Material's (M3 Expressive); a divider
// between items is MenuDivider (the theme's Divider). An item is a link (`href`; Link: on the site, in the editor only
// drawn) or an action (a <button>; the rest, data-… and `onClick`, on it), with its icon (`icon`), a line under its
// label (`supporting`), a shortcut or a value at its end (`trailingSupporting`) and an icon there (`trailingIcon`); an
// icon is its name, or an icon made (IconRef: the editor's).
// `selected`: the open page (a link) or the chosen one of a few (an action); `checked`: an action that is on or off,
// with the theme's tick (`check`) before it when it is on; `disabled`: it cannot be chosen. With `submenu` (its items)
// the item opens another menu beside it, with an arrow (`open`: drawn open, the editor).
//
// A dropdown menu (DropdownMenu) is a menu a button opens on the site: the theme's Button (`label`, `icon`, `kind`,
// `size`, with an arrow) or IconButton (`iconButton`: only the icon, `label` its name), and the menu, a WAI-ARIA
// menu (role="menu", its items menuitem, menuitemcheckbox or menuitemradio). It opens as a popover (popovertarget), so
// it opens, closes with Escape and a tap outside, and stands over everything also without JavaScript; it is placed at
// the button with CSS anchor positioning. On the site ui/dropdownMenu.script.ts gives it the keyboard of WAI-ARIA's
// menu button (the arrow keys, Home, End, a letter, Escape, Tab, and the arrow keys into and out of a submenu), places
// it where anchor positioning is missing, opens a submenu when the mouse rests on its item, and ticks and chooses
// items. `open` draws it open (the editor). How all of it looks is the theme's.
import { createContext, useContext, useId, type CSSProperties, type ReactNode } from 'react';
import { Glyph, Svg, type IconRef } from '@morphemecms/cms/src/icon';
import { Link, type ButtonKind } from '@morphemecms/cms/src/standard/view';
import Button, { type ButtonSize } from '@theme/ui/Button';
import IconButton from '@theme/ui/IconButton';
import Divider from '@theme/ui/Divider';

/** A menu's colours, and how its groups stand apart, as Material 3 names them. */
export type MenuColor = 'standard' | 'vibrant';
export type MenuGroups = 'gap' | 'divider';

/** A menu's class, and its items'. */
export const menuClass = 'menu';
export const menuItemClass = 'menu-item';

/** A menu's classes: its colour's (none for standard) and, with groups divided by a line, `menu-groups-divider`. */
export const menuClasses = (color: MenuColor = 'standard', groups: MenuGroups = 'gap') =>
  [menuClass, color === 'vibrant' && 'menu-vibrant', groups === 'divider' && 'menu-groups-divider'].filter(Boolean).join(' ');

// Inside a WAI-ARIA menu (a dropdown menu and its submenus) the items are menu items; elsewhere (the header's pages, a
// split button's ways) links and buttons in a list.
const InMenu = createContext(false);

// A CSS anchor's name from an id React made (only letters, digits, - and _).
const anchorOf = (id: string) => `--menu-${id.replace(/[^\w-]/g, '')}`;

export function Menu({
  color,
  groups,
  className,
  children,
  ...rest
}: { color?: MenuColor; groups?: MenuGroups; className?: string; children: ReactNode } & Record<string, unknown>) {
  const inMenu = useContext(InMenu) || rest.role === 'menu';
  return (
    <InMenu.Provider value={inMenu}>
      <ul className={[menuClasses(color, groups), className].filter(Boolean).join(' ')} {...rest}>
        {children}
      </ul>
    </InMenu.Provider>
  );
}

/** A group of a menu's items, evt. under its name (`label`): its own surface, or after a divider (Menu's `groups`). */
export function MenuGroup({ label, children }: { label?: string; children: ReactNode }) {
  const inMenu = useContext(InMenu);
  const id = useId();
  return (
    <li className="menu-group" role={inMenu ? 'none' : undefined}>
      {label && (
        // In a menu the group is named by it, and only the group is read.
        <span id={id} className="menu-group-label" aria-hidden={inMenu || undefined}>
          {label}
        </span>
      )}
      <ul className="menu-group-items" role={inMenu ? 'group' : undefined} aria-labelledby={label ? id : undefined}>
        {children}
      </ul>
    </li>
  );
}

/** A line between a menu's items (the theme's Divider). */
export function MenuDivider() {
  return (
    <li className="menu-divider" role="none">
      <Divider />
    </li>
  );
}

export function MenuItem({
  href,
  selected,
  checked,
  disabled,
  icon,
  trailingIcon,
  supporting,
  trailingSupporting,
  submenu,
  open,
  children,
  ...rest
}: {
  href?: string;
  selected?: boolean;
  checked?: boolean;
  disabled?: boolean;
  icon?: IconRef;
  trailingIcon?: IconRef;
  supporting?: ReactNode;
  trailingSupporting?: ReactNode;
  submenu?: ReactNode;
  open?: boolean;
  children: ReactNode;
} & Record<string, unknown>) {
  const inMenu = useContext(InMenu);
  const id = useId();
  const action = href === undefined || submenu !== undefined;
  // Its role in a menu, and what it says of its state: a link the open page, an action ticked or chosen.
  const role = !inMenu
    ? undefined
    : submenu === undefined && checked !== undefined
      ? 'menuitemcheckbox'
      : submenu === undefined && action && selected !== undefined
        ? 'menuitemradio'
        : 'menuitem';
  const state =
    role === 'menuitemcheckbox'
      ? { 'aria-checked': checked }
      : role === 'menuitemradio'
        ? { 'aria-checked': Boolean(selected) }
        : !inMenu && action && checked !== undefined
          ? { 'aria-pressed': checked }
          : selected
            ? { 'aria-current': action ? ('true' as const) : ('page' as const) }
            : {};
  const content = (
    <>
      {(icon || checked !== undefined) && (
        <span className="menu-item-leading">
          {icon && <Glyph icon={icon} size={20} className="menu-item-icon" />}
          {checked !== undefined && <Svg name="check" size={20} className="menu-item-check" />}
        </span>
      )}
      <span className="menu-item-text">
        <span className="menu-item-label">{children}</span>
        {supporting != null && supporting !== '' && <span className="menu-item-supporting">{supporting}</span>}
      </span>
      {trailingSupporting != null && trailingSupporting !== '' && (
        <span className="menu-item-trailing-supporting">{trailingSupporting}</span>
      )}
      {trailingIcon && <Glyph icon={trailingIcon} size={20} className="menu-item-trailing-icon" />}
      {submenu !== undefined && <Svg name="caret-right" size={20} className="menu-item-trailing-icon menu-item-submenu-icon" />}
    </>
  );

  if (submenu !== undefined) {
    const menu = `${id}-menu`;
    const anchor = anchorOf(id);
    return (
      <li className="menu-item-submenu" role={inMenu ? 'none' : undefined}>
        <button
          type="button"
          id={id}
          className={menuItemClass}
          role={role}
          aria-haspopup={inMenu ? 'menu' : undefined}
          aria-expanded={open ? true : undefined}
          aria-controls={menu}
          popoverTarget={open ? undefined : menu}
          disabled={disabled}
          style={{ anchorName: anchor } as CSSProperties}
          {...rest}
        >
          {content}
        </button>
        <ul
          id={menu}
          className={`${menuClass} menu-submenu`}
          role={inMenu ? 'menu' : undefined}
          aria-labelledby={id}
          popover={open ? undefined : 'auto'}
          style={{ positionAnchor: anchor } as CSSProperties}
        >
          {submenu}
        </ul>
      </li>
    );
  }
  return (
    <li role={inMenu ? 'none' : undefined}>
      {!action && !disabled ? (
        <Link href={href!} className={menuItemClass} role={role} {...state} {...rest}>
          {content}
        </Link>
      ) : !action ? (
        // A link that cannot be followed: no address, so it is no link.
        <a className={menuItemClass} role={role} aria-disabled="true" {...state}>
          {content}
        </a>
      ) : (
        <button type="button" className={menuItemClass} role={role} disabled={disabled} {...state} {...rest}>
          {content}
        </button>
      )}
    </li>
  );
}

/** A menu a button opens (see the top of the file): the button (`label`, evt. `icon`, `kind` outlined by default,
 * `size`; `iconButton`: only the icon) and its items (`children`: MenuItem, MenuGroup, MenuDivider). `className` on
 * the whole, the rest on the button. */
export function DropdownMenu({
  label,
  icon,
  iconButton,
  kind = 'outlined',
  size,
  color,
  groups,
  open,
  className,
  children,
  ...rest
}: {
  label: string;
  icon?: string;
  iconButton?: boolean;
  kind?: ButtonKind;
  size?: ButtonSize;
  color?: MenuColor;
  groups?: MenuGroups;
  open?: boolean;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  const id = useId();
  const menu = `${id}-menu`;
  const anchor = anchorOf(id);
  const button = {
    id,
    'aria-haspopup': 'menu',
    'aria-expanded': open ? true : undefined,
    'aria-controls': menu,
    popoverTarget: open ? undefined : menu,
    style: { anchorName: anchor } as CSSProperties,
    'data-dropdown-menu-button': '',
    ...rest,
  };
  return (
    <div className={['dropdown-menu', className].filter(Boolean).join(' ')} data-dropdown-menu="">
      {iconButton ? (
        <IconButton icon={icon ?? 'list'} label={label} {...button} />
      ) : (
        <Button kind={kind} size={size} icon={icon} trailingIcon="caret-down" {...button}>
          {label}
        </Button>
      )}
      <Menu
        id={menu}
        role="menu"
        aria-labelledby={id}
        color={color}
        groups={groups}
        className="dropdown-menu-menu"
        popover={open ? undefined : 'auto'}
        style={{ positionAnchor: anchor } as CSSProperties}
        data-dropdown-menu-menu=""
      >
        {children}
      </Menu>
    </div>
  );
}
