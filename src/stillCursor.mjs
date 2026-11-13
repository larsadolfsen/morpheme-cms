// The word at a cursor that has stood still, for the menu over a text (selectionMenu in MarkdownEditor.tsx): how long
// the cursor waits (STILL_MS) and the word around it as positions in the document (wordRange). Depends on
// lib/word-at.mjs and ProseMirror's state.
import { wordAt } from '../lib/word-at.mjs';

/** How long the cursor stands still in a word before the menu appears, in ms. */
export const STILL_MS = 700;

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
