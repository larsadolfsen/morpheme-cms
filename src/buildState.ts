// How far a save is on its way to the website: `publishing` from Save until the build is on the site, then `live` (shown for a
// moment) or `not-live` (the save is safe, the build failed or never included it; `buildUrl` is the build's page), else `idle`.
// Set by App.tsx save(); the Publish button of a form (FormFrame.tsx) shows `publishing` as its busy state (useBuildState), and
// BuildProgress.tsx shows the steps Saved → Publishing → Live, or Not live, with the theme's progress indicator.
import { useSyncExternalStore } from 'react';

export type BuildState = 'idle' | 'updating';
export type BuildProgress = { step: 'idle' | 'publishing' | 'live' } | { step: 'not-live'; buildUrl: string | null };

const IDLE: BuildProgress = { step: 'idle' };
let progress: BuildProgress = IDLE;
const listeners = new Set<() => void>();

function set(next: BuildProgress) {
  if (next.step === progress.step && (next.step !== 'not-live' || (progress as typeof next).buildUrl === next.buildUrl)) return;
  progress = next;
  listeners.forEach((l) => l());
}

/** `updating`: a save is being published; `idle`: nothing is. (`idle` also clears a result that is still shown.) */
export const setBuildState = (next: BuildState) => set(next === 'updating' ? { step: 'publishing' } : IDLE);
/** The save is on the site (`live`), or is not (`not-live`, with the page of the build that failed or null). */
export const setBuildResult = (online: boolean, buildUrl: string | null = null) =>
  set(online ? { step: 'live' } : { step: 'not-live', buildUrl });

const subscribe = (changed: () => void) => {
  listeners.add(changed);
  return () => listeners.delete(changed);
};

export const useBuildProgress = () =>
  useSyncExternalStore(
    subscribe,
    () => progress,
    () => IDLE,
  );

/** Only the Publish button's question: is the website being rebuilt right now. */
export const useBuildState = (): BuildState => (useBuildProgress().step === 'publishing' ? 'updating' : 'idle');
