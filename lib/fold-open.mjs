// Which of a form's folding sections are open (formSections.ts): pure, so it is tested (fold-open.test.mjs). Exposes
// withOpen and onlyFirst. No dependencies.

/**
 * The sections open after one is opened: beside the others, or with `single` (one open at a time) in their place.
 * @template T
 * @param {ReadonlySet<T>} open
 * @param {T} id
 * @param {boolean} single
 * @returns {ReadonlySet<T>}
 */
export const withOpen = (open, id, single) => (single ? new Set([id]) : open.has(id) ? open : new Set([...open, id]));

/**
 * Only the first of the open sections, in the form's order (`order`), when more are open (the window narrowed to one at a
 * time); else the same.
 * @template T
 * @param {ReadonlySet<T>} open
 * @param {T[]} order
 * @returns {ReadonlySet<T>}
 */
export const onlyFirst = (open, order) => (open.size > 1 ? new Set(order.filter((id) => open.has(id)).slice(0, 1)) : open);
