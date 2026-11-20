// What a modal dialog (Dialog.tsx in its <dialog> with dialogModalClass, or the lightbox's) does in a browser, for the script that shows it (a block's or an app's): dialog(el)
// gives it its open() and close(). Native <dialog>: focus moves into it (a basic dialog takes it itself, dialogFocus.ts: no control looks chosen; the lightbox's
// close button has it) and back, Escape closes it, and screen readers know it is modal. Motion: it comes up a little as it opens (ui.css) and goes down and fades as it closes; with reduced
// motion it appears and disappears at once. Its close button (data-dialog-close: the lightbox's cross, or a
// button among a basic one's actions) and Escape close it, and a tap on the scrim (outside it) closes a basic one (the
// lightbox is closed by its button and Escape only); the page under it does not scroll
// while it is open. It moves with the site's motion scheme (motionSpring, @morphemecms/cms/lib/motion.ts).
import { animate } from 'motion';
import { motionSpring } from '@morphemecms/cms/lib/motion';
import { openModal } from '@theme/ui/dialogFocus';
import { lightDismiss } from '@theme/ui/lightDismiss';

export type DialogControls = { open: () => void; close: () => Promise<void> };

export function dialog(el: HTMLDialogElement): DialogControls {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const holds = el.hasAttribute('data-lightbox');
  let closing = false;

  function open() {
    if (el.open) return;
    // A basic dialog opens with the focus on itself, not on a control; the lightbox keeps the browser's (its close button).
    if (holds) el.showModal();
    else openModal(el);
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
  // A tap on the scrim (outside the box) closes a basic dialog (light dismiss: lightDismiss.ts; its cancel is the hook above).
  if (!holds) lightDismiss(el, close);

  return { open, close };
}
