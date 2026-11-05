// What a side sheet (SideSheet.tsx) does in a browser, for the page script (sideSheet.script.ts) and the editor:
// sideSheet(dialog) for a modal one, standardSideSheet(aside) for a standard one; each gives its open() and close().
// Modal (<dialog> with sideSheetClass): native <dialog>, so focus moves into it and back, Escape closes it, and screen
// readers know it is modal. It slides in from the side of the screen it stands at and out again, the scrim fading in
// with it (ui.css); with reduced motion it appears and disappears at once. The page under it does not scroll while it is
// open. It moves with the site's motion scheme (motionSpring, @morphemecms/cms/lib/motion.ts).
// Standard (<aside>): not modal, the page stays usable. open() shows it and moves the focus into it; close() hides it and
// gives the focus back to what opened it. Both: the close button, Escape and (modal) a tap on the scrim ask
// `beforeClose` first, and stay open when it answers false. close() itself never asks.
import { animate } from 'motion';
import { motionSpring } from '@morphemecms/cms/lib/motion';

export type SideSheetOptions = {
  /** Called before a close by the X, Escape or the scrim. false (or a promise of false) keeps the sheet open. */
  beforeClose?: () => boolean | Promise<boolean>;
};
export type SideSheetControls = { open: (opener?: HTMLElement) => void; close: () => Promise<void> };

/** A close the owner asked for (the X, Escape, the scrim): one at a time, and only when beforeClose allows it. */
function asking(options: SideSheetOptions | undefined, close: () => Promise<void>) {
  let waiting = false;
  return async () => {
    if (waiting) return;
    waiting = true;
    try {
      if ((await options?.beforeClose?.()) === false) return;
      await close();
    } finally {
      waiting = false;
    }
  };
}

/** Modal side sheet: the <dialog> with sideSheetClass. */
export function sideSheet(sheet: HTMLDialogElement, options?: SideSheetOptions): SideSheetControls {
  const panel = sheet.querySelector<HTMLElement>('[data-side-sheet-container]')!;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Out past its own edge: to the right, or to the left in a language written from the right.
  const out = () => (getComputedStyle(sheet).direction === 'rtl' ? '-100%' : '100%');
  let closing = false;

  function open() {
    if (sheet.open) return;
    sheet.showModal();
    document.documentElement.style.overflow = 'hidden';
    if (!reduce) animate(panel, { x: [out(), '0%'] }, motionSpring('spatial'));
  }

  async function close() {
    if (!sheet.open || closing) return;
    closing = true;
    if (!reduce) await animate(panel, { x: out() }, motionSpring('spatial', 'fast'));
    sheet.close();
    panel.style.transform = '';
    document.documentElement.style.overflow = '';
    closing = false;
  }

  const ask = asking(options, close);
  sheet.querySelector('[data-side-sheet-close]')?.addEventListener('click', ask);
  // Escape: slide out instead of the dialog's instant close.
  sheet.addEventListener('cancel', (e) => {
    e.preventDefault();
    void ask();
  });
  // A tap on the scrim (outside the sheet) closes it.
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) void ask();
  });

  return { open, close };
}

const FOCUSABLE = ':is(input, textarea, select, button, a[href], [tabindex]:not([tabindex="-1"]))';

/** Standard side sheet: the <aside> of SideSheet kind 'standard', shown with open() and hidden with close(). */
export function standardSideSheet(sheet: HTMLElement, options?: SideSheetOptions): SideSheetControls {
  let opener: HTMLElement | undefined;
  let opened = false;

  function open(from?: HTMLElement) {
    if (opened) return;
    opened = true;
    opener = from;
    sheet.hidden = false;
    // What it shows first, else its close button.
    (
      sheet.querySelector<HTMLElement>(`.side-sheet-content ${FOCUSABLE}`) ?? sheet.querySelector<HTMLElement>('[data-side-sheet-close]')
    )?.focus();
  }

  async function close() {
    if (!opened) return;
    opened = false;
    sheet.hidden = true;
    if (opener?.isConnected) opener.focus();
    opener = undefined;
  }

  const ask = asking(options, close);
  sheet.querySelector('[data-side-sheet-close]')?.addEventListener('click', ask);
  // Escape from inside the sheet (not one meant for a dialog in it).
  sheet.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const dialog = (e.target as Element).closest('dialog');
    if (dialog && sheet.contains(dialog)) return;
    e.preventDefault();
    void ask();
  });

  return { open, close };
}
