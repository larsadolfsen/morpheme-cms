// Tests for scripts/ci-changes.mjs: the docs-only decision and the verdict of the job `check`.
// Run: node --test scripts/ci-changes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isDocsOnly,
  needsStarterDemo,
  isLight,
  checkLevel,
  screensAreas,
  formatScope,
  verdict,
  outcome,
  isSuperseded,
  HEAVY,
  FILTERED,
  LIGHT_SKIPPED,
  SKIPPED_AT,
} from './ci-changes.mjs';

test('docs-only: skills, docs, changeset and root notes', () => {
  assert.equal(isDocsOnly(['.claude/skills/checks/SKILL.md', 'docs/superpowers/plans/x.md', '.changeset/a-b.md', 'CLAUDE.md']), true);
});
test('mixed diff runs everything', () => {
  assert.equal(isDocsOnly(['docs/theme-grid.md', 'src/store.ts']), false);
});
test('code-only diff runs everything', () => {
  assert.equal(isDocsOnly(['src/store.ts', '.changeset/a.md']), false);
});
test('an empty diff runs everything', () => {
  assert.equal(isDocsOnly([]), false);
  assert.equal(isDocsOnly(['', '\n']), false);
});
test('the Release PR runs everything', () => {
  assert.equal(isDocsOnly(['CHANGELOG.md', '.changeset/a.md'], 'changeset-release/main'), false);
  assert.equal(isDocsOnly(['.changeset/a.md'], 'changeset-release/main'), false);
});
test('what a check reads is never skipped', () => {
  for (const p of [
    'release-notes/i18n/en-US/pending/a.json',
    'CHANGELOG.md',
    'package.json',
    '.github/workflows/check.yml',
    'docs/../src/a.ts',
    '.changeset/config.json',
    '.claude/settings.json',
    'sub/README.md',
  ])
    assert.equal(isDocsOnly([p]), false, p);
});
test('a workflow change runs everything even beside docs', () => {
  assert.equal(isDocsOnly(['docs/a.md', '.github/workflows/check.yml']), false);
});

test('.changeset/README.md is a changeset note: docs-only; other files there are not', () => {
  assert.equal(isDocsOnly(['.changeset/README.md']), true);
  assert.equal(isDocsOnly(['.changeset/README.md', 'docs/a.md']), true);
  assert.equal(isDocsOnly(['.changeset/config.json']), false);
  assert.equal(isDocsOnly(['.changeset/sub/a.md']), false);
});
test('a docs pull request that also touches scripts/ runs everything', () => {
  assert.equal(isDocsOnly(['docs/a.md', 'scripts/ci-changes.mjs']), false);
  assert.equal(isDocsOnly(['.claude/skills/checks/SKILL.md', 'scripts/check-language.mjs', '.changeset/a.md']), false);
});

// The full level: every job ran but the smoke test, which its starter shards contain.
const ok = {
  ...Object.fromEntries(['changes', 'static', ...HEAVY].map((n) => [n, { result: 'success' }])),
  'starter-smoke': { result: 'skipped' },
};
const skipHeavy = { ...ok, ...Object.fromEntries(HEAVY.map((n) => [n, { result: 'skipped' }])) };

test('verdict: everything green', () => assert.deepEqual(verdict(ok, false), []));
test('verdict: docs-only with heavy jobs skipped is green', () => assert.deepEqual(verdict(skipHeavy, true), []));
test('verdict: skipped heavy job on a normal pull request is red', () => {
  assert.equal(verdict({ ...ok, demo: { result: 'skipped' } }, false).length, 1);
});
test('verdict: failed or cancelled job is red in both modes', () => {
  for (const r of ['failure', 'cancelled']) {
    assert.equal(verdict({ ...ok, screens: { result: r } }, false).length, 1);
    assert.equal(verdict({ ...skipHeavy, static: { result: r } }, true).length, 1);
    assert.equal(verdict({ ...skipHeavy, starter: { result: r } }, true).length, 1);
  }
});
test('verdict: a heavy job that ran on a docs-only pull request is red (decision disagrees)', () => {
  assert.equal(verdict(ok, true).length, HEAVY.length - 1);
});
test('verdict: static skipped, changes failed or a job missing is red', () => {
  assert.ok(verdict({ ...ok, static: { result: 'skipped' } }, true).length);
  assert.ok(verdict({ ...ok, changes: { result: 'failure' } }, false).length);
  assert.ok(verdict({}, false).length);
});

test('starter/demo: docs-only and a changeset alone are skipped', () => {
  assert.equal(needsStarterDemo(['docs/a.md', '.claude/skills/checks/SKILL.md', 'CLAUDE.md']), false);
  assert.equal(needsStarterDemo(['.changeset/a-b.md']), false);
  assert.equal(needsStarterDemo(['.changeset/a-b.md', '.changeset/config.json']), false);
});
test('starter/demo: release notes and the changelog run (the editor build bundles them)', () => {
  assert.equal(needsStarterDemo(['release-notes/i18n/en-US/pending/a.json', '.changeset/a.md']), true);
  assert.equal(needsStarterDemo(['CHANGELOG.md']), true);
});
test('starter/demo: a src/, theme/, lib/, starter/, demo/, worker/, pages/ or bin/ change runs', () => {
  for (const p of [
    'src/store.ts',
    'theme/ui/Button.tsx',
    'lib/blocks.mjs',
    'starter/src/site/worker.js',
    'demo/src/content/pages/a.md',
    'worker/index.js',
    'pages/index.astro',
    'bin/morpheme.mjs',
    'defaults/texts.ts',
    'site/a.ts',
  ])
    assert.equal(needsStarterDemo([p, '.changeset/a.md']), true, p);
});
test('starter/demo: a script that the jobs use runs', () => {
  for (const p of [
    'scripts/check-starter.mjs',
    'scripts/starter.mjs',
    'scripts/demo-build.mjs',
    'scripts/check-demo.mjs',
    'scripts/editor-screens.mjs',
    'scripts/check-worker.mjs',
    'scripts/fixtures/old-blocks.md',
    'scripts/release-notes-pending.mjs',
    'scripts/some-new-script.mjs',
  ])
    assert.equal(needsStarterDemo([p]), true, p);
});
test('starter/demo: a static-only check script, a test file and another workflow are skipped', () => {
  assert.equal(needsStarterDemo(['scripts/check-language.mjs', 'scripts/web-allowlist.json', 'scripts/check-density.mjs']), false);
  assert.equal(needsStarterDemo(['src/store.test.mjs', 'lib/blocks.test.mjs', 'scripts/starter-gitattributes.test.mjs']), false);
  assert.equal(needsStarterDemo(['.github/workflows/publish.yml', '.github/workflows/cache-fill.yml']), false);
  // The workflow that only fills the caches (cache-fill.yml) builds nothing the starter or the demo job reads.
  assert.equal(needsStarterDemo(['.github/workflows/cache-fill.yml']), false);
  assert.equal(needsStarterDemo(['.github/workflows/daily-full.yml']), false);
  // check.yml and the action it uses run everything.
  assert.equal(needsStarterDemo(['.github/workflows/check.yml']), true);
  assert.equal(needsStarterDemo(['.github/actions/prepare/action.yml']), true);
});
test('starter/demo: package.json, the lock file, wrangler.jsonc and the root config run', () => {
  for (const p of ['package.json', 'package-lock.json', 'wrangler.jsonc', 'astro.mjs', 'tsconfig.types.json', '.gitattributes', 'LICENSE'])
    assert.equal(needsStarterDemo([p]), true, p);
});
test('starter/demo: a workflow or ci-changes change runs everything, even beside docs', () => {
  assert.equal(needsStarterDemo(['docs/a.md', '.github/workflows/check.yml']), true);
  assert.equal(needsStarterDemo(['scripts/ci-changes.mjs']), true);
  assert.equal(needsStarterDemo(['scripts/ci-changes.test.mjs', '.changeset/a.md']), true);
});
test('starter/demo: an empty diff, the Release PR and a path with .. run', () => {
  assert.equal(needsStarterDemo([]), true);
  assert.equal(needsStarterDemo(['', '\n']), true);
  assert.equal(needsStarterDemo(['.changeset/a.md'], 'changeset-release/main'), true);
  assert.equal(needsStarterDemo(['docs/../src/a.ts']), true);
});
test('starter/demo: one path that runs makes the whole pull request run', () => {
  assert.equal(needsStarterDemo(['docs/a.md', 'scripts/check-language.mjs', 'src/a.ts']), true);
});

const skipFiltered = { ...ok, ...Object.fromEntries(FILTERED.map((n) => [n, { result: 'skipped' }])) };
test('verdict: starter and demo skipped by the filter is green, the others must still pass', () => {
  assert.deepEqual(verdict(skipFiltered, false, false), []);
  assert.equal(verdict({ ...skipFiltered, screens: { result: 'skipped' } }, false, false).length, 1);
  assert.equal(verdict({ ...skipFiltered, 'screens-extra': { result: 'failure' } }, false, false).length, 1);
});
test('verdict: starter or demo failed or cancelled is red when the filter let them run or skipped them', () => {
  for (const r of ['failure', 'cancelled']) {
    assert.equal(verdict({ ...ok, starter: { result: r } }, false, true).length, 1);
    assert.equal(verdict({ ...skipFiltered, demo: { result: r } }, false, false).length, 1);
  }
});
test('verdict: starter or demo skipped although the filter said run is red', () => {
  assert.equal(verdict(skipFiltered, false, true).length, FILTERED.length - 1);
  assert.equal(verdict(skipFiltered, false).length, FILTERED.length - 1);
});

// The light check: a pull request into a version line skips screens-extra, demo and starter; main and the Release PR run everything.
const skipLight = { ...ok, ...Object.fromEntries(LIGHT_SKIPPED.map((n) => [n, { result: 'skipped' }])) };
test('light: the base decides, 0.17, 0.18 and 0.19 are light, main is not', () => {
  for (const b of ['0.17', '0.18', '0.19', '0.20']) assert.equal(isLight(b, 'fix/a'), true, b);
  assert.equal(isLight('main', 'merge-0.18-into-main-1'), false);
  assert.equal(isLight('main', 'fix/a'), false);
});
test('light: the Release PR, an empty or unknown base is not light (when in doubt, run)', () => {
  assert.equal(isLight('main', 'changeset-release/main'), false);
  assert.equal(isLight('0.18', 'changeset-release/main'), false);
  for (const b of ['', undefined, '0.18.1', 'release/0.18', 'x0.18', '0.18\nmain']) assert.equal(isLight(b, 'fix/a'), false, String(b));
  assert.equal(isLight(), false);
});
test('light: the feature level skips screens-extra, demo, starter and the smoke test, the screens shards still run', () => {
  assert.deepEqual(LIGHT_SKIPPED.toSorted(), ['demo', 'screens-extra', 'starter', 'starter-smoke']);
  assert.ok(!LIGHT_SKIPPED.includes('screens') && !LIGHT_SKIPPED.includes('static'));
});
test('verdict base 0.18: light with the three jobs skipped is green', () => assert.deepEqual(verdict(skipLight, false, true, true), []));
test('verdict base main: the same skipped jobs are red, everything must pass', () => {
  assert.equal(verdict(skipLight, false, true, false).length, LIGHT_SKIPPED.length - 1);
  assert.deepEqual(verdict(ok, false, true, false), []);
});
test('verdict base 0.18: a light job that ran anyway is red (decision disagrees)', () => {
  assert.equal(verdict(ok, false, true, true).length, LIGHT_SKIPPED.length - 1);
});
test('verdict base 0.18: a skipped screens shard job, a failed or cancelled job is red', () => {
  assert.equal(verdict({ ...skipLight, screens: { result: 'skipped' } }, false, true, true).length, 1);
  for (const r of ['failure', 'cancelled']) {
    assert.equal(verdict({ ...skipLight, screens: { result: r } }, false, true, true).length, 1);
    assert.equal(verdict({ ...skipLight, static: { result: r } }, false, true, true).length, 1);
    assert.equal(verdict({ ...skipLight, demo: { result: r } }, false, true, true).length, 1);
  }
});
test('verdict: docs-only is green on both bases', () => {
  assert.deepEqual(verdict(skipHeavy, true, true, true), []);
  assert.deepEqual(verdict(skipHeavy, true, true, false), []);
});
test('verdict: light and the starter/demo filter together are green', () => {
  assert.deepEqual(verdict(skipLight, false, false, true), []);
});
test('verdict: the Release PR (base main, not light) must have run everything', () => {
  const light = isLight('main', 'changeset-release/main');
  assert.equal(verdict(skipLight, false, true, light).length, LIGHT_SKIPPED.length - 1);
  assert.deepEqual(verdict(ok, false, true, light), []);
});
test('verdict: an empty diff on base 0.18 is light (it still runs the screens shards)', () => {
  assert.equal(isDocsOnly([], 'fix/a'), false);
  assert.deepEqual(verdict(skipLight, false, needsStarterDemo([]), isLight('0.18', 'fix/a')), []);
});
test('verdict: a classification error (light missing or unknown) runs everything', () => {
  // The workflow passes light='' when `changes` printed nothing: the CLI reads only the exact word `true`.
  assert.equal(verdict(skipLight, false, true, '' === 'true').length, LIGHT_SKIPPED.length - 1);
});

// The levels: the base branch gives feature, line or full; anything unknown is full (when in doubt, run).
test('level: feature/** is feature, 0.* lines are line, main is full', () => {
  for (const b of ['feature/css-split', 'feature/a/b']) assert.equal(checkLevel(b, 'fix/a'), 'feature', b);
  for (const b of ['0.17', '0.18', '0.19', '0.20']) assert.equal(checkLevel(b, 'fix/a'), 'line', b);
  assert.equal(checkLevel('main', 'merge-0.18-into-main-1'), 'full');
});
test('level: by head and base: feature into line is full, feature into feature is feature, fix into line is line, line into main is full', () => {
  assert.equal(checkLevel('0.18', 'feature/build-check-speed'), 'full');
  assert.equal(isLight('0.18', 'feature/build-check-speed'), false);
  assert.equal(screensAreas(['src/a.tsx'], '0.18', 'feature/build-check-speed'), 'all');
  assert.equal(formatScope(['src/a.tsx'], '0.18', 'feature/build-check-speed'), 'all');
  assert.equal(checkLevel('feature/css-split', 'feature/css-split-part-2'), 'feature');
  assert.equal(checkLevel('0.18', 'fix/a'), 'line');
  assert.equal(checkLevel('0.18', 'features/a'), 'line');
  assert.equal(checkLevel('main', 'merge-0.18-into-main-1'), 'full');
  assert.equal(checkLevel('0.18'), 'line');
});
test('level: unknown or empty base, the Release PR and odd names fall back to full', () => {
  for (const b of [
    '',
    undefined,
    'feature',
    'feature/',
    'features/a',
    'xfeature/a',
    'feature/a b',
    'feature/a\nmain',
    '0.18.1',
    'release/0.18',
    'develop',
  ])
    assert.equal(checkLevel(b, 'fix/a'), 'full', String(b));
  assert.equal(checkLevel(), 'full');
  assert.equal(checkLevel('feature/a', 'changeset-release/main'), 'full');
  assert.equal(checkLevel('0.18', 'changeset-release/main'), 'full');
});
test('level: feature and line are light (same jobs as today), full is not', () => {
  assert.equal(isLight('feature/css-split', 'fix/a'), true);
  assert.equal(isLight('0.18', 'fix/a'), true);
  assert.equal(isLight('main', 'fix/a'), false);
  assert.equal(isLight('develop', 'fix/a'), false);
});
test('verdict: a pull request into a feature branch runs the light jobs and is green', () => {
  const light = isLight('feature/css-split', 'fix/a');
  assert.deepEqual(verdict(skipLight, false, true, light), []);
  assert.equal(verdict(ok, false, true, light).length, LIGHT_SKIPPED.length - 1);
});

const OLD = 'aaa111';
const NEW = 'bbb222';
const buildCancelled = { ...ok, build: { result: 'cancelled' }, screens: { result: 'skipped' }, demo: { result: 'skipped' } };
const o = (needs, docsOnly = false, run = OLD, current = OLD) => outcome(needs, docsOnly, true, false, run, current).state;

test('outcome: success, failure, and skipped on docs-only do not depend on the heads', () => {
  assert.equal(o(ok), 'success');
  assert.equal(o(ok, false, OLD, NEW), 'success');
  assert.equal(o({ ...ok, screens: { result: 'failure' } }), 'failure');
  assert.equal(o({ ...ok, screens: { result: 'failure' } }, false, OLD, NEW), 'failure');
  assert.equal(o(skipHeavy, true), 'success');
  assert.equal(o(skipHeavy, false), 'failure', 'a job skipped wrongly is a failure');
});
test('outcome: cancelled with a newer head is cancelled (green)', () => {
  assert.equal(o(buildCancelled, false, OLD, NEW), 'cancelled');
  assert.equal(o({ ...ok, static: { result: 'cancelled' } }, false, OLD, NEW), 'cancelled');
});
test('outcome: cancelled on the same head is red (manual cancel, lost runner, timeout)', () => {
  assert.equal(o(buildCancelled, false, OLD, OLD), 'failure');
  assert.equal(o({ ...ok, static: { result: 'cancelled' } }, false, OLD, OLD), 'failure');
});
test('outcome: cancelled and the head lookup failed is red', () => {
  assert.equal(o(buildCancelled, false, OLD, ''), 'failure');
  assert.equal(o(buildCancelled, false, '', NEW), 'failure');
  assert.equal(outcome(buildCancelled, false).state, 'failure', 'no heads given');
});
test('outcome: cancelled with another job failed is red, also with a newer head', () => {
  assert.equal(o({ ...buildCancelled, static: { result: 'failure' } }, false, OLD, NEW), 'failure');
  assert.equal(o({ ...ok, changes: { result: 'cancelled' }, static: { result: 'failure' } }, false, OLD, NEW), 'failure');
});
test('isSuperseded: only two known, different shas', () => {
  assert.equal(isSuperseded(OLD, NEW), true);
  assert.equal(isSuperseded(OLD, OLD), false);
  assert.equal(isSuperseded(OLD, ''), false);
  assert.equal(isSuperseded('', NEW), false);
  assert.equal(isSuperseded(), false);
});
test('screensAreas: the full level and the Release PR run every unit, whatever changed', () => {
  assert.equal(screensAreas(['src/Library.tsx'], 'main', 'merge-0.18-into-main-1'), 'all');
  assert.equal(screensAreas(['src/Library.tsx'], '', ''), 'all');
  assert.equal(screensAreas(['src/Library.tsx'], 'unknown', ''), 'all');
  assert.equal(screensAreas(['src/Library.tsx'], '0.18', 'changeset-release/main'), 'all');
});
test('screensAreas: the feature and line levels run the touched areas', () => {
  assert.equal(screensAreas(['src/Library.tsx', '.changeset/a.md\n'], '0.18', 'x'), 'files,sheets');
  assert.equal(screensAreas(['src/Library.tsx'], 'feature/css-split', 'x'), 'files,sheets');
  assert.equal(screensAreas(['worker/index.js'], '0.18', 'x'), 'none');
});
test('screensAreas: in doubt, everything', () => {
  assert.equal(screensAreas([], '0.18', 'x'), 'all');
  assert.equal(screensAreas(['new-folder/a.js'], '0.18', 'x'), 'all');
  assert.equal(screensAreas(['src/ui.tsx'], '0.18', 'x'), 'all');
  assert.equal(screensAreas(null, '0.18', 'x'), 'all'); // an error inside: caught
});
test('formatScope: the full level and the Release PR check every file', () => {
  assert.equal(formatScope(['src/a.tsx'], 'main', 'merge-0.18-into-main-1'), 'all');
  assert.equal(formatScope(['src/a.tsx'], '', ''), 'all');
  assert.equal(formatScope(['src/a.tsx'], 'unknown', ''), 'all');
  assert.equal(formatScope(['src/a.tsx'], '0.18', 'changeset-release/main'), 'all');
});
test('formatScope: the feature and line levels check the changed files', () => {
  assert.equal(formatScope(['src/a.tsx', '.changeset/a.md\n'], '0.18', 'x'), 'changed');
  assert.equal(formatScope(['src/a.tsx'], 'feature/css-split', 'x'), 'changed');
  assert.equal(formatScope(['docs/a.md'], '0.19', 'x'), 'changed');
});
test('formatScope: a change to Prettier, its packages or this workflow checks every file', () => {
  for (const p of [
    '.prettierrc.json',
    '.prettierignore',
    'starter/.prettierrc.json',
    'prettier.config.mjs',
    '.editorconfig',
    'package.json',
    'package-lock.json',
    '.github/workflows/check.yml',
  ]) {
    assert.equal(formatScope(['src/a.tsx', p], '0.18', 'x'), 'all', p);
  }
});
test('formatScope: in doubt, everything', () => {
  assert.equal(formatScope([], '0.18', 'x'), 'all');
  assert.equal(formatScope(['', '\n'], '0.18', 'x'), 'all');
  assert.equal(formatScope(['../x'], '0.18', 'x'), 'all');
  assert.equal(formatScope(null, '0.18', 'x'), 'all');
});

// The line level (a version line, plan A4): demo and the starter smoke test run, the 4 starter shards and screens-extra are skipped.
const lineOk = { ...ok, starter: { result: 'skipped' }, 'screens-extra': { result: 'skipped' }, 'starter-smoke': { result: 'success' } };
test('line: demo and the starter smoke test run, the starter shards and screens-extra are skipped', () => {
  assert.deepEqual(SKIPPED_AT.line.toSorted(), ['screens-extra', 'starter']);
  assert.deepEqual(verdict(lineOk, false, true, 'line'), []);
});
test('line: the smoke test skipped, or a starter shard that ran, is red', () => {
  assert.equal(verdict({ ...lineOk, 'starter-smoke': { result: 'skipped' } }, false, true, 'line').length, 1);
  assert.equal(verdict({ ...lineOk, starter: { result: 'success' } }, false, true, 'line').length, 1);
  assert.equal(verdict({ ...lineOk, demo: { result: 'skipped' } }, false, true, 'line').length, 1);
});
test('line: a failed or cancelled smoke test is red', () => {
  for (const r of ['failure', 'cancelled'])
    assert.equal(verdict({ ...lineOk, 'starter-smoke': { result: r } }, false, true, 'line').length, 1);
});
test('line: the starter filter skips demo and the smoke test together, and docs-only skips every heavy job', () => {
  const none = { ...lineOk, demo: { result: 'skipped' }, 'starter-smoke': { result: 'skipped' } };
  assert.deepEqual(verdict(none, false, false, 'line'), []);
  assert.deepEqual(verdict(skipHeavy, true, true, 'line'), []);
});
test('full: the smoke test must be skipped (its starter shards ran), and the shards must run', () => {
  assert.deepEqual(verdict(ok, false, true, 'full'), []);
  assert.equal(verdict({ ...ok, 'starter-smoke': { result: 'success' } }, false, true, 'full').length, 1);
  assert.equal(verdict({ ...ok, starter: { result: 'skipped' } }, false, true, 'full').length, 1);
});
test('feature: the smoke test and the shards are skipped, as before', () => {
  assert.deepEqual(verdict(skipLight, false, true, 'feature'), []);
});
test('an unknown level is the full one (when in doubt, run)', () => {
  assert.deepEqual(verdict(ok, false, true, 'nonsense'), []);
  assert.equal(verdict(lineOk, false, true, 'nonsense').length, 3);
});

test('verdict: the release gate is skipped outside the Release PR and green on it; a failed or cancelled gate is red', () => {
  assert.deepEqual(verdict({ ...ok, 'release-gate': { result: 'skipped' } }, false), []);
  assert.deepEqual(verdict({ ...ok, 'release-gate': { result: 'success' } }, false), []);
  for (const r of ['failure', 'cancelled']) assert.equal(verdict({ ...ok, 'release-gate': { result: r } }, false).length, 1, r);
});
