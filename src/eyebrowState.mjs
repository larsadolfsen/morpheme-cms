// Labels in the editor's document: a label is one line of plain text on any top-level line (a label above a heading or a block is
// the most common). Enter in a label goes to the next line (enterInLabel; used by src/eyebrow.mjs), and the label row of the Text
// style menu has its state and command (canLabel, labelledHeading, hasLabel, toggleLabel). Only ProseMirror's state; no Milkdown, no browser.
import { TextSelection } from '@milkdown/kit/prose/state';

/** Enter in a label: the cursor goes to the start of the heading after it, as a label is one line; with no heading after it
 * the line below is a new paragraph.
 * @type {import('@milkdown/kit/prose/state').Command} */
export const enterInLabel = (state, dispatch) => {
  const { $from } = state.selection;
  if ($from.parent.type.name !== 'eyebrow') return false;
  if (dispatch) {
    const after = $from.after();
    const next = state.doc.nodeAt(after);
    if (next?.type.name === 'heading') return (dispatch(state.tr.setSelection(TextSelection.create(state.doc, after + 1))), true);
    const tr = state.tr.insert(after, state.schema.nodes.paragraph.create());
    dispatch(tr.setSelection(TextSelection.create(tr.doc, after + 1)).scrollIntoView());
  }
  return true;
};

const LINES = ['paragraph', 'bodyLarge', 'bodyMedium', 'bodySmall'];

/** Whether Label is a style of the line under the cursor: a plain line or a label at the top of the text (not in a list or a
 * quote), or a heading (which gets a label above it). @param {import('@milkdown/kit/prose/state').EditorState} state */
export function canLabel(state) {
  const { $from } = state.selection;
  return (
    $from.depth === 1 &&
    ($from.parent.type.name === 'heading' || $from.parent.type.name === 'eyebrow' || LINES.includes($from.parent.type.name))
  );
}

/** The heading the label button is for: the one the cursor is in, or the one after the label it is in, at the top of
 * the text; null elsewhere. @param {import('@milkdown/kit/prose/state').EditorState} state
 * @returns {{ pos: number, level: number } | null} */
export function labelledHeading(state) {
  const { $from } = state.selection;
  if ($from.depth !== 1) return null;
  const block = $from.parent;
  const at = $from.before(1);
  if (block.type.name === 'heading') return { pos: at, level: block.attrs.level };
  if (block.type.name !== 'eyebrow') return null;
  const next = state.doc.nodeAt(at + block.nodeSize);
  return next?.type.name === 'heading' ? { pos: at + block.nodeSize, level: next.attrs.level } : null;
}

// The position of the label right before the heading at pos, or null.
const labelBefore = (state, pos) => {
  const before = state.doc.resolve(pos).nodeBefore;
  return before?.type.name === 'eyebrow' ? pos - before.nodeSize : null;
};

/** Whether the heading the label button is for has a label. @param {import('@milkdown/kit/prose/state').EditorState} state */
export function hasLabel(state) {
  const heading = labelledHeading(state);
  return !!heading && labelBefore(state, heading.pos) !== null;
}

/** The Label row: in a heading, an empty label above it (or the heading's label taken away); in a plain line, the line made a
 * label (marks and line breaks go); in a label, the label made a plain line again (its text stays).
 * @param {{ state: import('@milkdown/kit/prose/state').EditorState, dispatch: (tr: import('@milkdown/kit/prose/state').Transaction) => void }} view */
export function toggleLabel(view) {
  const { state } = view;
  if (!canLabel(state)) return;
  const { $from } = state.selection;
  const { nodes } = state.schema;
  const line = $from.parent;
  if (line.type.name !== 'heading') {
    const at = $from.before();
    const to =
      line.type.name === 'eyebrow'
        ? nodes.paragraph.create(null, line.content)
        : nodes.eyebrow.create(null, line.textContent ? state.schema.text(line.textContent) : null);
    const tr = state.tr.replaceWith(at, at + line.nodeSize, to);
    return view.dispatch(
      tr.setSelection(TextSelection.create(tr.doc, at + 1 + Math.min($from.parentOffset, to.content.size))).scrollIntoView(),
    );
  }
  const heading = labelledHeading(state);
  if (!heading) return;
  const label = labelBefore(state, heading.pos);
  if (label !== null) return view.dispatch(state.tr.delete(label, heading.pos));
  const tr = state.tr.insert(heading.pos, nodes.eyebrow.create());
  view.dispatch(tr.setSelection(TextSelection.create(tr.doc, heading.pos + 1)).scrollIntoView());
}
