/**
 * Tests for deleting several pages or posts at once.
 * Exposes test cases for `bulkDeletion` and `togglePath`.
 * Depends on `node:test`, `node:assert/strict`, and `./bulkDelete.mjs`.
 */
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { bulkDeletion, togglePath } from './bulkDelete.mjs';

const a = { path: 'src/content/pages/a.md', oid: '1' };
const b = { path: 'src/content/pages/b.md', oid: '2' };
const c = { path: 'src/content/pages/c.md', oid: '3' };

test('every file that is free becomes one delete change', () => {
  const { changes, kept } = bulkDeletion([a, b], () => null);
  assert.deepEqual(changes, [
    { path: a.path, content: null, oid: '1' },
    { path: b.path, content: null, oid: '2' },
  ]);
  assert.deepEqual(kept, []);
});

test('a file something uses is kept, with its reason, and the rest is deleted', () => {
  const { changes, kept } = bulkDeletion([a, b, c], (f) => (f === b ? 'Used by the menu' : null));
  assert.deepEqual(
    changes.map((x) => x.path),
    [a.path, c.path],
  );
  assert.deepEqual(kept, [{ file: b, reason: 'Used by the menu' }]);
});

test('nothing selected gives no changes', () => {
  assert.deepEqual(
    bulkDeletion([], () => null),
    { changes: [], kept: [] },
  );
});

test('togglePath adds and removes', () => {
  assert.deepEqual(togglePath([], 'x'), ['x']);
  assert.deepEqual(togglePath(['x', 'y'], 'x'), ['y']);
});
