// The score of checks from 0 to 100: the share that is fine (100 with none). One function for the SEO rating of a page and the accessibility
// score of a theme (`scoreOf` in src/ui.tsx is this one, re-exported; `morpheme accessibility` imports it here because Node cannot read a .tsx file).
/** @param {Array<{ ok: boolean }>} items */
export const scoreOf = (items) => (items.length ? Math.round((items.filter((i) => i.ok).length / items.length) * 100) : 100);
