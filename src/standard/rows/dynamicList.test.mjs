// "Dynamic list" (B9): the switch over `Rows from` stores nothing of its own, so a list stored before it (`from: 'posts'`) is On with its list chosen,
// and nothing new is written to a file. The switch on a screen is checked by scripts/screens/lists.mjs (checkDynamicSwitch).
// Run: node --test src/standard/rows/dynamicList.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { inlineRowsOf, sourceOf } from './rows.mjs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('a stored list is On: its `from` still reads its list, and no other key is needed', () => {
  assert.equal(sourceOf('posts'), 'posts');
  assert.equal(sourceOf(''), undefined);
  const items = [{ title: 'One', tags: [] }];
  assert.deepEqual(
    inlineRowsOf({ from: 'posts' }, items)?.rows.map((r) => r.title),
    ['One'],
  );
  assert.equal(inlineRowsOf({}, items), undefined);
});

test('the switch is over `from`, and `Rows from` shows only while it has a list and offers no "None"', () => {
  const fields = read('./fields.ts');
  assert.match(fields, /name: 'dynamic'[^}]*switchFor: 'from'/);
  assert.match(fields, /name: 'from'[^}]*required: true, only: dynamic/);
});

test('the switch is never saved and the form turns it into a list or none', () => {
  assert.match(read('../../check.ts'), /if \(f\?\.switchFor\) continue;/);
  const form = read('../../fields.tsx');
  assert.match(form, /on \? first : ''/);
  assert.match(read('../../MarkdownEditor.tsx'), /dynamicNames = \['dynamic', 'from'/);
});

test('typed rows stay in use while no list is picked, though `from` itself is hidden then (loose)', () => {
  assert.match(
    readFileSync(new URL('./fields.ts', import.meta.url), 'utf8'),
    /export const typed: Field\['only'\] = \{ field: 'from', is: \[''\], loose: true \}/,
  );
});

test('typed rows are set aside, not thrown away, while a list is picked (the live sheet writes `clean` on every change)', async () => {
  const { build } = await import('esbuild');
  const dir = mkdtempSync(join(tmpdir(), 'dynamic-list-'));
  const out = join(dir, 'check.mjs');
  const stub = join(dir, 'stub.mjs');
  writeFileSync(stub, 'export default {}; export const config = {}; export const texts = {}; export const appTexts = {};');
  await build({
    entryPoints: [fileURLToPath(new URL('../../check.ts', import.meta.url))],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: out,
    logLevel: 'silent',
    alias: { '@site/config': stub, '@site/texts': stub },
  });
  const { clean } = await import(pathToFileURL(out).href);
  const text = { name: 'title', type: 'text' };
  const fields = [
    { name: 'from', type: 'text', required: true },
    { name: 'items', type: 'list', fields: [text], keep: true, only: { field: 'from', is: [''], loose: true } },
  ];
  const items = [{ title: 'Scheduled' }];
  assert.deepEqual(clean(fields, { from: 'posts', items }).items, items);
  assert.deepEqual(clean(fields, { from: '', items }).items, items);
  assert.equal(clean([{ ...fields[1], keep: false }], { from: 'posts', items }).items, undefined);
  for (const type of ['list', 'expand']) assert.match(read(`../${type}/index.tsx`), /only: typed,\s*keep: true,/);
});
