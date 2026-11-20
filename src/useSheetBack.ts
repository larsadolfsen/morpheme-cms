// Lets the phone's back gesture close a sheet (Notifications.tsx) instead of leaving the screen: while `open`, the sheet
// has a step of its own in the browser's history (the same address, so nothing else reacts), and going back from it calls
// `close`. Closing the sheet another way (its cross, Escape) takes that step back. A new address (a link in the sheet)
// leaves the step behind, as nav.ts does for the screens. Exposes useSheetBack(open, close, name). Thin wiring: no node test; checked by hand.
import { useEffect } from 'react';

const marked = (name: string) => (history.state as { sheet?: string } | null)?.sheet === name;

export function useSheetBack(open: boolean, close: () => void, name: string) {
  // A step the sheet left behind (the page was reloaded while it was open) is no longer the sheet's.
  useEffect(() => {
    if (marked(name)) history.replaceState({ ...history.state, sheet: undefined }, '');
  }, [name]);

  useEffect(() => {
    if (!open) return;
    history.pushState({ ...history.state, sheet: name }, '');
    const onPop = () => {
      if (!marked(name)) close();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (marked(name)) history.back();
    };
  }, [open, close, name]);
}
