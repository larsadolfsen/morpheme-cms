/**
 * Tests for deleting several files of Filer at once.
 * Exposes test cases for `mediaDeletion`.
 * Depends on `node:test`, `node:assert/strict`, and `./mediaDelete.mjs`.
 */
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { mediaDeletion } from './mediaDelete.mjs';

const files = {
  '/a.jpg': { path: 'public/a.jpg', oid: '1' },
  '/b.jpg': { path: 'public/b.jpg', oid: '2' },
  '/c.pdf': { path: 'public/c.pdf', oid: '3' },
};
const records = [{ path: 'src/data/files/x.json', oid: '9', record: { src: '/b.jpg', categories: ['t'], removed: [] } }];
const how = (used = []) => ({ fileOf: (s) => files[s], isUsed: (s) => used.includes(s), records });

test('files nothing uses are deleted, each with its record', () => {
  const { deleted, kept, changes } = mediaDeletion(['/a.jpg', '/b.jpg'], how());
  assert.deepEqual(deleted, ['/a.jpg', '/b.jpg']);
  assert.deepEqual(kept, []);
  assert.deepEqual(changes, [
    { path: 'public/a.jpg', content: null, oid: '1' },
    { path: 'public/b.jpg', content: null, oid: '2' },
    { path: 'src/data/files/x.json', content: null, oid: '9' },
  ]);
});

test('a file in use is kept and nothing of it is changed', () => {
  const { deleted, kept, changes } = mediaDeletion(['/a.jpg', '/b.jpg', '/c.pdf'], how(['/b.jpg']));
  assert.deepEqual(deleted, ['/a.jpg', '/c.pdf']);
  assert.deepEqual(kept, ['/b.jpg']);
  assert.deepEqual(
    changes.map((c) => c.path),
    ['public/a.jpg', 'public/c.pdf'],
  );
});

test('only files in use delete nothing', () => {
  const { deleted, kept, changes } = mediaDeletion(['/a.jpg'], how(['/a.jpg']));
  assert.deepEqual([deleted, kept, changes], [[], ['/a.jpg'], []]);
});

test('an address that has no file is kept, not deleted', () => {
  assert.deepEqual(mediaDeletion(['/gone.jpg'], how()).kept, ['/gone.jpg']);
});
