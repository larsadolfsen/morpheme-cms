// What CI decides from a pull request's diff (.github/workflows/check.yml, jobs `changes` and `check`; skill checks, "What CI runs").
// Depends on node:process only; tested by scripts/ci-changes.test.mjs.
//   node scripts/ci-changes.mjs docs-only <head ref>   reads the changed paths (one per line) on stdin and prints docs_only=true|false
//   node scripts/ci-changes.mjs classify <head ref> [<base>]  the same, and also starter_demo=true|false (whether `starter` and `demo` must run)
//                                                      level=feature|line|full (from the base branch; a feature/* head into a version line is full), and light=true|false (the feature and line levels: the light check)
//                                                      and areas=all|none|<area>,<area> (the screens areas the light check runs besides the core set; scripts/screens/support/areas.mjs)
//                                                      and format=all|changed (whether Prettier checks every file or only the changed ones; see formatScope)
//   node scripts/ci-changes.mjs verdict <docs_only> [<starter_demo> [<level: feature|line|full> [<run head sha> <current head sha>]]]  reads `needs` (JSON, as Actions gives it) on stdin; exits 1 when `check` must be red; prints cancelled=true and exits 0 when a newer push (the two head shas differ) cancelled the run
import { argv, stdin, exit } from 'node:process';
import { areasArg } from './screens/support/areas.mjs';

/** The Release PR (changesets into CHANGELOG.md and the version) always runs everything. */
export const RELEASE_BRANCH = 'changeset-release/main';

/**
 * What a docs-only pull request may touch. Each entry was checked against what the heavy jobs read (screens, screens-extra,
 * demo, starter): none of them reads these. `static` runs on every pull request, so it still reads them (check:language
 * scans docs/, .claude/ and the root notes; npm test reads docs/app-contract.md; Prettier ignores *.md).
 * Left out on purpose: release-notes/ (check:release-notes, the notes tests and the editor's bundled notes read it) and
 * CHANGELOG.md (src/bundledNotes.ts imports it into the editor build). Root notes are listed by name, so no new one is skipped by accident.
 */
const DOCS_ONLY = [/^\.claude\/skills\/.+/, /^docs\/.+/, /^\.changeset\/[^/]+\.md$/, /^(README|CLAUDE|AGENTS|SECURITY)\.md$/];

/**
 * Whether every changed path is docs-only. When in doubt, false: an empty list, a path that is not on the list, or the Release PR.
 * @param {string[]} paths
 * @param {string} [headRef]
 */
export function isDocsOnly(paths, headRef = '') {
  if (headRef === RELEASE_BRANCH) return false;
  const changed = paths.map((p) => p.trim()).filter(Boolean);
  if (changed.length === 0) return false;
  return changed.every((p) => !p.includes('..') && DOCS_ONLY.some((re) => re.test(p)));
}

/**
 * What `starter` and `demo` do not read, besides the docs-only paths. Both jobs work on the package as it ships: `starter` packs
 * it (npm pack, `files` in package.json) and installs it in a copy of starter/; `demo` builds the editor and the demo over the
 * starter (scripts/demo-build.mjs, wrangler.jsonc). So every path the package ships, package.json, package-lock.json, wrangler.jsonc
 * and the scripts they run (bin/morpheme.mjs, check-starter.mjs, starter.mjs, check-demo.mjs, demo-*.mjs, fixtures/ and every
 * script the commands list) are NOT here: they run the jobs. Each entry below was checked with grep to be read by neither job:
 *  - .claude/, .agents/ and .changeset/: agent skills and changeset files; nothing imports them.
 *  - other workflows (publish.yml): not run by Check, not imported by the package.
 *  - *.test.* files: only `npm test` (job `static`) runs them (an exception: scripts/ci-changes.test.mjs, see RUN_ALL).
 *  - the static-only checks `npm run check` runs by itself, which no script, command or module imports: check-language.mjs,
 *    check-phosphor.mjs, check-web.mjs, check-editor-colors.mjs, check-colors.mjs, check-colors.allow.mjs, check-css-values.mjs,
 *    check-css-values.allow.mjs, check-density.mjs and the allowlists phosphor-allowlist.json and web-allowlist.json.
 * Left out on purpose (they run both jobs): release-notes/ and CHANGELOG.md (bundled into the editor's build), the root config
 * files, every other file under scripts/, lib/fixtures/ and lib/sandbox/fixtures/ (only tests use them, but not proven here).
 */
const NO_STARTER_DEMO = [
  ...DOCS_ONLY,
  /^\.claude\/.+/,
  /^\.agents\/.+/,
  /^\.changeset\/.+/,
  /^\.github\/workflows\/(publish|cache-fill|daily-full)\.yml$/,
  /\.test\.(mjs|js|ts|tsx)$/,
  /^scripts\/(check-language|check-phosphor|check-web|check-editor-colors|check-colors|check-colors\.allow|check-css-values|check-css-values\.allow|check-density)\.mjs$/,
  /^scripts\/(phosphor|web)-allowlist\.json$/,
];

/** What always runs everything: the workflow and this classifier with its test (a mistake in them must not hide itself). */
const RUN_ALL = [/^\.github\/workflows\/check\.yml$/, /^scripts\/ci-changes(\.test)?\.mjs$/];

/**
 * Whether `starter` and `demo` must run. When in doubt, true: an empty list, the Release PR, a path that is not on the
 * NO_STARTER_DEMO list, or a path that has `..`. A docs-only pull request is false.
 * @param {string[]} paths
 * @param {string} [headRef]
 */
export function needsStarterDemo(paths, headRef = '') {
  if (headRef === RELEASE_BRANCH) return true;
  const changed = paths.map((p) => p.trim()).filter(Boolean);
  if (changed.length === 0) return true;
  if (changed.some((p) => RUN_ALL.some((re) => re.test(p)))) return true;
  return !changed.every((p) => !p.includes('..') && NO_STARTER_DEMO.some((re) => re.test(p)));
}

/** A version line's branch (`0.18`): its pull requests get the line check. */
const VERSION_LINE = /^0\.\d+$/;
/** A feature branch (`feature/css-split`): its pull requests get the feature check. */
const FEATURE_BRANCH = /^feature\/\S+$/;
/** The heavy jobs the feature level skips; the 8 `screens` shards still run. They run in full on a pull request into `main`. */
export const LIGHT_SKIPPED = ['screens-extra', 'demo', 'starter', 'starter-smoke'];
/**
 * The heavy jobs each level skips (plan A4). The line level runs `demo` and `starter-smoke` (the starter packs, builds, and the editor opens,
 * edits, saves and publishes on it) and skips the 4 `starter` shards and `screens-extra`; the full level runs everything but the smoke
 * test, which its 4 starter shards already contain.
 */
export const SKIPPED_AT = {
  feature: LIGHT_SKIPPED,
  line: ['screens-extra', 'starter'],
  full: ['starter-smoke'],
};

/** A level as `verdict` takes it: the word, or the old light flag (`true` is the feature level, `false` the full one). Unknown: full. */
const levelOf = (light) => (light === true ? 'feature' : light in SKIPPED_AT ? light : 'full');

/**
 * The check level of a pull request, from its base branch (plan 2026-11-18-build-and-check-speed.md):
 * `feature/**` -> `feature`, `0.*` version lines -> `line`, `main` -> `full`; the one exception: a pull request from a `feature/*` head
 * into a version line (the feature into its line, once) is `full`. When in doubt, `full`: an empty or unknown base,
 * the Release PR, or anything else, so everything runs.
 * @param {string} [base] the pull request's base branch
 * @param {string} [headRef]
 * @returns {'feature' | 'line' | 'full'}
 */
export function checkLevel(base = '', headRef = '') {
  if (headRef === RELEASE_BRANCH) return 'full';
  const b = String(base ?? '').trim();
  if (FEATURE_BRANCH.test(b) && b === base) return 'feature';
  if (VERSION_LINE.test(b) && b === base) return FEATURE_BRANCH.test(String(headRef ?? '')) ? 'full' : 'line';
  return 'full';
}

/**
 * Whether the pull request gets the light check (the `feature` and `line` levels). When in doubt, false: everything runs.
 * @param {string} [base] the pull request's base branch
 * @param {string} [headRef]
 */
export function isLight(base = '', headRef = '') {
  return checkLevel(base, headRef) !== 'full';
}

/**
 * The screens units a pull request runs, as `--areas` takes it: `all` (every unit: the full level, the Release PR, an empty diff, a path
 * no rule knows, or any error here) or the areas to run besides the core set (`none`: only the core set). The full level is always `all`.
 * @param {string[]} paths
 * @param {string} [base] the pull request's base branch
 * @param {string} [headRef]
 */
export function screensAreas(paths, base = '', headRef = '') {
  try {
    if (!isLight(base, headRef) || headRef === RELEASE_BRANCH) return 'all';
    return areasArg(paths.map((p) => p.trim()).filter(Boolean));
  } catch {
    return 'all';
  }
}

/**
 * What decides how Prettier formats: its settings, its ignore file and the packages (the version of Prettier and its plugins). A change to
 * one of these can change the result for files the pull request did not touch, so the whole repository is checked again.
 */
const FORMAT_SETTINGS = [
  /(^|\/)\.prettier(rc|ignore)/,
  /(^|\/)prettier\.config\./,
  /(^|\/)\.editorconfig$/,
  /^package(-lock)?\.json$/,
  /^\.github\/workflows\/check\.yml$/,
];

/**
 * What Prettier checks in the job `static`: `changed` (only the files the pull request changed against its base) at the light levels
 * (`feature`, `line`), `all` at the full level, for the Release PR, for a change to Prettier's settings or packages, for an empty diff
 * and on any error. When in doubt, `all`.
 * @param {string[]} paths
 * @param {string} [base] the pull request's base branch
 * @param {string} [headRef]
 * @returns {'all' | 'changed'}
 */
export function formatScope(paths, base = '', headRef = '') {
  try {
    if (!isLight(base, headRef) || headRef === RELEASE_BRANCH) return 'all';
    const changed = paths.map((p) => p.trim()).filter(Boolean);
    if (changed.length === 0 || changed.some((p) => p.includes('..'))) return 'all';
    return changed.some((p) => FORMAT_SETTINGS.some((re) => re.test(p))) ? 'all' : 'changed';
  } catch {
    return 'all';
  }
}

/** The jobs that are skipped on a docs-only pull request. `static` and `changes` always run. */
export const HEAVY = ['screens', 'screens-extra', 'm3-render', 'demo', 'starter', 'starter-smoke'];
/** The heavy jobs that are also skipped when no changed file can affect them (needsStarterDemo is false). */
export const FILTERED = ['demo', 'starter', 'starter-smoke'];

/**
 * The problems that make the job `check` red: empty means green. A job that ran must be green. A heavy job is skipped on a
 * docs-only pull request, and `demo` and `starter` also when starterDemo is false (the filter above); any other skip, and a
 * cancelled job, is red.
 * @param {Record<string, {result?: string}>} needs
 * @param {boolean} docsOnly
 * @param {boolean} [starterDemo] whether `starter` and `demo` had to run
 * @param {'feature'|'line'|'full'|boolean} [level] the check level (SKIPPED_AT says what it skips); `true` is the feature level, `false` or
 *   anything unknown the full one
 * @returns {string[]}
 */
export function verdict(needs, docsOnly, starterDemo = true, level = 'full') {
  const skipped = SKIPPED_AT[levelOf(level)];
  const problems = [];
  const result = (name) => needs?.[name]?.result;
  for (const name of ['changes', 'static']) {
    if (result(name) !== 'success') problems.push(`${name}: ${result(name) ?? 'missing'}, must be success`);
  }
  for (const name of HEAVY) {
    const r = result(name);
    const skip = docsOnly || skipped.includes(name) || (FILTERED.includes(name) && !starterDemo);
    const expected = skip ? 'skipped' : 'success';
    if (r !== expected) problems.push(`${name}: ${r ?? 'missing'}, must be ${expected}`);
  }
  // The release gate runs on the Release PR only (skipped elsewhere): a failed or cancelled gate is red. Absent in older `needs`: ignored.
  const gate = result('release-gate');
  if (gate !== undefined && gate !== 'success' && gate !== 'skipped')
    problems.push(`release-gate: ${gate}, must be success (or skipped outside the Release PR)`);
  return problems;
}

/**
 * Whether a newer push replaced this run's head. True only when both shas are known and differ; an empty or missing sha (a
 * failed lookup) is never "superseded", so when in doubt the run stays red.
 * @param {string} [runHead] github.event.pull_request.head.sha of this run
 * @param {string} [currentHead] the pull request's head sha now, as the API gives it
 */
export function isSuperseded(runHead = '', currentHead = '') {
  return Boolean(runHead && currentHead && runHead !== currentHead);
}

/**
 * What the job `check` reports. `cancelled` only when the run is really superseded by a newer push (isSuperseded) and some job is
 * cancelled and none failed (the jobs after a cancelled one are skipped, which is no problem of its own). Any other cancel (a
 * manual cancel, a lost runner, a timeout) on the current head, a failed job, or a failed head lookup is a `failure`.
 * @param {string} [runHead]
 * @param {string} [currentHead]
 * @returns {{state: 'success'|'cancelled'|'failure', problems: string[]}}
 */
export function outcome(needs, docsOnly, starterDemo = true, level = 'full', runHead = '', currentHead = '') {
  const problems = verdict(needs, docsOnly, starterDemo, level);
  if (!problems.length) return { state: 'success', problems };
  const results = Object.values(needs ?? {}).map((n) => n?.result);
  const cancelled = results.includes('cancelled') && !results.includes('failure') && isSuperseded(runHead, currentHead);
  return { state: cancelled ? 'cancelled' : 'failure', problems };
}

async function readStdin() {
  let text = '';
  for await (const chunk of stdin) text += chunk;
  return text;
}

if (import.meta.url === `file://${argv[1]}`) {
  const [mode, arg = ''] = argv.slice(2);
  const input = await readStdin();
  if (mode === 'docs-only') {
    console.log(`docs_only=${isDocsOnly(input.split('\n'), arg)}`);
  } else if (mode === 'classify') {
    const paths = input.split('\n');
    const docsOnly = isDocsOnly(paths, arg);
    console.log(`docs_only=${docsOnly}`);
    console.log(`starter_demo=${!docsOnly && needsStarterDemo(paths, arg)}`);
    console.log(`level=${checkLevel(argv[4] ?? '', arg)}`);
    console.log(`light=${isLight(argv[4] ?? '', arg)}`);
    console.log(`areas=${screensAreas(paths, argv[4] ?? '', arg)}`);
    console.log(`format=${formatScope(paths, argv[4] ?? '', arg)}`);
  } else if (mode === 'verdict') {
    const { state, problems } = outcome(
      JSON.parse(input),
      arg === 'true',
      argv[4] !== 'false',
      argv[5] === 'true' ? 'feature' : (argv[5] ?? 'full'),
      argv[6] ?? '',
      argv[7] ?? '',
    );
    if (state === 'cancelled') {
      console.log('cancelled=true');
      console.log(
        'Cancelled: a newer push superseded this run (its head is no longer the head of the pull request). Look at the newest head.',
      );
      exit(0);
    }
    for (const p of problems) console.log(`FAIL ${p}`);
    if (problems.length) exit(1);
    console.log(
      arg === 'true'
        ? 'Green: docs-only pull request, heavy jobs skipped on purpose.'
        : argv[5] === 'true' || argv[5] === 'feature' || argv[5] === 'line'
          ? 'Green: light check for a pull request into a version line or a feature branch (what its level skips runs when it is merged into main), every other job passed.'
          : argv[4] === 'false'
            ? 'Green: starter and demo skipped on purpose (no changed file can affect them), every other job passed.'
            : 'Green: every job passed.',
    );
  } else {
    console.error('usage: ci-changes.mjs docs-only|classify <head ref> [<base>] | verdict <docs_only> [<starter_demo> [<light>]]');
    exit(2);
  }
}
