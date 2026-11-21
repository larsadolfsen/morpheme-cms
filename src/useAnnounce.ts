// Says a text to a screen reader through the editor's one announcer (lib/announce.ts) whenever it changes to something new: once per change, never on
// a re-render. `delay` waits that long first and says only the last text (the autosave's state: not on each keystroke). An empty or undefined text
// says nothing.
import { useEffect } from 'react';
import { announce, progressStep } from '../lib/announce';
import { t } from './i18n';

/** Draws nothing; says its text when it comes into the page (a notice, a loading line): for a place a hook can not be put before an early return. */
export function Announce({ text, urgent }: { text: string; urgent?: boolean }) {
  useAnnounce(text, { urgent });
  return null;
}

export function useAnnounce(text: string | undefined, { urgent = false, delay = 0 }: { urgent?: boolean; delay?: number } = {}) {
  useEffect(() => {
    if (!text) return;
    if (!delay) return announce(text, { urgent });
    const timer = setTimeout(() => announce(text, { urgent }), delay);
    return () => clearTimeout(timer);
  }, [text]);
}

/** A load shorter than this is not announced (a flash of "Loading" and "Loaded" is noise). */
export const LOADING_DELAY_MS = 400;

/**
 * Announces a long load through the announcer: `text` (what is loading) once, when it has lasted `LOADING_DELAY_MS`, and `Loaded` when it ends. `aria-busy` on the
 * element is a state, never the announcement. When the load ends in a problem (an alert is on the screen) `Loaded` is not said: the problem says itself.
 */
export function useLoadAnnounce(text: string) {
  useEffect(() => {
    let said = false;
    const timer = setTimeout(() => {
      said = true;
      announce(text);
    }, LOADING_DELAY_MS);
    return () => {
      clearTimeout(timer);
      if (!said) return;
      setTimeout(() => {
        if (document.querySelector('[role=alert]:not([data-announcer] *)')) return;
        announce(t.common.loaded);
      }, 0);
    };
  }, [text]);
}

/** Draws nothing; announces a load while it is in the page (see `useLoadAnnounce`). */
export function LoadAnnounce({ text }: { text: string }) {
  useLoadAnnounce(text);
  return null;
}

/** Announces a determinate progress (`value`, 0 to 1) at every 25 %, `label` and the percent, never at each percent. */
export function useProgressAnnounce(value: number | undefined, label: string) {
  const step = value === undefined ? undefined : progressStep(value);
  useEffect(() => {
    if (step === undefined || step === 0) return;
    announce(t.common.progressAt(label, step));
  }, [step]);
}
