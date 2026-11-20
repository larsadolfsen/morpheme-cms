// Lets a screen know it shows a FAB: Screen (Screen.tsx) provides the context, FabMenu (ui.tsx) calls useRegisterFab while
// it is drawn. Exposes FabPresenceContext, useCountFabs, useRegisterFab and useFabLift. Used to leave room above the footer
// for the FAB only and to lift the FAB above the footer (Screen.tsx).
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fabLift } from './fabLift.mjs';

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

/** For a Screen with a FAB: sets --mo-comp-editor-fab-lift on the page to how far the footer stands up into the window, so the FAB
 * (editor.css .mo-editor-fab) stands above the footer while it is in view and at its place otherwise. Follows the scroll, the
 * window's size and the footer's own height (its status dot loads late). */
export function useFabLift(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const footer = () => document.querySelector('.mo-editor-footer');
    const update = () =>
      root.style.setProperty('--mo-comp-editor-fab-lift', `${fabLift(footer()?.getBoundingClientRect().top, window.innerHeight)}px`);
    update();
    const sizes = new ResizeObserver(update);
    const el = footer();
    if (el) sizes.observe(el);
    sizes.observe(document.body);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      sizes.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      root.style.removeProperty('--mo-comp-editor-fab-lift');
    };
  }, [active]);
}
