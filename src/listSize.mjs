// The size of the text of list items (lib/text-sizes.mjs): the mark textSize over the text of the items the selection touches, so a size
// picked in a list keeps the list. Pure ProseMirror, no browser: MarkdownEditor.tsx and the tests use it.

// The text of the list items the selection touches (the cursor: its own item's text): the range of each paragraph of them.
function listTextRanges(state) {
  const { from, to, empty, $from } = state.selection;
  const ranges = [];
  state.doc.nodesBetween(from, to, (node, pos, parent) => {
    if (node.isTextblock && parent?.type.name === 'list_item') ranges.push({ from: pos + 1, to: pos + 1 + node.content.size });
  });
  if (!ranges.length && empty && $from.parent.isTextblock) ranges.push({ from: $from.start(), to: $from.end() });
  return ranges;
}

/** The size ('small' or 'large') of the text of the list items the selection touches, or null: the first of them that has one.
 * @param {import('@milkdown/kit/prose/state').EditorState} state @returns {string | null} */
export function sizeOfList(state) {
  const type = state.schema.marks.textSize;
  if (!type) return null;
  let size = null;
  for (const range of listTextRanges(state))
    state.doc.nodesBetween(range.from, range.to, (n) => void (size ??= type.isInSet(n.marks)?.attrs.size ?? null));
  return size;
}

/** Gives the text of the list items the selection touches a size ('small', 'large'), or the plain size ('medium'): the list stays a list.
 * @param {import('@milkdown/kit/prose/view').EditorView} view @param {string} kind */
export function sizeListText(view, kind) {
  const { state } = view;
  const type = state.schema.marks.textSize;
  const tr = state.tr;
  for (const { from, to } of listTextRanges(state)) {
    tr.removeMark(from, to, type);
    if (kind !== 'medium' && to > from) tr.addMark(from, to, type.create({ size: kind }));
  }
  if (tr.docChanged) view.dispatch(tr);
}
