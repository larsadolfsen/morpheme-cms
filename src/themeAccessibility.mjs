// A theme's accessibility statement, for its page in the editor: what its accessibility.json (next to its theme.json, the format of
// docs/superpowers/specs/2026-11-21-theme-accessibility-statement-design.md) says. No file: "unchecked"; no shortfalls: "meets";
// else "short", with each shortfall's part and criterion. The checks write and keep the file honest; this only reads it.

/** @typedef {{ criterion: string, part: string, why?: string }} Shortfall */

/**
 * @param {unknown} file The parsed accessibility.json, or undefined when the theme has none.
 * @returns {{ state: 'unchecked' | 'meets' | 'short', standard: string, shortfalls: Shortfall[] }}
 */
export function statementOf(file) {
  const f = file && typeof file === 'object' ? /** @type {Record<string, unknown>} */ (file) : undefined;
  if (!f) return { state: 'unchecked', standard: 'WCAG 2.2 AA', shortfalls: [] };
  const standard = typeof f.standard === 'string' && f.standard ? f.standard : 'WCAG 2.2 AA';
  const shortfalls = (Array.isArray(f.fallsShort) ? f.fallsShort : [])
    .filter((x) => x && typeof x.criterion === 'string' && typeof x.part === 'string')
    .map((x) => ({ criterion: x.criterion, part: x.part, ...(typeof x.why === 'string' ? { why: x.why } : {}) }));
  return { state: shortfalls.length ? 'short' : 'meets', standard, shortfalls };
}

/** A part's id as words, for a part the editor has no name for ("outlined-card-edge" → "Outlined card edge"). */
export const partWords = (part) => {
  const words = part.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};
