// A long press on a phone, for a list item that can be selected (List.tsx `selectable`): useLongPress(action, tapToo)
// gives the handlers for the element, or undefined without an action. A touch or a pen held still (no more than MOVE
// pixels) for HOLD milliseconds runs `action`, with a short vibration where the phone has one; the click that follows
// the press does nothing, and the browser's own menu for a long press (a link's) is not shown, nor is the item dragged
// (ui.css .list-item-selectable keeps its text from being selected and iOS's menu away). The decisions are in
// longPressRules.mjs (tested). A mouse is never a long
// press. With `tapToo` (the list is selecting) a tap runs `action` too, instead of following the link or pressing the button.
// With `onDrag` the finger can stay down after the press fired and be dragged across other items (Material's Selection page: "To select
// multiple items simultaneously, long press and drag across items"): `onDrag(x, y)` is called with the finger's place each time it moves and
// once a frame while it is held, so the list can scroll itself near its edges (longPressRules.mjs edgeScroll). From the hold on the page does
// not scroll under the finger (a touchmove listener, added when the finger goes down, cancels it, as changing touch-action after the
// touch started has no effect); a finger that moves before the hold scrolls the page as always and cancels the press.
import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';
import { canPress, clickAfter, movedAway } from './longPressRules.mjs';

const HOLD = 500;

export function useLongPress(action: (() => void) | undefined, tapToo = false, onDrag?: (x: number, y: number) => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const latest = useRef(action);
  latest.current = action;
  const drag = useRef(onDrag);
  drag.current = onDrag;
  // The finger of the press that fired and is still down: its pointer, its place and what ends it.
  const holding = useRef<{ x: number; y: number; frame: number; end: () => void } | null>(null);
  // Cancels the page's scrolling while the finger is dragged (set when the finger goes down, since it must be there before the first move).
  const block = useRef<((e: TouchEvent) => void) | null>(null);
  const unblock = () => {
    if (block.current) document.removeEventListener('touchmove', block.current);
    block.current = null;
  };
  const endDrag = () => {
    holding.current?.end();
    holding.current = null;
    unblock();
  };

  const stop = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    start.current = null;
  };
  useEffect(
    () => () => {
      stop();
      endDrag();
    },
    [],
  );

  if (!action) return undefined;
  return {
    // Not dragged away (a link's drag would end the press).
    draggable: false,
    onPointerDown: (e: PointerEvent) => {
      fired.current = false;
      if (!canPress(e.pointerType, e.isPrimary)) return;
      start.current = { x: e.clientX, y: e.clientY };
      clearTimeout(timer.current);
      unblock();
      if (drag.current) {
        block.current = (t: TouchEvent) => {
          if (holding.current && t.cancelable) t.preventDefault();
        };
        document.addEventListener('touchmove', block.current, { passive: false });
      }
      const id = e.pointerId;
      timer.current = setTimeout(() => {
        fired.current = true;
        navigator.vibrate?.(10);
        latest.current?.();
        const from = start.current;
        start.current = null;
        if (!drag.current || !from) return unblock();
        // Held after the press: dragged across items until the finger is lifted.
        const now = { x: from.x, y: from.y, frame: 0, end: () => {} };
        const move = (m: globalThis.PointerEvent) => {
          if (m.pointerId !== id) return;
          now.x = m.clientX;
          now.y = m.clientY;
          drag.current?.(now.x, now.y);
        };
        const up = (u: globalThis.PointerEvent) => {
          if (u.pointerId === id) endDrag();
        };
        const tick = () => {
          drag.current?.(now.x, now.y);
          now.frame = requestAnimationFrame(tick);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        now.frame = requestAnimationFrame(tick);
        now.end = () => {
          cancelAnimationFrame(now.frame);
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
        };
        holding.current = now;
      }, HOLD);
    },
    onPointerMove: (e: PointerEvent) => {
      if (movedAway(start.current, e.clientX, e.clientY)) stop();
    },
    onPointerUp: () => {
      stop();
      if (!holding.current) unblock();
    },
    onPointerCancel: () => {
      stop();
      if (!holding.current) unblock();
    },
    onPointerLeave: stop,
    // The browser's menu for a long press (a link's, a text's): not for an item that is selected by one.
    onContextMenu: (e: MouseEvent) => {
      if (start.current || fired.current) e.preventDefault();
    },
    // Before the item's own click: the click after a long press, and a tap while selecting, are the selection's.
    onClickCapture: (e: MouseEvent) => {
      const what = clickAfter(fired.current, tapToo);
      if (what === 'pass') return;
      e.preventDefault();
      e.stopPropagation();
      if (what === 'select') latest.current?.();
      fired.current = false;
    },
  };
}
