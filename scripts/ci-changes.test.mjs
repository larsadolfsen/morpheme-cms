// Tests for scripts/ci-changes.mjs: the docs-only decision and the verdict of the job `check`.
// Run: node --test scripts/ci-changes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDocsOnly, verdict, HEAVY } from './ci-changes.mjs';

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
