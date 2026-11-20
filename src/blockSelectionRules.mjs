/**
 * What selecting several blocks of a page decides, as plain functions: which blocks are selected (their places at the top level of the text),
 * what Hide or Show does to a mix of shown and hidden blocks, and which blocks a Remove or a Hide must leave alone (a block the template locks, or
 * the last shown one of a block the page must have: `stays`). Exposes `toggle`, `range`, `allOf`, `hideChoice` and `removeChoice`.
 * Used by MarkdownEditor.tsx (the page's blocks) through blockSelection.ts. Tested in blockSelectionRules.test.mjs.
 */

/** The places with `place` added, or taken out when it is there, in the order of the text. */
export function toggle(places, place) {
  return places.includes(place) ? places.filter((p) => p !== place) : [...places, place].sort((a, b) => a - b);
}

/** The places with every block from `from` to `to` (either way round) added; `blocks`: the places of all the blocks, in order. Without a known `from`, only `to`. */
export function range(places, blocks, from, to) {
  const b = blocks.indexOf(to);
  if (b < 0) return places;
  const a = blocks.indexOf(from);
  const [first, last] = a < 0 ? [b, b] : [Math.min(a, b), Math.max(a, b)];
  return [...new Set([...places, ...blocks.slice(first, last + 1)])].sort((x, y) => x - y);
}

/** Every block (select all). */
export const allOf = (blocks) => [...blocks];

/**
 * Hide or Show for the selected blocks. If any selected block is shown the action is Hide and hides all of them; when every one is hidden it is Show
 * and shows all. A block that stays shown is skipped (and named by the caller).
 * @param {{ place: number, hidden: boolean, stays: boolean }[]} blocks the selected blocks
 * @returns {{ action: 'hide' | 'show', targets: number[], skipped: number[] }}
 */
export function hideChoice(blocks) {
  const hide = blocks.some((b) => !b.hidden);
  if (!hide) return { action: 'show', targets: blocks.map((b) => b.place), skipped: [] };
  return {
    action: 'hide',
    targets: blocks.filter((b) => !b.hidden && !b.stays).map((b) => b.place),
    skipped: blocks.filter((b) => !b.hidden && b.stays).map((b) => b.place),
  };
}

/**
 * Remove for the selected blocks: those that may go, and those that stay (named by the caller, and still selected).
 * @param {{ place: number, stays: boolean }[]} blocks the selected blocks
 */
export function removeChoice(blocks) {
  return { targets: blocks.filter((b) => !b.stays).map((b) => b.place), skipped: blocks.filter((b) => b.stays).map((b) => b.place) };
}

/**
 * Where the selected blocks go when they move one place together (Move up, Move down): they must be next to each other (only free lines between), and
 * the part they move past must exist and not be locked by the template. The part moves to the other side of them; the order of the selected blocks stays.
 * @param {{ gap: boolean, locked: boolean }[]} parts every part at the top level of the text, by its index (`gap`: a free line)
 * @param {number[]} places the selected places, in order
 * @param {-1 | 1} by -1 up, 1 down
 * @returns {{ ok: true, first: number, last: number, past: number, places: number[] } | { ok: false, why: 'apart' | 'edge' | 'locked' }}
 *   `first`..`last`: the span the selection covers; `past`: the part it moves past; `places`: the selected places afterwards
 */
export function groupMove(parts, places, by) {
  const first = places[0];
  const last = places[places.length - 1];
  for (let i = first; i <= last; i++) if (!places.includes(i) && !parts[i]?.gap) return { ok: false, why: 'apart' };
  let past = (by < 0 ? first : last) + by;
  while (parts[past]?.gap) past += by;
  if (!parts[past]) return { ok: false, why: 'edge' };
  if (parts[past].locked) return { ok: false, why: 'locked' };
  const shift = by < 0 ? past - first : past - last;
  return { ok: true, first, last, past, places: places.map((p) => p + shift) };
}
