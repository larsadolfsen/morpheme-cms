// Whether the standard navigation drawer is open (expanded and wider, MainDrawer in ui.tsx), opened and closed with the menu
// button at the top of the navigation rail and of the drawer (ui.tsx, through menuOpen.ts). Kept in this browser (`editor-sidebar`).
import { useSyncExternalStore } from 'react';

const KEY = 'editor-sidebar';
let open = (() => {
  try {
    return localStorage.getItem(KEY) !== 'closed';
  } catch {
    return true;
  }
})();
const listeners = new Set<() => void>();

export function setSidebar(next: boolean) {
  open = next;
  try {
    localStorage.setItem(KEY, next ? 'open' : 'closed');
  } catch {}
  listeners.forEach((l) => l());
}

export const useSidebar = () =>
  useSyncExternalStore(
    (changed) => {
      listeners.add(changed);
      return () => listeners.delete(changed);
    },
    () => open,
    () => true,
  );
