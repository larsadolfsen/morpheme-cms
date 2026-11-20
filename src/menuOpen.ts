// Whether the main menu's drawer is open, for the drawer (MainMenu.tsx) and the menu buttons (Screen.tsx, the rail): at expanded
// and wider the standard drawer's remembered state (sidebar.ts), below it the modal drawer's, which is not remembered.
// Which one is on screen is lib/menu-layout.mjs. From expanded to below large the standard drawer yields to the rail while
// the standard side panel is open (drawerYield.mjs, sidePanel.ts); the remembered state does not change for that.
// Exposes useMenuOpen.
import { useCallback, useSyncExternalStore } from 'react';
import { setSidebar, useSidebar } from './sidebar';
import { drawerShown } from './drawerYield.mjs';
import { setDrawerReopened, useDrawerReopened, usePanelOpen } from './sidePanel';
import { useAtLeast, useMenuLayout } from './ui';

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
  const panel = usePanelOpen();
  const large = useAtLeast('large');
  const reopened = useDrawerReopened();
  const open = wide ? drawerShown(standard, panel, large, reopened) : modal;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!wide) return setModal(next);
      // While the drawer yields, opening it is for as long as the panel stays open; closing it is remembered.
      if (next && panel && !large) return setDrawerReopened(true);
      setDrawerReopened(false);
      setSidebar(next);
    },
    [wide, panel, large],
  );
  return { open, setOpen, toggle: () => setOpen(!open) };
}
