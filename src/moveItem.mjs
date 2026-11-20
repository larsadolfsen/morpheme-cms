// The list as it is when the item at `from` is moved to `to` (the two swap places), for the arrows of a list's rows
// (MoveButtons.tsx). Exposes movedList. No dependencies.

/**
 * A copy of the list with the items at `from` and `to` swapped; the list itself when either place is not in it.
 * @template T
 * @param {T[]} list
 * @param {number} from
 * @param {number} to
 * @returns {T[]}
 */
export function movedList(list, from, to) {
  if (!(from in list) || !(to in list)) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
