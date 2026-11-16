// Tests for scripts/ci-changes.mjs: the docs-only decision and the verdict of the job `check`.
// Run: node --test scripts/ci-changes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDocsOnly, needsStarterDemo, verdict, HEAVY, FILTERED } from './ci-changes.mjs';

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

const ok = Object.fromEntries(['changes', 'static', ...HEAVY].map((n) => [n, { result: 'success' }]));
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
  assert.equal(verdict(ok, true).length, HEAVY.length);
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
  assert.equal(needsStarterDemo(['.github/workflows/publish.yml', 'staging-watcher/index.js']), false);
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
  assert.equal(verdict(skipFiltered, false, true).length, FILTERED.length);
  assert.equal(verdict(skipFiltered, false).length, FILTERED.length);
});
