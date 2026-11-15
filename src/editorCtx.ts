// What the text editor (MarkdownEditor.tsx) tells the command palette about where the user is, and how to give the focus back to the text: the registry's
// `Ctx` (src/actions.ts) is made of this and of the active block (blockBar.ts). Not remembered. Exposes editorCtx, useEditorCtx. No dependencies but React.
import { useSyncExternalStore } from 'react';

export type EditorCtx = {
  /** A text is open in the editor and no block is active (the text's actions apply). */
  text: boolean;
  /** The cursor is in a section (Section settings applies). */
  section: boolean;
  /** What applies where the cursor is (activeOf: strong, emphasis, link, h2, bullet, alignable …), sorted. */
  active: string[];
  /** The heading levels the text may have now: [1] while a page has no H1, then [2, 3]. */
  levels: number[];
};

const none: EditorCtx = { text: false, section: false, active: [], levels: [2, 3] };
let value = none;
let focus: (() => void) | null = null;
const listeners = new Set<() => void>();

const same = (a: EditorCtx, b: EditorCtx) =>
  a.text === b.text && a.section === b.section && a.active.join() === b.active.join() && a.levels.join() === b.levels.join();

export const editorCtx = {
  get: () => value,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
  /** The editor tells where the user is now. */
  set(next: EditorCtx) {
    if (same(value, next)) return;
    value = next;
    listeners.forEach((l) => l());
  },
  /** The editor goes: nothing applies. */
  clear() {
    if (value === none) return;
    value = none;
    focus = null;
    listeners.forEach((l) => l());
  },
  /** How the editor takes the focus back (its view's focus), for an action that runs after the palette has closed. */
  setFocus(fn: (() => void) | null) {
    focus = fn;
  },
  focus: () => focus?.(),
};

export const useEditorCtx = () => useSyncExternalStore(editorCtx.subscribe, editorCtx.get, () => none);
