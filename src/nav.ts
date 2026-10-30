// How the editor goes between its screens (the address after the "#") in the browser's history, so
// that the back arrow and the phone's back gesture go the same way. The back arrow goes to the screen
// above (Screen.tsx `back`); when that is the screen before it in the history, it goes back there, as
// the gesture does, and otherwise the screen above takes the place of this one. No step is added, so
// the gesture never brings back a screen that was left with the arrow. Every step in the history knows
// its place and the screen before it (`history.state`).

type Step = { at: number; prev: string | null };

const step = () => history.state as Step | null;

/** The screen of an address ("#liste/sider" → "liste/sider", "#" → ""); one with a broken %-sign is
 * the start screen. */
export function screenOf(hash: string) {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return '';
  }
}

// The place of the screen that is shown, and while a step is undone (arrived), the place it goes back to.
let at = step()?.at ?? 0;
let undoing: number | null = null;
if (!step()) history.replaceState({ at, prev: null } satisfies Step, '');

/** Called by the app on every new address, with the screen it came from: null when it is a step back
 * that `undo` asked for, else how to undo the step (back to the screen it came from) and take it again
 * (when the owner leaves without saving). */
export function arrived(from: string): { undo: () => void; redo: () => void } | null {
  const now = step();
  if (undoing !== null && now?.at === undoing) {
    at = undoing;
    undoing = null;
    return null;
  }
  undoing = null;
  const before = at;
  // A step that was there (back, forward): its own place.
  if (now) {
    at = now.at;
    return {
      undo: () => ((undoing = before), history.go(before - now.at)),
      redo: () => history.go(now.at - before),
    };
  }
  // A new step (a link, or the address typed): after this one.
  const href = location.hash;
  at = before + 1;
  history.replaceState({ at, prev: from } satisfies Step, '');
  return {
    undo: () => ((undoing = before), history.back()),
    redo: () => (location.hash = href),
  };
}

/** Puts another screen in the place of this one (no new step in the history). */
export function replace(href: string) {
  history.replaceState({ at, prev: step()?.prev ?? null } satisfies Step, '', href);
  dispatchEvent(new HashChangeEvent('hashchange'));
}

/** The back arrow: to the screen above, `href`. Back in the history when that is the screen before,
 * else in the place of this one. */
export function up(href: string) {
  if (step()?.prev === screenOf(href)) history.back();
  else replace(href);
}
