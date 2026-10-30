// Whether the sidebar is open on a computer (App.tsx), closed and opened with the button at its top
// or, while it is closed, at the start of the top bar (Screen.tsx). Kept in this browser.
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
