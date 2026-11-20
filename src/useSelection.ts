// Selecting several rows of a list (the pages and posts of Library.tsx, the notifications of Notifications.tsx), one
// way for all: `useSelection({ order })` keeps what is selected (the keys of the rows, kept to those still shown) and
// whether the list is in selection mode (some row selected). `row(key)` gives a
// theme ListItem its props: `selectable` (a long press with a touch or a pen selects it, theme/ui/longPress.ts; while
// selecting a tap or a click toggles it), and the marks the keys find the row by. The keys, which the rules of
// selectionRules.mjs decide (tested): Space toggles the row in focus, Shift+click and Shift+Arrow add a range, Ctrl or
// Cmd+A selects all shown, Escape unselects and ends the mode; focus stays on the row last toggled, goes back to it on
// close, and goes to the row that took the place of deleted ones (`removed()`). A finger held after a long press and dragged across
// the rows puts each row it passes (the ones a fast finger skipped too) in the state the first row got, and scrolls the nearest scrolling
// box while it is held near its top or bottom (`onSelectDrag` of `row`, theme/ui/longPress.ts; Material's Selection page). Back leaves selecting first (a list outside a sheet). Keys apply only inside `root` when it is
// given, else only when no modal dialog is open (a sheet over the list has its own). Exposes useSelection.
// Uses selectionRules.mjs. Thin wiring over the rules: checked by `check:screens` (editor-screens.mjs).
import { useCallback, useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import { keyAction, neighbourKey, pruneKeys, rangeKeys, selectAllKeys, setRange, toggleKey } from './selectionRules.mjs';
import { edgeScroll } from '@theme/ui/longPressRules.mjs';

const typing = (el: Element | null) => !!el?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
const modalOpen = () => {
  try {
    return !!document.querySelector('dialog:modal');
  } catch {
    return false;
  }
};

export function useSelection({
  order,
  enabled = true,
  spaceStarts = false,
  primary = false,
  root,
}: {
  /** The keys of the rows shown, top to bottom. */
  order: string[];
  /** False: the list cannot be selected (nothing is, no key does anything). */
  enabled?: boolean;
  /** Space on a focused row starts selecting (the keyboard's way in, where no button starts it). */
  spaceStarts?: boolean;
  /** Selecting is the screen's main activity (Deleted files and pages): the rows always show their checkboxes, a tap toggles, and
   * Ctrl or Cmd+A selects all with nothing selected yet. The mode (`selecting`) still means that some row is selected. */
  primary?: boolean;
  /** Keys and clicks count only inside it (a sheet's own list); without it, only while no modal dialog is open. */
  root?: RefObject<Element | null>;
}) {
  const id = useId();
  const [picked, setPicked] = useState<string[]>([]);
  const keys: string[] = useMemo(() => (enabled ? pruneKeys(picked, order) : []), [picked, order, enabled]);
  const selecting = enabled && keys.length > 0;
  // The row last toggled: where a range starts and where focus returns to.
  const last = useRef<string | undefined>(undefined);
  // A focus move that waits for the rows to change (after a delete): the index the deleted rows had.
  const refocus = useRef<number | null>(null);
  const latest = useRef({ keys, order, selecting });
  latest.current = { keys, order, selecting };

  const rows = () => [...document.querySelectorAll<HTMLElement>('[data-selection]')].filter((r) => r.dataset.selection === id);
  const focusRow = (key: string | undefined) => {
    if (key !== undefined)
      requestAnimationFrame(() =>
        rows()
          .find((r) => r.dataset.selectionKey === key)
          ?.focus(),
      );
  };

  // A drag across rows (after a long press): the state the first row got and the row the finger was last over.
  const dragTo = useRef<{ on: boolean; key: string | undefined } | null>(null);

  const toggle = useCallback((key: string) => {
    last.current = key;
    setPicked((p) => toggleKey(pruneKeys(p, latest.current.order), key));
  }, []);
  const clear = useCallback(() => {
    setPicked([]);
    focusRow(last.current);
  }, []);
  const selectAll = useCallback(() => setPicked(selectAllKeys(latest.current.order)), []);
  /** Unselects every row, which ends selecting (the bar's select-all box, unticked). */
  const unselectAll = useCallback(() => setPicked([]), []);
  /** Call after the selected rows were deleted: ends the mode and moves focus to the row in their place. */
  const removed = useCallback(() => {
    const first = Math.min(...latest.current.keys.map((k: string) => latest.current.order.indexOf(k)).filter((i: number) => i >= 0));
    refocus.current = Number.isFinite(first) ? first : null;
    setPicked([]);
  }, []);

  // The finger of a long press, held and dragged (x, y): each row it is over gets the state of the first one; near the top or bottom of the
  // nearest box that scrolls, the box scrolls by itself (faster the nearer the edge).
  const drag = useCallback(
    (x: number, y: number) => {
      const to = dragTo.current;
      if (!to) return;
      const el = document.elementFromPoint(x, y);
      const over = el?.closest<HTMLElement>('[data-selection]');
      const key = over && over.dataset.selection === id ? over.dataset.selectionKey : undefined;
      if (key !== undefined && key !== to.key) {
        const from = to.key;
        to.key = key;
        last.current = key;
        setPicked((p) => setRange(pruneKeys(p, latest.current.order), latest.current.order, from, key, to.on));
      }
      const any = over ?? document.querySelector<HTMLElement>(`[data-selection="${id}"]`);
      let box: HTMLElement | null = null;
      for (let up = any?.parentElement; up && up !== document.body; up = up.parentElement)
        if (/auto|scroll/.test(getComputedStyle(up).overflowY) && up.scrollHeight > up.clientHeight) {
          box = up;
          break;
        }
      const bounds = box ? box.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
      const step = edgeScroll(y, bounds.top, bounds.bottom);
      if (step) (box ?? window).scrollBy(0, step);
    },
    [id],
  );

  // After a delete: focus the row now at the place of the first deleted one (the last row when it was the last).
  useEffect(() => {
    if (refocus.current === null) return;
    const at = refocus.current;
    refocus.current = null;
    const list = rows();
    list[Math.min(at, list.length - 1)]?.focus();
  }, [order]);

  // Back (a phone's gesture or button) leaves selecting first and stays on the screen, as a sheet's Back closes the sheet
  // (useSheetBack.ts): while selecting the list has a step of its own in the history. Not for a list in a sheet (`root`):
  // there Back closes the sheet, which unselects.
  useEffect(() => {
    if (!enabled || !selecting || root) return;
    history.pushState({ ...history.state, selection: true }, '');
    const onPop = () => {
      if (!(history.state as { selection?: boolean } | null)?.selection) clear();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if ((history.state as { selection?: boolean } | null)?.selection) history.back();
    };
  }, [enabled, selecting, root, clear]);

  useEffect(() => {
    if (!enabled) return;
    const inScope = (target: EventTarget | null) => target instanceof Element && (root ? !!root.current?.contains(target) : !modalOpen());
    const rowOf = (target: EventTarget | null) => (target instanceof Element ? target.closest<HTMLElement>('[data-selection]') : null);
    const own = (row: HTMLElement | null) => (row && row.dataset.selection === id ? row : null);
    const range = (to: string) => {
      const from = last.current;
      last.current = to;
      setPicked((p) => rangeKeys(pruneKeys(p, latest.current.order), latest.current.order, from, to));
    };

    const onKey = (e: KeyboardEvent) => {
      if (!inScope(e.target) || (e.defaultPrevented && e.key !== 'Escape')) return;
      const row = own(rowOf(e.target));
      const action = keyAction(e, {
        selecting: latest.current.selecting || primary,
        onRow: !!row && !typing(e.target as Element),
        spaceStarts,
      });
      if (!action) return;
      if (action === 'clear') {
        // The dialog's own Escape (Notifications.tsx) is stopped by the caller; this only unselects.
        clear();
        return;
      }
      if (typing(e.target as Element)) return;
      e.preventDefault();
      if (action === 'all') return selectAll();
      const key = row?.dataset.selectionKey;
      if (key === undefined) return;
      if (action === 'toggle') return toggle(key);
      const next = neighbourKey(latest.current.order, key, action === 'range-next' ? 1 : -1);
      if (next === undefined) return;
      // The first Shift+Arrow also takes the row it starts on.
      if (!latest.current.keys.includes(key)) toggle(key);
      range(next);
      focusRow(next);
    };
    // Shift+click: a range from the row last toggled, not the link or the button.
    const onClick = (e: MouseEvent) => {
      if (!e.shiftKey || !inScope(e.target)) return;
      const row = own(rowOf(e.target));
      const key = row?.dataset.selectionKey;
      if (key === undefined) return;
      e.preventDefault();
      e.stopPropagation();
      range(key);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick, true);
    };
  }, [enabled, root, id, clear, selectAll, toggle, spaceStarts, primary]);

  /** The props of a ListItem for the row with this key. */
  const row = (key: string) =>
    enabled
      ? {
          selectable: true,
          selecting: selecting || primary,
          selected: keys.includes(key),
          // The long press that starts a drag across rows is this: the rows passed over get the state this one gets.
          onSelectedChange: () => {
            dragTo.current = { on: !latest.current.keys.includes(key), key };
            toggle(key);
          },
          onSelectDrag: drag,
          'data-selection': id,
          'data-selection-key': key,
        }
      : {};

  return { keys, count: keys.length, selecting, row, clear, selectAll, unselectAll, removed, total: order.length };
}
