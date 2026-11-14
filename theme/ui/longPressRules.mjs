// The decisions of a long press (longPress.ts useLongPress), apart from the browser: which pointers can press, when a
// move cancels, and what the click after a press does. Exposes MOVE, canPress, movedAway, clickAfter. No dependencies, so node can import it.

/** The most a pointer may move (pixels) and still be a press. */
export const MOVE = 10;

/** Only a touch or a pen, and only the first finger: a mouse is never a long press. */
export const canPress = (pointerType, isPrimary) => pointerType !== 'mouse' && !!isPrimary;

/** True when the pointer is now more than MOVE pixels from where it started: the press is cancelled. */
export const movedAway = (start, x, y) => !!start && Math.hypot(x - start.x, y - start.y) > MOVE;

/** What the click does: 'pass' (the item's own), 'swallow' (the click after a press that fired), or 'select' (a tap
 * while selecting: swallowed, and runs the action instead). */
export function clickAfter(fired, tapToo) {
  if (fired) return 'swallow';
  return tapToo ? 'select' : 'pass';
}

/** How far a list scrolls in one frame while a finger held after a long press stays near its top or bottom edge: negative up, positive
 * down, 0 away from the edges. Within `edge` pixels of an edge the speed grows from 0 to `max` the closer the finger is to it (and
 * stays `max` beyond it). */
export function edgeScroll(y, top, bottom, edge = 72, max = 16) {
  if (y < top + edge) return -Math.min(max, (Math.max(0, top + edge - y) / edge) * max);
  if (y > bottom - edge) return Math.min(max, (Math.max(0, y - (bottom - edge)) / edge) * max);
  return 0;
}
