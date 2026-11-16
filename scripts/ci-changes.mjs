// What CI decides from a pull request's diff (.github/workflows/check.yml, jobs `changes` and `check`; skill checks, "What CI runs").
// Depends on node:process only; tested by scripts/ci-changes.test.mjs.
//   node scripts/ci-changes.mjs docs-only <head ref>   reads the changed paths (one per line) on stdin and prints docs_only=true|false
//   node scripts/ci-changes.mjs verdict <docs_only>    reads `needs` (JSON, as Actions gives it) on stdin; exits 1 when `check` must be red
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

/** The jobs that are skipped on a docs-only pull request. `static` and `changes` always run. */
export const HEAVY = ['screens', 'screens-extra', 'demo', 'starter'];

/**
 * The problems that make the job `check` red: empty means green. A job that ran must be green; a heavy job may be skipped only
 * on a docs-only pull request, and must not be skipped (or cancelled) on any other.
 * @param {Record<string, {result?: string}>} needs
 * @param {boolean} docsOnly
 * @returns {string[]}
 */
export function verdict(needs, docsOnly) {
  const problems = [];
  const result = (name) => needs?.[name]?.result;
  for (const name of ['changes', 'static']) {
    if (result(name) !== 'success') problems.push(`${name}: ${result(name) ?? 'missing'}, must be success`);
  }
  for (const name of HEAVY) {
    const r = result(name);
    const expected = docsOnly ? 'skipped' : 'success';
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
  } else if (mode === 'verdict') {
    const problems = verdict(JSON.parse(input), arg === 'true');
    for (const p of problems) console.log(`FAIL ${p}`);
    if (problems.length) exit(1);
    console.log(arg === 'true' ? 'Green: docs-only pull request, heavy jobs skipped on purpose.' : 'Green: every job passed.');
  } else {
    console.error('usage: ci-changes.mjs docs-only <head ref> | verdict <docs_only>');
    exit(2);
  }
}
