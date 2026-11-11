// Whether the site is being updated after a save, for the start screen's sentence (StartSentence in FirstRun.tsx). App.tsx
// sets it from a save until the site has the commit (waitForSite) or the wait is given up. Exposes `setUpdating` and `useUpdating`.
import { useSyncExternalStore } from 'react';

let updating = false;
const listeners = new Set<() => void>();

// A wait that is given up without an answer (no version file) never says it is done, so "Updating…" ends by itself.
const GIVE_UP = 20 * 60 * 1000;
let timer: ReturnType<typeof setTimeout> | undefined;

export function setUpdating(on: boolean) {
  clearTimeout(timer);
  if (on) timer = setTimeout(() => setUpdating(false), GIVE_UP);
  if (on === updating) return;
  updating = on;
  listeners.forEach((l) => l());
}

export const useUpdating = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    () => updating,
  );
