// What a bottom sheet (BottomSheet.tsx) does in a browser.
// A modal one (in its <dialog> with bottomSheetClass), for the script that shows it (an app's: Calendly's
// Sheet.astro): bottomSheet(dialog) gives it its open() and close(). Native <dialog>:
// focus handling, Escape and screen readers work out of the box. Motion: on a phone it slides up and down (a state
// transition) and its drag handle can be pulled down to close it (feedback), on a computer (from 48rem, a dialog in the
// middle of the screen) it fades; with reduced motion it appears and disappears at once. Its close button, Escape and a
// tap on the scrim (outside it) close it; the page under it does not scroll while it is open. It moves with the site's
// motion scheme (motionSpring, @morpheme/cms/lib/motion.ts).
// A standard one (kind 'standard', at the bottom of the screen without a scrim; bottomSheet.script.ts on every page,
// or a block's or an app's script that wants its controls): standardBottomSheet(sheet) lets it be dragged by its handle
// and its header between the states it rests in (collapsed, half-expanded where that is clearly between the others,
// expanded, and hidden when it has a close button), to the nearest when let go, or on to the next when it is flicked;
// a tap on the handle (or Enter or Space on it) expands it when it is collapsed and collapses it otherwise, and its close
// button hides it. How high each state is, is ui.css's (data-state), read without being painted, so a theme sets it
// there. It gives its state() and set(state) to show it in another (also again after it is hidden). The height follows
// with the site's motion scheme; with reduced motion it changes at once.
import { animate } from 'motion';
import { motionSpring } from '@morpheme/cms/lib/motion';
import type { BottomSheetState } from '@theme/ui/BottomSheet';

export type BottomSheetControls = { open: () => void; close: () => Promise<void> };
export type StandardBottomSheetControls = { state: () => BottomSheetState; set: (state: BottomSheetState) => Promise<void> };

export function bottomSheet(sheet: HTMLDialogElement): BottomSheetControls {
  const panel = sheet.querySelector<HTMLElement>('[data-bottom-sheet-container]')!;
  const handle = sheet.querySelector<HTMLElement>('[data-bottom-sheet-handle]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // A dialog in the middle on a computer (.bottom-sheet in ui.css): it fades, and has no handle to drag.
  const wide = matchMedia('(width >= 48rem)');
  let closing = false;

  function open() {
    if (sheet.open) return;
    sheet.showModal();
    document.documentElement.style.overflow = 'hidden';
    if (reduce) return;
    if (wide.matches) animate(panel, { opacity: [0, 1], scale: [0.98, 1] }, motionSpring('spatial'));
    else animate(panel, { y: ['100%', '0%'] }, motionSpring('spatial'));
  }

  async function close() {
    if (!sheet.open || closing) return;
    closing = true;
    if (!reduce) await animate(panel, wide.matches ? { opacity: 0, scale: 0.98 } : { y: '100%' }, motionSpring('spatial', 'fast'));
    sheet.close();
    panel.style.transform = '';
    panel.style.opacity = '';
    document.documentElement.style.overflow = '';
    closing = false;
  }

  sheet.querySelector('[data-bottom-sheet-close]')?.addEventListener('click', close);
  // Escape: animate out instead of the dialog's instant close.
  sheet.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  // A tap on the scrim (outside the sheet) closes it.
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) close();
  });

  // Drag the handle down to close.
  let startY = 0;
  let dragging = false;
  handle?.addEventListener('pointerdown', (e) => {
    dragging = true;
    startY = e.clientY;
    handle.setPointerCapture(e.pointerId);
  });
  handle?.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dy = Math.max(0, e.clientY - startY);
    panel.style.transform = `translateY(${dy}px)`;
  });
  const endDrag = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    const dy = Math.max(0, e.clientY - startY);
    if (dy > 120) close();
    else if (reduce) panel.style.transform = '';
    else animate(panel, { y: 0 }, motionSpring('spatial'));
  };
  handle?.addEventListener('pointerup', endDrag);
  handle?.addEventListener('pointercancel', endDrag);

  return { open, close };
}

const standardSheets = new WeakMap<HTMLElement, StandardBottomSheetControls>();

export function standardBottomSheet(sheet: HTMLElement): StandardBottomSheetControls {
  const known = standardSheets.get(sheet);
  if (known) return known;
  const handle = sheet.querySelector<HTMLElement>('[data-bottom-sheet-handle]');
  const header = sheet.querySelector<HTMLElement>('[data-bottom-sheet-header]');
  const closeButton = sheet.querySelector<HTMLElement>('[data-bottom-sheet-close]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = () => (sheet.dataset.state as BottomSheetState | undefined) ?? 'collapsed';

  // How high it is in a state, as ui.css draws it: set, measured and put back before anything is painted.
  function heightIn(s: BottomSheetState) {
    if (s === 'hidden') return 0;
    const was = { state: sheet.dataset.state, height: sheet.style.height };
    sheet.style.height = '';
    sheet.dataset.state = s;
    const px = sheet.offsetHeight;
    sheet.dataset.state = was.state;
    sheet.style.height = was.height;
    return px;
  }
  // The states it rests in, from the lowest: half-expanded only where it is clearly between the others.
  function stops() {
    const collapsed = heightIn('collapsed');
    const half = heightIn('half-expanded');
    const expanded = heightIn('expanded');
    return [
      ...(closeButton ? [{ state: 'hidden' as const, height: 0 }] : []),
      { state: 'collapsed' as const, height: collapsed },
      ...(half - collapsed > 48 && expanded - half > 48 ? [{ state: 'half-expanded' as const, height: half }] : []),
      { state: 'expanded' as const, height: expanded },
    ];
  }
  const shown = (s: BottomSheetState) => {
    sheet.dataset.state = s;
    sheet.style.height = '';
    handle?.setAttribute('aria-expanded', String(s === 'half-expanded' || s === 'expanded'));
  };

  // From the height it has now (0 when hidden) to the one of `to`, with all of it there while it moves.
  async function set(to: BottomSheetState) {
    const from = state() === 'hidden' ? 0 : sheet.offsetHeight;
    const height = heightIn(to);
    if (reduce || from === height) return shown(to);
    sheet.dataset.state = 'expanded';
    sheet.dataset.moving = '';
    await animate(sheet, { height: [from, height] }, motionSpring('spatial'));
    delete sheet.dataset.moving;
    shown(to);
  }

  // Dragged by the handle or the header (not by a button in it), followed by its height.
  let drag: { y: number; height: number; min: number; max: number; last: { y: number; t: number }; v: number } | undefined;
  let dragged = false;
  // The click that follows letting go of a drag is not a tap.
  let afterDrag = false;
  const down = (e: PointerEvent) => {
    const target = e.target as Element;
    if (e.button !== 0 || (target.closest('button, a') && target.closest('[data-bottom-sheet-handle]') === null)) return;
    const list = stops();
    drag = {
      y: e.clientY,
      height: sheet.offsetHeight,
      min: list[0].height,
      max: list.at(-1)!.height,
      last: { y: e.clientY, t: e.timeStamp },
      v: 0,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (!dragged && Math.abs(dy) < 4) return;
    if (!dragged) {
      dragged = true;
      sheet.dataset.state = 'expanded';
      sheet.dataset.moving = '';
    }
    sheet.style.height = `${Math.max(drag.min, Math.min(drag.max, drag.height - dy))}px`;
    const dt = e.timeStamp - drag.last.t;
    if (dt > 0) drag.v = (drag.last.y - e.clientY) / dt;
    drag.last = { y: e.clientY, t: e.timeStamp };
  };
  const up = () => {
    if (!drag) return;
    const { v } = drag;
    drag = undefined;
    if (!dragged) return;
    dragged = false;
    afterDrag = true;
    setTimeout(() => (afterDrag = false));
    delete sheet.dataset.moving;
    const height = sheet.offsetHeight;
    const list = stops();
    // Flicked: on to the next state that way; else the nearest.
    const next =
      v > 0.4
        ? list.find((s) => s.height > height + 1)
        : v < -0.4
          ? list.findLast((s) => s.height < height - 1)
          : list.reduce((a, b) => (Math.abs(b.height - height) < Math.abs(a.height - height) ? b : a));
    set((next ?? list.reduce((a, b) => (Math.abs(b.height - height) < Math.abs(a.height - height) ? b : a))).state);
  };
  for (const el of [handle, header]) {
    el?.addEventListener('pointerdown', down);
    el?.addEventListener('pointermove', move);
    el?.addEventListener('pointerup', up);
    el?.addEventListener('pointercancel', up);
  }
  // A tap on the handle (or Enter or Space): expanded when collapsed, else collapsed; not after it was dragged.
  handle?.addEventListener('click', () => {
    if (afterDrag) return;
    set(state() === 'collapsed' || state() === 'hidden' ? 'expanded' : 'collapsed');
  });
  closeButton?.addEventListener('click', () => set('hidden'));

  const controls = { state, set };
  standardSheets.set(sheet, controls);
  return controls;
}
