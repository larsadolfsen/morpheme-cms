// Selecting several rows of a list (the pages and posts of Library.tsx, the notifications of Notifications.tsx), one
// way for all: `useSelection({ order })` keeps what is selected (the keys of the rows, kept to those still shown) and
// whether the list is in selection mode (some row selected, or `start()` from a "Select" button). `row(key)` gives a
// theme ListItem its props: `selectable` (a long press with a touch or a pen selects it, theme/ui/longPress.ts; while
// selecting a tap or a click toggles it), and the marks the keys find the row by. The keys, which the rules of
// selectionRules.mjs decide (tested): Space toggles the row in focus, Shift+click and Shift+Arrow add a range, Ctrl or
// Cmd+A selects all shown, Escape unselects and ends the mode; focus stays on the row last toggled, goes back to it on
// close, and goes to the row that took the place of deleted ones (`removed()`). Back leaves selecting first (a list outside a sheet). Keys apply only inside `root` when it is
// given, else only when no modal dialog is open (a sheet over the list has its own). Exposes useSelection.
// Uses selectionRules.mjs. Thin wiring over the rules: checked by `check:screens` (editor-screens.mjs).
import { useCallback, useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import { keyAction, neighbourKey, pruneKeys, rangeKeys, selectAllKeys, toggleKey } from './selectionRules.mjs';

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
  root,
}: {
  /** The keys of the rows shown, top to bottom. */
  order: string[];
  /** False: the list cannot be selected (nothing is, no key does anything). */
  enabled?: boolean;
  /** Keys and clicks count only inside it (a sheet's own list); without it, only while no modal dialog is open. */
  root?: RefObject<Element | null>;
}) {
  const id = useId();
  const [picked, setPicked] = useState<string[]>([]);
  const [mode, setMode] = useState(false);
  const keys: string[] = useMemo(() => (enabled ? pruneKeys(picked, order) : []), [picked, order, enabled]);
  const selecting = enabled && (mode || keys.length > 0);
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

  const toggle = useCallback((key: string) => {
    last.current = key;
    setPicked((p) => toggleKey(pruneKeys(p, latest.current.order), key));
  }, []);
  const clear = useCallback(() => {
    setPicked([]);
    setMode(false);
    focusRow(last.current);
  }, []);
  const start = useCallback(() => setMode(true), []);
  const selectAll = useCallback(() => setPicked(selectAllKeys(latest.current.order)), []);
  /** Call after the selected rows were deleted: ends the mode and moves focus to the row in their place. */
  const removed = useCallback(() => {
    const first = Math.min(...latest.current.keys.map((k: string) => latest.current.order.indexOf(k)).filter((i: number) => i >= 0));
    refocus.current = Number.isFinite(first) ? first : null;
    setPicked([]);
    setMode(false);
  }, []);

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
      const action = keyAction(e, { selecting: latest.current.selecting, onRow: !!row && !typing(e.target as Element) });
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
  }, [enabled, root, id, clear, selectAll, toggle]);

  /** The props of a ListItem for the row with this key. */
  const row = (key: string) =>
    enabled
      ? {
          selectable: true,
          selecting,
          selected: keys.includes(key),
          onSelectedChange: () => toggle(key),
          'data-selection': id,
          'data-selection-key': key,
        }
      : {};

  return { keys, count: keys.length, selecting, row, start, clear, selectAll, removed };
}
