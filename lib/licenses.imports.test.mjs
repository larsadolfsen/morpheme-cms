// Tests that importsIn skips @app/self and site aliases
// Run with: node --test lib/licenses.imports.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importsIn } from './licenses.mjs';

const keysOf = (code) => {
  const folder = mkdtempSync(join(tmpdir(), 'imports-'));
  try {
    writeFileSync(join(folder, 'a.ts'), code);
    return [...importsIn(folder).keys()].sort();
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
};

test("skips an app's @app/self", () => {
  const code = `import self from '@app/self';\nimport { animate } from 'motion';\n`;
  assert.deepEqual(keysOf(code), ['motion']);
});

test('lists another @app/ import as a package', () => {
  const code = `import x from '@app/other';\n`;
  assert.deepEqual(keysOf(code), ['@app/other']);
});

test('skips the site aliases', () => {
  const code = `import t from '@theme/x';\nimport s from '@site/y';\n`;
  assert.deepEqual(keysOf(code), []);
});
