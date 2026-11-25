// The plan of `npm run check:fast`: from the changed paths, which checks run and which are skipped, and why (plan
// docs/superpowers/plans/2026-11-18-build-and-check-speed.md, A11; skill checks, "While you work"). Pure, no I/O: scripts/check-fast.mjs reads
// git and runs the plan; scripts/check-fast-plan.test.mjs tests it. It reuses the engines that decide CI's levels: `isDocsOnly` and
// `needsStarterDemo` (scripts/ci-changes.mjs) and `areasArg` (scripts/screens/support/areas.mjs, over lib/affected.mjs).
//
// WHEN IN DOUBT, RUN IT. A check leaves the plan only when every changed path is one the check cannot read (the lists below); an unknown
// path, an empty list, a path with `..`, a package or config file and any error give the full list. One exception, by the owner's brief
// ("no full run"): when the change reaches every screens area, the screens run the core set only and the plan says what it left to
// `npm run check:screens` and CI.
import { isDocsOnly, needsStarterDemo } from './ci-changes.mjs';
import { areasArg, RULES } from './screens/support/areas.mjs';
import { ruleFor } from '../lib/affected.mjs';

/** The folders `npm test` looks in (package.json "test"). */
export const TEST_FOLDERS = ['defaults', 'lib', 'scripts', 'site', 'src', 'theme', 'worker'];
const TEST_FILE = /\.test\.mjs$/;

/** Paths no static check reads: agent files, changesets, root notes. (`docs/` is read by language, token-names, css-tokens and density.) */
const NOTHING_READS = [/^\.claude\//, /^\.agents\//, /^\.changeset\//, /^(README|CLAUDE|AGENTS|SECURITY)\.md$/, /^LICENSE$/];

/** What each static check reads. A check runs unless every changed path is outside its list. `null`: always runs (it is quick and scans everything). */
const STATIC = [
  { name: 'check:language', reads: null },
  { name: 'check:token-names', reads: null }, // scans every tracked file for an old token name
  {
    name: 'check:css-tokens',
    reads: /\.(css|mjs|ts|tsx)$|^(docs\/css-tokens\.md|scripts\/css-tokens-allowlist\.json)$|^(starter|theme|src|demo)\//,
  },
  { name: 'check:density', reads: /\.(css|mjs)$|^(theme|docs)\// },
  { name: 'check:phosphor', reads: /^(src|theme|lib|pages|site|scripts\/check-phosphor\.mjs)/ },
  { name: 'check:web', reads: /^(src|theme|pages|lib|worker|starter|demo|scripts\/(check-web\.mjs|web-allowlist\.json))/ },
  { name: 'check:editor-colors', reads: /^(src\/(editor\.css|Inline\w*)|scripts\/check-editor-colors\.mjs|theme\/styles)/ },
  { name: 'check:color-roles', reads: /^(src\/[^/]*\.(css|tsx)|theme\/styles|defaults\/colors\.ts|scripts\/(check-)?color-roles)/ },
  { name: 'check:colors', reads: /^(src|theme|demo|starter|scripts\/check-colors)/ },
  { name: 'check:css-values', reads: /^(src|theme|demo|starter|scripts\/check-css-values)/ },
  { name: 'check:token-registry', reads: /^(theme\/styles\/tokens|scripts\/gen-token-registry\.mjs)/ },
  {
    name: 'check:release-notes',
    reads: /^(release-notes\/|CHANGELOG\.md$|src\/bundledNotes|scripts\/(check-release-notes|releases)\.mjs)/,
  },
];

/** What `tsc -p tsconfig.types.json` reads (its `include`, without tests), and the files that change what it does. */
const TYPES_READS =
  /^(astro\.mjs|tsconfig\.types\.json|package(-lock)?\.json|scripts\/releases\.mjs|(lib|site|src|theme)\/.+\.(mjs|d\.mts|d\.ts|ts|json))$/;

const clean = (paths) =>
  Array.isArray(paths)
    ? paths
        .map((p) =>
          String(p ?? '')
            .trim()
            .replace(/^\.\//, ''),
        )
        .filter(Boolean)
    : [];
/** A path the screens map (scripts/screens/support/areas.mjs) has no rule for: in doubt, every check reads it. */
const unknown = (p) => !ruleFor(p, RULES);
const unsafe = (p) => /(^|\/)\.\.(\/|$)/.test(p);

/**
 * The test files `npm test` must run for the changed paths: each changed test; every test in the folder of a changed source file; and
 * every test whose text names a changed path or file (so a doc or a data file a test reads selects that test). A path in no test
 * folder that no test names selects nothing; a package or config file, and anything unreadable, select `all`.
 * @param {string[]} paths
 * @param {string[]} testFiles every tracked `*.test.mjs` under TEST_FOLDERS
 * @param {(file: string) => string} readText
 * @returns {{ all: boolean, files: string[] }}
 */
export function selectTests(paths, testFiles, readText) {
  const changed = clean(paths);
  if (!changed.length || changed.some((p) => unsafe(p) || unknown(p))) return { all: true, files: [] };
  if (changed.some((p) => /^(package(-lock)?\.json|\.npmrc|tsconfig[\w.]*\.json)$/.test(p))) return { all: true, files: [] };
  const picked = new Set();
  const texts = new Map();
  const text = (f) => (texts.has(f) ? texts.get(f) : (texts.set(f, readText(f) ?? ''), texts.get(f)));
  for (const p of changed) {
    if (TEST_FILE.test(p) && testFiles.includes(p)) picked.add(p);
    const top = p.split('/')[0];
    if (TEST_FOLDERS.includes(top) && !TEST_FILE.test(p)) for (const f of testFiles) if (f.split('/')[0] === top) picked.add(f);
    const base = p.split('/').pop();
    for (const f of testFiles) if (!picked.has(f) && (text(f).includes(p) || (base.includes('.') && text(f).includes(base)))) picked.add(f);
  }
  return { all: false, files: [...picked].sort() };
}

/**
 * @param {string[]} paths the changed paths against the base branch (committed, staged, unstaged and untracked)
 * @param {{ testFiles?: string[], readText?: (file: string) => string, baseKnown?: boolean }} [env]
 *   `baseKnown: false` (no base branch found) gives the full list.
 * @returns {{ run: Array<{ id: string, command: string, why: string }>, skipped: Array<{ id: string, why: string }>, areas: string, all: boolean }}
 */
export function planFast(paths, env = {}) {
  const changed = clean(paths);
  const { testFiles = [], readText = () => '', baseKnown = true } = env;
  const doubt = !baseKnown || changed.length === 0 || changed.some(unsafe);
  const run = [];
  const skipped = [];
  const doRun = (id, command, why) => run.push({ id, command, why });
  const skip = (id, why) => skipped.push({ id, why });
  const reads = (re) => doubt || changed.some((p) => unknown(p) || (!NOTHING_READS.some((n) => n.test(p)) && re.test(p)));
  const why = doubt ? 'cannot tell what changed, so it runs' : 'a changed file can break it';

  doRun('format', 'prettier', doubt ? 'cannot tell what changed, so every file' : 'the changed files');
  for (const { name, reads: re } of STATIC) {
    if (re === null || reads(re)) doRun(name, `npm run ${name}`, re === null ? 'scans every tracked file' : why);
    else skip(name, 'no changed file is one it reads');
  }

  const tests = selectTests(doubt ? [] : changed, testFiles, readText);
  if (tests.all) doRun('npm test', 'npm test', doubt ? 'cannot tell what changed' : 'a package or config file changed');
  else if (tests.files.length)
    doRun('unit tests', `node --test ${tests.files.join(' ')}`, `${tests.files.length} test files next to or naming the changed files`);
  else skip('unit tests', 'no test is in the folder of, or names, a changed file');

  if (reads(TYPES_READS)) doRun('check:types', 'npm run check:types', why);
  else skip('check:types', 'no changed file is one tsc reads');

  const docsOnly = !doubt && isDocsOnly(changed);
  const buildNeeded = doubt || needsStarterDemo(changed);
  let areas = 'all';
  if (docsOnly || !buildNeeded) {
    for (const id of ['build', 'check:site-types', 'check:editor', 'screens'])
      skip(id, docsOnly ? 'docs only: CI skips them too' : 'no changed file is read by the build (tests, check scripts, agent files)');
  } else {
    doRun('build', 'npm run build', why);
    doRun('check:site-types', 'npm run check:site-types', 'the built package');
    doRun('check:editor', 'npm run check:editor', 'the built editor');
    areas = doubt ? 'all' : areasArg(changed);
    if (areas === 'all') {
      doRun('screens', 'screens --areas none', 'the core set only');
      skip(
        'screens: the units of every area',
        'the change reaches every area; `npm run check:screens` (or `check:fast --screens all`) runs them, and CI does',
      );
    } else doRun('screens', `screens --areas ${areas}`, areas === 'none' ? 'the core set only' : `the core set and ${areas}`);
  }
  return { run, skipped, areas, all: doubt };
}
