// Tests of materialFiles, materialModule and materialSsrModule (site/materialSymbols.mjs): the Material Symbols files as one module.
// Run with `node --test site/materialSymbols.test.mjs`.
import { strict as assert } from 'node:assert';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { materialFiles, materialModule, materialSsrModule } from './materialSymbols.mjs';

const PREFIX = '/node_modules/@material-symbols/svg-400/outlined/';
const A = '<svg viewBox="0 0 1 1"><path d="A"/></svg>';
const B = '<svg viewBox="0 0 2 2"><path d="B"/></svg>';

const folder = mkdtempSync(join(tmpdir(), 'material-'));
const dir = join(folder, 'node_modules/@material-symbols/svg-400/outlined');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'b.svg'), B);
writeFileSync(join(dir, 'a.svg'), A);
writeFileSync(join(dir, 'c.txt'), 'not an icon');

test('one key per svg file, sorted, with the file text', () => {
  assert.deepEqual(materialFiles(dir), { [`${PREFIX}a.svg`]: A, [`${PREFIX}b.svg`]: B });
  assert.deepEqual(Object.keys(materialFiles(dir)), [`${PREFIX}a.svg`, `${PREFIX}b.svg`]);
});

test('a file that is not an svg has no key', () => {
  assert.ok(!Object.keys(materialFiles(dir)).some((k) => k.endsWith('c.txt')));
});

test('the module source parses to the same object as materialFiles', () => {
  const cwd = process.cwd();
  process.chdir(folder);
  try {
    const code = materialModule();
    assert.ok(code.startsWith('export default '));
    assert.deepEqual(JSON.parse(code.slice('export default '.length, -1)), materialFiles(dir));
  } finally {
    process.chdir(cwd);
  }
});

test('without ssr the SSR module is an empty object', () => {
  assert.equal(materialSsrModule(false), 'export default {};');
});
