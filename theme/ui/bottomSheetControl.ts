// What a bottom sheet (BottomSheet.tsx) does in a browser.
// A modal one (in its <dialog> with bottomSheetClass), for the script that shows it (an app's: Calendly's Sheet.astro):
// bottomSheet(dialog) gives it its open() and close(). Native <dialog>: focus handling, Escape and screen readers work
// out of the box. Motion: on a phone it slides up and down (a state transition); it opens at its start height
// (BottomSheet's `startAt`, half the screen without it), is pulled up to full height and pulled down to close by its
// handle, its header or its content (modalSheetSize.ts; the editor's sheets, with bottomSheetFitClass or
// bottomSheetFullClass, keep their heights and the old handle pull down to close), on a computer (from the medium
// breakpoint) it follows its data-wide (BottomSheet's `wide`): 'dialog' (the default, a dialog in the middle of the
// screen) fades, 'side-sheet' (a modal side sheet at the end of the screen) slides in from the end (the left in a
// language written from the right) and out again, 'sheet' (still a bottom sheet) slides up and down as on a phone;
// with reduced motion it appears and disappears at once. Its close button, Escape and a tap on the scrim (outside it)
// close it; the page under it does not scroll while it is open. It moves with the site's motion scheme (motionSpring,
// @morphemecms/cms/lib/motion.ts).
// A standard one (kind 'standard', at the bottom of the screen without a scrim; bottomSheet.script.ts on every page, or
// a block's or an app's script that wants its controls): standardBottomSheet(sheet) lets it be dragged by its handle
// and its header between the states it rests in: the ones in its data-states (the `states` prop of BottomSheet; without
// it Material 3's, with 'hidden' when it has a close button; half-expanded only where that is clearly between the
// others), to the nearest when let go, or on to the next when it is flicked; a tap on the handle (or Enter or Space on
// it) steps through the states, up one at a time and from the highest back to the lowest (never to hidden), and its
// close button hides it. Its resize button (`resizeLabel`, [data-bottom-sheet-resize]) does what a tap on the handle
// does and has aria-expanded true while the sheet is above its lowest stop; its collapse button (`collapseLabel`,
// [data-bottom-sheet-collapse]) sets the lowest stop, moves focus on to the handle, and shows (ui.css) only under
// data-full, which is set while the sheet is expanded and as high as its max-height lets it be (also when the window
// is resized). The decisions are sheet-stops.mjs's (tested); this only measures and applies them.
// From the medium breakpoint a sheet with data-wide 'side-sheet' (the default; BottomSheet's `wide`) is a side sheet
// (ui.css) and this does nothing to it: the handle, the header and the buttons do not act. It follows the media query:
// when the window gets that wide it drops a drag and the height it was dragged to, and when it gets narrower it applies
// the marks again.
// How high each state is, is ui.css's (data-state), read without being painted, so a theme sets it there. It gives its
// state() and set(state) to show it in another (also again after it is hidden). The height follows with the site's
// motion scheme; with reduced motion it changes at once.
import { animate } from 'motion';
import { atLeast } from '@morphemecms/cms/lib/breakpoints.mjs';
import { motionSpring } from '@morphemecms/cms/lib/motion';
import { defaultStates, nextOnTap, restAfterDrag, restingStops } from '@morphemecms/cms/lib/sheet-stops.mjs';
import { modalSheetSize } from '@theme/ui/modalSheetSize';
import type { BottomSheetState } from '@theme/ui/BottomSheet';

export type BottomSheetControls = { open: () => void; close: () => Promise<void> };
export type StandardBottomSheetControls = { state: () => BottomSheetState; set: (state: BottomSheetState) => Promise<void> };

/** Lifts a modal sheet (a <dialog>, fixed to the layout viewport) above the on-screen keyboard: a phone's keyboard
 * shrinks only the visual viewport, so the sheet would stay under it or leave a strip of the page between. It sets
 * --keyboard-inset (how far the visual viewport's bottom is above the layout viewport's) and --visual-height (what is
 * visible) on the sheet and data-keyboard while the keyboard is up; ui.css lifts the sheet by the first, caps its height
 * by the second (the content scrolls inside) and the focused field is kept in view. A pinch-zoom is not a keyboard. It
 * returns what stops following. Used by bottomSheet() and by the editor's BottomSheet (src/ui.tsx). */
export function followKeyboard(sheet: HTMLElement): () => void {
  const screen = window.visualViewport;
  if (!screen) return () => {};
  const style = sheet.style;
  const update = () => {
    const inset =
      screen.scale > 1.01 ? 0 : Math.max(0, Math.round(document.documentElement.clientHeight - screen.height - screen.offsetTop));
    if (inset) {
      style.setProperty('--keyboard-inset', `${inset}px`);
      style.setProperty('--visual-height', `${Math.round(screen.height)}px`);
      sheet.setAttribute('data-keyboard', '');
      // The field being typed in stays in view, in the sheet's scrolled content.
      requestAnimationFrame(() => {
        const field = document.activeElement;
        if (field instanceof HTMLElement && sheet.contains(field) && field.matches('input, textarea, [contenteditable]'))
          field.scrollIntoView({ block: 'nearest' });
      });
    } else {
      style.removeProperty('--keyboard-inset');
      style.removeProperty('--visual-height');
      sheet.removeAttribute('data-keyboard');
    }
  };
  update();
  screen.addEventListener('resize', update);
  screen.addEventListener('scroll', update);
  return () => {
    screen.removeEventListener('resize', update);
    screen.removeEventListener('scroll', update);
    style.removeProperty('--keyboard-inset');
    style.removeProperty('--visual-height');
    sheet.removeAttribute('data-keyboard');
  };
}

export function bottomSheet(sheet: HTMLDialogElement): BottomSheetControls {
  const panel = sheet.querySelector<HTMLElement>('[data-bottom-sheet-container]')!;
  const handle = sheet.querySelector<HTMLElement>('[data-bottom-sheet-handle]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // On a computer (from the medium breakpoint) what data-wide says (ui.css): a dialog in the middle fades, a side sheet
  // slides in from the end, a sheet slides up; the dialog and the side sheet have no handle to drag.
  const wide = matchMedia(atLeast('medium'));
  const kind = () =>
    !wide.matches ? 'sheet' : panel.dataset.wide === 'side-sheet' ? 'side-sheet' : panel.dataset.wide === 'sheet' ? 'sheet' : 'dialog';
  // Out past the end edge: to the right, or to the left in a language written from the right.
  const away = () => (getComputedStyle(sheet).direction === 'rtl' ? '-100%' : '100%');
  const enter = () => {
    const k = kind();
    return k === 'dialog' ? { opacity: [0, 1], scale: [0.98, 1] } : k === 'side-sheet' ? { x: [away(), '0%'] } : { y: ['100%', '0%'] };
  };
  const leave = () => {
    const k = kind();
    return k === 'dialog' ? { opacity: 0, scale: 0.98 } : k === 'side-sheet' ? { x: away() } : { y: '100%' };
  };
  let closing = false;
  // On a phone: its start height and the pull by handle, header and content (not for the editor's sheets).
  const size = modalSheetSize(sheet, panel, () => void close());
  followKeyboard(sheet);

  function open() {
    if (sheet.open) return;
    sheet.showModal();
    document.documentElement.style.overflow = 'hidden';
    size.open();
    if (reduce) return;
    animate(panel, enter(), motionSpring('spatial'));
  }

  async function close() {
    if (!sheet.open || closing) return;
    closing = true;
    if (!reduce) await animate(panel, leave(), motionSpring('spatial', 'fast'));
    sheet.close();
    panel.style.transform = '';
    panel.style.opacity = '';
    size.reset();
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

  // Drag the handle down to close (the sheets modalSheetSize does not manage).
  let startY = 0;
  let dragging = false;
  handle?.addEventListener('pointerdown', (e) => {
    if (size.managed()) return;
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
  const resizeButton = sheet.querySelector<HTMLElement>('[data-bottom-sheet-resize]');
  const collapseButton = sheet.querySelector<HTMLElement>('[data-bottom-sheet-collapse]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = () => (sheet.dataset.state as BottomSheetState | undefined) ?? 'collapsed';
  // A side sheet from the medium breakpoint (data-wide, ui.css): nothing here acts while it is one.
  const wideQuery = matchMedia(atLeast('medium'));
  const asSideSheet = () => wideQuery.matches && sheet.dataset.wide === 'side-sheet';

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
  // The states it allows (data-states, else Material 3's), and the stops they make at the heights measured now.
  const states = (sheet.dataset.states?.split(' ').filter(Boolean) as BottomSheetState[] | undefined) ?? defaultStates(!!closeButton);
  const stops = () =>
    restingStops({ collapsed: heightIn('collapsed'), 'half-expanded': heightIn('half-expanded'), expanded: heightIn('expanded') }, states);
  // The lowest stop that is not 'hidden': where the collapse button goes, and where the resize button's up caret shows.
  const lowest = () => stops().find((stop) => stop.state !== 'hidden')?.state ?? 'collapsed';
  // data-full: expanded, and as high as max-height lets it be (1px of slack).
  function settleFull(s: BottomSheetState) {
    const max = parseFloat(getComputedStyle(sheet).maxHeight);
    sheet.toggleAttribute('data-full', s === 'expanded' && max > 0 && sheet.offsetHeight >= max - 1);
  }
  // The resize button's aria-expanded (and so its caret): true while the sheet is above its lowest stop.
  const settleResize = (s: BottomSheetState) => resizeButton?.setAttribute('aria-expanded', String(s !== 'hidden' && s !== lowest()));
  const shown = (s: BottomSheetState) => {
    sheet.dataset.state = s;
    sheet.style.height = '';
    handle?.setAttribute('aria-expanded', String(s === 'half-expanded' || s === 'expanded'));
    settleResize(s);
    settleFull(s);
  };

  // From the height it has now (0 when hidden) to the one of `to`, with all of it there while it moves.
  async function set(to: BottomSheetState) {
    if (asSideSheet()) {
      sheet.dataset.state = to;
      return;
    }
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
    if (asSideSheet() || e.button !== 0 || (target.closest('button, a') && target.closest('[data-bottom-sheet-handle]') === null)) return;
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
    if (!drag || asSideSheet()) return;
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
    set(restAfterDrag(list, height, v));
  };
  for (const el of [handle, header]) {
    el?.addEventListener('pointerdown', down);
    el?.addEventListener('pointermove', move);
    el?.addEventListener('pointerup', up);
    el?.addEventListener('pointercancel', up);
  }
  // A tap on the handle (or Enter or Space): on to the next state; not after it was dragged.
  handle?.addEventListener('click', () => {
    if (afterDrag || asSideSheet()) return;
    set(nextOnTap(stops(), state()));
  });
  // The buttons in the header are clicks, not drags (down() leaves them out), like the close button.
  resizeButton?.addEventListener('click', () => asSideSheet() || set(nextOnTap(stops(), state())));
  // The collapse button hides itself with data-full, so focus moves on to the handle (else the resize button, else the
  // sheet) rather than falling to the page.
  collapseButton?.addEventListener('click', async () => {
    if (asSideSheet()) return;
    await set(lowest());
    if (!collapseButton.contains(document.activeElement) && document.activeElement !== document.body) return;
    const next = handle ?? resizeButton ?? sheet;
    if (next === sheet && !sheet.hasAttribute('tabindex')) sheet.tabIndex = -1;
    next.focus();
  });
  closeButton?.addEventListener('click', () => asSideSheet() || set('hidden'));
  // At attach the marks follow the measured stops (the server only guessed), and again when the window is resized
  // (a phone turned while expanded), as the stops move with it; the listener removes itself once the sheet is no longer
  // in the page.
  settleResize(state());
  settleFull(state());
  const onResize = () => {
    if (!sheet.isConnected) {
      removeEventListener('resize', onResize);
      wideQuery.removeEventListener('change', onWide);
      return;
    }
    if (asSideSheet()) return;
    settleResize(state());
    settleFull(state());
  };
  // Becoming a side sheet (or a bottom sheet again): drop a drag in progress and the height it gave the sheet, and on
  // the way back apply the marks as at attach.
  const onWide = () => {
    if (!sheet.isConnected) return onResize();
    drag = undefined;
    dragged = false;
    delete sheet.dataset.moving;
    sheet.style.height = '';
    if (asSideSheet()) {
      sheet.removeAttribute('data-full');
      return;
    }
    handle?.setAttribute('aria-expanded', String(state() === 'half-expanded' || state() === 'expanded'));
    settleResize(state());
    settleFull(state());
  };
  addEventListener('resize', onResize);
  wideQuery.addEventListener('change', onWide);

  const controls = { state, set };
  standardSheets.set(sheet, controls);
  return controls;
}
