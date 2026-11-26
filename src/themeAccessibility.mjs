// A theme's accessibility score, for its page in the editor and its card in the store: what its accessibility.json (next to its theme.json, written by
// `morpheme accessibility`, lib/accessibility.mjs) says. No file, or a file with no checks: "not measured"; else the score, the version of Morpheme that measured it and
// the checks, the failed ones first. The command writes the file; this only reads it, and never judges.
import { scoreOf } from '../lib/score.mjs';

/** @typedef {{ criterion: string, part: string, ok: boolean, why: string }} ThemeCheck */

/**
 * @param {unknown} file The parsed accessibility.json, or undefined when the theme has none.
 * @returns {{ state: 'unmeasured' } | { state: 'measured', standard: string, measured: string, score: number, checks: ThemeCheck[] }}
 */
export function statementOf(file) {
  const f = file && typeof file === 'object' ? /** @type {Record<string, unknown>} */ (file) : undefined;
  const checks = (Array.isArray(f?.checks) ? f.checks : [])
    .filter((x) => x && typeof x.criterion === 'string' && typeof x.part === 'string' && typeof x.ok === 'boolean')
    .map((x) => ({ criterion: x.criterion, part: x.part, ok: x.ok, why: typeof x.why === 'string' ? x.why : '' }));
  if (!f || !checks.length) return { state: 'unmeasured' };
  return {
    state: 'measured',
    standard: typeof f.standard === 'string' && f.standard ? f.standard : 'WCAG 2.2 AA',
    measured: typeof f.measured === 'string' ? f.measured : '',
    score: typeof f.score === 'number' ? f.score : scoreOf(checks),
    checks: [...checks.filter((c) => !c.ok), ...checks.filter((c) => c.ok)],
  };
}

/** A part's id as words, for a part the editor has no name for ("outlined-card-edge" → "Outlined card edge"). */
export const partWords = (part) => {
  const words = part.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** The score a store catalog entry shows on its card: the whole number from 0 to 100 the store keeps from `morpheme accessibility`, or `undefined` for an entry without one
 * (no ring is drawn: a theme not measured has no score, never a 0). @param {{ score?: unknown } | null | undefined} entry */
export function ringScoreOf(entry) {
  const s = entry?.score;
  return typeof s === 'number' && Number.isInteger(s) && s >= 0 && s <= 100 ? s : undefined;
}
