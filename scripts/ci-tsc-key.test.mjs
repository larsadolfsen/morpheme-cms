// Tests for scripts/ci-tsc-key.mjs: the key follows TypeScript's version, the options and the lock file, and nothing else.
// Run: node --test scripts/ci-tsc-key.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tscKey, TSC_INPUTS } from './ci-tsc-key.mjs';

function repo(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'tsckey-'));
  for (const path of TSC_INPUTS) writeFileSync(join(root, path), files[path] ?? `{"${path}":1}`);
  mkdirSync(join(root, 'node_modules/typescript'), { recursive: true });
  writeFileSync(join(root, 'node_modules/typescript/package.json'), '{"version":"7.0.2"}');
  writeFileSync(join(root, 'a.mjs'), 'export {}');
  return root;
}

test('the same inputs give the same key; the key is 64 hex characters', () => {
  assert.match(tscKey(repo()), /^[0-9a-f]{64}$/);
  assert.equal(tscKey(repo()), tscKey(repo()));
});

test('a change to the compiler options, the lock file or package.json gives another key', () => {
  const base = tscKey(repo());
  for (const path of TSC_INPUTS) assert.notEqual(tscKey(repo({ [path]: '{"changed":true}' })), base, path);
});

test('the TypeScript version and the Node major give another key; a Node patch does not', () => {
  const root = repo();
  const base = tscKey(root, { node: '24.1.0' });
  assert.notEqual(tscKey(root, { node: '25.0.0' }), base);
  assert.notEqual(tscKey(root, { node: '24.1.0', typescript: '7.1.0' }), base);
  assert.equal(tscKey(root, { node: '24.9.9' }), base);
});

test('a source file is not an input: tsc finds a changed source by its own hashes in the info', () => {
  const root = repo();
  const base = tscKey(root);
  writeFileSync(join(root, 'a.mjs'), 'export const x = 1');
  assert.equal(tscKey(root), base);
});
