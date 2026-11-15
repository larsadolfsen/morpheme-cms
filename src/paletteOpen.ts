// Whether the command palette (CommandPalette.tsx) is open, for it, the search button in the top bar (Screen.tsx SearchButton) and the key that
// opens it. Not remembered. Exposes openPalette, closePalette, togglePalette, usePaletteOpen. The value is an openFlag.mjs flag.
import { useSyncExternalStore } from 'react';
import { createFlag } from './openFlag.mjs';

const flag = createFlag();

export const openPalette = () => flag.set(true);
export const closePalette = () => flag.set(false);
export const togglePalette = () => flag.set(!flag.get());

export const usePaletteOpen = () => useSyncExternalStore(flag.subscribe, flag.get, () => false);
