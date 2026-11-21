// A theme's accessibility statement (spec 2026-11-21-theme-accessibility-statement-design.md, 0.19.5 batch 11).
// A theme may fall short of WCAG 2.2 AA; it says where in `accessibility.json`, next to its `theme.json` (`theme/accessibility.json` for Material):
//
//   { "standard": "WCAG 2.2 AA",
//     "fallsShort": [ { "criterion": "1.4.3", "part": "placeholder", "why": "Material 3: a placeholder is 60% of its on-colour" } ] }
//
// No file, or an empty `fallsShort`, means the theme meets the standard. The format is fixed so the editor's theme page (batch 12) can read it: `readStatement`
// gives `{ standard, fallsShort }` and `PARTS` the label of each part. The checks (`check:contrast`, `check:screens`, `check:a11y`, `check:announce`)
// let a failure through only when the theme in use names its criterion and part here (`judgeShortfalls`); an unnamed failure fails, and so does an entry its check
// no longer finds. A part is one of `PARTS`: a new part is added there (with the criterion it is judged by and the checks that measure it) in the pull request
// that first needs it, so a statement can name nothing a check cannot see.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const STANDARD = 'WCAG 2.2 AA';
export const STATEMENT_FILE = 'accessibility.json';

/**
 * The parts a theme can name. `criterion`: the WCAG success criterion; `label`: the part's name for a person (batch 12 lists it with the criterion);
 * `checks`: the checks that measure the part, in whole, so each of them can tell that an entry is stale (`check:screens` only lets a named part through, as its units
 * run in shards and none sees the whole theme).
 * @type {Record<string, { criterion: string, label: string, checks: Array<'contrast' | 'a11y' | 'announce'> }>}
 */
export const PARTS = {
  placeholder: { criterion: '1.4.3', label: 'Placeholder text contrast', checks: ['contrast'] },
  'outlined-card-edge': { criterion: '1.4.11', label: 'Outlined card edge contrast', checks: ['contrast'] },
  'section-edges': { criterion: '1.4.11', label: 'Edges in a coloured section contrast', checks: ['contrast'] },
};

/** What is wrong in a statement, as lines to print (empty when it is right). @param {any} data */
export function statementProblems(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return [`${STATEMENT_FILE}: must be an object.`];
  const problems = [];
  for (const key of Object.keys(data))
    if (!['standard', 'fallsShort'].includes(key)) problems.push(`${STATEMENT_FILE}: "${key}" is not a field (standard, fallsShort).`);
  if (data.standard !== STANDARD) problems.push(`${STATEMENT_FILE}: "standard" must be ${JSON.stringify(STANDARD)}.`);
  if (!Array.isArray(data.fallsShort))
    return [...problems, `${STATEMENT_FILE}: "fallsShort" must be a list (empty when the theme meets the standard).`];
  const seen = new Set();
  data.fallsShort.forEach((entry, i) => {
    const at = `${STATEMENT_FILE}: fallsShort[${i}]`;
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return void problems.push(`${at} must be an object.`);
    for (const key of Object.keys(entry))
      if (!['criterion', 'part', 'why'].includes(key)) problems.push(`${at}: "${key}" is not a field (criterion, part, why).`);
    const part = PARTS[entry.part];
    if (!part) return void problems.push(`${at}: "part" ${JSON.stringify(entry.part)} is not one of ${Object.keys(PARTS).join(', ')}.`);
    if (entry.criterion !== part.criterion)
      problems.push(`${at}: the part "${entry.part}" is judged by criterion ${part.criterion}, not ${JSON.stringify(entry.criterion)}.`);
    if (typeof entry.why !== 'string' || !entry.why.trim()) problems.push(`${at}: "why" must say why the theme falls short.`);
    const id = `${entry.criterion} ${entry.part}`;
    if (seen.has(id)) problems.push(`${at}: ${id} is named twice.`);
    seen.add(id);
  });
  return problems;
}

/** The statement of the theme in `folder`: `{ standard, fallsShort }`; a theme with no file meets the standard. Throws with the lines of `statementProblems` when it is wrong.
 * @param {string} folder @returns {{ standard: string, fallsShort: Array<{ criterion: string, part: string, why: string }> }} */
export function readStatement(folder) {
  const file = join(folder, STATEMENT_FILE);
  if (!existsSync(file)) return { standard: STANDARD, fallsShort: [] };
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`${file}: ${e.message}`);
  }
  const problems = statementProblems(data);
  if (problems.length) throw new Error(`${file}:\n${problems.join('\n')}`);
  return data;
}

const idOf = (criterion, part) => `${criterion} ${part}`;

/**
 * What a check does with what it found. A finding is `{ criterion, part, detail }` (`part` is null for a failure no part names). One the statement names is let
 * through; the rest are problems. With `stale`, an entry a check measures in whole (`PARTS[part].checks` holds `check`) that found nothing is a problem too, so the
 * list is never longer than the truth.
 * @param {Array<{ criterion: string, part: string | null, detail: string }>} findings
 * @param {{ fallsShort: Array<{ criterion: string, part: string }> }} statement
 * @param {{ check: string, stale?: boolean, where?: string }} options `where`: the statement's place for the messages (`theme/accessibility.json`)
 * @returns {{ problems: string[], named: string[] }}
 */
export function judgeShortfalls(findings, statement, { check, stale = true, where = STATEMENT_FILE }) {
  const named = new Map(statement.fallsShort.map((e) => [idOf(e.criterion, e.part), e]));
  const hit = new Set();
  const problems = [];
  const letThrough = new Set();
  for (const f of findings) {
    const id = f.part ? idOf(f.criterion, f.part) : null;
    if (id && named.has(id)) {
      hit.add(id);
      letThrough.add(id);
    } else
      problems.push(
        f.part
          ? `${check}: ${f.detail}: falls short of ${f.criterion} (${f.part}) and ${where} does not name it. Fix it, or name it there with its reason.`
          : f.detail,
      );
  }
  if (stale)
    for (const [id, e] of named)
      if (PARTS[e.part]?.checks.includes(check) && !hit.has(id))
        problems.push(`${check}: ${where} names ${id}, which no longer fails. Remove it from ${where}.`);
  return { problems, named: [...letThrough] };
}
