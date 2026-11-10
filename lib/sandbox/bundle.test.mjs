// Tests for lib/sandbox/bundle.mjs: the import allow-list and the shape of the bundle, on small apps in fixtures/.
// Exposes nothing. Depends on node:test and bundleEntry.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, symlink, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ALLOWED_CORE, bundleEntry } from './bundle.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const HOOK = 'hooks/page-colors.ts';
const bundle = (name, id = 'demo') => bundleEntry(path.join(fixtures, name), HOOK, id);

test('ALLOWED_CORE lists the three core modules and is frozen', () => {
  assert.deepEqual([...ALLOWED_CORE], ['@morphemecms/cms/lib/colors', '@morphemecms/cms/lib/dynamic-colors', '@morphemecms/cms/lib/hooks']);
  assert.ok(Object.isFrozen(ALLOWED_CORE));
});

test('own file: a relative import inside the app folder bundles', async () => {
  const r = await bundle('bundle-own');
  assert.equal(r.ok, true);
  assert.equal(typeof r.code, 'string');
  assert.match(r.code, /export\s*\{[^}]*as default|export default/);
  assert.match(r.code, /'ok'|"ok"/);
});

test('allowed core: dynamic-colors bundles, with its own imports resolved', async () => {
  const r = await bundle('bundle-core');
  assert.equal(r.ok, true, r.message);
  assert.match(r.code, /export\s*\{[^}]*as default|export default/);
});

test('allowed core: colors and hooks bundle, also with a file extension', async () => {
  const r = await bundle('bundle-ts-ext');
  assert.equal(r.ok, true, r.message);
});

test('self: @app/self is { id } and the code contains the app id', async () => {
  const r = await bundle('bundle-self', 'my-app');
  assert.equal(r.ok, true, r.message);
  assert.match(r.code, /my-app/);
  assert.match(r.code, /export default|export\s*\{[^}]*as default/);
});

test('self: an id with quotes is written as a safe string', async () => {
  const r = await bundle('bundle-self', 'a"b');
  assert.equal(r.ok, true, r.message);
  assert.ok(r.code.includes('a"b'));
});

test('Node builtin: node:fs is refused by name', async () => {
  const r = await bundle('bundle-node');
  assert.equal(r.ok, false);
  assert.match(r.message, /node:fs/);
});

test('bare builtin: fs is refused', async () => {
  const r = await bundle('bundle-fs');
  assert.equal(r.ok, false);
  assert.match(r.message, /"fs"|'fs'|\bfs\b/);
});

test('other package: lodash is refused by name', async () => {
  const r = await bundle('bundle-lodash');
  assert.equal(r.ok, false);
  assert.match(r.message, /lodash/);
});

test('outside folder: ../../secret is refused', async () => {
  const r = await bundle('bundle-outside');
  assert.equal(r.ok, false);
  assert.match(r.message, /secret/);
});

test('outside folder: a symlink that points out of the folder is refused', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'bundle-link-'));
  try {
    await mkdir(path.join(dir, 'app/hooks'), { recursive: true });
    await writeFile(path.join(dir, 'outside.ts'), "export default 'secret';\n");
    await symlink(path.join(dir, 'outside.ts'), path.join(dir, 'app/hooks/linked.ts'));
    await writeFile(path.join(dir, 'app/hooks/page-colors.ts'), "import s from './linked';\nexport default () => s;\n");
    const r = await bundleEntry(path.join(dir, 'app'), HOOK, 'demo');
    assert.equal(r.ok, false);
    assert.match(r.message, /linked/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('other core: a core path that is not allowed is refused by name', async () => {
  const r = await bundle('bundle-othercore');
  assert.equal(r.ok, false);
  assert.match(r.message, /@morphemecms\/cms\/site\/apps/);
});

test('no app code runs: an entry that throws at the top level still bundles', async () => {
  const r = await bundle('bundle-throws');
  assert.equal(r.ok, true, r.message);
});

test('a missing entry gives ok: false and does not throw', async () => {
  const r = await bundleEntry(path.join(fixtures, 'bundle-own'), 'hooks/missing.ts', 'demo');
  assert.equal(r.ok, false);
  assert.equal(typeof r.message, 'string');
});

test('an entry outside the app folder is refused', async () => {
  const r = await bundleEntry(path.join(fixtures, 'bundle-own'), '../bundle-node/hooks/page-colors.ts', 'app_x');
  assert.equal(r.ok, false);
});
