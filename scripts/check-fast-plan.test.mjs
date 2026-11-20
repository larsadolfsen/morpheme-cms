// Tests for scripts/check-fast-plan.mjs: what `npm run check:fast` runs for a change.
// Run: node --test scripts/check-fast-plan.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planFast, selectTests } from './check-fast-plan.mjs';

const testFiles = ['lib/a.test.mjs', 'lib/b.test.mjs', 'theme/t.test.mjs', 'scripts/s.test.mjs', 'worker/w.test.mjs'];
const texts = { 'scripts/s.test.mjs': "reads('docs/app-contract.md')" };
const readText = (f) => texts[f] ?? '';
const plan = (paths, env = {}) => planFast(paths, { testFiles, readText, ...env });
const ids = (p) => p.run.map((r) => r.id);
const skipped = (p) => p.skipped.map((r) => r.id);

test('a CSS file in the theme selects the theme checks, the theme tests, the build and every area (core set locally)', () => {
  const p = plan(['theme/styles/ui.css']);
  for (const id of [
    'format',
    'check:language',
    'check:css-tokens',
    'check:density',
    'check:web',
    'check:colors',
    'check:css-values',
    'unit tests',
    'build',
    'check:editor',
    'screens',
  ])
    assert.ok(ids(p).includes(id), id);
  assert.equal(p.areas, 'all');
  assert.deepEqual(p.run.find((r) => r.id === 'unit tests').command, 'node --test theme/t.test.mjs');
  assert.ok(skipped(p).includes('check:types'), 'tsc does not read CSS');
  assert.ok(skipped(p).includes('screens: the units of every area'), 'the narrowing is named, never silent');
});

test('a docs file selects almost nothing', () => {
  const p = plan(['docs/superpowers/plans/x.md']);
  assert.deepEqual(ids(p), ['format', 'check:language', 'check:token-names', 'check:density']);
  for (const id of ['build', 'check:editor', 'screens', 'check:types', 'unit tests']) assert.ok(skipped(p).includes(id), id);
});

test('a doc that a test names selects that test', () => {
  const p = plan(['docs/app-contract.md']);
  assert.equal(p.run.find((r) => r.id === 'unit tests').command, 'node --test scripts/s.test.mjs');
});

test('a changeset or an agent skill runs nothing but format, language and the token-name scan', () => {
  assert.deepEqual(ids(plan(['.changeset/a.md', '.claude/skills/checks/SKILL.md'])), ['format', 'check:language', 'check:token-names']);
});

test('an unknown path selects everything', () => {
  const p = plan(['mystery/thing.xyz']);
  for (const id of ['check:phosphor', 'check:web', 'check:types', 'build', 'check:editor', 'screens']) assert.ok(ids(p).includes(id), id);
  assert.equal(p.areas, 'all');
});

test('in doubt (no base, no paths, a .. path) every check runs and npm test runs whole', () => {
  for (const p of [plan(['docs/a.md'], { baseKnown: false }), plan([]), plan(['../x'])]) {
    assert.equal(p.all, true);
    assert.deepEqual(
      p.skipped.filter((s) => !s.id.startsWith('screens:')),
      [],
    );
    assert.ok(ids(p).includes('npm test'));
    assert.ok(ids(p).includes('build'));
  }
});

test('a package or config file runs npm test whole and the types', () => {
  for (const f of ['package.json', 'package-lock.json', 'tsconfig.types.json']) {
    const p = plan([f]);
    assert.ok(ids(p).includes('npm test'), f);
    assert.ok(ids(p).includes('check:types'), f);
  }
});

test('a change in one area selects that area and the core set', () => {
  const p = plan(['src/Library.tsx']);
  assert.equal(p.areas, 'files,sheets');
  assert.ok(p.run.some((r) => r.id === 'screens' && r.command === 'screens --areas files,sheets'));
  assert.ok(ids(p).includes('check:types') === false, 'a .tsx file is not in the tsc include');
});

test('a Worker-only or test-only change still gets its tests, and the build only when the build reads it', () => {
  const w = plan(['worker/index.js']);
  assert.ok(ids(w).includes('unit tests') && ids(w).includes('build'));
  const t = plan(['lib/a.test.mjs']);
  assert.equal(t.run.find((r) => r.id === 'unit tests').command, 'node --test lib/a.test.mjs');
  assert.ok(skipped(t).includes('build'));
});

test('selectTests: a source file selects the tests of its folder, a changed test itself, and none for a file nothing names', () => {
  assert.deepEqual(selectTests(['lib/x.mjs'], testFiles, readText).files, ['lib/a.test.mjs', 'lib/b.test.mjs']);
  assert.deepEqual(selectTests(['scripts/s.test.mjs'], testFiles, readText).files, ['scripts/s.test.mjs']);
  assert.deepEqual(selectTests(['README.md'], testFiles, readText), { all: false, files: [] });
});
