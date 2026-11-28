// `Only.or`: a field is in use when its `only` holds, or when the `only` it names in `or` holds instead (src/check.ts, inUse). Run: node --test src/onlyOr.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { build } from 'esbuild';

const dir = mkdtempSync(join(tmpdir(), 'only-or-'));
const stub = join(dir, 'stub.mjs');
writeFileSync(stub, 'export default {}; export const config = {}; export const texts = {}; export const appTexts = {};');
const outfile = join(dir, 'check.mjs');
await build({
  entryPoints: [fileURLToPath(new URL('./check.ts', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile,
  logLevel: 'silent',
  alias: { '@site/config': stub, '@site/texts': stub },
});
const { inUse } = await import(pathToFileURL(outfile).href);

const fields = [
  { name: 'a', type: 'text' },
  { name: 'b', type: 'text' },
  { name: 'c', type: 'text' },
];
const target = (only) => ({ name: 't', type: 'text', only });

test('without `or`, only the first condition counts', () => {
  const f = target({ field: 'a', is: ['x'] });
  assert.equal(inUse(f, fields, { a: 'x' }), true);
  assert.equal(inUse(f, fields, { a: 'y', b: 'z' }), false);
});

test('with `or`, either condition puts the field in use', () => {
  const f = target({ field: 'a', is: ['x'], or: { field: 'b', is: ['z'] } });
  assert.equal(inUse(f, fields, { a: 'x', b: 'n' }), true);
  assert.equal(inUse(f, fields, { a: 'n', b: 'z' }), true);
  assert.equal(inUse(f, fields, { a: 'n', b: 'n' }), false);
});

test('`and` binds tighter than `or`, and `or` chains', () => {
  const f = target({
    field: 'a',
    is: ['x'],
    or: { field: 'b', is: ['y'], and: { field: 'c', is: [''], not: true }, or: { field: 'c', is: ['last'] } },
  });
  assert.equal(inUse(f, fields, { a: 'n', b: 'y', c: 'set' }), true);
  assert.equal(inUse(f, fields, { a: 'n', b: 'y', c: '' }), false);
  assert.equal(inUse(f, fields, { a: 'n', b: 'n', c: 'last' }), true);
});
