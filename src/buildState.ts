// Whether the website is being rebuilt after a Save: `updating` from Save until the build is on the site, then `live`
// for a while, then `idle`. Set by App.tsx save(), shown by BuildChip in the top bar (Screen.tsx).
import { useSyncExternalStore } from 'react';

export type BuildState = 'idle' | 'updating' | 'live' | 'failed';

let state: BuildState = 'idle';
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

export function setBuildState(next: BuildState) {
  clearTimeout(timer);
  state = next;
  listeners.forEach((l) => l());
  // `Live` is a confirmation, not a status: it goes away by itself.
  if (next === 'live' || next === 'failed') timer = setTimeout(() => setBuildState('idle'), next === 'live' ? 8000 : 20000);
}

export const useBuildState = () =>
  useSyncExternalStore(
    (changed) => {
      listeners.add(changed);
      return () => listeners.delete(changed);
    },
    () => state,
    () => 'idle' as BuildState,
  );
