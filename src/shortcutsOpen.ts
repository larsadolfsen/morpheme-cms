// Whether the Keyboard shortcuts list (ShortcutsSheet.tsx) is open, for it and the action that opens it (CommandPalette.tsx). Not remembered.
// Exposes openShortcuts, closeShortcuts, useShortcutsOpen. The value is an openFlag.mjs flag.
import { useSyncExternalStore } from 'react';
import { createFlag } from './openFlag.mjs';

const flag = createFlag();

export const openShortcuts = () => flag.set(true);
export const closeShortcuts = () => flag.set(false);

export const useShortcutsOpen = () => useSyncExternalStore(flag.subscribe, flag.get, () => false);
