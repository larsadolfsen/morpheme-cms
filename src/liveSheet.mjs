// The live side sheet from expanded (BlockDialog.tsx, MarkdownEditor.tsx; spec 2026-11-14 one Save, 4.1 and 4.4): each change of a block's
// fields is written to the block at once, and the sheet follows the block through Undo and Redo.
// - sheetSteps(): which changes are one undo step. Changes to one text field while it has the focus are one step; a pick (a switch, a
//   choice, an image) is a step of its own; leaving the sheet ends the step.
// - stepOf(tr, step): marks a transaction with its step for the editor's history (closeHistory before a new one; one group id after).
// - mapRange(range, mapping): where the block is after a change of the document, null when it is gone (its insert undone).
// Depends on ProseMirror's history only; no React, no browser.
import { closeHistory } from '@milkdown/kit/prose/history';

// The history merges the transactions with one `composition` id into one step, however long apart they are. The view counts its own
// compositions (typing with an input method) up from 1; the sheet's ids start far above them.
let lastGroup = 2 ** 30;

/** The undo steps of one open sheet.
 * @returns {{ change: (field: object | null) => { fresh: boolean, group: number }, end: () => void }} */
export function sheetSteps() {
  /** @type {object | null} */
  let field = null;
  let group = 0;
  return {
    /** Before a change: `field` is the text field it is typed in (any object that stands for it), null for a pick. fresh: it starts a new step. */
    change(at) {
      if (at && at === field) return { fresh: false, group };
      field = at ?? null;
      group = ++lastGroup;
      return { fresh: true, group };
    },
    /** The focus has left the sheet, or it has closed: the next change is a new step. */
    end() {
      field = null;
    },
  };
}

/** The transaction with its undo step: a fresh step closes the one before (closeHistory), and every change of one step has its group.
 * @template {import('@milkdown/kit/prose/state').Transaction} T @param {T} tr @param {{ fresh: boolean, group: number }} step @returns {T} */
export function stepOf(tr, step) {
  if (step.fresh) closeHistory(tr);
  return /** @type {T} */ (tr.setMeta('composition', step.group));
}

/** Where a node is after a change: its start and end mapped, null when nothing is left of it (removed, or the whole text replaced).
 * A node changed in place (setNodeMarkup) keeps its range; text put in just before it moves it, text put in just after it does not.
 * @param {{ from: number, to: number }} range @param {{ map: (pos: number, assoc?: number) => number }} mapping
 * @returns {{ from: number, to: number } | null} */
export function mapRange(range, mapping) {
  const from = mapping.map(range.from, 1);
  const to = mapping.map(range.to, -1);
  return from < to ? { from, to } : null;
}
