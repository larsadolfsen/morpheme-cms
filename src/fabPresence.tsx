// Lets a screen know it shows a FAB: Screen (Screen.tsx) provides the context, FabMenu (ui.tsx) calls useRegisterFab while
// it is drawn. Exposes FabPresenceContext, useCountFabs and useRegisterFab. Used to leave room under the footer for the FAB
// only (useFooterClearance.ts).
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

/** Called with +1 when a FAB appears on the screen and -1 when it goes. Absent outside a Screen. */
export const FabPresenceContext = createContext<((change: 1 | -1) => void) | null>(null);

/** For a Screen: how many FABs its content shows, and the value for FabPresenceContext. */
export function useCountFabs() {
  const [count, setCount] = useState(0);
  const report = useCallback((change: 1 | -1) => setCount((n) => n + change), []);
  return { count, report };
}

/** For a FAB: tells its Screen it is there while `active`. */
export function useRegisterFab(active: boolean) {
  const report = useContext(FabPresenceContext);
  useEffect(() => {
    if (!active || !report) return;
    report(1);
    return () => report(-1);
  }, [active, report]);
}
