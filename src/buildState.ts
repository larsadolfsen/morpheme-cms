// Whether the website is being rebuilt after a Save: `updating` from Save until the build is on the site, else `idle`.
// Set by App.tsx save(); the Publish button of a form (FormFrame.tsx) shows it as its busy state. No message says it: a
// failure is the only one (App.tsx notify).
import { useSyncExternalStore } from 'react';

export type BuildState = 'idle' | 'updating';

let state: BuildState = 'idle';
const listeners = new Set<() => void>();

export function setBuildState(next: BuildState) {
  if (next === state) return;
  state = next;
  listeners.forEach((l) => l());
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
