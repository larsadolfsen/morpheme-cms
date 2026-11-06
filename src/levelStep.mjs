// The second level of the editor's modal main menu (MainMenu.tsx) as a step in the browser's history: while a section's
// list is shown in the modal drawer, the phone's back gesture (and the browser's back button) goes to the first level
// instead of to the screen before. The step has the same address and the same place as the screen's (history.state,
// nav.ts), so going back from it fires no hashchange and nav.ts never sees it. Leaving the level another way (the back
// row, Escape, the drawer closed) takes the step out again; a link in the drawer is followed once the step is out, so the
// history never keeps an empty step. Exposes levelStep. A window (the browser's; a fake one in the tests).

/**
 * Watches the window's history for the level's step. `set(active, toFirst)`: whether the level is shown (a step is added
 * while it is), and what the back gesture does on it (shows the first level). `stop()` takes the step out and stops.
 * @param {Pick<Window, 'history' | 'location' | 'addEventListener' | 'removeEventListener' | 'document'>} win
 */
export function levelStep(win) {
  let pushed = false;
  /** @type {string | null} A link's address, followed once the step is out. */
  let pending = null;
  let toFirst = () => {};

  const leave = () => {
    if (!pushed) return;
    pushed = false;
    win.history.back();
  };
  const onPop = () => {
    // Back from the step: the first level, on the same screen.
    if (pushed) {
      pushed = false;
      toFirst();
      return;
    }
    // The step taken out for a link: now the link.
    if (pending !== null) {
      const href = pending;
      pending = null;
      win.location.hash = href;
    }
  };
  /** @param {MouseEvent} e */
  const onClick = (e) => {
    if (!pushed || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = /** @type {Element | null} */ (e.target);
    const a = target?.closest?.('a[href^="#"]');
    if (!a || a.getAttribute('target')) return;
    e.preventDefault();
    pending = a.getAttribute('href');
    leave();
  };
  win.addEventListener('popstate', onPop);
  win.document.addEventListener('click', onClick, true);

  return {
    /** @param {boolean} active @param {() => void} back */
    set(active, back) {
      toFirst = back;
      if (active && !pushed) {
        win.history.pushState({ ...(win.history.state ?? {}), level: true }, '');
        pushed = true;
      } else if (!active) leave();
    },
    stop() {
      leave();
      win.removeEventListener('popstate', onPop);
      win.document.removeEventListener('click', onClick, true);
    },
  };
}
