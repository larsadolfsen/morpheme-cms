// declarations() finds the .d.mts files in a package and never goes into node_modules or a dot-folder, where a nested
// checkout with its own node_modules would make it slow and lose that checkout's files.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { declarations } from './declarations.mjs';

test('declarations skips node_modules and dot-folders', () => {
  const root = mkdtempSync(join(tmpdir(), 'declarations-'));
  try {
    for (const file of [
      'a.d.mts',
      'a.mjs',
      'lib/b.d.mts',
      'lib/deep/c.d.mts',
      'node_modules/x/d.d.mts',
      '.claude/worktrees/w/e.d.mts',
      '.claude/worktrees/w/node_modules/y/f.d.mts',
    ]) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      writeFileSync(join(root, file), '');
    }
    assert.deepEqual(
      declarations(root).sort(),
      [join(root, 'a.d.mts'), join(root, 'lib', 'b.d.mts'), join(root, 'lib', 'deep', 'c.d.mts')].sort(),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
