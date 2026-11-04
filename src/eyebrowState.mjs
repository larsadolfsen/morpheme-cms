// Labels above headings in the editor's document: a label with no heading after it is loose (looseLabels), Enter in a
// label goes to its heading (enterInLabel; both used by src/eyebrow.mjs), and the label button's heading, state and
// command (labelledHeading, hasLabel, toggleLabel). Only ProseMirror's state; no Milkdown, no browser.
import { TextSelection } from '@milkdown/kit/prose/state';

/** The positions of the labels at the top of the text with no heading right after them.
 * @param {import('@milkdown/kit/prose/model').Node} doc @returns {number[]} */
export function looseLabels(doc) {
  /** @type {number[]} */
  const loose = [];
  doc.forEach((node, at, i) => {
    if (node.type.name === 'eyebrow' && doc.maybeChild(i + 1)?.type.name !== 'heading') loose.push(at);
  });
  return loose;
}

/** Enter in a label: the cursor goes to the start of its heading, as a label is one line.
 * @type {import('@milkdown/kit/prose/state').Command} */
export const enterInLabel = (state, dispatch) => {
  const { $from } = state.selection;
  if ($from.parent.type.name !== 'eyebrow') return false;
  dispatch?.(state.tr.setSelection(TextSelection.create(state.doc, $from.after() + 1)));
  return true;
};

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

/** The label button: an empty label above the heading, with the cursor in it, or the heading's label taken away.
 * @param {{ state: import('@milkdown/kit/prose/state').EditorState, dispatch: (tr: import('@milkdown/kit/prose/state').Transaction) => void }} view */
export function toggleLabel(view) {
  const { state } = view;
  const heading = labelledHeading(state);
  if (!heading) return;
  const label = labelBefore(state, heading.pos);
  if (label !== null) return view.dispatch(state.tr.delete(label, heading.pos));
  const tr = state.tr.insert(heading.pos, state.schema.nodes.eyebrow.create());
  view.dispatch(tr.setSelection(TextSelection.create(tr.doc, heading.pos + 1)).scrollIntoView());
}
