// Which blocks of the page are selected (the places of the blocks at the top level of the text), for the page editor (MarkdownEditor.tsx): the block cards
// (node views, not React) draw their mark from it and tell it when a block is toggled, and the text's one bar (React) shows the selection's tools
// from it. While some block is selected the text is read-only and every block shows its mark (Material's Selection page: "For all items after one item is
// selected"). One selection at a time. `get()` is a snapshot, a new object whenever the selection or the text under it changed, for useSyncExternalStore.
// `own(change)`: the selection's own change of the text (Hide, Remove, Duplicate), which keeps the selection (any other change of the text ends it).
// The rules are blockSelectionRules.mjs. Exposes blockSelection.
import { toggle } from './blockSelectionRules.mjs';

export type BlockSelection = { places: number[]; version: number };

let snapshot: BlockSelection = { places: [], version: 0 };
let ours = false;
const listeners = new Set<() => void>();
const emit = (places: number[]) => {
  snapshot = { places, version: snapshot.version + 1 };
  listeners.forEach((listener) => listener());
};

export const blockSelection = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
  get: (): BlockSelection => snapshot,
  /** The selected places. */
  places: (): number[] => snapshot.places,
  set(next: number[]) {
    const now = snapshot.places;
    if (next.length === now.length && next.every((p, i) => p === now[i])) return;
    emit(next);
  },
  toggle(place: number) {
    blockSelection.set(toggle(snapshot.places, place));
  },
  clear() {
    blockSelection.set([]);
  },
  /** Tells the listeners the text under the selection changed (a block hidden, so Hide reads Show). */
  refresh() {
    if (snapshot.places.length) emit(snapshot.places);
  },
  /** Runs a change of the text that the selection makes itself. */
  own(change: () => void) {
    ours = true;
    try {
      change();
    } finally {
      ours = false;
    }
  },
  owned: () => ours,
};
