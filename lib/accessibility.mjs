// Themes are classified, not tested, for accessibility (spec 2026-11-25-themes-classified-design.md, 0.19.8 task 17; owner, 25 and 26 Nov 2026).
//
// Every accessibility finding of `check:contrast`, `check:a11y`, `check:announce`, `check:keyboard` and the `check:screens` units is one of three kinds, and
// `kindOf` here is the one rule that says which:
//   theme value  target size, text spacing, resize, reflow (by WCAG criterion; `target-size`, `link-in-text-block` by axe rule): measured into the theme's
//                score, printed, never a failure.
//   colour       contrast of text and of non-text parts (1.4.3, 1.4.11; `color-contrast`): the site's colours are the owner's, chosen in the colour editor
//                (`src/Colors.tsx`), which is responsible for contrast (owner, 26 Nov 2026), so a theme writes none. Printed on the demo's colours, never a failure,
//                and in no theme's score.
//   our code     everything else (keyboard, a focus ring at all, names, roles, states): a failure on every theme. A finding the table does not place
//                is our code, so nothing slips through as a theme value by accident.
//
// A theme's statement is `accessibility.json` next to its `theme.json` (`theme/accessibility.json` for Material), written by `morpheme accessibility`, never by hand:
//
//   { "standard": "WCAG 2.2 AA", "measured": "0.19.8", "score": 83,
//     "checks": [ { "criterion": "1.4.11", "part": "outlined-card-edge", "ok": false, "why": "Outlined card edge 1.6:1 against #fef7ff, under 3:1" } ] }
//
// A person may add a reason after the measured sentence (`"…; Material 3's outline-variant as printed"`); the command keeps it while the check stays as it is.
// No file, or a file in the old form (`fallsShort`), means the theme is not measured. `PARTS` is every part a theme value can be measured on, with its criterion
// and its label for the theme page; a part is added in the pull request that first measures it.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { scoreOf } from './score.mjs';

export const STANDARD = 'WCAG 2.2 AA';
export const STATEMENT_FILE = 'accessibility.json';

/** The id of the base theme (0.22.3, `specs/2026-11-21-base-theme-notes.md`), which is hard-checked for every finding, theme values included. Written here when it lands;
 * until then no theme is hard-checked for theme values. @type {string | null} */
export const BASE_THEME = null;

/**
 * The parts a theme value can be measured on. Target size (2.5.8, 24 px) is one check for each interactive part the theme styles, not one for the theme: `selector` finds the
 * part's controls (the scan gives a control the first part whose selector it sits in, so the order is the order of precedence); `criterion`: the WCAG success criterion;
 * `label`: the part's name for a person (the theme page lists it with the criterion). A part is added in the pull request that first measures it.
 * @type {Record<string, { criterion: string, label: string, selector: string, checks: Array<'contrast' | 'screens'> }>}
 */
const target = (label, selector) => ({ criterion: '2.5.8', label, selector, checks: ['contrast'] });
export const PARTS = {
  'segmented-button': target('Segmented button', '.mo-button-group'),
  'button-xsmall': target('Extra small button', '.mo-button.mo-is-xsmall'),
  'button-medium': target('Medium button', '.mo-button.mo-is-medium'),
  'button-large': target('Large button', '.mo-button.mo-is-large'),
  'button-xlarge': target('Extra large button', '.mo-button.mo-is-xlarge'),
  'button-small': target('Small button', '.mo-button, .mo-split-button'),
  'icon-button': target('Icon button', '.mo-icon-button'),
  fab: target('Floating action button', '.mo-fab, .mo-extended-fab'),
  chip: target('Chip', '.mo-chip'),
  switch: target('Switch', '.mo-switch'),
  checkbox: target('Checkbox', '.mo-checkbox'),
  'radio-button': target('Radio button', '.mo-radio-button'),
  'slider-handle': target('Slider handle', '.mo-slider'),
  'text-field': target('Text field', '.mo-text-field'),
  'menu-item': target('Menu item', '.mo-menu__item'),
  tab: target('Tab', '.mo-tabs__tab'),
  'list-item': target('List item', '.mo-list'),
  'carousel-control': target('Carousel control', '.mo-carousel'),
  'navigation-item': target('Navigation bar and rail item', '.mo-nav-bar__item, .mo-nav-rail__item'),
  'sheet-control': target('Sheet drag handle', '.mo-sheet__drag-handle'),
};

/** The WCAG criteria (2.2 AA) whose findings are theme values. */
export const THEME_CRITERIA = ['2.5.8', '1.4.12', '1.4.4', '1.4.10'];
/** The axe-core rules whose findings are theme values. */
export const THEME_RULES = ['target-size', 'link-in-text-block'];
/** The criteria and the axe rule whose findings are the site's colours, not the theme's. */
export const COLOUR_CRITERIA = ['1.4.3', '1.4.11'];
export const COLOUR_RULES = ['color-contrast'];

/**
 * Which kind a finding is: `theme` (a value of the theme), `colour` (the site's colours) or `code` (our code's behaviour). A finding has a WCAG `criterion`, an axe
 * `rule`, or both; one the lists do not place is `code`. With `theme` the id of the theme in use, the base theme (`BASE_THEME`) has nothing classified.
 * @param {{ criterion?: string | null, rule?: string | null }} finding @param {string | null} [theme]
 * @returns {'theme' | 'colour' | 'code'}
 */
export function kindOf(finding, theme = null) {
  if (BASE_THEME && theme === BASE_THEME) return 'code';
  if (finding.rule && COLOUR_RULES.includes(finding.rule)) return 'colour';
  if (finding.criterion && COLOUR_CRITERIA.includes(finding.criterion)) return 'colour';
  if (finding.rule && THEME_RULES.includes(finding.rule)) return 'theme';
  if (finding.criterion && THEME_CRITERIA.includes(finding.criterion)) return 'theme';
  return 'code';
}

/**
 * The findings that fail (our code) and those that are measured only (theme values and colours), by the one rule.
 * @template {{ criterion?: string | null, rule?: string | null }} F
 * @param {F[]} findings @param {string | null} [theme]
 * @returns {{ code: F[], theme: F[], colour: F[] }}
 */
export function splitByKind(findings, theme = null) {
  const out = { code: /** @type {F[]} */ ([]), theme: /** @type {F[]} */ ([]), colour: /** @type {F[]} */ ([]) };
  for (const f of findings) out[kindOf(f, theme)].push(f);
  return out;
}

/** What is wrong in a statement, as lines to print (empty when it is right). A file in the old form (`fallsShort`) is right: the theme is not measured until the
 * command writes it again. @param {any} data */
export function statementProblems(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return [`${STATEMENT_FILE}: must be an object.`];
  if (isLegacy(data)) return [];
  const problems = [];
  for (const key of Object.keys(data))
    if (!['standard', 'measured', 'score', 'checks'].includes(key))
      problems.push(`${STATEMENT_FILE}: "${key}" is not a field (standard, measured, score, checks).`);
  if (data.standard !== STANDARD) problems.push(`${STATEMENT_FILE}: "standard" must be ${JSON.stringify(STANDARD)}.`);
  if (typeof data.measured !== 'string' || !data.measured)
    problems.push(`${STATEMENT_FILE}: "measured" must be the CMS version it was measured with.`);
  if (!Array.isArray(data.checks)) return [...problems, `${STATEMENT_FILE}: "checks" must be a list.`];
  const seen = new Set();
  data.checks.forEach((entry, i) => {
    const at = `${STATEMENT_FILE}: checks[${i}]`;
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return void problems.push(`${at} must be an object.`);
    for (const key of Object.keys(entry))
      if (!['criterion', 'part', 'ok', 'why'].includes(key)) problems.push(`${at}: "${key}" is not a field (criterion, part, ok, why).`);
    const part = PARTS[entry.part];
    if (!part) return void problems.push(`${at}: "part" ${JSON.stringify(entry.part)} is not one of ${Object.keys(PARTS).join(', ')}.`);
    if (entry.criterion !== part.criterion)
      problems.push(`${at}: the part "${entry.part}" is judged by criterion ${part.criterion}, not ${JSON.stringify(entry.criterion)}.`);
    if (typeof entry.ok !== 'boolean') problems.push(`${at}: "ok" must be true or false.`);
    if (typeof entry.why !== 'string' || !entry.why.trim()) problems.push(`${at}: "why" must say what was measured.`);
    const id = `${entry.criterion} ${entry.part}`;
    if (seen.has(id)) problems.push(`${at}: ${id} is named twice.`);
    seen.add(id);
  });
  if (data.checks.length && data.score !== scoreOf(data.checks))
    problems.push(
      `${STATEMENT_FILE}: "score" is ${JSON.stringify(data.score)}, the checks give ${scoreOf(data.checks)}. Run morpheme accessibility.`,
    );
  return problems;
}

/** @param {any} data */
const isLegacy = (data) => Array.isArray(data?.fallsShort) && !('checks' in data);

/**
 * The statement of the theme in `folder`: `{ standard, measured, score, checks }`, or `null` when it has none (no file, or the old form): the theme is not measured.
 * Throws with the lines of `statementProblems` when the file is wrong.
 * @param {string} folder
 * @returns {{ standard: string, measured: string, score: number, checks: Array<{ criterion: string, part: string, ok: boolean, why: string }> } | null}
 */
export function readStatement(folder) {
  const file = join(folder, STATEMENT_FILE);
  if (!existsSync(file)) return null;
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`${file}: ${e.message}`);
  }
  const problems = statementProblems(data);
  if (problems.length) throw new Error(`${file}:\n${problems.join('\n')}`);
  return isLegacy(data) ? null : data;
}

/**
 * The checks a scan measured: one for each part, `ok` when every record of the part passed, `why` the worst one in a sentence with the numbers. A record is
 * `{ kind, ratio, min, part, manual }`; only the scan's `target` records, each with its `part`, are the theme's (contrast is the site's colours). Parts nothing measured have no check.
 * @param {Array<{ kind: string, ratio: number, min: number, part?: string, manual?: unknown }>} records
 * @returns {Array<{ criterion: string, part: string, ok: boolean, why: string }>}
 */
export function checksOf(records) {
  const worst = new Map();
  for (const r of records) {
    if (r.manual || r.kind !== 'target' || !r.part || !PARTS[r.part]) continue; // contrast records are the site's colours, not the theme's
    const margin = r.ratio / r.min;
    if (!worst.has(r.part) || margin < worst.get(r.part).margin) worst.set(r.part, { r, margin });
  }
  return Object.keys(PARTS)
    .filter((part) => worst.has(part))
    .map((part) => {
      const { r, margin } = worst.get(part);
      const ok = margin >= 1;
      return {
        criterion: PARTS[part].criterion,
        part,
        ok,
        why: `${PARTS[part].label} ${Math.round(r.ratio)} px, ${ok ? 'needs' : 'under'} ${r.min} px`,
      };
    });
}

/**
 * The statement the command writes: the measured checks with the reasons a person added to the file before kept while the check stays as it is (its measured
 * sentence is the same), and the score from `scoreOf`.
 * @param {Array<{ criterion: string, part: string, ok: boolean, why: string }>} measured
 * @param {{ checks: Array<{ criterion: string, part: string, ok: boolean, why: string }> } | null} before @param {string} version
 */
export function statementOfChecks(measured, before, version) {
  const checks = measured.map((c) => {
    const old = before?.checks.find((o) => o.criterion === c.criterion && o.part === c.part);
    return old && old.ok === c.ok && old.why.startsWith(`${c.why}; `) ? { ...c, why: old.why } : c;
  });
  return { standard: STANDARD, measured: version, score: scoreOf(checks), checks };
}

/** What the checks print of a theme: its score and the checks that did not pass, and one line when the file differs from what was measured.
 * @param {ReturnType<typeof statementOfChecks>} now @param {ReturnType<typeof readStatement>} file @param {string} [where] */
export function summaryLines(now, file, where = `theme/${STATEMENT_FILE}`) {
  const lines = [`  Accessibility score ${now.score} (${now.checks.filter((c) => c.ok).length} of ${now.checks.length} checks passed).`];
  for (const c of now.checks.filter((x) => !x.ok)) lines.push(`    ${c.criterion} ${PARTS[c.part].label}: ${c.why}`);
  if (!file || JSON.stringify(file.checks.map(stripReason)) !== JSON.stringify(now.checks.map(stripReason)) || file.score !== now.score)
    lines.push(`  ${where} is not what was measured: run morpheme accessibility`);
  return lines;
}

/** A check without the reason a person added after the measured sentence, and without the pixel count: the same page measures a few px apart on two machines (44 or 40 px for the small button), so the file is current while the part and its pass or fail are the same.
 * @param {{ criterion: string, part: string, ok: boolean, why: string }} c */
const stripReason = (c) => ({ criterion: c.criterion, part: c.part, ok: c.ok, why: c.why.split('; ')[0].replace(/ \d+ px,/, ' px,') });
