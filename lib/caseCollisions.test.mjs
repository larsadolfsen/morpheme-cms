// Tests for lib/caseCollisions.mjs: which paths collide by case, and caseCollisionProblems on a folder,
// skipping node_modules and taking a dir with the system's separators (Windows).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { caseCollisions, caseCollisionProblems } from './caseCollisions.mjs';

test('caseCollisions detects Dialog collision', () => {
  const input = ['theme/ui/Dialog.tsx', 'theme/ui/dialog.ts', 'theme/ui/Button.tsx'];
  const expected = [['theme/ui/Dialog.tsx', 'theme/ui/dialog.ts']];
  assert.deepEqual(caseCollisions(input), expected);
});

test('caseCollisions no collision for different stems', () => {
  const input = ['src/Redirects.tsx', 'src/redirectData.ts'];
  assert.deepEqual(caseCollisions(input), []);
});

test('caseCollisions no collision for identical stems', () => {
  const input = ['a.ts', 'a.tsx'];
  assert.deepEqual(caseCollisions(input), []);
});

test('caseCollisions detects mixed collision', () => {
  const input = ['x/A.ts', 'x/a.tsx', 'x/a.css'];
  const expected = [['x/A.ts', 'x/a.css', 'x/a.tsx']];
  assert.deepEqual(caseCollisions(input), expected);
});

test('caseCollisions no collision for different folders', () => {
  const input = ['one/A.ts', 'two/a.ts'];
  assert.deepEqual(caseCollisions(input), []);
});

test('caseCollisionProblems checks folder and skips node_modules', () => {
  const root = mkdtempSync(join(tmpdir(), 'case-'));
  try {
    const base = join(root, 'pkg');
    mkdirSync(join(base, 'ui'), { recursive: true });
    writeFileSync(join(base, 'ui', 'Dialog.tsx'), '');
    writeFileSync(join(base, 'ui', 'dialog.ts'), '');
    writeFileSync(join(base, 'ui', 'Button.tsx'), '');

    const nm = join(base, 'node_modules', 'x');
    mkdirSync(nm, { recursive: true });
    writeFileSync(join(nm, 'A.js'), '');
    writeFileSync(join(nm, 'a.ts'), '');

    const problems = caseCollisionProblems(root, ['pkg', 'missing']);
    assert.equal(problems.length, 1);
    assert.ok(problems[0].startsWith('pkg/ui/Dialog.tsx, pkg/ui/dialog.ts: '));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('caseCollisionProblems takes a dir with the system separator', () => {
  const root = mkdtempSync(join(tmpdir(), 'case-'));
  try {
    const base = join(root, 'pkg');
    mkdirSync(join(base, 'ui'), { recursive: true });
    writeFileSync(join(base, 'ui', 'Dialog.tsx'), '');
    writeFileSync(join(base, 'ui', 'dialog.ts'), '');
    writeFileSync(join(base, 'ui', 'Button.tsx'), '');

    const problems = caseCollisionProblems(root, [join('pkg', 'ui')]);
    assert.equal(problems.length, 1);
    assert.ok(problems[0].startsWith('pkg/ui/Dialog.tsx, pkg/ui/dialog.ts: '));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
