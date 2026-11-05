// Whether the main menu's drawer is open, for the drawer (MainMenu.tsx) and the menu buttons (Screen.tsx, the rail): at expanded
// and wider the standard drawer's remembered state (sidebar.ts), below it the modal drawer's, which is not remembered.
// Which one is on screen is lib/menu-layout.mjs. Exposes useMenuOpen.
import { useCallback, useSyncExternalStore } from 'react';
import { setSidebar, useSidebar } from './sidebar';
import { useMenuLayout } from './ui';

let modalOpen = false;
const listeners = new Set<() => void>();

function setModal(next: boolean) {
  modalOpen = next;
  listeners.forEach((l) => l());
}

const useModalOpen = () =>
  useSyncExternalStore(
    (changed) => {
      listeners.add(changed);
      return () => listeners.delete(changed);
    },
    () => modalOpen,
    () => false,
  );

/** The menu's open state for the drawer that is on screen now, and how to change it. */
export function useMenuOpen() {
  const wide = useMenuLayout().expanded === 'standard';
  const standard = useSidebar();
  const modal = useModalOpen();
  const open = wide ? standard : modal;
  const setOpen = useCallback((next: boolean) => (wide ? setSidebar(next) : setModal(next)), [wide]);
  return { open, setOpen, toggle: () => setOpen(!open) };
}
