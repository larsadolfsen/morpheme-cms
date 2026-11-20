// The searches run in the command palette (Search view), kept in this browser only (src/paletteRecent.ts): the rules, pure.
// M3 (search, guidelines): "Show historical suggestions before typing". Exposes SEARCHES_KEPT, SEARCHES_SHOWN, readSearches, pushSearch,
// removeSearch, searchesShown.

/** How many searches are kept, and how many the empty view shows. */
export const SEARCHES_KEPT = 8;
export const SEARCHES_SHOWN = 5;

/** A query as it is kept: trimmed, one space between words. */
const clean = (query) => String(query).trim().replace(/\s+/g, ' ');

/**
 * Reads a stored value as the list of searches, newest first; anything broken is an empty list.
 * @param {unknown} value
 * @returns {string[]}
 */
export function readSearches(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const v of value) {
    const q = typeof v === 'string' ? clean(v) : '';
    if (q && !out.some((x) => x.toLowerCase() === q.toLowerCase())) out.push(q);
  }
  return out.slice(0, SEARCHES_KEPT);
}

/**
 * The list after a search is run: the query first (once, whatever its case), the last 8 kept; an empty query changes nothing.
 * @param {string[]} list
 * @param {string} query
 * @returns {string[]}
 */
export function pushSearch(list, query) {
  const q = clean(query);
  if (!q) return list;
  return [q, ...list.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, SEARCHES_KEPT);
}

/**
 * The list without one search.
 * @param {string[]} list
 * @param {string} query
 * @returns {string[]}
 */
export function removeSearch(list, query) {
  const q = clean(query).toLowerCase();
  return list.filter((x) => x.toLowerCase() !== q);
}

/**
 * The searches the empty view shows: newest first, at most 5.
 * @param {string[]} list
 * @returns {string[]}
 */
export function searchesShown(list) {
  return list.slice(0, SEARCHES_SHOWN);
}
