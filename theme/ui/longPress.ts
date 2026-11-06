// A long press on a phone, for a list item that can be selected (List.tsx `selectable`): useLongPress(action, tapToo)
// gives the handlers for the element, or undefined without an action. A touch or a pen held still (no more than MOVE
// pixels) for HOLD milliseconds runs `action`, with a short vibration where the phone has one; the click that follows
// the press does nothing, and the browser's own menu for a long press (a link's) is not shown, nor is the item dragged
// (ui.css .list-item-selectable keeps its text from being selected and iOS's menu away). The decisions are in
// longPressRules.mjs (tested). A mouse is never a long
// press. With `tapToo` (the list is selecting) a tap runs `action` too, instead of following the link or pressing the button.
import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';
import { canPress, clickAfter, movedAway } from './longPressRules.mjs';

const HOLD = 500;

export function useLongPress(action: (() => void) | undefined, tapToo = false) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const latest = useRef(action);
  latest.current = action;

  const stop = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    start.current = null;
  };
  useEffect(() => stop, []);

  if (!action) return undefined;
  return {
    // Not dragged away (a link's drag would end the press).
    draggable: false,
    onPointerDown: (e: PointerEvent) => {
      fired.current = false;
      if (!canPress(e.pointerType, e.isPrimary)) return;
      start.current = { x: e.clientX, y: e.clientY };
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        fired.current = true;
        start.current = null;
        navigator.vibrate?.(10);
        latest.current?.();
      }, HOLD);
    },
    onPointerMove: (e: PointerEvent) => {
      if (movedAway(start.current, e.clientX, e.clientY)) stop();
    },
    onPointerUp: stop,
    onPointerCancel: stop,
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
