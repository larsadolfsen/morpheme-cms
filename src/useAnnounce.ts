// Says a text to a screen reader through the editor's one announcer (lib/announce.ts) whenever it changes to something new: once per change, never on
// a re-render. `delay` waits that long first and says only the last text (the autosave's state: not on each keystroke). An empty or undefined text
// says nothing.
import { useEffect } from 'react';
import { announce } from '../lib/announce';

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
