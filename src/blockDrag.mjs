/**
 * What dragging a block by its handle decides, apart from the browser: how many places a block moves for where the finger is, and how
 * far it may go (not past a block the template locks). "Places" are the parts of the text at the top level (a block, or a paragraph
 * with an image), not the free lines between them. Exposes `dragSteps` and `limitSteps`.
 * Used by MarkdownEditor.tsx (blockHandle). Tested in blockDrag.test.mjs.
 */

/**
 * The places the dragged part moves, down (positive) or up (negative): the others whose centre is above the finger are before it.
 * @param {number[]} centres the vertical centre of each part, top to bottom (the dragged part's own too)
 * @param {number} self the dragged part's index
 * @param {number} y the finger's vertical place
 */
export function dragSteps(centres, self, y) {
  const above = centres.filter((c, k) => k !== self && c < y).length;
  return above - self;
}

/**
 * The places it may move: stops before the first locked part it would pass (a block the template locks stays where it is).
 * @param {boolean[]} locked for each part, whether it is a locked block
 * @param {number} self the dragged part's index
 * @param {number} steps the places wanted (positive down)
 */
export function limitSteps(locked, self, steps) {
  const by = Math.sign(steps);
  for (let n = 1; n <= Math.abs(steps); n++) if (locked[self + by * n]) return by * (n - 1);
  return steps;
}
