export * from './SideSheet.tsx';
export { default } from './SideSheet.tsx';
// What a modal side sheet (SideSheet.tsx with kind 'modal', in its <dialog> with sideSheetClass) does in a browser,
// for the script that shows it: sideSheet(dialog) gives it its open() and close(). Native <dialog>: focus moves into it
// and back, Escape closes it, and screen readers know it is modal. Motion: it slides in from the side of the screen it
// stands at and out again (a state transition), the scrim fading in with it (ui.css); with reduced motion it appears
// and disappears at once. Its close button, Escape and a tap on the scrim (outside it) close it; the page under it does
// not scroll while it is open. It moves with the site's motion scheme (motionSpring, @interstellarcms/cms/lib/motion.ts).
import { animate } from 'motion';
import { motionSpring } from '@interstellarcms/cms/lib/motion';

export type SideSheetControls = { open: () => void; close: () => Promise<void> };

export function sideSheet(sheet: HTMLDialogElement): SideSheetControls {
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

  sheet.querySelector('[data-side-sheet-close]')?.addEventListener('click', close);
  // Escape: slide out instead of the dialog's instant close.
  sheet.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  // A tap on the scrim (outside the sheet) closes it.
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) close();
  });

  return { open, close };
}
