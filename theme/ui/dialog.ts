// What a modal dialog (Dialog.tsx in its <dialog> with dialogModalClass, or a full-screen one's with
// dialogFullScreenModalClass) does in a browser, for the script that shows it (a block's or an app's): dialog(el)
// gives it its open() and close(). Native <dialog>: focus moves into it and back, Escape closes it, and screen readers
// know it is modal. Motion: it comes up a little as it opens (ui.css) and goes down and fades as it closes; with reduced
// motion it appears and disappears at once. Its close button (data-dialog-close: a full-screen one's cross, or a
// button among a basic one's actions) and Escape close it, and a tap on the scrim (outside it) closes a basic one (a
// full-screen one holds a task that is not done, so only its buttons close it); the page under it does not scroll
// while it is open. It moves with the site's motion scheme (motionSpring, @morpheme/cms/lib/motion.ts).
import { animate } from 'motion';
import { motionSpring } from '@morpheme/cms/lib/motion';

export type DialogControls = { open: () => void; close: () => Promise<void> };

export function dialog(el: HTMLDialogElement): DialogControls {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fullScreen = el.classList.contains('dialog-modal-full-screen');
  let closing = false;

  function open() {
    if (el.open) return;
    el.showModal();
    document.documentElement.style.overflow = 'hidden';
  }

  async function close() {
    if (!el.open || closing) return;
    closing = true;
    if (!reduce) await animate(el, { opacity: 0, y: 16 }, motionSpring('spatial', 'fast'));
    el.close();
    el.style.transform = '';
    el.style.opacity = '';
    document.documentElement.style.overflow = '';
    closing = false;
  }

  el.querySelectorAll('[data-dialog-close]').forEach((b) => b.addEventListener('click', close));
  // Escape: animate out instead of the dialog's instant close.
  el.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  // A tap on the scrim (outside the box) closes a basic dialog.
  el.addEventListener('click', (e) => {
    if (e.target === el && !fullScreen) close();
  });

  return { open, close };
}
