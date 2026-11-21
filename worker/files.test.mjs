// Tests of the Worker's files in R2 (worker/files.js): each object is written once in a request, also when R2 is slow.
// Run: node --test worker/files.test.mjs from the repository root. Depends on esbuild.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blobId, treeId } from '../lib/git.mjs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// files.js bundled with a stand-in for the site's config (`@site/config`), as wrangler builds it with its alias.
const dir = mkdtempSync(join(tmpdir(), 'files-test-'));
writeFileSync(join(dir, 'config.mjs'), "export const config = { repo: { owner: 'owner', name: 'site', branch: 'main' } };");
await build({
  entryPoints: [fileURLToPath(new URL('./files.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: join(dir, 'files.mjs'),
  alias: { '@site/config': join(dir, 'config.mjs') },
  logLevel: 'silent',
});
const { filesOf } = await import(pathToFileURL(join(dir, 'files.mjs')).href);
const FILE_MODE = 0o100644;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// R2 in memory whose writes take a while, so a write is still on its way when the next check is made.
function slowBucket(delay) {
  const objects = new Map();
  const puts = new Map();
  return {
    puts,
    get: async (key) => (await wait(delay), objects.has(key) ? { arrayBuffer: async () => objects.get(key).slice().buffer } : null),
    head: async (key) => (await wait(1), objects.has(key) ? {} : null),
    put: async (key, value) => {
      puts.set(key, (puts.get(key) ?? 0) + 1);
      await wait(delay);
      objects.set(key, typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value));
    },
  };
}

test('a save writes each tree to R2 once, with a slow R2', async () => {
  const text = 'Hello\n';
  const blob = await blobId(new TextEncoder().encode(text));
  const entries = [{ name: 'a.txt', oid: blob, mode: FILE_MODE, type: 'blob', binary: false }];
  const root = await treeId(entries);
  const realFetch = globalThis.fetch;
  // GitHub: the folder's entries, and a commit that saves the same text (so the tree stays the one it was).
  globalThis.fetch = async (_url, init) => {
    const { query } = JSON.parse(init.body);
    const data = query.includes('createCommitOnBranch')
      ? { createCommitOnBranch: { commit: { oid: 'c2', tree: { oid: root }, f0: { oid: blob, object: { isBinary: false } } } } }
      : { repository: { t0: { entries: entries.map((e) => ({ ...e, object: { isBinary: false } })) } } };
    return Response.json({ data });
  };
  try {
    const bucket = slowBucket(50);
    const pending = [];
    const files = filesOf({ FILES: bucket }, 'token', { waitUntil: (p) => pending.push(p) });
    await files.save({ commit: 'c1', tree: root }, 'Save', [{ path: 'a.txt', contents: Buffer.from(text).toString('base64') }]);
    await files.finish('test');
    await Promise.all(pending);
    const trees = [...bucket.puts].filter(([key]) => key.includes('/tree/'));
    assert.ok(trees.length > 0, 'the tree was not written');
    for (const [key, n] of trees) assert.equal(n, 1, `${key} was written ${n} times`);
  } finally {
    globalThis.fetch = realFetch;
  }
});
