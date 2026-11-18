// `npm run check:fast`: the local check to run while working. It runs only what the files changed against the base branch can break
// (scripts/check-fast-plan.mjs decides), prints what it ran and skipped and why, and says that it is NOT the gate: CI and
// `npm run check` before the last push are. Plan docs/superpowers/plans/2026-11-18-build-and-check-speed.md, A11.
//   npm run check:fast                    base branch found by itself (the closest of origin/main, origin/0.*, origin/feature/*)
//   npm run check:fast -- --base <ref>    compare against <ref>
//   npm run check:fast -- --screens none  the quick mode: leave the screens (core set too) to CI and `npm run check:screens`
//   npm run check:fast -- --screens all   run the screens units of every area, not only the core set, when the change reaches every area
//   npm run check:fast -- --dry-run       print the plan and run nothing
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { argv, exit } from 'node:process';
import { planFast, TEST_FOLDERS } from './check-fast-plan.mjs';

const args = argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const DRY = args.includes('--dry-run');
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
const tryGit = (...a) => {
  try {
    return git(...a);
  } catch {
    return '';
  }
};

/** The base: --base, else the remote branch the current one is the fewest commits ahead of. '' when none is found (then everything runs). */
function findBase() {
  if (opt('--base')) return opt('--base');
  const refs = tryGit(
    'for-each-ref',
    '--format=%(refname:short)',
    'refs/remotes/origin/main',
    'refs/remotes/origin/0.*',
    'refs/remotes/origin/feature',
  )
    .split('\n')
    .filter(Boolean);
  const nested = tryGit('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin/feature/').split('\n').filter(Boolean);
  let best = '';
  let bestN = Infinity;
  for (const r of [...refs, ...nested]) {
    const n = Number(tryGit('rev-list', '--count', `${r}..HEAD`));
    if (Number.isFinite(n) && n < bestN) [best, bestN] = [r, n];
  }
  return best;
}

const base = findBase();
let paths = [];
if (base) {
  const mergeBase = tryGit('merge-base', base, 'HEAD');
  const lines = [
    ...(mergeBase ? tryGit('diff', '--name-only', '--no-renames', mergeBase).split('\n') : []), // committed + staged + unstaged against the base
    ...tryGit('ls-files', '--others', '--exclude-standard').split('\n'), // untracked
  ];
  paths = [...new Set(lines.filter(Boolean))];
  if (!mergeBase) paths = [];
}
const tracked = tryGit('ls-files', '--cached', '--others', '--exclude-standard', ...TEST_FOLDERS.map((f) => `${f}/**/*.test.mjs`))
  .split('\n')
  .filter(Boolean);
const plan = planFast(paths, {
  testFiles: tracked,
  readText: (f) => (existsSync(f) ? readFileSync(f, 'utf8') : ''),
  baseKnown: Boolean(base),
});
const wantAll = opt('--screens') === 'all';
if (opt('--screens') === 'none') {
  const i = plan.run.findIndex((r) => r.id === 'screens');
  if (i >= 0)
    (plan.skipped.push({ id: 'screens', why: 'left out by --screens none: CI runs them, and so does `npm run check:screens`' }),
      plan.run.splice(i, 1));
}

console.log(`check:fast against ${base || '(no base branch found: everything runs)'}: ${paths.length} changed files.`);
console.log('\nRuns:');
for (const r of plan.run) console.log(`  + ${r.id}: ${r.why}`);
console.log('\nSkipped:');
for (const s of plan.skipped) console.log(`  - ${s.id}: ${s.why}`);
console.log('  - screens-extra, demo, starter, the full screens: CI runs them (and the other checks again).');
if (DRY) exit(0);

const sh = (cmd, cmdArgs, cwd) => spawnSync(cmd, cmdArgs, { stdio: 'inherit', cwd }).status === 0;
const timings = [];
let failed = '';
for (const r of plan.run) {
  const t = Date.now();
  console.log(`\n=== ${r.id} ===`);
  let ok;
  if (r.id === 'format') {
    const files = plan.all ? ['.'] : paths.filter((p) => existsSync(p));
    ok = files.length === 0 || sh('npx', ['prettier', '--check', '--ignore-unknown', ...files]);
  } else if (r.id === 'unit tests') ok = sh('node', r.command.split(' ').slice(1));
  else if (r.id === 'screens') {
    const areas = wantAll && plan.areas === 'all' ? 'all' : plan.areas === 'all' ? 'none' : plan.areas;
    ok = sh('node', ['../../../bin/morpheme.mjs', 'check:screens', '--shard', '1/1', '--areas', areas], '.morpheme/demo/site');
  } else ok = sh('npm', r.command.replace(/^npm /, '').split(' '));
  timings.push(`${r.id} ${Math.round((Date.now() - t) / 1000)} s`);
  if (!ok) {
    failed = r.id;
    break;
  }
}
console.log(`\nTimes: ${timings.join(', ')}`);
if (failed) {
  console.log(`\nFAILED: ${failed}.`);
  exit(1);
}
console.log('\ncheck:fast passed. It is NOT the gate: CI runs the full check, and `npm run check` must be green before the last push.');
