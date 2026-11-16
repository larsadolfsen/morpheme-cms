// What CI decides from a pull request's diff (.github/workflows/check.yml, jobs `changes` and `check`; skill checks, "What CI runs").
// Depends on node:process only; tested by scripts/ci-changes.test.mjs.
//   node scripts/ci-changes.mjs docs-only <head ref>   reads the changed paths (one per line) on stdin and prints docs_only=true|false
//   node scripts/ci-changes.mjs classify <head ref>    the same, and also starter_demo=true|false (whether `starter` and `demo` must run)
//   node scripts/ci-changes.mjs verdict <docs_only> [<starter_demo>]  reads `needs` (JSON, as Actions gives it) on stdin; exits 1 when `check` must be red
import { argv, stdin, exit } from 'node:process';

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
 *  - other workflows (publish.yml, staging-follows-next.yml) and staging-watcher/: not run by Check, not imported by the package.
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
  /^\.github\/workflows\/(publish|staging-follows-next)\.yml$/,
  /^staging-watcher\/.+/,
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

/** The jobs that are skipped on a docs-only pull request. `static` and `changes` always run. */
export const HEAVY = ['screens', 'screens-extra', 'demo', 'starter'];
/** The heavy jobs that are also skipped when no changed file can affect them (needsStarterDemo is false). */
export const FILTERED = ['demo', 'starter'];

/**
 * The problems that make the job `check` red: empty means green. A job that ran must be green. A heavy job is skipped on a
 * docs-only pull request, and `demo` and `starter` also when starterDemo is false (the filter above); any other skip, and a
 * cancelled job, is red.
 * @param {Record<string, {result?: string}>} needs
 * @param {boolean} docsOnly
 * @param {boolean} [starterDemo] whether `starter` and `demo` had to run
 * @returns {string[]}
 */
export function verdict(needs, docsOnly, starterDemo = true) {
  const problems = [];
  const result = (name) => needs?.[name]?.result;
  for (const name of ['changes', 'static']) {
    if (result(name) !== 'success') problems.push(`${name}: ${result(name) ?? 'missing'}, must be success`);
  }
  for (const name of HEAVY) {
    const r = result(name);
    const skip = docsOnly || (FILTERED.includes(name) && !starterDemo);
    const expected = skip ? 'skipped' : 'success';
    if (r !== expected) problems.push(`${name}: ${r ?? 'missing'}, must be ${expected}`);
  }
  return problems;
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
  } else if (mode === 'verdict') {
    const problems = verdict(JSON.parse(input), arg === 'true', argv[4] !== 'false');
    for (const p of problems) console.log(`FAIL ${p}`);
    if (problems.length) exit(1);
    console.log(
      arg === 'true'
        ? 'Green: docs-only pull request, heavy jobs skipped on purpose.'
        : argv[4] === 'false'
          ? 'Green: starter and demo skipped on purpose (no changed file can affect them), every other job passed.'
          : 'Green: every job passed.',
    );
  } else {
    console.error('usage: ci-changes.mjs docs-only|classify <head ref> | verdict <docs_only> [<starter_demo>]');
    exit(2);
  }
}
