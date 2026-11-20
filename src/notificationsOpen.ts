// Whether the notifications' side sheet (Notifications.tsx) is open, for the sheet and the bell in the top bar that opens
// it (Screen.tsx NotificationsButton). Not remembered. Exposes openNotifications, closeNotifications, useNotificationsOpen.
// The value is an openFlag.mjs flag.
import { useSyncExternalStore } from 'react';
import { createFlag } from './openFlag.mjs';

const flag = createFlag();

export const openNotifications = () => flag.set(true);
export const closeNotifications = () => flag.set(false);

export const useNotificationsOpen = () => useSyncExternalStore(flag.subscribe, flag.get, () => false);
