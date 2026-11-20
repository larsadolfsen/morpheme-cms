// Whether the standard side panel (BlockDialog's standard side sheet) is open, and whether the menu button reopened the drawer
// while it is. Not remembered. Exposes setPanelOpen, setDrawerReopened, usePanelOpen, useDrawerReopened; read by menuOpen.ts.
import { useSyncExternalStore } from 'react';

let panelOpen = false;
let reopened = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (changed: () => void) => {
  listeners.add(changed);
  return () => listeners.delete(changed);
};

/** The panel opens or closes; closing ends a reopening of the drawer. */
export function setPanelOpen(next: boolean) {
  panelOpen = next;
  if (!next) reopened = false;
  notify();
}

export function setDrawerReopened(next: boolean) {
  reopened = next;
  notify();
}

export const usePanelOpen = () =>
  useSyncExternalStore(
    subscribe,
    () => panelOpen,
    () => false,
  );

export const useDrawerReopened = () =>
  useSyncExternalStore(
    subscribe,
    () => reopened,
    () => false,
  );
