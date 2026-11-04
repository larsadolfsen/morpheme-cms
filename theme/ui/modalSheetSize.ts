// How high a modal bottom sheet is on a phone and how it is pulled (bottomSheet() in bottomSheetControl.ts uses it):
// modalSheetSize(dialog, panel, close) opens it at its start height (BottomSheet's `startAt`, data-start on the container,
// 'half' without it: modalStartHeight in lib/sheet-stops.mjs), lets it be pulled by its handle, its header or its content,
// and gives it up to close() when it is let go low enough (modalRestAfterDrag). While it is managed the container has
// data-sized, data-full at full height and data-moving while it is pulled or moves (ui.css): the content scrolls, and a
// frame in it takes touches, only at full height; below that a touch on the content pulls the sheet. At full height the
// content pulls the sheet only when it is scrolled to the top and moves down. Touch only for the content (a mouse has no
// scrolling to tell apart); pointer events for the handle and the header. The editor's sheets (bottom-sheet-fit and
// bottom-sheet-full on the dialog) and the medium breakpoint upwards are left alone. The height follows the site's
// motion scheme (motionSpring); with reduced motion it changes at once. Its window and media query listeners remove
// themselves once the dialog is no longer in the page.
import { animate } from 'motion';
import { atLeast } from '@morphemecms/cms/lib/breakpoints.mjs';
import { motionSpring } from '@morphemecms/cms/lib/motion';
import { modalRestAfterDrag, modalStartHeight } from '@morphemecms/cms/lib/sheet-stops.mjs';

export type ModalSheetSize = {
  /** Whether it manages the sheet now: not the editor's sheets, and not from the medium breakpoint. */
  managed: () => boolean;
  /** Called when the dialog has been opened: measures and gives it its start height. */
  open: () => void;
  /** Called when it is closed: back to what ui.css says. */
  reset: () => void;
};

export function modalSheetSize(dialog: HTMLDialogElement, panel: HTMLElement, close: () => void): ModalSheetSize {
  const content = panel.querySelector<HTMLElement>('.bottom-sheet-content');
  const handle = panel.querySelector<HTMLElement>('[data-bottom-sheet-handle]');
  const header = panel.querySelector<HTMLElement>('.bottom-sheet-header');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = matchMedia(atLeast('medium'));
  // The editor's sheets keep the heights their classes give them.
  const own = dialog.classList.contains('bottom-sheet-fit') || dialog.classList.contains('bottom-sheet-full');
  const managed = () => !own && !wide.matches;

  let sizes: { start: number; full: number } | undefined;
  let anim: { stop: () => void } | undefined;
  // Bumped whenever something takes over, so a finished animation does not settle over it.
  let run = 0;

  // The start and the full height: what is in it (a frame fills the sheet, so it counts as unlimited), the screen's
  // height and --bottom-sheet-top-gap.
  function measure() {
    const was = { height: dialog.style.height, maxHeight: dialog.style.maxHeight };
    dialog.style.height = 'auto';
    dialog.style.maxHeight = 'none';
    const natural = content?.querySelector('iframe') ? Infinity : panel.offsetHeight;
    dialog.style.height = was.height;
    dialog.style.maxHeight = was.maxHeight;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;height:var(--bottom-sheet-top-gap, 4.5rem)';
    dialog.append(probe);
    const topGap = probe.offsetHeight;
    probe.remove();
    const startAt = panel.dataset.start === 'full' ? 'full' : 'half';
    const full = modalStartHeight(natural, innerHeight, 'full', topGap);
    return { start: Math.min(full, modalStartHeight(natural, innerHeight, startAt, topGap)), full };
  }

  // The sheet is this high now (and data-full says whether that is full height).
  function settle(px: number) {
    dialog.style.height = `${px}px`;
    panel.toggleAttribute('data-full', !!sizes && px >= sizes.full - 1);
    delete panel.dataset.moving;
  }

  async function go(px: number) {
    const id = ++run;
    anim?.stop();
    const from = dialog.offsetHeight;
    if (reduce || from === px) return settle(px);
    panel.dataset.moving = '';
    const animation = animate(dialog, { height: [from, px] }, motionSpring('spatial'));
    anim = animation;
    try {
      await animation;
    } catch {
      return;
    }
    if (id === run) settle(px);
  }

  function open() {
    if (!managed()) return;
    sizes = measure();
    panel.setAttribute('data-sized', '');
    run++;
    settle(sizes.start);
  }

  function reset() {
    run++;
    anim?.stop();
    drag = pending = undefined;
    sizes = undefined;
    for (const name of ['data-sized', 'data-full', 'data-moving']) panel.removeAttribute(name);
    dialog.style.height = '';
    panel.style.transform = '';
  }

  // Pulling: from `h`, the height it had when the pull began, `raw` is where the finger would take it; between the start
  // and the full height the height follows, below the start the sheet slides down instead (so the content keeps its
  // layout), and above full it stays.
  let pending: { y: number } | undefined;
  let drag: { y: number; h: number; raw: number; last: { y: number; t: number }; v: number } | undefined;

  function begin(y: number, t: number) {
    run++;
    anim?.stop();
    drag = { y, h: dialog.offsetHeight, raw: dialog.offsetHeight, last: { y, t }, v: 0 };
    pending = undefined;
    panel.removeAttribute('data-full');
    panel.dataset.moving = '';
  }

  function move(y: number, t: number) {
    if (!drag || !sizes) return;
    drag.raw = Math.min(sizes.full, drag.h - (y - drag.y));
    const low = Math.min(sizes.start, drag.h);
    dialog.style.height = `${Math.max(low, drag.raw)}px`;
    panel.style.transform = drag.raw < low ? `translateY(${low - drag.raw}px)` : '';
    const dt = t - drag.last.t;
    if (dt > 0) drag.v = (drag.last.y - y) / dt;
    drag.last = { y, t };
  }

  function end() {
    pending = undefined;
    if (!drag || !sizes) return;
    const { raw, v } = drag;
    drag = undefined;
    const rest = modalRestAfterDrag(sizes.start, sizes.full, raw, v);
    if (rest === 'close') {
      delete panel.dataset.moving;
      close();
      return;
    }
    if (reduce) panel.style.transform = '';
    else animate(panel, { y: 0 }, motionSpring('spatial'));
    go(rest === 'full' ? sizes.full : sizes.start);
  }

  // The handle and the header: a pull after 4px (not by a button in the header).
  for (const el of [handle, header]) {
    el?.addEventListener('pointerdown', (e) => {
      const target = e.target as Element;
      if (!managed() || !sizes || e.button !== 0 || target.closest('button, a')) return;
      pending = { y: e.clientY };
      el.setPointerCapture(e.pointerId);
    });
    el?.addEventListener('pointermove', (e) => {
      if (!pending && !drag) return;
      if (!drag) {
        if (Math.abs(e.clientY - pending!.y) < 4) return;
        begin(e.clientY, e.timeStamp);
      }
      move(e.clientY, e.timeStamp);
    });
    el?.addEventListener('pointerup', end);
    el?.addEventListener('pointercancel', end);
  }

  // The content: below full height every touch pulls the sheet (ui.css has stopped it scrolling); at full height a touch
  // pulls it only when it moves down while the content is at the top, else the content scrolls.
  content?.addEventListener('touchstart', (e) => {
    if (managed() && sizes && e.touches.length === 1) pending = { y: e.touches[0].clientY };
  });
  content?.addEventListener(
    'touchmove',
    (e) => {
      if (!pending && !drag) return;
      const y = e.touches[0].clientY;
      if (!drag) {
        const dy = y - pending!.y;
        if (panel.hasAttribute('data-full')) {
          if (Math.abs(dy) < 4) return;
          if (dy < 0 || content.scrollTop > 0) {
            pending = undefined;
            return;
          }
        } else if (Math.abs(dy) < 4) return;
        begin(y, e.timeStamp);
      }
      if (e.cancelable) e.preventDefault();
      move(y, e.timeStamp);
    },
    { passive: false },
  );
  content?.addEventListener('touchend', end);
  content?.addEventListener('touchcancel', end);

  // Becoming a dialog (from the medium breakpoint) or a phone again, and a phone turned: measured again. Both listeners
  // remove themselves once the dialog is no longer in the page (the gallery's sample mounts and unmounts it).
  const onWide = () => {
    if (!dialog.isConnected) return gone();
    if (wide.matches) reset();
    else if (dialog.open) open();
  };
  const onResize = () => {
    if (!dialog.isConnected) return gone();
    if (!dialog.open || !managed() || !sizes || drag) return;
    const full = panel.hasAttribute('data-full');
    sizes = measure();
    settle(full ? sizes.full : sizes.start);
  };
  function gone() {
    wide.removeEventListener('change', onWide);
    removeEventListener('resize', onResize);
  }
  wide.addEventListener('change', onWide);
  addEventListener('resize', onResize);

  return { managed, open, reset };
}
