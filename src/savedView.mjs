// The view a list screen opens in, from what this browser stored last time (Library.tsx). Exposes viewOfSaved (pure).
// Only 'menu' is read as the menu; anything else, such as the old stored value 'liste' (Danish for list), is the list view. // language-ok

/**
 * @param {string | null | undefined} stored the value stored for the list
 * @returns {'list' | 'menu'}
 */
export const viewOfSaved = (stored) => (stored === 'menu' ? 'menu' : 'list');
