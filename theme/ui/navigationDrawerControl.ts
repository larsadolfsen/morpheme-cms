// What a navigation drawer (NavigationDrawer.tsx) does in a browser: the arrow keys, Home and End move the focus between
// its items and sub-items (not its toggles, which stay on Tab), and a modal one puts the focus on its first item when it
// opens. Exposes handleDrawerKey, navigationDrawerKeys and focusNavigationDrawerItem; where the focus goes is
// lib/drawerKeys.mjs (tested).
import { drawerKeyTarget } from '@morphemecms/cms/lib/drawerKeys.mjs';

const itemSelector = '.navigation-drawer-item, .navigation-drawer-subitem';

/** The items in the drawer that can be focused now, in the order they stand. */
const itemsOf = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(itemSelector)].filter(
    (item) => !item.hidden && !item.hasAttribute('disabled') && item.getClientRects().length > 0,
  );

/** Moves the focus for the arrow keys, Home and End when it is on an item of `root`. */
export function handleDrawerKey(event: KeyboardEvent, root: HTMLElement) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const items = itemsOf(root);
  const target = drawerKeyTarget(event.key, items.indexOf(document.activeElement as HTMLElement), items.length);
  if (target === null) return;
  event.preventDefault();
  items[target]?.focus();
}

/** Listens for the keys on `root` (a drawer drawn as a class on an element of its own: the site's menu); returns what removes it. */
export function navigationDrawerKeys(root: HTMLElement): () => void {
  const onKeyDown = (event: KeyboardEvent) => handleDrawerKey(event, root);
  root.addEventListener('keydown', onKeyDown);
  return () => root.removeEventListener('keydown', onKeyDown);
}

/** The focus on the drawer's first item (a modal one, when it opens). */
export function focusNavigationDrawerItem(root: HTMLElement) {
  itemsOf(root)[0]?.focus();
}
