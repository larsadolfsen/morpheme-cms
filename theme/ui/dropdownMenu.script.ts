// What a dropdown menu (DropdownMenu in Menu.tsx) does on the site, on top of what its popover does by itself (a tap on
// the button opens and closes it, Escape and a tap outside close it): WAI-ARIA's menu button (aria-expanded on the
// button; Enter, Space and the down arrow open it on its first item, the up arrow on its last). In the menu the arrow
// keys go between its items (round), Home and End to the first and the last, and a letter to the next item starting
// with it; the right arrow, Enter and Space open a submenu on its first item and the left arrow closes it again; Escape
// closes the menu it is in and goes back to what opened it, and Tab closes them all. The items are one stop for Tab
// (tabindex -1, so the focus moves with the keys). A submenu also opens when the mouse rests on its item. Choosing an
// item closes the menu and goes back to the button, ticking a menuitemcheckbox on or off and making a menuitemradio
// the chosen one of its group first. Where the browser has no CSS anchor positioning, it places each menu at what
// opened it. Run on every page by the theme's Base.astro (blockScripts, packages/editor/site/blockScripts.ts); without a dropdown menu
// on the page it does nothing.
const gap = 4;
const edge = 8;

// A menu's own items, not its submenus', that can be chosen.
const itemsOf = (menu: HTMLElement) =>
  [...menu.querySelectorAll<HTMLElement>('.menu-item')].filter(
    (i) => i.parentElement?.closest('.menu') === menu && !i.matches(':disabled, [aria-disabled="true"]'),
  );

// The menu an item opens.
const submenuOf = (item: Element) =>
  item.getAttribute('popovertarget') ? document.getElementById(item.getAttribute('popovertarget')!) : null;

/** Where a menu goes without anchor positioning (a fixed one, by its left and top): under the button (above it when
 * there is no room below), or beside its item (on the other side when there is no room); inside the screen. The
 * editor's menus (Menu in packages/editor/src/ui.tsx) are placed by it too. */
export function placeMenu(menu: HTMLElement, opener: HTMLElement, beside = false) {
  const at = opener.getBoundingClientRect();
  const { offsetWidth: w, offsetHeight: h } = menu;
  let left = beside ? at.right : at.left;
  let top = beside ? at.top : at.bottom + gap;
  if (left + w > innerWidth - edge) left = beside ? at.left - w : at.right - w;
  if (top + h > innerHeight - edge) top = beside ? at.bottom - h : at.top - gap - h;
  menu.style.left = `${Math.max(edge, left)}px`;
  menu.style.top = `${Math.max(edge, top)}px`;
}

export default function dropdownMenu() {
  const anchored = CSS.supports('position-area', 'block-end');
  document.querySelectorAll<HTMLElement>('[data-dropdown-menu]').forEach((root) => {
    const button = root.querySelector<HTMLElement>('[data-dropdown-menu-button]');
    const menu = root.querySelector<HTMLElement>('[data-dropdown-menu-menu]');
    if (!button || !menu?.popover) return;
    const menus = [menu, ...menu.querySelectorAll<HTMLElement>('.menu-submenu[popover]')];
    // Whether a menu that opens takes the focus to its first item (not a submenu the mouse opened, nor one a key
    // opened, which openOn gives the focus itself).
    let focusOnOpen: 'first' | null = 'first';
    let resting: number | undefined;
    const openers = new Map<HTMLElement, HTMLElement>();
    // Opens a menu (with a key) and puts the focus on its first or last item at once.
    const openOn = (m: HTMLElement, which: 'first' | 'last') => {
      focusOnOpen = null;
      if (!m.matches(':popover-open')) m.showPopover();
      focusOnOpen = 'first';
      const items = itemsOf(m);
      items[which === 'first' ? 0 : items.length - 1]?.focus();
    };

    for (const m of menus) {
      const opener = m === menu ? button : root.querySelector<HTMLElement>(`[popovertarget="${CSS.escape(m.id)}"]`);
      if (!opener) continue;
      openers.set(m, opener);
      opener.setAttribute('aria-expanded', 'false');
      itemsOf(m).forEach((i) => (i.tabIndex = -1));
      m.addEventListener('toggle', (e) => {
        const open = (e as ToggleEvent).newState === 'open';
        opener.setAttribute('aria-expanded', String(open));
        if (open) {
          if (!anchored) placeMenu(m, opener, m !== menu);
          const items = itemsOf(m);
          if (focusOnOpen && !m.contains(document.activeElement)) items[0]?.focus();
          focusOnOpen = 'first';
        } else if (m.contains(document.activeElement)) opener.focus();
      });
    }
    if (!anchored) {
      const replace = () => openers.forEach((opener, m) => m.matches(':popover-open') && placeMenu(m, opener, m !== menu));
      addEventListener('scroll', replace, { capture: true, passive: true });
      addEventListener('resize', replace, { passive: true });
    }

    button.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      openOn(menu, e.key === 'ArrowDown' ? 'first' : 'last');
    });

    menu.addEventListener('keydown', (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>('.menu-item');
      const m = item?.parentElement?.closest<HTMLElement>('.menu');
      if (!item || !m) return;
      const items = itemsOf(m);
      const at = items.indexOf(item);
      const sub = submenuOf(item);
      if (e.key === 'Tab') {
        menu.hidePopover();
        return;
      }
      if (e.key === 'ArrowRight' && sub) {
        e.preventDefault();
        openOn(sub, 'first');
        return;
      }
      if (e.key === 'ArrowLeft' && m !== menu) {
        e.preventDefault();
        m.hidePopover();
        return;
      }
      let to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1 }[e.key];
      // A letter: the next item whose label starts with it.
      if (to === undefined && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.trim()) {
        const key = e.key.toLocaleLowerCase();
        const starts = (i: HTMLElement) => i.querySelector('.menu-item-label')?.textContent?.trim().toLocaleLowerCase().startsWith(key);
        const next = [...items.slice(at + 1), ...items.slice(0, at + 1)].find(starts);
        if (next) to = items.indexOf(next);
      }
      if (to === undefined) return;
      e.preventDefault();
      items[(to + items.length) % items.length]?.focus();
    });

    // A choice: tick it, or make it the chosen one of its group, then close the menu (a link is followed).
    menu.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>('.menu-item');
      if (!item || submenuOf(item) || item.matches(':disabled, [aria-disabled="true"]')) return;
      const role = item.getAttribute('role');
      if (role === 'menuitemcheckbox') item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
      if (role === 'menuitemradio') {
        const group = item.closest('[role="group"], [role="menu"]');
        group?.querySelectorAll('[role="menuitemradio"]').forEach((r) => {
          if (r.closest('[role="group"], [role="menu"]') === group) r.setAttribute('aria-checked', String(r === item));
        });
      }
      menu.hidePopover();
      button.focus();
    });

    // The mouse resting on an item with a submenu opens it (without taking the focus); on another item of the same
    // menu, an open submenu there closes.
    menu.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const item = (e.target as HTMLElement).closest<HTMLElement>('.menu-item');
      const m = item?.parentElement?.closest<HTMLElement>('.menu');
      if (!item || !m) return;
      clearTimeout(resting);
      const sub = submenuOf(item);
      resting = window.setTimeout(() => {
        m.querySelectorAll<HTMLElement>('.menu-submenu:popover-open').forEach((s) => {
          if (s !== sub && s.parentElement?.closest('.menu') === m) s.hidePopover();
        });
        if (sub && !sub.matches(':popover-open') && !item.matches(':disabled')) {
          focusOnOpen = null;
          sub.showPopover();
        }
      }, 150);
    });
    menu.addEventListener('pointerleave', () => clearTimeout(resting));

    // The focus moving out of the button and its menus (a tap on something else that takes it) closes them.
    root.addEventListener('focusout', (e) => {
      const to = e.relatedTarget as Node | null;
      if (to && !root.contains(to) && menu.matches(':popover-open')) menu.hidePopover();
    });
  });
}
