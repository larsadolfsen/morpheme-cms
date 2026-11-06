// Whether the notifications' side sheet (Notifications.tsx) is open, for the sheet and the bell in the top bar that opens
// it (Screen.tsx NotificationsButton). Not remembered. Exposes openNotifications, closeNotifications, useNotificationsOpen.
import { useSyncExternalStore } from 'react';

let open = false;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (open === next) return;
  open = next;
  listeners.forEach((l) => l());
}

export const openNotifications = () => set(true);
export const closeNotifications = () => set(false);

export const useNotificationsOpen = () =>
  useSyncExternalStore(
    (changed) => {
      listeners.add(changed);
      return () => listeners.delete(changed);
    },
    () => open,
    () => false,
  );
