// Tests for scripts/ci-build-key.mjs: which tracked files are inputs of the CI build, and that the key follows them and nothing else.
// Run: node --test scripts/ci-build-key.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildKey, isBuildInput, NOT_INPUTS } from './ci-build-key.mjs';

test('docs, agent files, changesets and the staging watcher are not inputs; everything else is', () => {
  for (const path of ['docs/a.md', '.claude/skills/x/SKILL.md', '.agents/a', '.changeset/a.md']) {
    assert.equal(isBuildInput(path), false, path);
  }
  for (const path of [
    'src/a.tsx',
    'theme/styles/a.css',
    'lib/a.mjs',
    'package.json',
    'package-lock.json',
    'demo/src/a.md',
    'starter/a',
    'scripts/a.mjs',
  ]) {
    assert.equal(isBuildInput(path), true, path);
  }
  // A test file, the workflow and the root documents count: when in doubt a file is an input.
  for (const path of ['lib/a.test.mjs', '.github/workflows/check.yml', 'README.md', 'CLAUDE.md'])
    assert.equal(isBuildInput(path), true, path);
  assert.ok(NOT_INPUTS.every((p) => p.endsWith('/')));
});

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'build-key-'));
  const git = (...args) =>
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], { cwd: dir, stdio: 'pipe' });
  git('init', '-q');
  mkdirSync(join(dir, 'src'));
  mkdirSync(join(dir, 'docs'));
  writeFileSync(join(dir, 'src/a.ts'), 'a');
  writeFileSync(join(dir, 'docs/n.md'), 'note');
  git('add', '-A');
  git('commit', '-q', '-m', 'one');
  return { dir, git };
}

test('the key follows the inputs and nothing else', () => {
  const { dir, git } = repo();
  const base = buildKey(dir, '24.1.0');
  assert.match(base, /^[0-9a-f]{64}$/);
  // A docs file, and a file time, do not change it.
  writeFileSync(join(dir, 'docs/n.md'), 'another note');
  writeFileSync(join(dir, 'docs/new.md'), 'new');
  git('add', '-A');
  utimesSync(join(dir, 'src/a.ts'), new Date('2001-01-01'), new Date('2002-02-02'));
  assert.equal(buildKey(dir, '24.1.0'), base);
  // The same Node major gives the same key; another major does not.
  assert.equal(buildKey(dir, '24.9.9'), base);
  assert.notEqual(buildKey(dir, '22.1.0'), base);
  // A changed input, and a new one, do.
  writeFileSync(join(dir, 'src/a.ts'), 'b');
  const changed = buildKey(dir, '24.1.0');
  assert.notEqual(changed, base);
  writeFileSync(join(dir, 'src/b.ts'), 'c');
  git('add', '-A');
  assert.notEqual(buildKey(dir, '24.1.0'), changed);
});

test('a file that is not tracked is not an input', () => {
  const { dir } = repo();
  const base = buildKey(dir, '24.1.0');
  writeFileSync(join(dir, 'src/untracked.ts'), 'x');
  assert.equal(buildKey(dir, '24.1.0'), base);
});
