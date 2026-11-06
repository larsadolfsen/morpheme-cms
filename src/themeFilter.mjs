// The themes the Theme store lists for a search, a state filter and an order (pure).
// Exposes filterThemes(list, { query, state, sort, installed, compare }); used by ThemeStoreScreen.tsx.

/**
 * @template {{ id: string, name: string, words: string }} T
 * @param {T[]} list
 * @param {{ query: string, state: '' | 'installed' | 'notInstalled', sort: 'az' | 'za', installed: (id: string) => boolean, compare: (a: string, b: string) => number }} how
 * @returns {T[]}
 */
export function filterThemes(list, { query, state, sort, installed, compare }) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return list
    .filter((x) => words.every((w) => x.words.includes(w)))
    .filter((x) => !state || installed(x.id) === (state === 'installed'))
    .sort((a, b) => (sort === 'za' ? -1 : 1) * compare(a.name, b.name));
}
