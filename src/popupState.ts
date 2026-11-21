// A button that opens a dialog says whether it is open (WAI-ARIA: aria-haspopup with aria-expanded; WCAG 4.1.2). The editor has dozens of
// them (list rows, text-field buttons, icon buttons of the bars, carousel tiles) and each opens a <dialog> the browser keeps open, so the
// state is read once here from the dialog's `open` attribute, not by each opener: a button with aria-haspopup and no aria-expanded gets
// `false`, the button that was activated gets `true` while its dialog is open, and `false` again when it closes. A button that sets its own
// aria-expanded (a menu, the date picker) is left alone.
const OPENER = 'button[aria-haspopup]:not([aria-haspopup="false"]):not([aria-haspopup="menu"])';
const OWN = 'data-popup-state';

/** Starts the sync for the document; returns what stops it. */
export function trackPopupButtons(): () => void {
  const openers = new WeakMap<HTMLDialogElement, HTMLElement>();
  let last: HTMLElement | null = null;
  const fill = (node: ParentNode) => {
    for (const button of node.querySelectorAll<HTMLElement>(OPENER)) {
      if (button.hasAttribute('aria-expanded')) continue;
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute(OWN, '');
    }
  };
  const set = (button: HTMLElement | undefined | null, open: boolean) => {
    if (button?.isConnected && button.hasAttribute(OWN)) button.setAttribute('aria-expanded', String(open));
  };
  const click = (e: Event) => {
    const button = e.target instanceof Element ? e.target.closest<HTMLElement>(OPENER) : null;
    if (button) last = button;
  };
  const watch = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') {
        const dialog = record.target as HTMLDialogElement;
        if (dialog.tagName !== 'DIALOG') continue;
        if (dialog.hasAttribute('open')) {
          if (last) openers.set(dialog, last);
          set(last, true);
        } else {
          set(openers.get(dialog), false);
          openers.delete(dialog);
        }
        continue;
      }
      for (const added of record.addedNodes) {
        if (!(added instanceof Element)) continue;
        if (added.matches(OPENER) && !added.hasAttribute('aria-expanded')) fill(added.parentNode!);
        else fill(added);
      }
    }
  });
  fill(document);
  document.addEventListener('click', click, true);
  watch.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
  return () => {
    document.removeEventListener('click', click, true);
    watch.disconnect();
  };
}
