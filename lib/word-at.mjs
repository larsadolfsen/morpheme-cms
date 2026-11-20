// The word around a place in a line of text (the menu over a text at a still cursor, src/stillCursor.mjs): letters,
// digits, apostrophes and hyphens, without the apostrophes and hyphens at its ends. Exposes wordAt. No dependencies,
// no browser.

const IN_WORD = /[\p{L}\p{M}\p{N}_'’-]/u;
const LETTER = /[\p{L}\p{N}]/u;

/** The word `text` has at `offset` (a place between two characters), as offsets in `text`, or null when there is no
 * word on either side of it. wordAt('How saving works', 6) is { from: 4, to: 10 }. */
export function wordAt(text, offset) {
  const inWord = (i) => i >= 0 && i < text.length && IN_WORD.test(text[i]);
  if (!inWord(offset - 1) && !inWord(offset)) return null;
  let from = offset;
  let to = offset;
  while (inWord(from - 1)) from--;
  while (inWord(to)) to++;
  while (from < to && !LETTER.test(text[from])) from++;
  while (to > from && !LETTER.test(text[to - 1])) to--;
  return from < to ? { from, to } : null;
}
