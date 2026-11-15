// The Keyboard shortcuts list (ShortcutsSheet.tsx): what it lists, and whether its dialog is open (a computer; on a phone it is a page, ShortcutsPage). The
// rows are taken when the action runs, while the text's and the block's actions are registered. Not remembered. Exposes openShortcuts,
// closeShortcuts, useShortcutsOpen, setShortcutRows, useShortcutRows. The open value is an openFlag.mjs flag.
import { useSyncExternalStore } from 'react';
import { createFlag } from './openFlag.mjs';

export type ShortcutRow = { id: string; label: string; key: string };

const flag = createFlag();
let rows: ShortcutRow[] = [];
const listeners = new Set<() => void>();

export const openShortcuts = () => flag.set(true);
export const closeShortcuts = () => flag.set(false);
export const useShortcutsOpen = () => useSyncExternalStore(flag.subscribe, flag.get, () => false);

export function setShortcutRows(next: ShortcutRow[]) {
  rows = next;
  listeners.forEach((l) => l());
}
export const useShortcutRows = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => void listeners.delete(l)),
    () => rows,
    () => rows,
  );
