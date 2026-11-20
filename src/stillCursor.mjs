// The word around the cursor as positions in the document (wordRange). Depends on
// lib/word-at.mjs and ProseMirror's state.
import { wordAt } from '../lib/word-at.mjs';

/** The word around the cursor as positions in the document, or null (a selection, or no word there).
 * @param {import('@milkdown/kit/prose/state').EditorState} state @returns {{ from: number, to: number } | null} */
export function wordRange(state) {
  const { $from, empty } = state.selection;
  const block = $from.parent;
  if (!empty || !block.isTextblock) return null;
  // One character for each image or line break, so a place in the text is the same place in the block.
  const word = wordAt(block.textBetween(0, block.content.size, undefined, '￼'), $from.parentOffset);
  const start = $from.start();
  return word && { from: start + word.from, to: start + word.to };
}
